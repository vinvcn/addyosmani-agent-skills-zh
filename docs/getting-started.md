# agent-skills 入门

agent-skills 适用于任何接受 Markdown instructions 的 AI coding agent。本指南覆盖通用方式。特定工具的设置见对应专门指南。

想在搭建自己的项目之前先看一个完整示例？[交互式教程](https://skills.addy.ie/tutorials/)会带你走一遍绿地项目构建、棕地功能开发，以及一个安全的自动化循环，附带可用于 Claude Code、Codex 或任何其他 agent 的可复制 prompts。

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
- **When to use** —— 表明该 skill 适用的触发条件
- **Process** —— 分步工作流
- **Verification** —— 如何确认工作完成
- **Common rationalizations** —— agent 可能用来跳过步骤的借口
- **Red flags** —— skill 被违反的信号

### 3. 将 skill 加载到你的 agent

将相关 `SKILL.md` 内容复制到你的 agent 的 system prompt、rules file 或 conversation 中。最常见方式：

**System prompt:** 在会话开始时粘贴 skill 内容。

**Rules file:** 将 skill 内容添加到项目的 rules file（CLAUDE.md、.cursorrules 等）。

**Conversation:** 下达指令时引用 skill："Follow the test-driven-development process for this change."

### 4. 在需要时用 meta-skill 做发现

如果你的 agent 不原生路由 skills，就先加载 `using-agent-skills` skill。它包含一个 flowchart，可将任务类型映射到合适的 skill。

如果你的 host 已经能根据 skills 的 descriptions 发现并激活它们，就不要再把 `using-agent-skills` 粘贴进常驻的 system prompt 或 rules file。那会给同一个任务造出两个路由器。改为安装各个单独的 skills，让 host 按需激活。

### 既有项目不需要迁移

从既有项目的根目录、用你的 agent 常规的 setup 路径安装这个包，然后继续在该项目中工作。Skills 会为匹配的任务激活；它们不要求新的仓库布局，也不要求对既有代码做一次性转换。

不要把本仓库根目录的 `AGENTS.md` 或 `CLAUDE.md` 复制进你的项目。
那些文件是为 agent-skills 自身的贡献者做配置的。只添加你的 agent
常规读取的 skills 和项目专属 instructions。如果要在成熟 codebase 中
渐进铺开，请遵循 [Adoption Guide](adoption-guide.md)。

## 推荐设置

要在真实项目中铺开？**[Adoption Guide](adoption-guide.md)** 覆盖两条端到端路径：绿地项目从第一天起走完整生命周期，以及成熟 codebase 的渐进式、verification-first 铺开。下面的设置是速览版。

### Minimal（从这里开始）

将三个核心 skills 加载到你的 rules file：

1. **spec-driven-development** —— 用于定义要构建什么
2. **test-driven-development** —— 用于证明它能工作
3. **code-review-and-quality** —— 用于在合并前验证质量

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
| `web-performance-auditor.md` | Core Web Vitals 与性能审计（通过 `/webperf`） |

当你需要 specialized review 时，加载一个 agent definition。例如，要求你的 coding agent “review this change using the code-reviewer agent persona”，并提供该 agent definition。

## 使用 Commands

`.claude/commands/` 目录包含 Claude Code 的 slash commands：

| Command | Skill Invoked |
|---------|---------------|
| `/spec` | spec-driven-development |
| `/constraints` | constraint-driven-development |
| `/plan` | planning-and-task-breakdown |
| `/build` | incremental-implementation + test-driven-development |
| `/build auto` | planning-and-task-breakdown → incremental-implementation + test-driven-development（整个 plan，一次批准） |
| `/test` | test-driven-development |
| `/review` | code-review-and-quality |
| `/code-simplify` | code-simplification |
| `/ship` | shipping-and-launch |
| `/webperf` | web-performance-auditor（specialist agent，仅限 web 应用） |

> **注意：** 作为 Claude Code plugin 安装时，你可能看到类似
> _"Default commands/ folder is ignored because the manifest sets 'commands'"_ 的警告。
> 这是预期行为。根目录的 `commands/` 属于 Antigravity CLI，
> 与 `.claude/commands/` 是有意分开的。所有 Claude Code slash
> commands 都能从 `.claude/commands/` 正常加载；该警告只是外观问题。

## 使用 References

`references/` 目录包含 supplementary checklists：

| Reference | Use With |
|-----------|----------|
| `testing-patterns.md` | test-driven-development |
| `performance-checklist.md` | performance-optimization |
| `security-checklist.md` | security-and-hardening |
| `accessibility-checklist.md` | frontend-ui-engineering |
| `definition-of-done.md` | 所有 skills / 每个变更 |
| `observability-checklist.md` | observability-and-instrumentation |
| `orchestration-patterns.md` | doubt-driven-development |

当你需要超出 skill 覆盖范围的详细 patterns 时，加载一个 reference。

如果你用 `npx skills add ... --skill <name>` 只安装一个 skill，被复制的
只有所选的 `skills/<name>/` 目录。该 skill 仍可使用，但指向仓库级
`references/` 目录中补充 checklist 的路径会不可用。请改用整仓库集成、clone 仓库，或把
所需的 checklist 复制到已安装 skill 内部的 `references/` 目录。
这个可移植性缺口在
[addyosmani/agent-skills#361](https://github.com/addyosmani/agent-skills/issues/361) 中跟踪。

## Spec 和 task artifacts

`/spec` 和 `/plan` commands 会创建 working artifacts（`SPEC.md`、`tasks/plan.md`、`tasks/todo.md`）。在工作进行中，将它们视为 **living documents**：

- 开发期间将它们保留在 version control 中，让 human 和 agent 拥有共享 source of truth。
- 当 scope 或 decisions 改变时更新它们。
- 如果你的 repo 不希望长期保留这些文件，请在 merge 前删除它们，或将该文件夹添加到 `.gitignore`；workflow 不要求它们永久存在。

### 跨 session 工作

同样的 artifacts 就是 session 之间的交接。小任务可以在一个 session 里跑完整个生命周期。对任何非平凡的工作，每个阶段（spec → plan → build → review）开一个新 session 能让上下文保持聚焦 —— 把工作进行下去的是那些获批的文件，而不是对话：

- spec —— `SPEC.md`，或你的 spec 实际所在的位置
- `tasks/plan.md` 和 `tasks/todo.md` —— 或者 plan 指明的外部 tracker（如果你用的话）

**切换之前**，确认这些文件反映了仍然有效的决定、你批准的 scope、尚未解决的问题、下一个任务，以及当前的验证状态（哪些测试跑过、针对什么跑的）。

**在新 session 中**，先读实际文件、看 `git status`，再做任何事。不要假定为在 artifacts 里看不到的批准。把记录下来的 "tests pass" 当作一个关于特定 baseline 的声明：如果之后代码又动了、如果记录没说清跑的是什么针对什么、或者你即将碰它覆盖的区域，就重跑它覆盖的检查。如果 baseline 仍然成立，拿上它直接做下一个任务 —— 要点是让检查的规模与改动相称，而不是每次交接都跑全量 suite。

#### 任务边界重启与 Ralph loops

`/build auto` 可以在一个 session 里跑完整份获批的 plan。它不要求、也不会为每个任务新起进程。它的每任务状态更新、验证结果和提交，让每个已完成任务成为一个可重启的边界，因此外部的合格 harness 可以在此处退出并恢复，而不依赖聊天记录。

shell 层面的 "Ralph loop" 是 harness 行为，不是另一套 skill workflow。如果你用这种循环，只在当前任务到达记录在案的边界后再重启；重新进入时，先读持久化的 artifacts 和仓库状态，再选择下一个待办任务。进程退出不是任务通过的证据，重启也不能绕过审批门禁。交接 checklist 见 `context-engineering` skill 的 **Restartable Session Boundaries** 一节。

这不需要 `/spec` 和 `/plan` wrappers —— 普通请求在任何 agent 里都有效，包括只装了 skills 的 `npx skills add` 安装：

> Read SPEC.md, then break it into small verifiable tasks with acceptance criteria and dependency order. Save them to tasks/plan.md and tasks/todo.md. No product code yet — show me the plan first.

> Read SPEC.md, tasks/plan.md and tasks/todo.md, then check where things actually stand — `git status`, plus re-running whatever checks the recorded verification state no longer covers. Tell me the next unchecked task and anything still open, then stop: I'll confirm the scope before you start it. If the plan looks incomplete, say what's missing rather than rewriting it.

## Tips

1. 对任何非平凡工作，先使用 **spec-driven-development**
2. 编写代码时始终加载 **test-driven-development**
3. **不要跳过 verification steps**，它们正是重点
4. **有选择地加载 skills**，更多上下文不一定更好
5. **使用 agents 做 review**，不同视角会捕捉不同问题
