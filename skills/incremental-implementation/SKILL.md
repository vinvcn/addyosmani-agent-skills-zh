---
name: incremental-implementation
description: 以增量方式交付变更。用于实现任何触及多个文件的功能或变更。用于你即将一次写大量代码，或任务太大无法一步落地时。
---

# Incremental Implementation

## 概览

用薄的垂直切片构建：实现一小块，测试它，验证它，然后再扩展。避免一次性实现整个功能。每个增量都应该让系统保持可工作、可测试的状态。这是让大型功能可管理的执行纪律。

## 何时使用

- 实现任何多文件变更
- 从任务拆解中构建新功能
- 重构现有代码
- 任何你想在测试前写超过约 100 行代码的时候

**何时不要使用：** 范围已经最小化的单文件、单函数变更。

## 增量循环

```
┌──────────────────────────────────────┐
│                                      │
│   Implement ──→ Test ──→ Verify ──┐  │
│       ▲                           │  │
│       └───── Commit ◄─────────────┘  │
│              │                       │
│              ▼                       │
│          Next slice                  │
│                                      │
└──────────────────────────────────────┘
```

对每个切片：

1. **Implement** 最小的完整功能片段
2. **Test**：运行测试套件（或在没有测试时编写测试）
3. **Verify**：确认切片按预期工作（测试通过、构建成功、手动检查）
4. **Commit**：用描述性消息保存进度（原子提交指导见 `git-workflow-and-versioning`）
5. **Move to the next slice**：继续推进，不要从头开始

## 切片策略

### 垂直切片（优先）

构建一条贯穿整个技术栈的完整路径：

```
Slice 1: Create a task (DB + API + basic UI)
    → Tests pass, user can create a task via the UI

Slice 2: List tasks (query + API + UI)
    → Tests pass, user can see their tasks

Slice 3: Edit a task (update + API + UI)
    → Tests pass, user can modify tasks

Slice 4: Delete a task (delete + API + UI + confirmation)
    → Tests pass, full CRUD complete
```

每个切片都交付可工作的端到端功能。

### Contract-First Slicing

当后端和前端需要并行开发时：

```
Slice 0: Define the API contract (types, interfaces, OpenAPI spec)
Slice 1a: Implement backend against the contract + API tests
Slice 1b: Implement frontend against mock data matching the contract
Slice 2: Integrate and test end-to-end
```

### Risk-First Slicing

先处理风险最高或最不确定的部分：

```
Slice 1: Prove the WebSocket connection works (highest risk)
Slice 2: Build real-time task updates on the proven connection
Slice 3: Add offline support and reconnection
```

如果 Slice 1 失败，你会在投入 Slice 2 和 3 前发现。

## 实现规则

### 规则 0：简单优先

写任何代码之前，先问：“最简单能工作的东西是什么？”

写完代码后，用这些检查审视它：
- 能用更少代码完成吗？
- 这些抽象值得它们带来的复杂度吗？
- staff engineer 看了会不会说“为什么不直接……”？
- 我是在为假想的未来需求构建，还是为当前任务构建？

```
SIMPLICITY CHECK:
✗ Generic EventBus with middleware pipeline for one notification
✓ Simple function call

✗ Abstract factory pattern for two similar components
✓ Two straightforward components with shared utilities

✗ Config-driven form builder for three forms
✓ Three form components
```

三行相似代码比过早抽象更好。先实现朴素、显然正确的版本。只有在测试证明正确后再优化。

### 规则 0.5：范围纪律

只触碰任务需要的内容。

不要：
- “清理”与你的变更相邻的代码
- 在未修改的文件中重构 imports
- 移除你没有完全理解的注释
- 因为“看起来有用”而添加 spec 之外的功能
- 在只是阅读的文件中现代化语法

如果你注意到任务范围外值得改进的东西，记录下来，不要修：

```
NOTICED BUT NOT TOUCHING:
- src/utils/format.ts has an unused import (unrelated to this task)
- The auth middleware could use better error messages (separate task)
→ Want me to create tasks for these?
```

### 规则 1：一次只做一件事

每个增量只改变一件逻辑事情。不要混合关注点：

**坏例：** 一个 commit 同时添加新组件、重构现有组件，并更新构建配置。

**好例：** 三个独立 commits，每个对应一个变更。

### 规则 2：保持可编译

每个增量后，项目必须能构建，现有测试必须通过。不要让代码库在切片之间处于破损状态。

### 规则 3：为未完成功能使用 Feature Flags

如果功能尚未准备好给用户使用，但你需要合并增量：

```typescript
// Feature flag for work-in-progress
const ENABLE_TASK_SHARING = process.env.FEATURE_TASK_SHARING === 'true';

if (ENABLE_TASK_SHARING) {
  // New sharing UI
}
```

这让你可以把小增量合并到 main branch，而不暴露未完成工作。

### 规则 4：安全默认值

新代码应该默认采用安全、保守行为：

```typescript
// Safe: disabled by default, opt-in
export function createTask(data: TaskInput, options?: { notify?: boolean }) {
  const shouldNotify = options?.notify ?? false;
  // ...
}
```

### 规则 5：便于回滚

每个增量都应能独立 revert：

- 增量式变更（新文件、新函数）容易 revert
- 对现有代码的修改应最小且聚焦
- 数据库迁移应有对应 rollback migration
- 避免在一个 commit 中先删除某物再替换它，把它们分开

## 与 Agents 协作

指导 agent 增量实现时：

```
"Let's implement Task 3 from the plan.

Start with just the database schema change and the API endpoint.
Don't touch the UI yet — we'll do that in the next increment.

After implementing, run `npm test` and `npm run build` to verify
nothing is broken."
```

明确说明每个增量的范围内是什么，范围外是什么。

## 增量检查清单

每个增量后，验证：

- [ ] 变更只做一件事，并且完整完成
- [ ] 所有现有测试仍然通过（`npm test`）
- [ ] 构建成功（`npm run build`）
- [ ] 类型检查通过（`npx tsc --noEmit`）
- [ ] lint 通过（`npm run lint`）
- [ ] 新功能按预期工作
- [ ] 变更已用描述性消息提交

**注意：** 每次会影响验证结果的变更后，运行对应验证命令。一次成功运行后，除非代码发生变化，否则不要重复同一个命令；在未变更代码上重复运行不会增加信息。

## 常见合理化借口

| 合理化借口 | 现实 |
|---|---|
| “我最后一起测试” | bug 会复合。Slice 1 的 bug 会让 Slice 2-5 都出错。每个切片都要测试。 |
| “一次性全做完更快” | 它*感觉*更快，直到某处坏了，而你找不出 500 行变更里哪一行导致问题。 |
| “这些变更太小，不值得分开提交” | 小 commits 是免费的。大 commits 会隐藏 bug，并让回滚痛苦。 |
| “我之后再加 feature flag” | 如果功能未完成，就不该对用户可见。现在就加 flag。 |
| “这个重构足够小，可以一起带上” | 与功能混在一起的重构，会让两者都更难评审和调试。分开。 |
| “我再跑一次构建命令确认一下” | 一次成功运行后，除非代码发生变化，否则重复同一命令没有意义。后续编辑后再运行，不要把它当安慰剂。 |

## 红旗

- 写了超过 100 行代码却没有运行测试
- 单个增量包含多个无关变更
- “让我也顺手加这个”的范围扩张
- 跳过 test/verify 步骤以求更快
- 增量之间构建或测试处于破损状态
- 大量未提交变更堆积
- 在第三个用例真正需要之前就构建抽象
- “反正我在这里”而触碰任务范围外文件
- 为一次性操作创建新的 utility 文件
- 没有任何代码变更却连续两次运行同一个 build/test 命令

## 验证

完成一个任务的所有增量后：

- [ ] 每个增量都已单独测试并提交
- [ ] 完整测试套件通过
- [ ] 构建干净
- [ ] 功能按 spec 端到端工作
- [ ] 没有未提交变更
