# AGENTS.md

本文件为 AI coding agents（Claude Code、Cursor、Copilot、Antigravity 等）在本仓库中处理代码时提供指导。

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

- **Skills** (`skills/<name>/SKILL.md`) — 带步骤和退出标准的工作流。即 *how*。当意图匹配时必须经过。
- **Personas** (`agents/<role>.md`) — 带视角和输出格式的角色。即 *who*。
- **Slash commands** (`.claude/commands/*.md`) — 面向用户的入口点。即 *when*。编排层。

组合规则：**用户（或 slash command）是 orchestrator。Personas 不调用其他 personas。** Persona 可以调用 skills。

本仓库唯一认可的 multi-persona orchestration pattern 是 **parallel fan-out with a merge step**，`/ship` 会用它并发运行 `code-reviewer`、`security-auditor` 和 `test-engineer`，再综合它们的报告。不要构建一个决定调用哪些其他 persona 的 "router" persona；这是 slash commands 和 intent mapping 的职责。

决策矩阵见 [agents/README.md](agents/README.md)，完整 pattern catalog 见 [references/orchestration-patterns.md](references/orchestration-patterns.md)。

**Claude Code interop:** `agents/` 中的 personas 可作为 Claude Code subagents（从本 plugin 的 `agents/` 目录自动发现）使用，也可作为 Agent Teams teammates（按名称引用来 spawn）。两个平台约束与本规则一致：subagents 不能 spawn 其他 subagents，teams 不能嵌套。Plugin agents 会静默忽略 frontmatter 字段 `hooks`、`mcpServers` 和 `permissionMode`。

## 创建新 Skill

### 目录结构

```
skills/
  {skill-name}/           # kebab-case directory name
    SKILL.md              # Required: skill definition
    scripts/              # Required: executable scripts
      {script-name}.sh    # Bash scripts (preferred)
  {skill-name}.zip        # Required: packaged for distribution
```

### 命名约定

- **Skill directory**: `kebab-case`（例如 `web-quality`）
- **SKILL.md**: 始终大写，始终使用这个精确文件名
- **Scripts**: `kebab-case.sh`（例如 `deploy.sh`、`fetch-logs.sh`）
- **Zip file**: 必须与目录名完全匹配：`{skill-name}.zip`

### SKILL.md 格式

```markdown
---
name: {skill-name}
description: {One sentence describing when to use this skill. Include trigger phrases like "Deploy my app", "Check logs", etc.}
---

# {Skill Title}

{Brief description of what the skill does.}

## How It Works

{Numbered list explaining the skill's workflow}

## Usage

```bash
bash /mnt/skills/user/{skill-name}/scripts/{script}.sh [args]
```

**Arguments:**
- `arg1` - Description (defaults to X)

**Examples:**
{Show 2-3 common usage patterns}

## Output

{Show example output users will see}

## Present Results to User

{Template for how Claude should format results when presenting to users}

## Troubleshooting

{Common issues and solutions, especially network/permissions errors}
```

### 上下文效率最佳实践

Skills 按需加载：启动时只加载 skill name 和 description。完整 `SKILL.md` 只有在 agent 判断 skill 相关时才会载入上下文。为了最小化上下文使用：

- **Keep SKILL.md under 500 lines** — 将详细参考材料放入单独文件
- **Write specific descriptions** — 帮助 agent 准确知道何时激活 skill
- **Use progressive disclosure** — 引用只在需要时读取的支持文件
- **Prefer scripts over inline code** — 执行脚本不会消耗上下文（只有输出会）
- **File references work one level deep** — 从 SKILL.md 直接链接到支持文件

### 脚本要求

- 使用 `#!/bin/bash` shebang
- 使用 `set -e` fail-fast
- 将状态消息写到 stderr：`echo "Message" >&2`
- 将 machine-readable output（JSON）写到 stdout
- 为临时文件包含 cleanup trap
- 按 `/mnt/skills/user/{skill-name}/scripts/{script}.sh` 引用脚本路径

### 创建 Zip Package

创建或更新 skill 后：

```bash
cd skills
zip -r {skill-name}.zip {skill-name}/
```

### 最终用户安装

为用户记录这两种安装方式：

**Claude Code:**
```bash
cp -r skills/{skill-name} ~/.claude/skills/
```

**claude.ai:**
将 skill 添加到 project knowledge，或将 SKILL.md 内容粘贴进对话。

如果 skill 需要网络访问，指示用户在 `claude.ai/settings/capabilities` 添加所需 domains。
