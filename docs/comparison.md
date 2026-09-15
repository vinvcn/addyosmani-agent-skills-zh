<!--
  This document is for developers evaluating the project. It is NOT a skill and
  is not meant to be loaded into an agent's context. It lives in docs/ so it
  stays out of the agent's working set.
-->

# agent-skills 横向对比

大家经常问 **agent-skills** 和另外两个听到最多的 "coding agents 的 skills" 集合是什么关系：**Superpowers**（Jesse Vincent / obra）和 **Matt Pocock's skills**。三个都很优秀，共享大量基因，都值得学习。这一页诚实地画出它们在*形态*上的差异，帮你选出契合自己工作方式的那个，或者在三者之间互相借鉴。

> **TL;DR** — 它们优化的时刻不同。**agent-skills** 组织的是*整个产品生命周期*（Define、Plan、Build、Verify、Review、Ship），配有 review personas、anti-rationalization 守卫，以及仓库内的 eval 框架来检查 skills 确实会正确路由并执行。**Superpowers** 偏向*自主、重推理*的长程运行，用 subagents、严格的 pipeline 和 worktree 隔离。**Matt Pocock's skills** 是一套*锋利、有观点的 Claude Code 工具箱*，浓缩自一位专家的日常 workflow，标志性设计是 "grill me" 审问循环。抽象地讲没有"最好"；取决于你面前的工作。

---

## 一览

| | **agent-skills** | **Superpowers** | **Matt Pocock's skills** |
|---|---|---|---|
| **核心理念** | 把完整的资深工程生命周期编码成 skills | 建立在可组合 skills 之上的完整开发*方法论* | 一位专家的 Claude Code workflow，开源并持续演进 |
| **组织原则** | SDLC **阶段**（Define 到 Ship），背后是 meta-skill router | 单一有纪律的循环：brainstorm、plan、execute、review | 聚焦且可组合的 commands 精选工具箱 |
| **目录规模** | 25 个 skills，覆盖整个生命周期 | 约 14 个 skills，深耕内部构建循环 | 约 30 个 skills，分为 engineering / productivity / in-progress / deprecated |
| **生命周期覆盖** | 广：idea 精炼、API 和 UI 设计、安全、性能、CI/CD、可观测性、deprecation、ADR、发布 | 深而窄：TDD、debugging、planning、review、skill 编写 | 偏重 Define 和 Build：grilling、PRD、issues、TDD、架构、bug triage、知识管理 |
| **入口点** | Slash commands 与阶段 1:1 映射（`/spec` `/plan` `/build` `/test` `/review` `/code-simplify` `/ship`，另有 `/webperf`），带 `/build auto` 全计划模式 | Skill 串联的 pipeline（`brainstorming`、`writing-plans`、`subagent-driven-development`） | Slash commands（`/grill-me`、`/tdd`、`/to-prd`、`/diagnosing-bugs`、`/grill-with-docs`） |
| **特色机制** | 每个 skill 都有 anti-rationalization 表格和 Red Flags；`/ship` 中并行的 review **personas**；reference checklists；CI 中的**三层 eval 框架** | Subagent 驱动的开发，带 task reviewer（spec + 质量）和 fix loop；git-worktree 隔离；skills-that-write-skills，经压力测试 | **grilling** 原语（一次一个问题，走设计树）；基于 seam 的 TDD；显式区分 user-invoked 和 model-invoked；issue-tracker 集成 |
| **质量度量** | 对目录跑 trigger、routing、behavioral evals（仓库内，部分在 CI） | 压力测试方法论是其哲学的核心；eval 套件本身现在放在独立的 repo | 仓库内不提供 |
| **工具覆盖** | Claude Code、Cursor、Gemini CLI、Antigravity、OpenCode、Windsurf、Copilot、Kiro、Codex、Command Code，外加 `npx skills` CLI | 覆盖最广、迭代最活跃的表面之一：Claude Code、Codex、Cursor、Copilot CLI、OpenCode、Kimi、Factory Droid、Antigravity、Pi | Claude Code 优先，通过 `npx skills add` 分发；其他 agent 兼容性参差 |
| **治理** | 积极审查并合并社区贡献；每个 skill 都附带 eval | 主要为个人创作；有大量未合并的社区 PR 积压 | 个人创作、自行合并，公开开发 |
| **最适合** | 推动一个功能走完每个阶段，每阶段都有 human checkpoint | 长的、自主的、重推理或探索式的工作 | 务实久经考验的日常循环，在需求和 TDD 上最强 |

*（我们刻意不写 star 数和采用数据：各博客引用口径差异极大，而且每周都在变。三个项目都在被积极使用和持续维护。）*

---

## 三个项目，各自的逻辑

### Superpowers (obra)

建立在可组合 skills 之上的完整软件开发*方法论*。它赌的是**自主性和前置推理**。一次 session 走一条刻意线性的 pipeline：苏格拉底式的 brainstorming 写出带日期的 spec 并允许恰好一次 handoff，然后写给"一个品味很差、没有上下文的狂热初级工程师"也能执行的详细计划，再进入 subagent 驱动的执行——每个 task 由全新 subagent 实现，task reviewer 在关闭前对 spec 符合度和代码质量都签字，被标记的问题进入 fix loop，整条分支最后由最强的模型做 review。Git worktrees 保持并行工作互相隔离，它的 `writing-skills` skill 把 TDD 应用到文档本身：没有失败的测试就不发布 skill。

它的优势是实打实的：交出一大块工作，回来看一份已经过 review 的结果，且有强力的 guardrails 防止 agent 用推理绕过流程。代价正是那份纪律的另一面。覆盖窄（它是内部循环的构建方法论，不是从安全到发布的生命周期），单一 pipeline 在小改动上显得笨重，近期的方向就是在偿还这笔成本，例如合并成单一 task reviewer，速度大约翻倍、tokens 减半。社区呼声最高、还没进箱子的是 multi-agent team 执行。

**Repo:** <https://github.com/obra/superpowers>

### Matt Pocock's skills

Matt 开源了他自己实际在用的 Claude Code skills，这个集合已经成长为一个宽大有观点的工具箱，在公众视野下组织，带有醒目的 `in-progress/` 和 `deprecated/` 目录，亲身示范 skills 所宣扬的纪律。重心不在 TDD，而在 **grilling**：一个可复用的审问循环，一次只问一个问题，沿设计树的每个分支按依赖顺序逐个解决，每个问题给出推荐答案，优先读代码库而不是问人，在你确认共同理解之前拒绝前进。`grill-me` 和 `grill-with-docs` 是它的薄包装。TDD skill 也自成一体且乐呵呵地离经叛道（"refactoring 不属于这个循环"，它属于 code review），并且刻意区分 user-invoked 和 model-invoked skills，把 agent 的 context 当作稀缺预算来管理。

它的优势是真实和锋利：这是一位很强工程师的出货方式，不是委员会设计出来的框架，而且 requirements-grilling 循环确实出色。代价：实际上 Claude Code 优先（其他 agent 上有可靠性毛刺），没有仓库内 evals 来防回归，Build 之后的生命周期覆盖薄弱，部分 skills 耦合到个人 setup wizard 和 tracker 约定。近期的工作是从单 session skills 推向通过 issue trackers 实现的多 session 编排（in-progress 的 `wayfinder`）。

**Repo:** <https://github.com/mattpocock/skills> · related: <https://github.com/mattpocock/agent-rules-books>

### agent-skills（本项目）

agent-skills 把**整个产品生命周期**组织成 skills，配一个 meta-skill（`using-agent-skills`）把任务路由到合适的 skill。每个 skill 都带有 **Common Rationalizations** 表格（agent 为跳过步骤找的借口，逐条反驳）和 **Red Flags**。Slash commands 与生命周期阶段一一对应；`/build auto` 一趟跑完整个已批准的 plan；`/ship` 并行 fan-out review **personas**（`code-reviewer`、`security-auditor`、`test-engineer`、`web-performance-auditor`），再合并成 go/no-go。它在每个阶段保留 human checkpoint，提供七份 reference checklists（包括 Definition of Done），跨绝大多数主流 agent 工具运行，其中几个支持单命令安装。

更新、也是目前差异化所在：仓库里有一套**三层 eval 框架**。Tier 1 检查结构，Tier 2 检查每个 skill 的 description 携带用户真正会说的词汇、且没有两个 skills 在 routing 上相撞（确定性的，跑在 CI），Tier 3 用每个 skill 的预期为 agent 的真实执行轨迹打分。另外两个目前都没有这种仓库内、全目录范围的度量。反向的诚实代价：agent-skills 没有 Superpowers 那样单一的、有观点的 "run"，而且三个都还没有很好地解决持久的跨 session 记忆。

---

## 真刀真枪的对决：Superpowers vs. agent-skills

Om Mishra 做了一个受控实验：同一模型、同一仓库、同一 prompt，在 Claude Code 中只改变 skill 框架，并写了文章：

**["Superpowers vs Agent-Skills: Faster Shipping, Safer Reasoning"](https://www.linkedin.com/pulse/superpowers-vs-agent-skills-faster-shipping-safer-reasoning-om-mishra-dzakf/)**，作者 Om Mishra

公允地总结：

- **agent-skills** 更快进入编码（约 8 分钟 vs 约 12 分钟），并且跑了**更多轮 validation**（7 次 vs 5 次，包括完整的测试套件）。正是这更宽的验证捕获了一个*在*即时功能*之外*、功能专属测试漏掉的兼容性问题。在那次任务上，他把 **validation 深度**的优势判给了它。
- **Superpowers** 投入了更多**前置架构推理**，对于演化中的生产系统和没有既定模式可循的探索性工作，他仍然更喜欢用它作为日常主力。
- Token 效率实际上不相上下；两边都重新规划了一次。

这是一位开发的单任务实验，不是 benchmark，但它具体地展示了核心权衡：**宽而有纪律的验证 vs. 厚重的前置推理**。他自己的结论是诚实的那一个：按任务选工具。

---

## 如何决定用什么

一览表告诉你它们的形状。实际操作是这样选。

### 从你工作的形状出发

- **一整个功能，从头到尾？** agent-skills。三个里面只有它载着你从 spec 一路走过安全、性能、发布，每个阶段都有 checkpoint，没有东西能悄悄跳过 review 或 pre-flight。
- **一大块模糊的、你想交出去然后走开的？** Superpowers。它的 pipeline 和 subagent review 就是为长时间运行而建的，交还给你的结果已经对照 spec 审过。
- **快速聚焦的日常循环，尤其在写代码前把需求搞对？** Matt Pocock's skills。grilling 循环是三者中最锋利的需求工具，而且工具箱不碍事。

### 再按你真正在乎的加权

- **覆盖广度**（安全、性能、CI/CD、可观测性、发布）：agent-skills 是明确的选择；另外两个聚焦内部循环。
- **长程自主性**：Superpowers，设计上如此。
- **小改动上的低仪式**：Pocock 的工具箱最轻；agent-skills 提供中间档（小改动可以直接跳到 `/test` 和 `/review`）；Superpowers 流程最重。
- **对 skills 本身能用的信心**：agent-skills 是唯一在仓库内带全目录 evals 的，所以 description 或 routing 回归会让 CI 失败，而不是事后变成一个神秘的 "skill 为什么没触发"。
- **需求拷问**：Pocock 的 grilling 是参考实现；agent-skills 的 `interview-me` 精神接近，并且正在增加可选的协作模式。
- **平台广度**：agent-skills 和 Superpowers 几乎到处都能跑；Pocock 在 Claude Code 上最舒服。
- **每步一个 human gate vs. 放手跑**：agent-skills 默认设置 checkpoints；Superpowers 刻意减少 mid-run check-ins。

### 具体场景

- *"发布一个新 endpoint，带 auth、测试，merge 前过一遍安全。"* agent-skills：`/spec` 到 `/ship`，security-auditor 和 test-engineer personas 在最后并行 fan-out。
- *" Overnight 重构一个棘手的子系统，早上来 review。"* Superpowers：把计划交给它，让 subagent-driven development 和 task reviewer 跑。
- *"我有个模糊的想法，而且总让 agent 猜需求。"* Pocock 的 `grill-me`（或 agent-skills 的 `interview-me`），在写任何代码之前把意图钉死。
- *"修一个明确的 bug，test-first。"* 三个都行；拿你已安装的最轻的那个。
- *"让一个工程团队在一个 repo 里统一 agents 的用法。"* agent-skills：阶段 commands、personas 和共享 checklists 给团队一套共同语言，evals 让自定义 skills 保持诚实。
- *"写自己的 skills 并确信它们正确触发。"* agent-skills，并且为那些绝不能被合理绕过的 skills 借用 Superpowers 的压力测试纪律。

### 个人 vs. 团队

对个人开发者，品味和势能取胜：选默认行为和你已有工作方式契合的那个，而且低仪式的选项往往是用得最多的。对团队，天平滑向共享结构和可强制执行的 guardrails：命名的阶段、review personas、checklists、会让 CI 失败的 evals，这些是让五个人（以及他们的 agents）收敛到同一标准而不是五套私人 workflow 的东西。这正是 agent-skills 为之构建的场景，尽管团队完全可以在其中采纳 Superpowers 的 review 纪律或 Pocock 的 grilling 循环。

### 共同的前沿（对三个都成立）

谁都没有很好地解决**持久的跨 session 记忆**：一个 agent 在某个 session 学到的东西，很少能干净地带进下一个 session。三个都在围绕它打转（learnings 文件、handoff 产物、tracker 支撑的规划地图）。如果你的瓶颈是这个，要知道你已经站在它们今天所能交付的边缘，并且准备暂时自己缝合一部分。

---

## 组合使用

你不必只选一个，但要小心地组合。这些是 Markdown skills，不是运行时，所以只挑*单个* skills 效果很好：在你的主配置旁边引入 Pocock 的 `grill-me`、一个 Superpowers 的隔离 pattern，或某份具体的 checklist。

行不通的是把其中两个同时作为你的**活跃 router**。叠放的 meta-skills 会争抢命令名（两处定义的 `/tdd`）、在 routing 逻辑上互相竞争、并带进来不同的 TDD 哲学，结果不是两全其美，而是不可预测的行为。选一个框架作为你的主要 router，其他的按单点取用。

---

## 来源

- Superpowers: <https://github.com/obra/superpowers>
- Matt Pocock's skills: <https://github.com/mattpocock/skills>
- Om Mishra, *Superpowers vs Agent-Skills*: <https://www.linkedin.com/pulse/superpowers-vs-agent-skills-faster-shipping-safer-reasoning-om-mishra-dzakf/>

*在这里发现关于其他项目的不准确之处？开个 issue 或 PR。我们宁可公平，也不愿自夸。*
