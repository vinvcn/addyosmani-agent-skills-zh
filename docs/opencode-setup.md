# OpenCode 设置

本指南说明如何在 OpenCode 中使用 Agent Skills，并尽量贴近 Claude Code 的体验（自动选择 skill、生命周期驱动的 workflows，以及严格的流程执行）。

## 概览

OpenCode 支持自定义 `/commands`，但没有像 Claude Code 那样的原生 plugin system 或自动 skill routing。

因此，我们通过以下方式实现接近的体验：

- 强约束 system prompt（`AGENTS.md`）
- 内置 `skill` tool
- 从 `/skills` 目录进行一致的 skill discovery

这会形成一种 **agent-driven workflow**：skills 会被自动选择并执行。

虽然可以在 OpenCode 中重新创建 `/spec`、`/plan` 等 commands，但此集成刻意采用 agent-driven approach：

- 根据意图自动选择 skills
- 通过 `AGENTS.md` 强制执行 workflows
- 不需要手动调用 command

这更接近 Claude Code 的实际行为：skills 会自动触发，而不是靠手动调用。

---

## 安装

1. Clone 本仓库：

```bash
git clone https://github.com/vinvcn/addyosmani-agent-skills-zh.git
```

2. 在 OpenCode 中打开项目。

3. 确保 workspace 中存在以下文件：

- `AGENTS.md` (root)
- `skills/` directory

无需额外安装。

---

## 工作方式

### 1. Skill Discovery

所有 skills 都位于：

```
skills/<skill-name>/SKILL.md
```

OpenCode agents 会通过 `AGENTS.md` 被指示：

- 检测何时适用某个 skill
- 调用 `skill` tool
- 严格遵循该 skill

### 2. 自动调用 Skill

Agent 会评估每个请求，并将其映射到合适的 skill。

示例：

- "build a feature" → `incremental-implementation` + `test-driven-development`
- "design a system" → `spec-driven-development`
- "fix a bug" → `debugging-and-error-recovery`
- "review this code" → `code-review-and-quality`

用户**不需要**显式请求 skills。

### 3. 生命周期映射（隐式 Commands）

开发生命周期被隐式编码为：

- DEFINE → `spec-driven-development`
- PLAN → `planning-and-task-breakdown`
- BUILD → `incremental-implementation` + `test-driven-development`
- VERIFY → `debugging-and-error-recovery`
- REVIEW → `code-review-and-quality`
- SHIP → `shipping-and-launch`

这会替代 `/spec`、`/plan` 等 slash commands。

---

## 使用示例

### 示例 1：功能开发

User:
```
Add authentication to this app
```

Agent 行为：
- 检测到 feature work
- 调用 `spec-driven-development`
- 在写代码前产出 spec
- 继续进入 planning 和 implementation skills

---

### 示例 2：Bug 修复

User:
```
This endpoint is returning 500 errors
```

Agent 行为：
- 调用 `debugging-and-error-recovery`
- Reproduces → localizes → fixes → adds guards

---

### 示例 3：Code Review

User:
```
Review this PR
```

Agent 行为：
- 调用 `code-review-and-quality`
- 应用结构化 review（correctness、design、readability 等）

---

## Agent Expectations（关键）

为了让 OpenCode 正常工作，agent 必须遵循这些规则：

- 行动前始终检查是否有适用 skill
- 如果有适用 skill，必须使用
- 绝不跳过必需 workflows（spec、plan、test 等）
- 不要直接跳到 implementation

这些规则通过 `AGENTS.md` 强制执行。

---

## 限制

- 没有原生 slash commands（改由 intent mapping 处理）
- 没有 plugin system（改由 prompt + structure 处理）
- Skill invocation 依赖模型遵循规则

即便如此，这套 workflow 在实践中仍然非常接近 Claude Code。

---

## 推荐 Workflow

直接使用自然语言：

- "Design a feature"
- "Plan this change"
- "Implement this"
- "Fix this bug"
- "Review this"

Agent 会自动选择并执行正确的 skills。

---

## 总结

OpenCode 集成通过组合以下内容工作：

- 结构化 skills（本仓库）
- 强约束 agent rules（`AGENTS.md`）
- 通过推理自动调用 skill

这会形成一个**完全由 agent 驱动的生产级工程 workflow**，无需 plugins 或手动 commands。
