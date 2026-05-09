---
name: frontend-ui-engineering
description: 构建生产级 UI。当构建或修改面向用户的界面时使用。创建组件、实现布局、管理状态，或输出需要看起来和感觉上都是生产级而不是 AI 生成时使用。
---

# 前端 UI 工程

## 概览

构建可访问、高性能、视觉打磨到位的生产级用户界面。目标是让 UI 看起来像由顶级公司的、有设计意识的工程师构建，而不是 AI 生成。这意味着真正遵循设计系统、正确的可访问性、周到的交互模式，以及没有通用的“AI aesthetic”。

## 何时使用

- 构建新的 UI 组件或页面
- 修改现有面向用户的界面
- 实现响应式布局
- 添加交互或状态管理
- 修复视觉或 UX 问题

## 组件架构

### 文件结构

把与组件相关的一切放在一起：

```
src/components/
  TaskList/
    TaskList.tsx          # Component implementation
    TaskList.test.tsx     # Tests
    TaskList.stories.tsx  # Storybook stories (if using)
    use-task-list.ts      # Custom hook (if complex state)
    types.ts              # Component-specific types (if needed)
```

### 组件模式

**优先组合，而不是配置：**

```tsx
// Good: Composable
<Card>
  <CardHeader>
    <CardTitle>Tasks</CardTitle>
  </CardHeader>
  <CardBody>
    <TaskList tasks={tasks} />
  </CardBody>
</Card>

// Avoid: Over-configured
<Card
  title="Tasks"
  headerVariant="large"
  bodyPadding="md"
  content={<TaskList tasks={tasks} />}
/>
```

**保持组件聚焦：**

```tsx
// Good: Does one thing
export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <li className="flex items-center gap-3 p-3">
      <Checkbox checked={task.done} onChange={() => onToggle(task.id)} />
      <span className={task.done ? 'line-through text-muted' : ''}>{task.title}</span>
      <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)}>
        <TrashIcon />
      </Button>
    </li>
  );
}
```

**把数据获取与展示分离：**

```tsx
// Container: handles data
export function TaskListContainer() {
  const { tasks, isLoading, error } = useTasks();

  if (isLoading) return <TaskListSkeleton />;
  if (error) return <ErrorState message="Failed to load tasks" retry={refetch} />;
  if (tasks.length === 0) return <EmptyState message="No tasks yet" />;

  return <TaskList tasks={tasks} />;
}

// Presentation: handles rendering
export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul role="list" className="divide-y">
      {tasks.map(task => <TaskItem key={task.id} task={task} />)}
    </ul>
  );
}
```

## 状态管理

**选择能工作的最简单方案：**

```
Local state (useState)           → Component-specific UI state
Lifted state                     → Shared between 2-3 sibling components
Context                          → Theme, auth, locale (read-heavy, write-rare)
URL state (searchParams)         → Filters, pagination, shareable UI state
Server state (React Query, SWR)  → Remote data with caching
Global store (Zustand, Redux)    → Complex client state shared app-wide
```

**避免超过 3 层的 prop drilling。** 如果你把 props 传过不使用它们的组件，引入 context 或重构组件树。

## 遵循设计系统

### 避免 AI Aesthetic

AI 生成的 UI 有可识别的模式。全部避免：

| AI 默认值 | 为什么是问题 | 生产质量 |
|---|---|---|
| 到处都是紫色/靛蓝 | 模型默认选择视觉上“安全”的调色板，让每个应用看起来都一样 | 使用项目实际的色彩方案 |
| 过度渐变 | 渐变增加视觉噪声，并与多数设计系统冲突 | 使用符合设计系统的平面色或细微渐变 |
| 所有东西都圆角（rounded-2xl） | 最大圆角传递“友好”感，但忽略真实设计中的圆角层级 | 使用设计系统中一致的 border-radius |
| 通用 hero sections | 模板化布局，与实际内容或用户需求无关 | 内容优先的布局 |
| Lorem ipsum 风格文案 | 占位文本会隐藏真实内容暴露的布局问题（长度、换行、溢出） | 真实的占位内容 |
| 到处都是超大 padding | 一味宽松的等量 padding 会破坏视觉层级并浪费屏幕空间 | 一致的间距尺度 |
| Stock card grids | 统一网格是忽略信息优先级和扫描模式的布局捷径 | 目标驱动的布局 |
| 阴影很重的设计 | 层叠阴影增加与内容竞争的深度，并拖慢低端设备渲染 | 除非设计系统指定，否则使用细微阴影或不使用阴影 |

### 间距与布局

使用一致的间距尺度。不要发明数值：

```css
/* Use the scale: 0.25rem increments (or whatever the project uses) */
/* Good */  padding: 1rem;      /* 16px */
/* Good */  gap: 0.75rem;       /* 12px */
/* Bad */   padding: 13px;      /* Not on any scale */
/* Bad */   margin-top: 2.3rem; /* Not on any scale */
```

### 排版

尊重文字层级：

```
h1 → Page title (one per page)
h2 → Section title
h3 → Subsection title
body → Default text
small → Secondary/helper text
```

不要跳过标题级别。不要把标题样式用于非标题内容。

### 颜色

- 使用语义化颜色 token：`text-primary`、`bg-surface`、`border-default`，不要用原始 hex 值
- 确保足够对比度（普通文本 4.5:1，大号文本 3:1）
- 不要仅依赖颜色传达信息（也使用图标、文本或图案）

## 可访问性（WCAG 2.1 AA）

每个组件都必须满足这些标准：

### 键盘导航

```tsx
// Every interactive element must be keyboard accessible
<button onClick={handleClick}>Click me</button>        // ✓ Focusable by default
<div onClick={handleClick}>Click me</div>               // ✗ Not focusable
<div role="button" tabIndex={0} onClick={handleClick}    // ✓ But prefer <button>
     onKeyDown={e => {
       if (e.key === 'Enter') handleClick();
       if (e.key === ' ') e.preventDefault();
     }}
     onKeyUp={e => {
       if (e.key === ' ') handleClick();
     }}>
  Click me
</div>
```

### ARIA 标签

```tsx
// Label interactive elements that lack visible text
<button aria-label="Close dialog"><XIcon /></button>

// Label form inputs
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Or use aria-label when no visible label exists
<input aria-label="Search tasks" type="search" />
```

### 焦点管理

```tsx
// Move focus when content changes
function Dialog({ isOpen, onClose }: DialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  // Trap focus inside dialog when open
  return (
    <dialog open={isOpen}>
      <button ref={closeRef} onClick={onClose}>Close</button>
      {/* dialog content */}
    </dialog>
  );
}
```

### 有意义的空状态和错误状态

```tsx
// Don't show blank screens
function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div role="status" className="text-center py-12">
        <TasksEmptyIcon className="mx-auto h-12 w-12 text-muted" />
        <h3 className="mt-2 text-sm font-medium">No tasks</h3>
        <p className="mt-1 text-sm text-muted">Get started by creating a new task.</p>
        <Button className="mt-4" onClick={onCreateTask}>Create Task</Button>
      </div>
    );
  }

  return <ul role="list">...</ul>;
}
```

## 响应式设计

先为移动端设计，再扩展：

```tsx
// Tailwind: mobile-first responsive
<div className="
  grid grid-cols-1      /* Mobile: single column */
  sm:grid-cols-2        /* Small: 2 columns */
  lg:grid-cols-3        /* Large: 3 columns */
  gap-4
">
```

在这些断点测试：320px、768px、1024px、1440px。

## 加载与过渡

```tsx
// Skeleton loading (not spinners for content)
function TaskListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading tasks">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-12 bg-muted animate-pulse rounded" />
      ))}
    </div>
  );
}

// Optimistic updates for perceived speed
function useToggleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData(['tasks']);

      queryClient.setQueryData(['tasks'], (old: Task[]) =>
        old.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
      );

      return { previous };
    },
    onError: (_err, _taskId, context) => {
      queryClient.setQueryData(['tasks'], context?.previous);
    },
  });
}
```

## 另请参阅

关于详细可访问性要求和测试工具，见 `references/accessibility-checklist.md`。

## 常见自我合理化

| 自我合理化 | 现实 |
|---|---|
| “Accessibility 只是锦上添花” | 在许多司法辖区它是法律要求，也是工程质量标准。 |
| “我们之后再做 responsive” | 事后补响应式设计，比一开始就构建难 3 倍。 |
| “设计还没最终定稿，所以我先跳过 styling” | 使用设计系统默认值。无样式 UI 会给 reviewer 留下破损的第一印象。 |
| “这只是 prototype” | 原型会变成生产代码。把基础打对。 |
| “AI aesthetic 现在也可以” | 它会传递低质量信号。从一开始就使用项目真实设计系统。 |

## 危险信号

- 组件超过 200 行（拆分它们）
- 内联样式或任意像素值
- 缺少错误状态、加载状态或空状态
- 没有键盘导航测试
- 颜色是状态的唯一指示（红/绿但没有文本或图标）
- 通用“AI look”（紫色渐变、超大卡片、stock layouts）

## 验证

构建 UI 后：

- [ ] 组件渲染时没有 console errors
- [ ] 所有交互元素都可通过键盘访问（Tab through the page）
- [ ] Screen reader 能传达页面内容和结构
- [ ] 响应式：在 320px、768px、1024px、1440px 下工作
- [ ] 加载、错误和空状态都已处理
- [ ] 遵循项目设计系统（间距、颜色、排版）
- [ ] dev tools 或 axe-core 中没有可访问性警告
