# 优化模式

`performance-optimization` skill 的 Step 3 中点名的那些 anti-pattern 的可落地修复。skill 给出规则和要留意的特征；本文件给出一个具体实现。等 Step 2 识别出瓶颈之后，再打开你需要的小节 —— 它不是拿来从头读到尾的。

checklists、测量命令、TTFB 诊断以及缓存的读/写策略见 `../../../references/performance-checklist.md`。

## N+1 查询（后端）

```typescript
// BAD: N+1 — one query per task for the owner
const tasks = await db.tasks.findMany();
for (const task of tasks) {
  task.owner = await db.users.findUnique({ where: { id: task.ownerId } });
}

// GOOD: Single query with join/include
const tasks = await db.tasks.findMany({
  include: { owner: true },
});
```

## 无界数据获取

```typescript
// BAD: Fetching all records
const allTasks = await db.tasks.findMany();

// GOOD: Paginated with limits
const tasks = await db.tasks.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' },
});
```

## 无视自身索引的查询

"加个索引"是猜测。查询计划才是测量：

```sql
EXPLAIN ANALYZE
SELECT id, title FROM tasks
WHERE owner_id = 42 ORDER BY created_at DESC LIMIT 20;
```

输出里的三样东西决定怎么修：

| 你看到什么 | 它意味着什么 |
|---|---|
| 在你预期有索引的大表上出现 `Seq Scan` | 这个谓词没有可用的索引 |
| 估算的 `rows=` 与实际相差一个数量级 | 统计信息过期；planner 基于错误信息做选择 |
| scan 之上有一个 `Sort` 节点 | 索引覆盖了过滤条件，但没覆盖 `ORDER BY` |

按**查询的形状**建索引，而不是孤立地看某一列。在复合索引里，等值列在前，范围或排序列在后：

```sql
CREATE INDEX idx_tasks_owner_created ON tasks (owner_id, created_at DESC);
```

**索引帮不上忙的情况：**

| 情形 | 原因 |
|---|---|
| 低选择性，查询占主导的值（一个 95% 都是 `active` 的 `status` 列，且过滤条件就是 `active`） | 顺序扫描确实更便宜，planner 会忽略索引。反过来，过滤罕见值时结论相反，此时 partial index 非常合适 |
| 前导通配符（`LIKE '%term'`） | B-tree 没有前缀就无法 seek；需要 trigram 或 full-text |
| 列上有函数（`WHERE lower(email) = ?`） | 普通列索引不可用；改为对该表达式建索引 |
| 写多的表 | 每个索引都是对每次 `INSERT`/`UPDATE` 的抽税；要测写入成本，不能只看读取收益 |

之后重跑一次 `EXPLAIN ANALYZE`。一个没改变执行计划的索引应当 revert（Step 4），而且它并不免费：每次写入它都在付出成本。

## 连接池耗尽

Signature 很有辨识度：**所有** endpoints 同时变慢，慢的时间花在等连接而不是执行上，数据库则报告大量空闲 sessions。

```typescript
// BAD: a pool per request or per module — under serverless this multiplies
// by instance count and exhausts the database's connection limit
// GOOD: one pool per process, sized against the database's ceiling
const pool = new Pool({
  max: 10,                        // instances × max must stay under max_connections
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000, // fail fast instead of queueing forever
});
```

**更大不等于更快。** 比数据库实际能并发执行的数量还大的 pool，只是把队列从你的应用挪到数据库里 —— 那里更难看见。当实例数量无上限（serverless、autoscaling）时，解法是一个做连接复用的代理（pgbouncer、RDS Proxy），而不是调高 `max`。

## 缺少图片优化（前端）

```html
<!-- BAD: No dimensions, no format optimization -->
<img src="/hero.jpg" />

<!-- GOOD: Hero / LCP image — art direction + resolution switching, high priority -->
<!--
  Two techniques combined:
  - Art direction (media): different crop/composition per breakpoint
  - Resolution switching (srcset + sizes): right file size per screen density
-->
<picture>
  <!-- Mobile: portrait crop (8:10) -->
  <source
    media="(max-width: 767px)"
    srcset="/hero-mobile-400.avif 400w, /hero-mobile-800.avif 800w"
    sizes="100vw"
    width="800"
    height="1000"
    type="image/avif"
  />
  <source
    media="(max-width: 767px)"
    srcset="/hero-mobile-400.webp 400w, /hero-mobile-800.webp 800w"
    sizes="100vw"
    width="800"
    height="1000"
    type="image/webp"
  />
  <!-- Desktop: landscape crop (2:1) -->
  <source
    srcset="/hero-800.avif 800w, /hero-1200.avif 1200w, /hero-1600.avif 1600w"
    sizes="(max-width: 1200px) 100vw, 1200px"
    width="1200"
    height="600"
    type="image/avif"
  />
  <source
    srcset="/hero-800.webp 800w, /hero-1200.webp 1200w, /hero-1600.webp 1600w"
    sizes="(max-width: 1200px) 100vw, 1200px"
    width="1200"
    height="600"
    type="image/webp"
  />
  <img
    src="/hero-desktop.jpg"
    width="1200"
    height="600"
    fetchpriority="high"
    alt="Hero image description"
  />
</picture>

<!-- GOOD: Below-the-fold image — lazy loaded + async decoding -->
<img
  src="/content.webp"
  width="800"
  height="400"
  loading="lazy"
  decoding="async"
  alt="Content image description"
/>
```

## 不必要的 re-render（React）

```tsx
// BAD: Creates new object on every render, causing children to re-render
function TaskList() {
  return <TaskFilters options={{ sortBy: 'date', order: 'desc' }} />;
}

// GOOD: Stable reference
const DEFAULT_OPTIONS = { sortBy: 'date', order: 'desc' } as const;
function TaskList() {
  return <TaskFilters options={DEFAULT_OPTIONS} />;
}

// Use React.memo for expensive components
const TaskItem = React.memo(function TaskItem({ task }: Props) {
  return <div>{/* expensive render */}</div>;
});

// Use useMemo for expensive computations
function TaskStats({ tasks }: Props) {
  const stats = useMemo(() => calculateStats(tasks), [tasks]);
  return <div>{stats.completed} / {stats.total}</div>;
}
```

## bundle 体积过大

```typescript
// Modern bundlers (Vite, webpack 5+) handle named imports with tree-shaking automatically,
// provided the dependency ships ESM and is marked `sideEffects: false` in package.json.
// Profile before changing import styles — the real gains come from splitting and lazy loading.

// GOOD: Dynamic import for heavy, rarely-used features
const ChartLibrary = lazy(() => import('./ChartLibrary'));

// GOOD: Route-level code splitting wrapped in Suspense
const SettingsPage = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <SettingsPage />
    </Suspense>
  );
}
```

## 缺少缓存（后端）

缓存那些产出昂贵、且读取频率远高于变化的东西。缓存一个本来就快的查询，换来的只是一跳网络、一个 staleness bug 和一套要维护的淘汰策略，别的什么也没有。

**有意识地选择层级：**

| 层级 | 对谁可见 | 何时使用 | 代价 |
|---|---|---|---|
| 进程内（`Map`、LRU） | 单个实例 | 数据小、热度高，可接受按实例各自 stale | 每个实例各自漂移；invalidation 只能触达一个实例 |
| 共享（Redis、Memcached） | 所有实例 | 实例之间必须一致，或值的重算成本很高 | 一跳网络，外加一个要运行和监控的服务 |
| CDN / edge | 所有人，按 URL | 响应是公开的，且对给定 key 完全相同 | Invalidation 是难点；假定你无法快速撤回一个坏响应 |

```typescript
// Cache frequently-read, rarely-changed data
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cachedConfig: AppConfig | null = null;
let cacheExpiry = 0;

async function getAppConfig(): Promise<AppConfig> {
  if (cachedConfig && Date.now() < cacheExpiry) {
    return cachedConfig;
  }
  cachedConfig = await db.config.findFirst();
  cacheExpiry = Date.now() + CACHE_TTL;
  return cachedConfig;
}

// HTTP caching headers for static assets
app.use('/static', express.static('public', {
  maxAge: '1y',           // Cache for 1 year
  immutable: true,        // Never revalidate (use content hashing in filenames)
}));

// Cache-Control for API responses
res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
```

**Key 的设计决定正确性。** 每个会改变响应的输入都要进 key：tenant、locale、permissions、feature flags。一个省略了查看者的 key，就是 A 用户的数据被发给 B 用户的方式 —— 而这种事故往往是以"性能提升"的姿态上线的。

**选一种 invalidation 策略，不要三种都上：**

| 策略 | 取舍 |
|---|---|
| TTL | 最简单。你接受最多一个 TTL 的 staleness，所以明确说出可接受的时间窗口 |
| 基于事件或 tag | 写入即新鲜，但写入方从此必须了解缓存拓扑 |
| 版本化 keys（`user:42:profile:v7`） | 从不 invalidate，只是不再读旧 key。在淘汰之前会占用内存 |

**防住 stampede。** 一个热点 key 过期，所有并发请求一起 miss，origin 瞬间承受全部负载 —— 这就是缓存从"防事故"变成"造事故"的方式。在单个请求重算的同时继续提供 stale 数据（`stale-while-revalidate`），或把并发 miss 合并到一个 in-flight promise 后面，让 N 个等待者只触发一次重算。

**不要缓存：** 任何 staleness 会构成 correctness bug 的东西（余额、permissions、结账时的库存），或者放在一个不能标识用户的 key 下的按用户数据。请求合并、写入策略、negative caching 和 cache checklist 见 `../../../references/performance-checklist.md#缓存策略`。
