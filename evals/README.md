# Skill Evals

本仓库如何衡量 skills 是否真正有效：该触发时能否 **trigger**、彼此之间能否 **保持区分**、以及能否按每个 skill 的承诺 **改变 agent 行为**。

## 既有实践（以及我们采纳了什么）

评估 `SKILL.md` skills 尚无统一的社区标准，但有两种做法走在前面：

- **Anthropic 的 skill-creator v2** 为每个 skill 定义了 `evals.json`（prompt + `expectations[]`，依据 transcript 评分），并额外用样例 prompts 测试 descriptions 的 trigger 准确率。我们在 behavioral tier 中采用它的 [`evals.json` schema](https://github.com/anthropics/skills/tree/main/skills/skill-creator)，并新增一个可选的 `kind` 字段来选择被评分的 artifact。
- **Superpowers**（obra）用 bash + `claude -p` + prompt fixtures 和 grader 脚本来测试 skills。我们的 behavioral runner 沿用同样的 headless-`claude` 模式，评分 rubric 取自 `expectations[]`。

两者都没有提供针对多 skill *catalog* 的**确定性、CI 安全**的检查：每个 skill 的 description 是否包含用户实际会说的词汇？两个 skills 的 descriptions 是否会互相碰撞？这就是下文的 Tier 2，也是本仓库新增的部分。

## 三个层级

| Tier | 检查内容 | 运行方式 | 成本 |
|---|---|---|---|
| 1. Structural | frontmatter、命名、必需 sections、command 一致性 | CI（`validate-skills.js`、`validate-commands.js`） | 免费 |
| 2. Trigger & routing | positive prompts 将对应 skill 排入 top-k；negative prompts 不会；任意两个 descriptions 不近似碰撞 | CI（`run-evals.js`） | 免费 |
| 3. Behavioral | 遵循该 skill 的 agent 能满足其 `expectations[]` | 按需（`run-evals.js --behavioral`） | Tokens |

Tier 2 是对 routing 的**词法近似**（基于 descriptions 的 stemmed TF-IDF）。它无法判断语义，那是 Tier 3 的职责；但它能抓住真实 trigger bugs 中最主要的两种失败模式：description 缺少用户会说的词汇（false negative），以及 description 过宽、压过了正确的 skill（false positive）。Tier-2 失败通常意味着*该改 description*，而不是该改 eval。

## 运行

```bash
# Tier 2 — deterministic, runs in CI
node scripts/run-evals.js
node scripts/run-evals.js --min-rank1 95  # enforce the current routing floor

# Tier 3 — behavioral, runs each eval through headless claude, then grades it
node scripts/run-evals.js --behavioral test-driven-development            # spends tokens
node scripts/run-evals.js --behavioral test-driven-development --dry-run  # prints the plan only
```

Tier 3 支持两种 behavioral artifact kinds。`execution` 是默认值：每个 eval 在一个一次性 git repository 中运行，`files[]` 声明的真实项目输入从 `evals/fixtures/` 实例化并提交为 baseline，grader 依据完整的 `--output-format stream-json --verbose` 执行 trace（包含 tool calls）评分。`dialogue` 保留给交付物就是对话本身的 skills；它不需要 fixture，grader 只评判 assistant 的对话轮次，不要求文件编辑或命令。声明 `dialogue` 是需要人工评审的豁免，不是 execution skills 的通用逃生舱。

executor 以显式 permission mode 运行（`--permission-mode acceptEdits` 加上一份预先批准的 tool list），因此 execution evals 能真正编辑文件、运行命令、检查 diffs、创建 commits，而不是被拒绝权限后只靠口头描述。Traces 在 grader prompt 中被当作不可信数据做围栏隔离，并通过 stdin 传给 grader（trace 可能有数 MB；走 argv 会撞上操作系统参数长度上限）；executor 和 grader 调用都带 timeout；grader 输出会先经 JSON 校验，再按 skill-creator 的 `grading.json` 形状写入 `evals/results/`（已 gitignore）。纪律类 skills 还包含针对时间压力、沉没成本和权威压力的 pressure cases；它们验证当 prompt 试图劝人跳过流程时，workflow 依然成立。

## Eval case 格式

每个 skill 一个文件：`evals/cases/<skill-name>.json`。

```json
{
  "skill_name": "test-driven-development",
  "trigger": {
    "positive": [
      { "prompt": "Write a failing test for this bug before fixing it", "top_k": 3 }
    ],
    "negative": [
      { "prompt": "Update the architecture diagram in the docs", "owner": "documentation-and-adrs" }
    ]
  },
  "evals": [
    {
      "id": 1,
      "kind": "execution",
      "prompt": "Finance filed the reconciliation bug written up in BUG.md. Fix it.",
      "expected_output": "A failing reproduction test for the lost-cent case, a fix preserving both README invariants (exact sum, earliest-shares fairness), the fairness invariant covered by its own test, full suite passing",
      "files": [
        "test-driven-development"
      ],
      "expectations": [
        "A test reproducing the lost-cent case from BUG.md is added and shown failing before src/split.js is modified",
        "The final implementation satisfies the full README fairness invariant (leftover cents go to the earliest shares): splitCents(10000, 3) returns [3334, 3333, 3333] as BUG.md expects and splitCents(100, 7) returns [15, 15, 14, 14, 14, 14, 14] as the README example shows; dumping the whole remainder on a single share would violate both",
        "The fairness invariant from the README has its own test case in the suite on an input with remainder of at least 2 (such as splitCents(100, 7)), where dumping the whole remainder on one share would fail it, beyond the reported lost-cent case",
        "The full suite is run with the repository's own command after the fix"
      ]
    }
  ]
}
```

- `evals[]` 使用 skill-creator 的核心 schema（`id`、`prompt`、`expected_output`、可选 `files[]`、`expectations[]`），外加本仓库可选的 `kind`。`kind` 只能是 `execution` 或 `dialogue`，为兼容性默认取 `execution`。Execution evals 要求非空 `files[]`；路径相对于 `evals/fixtures/`，可以指向文件或项目目录。Dialogue evals 可以省略 `files[]`，因为 transcript 就是 artifact。Expectations 是 grader 对照相应 artifact 核查的可验证陈述——是行为，不是措辞。
- `trigger` 是本仓库的扩展。`positive` prompts 是应当路由到这里的真实用户请求（`top_k` 默认为 3；对某个 skill 的标志性请求应收紧到 1）。`negative` prompts 属于*另一个* skill；本 skill 在它们上面不得排第一。尽可能在 `owner` 中声明那个 skill：这样 runner 会断言 owner **排名高于**本 skill，使 negative 成为真正的两两 routing 测试，而不是在 prompt 什么都不匹配时以空洞方式通过。

**写好 trigger prompts：** 用自己的话转述用户真实的说法；不要照抄 description（那是在给 eval 刷分）。如果一个真实的 prompt 因为 description 缺少对应词汇而无法排上，这是一个真实的发现——去改进 description。

## 添加 skill

每个 skill 都随附一个 eval 文件。当你添加 `skills/<name>/` 时，请同时添加 `evals/cases/<name>.json`，至少包含 3 个 positive triggers、2 个 negative triggers 和 1 个 behavioral eval。Execution evals 必须由 `evals/fixtures/<name>/` 支撑；只有当 skill 的交付物确实是对话本身时才使用 `kind: "dialogue"`。缺失 case 文件、case 数量不足、未知 kinds、非法 fixture 路径、缺少必需的 fixtures，都会是 CI 错误。

## 需要关注的指标

Tier-2 运行会打印 **trigger rank-1 rate**（positive prompts 中把自己的 skill 排到第一位的比例，而不仅是 top-k）。CI 以 `--min-rank1 95` 运行，相对当前签入的 100% baseline 留出实用余量，使一次无关的 description 修改不会立刻让 CI 变红。随着 routing 改善上调下限；绝不要为了放过一次回归而下调它。数字下滑意味着 descriptions 正在彼此靠拢。collision check 在成对 description 相似度 ≥75% 时报错，≥50% 时告警。当这些 evals 暴露出 description 的词汇缺口（原始示例见 [#351](https://github.com/addyosmani/agent-skills/issues/351)），去改 description，而不是改 prompt。
