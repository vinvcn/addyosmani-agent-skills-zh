# 无障碍检查清单

WCAG 2.1 AA 合规的快速参考。配合 `frontend-ui-engineering` skill 使用。

## 目录

- [核心检查](#核心检查)
- [常见 HTML 模式](#常见-html-模式)
- [测试工具](#测试工具)
- [快速参考：ARIA Live Regions](#快速参考aria-live-regions)
- [常见反模式](#常见反模式)

## 核心检查

### 键盘导航
- [ ] 所有交互元素都可通过 Tab 键获得焦点
- [ ] 焦点顺序遵循视觉/逻辑顺序
- [ ] 焦点可见（聚焦元素上有 outline/ring）
- [ ] 自定义组件支持键盘操作（Enter 激活，Escape 关闭）
- [ ] 没有键盘陷阱（用户始终可以用 Tab 离开组件）
- [ ] 页面顶部有跳到内容的链接 - 至少在键盘聚焦时可见
- [ ] 模态框打开时锁定焦点，关闭时恢复焦点

### 屏幕阅读器
- [ ] 所有图片都有 `alt` 文本（装饰性图片使用 `alt=""`）
- [ ] 所有表单输入都有关联标签（`<label>` 或 `aria-label`）
- [ ] 按钮和链接有描述性文本（不要使用 "Click here"）
- [ ] 仅图标按钮有 `aria-label`
- [ ] 页面只有一个 `<h1>`，标题层级不要跳级
- [ ] 动态内容变化会被播报（`aria-live` 区域）
- [ ] 表格有带 scope 的 `<th>` 表头

### 视觉
- [ ] 文本对比度 ≥ 4.5:1（普通文本）或 ≥ 3:1（大文本，18px+）
- [ ] UI 组件与背景的对比度 ≥ 3:1
- [ ] 颜色不是传达信息的唯一方式
- [ ] 文本可放大到 200% 且不破坏布局
- [ ] 没有每秒闪烁超过 3 次的内容

### 表单
- [ ] 每个输入都有可见标签
- [ ] 必填字段有提示（不能只靠颜色）
- [ ] 错误消息具体，并与对应字段关联
- [ ] 错误状态不只靠颜色可见（图标、文本、边框）
- [ ] 表单提交错误会汇总展示并可获得焦点
- [ ] 已知字段使用 autocomplete（例如 `type="email" autocomplete="email"`）

### 内容
- [ ] 声明页面语言（`<html lang="en">`）
- [ ] 页面有描述性的 `<title>`
- [ ] 链接能从周围文本中区分出来（不能只靠颜色）
- [ ] 移动端触控目标 ≥ 44x44px
- [ ] 有有意义的空状态（不是空白屏幕）

## 常见 HTML 模式

### 按钮 vs. 链接

```html
<!-- Use <button> for actions -->
<button onClick={handleDelete}>Delete Task</button>

<!-- Use <a> for navigation -->
<a href="/tasks/123">View Task</a>

<!-- NEVER use div/span as buttons -->
<div onClick={handleDelete}>Delete</div>  <!-- BAD -->
```

### 表单标签

```html
<!-- Explicit label association -->
<label htmlFor="email">Email address</label>
<input id="email" type="email" required />

<!-- Implicit wrapping -->
<label>
  Email address
  <input type="email" required />
</label>

<!-- Hidden label (visible label preferred) -->
<input type="search" aria-label="Search tasks" />
```

### ARIA Roles

```html
<!-- Navigation -->
<nav aria-label="Main navigation">...</nav>
<nav aria-label="Footer links">...</nav>

<!-- Status messages -->
<div role="status" aria-live="polite">Task saved</div>

<!-- Alert messages -->
<div role="alert">Error: Title is required</div>

<!-- Modal dialogs -->
<dialog aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm Delete</h2>
  ...
</dialog>

<!-- Loading states -->
<div aria-busy="true" aria-label="Loading tasks">
  <Spinner />
</div>
```

### 可访问列表

```html
<ul role="list" aria-label="Tasks">
  <li>
    <input type="checkbox" id="task-1" aria-label="Complete: Buy groceries" />
    <label htmlFor="task-1">Buy groceries</label>
  </li>
</ul>
```

## 测试工具

```bash
# Automated audit
npx axe-core          # Programmatic accessibility testing
npx pa11y             # CLI accessibility checker

# In browser
# Chrome DevTools → Lighthouse → Accessibility
# Chrome DevTools → Elements → Accessibility tree

# Screen reader testing
# macOS: VoiceOver (Cmd + F5)
# Windows: NVDA (free) or JAWS
# Linux: Orca
```

## 快速参考：ARIA Live Regions

| 值 | 行为 | 适用场景 |
|-------|----------|---------|
| `aria-live="polite"` | 在下一次停顿时播报 | 状态更新、保存确认 |
| `aria-live="assertive"` | 立即播报 | 错误、时间敏感的提醒 |
| `role="status"` | 等同于 `polite` | 状态消息 |
| `role="alert"` | 等同于 `assertive` | 错误消息 |

## 常见反模式

| 反模式 | 问题 | 修复 |
|---|---|---|
| 用 `div` 做按钮 | 不可聚焦，没有键盘支持 | 使用 `<button>` |
| 缺少 `alt` 文本 | 图片对屏幕阅读器不可见 | 添加描述性的 `alt` |
| 只用颜色表示状态 | 色盲用户不可见 | 添加图标、文本或图案 |
| 自动播放媒体 | 令人迷失，且无法停止 | 添加控件，不要自动播放 |
| 没有 ARIA 的自定义下拉框 | 键盘/屏幕阅读器不可用 | 使用原生 `<select>` 或正确的 ARIA listbox |
| 移除焦点轮廓 | 用户看不到自己所在位置 | 样式化轮廓，不要移除 |
| 空链接/按钮 | 只播报 "Link"，没有描述 | 添加文本或 `aria-label` |
| `tabindex > 0` | 破坏自然 Tab 顺序 | 只使用 `tabindex="0"` 或 `-1` |
