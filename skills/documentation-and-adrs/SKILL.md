---
name: documentation-and-adrs
description: 记录决策和文档。用于做架构决策、变更公开 API、发布功能，或需要记录未来工程师和 agent 理解代码库所需的上下文时。
---

# 文档和 ADR

## 概览

记录决策，而不只是记录代码。最有价值的文档会捕捉 *why*：促成某个决策的上下文、约束和权衡。代码展示构建了 *what*；文档解释 *why it was built this way*，以及 *what alternatives were considered*。这些上下文对未来在代码库中工作的工程师和 agent 都很重要。

## 何时使用

- 做出重要架构决策
- 在多个竞争方案之间做选择
- 添加或变更公开 API
- 发布会改变用户可见行为的功能
- 让新的团队成员（或 agent）熟悉项目
- 当你发现自己反复解释同一件事时

**不应使用的情况：** 不要记录显而易见的代码。不要添加只是复述代码本身的注释。不要为一次性原型编写文档。

## Architecture Decision Records (ADRs，架构决策记录)

ADR 捕捉重大技术决策背后的推理。它们是你能写出的最高价值文档。

### 何时编写 ADR

- 选择框架、库或主要依赖
- 设计数据模型或数据库 schema
- 选择认证策略
- 决定 API 架构（REST vs. GraphQL vs. tRPC）
- 在构建工具、托管平台或基础设施之间做选择
- 任何逆转成本高的决策

### ADR 模板

将 ADR 存放在 `docs/decisions/`，并使用连续编号：

```markdown
# ADR-001: Use PostgreSQL for primary database

## Status
Accepted | Superseded by ADR-XXX | Deprecated

## Date
2025-01-15

## Context
We need a primary database for the task management application. Key requirements:
- Relational data model (users, tasks, teams with relationships)
- ACID transactions for task state changes
- Support for full-text search on task content
- Managed hosting available (for small team, limited ops capacity)

## Decision
Use PostgreSQL with Prisma ORM.

## Alternatives Considered

### MongoDB
- Pros: Flexible schema, easy to start with
- Cons: Our data is inherently relational; would need to manage relationships manually
- Rejected: Relational data in a document store leads to complex joins or data duplication

### SQLite
- Pros: Zero configuration, embedded, fast for reads
- Cons: Limited concurrent write support, no managed hosting for production
- Rejected: Not suitable for multi-user web application in production

### MySQL
- Pros: Mature, widely supported
- Cons: PostgreSQL has better JSON support, full-text search, and ecosystem tooling
- Rejected: PostgreSQL is the better fit for our feature requirements

## Consequences
- Prisma provides type-safe database access and migration management
- We can use PostgreSQL's full-text search instead of adding Elasticsearch
- Team needs PostgreSQL knowledge (standard skill, low risk)
- Hosting on managed service (Supabase, Neon, or RDS)
```

### ADR 生命周期

```
PROPOSED → ACCEPTED → (SUPERSEDED or DEPRECATED)
```

- **不要删除旧 ADR。** 它们捕捉历史上下文。
- 当决策发生变化时，写一个新的 ADR，引用并取代旧 ADR。

## 行内文档

### 何时写注释

注释解释 *why*，而不是 *what*：

```typescript
// BAD: Restates the code
// Increment counter by 1
counter += 1;

// GOOD: Explains non-obvious intent
// Rate limit uses a sliding window — reset counter at window boundary,
// not on a fixed schedule, to prevent burst attacks at window edges
if (now - windowStart > WINDOW_SIZE_MS) {
  counter = 0;
  windowStart = now;
}
```

### 何时不要写注释

```typescript
// Don't comment self-explanatory code
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Don't leave TODO comments for things you should just do now
// TODO: add error handling  ← Just add it

// Don't leave commented-out code
// const oldImplementation = () => { ... }  ← Delete it, git has history
```

### 记录已知陷阱

```typescript
/**
 * IMPORTANT: This function must be called before the first render.
 * If called after hydration, it causes a flash of unstyled content
 * because the theme context isn't available during SSR.
 *
 * See ADR-003 for the full design rationale.
 */
export function initializeTheme(theme: Theme): void {
  // ...
}
```

## API 文档

对于公开 API（REST、GraphQL、库接口）：

### 与类型一起内联记录（TypeScript 首选）

```typescript
/**
 * Creates a new task.
 *
 * @param input - Task creation data (title required, description optional)
 * @returns The created task with server-generated ID and timestamps
 * @throws {ValidationError} If title is empty or exceeds 200 characters
 * @throws {AuthenticationError} If the user is not authenticated
 *
 * @example
 * const task = await createTask({ title: 'Buy groceries' });
 * console.log(task.id); // "task_abc123"
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  // ...
}
```

### REST API 使用 OpenAPI / Swagger

```yaml
paths:
  /api/tasks:
    post:
      summary: Create a task
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTaskInput'
      responses:
        '201':
          description: Task created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'
        '422':
          description: Validation error
```

## README 结构

每个项目都应该有一份 README，覆盖：

```markdown
# Project Name

One-paragraph description of what this project does.

## Quick Start
1. Clone the repo
2. Install dependencies: `npm install`
3. Set up environment: `cp .env.example .env`
4. Run the dev server: `npm run dev`

## Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm test` | Run tests |
| `npm run build` | Production build |
| `npm run lint` | Run linter |

## Architecture
Brief overview of the project structure and key design decisions.
Link to ADRs for details.

## Contributing
How to contribute, coding standards, PR process.
```

## Changelog 维护

对于已发布功能：

```markdown
# Changelog

## [1.2.0] - 2025-01-20
### Added
- Task sharing: users can share tasks with team members (#123)
- Email notifications for task assignments (#124)

### Fixed
- Duplicate tasks appearing when rapidly clicking create button (#125)

### Changed
- Task list now loads 50 items per page (was 20) for better UX (#126)
```

## 面向 Agent 的文档

需要特别考虑 AI agent 的上下文：

- **CLAUDE.md / rules files** — 记录项目约定，让 agent 遵循它们
- **Spec files** — 保持 spec 更新，让 agent 构建正确的东西
- **ADRs** — 帮助 agent 理解过去决策的原因（避免重复决策）
- **Inline gotchas** — 防止 agent 掉入已知陷阱

## 常见合理化借口

| 合理化借口 | 现实 |
|---|---|
| “代码是自解释的” | 代码展示 what。它不展示 why、不展示哪些替代方案被拒绝，也不展示适用哪些约束。 |
| “等 API 稳定后再写文档” | 当你记录 API 时，API 会更快稳定下来。文档是设计的第一道测试。 |
| “没人读文档” | Agent 会读。未来工程师会读。三个月后的你也会读。 |
| “ADR 是额外负担” | 一份 10 分钟写完的 ADR，可以避免六个月后围绕同一决策进行 2 小时争论。 |
| “注释会过时” | 关于 *why* 的注释是稳定的。关于 *what* 的注释会过时，所以只写前者。 |

## 危险信号

- 架构决策没有书面理由
- 公开 API 没有文档或类型
- README 没有说明如何运行项目
- 用注释掉的代码代替删除
- TODO 注释已经存在数周
- 有重大架构选择的项目中没有 ADR
- 文档只是复述代码，而不是解释意图

## 验证

完成文档后：

- [ ] 所有重大架构决策都有 ADR
- [ ] README 覆盖 quick start、commands 和 architecture overview
- [ ] API 函数有参数和返回类型文档
- [ ] 已知陷阱在重要位置以内联方式记录
- [ ] 没有保留注释掉的代码
- [ ] Rules files（CLAUDE.md 等）是最新且准确的
