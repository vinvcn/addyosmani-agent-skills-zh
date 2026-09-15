# 性能检查清单

Web 应用性能的快速参考检查清单。配合 `performance-optimization` skill 使用。

## 目录

- [Core Web Vitals 目标](#core-web-vitals-目标)
- [TTFB 诊断](#ttfb-诊断)
- [前端检查清单](#前端检查清单)
- [后端检查清单](#后端检查清单)
- [缓存策略](#缓存策略)
- [测量命令](#测量命令)
- [常见反模式](#常见反模式)

## Core Web Vitals 目标

| 指标 | 良好 | 需要改进 | 较差 |
|--------|------|------------|------|
| LCP (Largest Contentful Paint) | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| INP (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |

## TTFB 诊断

当 TTFB 较慢（> 800ms）时，在 DevTools Network waterfall 中检查每个组成部分：

- [ ] **DNS resolution** 慢 → 为已知来源添加 `<link rel="dns-prefetch">` 或 `<link rel="preconnect">`
- [ ] **TCP/TLS handshake** 慢 → 启用 HTTP/2，考虑 edge deployment，验证 keep-alive
- [ ] **Server processing** 慢 → profile 后端，检查慢查询，添加缓存

## 前端检查清单

### 图片
- [ ] 图片使用现代格式（WebP、AVIF）
- [ ] 图片按响应式尺寸提供（`srcset` 和 `sizes`）
- [ ] 图片和 `<source>` 元素有明确的 `width` 和 `height`（在 art direction 中防止 CLS）
- [ ] 首屏外图片使用 `loading="lazy"` 和 `decoding="async"`
- [ ] Hero/LCP 图片使用 `fetchpriority="high"` 且不使用 lazy loading

### JavaScript
- [ ] Bundle 大小低于 200KB gzip 后（初始加载）
- [ ] 针对路由和重功能使用动态 `import()` 做代码分割
- [ ] 已启用 tree shaking（验证依赖发布 ESM，并标记 `sideEffects: false`）
- [ ] `<head>` 中没有阻塞 JavaScript（使用 `defer` 或 `async`）
- [ ] 重计算卸载到 Web Workers（如适用）
- [ ] 会以相同 props 重渲染的高成本组件使用 `React.memo()`
- [ ] `useMemo()` / `useCallback()` 只在 profiling 显示有收益时使用
- [ ] 长任务（> 50ms）被拆分，保持主线程可用 - 这是改善 INP 的主要杠杆
- [ ] 长时间运行的循环中使用 `yieldToMain` 模式，让输入事件能在分块之间运行
- [ ] 在可用时使用现代调度 API：`scheduler.yield()`（优先）、带优先级的 `scheduler.postTask()`、只在需要时 yield 的 `isInputPending()`
- [ ] 对可延后、非紧急工作使用 `requestIdleCallback`（analytics flush、prefetch、warmup）
- [ ] 将非关键工作移出事件处理器（例如 analytics、logging），避免延迟交互响应
- [ ] 第三方脚本使用 `async` / `defer` 加载，审计大小，较重时用 facade 承接（chat widgets、embeds）

### CSS
- [ ] Critical CSS 已内联或预加载
- [ ] 非关键样式没有 render-blocking CSS
- [ ] 生产环境没有 CSS-in-JS 运行时成本（使用 extraction）

### 字体
- [ ] 限制为 2-3 个字体族，每个 2-3 个字重（每增加一个字重就是一次额外请求）
- [ ] 仅使用 WOFF2 格式（最小，通用支持 - 跳过 WOFF/TTF/EOT）
- [ ] 尽可能自托管（第三方字体 CDN 会增加 DNS + TCP + TLS round-trips）
- [ ] 预加载 LCP 关键字体：`<link rel="preload" as="font" type="font/woff2" crossorigin>`
- [ ] 使用 `font-display: swap`（非关键字体可用 `optional`）避免 FOIT 阻塞渲染
- [ ] 通过 `unicode-range` 做子集化，只发送每个页面需要的字形
- [ ] 需要多个字重/样式时考虑 Variable fonts（一个文件替代多个文件）
- [ ] 用 `size-adjust`、`ascent-override`、`descent-override` 调整 fallback 字体 metrics，减少字体替换导致的 CLS
- [ ] 在使用任何自定义字体前先考虑 system font stack

### 网络
- [ ] 静态资源使用长 `max-age` + 内容哈希缓存
- [ ] API 响应在适当位置使用缓存（`Cache-Control`）
- [ ] 启用 HTTP/2 或 HTTP/3
- [ ] 为已知来源预连接资源（`<link rel="preconnect">`）
- [ ] 在关键非图片资源上使用 `fetchpriority`（例如关键 `<link rel="preload">`、首屏 `<script>`）- 不只用于 `<img>`
- [ ] 没有不必要的重定向

### 渲染
- [ ] 没有 layout thrashing（强制同步布局）
- [ ] 动画使用 `transform` 和 `opacity`（GPU 加速）
- [ ] 长列表使用 virtualization（例如 `react-window`）
- [ ] 没有不必要的整页重渲染
- [ ] 屏幕外区块使用 `content-visibility: auto` 和 `contain-intrinsic-size`，跳过不可见区域的 layout/paint
- [ ] HTML 响应上没有 `unload` 事件处理器，也没有 `Cache-Control: no-store` - 保持 back/forward cache (bfcache) 资格

## 后端检查清单

### 数据库
- [ ] 没有 N+1 查询模式（使用 eager loading / joins）
- [ ] 查询有合适的索引
- [ ] 列表端点已分页（绝不 `SELECT * FROM table`）
- [ ] 已配置连接池
- [ ] 已启用慢查询日志

#### 执行计划
- [ ] 在修复**之前**就抓取 `EXPLAIN ANALYZE`，而不是只抓修复后 - 它就是基线
- [ ] 理解了大表上的 `Seq Scan`：是索引缺失、索引不可用，还是确实不值得加索引
- [ ] 估算 `rows=` 与实际值相差不超过一个数量级（若超出，先更新统计信息，再动索引）
- [ ] 没有那种本可以被复合索引吸收掉的 `Sort` 节点
- [ ] 变更之后重新检查执行计划 - 没有改变计划的索引要回退掉

#### 索引策略
- [ ] 复合索引的列顺序是：先等值条件，再范围/排序条件
- [ ] 索引覆盖整个查询形态（filter + sort），而不是孤立地只覆盖某一列
- [ ] 对热点读路径考虑过 covering index（index-only scan 可避免回表）
- [ ] 没有*针对主导值*给低选择性列建索引；partial index 依然能服务罕见值的查询（`WHERE status = 'failed'`）
- [ ] 查询中应用了函数的地方使用了 expression index（`lower(email)`）
- [ ] 前缀通配搜索使用全文或 trigram 索引，而不是 B-tree
- [ ] 在写密集的表上测量过写入成本（每个索引都会让每次 `INSERT`/`UPDATE` 付出代价）
- [ ] 已删除未使用和重复的索引（它们只带来写入开销，毫无收益）

#### 连接池
- [ ] 每个进程一个连接池，而不是每个请求或每个模块一个
- [ ] `instances × pool max` 保持在数据库 `max_connections` 之下
- [ ] 设置了 `connectionTimeoutMillis`，让连接耗尽时快速失败，而不是无限排队
- [ ] 在扩容之前先诊断耗尽原因：找出是什么占着连接（长事务、漏掉的 `await`、泄漏的 client）
- [ ] Serverless / 自动扩缩容场景由多路复用代理（pgbouncer、RDS Proxy）承接，而不是单纯放大连接池

### API
- [ ] 响应时间 < 200ms (p95)
- [ ] 请求处理器中没有同步重计算
- [ ] 使用批量操作，而不是逐个调用的循环
- [ ] 响应压缩（gzip/brotli）
- [ ] 合适的缓存（in-memory、Redis、CDN）

### 基础设施
- [ ] 静态资源使用 CDN
- [ ] 服务器靠近用户（或使用 edge deployment）
- [ ] 已配置水平扩展（如需要）
- [ ] 为负载均衡器提供 health check endpoint

## 缓存策略

决策本身（缓在哪一层、用什么失效策略、什么绝不能缓存）在 `performance-optimization` skill 里。本节讲的是读写模式与检查清单。

### 读与写的模式

| 模式 | 工作方式 | 适用场景 | 需要注意 |
|---|---|---|---|
| **Cache-aside**（旁路缓存 / lazy） | 应用先查缓存，miss 时读源并回填 | 默认选择；读多写少，能容忍首次命中是冷的 | 每次 miss 都会打到源站，所以需要防踩踏（stampede protection） |
| **Read-through** | 缓存层自己在 miss 时加载 | 想把加载路径收在一处，而不是散在每个调用点 | 它隐藏了源站延迟；源站慢看起来就像缓存慢 |
| **Write-through** | 写入同步落到缓存和源站 | 写之后读绝对不能看到旧值 | 每次写都加上缓存带来的延迟 |
| **Write-behind**（write-back） | 写入命中缓存，异步更新源站 | 写密集，且源站是瓶颈 | 缓存在刷盘前挂掉就有丢数据窗口；需要能自圆其说的持久性保证 |

### Negative caching（负缓存）

把*没有结果*这件事也缓存下来。一个每次都 miss 的 key（被循环探测的不存在用户 ID、一个 404 资源）会把每个请求都送到源站 - 这样的缓存只保护了 happy path。

- 用一个显式的 "not found" 哨兵值，TTL **短于**正常条目
- 负缓存的 TTL 要足够短，让新建的记录能及时出现
- 绝不要把源站的*错误*变成负缓存条目，否则一分钟的故障会被放大成很久

### 请求合并（Request coalescing，防踩踏）

一次重算，N 个等待者。防止热 key 过期时把全部并发压力都交给源站：

```typescript
const inFlight = new Map<string, Promise<unknown>>();

function loadOnce<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const p = fetcher().finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}
```

在共享缓存的场景下，同样的思路需要一个分布式锁，或者用 `stale-while-revalidate`，让等待者先拿到旧值而不是阻塞。

### 缓存检查清单
- [ ] 先测量确认被缓存的调用确实昂贵（给一个很快的调用加缓存，只是多一跳，毫无收益）
- [ ] 读写比支持引入缓存（读的次数远高于写的次数）
- [ ] 缓存 key 包含了响应会随之变化的每一项输入：租户、查看者、locale、权限、feature flags
- [ ] 没有在无法标识用户的 key 下缓存用户级数据
- [ ] 选定了一种失效策略（TTL、事件/标签，或版本化 key），而不是无意之中混用多种
- [ ] 可接受的过期窗口已经写下来，而不是由随手填的 TTL 默认决定
- [ ] 热 key 有防踩踏措施（请求合并、锁，或 `stale-while-revalidate`）
- [ ] 负结果用更短的 TTL 缓存；源站错误永不缓存
- [ ] 已设置淘汰策略和内存上限（无界的缓存就是一场内存泄漏）
- [ ] 命中率已监控 - 没人测量的缓存只是一个假设，低命中率则纯属额外开销
- [ ] 没有缓存那些过期即构成正确性 bug 的数据（余额、权限、结账时的库存）

## 测量命令

### INP 现场数据和 DevTools 工作流

1. **先看现场数据** - 优化前先检查 [CrUX Vis](https://developer.chrome.com/docs/crux/vis) 或你的 RUM 工具中的真实用户 INP
2. **识别慢交互** - 打开 DevTools → Performance panel → 在交互时录制；查找由点击/按键触发的长任务
3. **在中端 Android 上测试** - INP 问题通常只在较慢硬件上暴露；使用真机或 DevTools CPU throttling（4×-6× slowdown）

```bash
# Lighthouse CLI
npx lighthouse https://localhost:3000 --output json --output-path ./report.json

# Bundle analysis
npx webpack-bundle-analyzer stats.json
# or for Vite:
npx vite-bundle-visualizer

# Check bundle size
npx bundlesize

# Web Vitals in code
import { onLCP, onINP, onCLS } from 'web-vitals';
onLCP(console.log);
onINP(console.log);
onCLS(console.log);

# INP with interaction-level detail (attribution build)
import { onINP } from 'web-vitals/attribution';
onINP(({ value, attribution }) => {
  const { interactionTarget, inputDelay, processingDuration, presentationDelay } = attribution;
  console.log({ value, interactionTarget, inputDelay, processingDuration, presentationDelay });
});
```

## 常见反模式

| 反模式 | 影响 | 修复 |
|---|---|---|
| N+1 queries | DB 负载线性增长 | 使用 joins、includes 或 batch loading |
| 无界查询 | 内存耗尽、超时 | 始终分页，添加 LIMIT |
| 缺少索引 | 数据增长后读取变慢 | 为过滤/排序列添加索引 |
| 不看执行计划就加索引 | 白白付出写入成本，读的性能收益未经验证 | 修复前后都做 `EXPLAIN ANALYZE`；计划没变就回退 |
| 冗余 / 未使用的索引 | 每次写入都要为它们付出代价 | 审计使用统计，删掉没人读的索引 |
| 每个请求一个连接池 | 高负载下耗尽 `max_connections` | 每进程一个池；serverless 走代理 |
| 缓存 key 缺少查看者信息 | 把某个用户的数据返回给了另一个用户 | key 要包含租户、查看者、locale、权限 |
| 无界缓存 | 伪装成优化手段的内存泄漏 | 设置淘汰策略和内存上限 |
| 热 key 的缓存踩踏 | 过期瞬间源站承受全部并发压力 | 合并 miss 请求，或用 `stale-while-revalidate` |
| Layout thrashing | 卡顿、掉帧 | 批量 DOM 读取，再批量写入 |
| 未优化图片 | LCP 慢，浪费带宽 | 使用 WebP、响应式尺寸、lazy load |
| 大 bundles | Time to Interactive 慢 | Code split、tree shake、审计 deps |
| 阻塞主线程 | INP 差，UI 无响应 | 用 `scheduler.yield()` / `yieldToMain` 分块长任务，卸载到 Web Workers |
| 内存泄漏 | 内存增长，最终崩溃 | 清理 listeners、intervals、refs |
