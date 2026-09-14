# 在 GitHub Copilot 中使用 agent-skills

本指南覆盖 VS Code 中的 Copilot。独立的 `copilot` 命令行工具请见 [copilot-cli-setup.md](copilot-cli-setup.md)。

**一次安装实际给你的东西：** skills。每个安装的 skill 会变成一个以其 frontmatter `name` 命名的 slash command —— `/spec-driven-development`、`/test-driven-development`，依此类推。`npx skills add vinvcn/addyosmani-agent-skills-zh` 和下面的手动复制方式都只安装 skills。这两条路径都不会复制本仓库简短的生命周期 wrappers（`/spec`、`/plan`、`/build`、`/test`、`/review`、`/ship`）—— 那些是住在 `.claude/commands/` 里的 Claude Code commands。请使用完整 skill 名，或自己添加别名 —— 见 [Lifecycle workflows](#lifecycle-workflows)。

## 设置

### Copilot Instructions

Copilot 支持通过仓库中的 `.github/skills`、`.claude/skills` 或 `.agents/skills` 目录创建 agent skills。

```bash
mkdir -p .github/skills/test-driven-development .github/skills/code-review-and-quality

# Create files for essential skills
cat /path/to/agent-skills/skills/test-driven-development/SKILL.md > .github/skills/test-driven-development/SKILL.md
cat /path/to/agent-skills/skills/code-review-and-quality/SKILL.md > .github/skills/code-review-and-quality/SKILL.md
```

无论你用上面哪条路径，结果都是：在这三个项目级路径之一下面，每个 skill 目录一个 `SKILL.md`。用 global/user flag 运行的 installer 会写到别处 —— 查看它的输出确认实际写入路径。在 Copilot Chat 中运行 `/skills` 打开 **Configure Skills** 菜单，确认哪些被发现并加载了。

更多细节参见 [Creating agent skills for GitHub Copilot](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-skills) 和 VS Code 的 [agent skills](https://code.visualstudio.com/docs/agent-customization/agent-skills) 指南。

### Agent Personas (*.agent.md)

Copilot 支持专门的 agent personas。使用 agent-skills 中的 agents：

> **重要：** GitHub Copilot 要求自定义 agent 文件命名为 `*.agent.md`。
> 命名为 `*.md` 的文件会被 Copilot 静默忽略。
> 细节见 [VS Code custom agents docs](https://code.visualstudio.com/docs/copilot/customization/custom-agents#_custom-agent-file-structure)。

```bash
# Create the agents directory and copy agent definitions
mkdir -p .github/agents
cp /path/to/agent-skills/agents/code-reviewer.md .github/agents/code-reviewer.agent.md
cp /path/to/agent-skills/agents/test-engineer.md .github/agents/test-engineer.agent.md
cp /path/to/agent-skills/agents/security-auditor.md .github/agents/security-auditor.agent.md
```

在 Copilot Chat 中调用 agents：
- `@code-reviewer Review this PR`
- `@test-engineer Analyze test coverage for this module`
- `@security-auditor Check this endpoint for vulnerabilities`

### Custom Instructions（用户级）

对于你希望在所有仓库中使用的 skills：

1. 打开 VS Code → Settings → GitHub Copilot → Custom Instructions
2. 添加你最常用的 skill 摘要

## 推荐配置

### .github/copilot-instructions.md

GitHub Copilot 支持通过 `.github/copilot-instructions.md` 提供项目级 instructions。

```markdown
# Project Coding Standards

## Testing
- Write tests before code (TDD)
- For bugs: write a failing test first, then fix (Prove-It pattern)
- Test hierarchy: unit > integration > e2e (use the lowest level that captures the behavior)
- Run `npm test` after every change

## Code Quality
- Review across five axes: correctness, readability, architecture, security, performance
- Every PR must pass: lint, type check, tests, build
- No secrets in code or version control

## Implementation
- Build in small, verifiable increments
- Each increment: implement → test → verify → commit
- Never mix formatting changes with behavior changes

## Boundaries
- Always: Run tests before commits, validate user input
- Ask first: Database schema changes, new dependencies
- Never: Commit secrets, remove failing tests, skip verification
```

### Specialized Agents

在 Copilot Chat 中使用这些 agents 执行有针对性的 review workflow。

## Lifecycle Workflows

Skills 默认就是用户可调用的，所以一旦它们被发现，整个生命周期都以 skills 自己的名字可用，无需额外配置：

| 工作流 | Copilot 调用方式 | 说明 |
|----------|--------------------|-------|
| Define | `/spec-driven-development` | 写代码前先产出结构化 spec |
| Plan | `/planning-and-task-breakdown` | 产出 `tasks/plan.md` 和 `tasks/todo.md` |
| Build | `/incremental-implementation` | 与 `/test-driven-development` 搭配；一次一个切片 |
| Verify | `/test-driven-development` | red-green-refactor，bug 用 Prove-It |
| Review | `/code-review-and-quality` | 五轴 review |
| Ship | `/shipping-and-launch` | 发布就绪度 |

输入 `/` 可以浏览当前 workspace 里实际加载了什么。

自然语言是兜底方案，而且在任何 Copilot 界面上都有效，不管 slash commands 是否出现：

> Use the spec-driven-development skill to write a spec for [the feature].

> Use the code-review-and-quality skill to review my staged changes.

### 可选：简短的 `/spec` 风格别名

VS Code 的 extension-host local agents 支持位于 `.github/prompts/<name>.prompt.md` 的 [prompt files](https://code.visualstudio.com/docs/agent-customization/prompt-files)，每个都会变成一个 `/<name>` slash command。Agent Host **不**使用 prompt files —— 在那里请使用上面的 skill 名。

别名只是通往某个 skill 的轻量快捷方式，仅此而已。这些别名不实现本仓库 Claude Code commands 里的编排逻辑 —— `/build auto` 的单次批准 plan-and-implement 流程，以及 `/ship` 的并行 persona fan-out。在 Copilot 上复现那套东西本身就是一个独立的工作，不是一个单文件别名能覆盖的。默认优先使用 skill 名；只有当简短形式的价值配得上一份额外文件时再考虑别名。

创建一个别名，且不覆盖已有文件：

```bash
mkdir -p .github/prompts
[ -e .github/prompts/spec.prompt.md ] || cat > .github/prompts/spec.prompt.md <<'EOF'
---
description: Write a structured spec before writing code
---

Use the spec-driven-development skill.

Ask clarifying questions about the objective and target users, core features and
acceptance criteria, stack preferences and constraints, and known boundaries.
Then write a spec covering objective, commands, project structure, code style,
testing strategy, and boundaries. Save it as SPEC.md in the project root and
confirm with me before any code is written.
EOF
```

重新加载窗口，然后输入 `/spec`。

其余的，运行同样的 `mkdir`/`cat` 代码块，替换文件名（文件名*就是*命令名），并从下表取 `description` 和正文。**替换 `---` frontmatter 以下的整个正文**，而不只是 skill 名 —— spec 正文里关于 SPEC.md 和澄清问题的指令只属于 Define 阶段，留着它们会让 `/plan` 或 `/test` 去写 spec。

| 别名文件 | `description` | 完整正文（frontmatter 以下的一切） |
|------------|---------------|--------------------------------------------------|
| `.github/prompts/plan.prompt.md` | Break an approved spec into ordered, verifiable tasks | Use the planning-and-task-breakdown skill. Read the spec, then break the work into small, independently verifiable tasks, each with acceptance criteria and explicit dependency order. Save the result to `tasks/plan.md` and `tasks/todo.md`. Write no product code — show me the plan and wait for my approval. |
| `.github/prompts/build.prompt.md` | Implement the next planned task, test-first | Use the incremental-implementation and test-driven-development skills. Read `tasks/plan.md` and `tasks/todo.md`, then take the next unchecked task and only that one. Write a failing test first, make it pass, refactor, run the suite, and tick the task off. Stop there and report what changed. |
| `.github/prompts/test.prompt.md` | Write tests before the code that satisfies them | Use the test-driven-development skill. For new behavior, write a failing test that captures it before any implementation. For a bug, reproduce it with a failing test first, then fix it. Run the suite after each step and show me the red and the green output. |

正文请自己写，或从上表取用，而不要逐字复制 `.claude/commands/*.md`：那些文件把 skills 引用为 `agent-skills:<name>`，这是 Claude Code 的 plugin namespace，对 Copilot 毫无意义。

### 如果 skill 的 slash commands 没有出现

按顺序排查 —— `/spec-driven-development` 缺失和 `/spec` 缺失的原因不同：

1. **确认 skills 落在了哪里。** 每个 skill 需要自己的目录，里面有一个 `SKILL.md`。本指南使用的项目级路径是 `.github/skills/`、`.claude/skills/` 和 `.agents/skills/` —— 但用 global/user flag 运行的 installer 会写到 workspace 之外（`~/.agents/skills/` 及类似位置），所以某个不在三处之中的 skill 可能只是被装成了个人级。对照 [VS Code agent skills docs](https://code.visualstudio.com/docs/agent-customization/agent-skills) 确认实际路径，如果你想要项目级作用域，就重新安装到项目里。
2. **检查 frontmatter。** `name` 必须存在且有效 —— 它*就是* slash command。frontmatter 选择了退出用户调用的 skill 不会出现。
3. **检查 Configure Skills 菜单。** 运行 `/skills`，确认该 skill 在这里是启用状态。
4. **开一个新会话。** 新添加的 skills 不总是能在会话进行中即时生效。
5. **检查宿主。** 如果 `/spec-driven-development` 可用但你的 `/spec` 别名不可用，你多半在 Agent Host 上，它不读取 prompt files。
6. **检查版本。** VS Code（**Help → About**）和 Copilot Chat 扩展；skills-as-slash-commands 是新特性，所以哪个落后就更新哪个。

## 使用建议

1. **保持 instructions 简洁** —— Copilot instructions 聚焦时效果最好。摘要化关键规则，而不是塞入完整 skill 文件。
2. **用 agents 做 review** —— code-reviewer、test-engineer 和 security-auditor agents 是为 Copilot 的 agent model 设计的。
3. **在 chat 中引用** —— 处理某个具体阶段时，把相关 skill 内容粘贴到 Copilot Chat 作为上下文。
4. **结合 PR reviews** —— 配置 Copilot 使用 code-reviewer agent persona 来 review PR。
