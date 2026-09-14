---
description: 增量实现任务 — build、test、verify、commit。加上 "auto" 可在一次获批的执行中跑完整个 plan
---

同时调用 agent-skills:incremental-implementation skill 和 agent-skills:test-driven-development。

## 模式

- **`/build`** — 实现*下一个* pending task，然后停止（谨慎推进，一次一个切片）。
- **`/build auto`** — 如有需要先生成 plan，获得一次批准，然后不间断地实现*每一个* task。

`$ARGUMENTS` 用于选择模式。将 `auto`（规范写法）或 `all` 视为 autonomous 模式；其他任何值（或空）都是默认的 single-task 模式。注意：autonomous 模式并不会让*单个 task* 更快 —— 它运行同样的 test-driven loop —— 它只是去掉了 task *之间*的人工介入。

## 默认：单个 task

从 plan 中选择下一个 pending task。然后：

1. 阅读该 task 的 acceptance criteria
2. 加载相关上下文（现有代码、patterns、types）
3. 为预期行为编写一个失败测试（RED）
4. 实现能让测试通过的最小代码（GREEN）
5. 运行完整 test suite 检查 regressions
6. 运行 build 验证 compilation
7. 使用描述性 message 提交
8. 标记该 task 完成并停止

## Autonomous：整个 plan（`/build auto`）

当 spec 已存在、你想把 plan + build 合并为一次运行时使用。它去掉的是 task 之间的人工介入 —— 而**不是**验证。每个 task 仍然必须拿到通过的测试和自己的 commit。

1. **要求有 spec。** 只在已知路径查找 spec：仓库根目录的 `SPEC.md`、`docs/SPEC.md`，或 `spec/` 下的文件。README 或随便某个文档**不**算数。如果都不存在，停止并告诉用户先运行 `/spec` —— 不要凭空编造需求。
2. **建立干净的 baseline。** 运行 `git status --porcelain`。如果存在预期 planning 产物（`SPEC.md`、`docs/SPEC.md`、`spec/*`、`tasks/plan.md`、`tasks/todo.md`）之外的未提交变更，停止并请用户 commit、stash 或确认如何处理。autonomous 的按 task 提交绝不能吸收无关的本地工作，否则干净回滚的保证就被破坏了。
3. **如有需要先生成 plan。** 如果没有 `tasks/plan.md`，调用 agent-skills:planning-and-task-breakdown 生成一份。
4. **单一检查点。** 展示完整 plan 并等待明确的肯定答复（例如 "approve"、"go"、"yes"）。将含糊的回应（"看起来合理"、"我猜行吧"）视为**未**批准。这是唯一的人工门禁 —— 批准后即自主运行。如果你生成了 `tasks/plan.md`，现在就把它作为一个单独的准备性 commit 提交，避免它混进第一个 task 的 commit。
5. **按 dependency 顺序执行每一个 task。** 使用每个 task 声明的 dependencies；如果不明确，就按 plan 中列出的顺序执行。对每个 task，运行上面完整的默认循环（RED → GREEN → regression → build → commit → 标记完成）。只 stage 该 task 触及的文件加上其 task 状态更新 —— 绝不盲目 `git add -A` —— 每个 task 一个 commit，这样任何时点都是一个干净的回滚点。
6. **停止并询问用户**（不要硬推）当：
   - 某个测试无法通过，或 build 被破坏且没有明显的修法 → 遵循 agent-skills:debugging-and-error-recovery
   - spec 含糊，或某个 task 需要一个 spec 未覆盖的决策
   - 某个 task 高风险或不可逆 —— auth/permission 变更、破坏性数据迁移、支付、删除、部署、任何触及 secrets 的事，**或任何你无法用 `git revert` 撤销的事** → 遵循 agent-skills:doubt-driven-development 并在继续之前获得明确签核

   用户解决阻塞项后，重新运行 `/build auto` —— 它会从下一个 pending task 恢复。
7. **最后总结：** 完成的 tasks、新增的 tests、提交的 commits，以及任何被跳过、被标记或留给用户的事项。

如果任何步骤失败，遵循 agent-skills:debugging-and-error-recovery skill。
