---
name: performance-optimization
description: 优化应用的前端、后端、查询和数据库性能。当存在性能要求、怀疑出现性能回归、Core Web Vitals 或加载时间需要改进、需要修复 N+1 查询模式，或 profiling 暴露出瓶颈时使用。
---

# 性能优化

## 概览

先测量，再优化。没有测量的性能工作就是猜测 —— 而猜测会导致过早优化，增加复杂度却没改善真正要紧的东西。先 profile，找到真正的瓶颈，修复它，再测一遍。只优化被测量证明要紧的部分。

## 何时使用

- spec 中有性能要求（加载时间预算、响应时间 SLA）
- 用户或监控报告了卡顿
- Core Web Vitals 分数低于阈值
- 你怀疑某次变更引入了回归
- 构建处理大数据集或高流量的功能

**何时不用：** 在没有问题证据之前不要优化。过早优化带来的复杂度，比它换来的性能更贵。

## Core Web Vitals 目标

| 指标 | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP**（Largest Contentful Paint） | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| **INP**（Interaction to Next Paint） | ≤ 200ms | ≤ 500ms | > 500ms |
| **CLS**（Cumulative Layout Shift） | ≤ 0.1 | ≤ 0.25 | > 0.25 |

## 优化工作流

```
1. MEASURE  → Establish baseline with real data
2. IDENTIFY → Find the actual bottleneck (not assumed)
3. FIX      → Address the specific bottleneck
4. VERIFY   → Measure again; keep or revert
5. GUARD    → Add monitoring or tests to prevent regression
```

### 步骤 1: 测量

两种互补的方法 —— 都要用：

- **Synthetic（Lighthouse、DevTools Performance 标签页）：** 条件受控、可复现。最适合 CI 回归检测和隔离具体问题。
- **RUM（web-vitals library、CrUX）：** 真实条件下的真实用户数据。要验证一次修复确实改善了用户体验，这是必需的。

**前端：**
```javascript
// Synthetic: Lighthouse in Chrome DevTools (or CI)
// Chrome DevTools → Performance tab → Record
// Chrome DevTools MCP → Performance trace

// RUM: Web Vitals library in code
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```

**后端：**
```javascript
// Response time logging
// Application Performance Monitoring (APM)
// Database query logging with timing

// Simple timing
console.time('db-query');
const result = await db.query(...);
console.timeEnd('db-query');
```

### 从哪里开始测量

用症状来决定先测什么：

```
What is slow?
├── First page load
│   ├── Large bundle? --> Measure bundle size, check code splitting
│   ├── Slow server response? --> Measure TTFB in DevTools Network waterfall
│   │   ├── DNS long? --> Add dns-prefetch / preconnect for known origins
│   │   ├── TCP/TLS long? --> Enable HTTP/2, check edge deployment, keep-alive
│   │   └── Waiting (server) long? --> Profile backend, check queries and caching
│   └── Render-blocking resources? --> Check network waterfall for CSS/JS blocking
├── Interaction feels sluggish
│   ├── UI freezes on click? --> Profile main thread, look for long tasks (>50ms)
│   ├── Form input lag? --> Check re-renders, controlled component overhead
│   └── Animation jank? --> Check layout thrashing, forced reflows
├── Page after navigation
│   ├── Data loading? --> Measure API response times, check for waterfalls
│   └── Client rendering? --> Profile component render time, check for N+1 fetches
└── Backend / API
    ├── Single endpoint slow? --> Profile database queries, check indexes
    ├── All endpoints slow? --> Check connection pool, memory, CPU
    └── Intermittent slowness? --> Check for lock contention, GC pauses, external deps
```

### 步骤 2: 识别瓶颈

按类别划分的常见瓶颈：

**前端：**

| 症状 | 可能原因 | 排查方向 |
|---------|-------------|---------------|
| LCP 慢 | 图片过大、render-blocking 资源、服务器慢 | 查看 network waterfall、图片尺寸 |
| CLS 高 | 图片没有尺寸、晚加载的内容、字体偏移 | 查看 layout shift 归因 |
| INP 差 | 主线程上过重的 JavaScript、大型 DOM 更新 | 在 Performance trace 中查看 long tasks |
| 首次加载慢 | bundle 过大、网络请求过多 | 检查 bundle size、code splitting |

**后端：**

| 症状 | 可能原因 | 排查方向 |
|---------|-------------|---------------|
| API 响应慢 | N+1 查询、缺失索引、未优化的查询 | 查看数据库查询日志 |
| 内存增长 | 泄漏的引用、无界缓存、大 payload | Heap snapshot 分析 |
| CPU 尖峰 | 同步的重计算、正则回溯 | CPU profiling |
| 高延迟 | 缺少缓存、冗余计算、网络跳数 | 沿调用栈 trace 请求 |

### 步骤 3: 修复瓶颈

只修 Step 2 识别出的那一件事，别的都不动。下面的 anti-pattern 是常见嫌疑对象；每一条给出规则和识别它的特征，并链接到 [references/optimization-patterns.md](references/optimization-patterns.md) 中的可落地修复。在真正读到那段代码时，再打开你需要的那一节 —— 不要提前打开。

**Backend**

- **N+1 查询。** 每行一次查询是最常见的后端瓶颈。在同一个查询里取回关联（join/include），而不是在循环里取。[模式](references/optimization-patterns.md#n1-查询后端)
- **无界数据获取。** 每个列表 endpoint 都用 limit 加稳定的 order 做分页。[模式](references/optimization-patterns.md#无界数据获取)
- **无视自身索引的查询。** "加个索引"是猜测；`EXPLAIN ANALYZE` 才是测量。在你预期有索引的地方出现 `Seq Scan`、估算 `rows=` 差了一个数量级、scan 上方有 `Sort` 节点 —— 各对应一种不同的修法；`rows=` 估算不准说明统计信息过期，该做的是运行 `ANALYZE` 而不是加索引。按查询的形状建索引（等值列在前，范围或排序列在后）。普通索引对低选择性主导值上的查询（罕见值才适合 partial index）、前导通配符（需要 trigram 或 full-text）或施加在列上的函数（给表达式建索引，如 `WHERE lower(email) = ?`）都无能为力，而且每个索引都会对每次写入抽税。之后重跑执行计划；没改变计划的索引就该 revert。[模式](references/optimization-patterns.md#无视自身索引的查询)
- **连接池耗尽。** 特征：*所有* endpoint 同时变慢，时间花在等连接而不是执行上，数据库显示大量空闲 sessions。每个进程一个 pool，按 `instances × max` 不超过数据库连接上限来定大小。更大不等于更快；它只是把队列挪到数据库那边 —— 那里更难看见。当实例数量无上限（serverless、autoscaling）时，通过代理复用连接（pgbouncer、RDS Proxy），而不是调高 `max`。[模式](references/optimization-patterns.md#连接池耗尽)
- **缺少缓存。** 缓存那些产出昂贵、且读取频率远高于变化的东西；缓存一个本来就快的查询，只换来一跳网络和一个 staleness bug，别的什么都没有。有意识地选择层级（进程内、共享、CDN）。每个会改变响应的输入都要进 key（tenant、locale、permissions、feature flags）：一个省略了查看者的 key，就是 A 用户的数据被发给 B 用户的方式。选一种 invalidation 策略（TTL、基于事件或 tag、版本化 keys），并明确说出可接受的 staleness 窗口。给热点 key 防 stampede：在单个请求重算的同时继续提供 stale 数据，或把并发 miss 合并到一个 in-flight promise 后面。绝不缓存必须新鲜的东西（余额、permissions、结账时的库存）。[模式](references/optimization-patterns.md#缺少缓存后端)；请求合并、写入策略和 negative caching 见 `../../references/performance-checklist.md`。

**Frontend**

- **缺少图片优化。** 每张图片都声明 `width` 和 `height`（CLS）。LCP 图片用 `fetchpriority="high"`、通过 `<picture>` 使用现代格式（AVIF、WebP）、用 `srcset`/`sizes` 做分辨率切换；首屏外的图片用 `loading="lazy"` 和 `decoding="async"`。[模式](references/optimization-patterns.md#缺少图片优化前端)
- **不必要的 re-render。** 在渲染过程中创建的对象或函数每次都是新引用，会让每个接收它的子组件 re-render。把常量提升；`React.memo` 和 `useMemo` 只留给 profile 显示真正昂贵的工作，因为滥用本身就是成本。[模式](references/optimization-patterns.md#不必要的-re-renderreact)
- **bundle 体积过大。** 现代 bundler 会自行对 ESM 命名导入做 tree-shaking；真正的收益来自路由级 code splitting 和把重型、很少使用的功能懒加载到 `Suspense` 之后。改导入风格之前先 profile。[模式](references/optimization-patterns.md#bundle-体积过大)

### 步骤 4: 验证（保留或回退）

在重新测量之前，一个修复只是一个假设。这一步决定它能否活下来。

**用建立 baseline 时同样的方式重新测量：** 同样的命令、同样的条件、同样的固定预算（wall-clock、样本数或请求数）。拿冷缓存下的 baseline 对比热缓存下的结果，测的是缓存，不是你的变更。

**一次只改一件事。** 三个优化一起落地只产生一个数字，你无法归因。如果它们必须一起发布，先分别单独测量。

**跑赢噪声，而不是只打败均值。** 重复测量，把 delta 和 run-to-run 的方差比较。在 ±5% 方差之内取得 3% 的提升不是提升，只是一次不同的抽样。

然后严格地决策：

| 相对 baseline 的结果 | 行动 |
|---|---|
| 越过阈值，测试全绿 | **保留。** 提交时在 message 里写上前后数字。 |
| 在噪声内（无可测变化） | **Revert。** |
| 更差 | **Revert。** |
| 有改善，但有测试变红 | **Revert。** 这是穿了胜利外衣的回归。 |

**"中性"是 revert，不是 keep。** 这是团队最常跳过的一步：代码已经写好了，扔掉感觉浪费，于是它未经测量就落了地，codebase 就这样积攒下一堆从未换来任何东西的复杂度。你保留的代码，你要维护一辈子。让它值回票价。

**正确性为指标把关。** 测试套件保持全绿，*并且*数字有变化。一个靠砍掉产品必需的工作来"赢"的"优化"（跳过一次 validation、缓存了必须新鲜的东西、删掉一个其实是承重的 `await`）是回归，不是胜利。

#### 记录每一次尝试，包括被 revert 的

被 revert 的工作在 git history 里不留痕迹，而这正是同一个死点子下季度又被试一遍的原因。保留一份简短的台账，让被丢弃的点子继续被丢弃：

| 点子 | Baseline → 结果 | 结论 | 原因 |
|---|---|---|
| 给行组件加 memoize | INP 240ms → 235ms | reverted | 在噪声内（±15ms）。瓶颈不在行上。 |
| 列表虚拟化 | INP 240ms → 90ms | kept | Trace 里的 long tasks 消失了。 |
| Preconnect 到 API origin | LCP 2.8s → 2.8s | reverted | 本来就是 same-origin。 |

写在 PR description 的一个小节里，或仓库里放一个 `PERF.md`，都可以。要紧的是下一个人（或下一个 agent）在提出实验前先读它，不再重跑一个已经失败过的实验。

### 步骤 5: 防止回归

守住用户真实感受到的那个指标，而不是所有能拿到的数字。用当初证明这次修复值得的同一个 LCP、INP、p95 延迟或其他主指标。

当界面面向用户时，用两层互补的守卫：

- **Synthetic CI gate：** 用性能 budget 在 merge 前捕获可复现的回归。对噪声较大的测量做重复采样，或比较中位数/趋势，避免正常的 run-to-run 方差把 gate 变成一个 flaky check。
- **Field monitoring：** 对 RUM 数据中有意义的 p75 移动发出告警。用带归因的 `web-vitals` 数据定位原因；把 CrUX 的滚动窗口当作确认信号，而不是即时告警。

当任一守卫触发时，回到 Step 1，在提出下一个修复之前重新建立 baseline。

**设定 budgets 并强制执行：**

```
JavaScript bundle: < 200KB gzipped (initial load)
CSS: < 50KB gzipped
Images: < 200KB per image (above the fold)
Fonts: < 100KB total
API response time: < 200ms (p95)
Time to Interactive: < 3.5s on 4G
Lighthouse Performance score: ≥ 90
```

**在 CI 中强制执行：**
```bash
# Bundle size check
npx bundlesize --config bundlesize.config.json

# Lighthouse CI
npx lhci autorun
```

## 另请参阅

详细的性能 checklists、优化命令和 anti-pattern 参考见 `../../references/performance-checklist.md`。


## 常见合理化借口

| 自我合理化 | 现实 |
|---|---|
| "我们以后再优化" | 性能债会利滚利。明显的 anti-pattern 现在就修，micro-optimizations 可以往后放。 |
| "在我这台机器上很快" | 你的机器不是用户的机器。在有代表性的硬件和网络上做 profile。 |
| "这个优化显而易见" | 没测过，你就不知道。先 profile。 |
| "用户注意不到 100ms" | 研究表明 100ms 的延迟就影响转化率。用户比你想象的更敏感。 |
| "框架会处理性能" | 框架能防住一些问题，但修不了 N+1 查询或过大的 bundle。 |
| "查询慢，加个索引" | 先看执行计划。索引可能早就存在且用不上，而且每个索引会永远对写入抽税。 |
| "缓存它就行了" | 缓存一个本来就便宜的调用什么都换不来，还多一个 staleness bug。只缓存既昂贵、*又*被反复重读远超写入的东西。 |
| "连接池不够就调大点" | 比数据库服务能力还大的 pool 只是把队列挪到更隐蔽的地方。去找是谁占着连接。 |
| "效果不大，但也没什么坏处" | 中性的变更就该 revert。你会永远为它付维护费，却什么也没换回来。 |
| "代码都写好了，不如留着" | 沉没成本。测量不在乎这个变更当时写了多久。 |
| "提升显而易见，不用再测" | 那重测一次很便宜，还能证明它。未经测量的"胜利"正是中性复杂度的入场方式。 |

## 危险信号

- 没有 profiling 数据支撑就做优化
- 数据获取中出现 N+1 查询模式
- 没有前后查询计划佐证就加索引
- cache key 漏掉了响应依赖的某个输入（tenant、locale、viewer）
- 缓存没有声明的 staleness 窗口，也没有 invalidation 策略
- 因连接耗尽而调大 connection pool，却没有去找谁占着连接
- 列表 endpoints 没有分页
- 图片没有 dimensions、lazy loading 或响应式尺寸
- bundle size 增长却无人 review
- 生产环境没有性能监控
- 到处都塞 `React.memo` 和 `useMemo`（滥用和不用一样糟）
- 保留优化却没有能证明它的重新测量
- 多个优化被打包进同一次测量，导致没有任何一个变更可以归因
- 一个"胜利"要求修改、跳过或删除某个测试
- 同一个失败的优化被反复尝试，因为没人记录过第一次

## 验证

任何性能相关变更之后：

- [ ] 存在前后测量（具体数字）
- [ ] 结果用与 baseline 相同的方式重新测量（同样的命令、同样的条件）
- [ ] 提升超过了 run-to-run 方差，而不只是均值
- [ ] 没有跑赢 baseline 的变更被 revert，而不是当作"中性"保留
- [ ] 每次尝试都有记录，保留和 revert 的一概记录，死点子不会被重跑
- [ ] 具体瓶颈已被识别并处理
- [ ] Core Web Vitals 处于 "Good" 阈值内
- [ ] bundle size 没有显著增长
- [ ] 新数据获取代码中没有 N+1 查询
- [ ] 每个新索引都有前后查询计划佐证，且其写入成本已被考虑
- [ ] 每个新缓存都说明了 key 的构成与 staleness 处理方式
- [ ] 被测的用户侧指标有 synthetic budget 或 field monitor，可以检测到回归
- [ ] 现有测试仍然通过（优化没有破坏行为）
