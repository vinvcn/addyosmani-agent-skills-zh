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

**规划期间不要写代码。** 输出是一份计划文档，而不是实现。

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

每个任务遵循这个结构：

```markdown
## Task [N]: [Short descriptive title]

**Description:** One paragraph explaining what this task accomplishes.

**Acceptance criteria:**
- [ ] [Specific, testable condition]
- [ ] [Specific, testable condition]

**Verification:**
- [ ] Tests pass: `npm test -- --grep "feature-name"`
- [ ] Build succeeds: `npm run build`
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

添加明确检查点：

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

## 红旗

- 没有书面任务列表就开始实现
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
- [ ] 没有任务触及超过约 5 个文件
- [ ] 主要阶段之间存在检查点
- [ ] 人类已评审并批准计划
