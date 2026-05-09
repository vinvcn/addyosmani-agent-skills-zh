# 性能检查清单

Web 应用性能的快速参考检查清单。配合 `performance-optimization` skill 使用。

## 目录

- [Core Web Vitals 目标](#core-web-vitals-目标)
- [TTFB 诊断](#ttfb-诊断)
- [前端检查清单](#前端检查清单)
- [后端检查清单](#后端检查清单)
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
| Layout thrashing | 卡顿、掉帧 | 批量 DOM 读取，再批量写入 |
| 未优化图片 | LCP 慢，浪费带宽 | 使用 WebP、响应式尺寸、lazy load |
| 大 bundles | Time to Interactive 慢 | Code split、tree shake、审计 deps |
| 阻塞主线程 | INP 差，UI 无响应 | 用 `scheduler.yield()` / `yieldToMain` 分块长任务，卸载到 Web Workers |
| 内存泄漏 | 内存增长，最终崩溃 | 清理 listeners、intervals、refs |
