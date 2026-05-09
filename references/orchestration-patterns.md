# 编排模式

本仓库认可的 agent 编排模式参考目录，以及需要避免的反模式。添加会协调多个 personas 的新 slash command 前，或引入一个“包装”现有 personas 的新 persona 前，请先阅读本文。

治理规则：**用户（或 slash command）是 orchestrator。Personas 不调用其他 personas。** Skills 是 persona 工作流中的强制步骤。

---

## 认可模式

### 1. 直接调用（无编排）

单个 persona、单一视角、单个产物。默认选择，也是成本最低的选择。

```
user → code-reviewer → report → user
```

**适用场景：** 工作是针对一个产物的单一视角，并且可以用一句话描述。

**示例：**
- "审查这个 PR" → `code-reviewer`
- "查找 `auth.ts` 中的安全问题" → `security-auditor`
- "checkout flow 缺少哪些测试？" → `test-engineer`

**成本：** 一次往返。这是你始终应该拿来对比编排模式的基线。

---

### 2. 单 persona slash command

一个 slash command 用项目 skills 包装单个 persona。让用户不必每次都重新解释工作流。

```
/review → code-reviewer (with code-review-and-quality skill) → report
```

**适用场景：** 同一个单 persona 调用会以相同设置反复发生。

**本仓库示例：** `/review`、`/test`、`/code-simplify`。

**成本：** 与直接调用相同。slash command 只是保存好的 prompt。

**反信号：** 如果 slash command 的主体主要是“决定要调用哪个 persona”，删除它，让用户直接调用 persona。

---

### 3. 并行 fan-out 后合并

多个 personas 同时处理同一个输入，各自产生独立报告。合并步骤（在 main agent 的上下文中）将它们综合成一个决策。

```
                    ┌─→ code-reviewer    ─┐
/ship → fan out  ───┼─→ security-auditor ─┤→ merge → go/no-go + rollback
                    └─→ test-engineer    ─┘
```

**适用场景：**
- 子任务真正独立（没有共享可变状态，没有顺序依赖）
- 每个 sub-agent 都能从自己的 context window 中受益
- 合并步骤足够小，可以留在 main context 中完成
- Wall-clock latency 很重要

**本仓库示例：** `/ship`。

**成本：** N 个并行 sub-agent contexts + 一个 merge turn。成本高于直接调用，但 wall-clock 更快，报告质量也更好，因为每个 sub-agent 都专注于自己的单一视角。

**采用该模式前的验证清单：**
- [ ] 我能否同时运行所有 sub-agents，且没有顺序问题？
- [ ] 每个 persona 是否产生不同*类型*的发现，而不是从不同角度重复同一发现？
- [ ] merge step 是否能放进 main agent 剩余的 context？
- [ ] 用户等待时间是否足够长，使并行性真的有可感知收益？

如果任何答案是“否”，退回直接调用或单 persona command。

---

### 4. 由用户驱动的顺序 slash command pipeline

用户按定义好的顺序运行 slash commands，在步骤之间携带 context（或 commit history）。没有 orchestrator agent - 用户就是 orchestrator。

```
user runs:  /spec  →  /plan  →  /build  →  /test  →  /review  →  /ship
```

**适用场景：** 工作流存在依赖（每一步都需要前一步的输出），并且步骤之间的人类判断有价值。

**本仓库示例：** 完整的 DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP 生命周期。

**成本：** 每一步一个 sub-agent context。对编排层免费，因为没有 orchestrator agent。

**为什么不自动化：** LLM “lifecycle orchestrator” 会 (a) 因为必须为 hand-off 总结而丢失步骤间细节，(b) 跳过能及早发现方向错误的人类检查点，(c) 通过转述回合使 token 成本翻倍。

---

### 5. 研究隔离（保留 context）

当任务需要阅读大量材料，而这些材料不应污染 main context 时，spawn 一个 research sub-agent，只返回 digest。

```
main agent → research sub-agent (reads 50 files) → digest → main agent continues
```

**适用场景：**
- 主会话需要专注于下游任务
- 调查结果远小于它消费的输入
- main agent 在调查后保留思考空间会提升决策质量

**示例：** “在 monorepo 中找到这个 deprecated API 的每个 call site”，“总结这 30 个 ADRs 对 caching 的说明”。

**成本：** 一个隔离的 sub-agent context。只要替代方案是把数百个文件加载进 main context，就值得使用。

**在 Claude Code 中，使用内置 `Explore` subagent**，不要定义自定义 research persona。`Explore` 运行在 Haiku 上，被拒绝 write/edit tools，并且专为该模式构建。只有当 `Explore` 不适合时（例如你需要模型无法自行推断的领域专属 system prompt），才定义自定义 research subagent。

---

## Claude Code 兼容性

这个目录与 harness 无关，但大多数读者会在 Claude Code 上运行它。下面说明每种模式如何映射到 Claude Code 的 primitives，以及平台在哪些地方替我们强制执行规则。

### Personas 存放位置

Plugin subagents 放在 plugin 根目录的 `agents/` 中。本仓库是一个 plugin（`.claude-plugin/plugin.json`），因此启用 plugin 后会自动发现 `agents/code-reviewer.md`、`agents/security-auditor.md` 和 `agents/test-engineer.md`。不需要配置路径。

### Subagents vs. Agent Teams

Claude Code 有两种并行 primitive。模式 3（并行 fan-out 后合并）映射到 **subagents**。如果需要能彼此交谈的 teammates，请改用 **Agent Teams**。

| | Subagents | Agent Teams |
|--|-----------|-------------|
| 协调方式 | Main agent fan out，sub-agents 只回报 | Teammates 互相发消息，共享 task list |
| Context | 每个 subagent 自己的 context window | 每个 teammate 自己的 context window |
| 何时使用 | 产生报告的独立任务 | 需要讨论的协作工作 |
| 状态 | 稳定 | 实验性 - 需要 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |
| 成本 | 较低 | 较高 - 每个 teammate 都是一个独立 Claude instance |

**本仓库中的 personas 可在两种模式下工作。** 作为 subagents spawn 时（例如由 `/ship` spawn），它们向 main session 报告 findings。作为 teammates spawn 时（`Spawn a teammate using the security-auditor agent type…`），它们可以直接挑战彼此的 findings。Persona definition 相同，只有 spawning context 不同。

一个细节：persona 中的 `skills` 和 `mcpServers` frontmatter fields 在作为 subagent 运行时会被尊重，但**作为 teammate 运行时会被忽略** - teammates 会从你的 project 和 user settings 加载 skills 和 MCP servers，和普通 session 一样。如果某个 persona 依赖特定 skill 或 MCP server 已加载，请在 session level 配置，使它在两种模式下都可用。

### 平台强制执行的规则

本目录中的两条规则不只是约定 - Claude Code 会强制执行它们：

- **"Subagents cannot spawn other subagents"**（来自 docs 的原文）。反模式 B（persona-calls-persona）和反模式 D（深层 persona trees）在 Claude Code 上从构造上就不可能存在。
- **"No nested teams"** - teammates 不能 spawn 自己的 teams。同样的反模式在 team level 被阻止。

这意味着你可以采用本目录中的模式，而不用担心 contributors 意外构建这些反模式。它们只会加载失败。

### 需要了解的内置 subagents

定义自定义 subagent 前，检查这些是否已经覆盖对应角色：

| Built-in | 用途 |
|----------|---------|
| `Explore` | 只读 codebase search 和 analysis。用于模式 5（研究隔离）。 |
| `Plan` | plan mode 中的只读 research。 |
| `general-purpose` | 需要 exploration 和 modification 的多步任务。 |

不要重新定义这些。在它们之上叠加你的 specialist personas（code-reviewer、security-auditor、test-engineer）。

### Plugin agents 的 frontmatter 限制

Plugin subagents **不**支持 `hooks`、`mcpServers` 或 `permissionMode` frontmatter fields - 这些字段会被静默忽略。如果未来某个 persona 需要其中任一字段，用户必须把文件复制到 `.claude/agents/` 或 `~/.claude/agents/`。

Plugin agents 中可用的字段包括：`name`、`description`、`tools`、`disallowedTools`、`model`、`maxTurns`、`skills`、`memory`、`background`、`effort`、`isolation`、`color`、`initialPrompt`。如果想优化成本，可以按 persona 使用 `model`（例如 Haiku 用于 `test-engineer` coverage scans，Sonnet 用于 `code-reviewer`，Opus 用于 `security-auditor`）。

### 并行 spawn 多个 subagents

在 Claude Code 中，并行 fan-out（模式 3）需要在**同一个 assistant turn 中发出多个 Agent tool calls**。顺序回合会串行化执行。`/ship` 明确指出了这一点。任何新的 orchestrator command 也应如此。

---

## 工作示例：用 Agent Teams 做竞争假设调试

这个示例展示何时应该使用 **Agent Teams**，而不是 `/ship` 的 subagent fan-out。两种模式远看很像 - 都 spawn 相同的三个 personas - 但价值来源不同。

### 场景

> *Checkout 偶尔会在完成前卡住约 30 秒。大约每 50 个 sessions 发生一次。日志中没有错误。问题从上周发布后开始。*

可能的根因（互斥，且都符合症状）：

1. 新 payment-confirmation flow 中的 race condition
2. 一个 auth check 偶尔落到慢速 synchronous network call
3. 某个 query 缺少 index，随 cart size 扩大而变慢
4. 某个 flaky third-party API，SDK 在 timeout 前静默 retry

单个 agent 会选择第一个看起来合理的理论，然后停止调查。`/ship` 风格的 subagent fan-out 会让每个 persona 独立报告 - 但它们的报告彼此不会相遇，因此无法排除错误理论。

这正是 Agent Teams docs 描述的场景：*“多个独立调查者主动尝试反驳彼此时，存活下来的理论更可能是真正的根因。”*

### 为什么这*不是* `/ship` 的工作

| | `/ship` (subagents) | Agent Teams |
|--|--------------------|-------------|
| Sub-agents 看到 | 同一个 diff，不同 lens | 一个共享 task list，以及彼此的 messages |
| 输出 | 三份独立报告 → 一个 merge | 对抗式 debate → 共识 root cause |
| 适合场景 | 你想对已知 artifact 得到 verdict | 你想在多个 hypotheses 中*找到* artifact |

`/ship` 是 verdict；Agent Teams 是 investigation。

### 设置（每个环境一次）

Agent Teams 是实验性的。在 `~/.claude/settings.json` 中：

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

需要 Claude Code v2.1.32 或更高版本。本仓库中的 personas 会自动被拾取 - 不需要手写 team-config files。

### 触发 prompt

在 lead session 中用自然语言输入：

```
Users report checkout hangs for ~30 seconds intermittently after last
week's release. No errors in logs.

Create an agent team to debug this with competing hypotheses. Spawn
three teammates using the existing agent types:

  - code-reviewer  — investigate race conditions and blocking calls
                     in the checkout code path
  - security-auditor — investigate auth checks, session handling,
                       and any synchronous network calls added recently
  - test-engineer  — propose tests that would distinguish between the
                     hypotheses and check coverage gaps in checkout

Have them message each other directly to challenge each other's
theories. Update findings as consensus emerges. Only converge when
two teammates agree they can disprove the others'.
```

Lead 会引用现有 persona names spawn 三个 teammates。Persona body 会作为额外 instructions **追加** 到每个 teammate 的 system prompt（叠加在 lead 安装的 team-coordination instructions 之上）；上面的 trigger prompt 会成为它们的任务。

### 会发生什么

1. 每个 teammate 在自己的 context window 中运行，从自己的 lens 探索 codebase。
2. Teammates 使用 `message` 直接互相发送 findings。Lead 不需要中转。
3. 共享 task list 显示谁在调查什么 - 可随时用 `Ctrl+T`（in-process mode）或 tmux pane（split mode）查看。
4. 当 `code-reviewer` 发现一个本应顺序执行的 `Promise.all` 时，它会发消息给 `security-auditor`，确认 auth call 是否不是 race 的一部分。`security-auditor` 检查并回复 - 要么确认 race 是真正问题，要么提供反证。
5. `test-engineer` 为领先理论提出一个聚焦的 integration test，team 用它在宣布共识前验证。
6. Lead 综合收敛后的发现并呈现给你。

你可以通过 `Shift+Down` 循环到任何 teammate 并输入内容来 interrupt - 这在重定向走错方向的 investigator 时很有用。

### 何时清理

当调查落到某个 root cause 后，告诉 lead：

```
Clean up the team
```

始终通过 lead cleanup，而不是 teammate（根据 docs：teammates 缺少完整 team context，无法清理）。

### 成本预期

三个 Sonnet teammates 运行约 10-15 分钟调查，成本会明显高于由 `/ship` 以 subagents 方式 spawn 同样三个 personas。理由是*结论质量* - 在 production debugging 中，错误修复的代价很高，额外 tokens 很划算。对于常规 PR review，坚持使用 `/ship`。

### 这个场景中的反模式

**不要**把它重建成 fan out subagents 的 `/debug` slash command。Subagents 不能互相发消息 - 你会失去让该模式成立的对抗式 debate。如果某个 workflow 反复出现，把上面的 trigger prompt 文档化为 snippet，而不是包装成误用 subagents 的 slash command。

### 什么时候*不*使用 Agent Teams

- 对已知 diff 做 production-bound verdict → 使用 `/ship` (subagents)。
- 对一个 artifact 做一个 specialist perspective → 直接调用 persona。
- 顺序生命周期（spec → plan → build）→ 用户驱动的 slash commands（模式 4）。
- 大量读取、只需小 digest 的 research → 内置 `Explore` subagent。

只有当 teammates **需要**互相挑战才能得出正确答案时，才使用 Agent Teams。

---

## 反模式

### A. Router persona（“meta-orchestrator”）

一个 persona 的职责是决定要调用哪个其他 persona。

```
/work → router-persona → "this needs a review" → code-reviewer → router (paraphrases) → user
```

**失败原因：**
- 纯 routing 层，没有领域价值
- 增加两次 paraphrasing hops → 信息损失 + 约 2× token 成本
- 用户已经知道自己想要 review；他们本可以直接调用 `/review`
- 重复了 slash commands 和 `AGENTS.md` 中 intent mapping 已经做的工作

**替代做法：** 添加或改进 slash commands。在 `AGENTS.md` 中记录 intent → command mapping。

---

### B. 调用另一个 persona 的 persona

一个 `code-reviewer` 在看到 auth code 时内部调用 `security-auditor`。

**失败原因：**
- Personas 被设计为产生单一视角；串联它们会破坏这一点
- 调用 persona 传递的摘要会丢失被调用 persona 需要的 context
- Failure modes 成倍增加（哪个 persona 的 output format 获胜？谁的规则适用？）
- 对用户隐藏成本

**替代做法：** 让调用 persona 在报告中*建议*后续 audit。由用户或 slash command 运行第二轮。

---

### C. 会转述的顺序 orchestrator

一个 agent 代表用户调用 `/spec`，再调用 `/plan`，再调用 `/build`，依此类推。

**失败原因：**
- 丢失能发现方向错误的人类检查点
- 每次 hand-off 都会总结 context - 长 pipeline 中会累积 drift
- Token 成本翻倍：每一步都有 orchestrator turn + sub-agent turn
- 在最需要判断的节点移除了用户 agency

**替代做法：** 保持用户作为 orchestrator。在 `README.md` 中记录推荐顺序，让用户调用它。

---

### D. 深层 persona trees

`/ship` 调用一个 `pre-ship-coordinator`，后者调用 `quality-coordinator`，后者再调用 `code-reviewer`。

**失败原因：**
- 每一层都增加 latency 和 tokens，却没有决策价值
- Debugging 会变成多层级调查
- 叶子 personas 会因多次 summarization steps 丢失 context

**替代做法：** 将编排深度保持在最多 1 层（slash command → personas）。Merge 在 main agent 中发生。

---

## 决策流程

考虑新的编排 workflow 时，按这个流程走：

```
Is the work one perspective on one artifact?
├── Yes → Direct invocation. Stop.
└── No  → Will the same composition repeat?
         ├── No  → Direct invocation, ad hoc. Stop.
         └── Yes → Are sub-tasks independent?
                  ├── No  → Sequential slash commands run by user (Pattern 4).
                  └── Yes → Parallel fan-out with merge (Pattern 3).
                           Validate against the checklist above.
                           If any check fails → fall back to single-persona command (Pattern 2).
```

---

## 何时向本目录添加新模式

只有满足以下条件后，才添加新条目：

1. 你已经在真实工作中至少使用过该模式两次
2. 你能指出本仓库中展示该模式的具体 artifact
3. 你能解释为什么现有模式无法胜任
4. 你能描述它的反模式阴影（人们会误构建什么）

过早添加目录条目会变成没人遵循的愿望式文档。
