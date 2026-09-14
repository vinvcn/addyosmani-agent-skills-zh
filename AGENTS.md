# AGENTS.md

本文件为 AI coding agents（Claude Code、Cursor、Copilot、Antigravity 等）在本仓库中处理代码时提供指导。

> **适用范围：** 本文件为在 [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills) 仓库本身上工作的 agents 提供配置。它不应被复制到其他项目或全局 agent 配置中；可复用的资产是 `skills/` 里的 skills，而不是这个文件。

## 仓库概览

面向资深软件工程师的 Claude.ai 和 Claude Code skills 集合。Skills 是打包后的 instructions 和 scripts，用于扩展 Claude 以及你的 coding agents 的能力。

## OpenCode 集成

OpenCode 使用由 `skill` tool 和本仓库 `/skills` 目录驱动的 **skill-driven execution model**。

### 核心规则

- 如果任务匹配某个 skill，你 MUST 调用它
- Skills 位于 `skills/<skill-name>/SKILL.md`
- 如果有适用 skill，绝不要直接实现
- 始终严格遵循 skill instructions（不要只部分应用）

### 意图 → Skill 映射

Agent 应自动将用户意图映射到 skills：

- Feature / new functionality → `spec-driven-development`，然后 `incremental-implementation`、`test-driven-development`
- Planning / breakdown → `planning-and-task-breakdown`
- Bug / failure / unexpected behavior → `debugging-and-error-recovery`
- Code review → `code-review-and-quality`
- Refactoring / simplification → `code-simplification`
- API or interface design → `api-and-interface-design`
- UI work → `frontend-ui-engineering`

### 生命周期映射（隐式命令）

OpenCode 不支持 `/spec` 或 `/plan` 这样的 slash commands。

因此，agent 必须在内部遵循这个生命周期：

- DEFINE → `spec-driven-development`
- PLAN → `planning-and-task-breakdown`
- BUILD → `incremental-implementation` + `test-driven-development`
- VERIFY → `debugging-and-error-recovery`
- REVIEW → `code-review-and-quality`
- SHIP → `shipping-and-launch`

### 执行模型

对每个请求：

1. 判断是否有任何 skill 适用（即使只有 1% 可能）
2. 使用 `skill` tool 调用合适的 skill
3. 严格遵循 skill workflow
4. 仅在完成必需步骤（spec、plan 等）后再进入实现

### 反合理化

以下想法是错误的，必须忽略：

- "This is too small for a skill"
- "I can just quickly implement this"
- "I’ll gather context first"

正确行为：

- 始终先检查并使用 skills

这能确保 OpenCode 的行为类似具备完整 workflow enforcement 的 Claude Code。

## 编排：Personas、Skills 和 Commands

本仓库有三个可组合层。它们职责不同，不应混淆：

- **Skills** (`skills/<name>/SKILL.md`) — 带步骤和退出标准的工作流。即 *how*。意图匹配时必须经过。
- **Personas** (`agents/<role>.md`) — 带视角和输出格式的角色。即 *who*。
- **Slash commands** (`.claude/commands/*.md`) — 面向用户的入口点。即 *when*。编排层。

组合规则：**用户（或 slash command）是 orchestrator。Personas 不调用其他 personas。** Persona 可以调用 skills。

本仓库唯一认可的 multi-persona orchestration pattern 是 **parallel fan-out with a merge step**：`/ship` 用它并发运行 `code-reviewer`、`security-auditor` 和 `test-engineer`，再综合它们的报告。不要构建一个决定调用哪些其他 persona 的 "router" persona；这是 slash commands 和 intent mapping 的职责。

决策矩阵见 [docs/agents.md](docs/agents.md)，完整 pattern catalog 见 [references/orchestration-patterns.md](references/orchestration-patterns.md)。

**Claude Code interop:** `agents/` 中的 personas 可作为 Claude Code subagents（从本 plugin 的 `agents/` 目录自动发现）使用，也可作为 Agent Teams teammates（按名称引用来 spawn）。两个平台约束与本规则一致：subagents 不能 spawn 其他 subagents，teams 不能嵌套。Plugin agents 会静默忽略 frontmatter 字段 `hooks`、`mcpServers` 和 `permissionMode`。

## 创建新 Skill

> **开始之前：** 先运行 [CONTRIBUTING.md](CONTRIBUTING.md#before-proposing-a-new-skill) 中的预检：搜索目录、检查 open PRs（`gh pr list --state open`）、确认想法符合 [docs/skill-anatomy.md](docs/skill-anatomy.md)，并在 PR 描述中论证这个缺口。大多数新 skill 想法都与某个现有 skill 或某个 open PR 重叠；能扩展现有 skill，就优先于新增一个近似重复的 skill。CONTRIBUTING.md 是这套工作流的唯一权威来源。

本仓库的 skills 以 markdown 为主：每个 skill 位于 `skills/<kebab-case-name>/SKILL.md`，带 YAML frontmatter（`name`、`description`），并遵循 section anatomy（Overview、When to Use、Process、Common Rationalizations、Red Flags、Verification）。只有当 skill 附带可运行的 helpers 时才添加 `scripts/` 目录；大多数 skills 只有 markdown，也没有按 skill 打包的 zip 包。

完整格式、命名约定、frontmatter 规则、supporting-file 阈值和写作原则，见 [docs/skill-anatomy.md](docs/skill-anatomy.md)，它是 skill 结构的唯一权威来源。不要在这里复述那些指导，链接过去即可。
