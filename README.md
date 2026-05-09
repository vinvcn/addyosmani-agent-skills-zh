# Agent Skills

**面向 AI coding agents 的生产级工程技能。**

Skills 会编码资深工程师构建软件时使用的工作流、质量门禁和最佳实践。本包将这些流程打包，让 AI agents 在开发的每个阶段都能一致执行。

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

---

## 命令

7 个 slash commands 对应开发生命周期。每个命令都会自动激活合适的 skills。

| 你正在做什么 | 命令 | 核心原则 |
|-------------------|---------|---------------|
| 定义要构建什么 | `/spec` | 先写 spec，再写代码 |
| 规划如何构建 | `/plan` | 小而原子的任务 |
| 增量构建 | `/build` | 一次一个切片 |
| 证明它能工作 | `/test` | 测试就是证据 |
| 合并前审查 | `/review` | 改善代码健康度 |
| 简化代码 | `/code-simplify` | 清晰优先于炫技 |
| 发布到生产 | `/ship` | 越快越安全 |

Skills 也会根据你正在做的事自动激活：设计 API 会触发 `api-and-interface-design`，构建 UI 会触发 `frontend-ui-engineering`，以此类推。

---

## 快速开始

<details>
<summary><b>Claude Code（推荐）</b></summary>

**Marketplace 安装：**

```
/plugin marketplace add vinvcn/addyosmani-agent-skills-zh
/plugin install agent-skills@addy-agent-skills
```

> **遇到 SSH 错误？** Marketplace 会通过 SSH clone 仓库。如果你没有在 GitHub 上配置 SSH keys，可以[添加你的 SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)，或使用完整 HTTPS URL 强制走 HTTPS clone：
> ```bash
> /plugin marketplace add https://github.com/vinvcn/addyosmani-agent-skills-zh.git
> /plugin install agent-skills@addy-agent-skills
> ```

**本地 / 开发：**

```bash
git clone https://github.com/vinvcn/addyosmani-agent-skills-zh.git
claude --plugin-dir /path/to/agent-skills
```

</details>

<details>
<summary><b>Cursor</b></summary>

将任意 `SKILL.md` 复制到 `.cursor/rules/`，或引用完整的 `skills/` 目录。参见 [docs/cursor-setup.md](docs/cursor-setup.md)。

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

通过 AGENTS.md 和 `skill` tool 使用 agent 驱动的 skill 执行。

参见 [docs/opencode-setup.md](docs/opencode-setup.md)。

</details>

<details>
<summary><b>GitHub Copilot</b></summary>

将 `agents/` 中的 agent definitions 用作 Copilot personas，并在 `.github/copilot-instructions.md` 中使用 skill 内容。参见 [docs/copilot-setup.md](docs/copilot-setup.md)。

</details>

<details>
  <summary><b>Kiro IDE & CLI </b></summary>
  Kiro 的 skills 位于 ".kiro/skills/" 下，可以存放在 Project 或 Global 层级。Kiro 也支持 Agents.md。参见 Kiro 文档：https://kiro.dev/docs/skills/
</details>

<details>
<summary><b>Codex / 其他 Agents</b></summary>

Skills 是普通 Markdown，适用于任何接受 system prompts 或 instruction files 的 agent。参见 [docs/getting-started.md](docs/getting-started.md)。

</details>



---

## 全部 21 个 Skills

上面的命令是入口点。这个包总共包含 21 个 skills，每个都是带步骤、验证门禁和反合理化表格的结构化工作流。你也可以直接引用任意 skill。

### Meta - 发现适用的 skill

| Skill | 它做什么 | 何时使用 |
|-------|-------------|----------|
| [using-agent-skills](skills/using-agent-skills/SKILL.md) | 将传入工作映射到正确的 skill 工作流，并定义共享操作规则 | 开始会话或判断哪个 skill 适用时 |

### Define - 澄清要构建什么

| Skill | 它做什么 | 何时使用 |
|-------|-------------|----------|
| [idea-refine](skills/idea-refine/SKILL.md) | 通过结构化的发散/收敛思考，将模糊想法转成具体提案 | 你有一个粗略概念，需要进一步探索时 |
| [spec-driven-development](skills/spec-driven-development/SKILL.md) | 在写任何代码之前，编写覆盖目标、命令、结构、代码风格、测试和边界的 PRD | 开始新项目、功能或重要变更时 |

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
| [shipping-and-launch](skills/shipping-and-launch/SKILL.md) | 发布前 checklists、feature flag lifecycle、staged rollouts、rollback procedures、monitoring setup | 准备部署到生产时 |

---

## Agent Personas

用于定向 review 的预配置 specialist personas：

| Agent | 角色 | 视角 |
|-------|------|-------------|
| [code-reviewer](agents/code-reviewer.md) | Senior Staff Engineer | 按“staff engineer 会批准吗？”标准做五轴 code review |
| [test-engineer](agents/test-engineer.md) | QA Specialist | 测试策略、覆盖率分析和 Prove-It pattern |
| [security-auditor](agents/security-auditor.md) | Security Engineer | 漏洞检测、威胁建模和 OWASP assessment |

---

## 参考 Checklists

Skills 在需要时会拉取的快速参考材料：

| Reference | 覆盖内容 |
|-----------|--------|
| [testing-patterns.md](references/testing-patterns.md) | Test structure、naming、mocking、React/API/E2E examples、anti-patterns |
| [security-checklist.md](references/security-checklist.md) | Pre-commit checks、auth、input validation、headers、CORS、OWASP Top 10 |
| [performance-checklist.md](references/performance-checklist.md) | Core Web Vitals targets、frontend/backend checklists、measurement commands |
| [accessibility-checklist.md](references/accessibility-checklist.md) | Keyboard nav、screen readers、visual design、ARIA、testing tools |

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

```
agent-skills/
├── skills/                            # 21 core skills (SKILL.md per directory)
│   ├── idea-refine/                   #   Define
│   ├── spec-driven-development/       #   Define
│   ├── planning-and-task-breakdown/   #   Plan
│   ├── incremental-implementation/    #   Build
│   ├── context-engineering/           #   Build
│   ├── source-driven-development/     #   Build
│   ├── doubt-driven-development/      #   Build
│   ├── frontend-ui-engineering/       #   Build
│   ├── test-driven-development/       #   Build
│   ├── api-and-interface-design/      #   Build
│   ├── browser-testing-with-devtools/ #   Verify
│   ├── debugging-and-error-recovery/  #   Verify
│   ├── code-review-and-quality/       #   Review
│   ├── code-simplification/          #   Review
│   ├── security-and-hardening/        #   Review
│   ├── performance-optimization/      #   Review
│   ├── git-workflow-and-versioning/   #   Ship
│   ├── ci-cd-and-automation/          #   Ship
│   ├── deprecation-and-migration/     #   Ship
│   ├── documentation-and-adrs/        #   Ship
│   ├── shipping-and-launch/           #   Ship
│   └── using-agent-skills/            #   Meta: how to use this pack
├── agents/                            # 3 specialist personas
├── references/                        # 4 supplementary checklists
├── hooks/                             # Session lifecycle hooks
├── .claude/commands/                  # 7 slash commands (Claude Code)
├── .gemini/commands/                  # 7 slash commands (Gemini CLI)
└── docs/                              # Setup guides per tool
```

---

## 为什么需要 Agent Skills？

AI coding agents 默认会走最短路径，这通常意味着跳过 specs、tests、security reviews，以及让软件可靠的那些实践。Agent Skills 为 agents 提供结构化工作流，强制执行资深工程师对生产代码采用的同等纪律。

每个 skill 都编码了来之不易的工程判断：*何时* 写 spec、*测试什么*、*如何* review，以及 *何时* ship。这些不是通用 prompts，而是带观点、流程驱动的工作流，能把生产级工作和原型级工作区分开。

Skills 内置了来自 Google 工程文化的最佳实践，包括 [Software Engineering at Google](https://abseil.io/resources/swe-book) 和 Google 的 [engineering practices guide](https://google.github.io/eng-practices/) 中的概念。你会在 API design 中看到 Hyrum's Law，在 testing 中看到 Beyonce Rule 和 test pyramid，在 code review 中看到 change sizing 和 review speed norms，在 simplification 中看到 Chesterton's Fence，在 git workflow 中看到 trunk-based development，在 CI/CD 中看到 Shift Left 和 feature flags，以及一个把代码视为负债的专用 deprecation skill。这些不是抽象原则，而是直接嵌入 agents 所遵循的逐步工作流中。

---

## 贡献

Skills 应该是 **specific**（可执行步骤，而不是模糊建议）、**verifiable**（带证据要求的清晰退出标准）、**battle-tested**（基于真实工作流）和 **minimal**（只包含正确引导 agent 所需的内容）。

格式规范见 [docs/skill-anatomy.md](docs/skill-anatomy.md)，贡献指南见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 许可证

MIT - 你可以在自己的 projects、teams 和 tools 中使用这些 skills。
