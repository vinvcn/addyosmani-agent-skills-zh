# Agent Skills

**面向 AI coding agents 的生产级工程技能。**

Skills 会编码资深工程师构建软件时使用的工作流、质量门禁和最佳实践。本包将这些流程打包，让 AI agents 在开发的每个阶段都能一致执行。

本仓库是 [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) 的简体中文本地化版本。

<a href="https://trendshift.io/repositories/25200" target="_blank"><img src="https://trendshift.io/api/badge/repositories/25200" alt="addyosmani%2Fagent-skills | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

![Addy's Agent Skills](https://addyosmani.com/assets/images/addys-agent-skills.jpg)

```
  DEFINE          PLAN           BUILD          VERIFY         REVIEW          SHIP
 ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐
 │ Idea │ ───▶ │ Spec │ ───▶ │ Code │ ───▶ │ Test │ ───▶ │  QA  │ ───▶ │  Go  │
 │Refine│      │  PRD │      │ Impl │      │Debug │      │ Gate │      │ Live │
 └──────┘      └──────┘      └──────┘      └──────┘      └──────┘      └──────┘
  /spec          /plan          /build        /test         /review       /ship
```

## 翻译同步

本地化刷新遵循 [.skills/translate-skill/SKILL.md](.skills/translate-skill/SKILL.md)，只同步并翻译用户可见内容，不把本仓库当作上游 Git 镜像。

- 2026-05-09: 已同步上游 `addyosmani/agent-skills@4c585c3`，本地同步提交 `dbc2a47`。已包含完整公开 docs/setup/command metadata 的简体中文本地化。
- 2026-09-13: 已同步上游 `addyosmani/agent-skills@be4e44a`，本地同步提交 `pending`。新增 `constraint-driven-development`、`interview-me`、`observability-and-instrumentation` 三个 skills，`/constraints`、`/webperf` 两个命令，`web-performance-auditor` persona，以及 Codex/Antigravity/Command Code 适配器、evals 和校验脚本；刷新全部 docs 与 skills 翻译。

---

## 命令

9 个 slash commands 对应开发生命周期。每个命令都会自动激活合适的 skills。

| 你正在做什么 | 命令 | 核心原则 |
|-------------------|---------|---------------|
| 定义要构建什么 | `/spec` | 先写 spec，再写代码 |
| 规划如何构建 | `/plan` | 小而原子的任务 |
| 增量构建 | `/build` | 一次一个切片 |
| 证明它能工作 | `/test` | 测试就是证据 |
| 设定质量标准 | `/constraints` | 定一次，处处执行 |
| 合并前审查 | `/review` | 改善代码健康度 |
| 审计 Web 性能 | `/webperf` | 先测量，再优化 |
| 简化代码 | `/code-simplify` | 清晰优先于炫技 |
| 发布到生产 | `/ship` | 越快越安全 |

想在 spec 就绪后减少手动步骤？**`/build auto`** 会在一次获批的执行中生成 plan 并实现所有任务 —— 你只需批准一次 plan，之后它会自主运行。它去掉的是任务*之间*的人工介入，而不是验证：每个任务仍然是 test-driven 并单独提交，遇到失败或高风险步骤会暂停。

Skills 也会根据你正在做的事自动激活：设计 API 会触发 `api-and-interface-design`，构建 UI 会触发 `frontend-ui-engineering`，以此类推。

---

## 快速开始

**最快路径 —— 任意 agent，一条命令。** 开源的 [skills CLI](https://github.com/vercel-labs/skills) 可安装到 70+ agents（Claude Code、Cursor、Codex、Copilot、Cline 等）：

```bash
npx skills add vinvcn/addyosmani-agent-skills-zh            # 安装全部 25 个 skills
npx skills add vinvcn/addyosmani-agent-skills-zh --list     # 安装前先浏览
```

也可以只装单个 skills：

```bash
npx skills add vinvcn/addyosmani-agent-skills-zh --skill code-review-and-quality   # 合并前的五轴 review
npx skills add vinvcn/addyosmani-agent-skills-zh --skill interview-me              # 需求访谈，一次一个问题
npx skills add vinvcn/addyosmani-agent-skills-zh --skill test-driven-development   # red-green-refactor，强制执行
```

> **只装一个 skill？** 单 skill 的 `npx` 安装只会复制
> `skills/<name>/`，不会复制仓库级的 `references/` 目录。该 skill 仍可
> 使用，但指向共享 checklists 的路径会不可用。请改用整仓库集成、clone 仓库，或把所需的 checklist 复制到
> 已安装 skill 内部的 `references/` 目录。这个可移植性缺口在
> [#361](https://github.com/addyosmani/agent-skills/issues/361) 中跟踪。

偏好原生集成？在下方选择你的工具。

<details>
<summary><b>Claude Code（推荐）</b></summary>

**Marketplace 安装：**

```
/plugin marketplace add vinvcn/addyosmani-agent-skills-zh
/plugin install agent-skills@addy-agent-skills
```

> **遇到 SSH 错误？** Marketplace 会通过 SSH clone 仓库。如果你没有在 GitHub 上配置 SSH keys，可以[添加你的 SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)，或使用完整 HTTPS URL 在 marketplace-add 步骤强制走 HTTPS clone：
> ```bash
> /plugin marketplace add https://github.com/vinvcn/addyosmani-agent-skills-zh.git
> /plugin install agent-skills@addy-agent-skills
> ```
>
> 如果 `/plugin install` 在 Windows 或 macOS 上仍然报 `git@github.com: Permission denied (publickey)`，推荐的 workaround 是配置一次 Git，让子进程 clone 时把 GitHub SSH URLs 重写为 HTTPS：
> ```bash
> git config --global url."https://github.com/".insteadOf git@github.com:
> ```

**本地 / 开发：**

```bash
git clone https://github.com/vinvcn/addyosmani-agent-skills-zh.git
claude --plugin-dir /path/to/agent-skills
```

</details>

<details>
<summary><b>Cursor</b></summary>

将 workflow skills 放在 `.cursor/skills/` 下（从 `agent-skills/skills/` 同步），把简短的 policies 放在 `.cursor/rules/*.mdc` —— 不要把完整 skills 粘贴到 rules 里。参见 [docs/cursor-setup.md](docs/cursor-setup.md)。

</details>

<details>
<summary><b>Antigravity CLI</b></summary>

作为原生 plugin 安装以获得 skills 和 subagents。在受影响的 Antigravity CLI 版本中，旧的 command TOMLs 会被报告为已转换，但其 wrapper commands 不可发现；请直接调用底层的 namespaced skills。参见 [docs/antigravity-setup.md](docs/antigravity-setup.md#lifecycle-workflows-and-command-compatibility)。

**从仓库安装：**

```bash
agy plugin install https://github.com/vinvcn/addyosmani-agent-skills-zh.git
```

**从本地 clone 安装：**

```bash
git clone https://github.com/vinvcn/addyosmani-agent-skills-zh.git
agy plugin install ./agent-skills
```

</details>

<details>
<summary><b>Gemini CLI</b></summary>

作为原生 skills 安装以便自动发现，或添加到 `GEMINI.md` 作为持久上下文。参见 [docs/gemini-cli-setup.md](docs/gemini-cli-setup.md)。

**从仓库安装：**

```bash
gemini skills install https://github.com/vinvcn/addyosmani-agent-skills-zh.git --path skills
```

**从本地 clone 安装：**

```bash
gemini skills install ./agent-skills/skills/
```

</details>

<details>
<summary><b>Windsurf</b></summary>

将 skill 内容添加到你的 Windsurf rules 配置。参见 [docs/windsurf-setup.md](docs/windsurf-setup.md)。

</details>

<details>
<summary><b>OpenCode</b></summary>

把 skills 复制到 `.opencode/skills/`（或 `~/.config/opencode/skills/`），添加项目级 `AGENTS.md`，并使用内置的 `skill` tool 进行 agent 驱动的执行。可选的 slash commands 可放在 `.opencode/commands/` 下。

参见 [docs/opencode-setup.md](docs/opencode-setup.md)。

</details>

<details>
<summary><b>GitHub Copilot</b></summary>

将 `agents/` 中的 agent definitions 用作 Copilot personas，并在 `.github/copilot-instructions.md` 中使用 skill 内容。参见 [docs/copilot-setup.md](docs/copilot-setup.md)。

使用独立的 `copilot` CLI？可将它作为 plugin 安装 —— 参见 [docs/copilot-cli-setup.md](docs/copilot-cli-setup.md)。

</details>

<details>
  <summary><b>Kiro IDE & CLI </b></summary>
  Kiro 的 skills 位于 ".kiro/skills/" 下，可以存放在 Project 或 Global 层级。Kiro 也支持 Agents.md。参见 Kiro 文档：https://kiro.dev/docs/skills/
</details>

<details>
<summary><b>Codex</b></summary>

作为原生 Codex plugin 安装（Codex CLI v0.122+）：

```bash
codex plugin marketplace add vinvcn/addyosmani-agent-skills-zh
codex plugin add agent-skills@agent-skills
```

第一条命令注册 marketplace；第二条安装 plugin。Codex 通过 `.codex-plugin/plugin.json` 直接读取根目录的 `skills/`。安装后，在对话中用 `@` 调用 skills（例如 `@spec-driven-development`）。本地安装和故障排查见 [docs/codex-setup.md](docs/codex-setup.md)。

</details>

<details>
<summary><b>Command Code</b></summary>

用内置的 `cmd skills` 命令原生安装。Command Code 会 clone 仓库、发现每个 `SKILL.md`，并安装到 `.commandcode/skills/`：

```bash
cmd skills add vinvcn/addyosmani-agent-skills-zh            # 选择要安装的 skills（项目级）
cmd skills add vinvcn/addyosmani-agent-skills-zh --global   # 为所有项目安装（~/.commandcode/skills/）
cmd skills add vinvcn/addyosmani-agent-skills-zh -s spec-driven-development  # 安装指定 skill
```

安装后的 skills 会出现在 TUI 的 slash menu 中，例如 `/spec-driven-development`。参见 [docs/commandcode-setup.md](docs/commandcode-setup.md)。

</details>

<details>
<summary><b>其他 Agents</b></summary>

Skills 是普通 Markdown，适用于任何接受 system prompts 或 instruction files 的 agent。参见 [docs/getting-started.md](docs/getting-started.md)。

</details>



---

## 采用

已经装好了？如何铺开这个包取决于你的 codebase。**[Adoption Guide](docs/adoption-guide.md)** 覆盖两条路径：为绿地项目从第一天起走完整生命周期，或为既有 codebase 做渐进式、verification-first 的铺开。

---

## 全部 24 个 Skills

上面的命令是入口点。这个包总共包含 25 个 skills —— 24 个生命周期 skills 加上 `using-agent-skills` 这个 meta-skill。每个 skill 都是带步骤、验证门禁和反合理化表格的结构化工作流。你也可以直接引用任意 skill。

### Meta - 发现适用的 skill

| Skill | 它做什么 | 何时使用 |
|-------|-------------|----------|
| [using-agent-skills](skills/using-agent-skills/SKILL.md) | 将传入工作映射到正确的 skill 工作流，并定义共享操作规则 | 开始会话或判断哪个 skill 适用时 |

### Define - 澄清要构建什么

| Skill | 它做什么 | 何时使用 |
|-------|-------------|----------|
| [interview-me](skills/interview-me/SKILL.md) | 一次一个问题的访谈，挖掘用户真正想要的（而不是他们以为自己应该要的），直到约 95% 置信度 | 需求描述不充分，或用户调用 “interview me” / “grill me” 时 |
| [idea-refine](skills/idea-refine/SKILL.md) | 通过结构化的发散/收敛思考，将模糊想法转成具体提案 | 你有一个粗略概念，需要进一步探索时 |
| [spec-driven-development](skills/spec-driven-development/SKILL.md) | 在写任何代码之前，编写覆盖目标、命令、结构、代码风格、测试和边界的 PRD | 开始新项目、功能或重要变更时 |
| [constraint-driven-development](skills/constraint-driven-development/SKILL.md) | 通过访谈为你定下带合理默认阈值的质量标准，写出 CONSTRAINTS.md，按成本安排每项检查，并能抓住 agent 为了让检查变绿而静默检查或跳过测试的行为 | 没有任何成文标准，或 agent 产出的东西多到没人读时 |

### Plan - 拆解任务

| Skill | 它做什么 | 何时使用 |
|-------|-------------|----------|
| [planning-and-task-breakdown](skills/planning-and-task-breakdown/SKILL.md) | 将 specs 分解为带验收标准和依赖顺序的小型可验证任务 | 你已经有 spec，需要可实现单元时 |

### Build - 编写代码

| Skill | 它做什么 | 何时使用 |
|-------|-------------|----------|
| [incremental-implementation](skills/incremental-implementation/SKILL.md) | 薄垂直切片：实现、测试、验证、提交。使用 feature flags、安全默认值和便于回滚的变更 | 任何触及多个文件的变更 |
| [test-driven-development](skills/test-driven-development/SKILL.md) | Red-Green-Refactor、test pyramid (80/15/5)、test sizes、DAMP over DRY、Beyonce Rule、browser testing | 实现逻辑、修 bug 或改变行为时 |
| [context-engineering](skills/context-engineering/SKILL.md) | 在正确时间向 agents 提供正确信息：rules files、context packing、MCP integrations | 开始会话、切换任务或输出质量下降时 |
| [source-driven-development](skills/source-driven-development/SKILL.md) | 让每个框架决策都基于官方文档：验证、引用来源、标记未验证内容 | 你想要任何框架或库的权威、带来源引用的代码时 |
| [doubt-driven-development](skills/doubt-driven-development/SKILL.md) | 对进行中的每个非平凡决策做对抗式 fresh-context review：CLAIM → EXTRACT → DOUBT → RECONCILE → STOP，并支持用户授权的跨模型升级 | 风险很高（生产、安全、不可逆）、在不熟悉的代码中工作，或现在验证自信输出比之后 debug 更便宜时 |
| [frontend-ui-engineering](skills/frontend-ui-engineering/SKILL.md) | Component architecture、design systems、state management、responsive design、WCAG 2.1 AA accessibility | 构建或修改面向用户的界面时 |
| [api-and-interface-design](skills/api-and-interface-design/SKILL.md) | Contract-first design、Hyrum's Law、One-Version Rule、error semantics、boundary validation | 设计 APIs、module boundaries 或 public interfaces 时 |

### Verify - 证明它能工作

| Skill | 它做什么 | 何时使用 |
|-------|-------------|----------|
| [browser-testing-with-devtools](skills/browser-testing-with-devtools/SKILL.md) | 用 Chrome DevTools MCP 获取实时运行时数据：DOM inspection、console logs、network traces、performance profiling | 构建或 debug 任何在浏览器中运行的内容时 |
| [debugging-and-error-recovery](skills/debugging-and-error-recovery/SKILL.md) | 五步 triage：reproduce、localize、reduce、fix、guard。Stop-the-line rule、安全 fallback | 测试失败、构建损坏或行为异常时 |

### Review - 合并前质量门禁

| Skill | 它做什么 | 何时使用 |
|-------|-------------|----------|
| [code-review-and-quality](skills/code-review-and-quality/SKILL.md) | 五轴 review、变更规模（约 100 行）、severity labels（Nit/Optional/FYI）、review speed norms、拆分策略 | 合并任何变更之前 |
| [code-simplification](skills/code-simplification/SKILL.md) | Chesterton's Fence、Rule of 500，在保持行为完全一致的前提下降低复杂度 | 代码能工作但比应有状态更难读或维护时 |
| [security-and-hardening](skills/security-and-hardening/SKILL.md) | OWASP Top 10 prevention、auth patterns、secrets management、dependency auditing、three-tier boundary system | 处理用户输入、auth、data storage 或 external integrations 时 |
| [performance-optimization](skills/performance-optimization/SKILL.md) | Measure-first approach、Core Web Vitals targets、profiling workflows、bundle analysis、anti-pattern detection | 存在性能要求或你怀疑有回归时 |

### Ship - 有信心地发布

| Skill | 它做什么 | 何时使用 |
|-------|-------------|----------|
| [git-workflow-and-versioning](skills/git-workflow-and-versioning/SKILL.md) | Trunk-based development、atomic commits、变更规模（约 100 行）、commit-as-save-point pattern | 进行任何代码变更时（始终适用） |
| [ci-cd-and-automation](skills/ci-cd-and-automation/SKILL.md) | Shift Left、Faster is Safer、feature flags、quality gate pipelines、failure feedback loops | 设置或修改 build 和 deploy pipelines 时 |
| [deprecation-and-migration](skills/deprecation-and-migration/SKILL.md) | Code-as-liability mindset、compulsory vs advisory deprecation、migration patterns、zombie code removal | 移除旧系统、迁移用户或下线功能时 |
| [documentation-and-adrs](skills/documentation-and-adrs/SKILL.md) | Architecture Decision Records、API docs、inline documentation standards：记录 *why* | 做架构决策、修改 APIs 或发布功能时 |
| [observability-and-instrumentation](skills/observability-and-instrumentation/SKILL.md) | Structured logging、RED metrics、OpenTelemetry tracing、基于症状的告警 —— 边构建边做 instrumentation | 添加遥测，或发布任何运行在生产环境的东西时 |
| [shipping-and-launch](skills/shipping-and-launch/SKILL.md) | 发布前 checklists、feature flag lifecycle、staged rollouts、rollback procedures、monitoring setup | 准备部署到生产时 |

---

## Agent Personas

用于定向 review 的预配置 specialist personas：

| Agent | 角色 | 视角 |
|-------|------|-------------|
| [code-reviewer](agents/code-reviewer.md) | Senior Staff Engineer | 按“staff engineer 会批准吗？”标准做五轴 code review |
| [test-engineer](agents/test-engineer.md) | QA Specialist | 测试策略、覆盖率分析和 Prove-It pattern |
| [security-auditor](agents/security-auditor.md) | Security Engineer | 漏洞检测、威胁建模和 OWASP assessment |
| [web-performance-auditor](agents/web-performance-auditor.md) | Web Performance Engineer | Core Web Vitals 审计，带 Quick/Deep 模式和 metric-honesty 规则；通过 `/webperf` 运行 |

决策矩阵、编排规则以及 personas 如何与 skills、slash commands 组合，见 [docs/agents.md](docs/agents.md)。

---

## 参考 Checklists

Skills 在需要时会拉取的快速参考材料：

| Reference | 覆盖内容 |
|-----------|--------|
| [definition-of-done.md](references/definition-of-done.md) | 每个变更都要过的项目级常驻标准，与按任务的验收标准相对照 |
| [testing-patterns.md](references/testing-patterns.md) | Test structure、naming、mocking、React/API/E2E examples、anti-patterns（JavaScript/TypeScript） |
| [security-checklist.md](references/security-checklist.md) | Pre-commit checks、auth、input validation、headers、CORS、OWASP Top 10 |
| [performance-checklist.md](references/performance-checklist.md) | Core Web Vitals targets、frontend/backend checklists、measurement commands |
| [accessibility-checklist.md](references/accessibility-checklist.md) | Keyboard nav、screen readers、visual design、ARIA、testing tools |
| [observability-checklist.md](references/observability-checklist.md) | On-call 问题、structured logging、RED/USE metrics、tracing、基于症状的告警、发布前门禁 |
| [orchestration-patterns.md](references/orchestration-patterns.md) | 认可的 multi-persona 编排模式、反模式，以及 “personas 不调用 personas” 规则 |

---

## Skills 如何工作

每个 skill 都遵循一致的 anatomy：

```
┌─────────────────────────────────────────────────┐
│  SKILL.md                                       │
│                                                 │
│  ┌─ Frontmatter ─────────────────────────────┐  │
│  │ name: lowercase-hyphen-name               │  │
│  │ description: Guides agents through [task].│  │
│  │              Use when…                    │  │
│  └───────────────────────────────────────────┘  │                                                                                                
│  Overview         → What this skill does        │
│  When to Use      → Triggering conditions       │
│  Process          → Step-by-step workflow       │
│  Rationalizations → Excuses + rebuttals         │
│  Red Flags        → Signs something's wrong     │
│  Verification     → Evidence requirements       │
└─────────────────────────────────────────────────┘
```

**关键设计选择：**

- **流程，而不是散文。** Skills 是 agents 遵循的工作流，不是它们阅读的参考文档。每个 skill 都有步骤、检查点和退出标准。
- **反合理化。** 每个 skill 都包含一张表，列出 agents 常用来跳过步骤的借口（例如“我稍后再补测试”）以及对应的反驳。
- **验证不可协商。** 每个 skill 都以证据要求收尾：测试通过、构建输出、运行时数据。“看起来对”永远不够。
- **渐进式披露。** `SKILL.md` 是入口点。支持性参考只在需要时加载，从而最小化 token 使用。

---

## 项目结构

可移植核心放在共享目录中。各 host 专属路径是原生发现约定，不是品牌别名；重命名或合并它们会破坏扫描这些精确位置的工具。

| 层 / 使用者 | 仓库路径 | 用途 |
|---|---|---|
| 共享工作流核心 | `skills/`（25 个 skills） | 每个集成都会使用的可移植 `SKILL.md` 工作流 |
| 共享 review 材料 | `agents/`（4 个 personas）、`references/`（7 个 checklists） | specialist reviewers 和整仓库安装携带的包级 checklists |
| Claude Code 适配器 | `.claude/commands/`（9 个命令）、`.claude-plugin/`、`hooks/` | Slash-command wrappers、marketplace metadata 和 lifecycle hooks |
| Gemini CLI 适配器 | `.gemini/commands/`（9 个命令） | Gemini 原生 TOML command wrappers |
| Antigravity CLI 适配器 | `commands/`（9 个命令）、`plugin.json` | 旧版 TOML wrappers 和根级 plugin manifest；见[已知 wrapper 限制](docs/antigravity-setup.md#lifecycle-workflows-and-command-compatibility) |
| Codex 适配器 | `.codex-plugin/`、`.agents/plugins/` | Codex plugin metadata 和 marketplace 注册；Codex 直接消费 `skills/` |
| GitHub Copilot CLI 适配器 | `plugin.json` | 根级 plugin metadata；Copilot CLI 按约定发现 `skills/`，不注册 lifecycle wrappers |
| 贡献者工具 | `scripts/`（13 个脚本）、`evals/`（25 个 case 文件）、`.github/workflows/` | 校验、路由 evals 和 CI |
| 文档 | `docs/` | 通用指南和各工具 setup 指南 |

没有 checked-in 适配器目录的工具，会把共享的 `skills/` 核心安装或复制到自己的原生位置。[快速开始](#快速开始)链接了每个受支持 host 的 setup 指南。

---

## 为什么需要 Agent Skills？

AI coding agents 默认会走最短路径，这通常意味着跳过 specs、tests、security reviews，以及让软件可靠的那些实践。Agent Skills 为 agents 提供结构化工作流，强制执行资深工程师对生产代码采用的同等纪律。

每个 skill 都编码了来之不易的工程判断：*何时* 写 spec、*测试什么*、*如何* review，以及 *何时* ship。这些不是通用 prompts，而是带观点、流程驱动的工作流，能把生产级工作和原型级工作区分开。

Skills 内置了来自 Google 工程文化的最佳实践，包括 [Software Engineering at Google](https://abseil.io/resources/swe-book) 和 Google 的 [engineering practices guide](https://google.github.io/eng-practices/) 中的概念。你会在 API design 中看到 Hyrum's Law，在 testing 中看到 Beyonce Rule 和 test pyramid，在 code review 中看到 change sizing 和 review speed norms，在 simplification 中看到 Chesterton's Fence，在 git workflow 中看到 trunk-based development，在 CI/CD 中看到 Shift Left 和 feature flags，以及一个把代码视为负债的专用 deprecation skill。这些不是抽象原则，而是直接嵌入 agents 所遵循的逐步工作流中。

---

## 与其他方案的比较

想知道它与 [Superpowers](https://github.com/obra/superpowers) 或 [Matt Pocock's skills](https://github.com/mattpocock/skills) 相比如何？参见 **[docs/comparison.md](docs/comparison.md)**，其中如实并排比较了三者的定位差异和各自的适用场景 —— 包括一个受控[对比实验](https://www.linkedin.com/pulse/superpowers-vs-agent-skills-faster-shipping-safer-reasoning-om-mishra-dzakf/)的链接。

---

## 贡献

Skills 应该是 **specific**（可执行步骤，而不是模糊建议）、**verifiable**（带证据要求的清晰退出标准）、**battle-tested**（基于真实工作流）和 **minimal**（只包含正确引导 agent 所需的内容）。

格式规范见 [docs/skill-anatomy.md](docs/skill-anatomy.md)，贡献指南见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 团队

agent-skills 由以下人员构建和维护：

| | 姓名 | GitHub | 角色 |
|---|------|--------|------|
| <img src="https://github.com/addyosmani.png?size=120" width="60" height="60" alt="Addy Osmani"> | **Addy Osmani** | [@addyosmani](https://github.com/addyosmani) | 创建者 |
| <img src="https://github.com/federicobartoli.png?size=120" width="60" height="60" alt="Federico Bartoli"> | **Federico Bartoli** | [@federicobartoli](https://github.com/federicobartoli) | 协作者 |
| <img src="https://github.com/nucliweb.png?size=120" width="60" height="60" alt="Joan León"> | **Joan León** | [@nucliweb](https://github.com/nucliweb) | 协作者 |

---

## 许可证

MIT - 你可以在自己的 projects、teams 和 tools 中使用这些 skills。
