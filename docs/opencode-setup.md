# OpenCode 设置

本指南说明如何在 OpenCode 中使用 Agent Skills。可复用资产是 `skills/` 目录里的 markdown skills；本仓库根目录的 `AGENTS.md` 是仓库范围的配置，不应复制到其它项目里。

## 概览

OpenCode 从多个位置发现 skills。Agent Skills 提供两种可选的使用风格：

- **Agent 驱动 workflow：** 通过内置的 `skill` tool 和一份你自己为仓库编写的项目级 `AGENTS.md`，自动选择 skills。
- **Command 驱动 workflow：** 用 `.opencode/commands/` 手动调用生命周期命令（可选）。

## 安装

把这些 skills 引入项目有两种方式：

1. 用 `skills` CLI 安装（最快）。
2. Clone 本仓库后手动复制 skill 目录。

两种方式完成后，创建你自己的项目级 `AGENTS.md`，并在需要时复制 `.opencode/commands/*.md` 文件。

### 选项 1：用 `npx skills` 安装

最快的路径是开源的 [`skills` CLI](https://github.com/vercel-labs/skills)：

```bash
npx skills add vinvcn/addyosmani-agent-skills-zh            # install selected skills
npx skills add vinvcn/addyosmani-agent-skills-zh --list     # browse before installing
```

安装单个 skill：

```bash
npx skills add vinvcn/addyosmani-agent-skills-zh --skill spec-driven-development
```

默认情况下 `npx skills` 会装进工具专属目录（常见是 `.claude/skills/` 或某个共享位置）。OpenCode 能发现装在那里的 skills，因为它会读取 `.claude/skills/<name>/SKILL.md` 和通用的 `.agents/skills/<name>/SKILL.md` 路径。

如果 skills 落在了 OpenCode 不扫描的位置，把它们复制或软链到下面列出的某个发现路径，例如：

```bash
mkdir -p .opencode/skills
cp -r .claude/skills/<skill-name> .opencode/skills/
```

> **注意：** 单 skill 安装只会复制 skill 目录本身。如果某个 skill 引用了 `references/` 下的共享文件，请把这些文件一并复制进已安装的 skill 目录，或安装整个包。背景见 [#361](https://github.com/addyosmani/agent-skills/issues/361)。

### 选项 2：Clone 本仓库

1. Clone 仓库：

```bash
git clone https://github.com/vinvcn/addyosmani-agent-skills-zh.git
```

2. 把需要的 skills 复制到某个 OpenCode skill 发现路径。

#### 项目级安装

```bash
mkdir -p .opencode/skills
cp -r /path/to/agent-skills/skills/<skill-name> .opencode/skills/
```

例如安装 `spec-driven-development` 和 `incremental-implementation`：

```bash
mkdir -p .opencode/skills
cp -r /path/to/agent-skills/skills/spec-driven-development .opencode/skills/
cp -r /path/to/agent-skills/skills/incremental-implementation .opencode/skills/
```

#### 全局安装

```bash
mkdir -p ~/.config/opencode/skills
cp -r /path/to/agent-skills/skills/<skill-name> ~/.config/opencode/skills/
```

#### 跨工具兼容路径

OpenCode 也会发现放在 Claude 兼容或通用 agent 路径中的 skills：

- `.claude/skills/<name>/SKILL.md`
- `~/.claude/skills/<name>/SKILL.md`
- `.agents/skills/<name>/SKILL.md`
- `~/.agents/skills/<name>/SKILL.md`

如果你已经在 Claude Code 和 OpenCode 之间共享 skills，这些位置都可以。

### 该复制什么

复制 `skills/` 下的目录（例如 `skills/spec-driven-development/`）。每个目录必须包含一个 `SKILL.md` 文件。不要复制仓库根目录的 `AGENTS.md` 或 `CLAUDE.md`；那些文件是为开发本仓库自身做配置的。

## 项目的 `AGENTS.md`

在**你自己的项目**根目录创建 `AGENTS.md`。这是告诉 OpenCode 何时、如何调用已安装 skills 的 system prompt。与 `addyosmani/agent-skills` 里仓库范围的 `AGENTS.md` 不同，这个文件属于你，应当按你的技术栈调整。

下面是一份可以直接粘贴进你项目 `AGENTS.md` 的模板：

```markdown
# Agent Skills (OpenCode)

This project uses skills installed under `.opencode/skills/` (or a compatible path).

## Core Rules

- If a task matches a skill, invoke it with the `skill` tool before acting.
- Skills are located in `.opencode/skills/<skill-name>/SKILL.md`.
- Follow the skill workflow strictly; do not partially apply it.
- Never skip required steps such as spec, plan, or test when a skill demands them.

## Intent → Skill Mapping

Map the user's intent to the matching skill automatically:

- Feature / new functionality → `spec-driven-development`, then `incremental-implementation` and `test-driven-development`
- Planning / breakdown → `planning-and-task-breakdown`
- Bug / failure / unexpected behavior → `debugging-and-error-recovery`
- Code review → `code-review-and-quality`
- Refactoring / simplification → `code-simplification`
- API or interface design → `api-and-interface-design`
- UI work → `frontend-ui-engineering`

## Execution Model

For every request:

1. Determine if any skill applies (even a small chance).
2. Load the skill with `skill({ name: "<skill-name>" })`.
3. Follow the skill workflow exactly.
4. Only proceed to implementation once required steps are complete.
```

把它保存为你项目根目录的 `AGENTS.md`。OpenCode 会自动加载。

> **注意：** `addyosmani/agent-skills` 仓库内的根 `AGENTS.md` 面向在本仓库工作的贡献者，不应复制到其它项目。参见 [CONTRIBUTING.md](../CONTRIBUTING.md#仓库级文件)。

## 工作方式

### 1. Skill Discovery

OpenCode 会依次扫描以下路径（先项目级，再全局）：

- `.opencode/skills/<name>/SKILL.md`
- `~/.config/opencode/skills/<name>/SKILL.md`
- `.claude/skills/<name>/SKILL.md`
- `~/.claude/skills/<name>/SKILL.md`
- `.agents/skills/<name>/SKILL.md`
- `~/.agents/skills/<name>/SKILL.md`

每个 skill 必须包含一个 `SKILL.md` 文件，其 frontmatter 中要有有效的 `name` 和 `description`。

### 2. 自动调用 Skill

当你项目的 `AGENTS.md` 指示 agent 使用 skills 时，agent 会评估每个请求并映射到合适的 skill。

示例：

- "build a feature" → `incremental-implementation` + `test-driven-development`
- "design a system" → `spec-driven-development`
- "fix a bug" → `debugging-and-error-recovery`
- "review this code" → `code-review-and-quality`

### 3. 生命周期映射（隐式 Commands）

OpenCode 不要求 slash commands，但如果你喜欢显式命令，见下一节。在 agent 驱动模式下，生命周期是隐式映射的：

- DEFINE → `spec-driven-development`
- PLAN → `planning-and-task-breakdown`
- BUILD → `incremental-implementation` + `test-driven-development`
- VERIFY → `debugging-and-error-recovery`
- REVIEW → `code-review-and-quality`
- SHIP → `shipping-and-launch`

### 复制可选的 slash commands

如果你喜欢显式命令，把本仓库的示例 command 文件复制进你的项目，并按你安装的 skills 调整它们：

```bash
mkdir -p .opencode/commands
cp /path/to/agent-skills/.opencode/commands/*.md .opencode/commands/
```

> **注意：** 本仓库的 `main` 分支目前不包含 `.opencode/commands/*.md`。你可以自己编写 command 文件，或关注 PR #200（提议添加这些文件）。一旦它们存在，上面的模式即可适用。

一个典型的 command 文件如下：

```markdown
---
description: Break work into small verifiable tasks
---

Invoke the planning-and-task-breakdown skill. Read the spec and create tasks with acceptance criteria.
```

把它保存为 `.opencode/commands/plan.md`，即可在 OpenCode 中启用 `/plan`。

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

### 示例 2：Bug 修复

User:
```
This endpoint is returning 500 errors
```

Agent 行为：
- 调用 `debugging-and-error-recovery`
- Reproduces → localizes → fixes → adds guards

### 示例 3：Code Review

User:
```
Review this PR
```

Agent 行为：
- 调用 `code-review-and-quality`
- 应用结构化 review（correctness、design、readability 等）

## Agent Expectations

要让 OpenCode 正常工作，agent 应当：

- 行动前始终检查是否有适用 skill
- 适用时用 `skill` tool 加载该 skill
- 绝不跳过必需 workflows（spec、plan、test 等）
- 不要直接跳到 implementation

这些规则由你项目的 `AGENTS.md` 强制执行，而不是由 skill 自身的副本强制执行。

## 限制

- Skill invocation 依赖模型对规则的遵循。
- OpenCode 不会自动安装 skills；请复制或安装你需要的目录。
- 如果某个 skill 引用了 `references/` 下的文件，手动安装时你可能需要一并复制那些文件。

## 总结

1. 安装你需要的 skills：用 `npx skills add vinvcn/addyosmani-agent-skills-zh`，或从本仓库的 clone 把目录复制到 `.opencode/skills/`（项目级）、`~/.config/opencode/skills/`（全局），或某个跨工具兼容路径如 `.claude/skills/` / `.agents/skills/`。
2. 用上面的规则和 intent mapping 创建你自己的项目级 `AGENTS.md`。
3. OpenCode 会发现这些 skills，你的 `AGENTS.md` 引导 agent 调用它们。
4. 可选：添加 `.opencode/commands/*.md` 以获得显式 slash commands。

这样，可复用资产（skills）就与仓库专属配置（`addyosmani/agent-skills` 的根 `AGENTS.md`）保持分离。
