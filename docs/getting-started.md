# agent-skills 入门

agent-skills 适用于任何接受 Markdown instructions 的 AI coding agent。本指南覆盖通用方式。特定工具的设置见对应专门指南。

## Skills 如何工作

每个 skill 都是一个 Markdown 文件（`SKILL.md`），描述一个具体工程工作流。当它被加载到 agent context 中时，agent 会遵循该 workflow，包括 verification steps、需要避免的 anti-patterns 和 exit criteria。

**Skills 不是 reference docs。** 它们是 agent 会遵循的分步流程。

## 快速开始（任意 Agent）

### 1. Clone 仓库

```bash
git clone https://github.com/vinvcn/addyosmani-agent-skills-zh.git
```

### 2. 选择一个 skill

浏览 `skills/` 目录。每个子目录都包含一个 `SKILL.md`，其中有：
- **When to use** — 表明该 skill 适用的触发条件
- **Process** — 分步工作流
- **Verification** — 如何确认工作完成
- **Common rationalizations** — agent 可能用来跳过步骤的借口
- **Red flags** — skill 被违反的信号

### 3. 将 skill 加载到你的 agent

将相关 `SKILL.md` 内容复制到你的 agent 的 system prompt、rules file 或 conversation 中。最常见方式：

**System prompt:** 在会话开始时粘贴 skill 内容。

**Rules file:** 将 skill 内容添加到项目的 rules file（CLAUDE.md、.cursorrules 等）。

**Conversation:** 下达指令时引用 skill："Follow the test-driven-development process for this change."

### 4. 使用 meta-skill 做发现

先加载 `using-agent-skills` skill。它包含一个 flowchart，可将任务类型映射到合适的 skill。

## 推荐设置

### Minimal（从这里开始）

将三个核心 skills 加载到你的 rules file：

1. **spec-driven-development** — 用于定义要构建什么
2. **test-driven-development** — 用于证明它能工作
3. **code-review-and-quality** — 用于在合并前验证质量

这三个覆盖了 AI-assisted development 中最关键的质量缺口。

### 完整生命周期

如需全面覆盖，请按阶段加载 skills：

```
Starting a project:  spec-driven-development → planning-and-task-breakdown
During development:  incremental-implementation + test-driven-development
Before merge:        code-review-and-quality + security-and-hardening
Before deploy:       shipping-and-launch
```

### 上下文感知加载

不要一次加载所有 skills，这会浪费上下文。只加载与当前任务相关的 skills：

- 在做 UI？加载 `frontend-ui-engineering`
- 在 debug？加载 `debugging-and-error-recovery`
- 设置 CI？加载 `ci-cd-and-automation`

## Skill Anatomy

每个 skill 都遵循相同结构：

```
YAML frontmatter (name, description)
├── Overview — What this skill does
├── When to Use — Triggers and conditions
├── Core Process — Step-by-step workflow
├── Examples — Code samples and patterns
├── Common Rationalizations — Excuses and rebuttals
├── Red Flags — Signs the skill is being violated
└── Verification — Exit criteria checklist
```

完整规范见 [skill-anatomy.md](skill-anatomy.md)。

## 使用 Agents

`agents/` 目录包含预配置的 agent personas：

| Agent | Purpose |
|-------|---------|
| `code-reviewer.md` | 五轴 code review |
| `test-engineer.md` | 测试策略和编写 |
| `security-auditor.md` | 漏洞检测 |

当你需要 specialized review 时，加载一个 agent definition。例如，要求你的 coding agent “review this change using the code-reviewer agent persona”，并提供该 agent definition。

## 使用 Commands

`.claude/commands/` 目录包含 Claude Code 的 slash commands：

| Command | Skill Invoked |
|---------|---------------|
| `/spec` | spec-driven-development |
| `/plan` | planning-and-task-breakdown |
| `/build` | incremental-implementation + test-driven-development |
| `/test` | test-driven-development |
| `/review` | code-review-and-quality |
| `/ship` | shipping-and-launch |

## 使用 References

`references/` 目录包含 supplementary checklists：

| Reference | Use With |
|-----------|----------|
| `testing-patterns.md` | test-driven-development |
| `performance-checklist.md` | performance-optimization |
| `security-checklist.md` | security-and-hardening |
| `accessibility-checklist.md` | frontend-ui-engineering |

当你需要超出 skill 覆盖范围的详细 patterns 时，加载一个 reference。

## Spec 和 task artifacts

`/spec` 和 `/plan` commands 会创建 working artifacts（`SPEC.md`、`tasks/plan.md`、`tasks/todo.md`）。在工作进行中，将它们视为 **living documents**：

- 开发期间将它们保留在 version control 中，让 human 和 agent 拥有共享 source of truth。
- 当 scope 或 decisions 改变时更新它们。
- 如果你的 repo 不希望长期保留这些文件，请在 merge 前删除它们，或将该文件夹添加到 `.gitignore`；workflow 不要求它们永久存在。

## Tips

1. 对任何非平凡工作，先使用 **spec-driven-development**
2. 编写代码时始终加载 **test-driven-development**
3. **不要跳过 verification steps**，它们正是重点
4. **有选择地加载 skills**，更多上下文不一定更好
5. **使用 agents 做 review**，不同视角会捕捉不同问题
