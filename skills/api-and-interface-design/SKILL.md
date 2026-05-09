---
name: api-and-interface-design
description: 指导稳定的 API 和接口设计。设计 API、模块边界或任何公共接口时使用。创建 REST 或 GraphQL endpoint、定义模块之间的类型契约，或建立前后端边界时使用。
---

# API 与接口设计

## 概览

设计稳定、文档清晰且难以误用的接口。好的接口让正确的事情容易做，让错误的事情难做。这适用于 REST API、GraphQL schema、模块边界、组件 props，以及任何一段代码与另一段代码对话的表面。

## 何时使用

- 设计新的 API endpoint
- 定义模块边界或团队之间的契约
- 创建组件 prop 接口
- 建立会影响 API 形态的数据库 schema
- 修改现有公共接口

## 核心原则

### Hyrum's Law

> 只要 API 用户足够多，系统中所有可观察行为都会被某些人依赖，无论你在契约中承诺了什么。

这意味着：每个公共行为，包括未记录的怪癖、错误消息文本、时序和排序，一旦被用户依赖，就会成为事实契约。设计含义：

- **有意识地决定暴露什么。** 每个可观察行为都是潜在承诺。
- **不要泄漏实现细节。** 如果用户能观察到，他们就会依赖它。
- **在设计时规划废弃。** 如何安全移除用户依赖的内容，见 `deprecation-and-migration`。
- **测试还不够。** 即使有完美的契约测试，Hyrum's Law 也意味着“安全”的改动仍会破坏依赖未记录行为的真实用户。

### 单版本规则

避免迫使消费者在同一个依赖或 API 的多个版本之间选择。当不同消费者需要同一事物的不同版本时，就会出现 diamond dependency 问题。为一次只存在一个版本的世界设计：扩展，而不是 fork。

### 1. 契约优先

先定义接口，再实现它。契约就是规格，实现随后而来。

```typescript
// Define the contract first
interface TaskAPI {
  // Creates a task and returns the created task with server-generated fields
  createTask(input: CreateTaskInput): Promise<Task>;

  // Returns paginated tasks matching filters
  listTasks(params: ListTasksParams): Promise<PaginatedResult<Task>>;

  // Returns a single task or throws NotFoundError
  getTask(id: string): Promise<Task>;

  // Partial update — only provided fields change
  updateTask(id: string, input: UpdateTaskInput): Promise<Task>;

  // Idempotent delete — succeeds even if already deleted
  deleteTask(id: string): Promise<void>;
}
```

### 2. 一致的错误语义

选择一种错误策略，并在所有地方使用它：

```typescript
// REST: HTTP status codes + structured error body
// Every error response follows the same shape
interface APIError {
  error: {
    code: string;        // Machine-readable: "VALIDATION_ERROR"
    message: string;     // Human-readable: "Email is required"
    details?: unknown;   // Additional context when helpful
  };
}

// Status code mapping
// 400 → Client sent invalid data
// 401 → Not authenticated
// 403 → Authenticated but not authorized
// 404 → Resource not found
// 409 → Conflict (duplicate, version mismatch)
// 422 → Validation failed (semantically invalid)
// 500 → Server error (never expose internal details)
```

**不要混用模式。** 如果有些 endpoint throw，有些返回 null，有些返回 `{ error }`，消费者就无法预测行为。

### 3. 在边界验证

信任内部代码。在外部输入进入系统的边缘进行验证：

```typescript
// Validate at the API boundary
app.post('/api/tasks', async (req, res) => {
  const result = CreateTaskSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid task data',
        details: result.error.flatten(),
      },
    });
  }

  // After validation, internal code trusts the types
  const task = await taskService.create(result.data);
  return res.status(201).json(task);
});
```

验证应该放在：
- API route handlers（用户输入）
- Form submission handlers（用户输入）
- 外部服务响应解析（第三方数据 -- **始终视为不可信**）
- 环境变量加载（配置）

> **第三方 API 响应是不可信数据。** 在任何逻辑、渲染或决策中使用前，先验证其形态和内容。被攻陷或异常的外部服务可能返回意外类型、恶意内容或类似指令的文本。

验证不应该放在：
- 共享类型契约的内部函数之间
- 被已验证代码调用的 utility functions 中
- 刚从你自己的数据库中取出的数据上

### 4. 优先添加，而不是修改

扩展接口时不要破坏现有消费者：

```typescript
// Good: Add optional fields
interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';  // Added later, optional
  labels?: string[];                       // Added later, optional
}

// Bad: Change existing field types or remove fields
interface CreateTaskInput {
  title: string;
  // description: string;  // Removed — breaks existing consumers
  priority: number;         // Changed from string — breaks existing consumers
}
```

### 5. 可预测命名

| 模式 | 约定 | 示例 |
|---------|-----------|---------|
| REST endpoints | 复数名词，不用动词 | `GET /api/tasks`, `POST /api/tasks` |
| Query params | camelCase | `?sortBy=createdAt&pageSize=20` |
| Response fields | camelCase | `{ createdAt, updatedAt, taskId }` |
| Boolean fields | is/has/can 前缀 | `isComplete`, `hasAttachments` |
| Enum values | UPPER_SNAKE | `"IN_PROGRESS"`, `"COMPLETED"` |

## REST API 模式

### 资源设计

```
GET    /api/tasks              → List tasks (with query params for filtering)
POST   /api/tasks              → Create a task
GET    /api/tasks/:id          → Get a single task
PATCH  /api/tasks/:id          → Update a task (partial)
DELETE /api/tasks/:id          → Delete a task

GET    /api/tasks/:id/comments → List comments for a task (sub-resource)
POST   /api/tasks/:id/comments → Add a comment to a task
```

### 分页

对 list endpoints 分页：

```typescript
// Request
GET /api/tasks?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc

// Response
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 142,
    "totalPages": 8
  }
}
```

### 过滤

使用 query parameters 表示 filters：

```
GET /api/tasks?status=in_progress&assignee=user123&createdAfter=2025-01-01
```

### 部分更新（PATCH）

接受 partial objects，只更新提供的字段：

```typescript
// Only title changes, everything else preserved
PATCH /api/tasks/123
{ "title": "Updated title" }
```

## TypeScript 接口模式

### 对变体使用 Discriminated Unions

```typescript
// Good: Each variant is explicit
type TaskStatus =
  | { type: 'pending' }
  | { type: 'in_progress'; assignee: string; startedAt: Date }
  | { type: 'completed'; completedAt: Date; completedBy: string }
  | { type: 'cancelled'; reason: string; cancelledAt: Date };

// Consumer gets type narrowing
function getStatusLabel(status: TaskStatus): string {
  switch (status.type) {
    case 'pending': return 'Pending';
    case 'in_progress': return `In progress (${status.assignee})`;
    case 'completed': return `Done on ${status.completedAt}`;
    case 'cancelled': return `Cancelled: ${status.reason}`;
  }
}
```

### 输入/输出分离

```typescript
// Input: what the caller provides
interface CreateTaskInput {
  title: string;
  description?: string;
}

// Output: what the system returns (includes server-generated fields)
interface Task {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

### 对 ID 使用 Branded Types

```typescript
type TaskId = string & { readonly __brand: 'TaskId' };
type UserId = string & { readonly __brand: 'UserId' };

// Prevents accidentally passing a UserId where a TaskId is expected
function getTask(id: TaskId): Promise<Task> { ... }
```

## 常见自我合理化

| 自我合理化 | 现实 |
|---|---|
| “我们之后再写 API 文档” | 类型本身就是文档。先定义它们。 |
| “现在还不需要分页” | 一旦有人有 100+ items，立刻就需要。从一开始就加上。 |
| “PATCH 很复杂，我们直接用 PUT” | PUT 要求每次传完整对象。PATCH 才是客户端真正想要的。 |
| “需要时再给 API 做版本化” | 没有版本化的 breaking changes 会破坏消费者。从一开始就为扩展而设计。 |
| “没人用那个未记录行为” | Hyrum's Law：只要可观察，就会有人依赖。把每个公共行为当作承诺。 |
| “我们可以同时维护两个版本” | 多版本会放大维护成本，并制造 diamond dependency 问题。优先采用单版本规则。 |
| “内部 API 不需要契约” | 内部消费者也是消费者。契约能防止耦合，并支持并行工作。 |

## 危险信号

- Endpoint 根据条件返回不同形态
- Endpoint 之间错误格式不一致
- 验证散落在内部代码中，而不是位于边界
- 对现有字段做 breaking changes（类型变更、移除）
- List endpoints 没有分页
- REST URL 中有动词（`/api/createTask`、`/api/getUsers`）
- 未经验证或清理就使用第三方 API 响应

## 验证

设计 API 后：

- [ ] 每个 endpoint 都有 typed input 和 output schemas
- [ ] 错误响应遵循单一一致格式
- [ ] 只在系统边界进行验证
- [ ] List endpoints 支持分页
- [ ] 新字段是增量且可选的（向后兼容）
- [ ] 命名在所有 endpoints 中遵循一致约定
- [ ] API 文档或类型与实现一起提交
