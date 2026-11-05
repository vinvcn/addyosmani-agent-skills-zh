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
| 1. Structural | frontmatter、命名、必需 sections、layout 与行数预算、`references/` links、command 一致性、artifact 路径、manifest 版本 | CI（`validate-skills.js`、`validate-reference-links.js`、`validate-commands.js`、`validate-artifact-paths.js`、`validate-versions.js`） | 免费 |
| 2. Trigger & routing | positive prompts 将对应 skill 排入 top-k；negative prompts 不会；任意两个 descriptions 不近似碰撞 | CI（`run-evals.js --min-rank1 95`） | 免费 |
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
node scripts/run-evals.js --behavioral test-driven-development --eval 1   # run only case 1
```

`--eval <id>` 按整数 `id`（包括 `0`）选择单个 behavioral case，也能与 `--dry-run` 一起使用。未知或非法的 ID 会在执行前失败；省略选择器时和以前一样运行全部 case。

Tier 3 支持两种 behavioral artifact kinds。`execution` 是默认值：每个 eval 在一个一次性 git repository 中运行，`files[]` 声明的真实项目输入从 `evals/fixtures/` 实例化并提交为 baseline，grader 依据完整的 `--output-format stream-json --verbose` 执行 trace（包含 tool calls）评分。`dialogue` 保留给交付物就是对话本身的 skills；它不需要 fixture，grader 只评判 assistant 的对话轮次，不要求文件编辑或命令。声明 `dialogue` 是需要人工评审的豁免，不是 execution skills 的通用逃生舱。

executor 以显式 permission mode 运行（`--permission-mode acceptEdits` 加上一份预先批准的 tool list），因此 execution evals 能真正编辑文件、运行命令、检查 diffs、创建 commits，而不是被拒绝权限后只靠口头描述。Traces 在 grader prompt 中被当作不可信数据做围栏隔离，并通过 stdin 传给 grader（trace 可能有数 MB；走 argv 会撞上操作系统参数长度上限）；executor 和 grader 调用都带 timeout；grader 输出会先经 JSON 校验，再按 skill-creator 的 `grading.json` 形状写入 `evals/results/`（已 gitignore）。纪律类 skills 还包含针对时间压力、沉没成本和权威压力的 pressure cases；它们验证当 prompt 试图劝人跳过流程时，workflow 依然成立。

只有已完成的 executor 流才会进入 grader：要求一个显式的成功终止结果、没有 permission denial，并且每次 tool call 都有返回的 observation。返回的失败探测在完成前仍可能恢复。失败或不完整的执行会在该 case 的结果槽旁边保留 `.execution.raw.txt` 和 `.execution.error.txt`，不产生分数，也不阻止后续 case 运行。这些最近一次尝试的诊断会在该 case 重跑时清除。

## Plugin evals（Claude Code）

`claude plugin eval`（Claude Code 2.1.269 或更高版本）会加载整个 plugin、一次性载入全部 skills，运行 `evals/plugin/` 下的各 cases，并对每个 case 分别在有 plugin 和无 plugin 两种情况下评分。它是对 Tier 2 的补充，而不是替代：Tier 2 检查的是 description 是否包含用户会说的词汇；而它检查的是 Claude Code 自己的 router 能否在自然 prompt 上选中该 skill，以及该 skill 为回复增加了什么（`Δ` 列）。

```bash
claude plugin eval . --no-publish                                          # every case, both arms, 3 runs each
claude plugin eval . --case code-review-fires --runs 1 --ablation none     # one cheap iteration on one case
```

一个 case 是一个目录，内含 `prompt.md`（frontmatter：轮次和工具上限；正文：原样发送的 prompt）以及 `graders/` 下每个文件一个 grader。报告落在 `evals/plugin/results/<timestamp>/`，已被 gitignore。每一次运行以及每一个 `llm` grader 都是你在自己账号上发起的真实模型调用，因此它和 Tier 3 一样按需运行，绝不出现在 CI 中。

有两条规则让它保持诚实。manifest 的 `experimental.evals` key 把扫描范围限定在 `evals/plugin/`，因此 `evals/` 下别处的 fixture 绝不会被当作 case 读取。而 `tool_used: Skill` grader 只说明 skill 是否触发；在两臂运行中它不计入分数，所以要搭配一个针对回复本身的 grader。`code-review-fires` 展示了这个模式：一个触发指示器、一个免费的 `regex` grader（查找该 skill 的严重级别分类法 Critical、Required、Nit、Optional、Consider、FYI 是否被用作标题或标签），以及一个针对预埋 off-by-one 的 `llm` judge。`code-review-stays-quiet` 是 precision 检查：review skill 不得在 test-first 请求上触发，它的 `Δ` 预期为 0；另有一个不计分的指示器记录 test-driven-development 是否反而触发。

最初几轮运行教给我们的东西（Claude Code 2.1.278，claude-opus-5）。skill 触发是随机的：在该 case 使用的措辞下，review skill 在 7 次运行中触发了 5 次，而 test-driven-development 在那个 test-first prompt 上 7 次运行中只触发了 2 次，因此要读 `Δ` 和报告，而不是读退出码 —— 或者像文档中的 CI 示例那样传 `--threshold 0.8`。在其中一次运行里，review skill 没有触发，但回复仍然把它的严重级别分类法用作了标题，而九次 baseline 运行里没有一次这样；已加载的 skill descriptions 即使没有被调用，也可能塑造回复。措辞很重要，而 description 就是那根杠杆。用原始 description 时，“Review this diff before I merge it”、“Can you do a proper code review of this change before I merge it?” 和 “Review this pull request for me before it goes into main” 很少触发该 skill：模型会自己审这个 diff，做得称职，但没有结论、没有严重级别分层，也没有五轴那一遍。说明该 skill 带来了什么没有用，单靠点名 diff 和 pull request 也没有用；真正起作用的是说明该 skill 在 diff 被内联粘贴时同样适用 —— 而这正是模型此前当成“我自己就能做”的情况。在固定了模型的 claude-opus-5-5 上，仅仅那一句就把四种 review 措辞的触发从 27 次中的 7 次提到 21 次，让九个相邻的不得触发 prompt 在两种情况下都保持 27 次中的 0 次，并把最朴素的那句从 9 次中的 0 次提到 3 次：更好，但没有解决。`code-review-stays-quiet-on-commit-message` 就是在守住那一句：粘贴的 diff 配上 commit-message 请求，不得触发 review skill。同一天还有两条实操规则：报数字时要固定 `--model` 并记录 Claude Code 版本，因为 CLI 会自我更新，默认模型在一天之内变了两次；以及给 case 至少 10 的轮次预算，因为当时模型可能经由它的 slash command（`agent-skills:review`，然后是 `code-review-and-quality`）抵达该 skill，那要花掉两个轮次。自 #714 起，lifecycle commands 只允许用户调用，因此 `tool_used: Skill` grader 只匹配 skill 名，把 command 名写进 pattern 已经失效。

同样的杠杆用在 test-driven-development 上（固定 claude-opus-5-5，每个 prompt 6 次运行）。用原始 description 时，“Add unit tests for this function”、“Fix this bug ... here is the function” 和 “Change this function so that size can never exceed 100” 分别只有 6 次中的 0 次触发，而流程导向的 “Write a failing test for this bug before we fix it” 则是 6 次中的 6 次：模型会直接去写测试或直接改掉 bug。这一次光靠尾部那句还不够；起作用的是点出那三类请求，并说明该 skill 在代码被内联粘贴、且请求根本没提测试时同样适用。那一句把四个 prompt 从 24 次中的 6 次提到 19 次（add tests 6 of 6，fix a bug 6 of 6，change behavior 1 of 6），并让八个相邻的不得触发 prompt 在所有试过的变体下都保持 24 次中的 0 次。单行的行为变更是底线：trace 显示的是一次没有工具调用的单轮编辑，模型不会为它考虑走流程。`tdd-fires-on-pasted-bug` 和 `tdd-stays-quiet-on-debug` 就是为那一句准备的一对：前者检查 skill 是否在粘贴的 bug 上触发、以及回复是否在修复之前先用失败测试复现了它；后者检查一个带着 diff 的“what broke”式提问不会把 TDD skill 拉进来。在前者上，skill 每次运行都触发了，但带 plugin 时回复把失败测试放在修复之前只有 4 次中的 2 次，不带 plugin 时是 3 次中的 0 次：这个 judge 是故意严格的，因为那个顺序正是该 skill 所增加的东西，而那些漏判（先修复，再补一个测试并注明它在旧代码上本会失败）是在一个没有 shell 可用的会话中该 skill 的遵循度缺口，不是路由缺口。

同样的杠杆用在 code-simplification 上（固定 claude-opus-5-5，Claude Code 2.1.296，每个 prompt 在每种 description 下运行 3 次）。用原始 description 时，“Simplify this function, it works but it is hard to read”、“Clean this up, it works but it has grown hard to follow” 和 “Reduce the nesting in this function”，每次都粘贴函数，该 skill 分别触发了 3 次中的 0 次：模型直接重写了代码。新句子点出这三类请求，并说明该 skill 在代码被内联粘贴、且不需要其他改动时同样适用。它把三个 prompt 从 9 次中的 0 次提到 9 次中的 8 次（simplify 3 次中的 3 次、clean up 3 次中的 2 次、nesting 3 次中的 3 次），并让五个相邻的、带粘贴代码的不得触发 prompt（make it fast、add tests、review、commit message、what broke）在两种情况下都保持 15 次中的 0 次。`simplify-fires-on-pasted-function` 和 `simplify-stays-quiet-on-make-it-fast` 就是为那一句准备的一对。前者评判该 skill 在一个粘贴的 `normalizeTags` 上增加了什么：两组都会产出同样更短的函数，而显而易见的重写会读取一个原版会忽略的 Set，因此 judge 检查回复要么对每个输入都保持原版的结果，要么说明差异在哪里，并且要求用户先运行现有测试再替换。带 plugin 时该 skill 触发了 3 次中的 3 次；两条回复披露了差异，一条保留了 index loop 来避免它，三条都要求跑一次测试。不带 plugin 时，一条回复披露了差异，两条声称对每个输入结果相同，且没有一条要求跑测试，因此 judge 在带 plugin 时通过 3 次中的 3 次，不带时通过 3 次中的 0 次。那个 grader 最初的措辞只要行为改变就判失败，结果给诚实的回复打了 3 次中的 0 次，给沉默的回复打了 3 次中的 3 次，所以该评判的是披露和验证步骤，而不是单纯的等价。第二个 case 检查针对粘贴代码的速度抱怨不会把简化 skill 拉进来。

在 #714 把 lifecycle commands 改为仅用户调用后重跑（固定 claude-opus-5-5，Claude Code 2.1.312，每个 case 3 次，两个有变化的 case 再跑 6 次）。command 名已从每个 `tool_used: Skill` pattern 中移除，因为命名 command 的 `Skill` 调用不可能再发生。`code-review-fires` 触发 3 次中的 3 次，`simplify-fires-on-pasted-function` 触发 6 次中的 6 次；每个 stays-quiet case 都保持在 0。`tdd-fires-on-pasted-bug` 触发 6 次中的 1 次，而 #678 在 2.1.283 上测到的是 6 次中的 6 次，且六次运行中有五次是单轮直接回答、完全没有 tool call。这不是 #714 造成的：把 `/test` 的 `disable-model-invocation` 去掉再测，同一个 case 触发 6 次中的 0 次。句子没有变，变的是它下面的 router，发生在 2.1.283 到 2.1.312 之间。把上面的 test-driven-development 数字视为带 CLI 版本日期的快照，这正是固定版本号的用途。

同样的杠杆用在 git-workflow-and-versioning 上（固定 claude-opus-5-5，Claude Code 2.1.312，每个 prompt 在每种 description 下运行 3 次）。用原始 description 时，“write me a commit message for this diff”、“write the changelog entry for this diff” 和 “split this into commits for me”，每次都粘贴 diff，该 skill 分别触发了 3 次中的 0 次、3 次中的 0 次和 3 次中的 1 次：模型在一轮内直接写出了消息。新句子点出这三类请求，并说明该 skill 在 diff 被内联粘贴、消息看起来很容易据此写出时同样适用。它把三个 prompt 提到 6 次中的 6 次、3 次中的 3 次和 3 次中的 3 次，并让三个相邻的、带同一粘贴 diff 的不得触发 prompt（review、add tests、simplify）保持 9 次中的 0 次，而 “what broke?” 配粘贴 diff 保持在 6 次中的 0 次。一个更长的句子还写明了消息必须包含什么，触发率相同，但把该 skill 自己的 “Resolve the merge conflict on this feature branch” 在 Tier 2 推到 rank 2，所以保留短的那句。`gitflow-fires-on-commit-message` 和 `gitflow-stays-quiet-on-what-broke` 是一对。前者粘贴一个包含两处不相关改动的 diff（一个 retry loop 和一个 formatting helper），judge 评判该 skill 增加了什么：带 type 的 subject、说明 why 而不是复述 diff 的 body，以及把两个关注点拆进不同的 commit。两组都注意到了拆分；带 plugin 时每条回复还都用了带 type 的 subject 和 why body，不带时没有一条做到，因此 judge 在带 plugin 时通过 6 次中的 5 次，不带时通过 3 次中的 0 次。第二个 case 检查一个带着 “what broke?” 问题的粘贴 diff 不会把 git skill 拉进来。

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
