---
name: planning-and-task-breakdown
description: 将工作拆解为有序任务。用于已有 spec 或清晰需求，并需要拆解成可实现任务时。用于任务太大难以下手、需要估算范围，或存在并行工作机会时。
---

# Planning and Task Breakdown

## 概览

把工作拆解成小而可验证的任务，并为每个任务写明验收标准。好的任务拆解，是可靠完成工作的 agent 和产出纠缠混乱结果的 agent 之间的区别。每个任务都应该足够小，能在一次专注会话中实现、测试和验证。

## 何时使用

- 你已有 spec，需要把它拆成可实现单元
- 一个任务感觉太大或太模糊，难以下手
- 工作需要跨多个 agents 或会话并行
- 你需要向人类沟通范围
- 实现顺序并不明显

**何时不要使用：** 范围显而易见的单文件变更，或 spec 已经包含定义良好的任务。

## 计划流程

### 步骤 1：进入 Plan Mode

写任何代码之前，以只读模式运行：

- 阅读 spec 和相关代码库区域
- 识别现有模式和约定
- 映射组件之间的依赖
- 记录风险和未知项

**规划期间不要写代码。** 输出是一份保存到 `tasks/plan.md` 的计划文档，以及记录在 task list target 中的任务列表（见「输出文件」一节；默认 `tasks/todo.md`），而不是实现。

### 步骤 2：识别依赖图

映射什么依赖什么：

```
Database schema
    │
    ├── API models/types
    │       │
    │       ├── API endpoints
    │       │       │
    │       │       └── Frontend API client
    │       │               │
    │       │               └── UI components
    │       │
    │       └── Validation logic
    │
    └── Seed data / migrations
```

实现顺序沿依赖图自底向上：先构建基础。

### 步骤 3：垂直切片

不要先构建全部数据库、再构建全部 API、再构建全部 UI。一次构建一条完整功能路径：

**坏例（水平切片）：**
```
Task 1: Build entire database schema
Task 2: Build all API endpoints
Task 3: Build all UI components
Task 4: Connect everything
```

**好例（垂直切片）：**
```
Task 1: User can create an account (schema + API + UI for registration)
Task 2: User can log in (auth schema + API + UI for login)
Task 3: User can create a task (task schema + API + UI for creation)
Task 4: User can view task list (query + API + UI for list view)
```

每个垂直切片都交付可工作的、可测试的功能。

### 步骤 4：编写任务

每个任务都遵循这个结构，无论它落在 markdown 任务列表里，还是作为外部 tracker 中的一个条目（见 Output Files）：

```markdown
## Task [N]: [Short descriptive title]

**Description:** One paragraph explaining what this task accomplishes.

**Acceptance criteria:**
- [ ] [Specific, testable condition]
- [ ] [Specific, testable condition]

**Verification:**
- [ ] Tests pass: [the repository's focused-test command]
- [ ] Build succeeds: [the repository's build command]
- [ ] Manual check: [description of what to verify]

**Dependencies:** [Task numbers this depends on, or "None"]

**Files likely touched:**
- `src/path/to/file.ts`
- `tests/path/to/test.ts`

**Estimated scope:** [Small: 1-2 files | Medium: 3-5 files | Large: 5+ files]
```

### 步骤 5：排序并设置检查点

安排任务时确保：

1. 依赖已满足（先构建基础）
2. 每个任务结束时系统仍处于可工作状态
3. 每 2-3 个任务后出现验证检查点
4. 高风险任务靠前（快速失败）

在 task list target 中添加明确检查点：

```markdown
## Checkpoint: After Tasks 1-3
- [ ] All tests pass
- [ ] Application builds without errors
- [ ] Core user flow works end-to-end
- [ ] Review with human before proceeding
```

## 任务大小指南

| 大小 | 文件数 | 范围 | 示例 |
|------|-------|-------|---------|
| **XS** | 1 | 单个函数或配置变更 | 添加一条验证规则 |
| **S** | 1-2 | 一个组件或 endpoint | 添加一个新 API endpoint |
| **M** | 3-5 | 一个功能切片 | 用户注册流程 |
| **L** | 5-8 | 多组件功能 | 带过滤和分页的搜索 |
| **XL** | 8+ | **太大，需要进一步拆解** | — |

如果任务是 L 或更大，就应该拆成更小任务。agent 在 S 和 M 任务上表现最好。

**何时进一步拆分任务：**
- 它会超过一次专注会话（约 2+ 小时 agent 工作）
- 你无法用 3 条或更少 bullet 描述验收标准
- 它触及两个或更多独立子系统（例如 auth 和 billing）
- 你发现自己在任务标题里写 “and”（这通常说明它是两个任务）

## 输出文件

- **计划文档：** 把实现计划保存到 `tasks/plan.md`。这始终是一个 markdown 文件——设计决策、风险和未决问题无法干净地映射到单个 tracker issue 上。
- **任务列表：** 把每个任务记录到 **task list target**（定义见下文）。

如果 `tasks/` 目录不存在则创建。

**绝不覆盖未完成的计划。** 在写 `tasks/plan.md` 或 `tasks/todo.md` 之前，检查它们是否已经存在且仍包含未勾选的任务：

- 对同一份工作重新规划（用户要求修订或扩展这个计划）→ 就地更新现有文件。
- 不同的工作 → **停下来询问。** 未勾选的任务可能正在另一个会话中构建。不要自行删除、覆盖或重命名现有文件；呈现冲突并让用户决定（先完成旧计划、明确丢弃它，或告诉你新计划应该放在哪里）。

同样的规则适用于外部 task list target：绝不为了给新任务腾位置，而批量关闭或删除其他计划的未关闭 tracker items。

### 任务清单存放位置（task list target）

Task list target 是记录任务和检查点的位置。它的定义只出现一次，就在这里；这个 skill 中的其他所有引用都以此为准。

- **默认：位于 `tasks/todo.md` 的 checklist 风格 markdown 文件。** 这是 `/build` 命令和其他下游工具期望的约定。除非项目另有说明，否则使用它。
- **外部 tracker：** 如果项目的 agent 规则（`CLAUDE.md`、`AGENTS.md` 等）或用户指定了 issue tracker（例如 GitHub Issues、Jira、Linear、`bd`/beads），就为每个任务创建一个 tracker item，而不是写 `tasks/todo.md`。把步骤 4 的结构映射到 tracker 的字段：验收标准和验证步骤放进 item 正文，依赖通过 tracker 的链接机制（`bd dep add`、“blocked by” 等）。步骤 5 的检查点也记录为 tracker items；如果 tracker 没有自然的对应物，就记录为计划文档中的 checklist。

使用外部 tracker 时，在 `tasks/plan.md` 中注明（例如 “Tasks tracked in Linear project FOO”），让下游步骤和未来的会话知道去哪里查找；并把计划文档的 Task List 章节保留为 tracker item ID 或链接的有序索引，而不是重复的 checklist。

## 计划文档模板

```markdown
# Implementation Plan: [Feature/Project Name]

## Overview
[One paragraph summary of what we're building]

## Architecture Decisions
- [Key decision 1 and rationale]
- [Key decision 2 and rationale]

## Task List

### Phase 1: Foundation
- [ ] Task 1: ...
- [ ] Task 2: ...

### Checkpoint: Foundation
- [ ] Tests pass, builds clean

### Phase 2: Core Features
- [ ] Task 3: ...
- [ ] Task 4: ...

### Checkpoint: Core Features
- [ ] End-to-end flow works

### Phase 3: Polish
- [ ] Task 5: ...
- [ ] Task 6: ...

### Checkpoint: Complete
- [ ] All acceptance criteria met
- [ ] Ready for review

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | [High/Med/Low] | [Strategy] |

## Open Questions
- [Question needing human input]
```

当任务存放在外部 tracker 中时，把上面的 Task List 章节保留为 tracker item ID 或链接的有序索引，而不是重复的 checklist。

## 并行机会

当多个 agents 或会话可用时：

- **可以安全并行：** 独立功能切片、已实现功能的测试、文档
- **必须顺序执行：** 数据库迁移、共享状态变更、依赖链
- **需要协调：** 共享 API 契约的功能（先定义契约，再并行）

## 常见合理化借口

| 合理化借口 | 现实 |
|---|---|
| “我边做边想” | 这会让你得到纠缠混乱和返工。10 分钟规划能节省数小时。 |
| “任务很明显” | 无论如何都写下来。显式任务会暴露隐藏依赖和被遗忘的边界情况。 |
| “规划是额外开销” | 规划就是任务。没有计划的实现只是打字。 |
| “我可以全都记在脑子里” | 上下文窗口是有限的。书面计划能跨会话边界和压缩继续存在。 |
| “旧的 `tasks/plan.md` 过时了，我直接替换掉” | 未勾选的任务可能正在另一个会话中构建。覆盖它们会摧毁只存在于那里的状态。停下来询问。 |

## 红旗

- 没有书面任务列表就开始实现
- 未经询问就覆盖仍包含不同工作未勾选任务的 `tasks/plan.md` 或 `tasks/todo.md`
- 在项目已指定外部 tracker 时仍然写 `tasks/todo.md`（或把任务散落在两处）
- 任务只写“实现功能”，没有验收标准
- 计划中没有验证步骤
- 所有任务都是 XL 大小
- 任务之间没有检查点
- 没有考虑依赖顺序

## 验证

开始实现前，确认：

- [ ] 每个任务都有验收标准
- [ ] 每个任务都有验证步骤
- [ ] 任务依赖已识别并正确排序
- [ ] 任务已记录到 task list target（默认 `tasks/todo.md`）
- [ ] 没有在未获得用户明确确认的情况下覆盖既有未完成的计划
- [ ] 没有任务触及超过约 5 个文件
- [ ] 主要阶段之间存在检查点
- [ ] 人类已评审并批准计划

## 另见

验收标准是每个任务一份，回答的是“我们构建的东西对吗？”。它们叠加在项目级 Definition of Done（完成定义）之上——那是每个任务在算作完成之前都要跨过的常设标准。参见 `../../references/definition-of-done.md`。
