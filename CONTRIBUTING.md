# 为 Agent Skills 做贡献

感谢你有兴趣贡献！本项目是面向 AI coding agents 的生产级工程 skills 集合。

初来乍到？[docs/developer-onboarding.md](docs/developer-onboarding.md) 是一份导览，讲清这个仓库如何各部分衔接（五个层级、验证循环和贡献路径），并告诉你什么时候该读本文件、[skill-anatomy.md](docs/skill-anatomy.md) 和 [evals/README.md](evals/README.md)。本文件是权威规则手册，onboarding 指南是地图。

## 添加新 Skill

### 提出新 skill 之前

这个包已经覆盖了开发生命周期的大部分环节，许多提议都与某个现有 skill 或另一个 open PR 重叠。开 PR 之前先做这些检查，免得 reviewers 还要去分诊重复项：

1. **搜索目录。** 浏览 [README 中的 skill 列表](README.md)，并在 `skills/` 里翻一翻，看有没有现有 skill 整体或部分覆盖了你的想法。
2. **检查 open PRs。** 运行 `gh pr list --state open`（或浏览 PRs 标签页），寻找同主题的提议。近似重复的 skill 簇已经存在；不要再往里面加了。
3. **检查被拒的提议。** 在 [skill-change rejection ledger](evals/skill-impact.md) 中搜索与你的想法重叠的早期提议，在重复这项工作之前先审阅它们的 eval 证据。
4. **阅读 anatomy。** 确认你的想法符合 [docs/skill-anatomy.md](docs/skill-anatomy.md) 的格式：是带验证的可执行 workflow，而不是模糊建议。
5. **在 PR 描述中论证这个缺口。** 明确说明为什么它没有被现有 skill、open PR 或此前被拒的提议覆盖。如果有重叠，提议扩展现有 skill，而不是新增一个。
6. **剥离模型专属的变通方案。** 如果某一步不点名某个模型、模型版本或某个 agent 的私有工具名就说不过去，它就不属于 skill —— 描述这项能力，而不是那个机制（见 [写流程，不写变通方案](docs/skill-anatomy.md#写流程不写变通方案)）。

如果你的想法是对现有 skill 的完善，优先对那个 skill 做一次聚焦的编辑，而不是新建一个目录。

### 创建 skill

1. 在 `skills/` 下创建一个 kebab-case 名称的目录
2. 添加一个遵循 [docs/skill-anatomy.md](docs/skill-anatomy.md) 格式的 `SKILL.md`
3. 包含带 `name` 和 `description` 字段的 YAML frontmatter，且顶层没有 vendor 或 runtime keys（那些进 `metadata` 或 per-agent adapter 文件；见 [docs/advanced-per-agent-configuration.md](docs/advanced-per-agent-configuration.md)）
4. 确保 `description` 先说明 skill 做什么（第三人称），然后包含一个或多个 `Use when` 触发条件

### Skill 质量标准

Skills 应该是：

- **Specific** — 可执行步骤，而不是模糊建议
- **Verifiable** — 带证据要求的清晰退出标准
- **Battle-tested** — 基于真实工程工作流，而不是理论理想
- **Minimal** — 只包含正确引导 agent 所需的内容

### 结构

每个新 skill 都必须有：

- skill 目录中的 `SKILL.md`
- 带有效 `name` 和 `description` 的 YAML frontmatter
- `evals/cases/<skill-name>.json` 处的 eval case 文件 —— 至少 3 个 positive triggers、2 个 negative triggers（尽可能带 `owner`），以及 1 个 behavioral eval。Execution evals 必须由 `evals/fixtures/` 下的真实文件支撑；conversation-shaped skills 可以改用 reviewer-gated 的 `kind: "dialogue"` eval（见 [evals/README.md](evals/README.md)）。CI 会强制执行这些要求。

新 skills 通常应遵循标准 anatomy：

- **Overview** — 这个 skill 做什么，以及为什么重要
- **When to Use** — 触发条件
- **Process** — 分步工作流
- **Common Rationalizations** — agents 用来跳过步骤的借口及其反驳
- **Red Flags** — skill 被错误应用的警示信号
- **Verification** — 如何确认 skill 已被正确应用

上述 frontmatter 字段是必需的。Section anatomy 是推荐模式：`How It Works`、`Workflow` 或 `Core Process` 这样的等价标题也可以，只要它们保持相同意图、让 skill 易于跟随。

### 不要做什么

- 不要在 skills 之间复制内容，应改为引用其他 skills
- 不要添加模糊建议式 skills，而不是可执行流程
- 除非内容超过 100 行，否则不要创建 supporting files
- 不要仅仅为了对齐某个现有 skill 就创建空的 `scripts/` 目录 —— 只有当 skill 包含可运行的 helpers 时才添加 `scripts/`
- 不要把 reference material 放进 skill directories，应使用 `references/`

## 修改现有 Skills

提出变更前，先在 [skill-change rejection ledger](evals/skill-impact.md) 中搜索影响同一 skill 的既往尝试，并审阅其 eval 证据。

- 保持变更聚焦且最小
- 保留现有结构和语气
- 编辑后确认 YAML frontmatter 仍然有效

如果某个 skill 或 description 变更基于 eval 结果被拒绝，就在 ledger 中补一行，记录日期、受影响的 skill、简短的变更尝试、before-to-after rank-1 分数，以及被拒 PR 链接和结果。这条只更新 ledger 的提交要单独合入默认分支；不要把它只留在被拒提议的分支上，因为关闭或 force-push 该提议可能会把记录丢掉。

## 添加 Host 指南

README 的安装章节只列出 maintainer 已经安装并在当前发布版本上运行过的 host。其他每个 host 在 [docs/other-hosts.md](docs/other-hosts.md) 里占一行：host 名和它的安装命令。不要专门的 setup 页面、vendor 链接、logo、emoji 或截图。

- 如果你就在该 host 背后的公司工作，在 PR 中说明。
- 某个 host 要进 README，需要 maintainer 已经在它上面运行过，并愿意保持该条目更新。
- Host 指南按开启顺序评审。

## 仓库级文件

仓库根目录的 `AGENTS.md` 和 `CLAUDE.md` 为在 [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills) 仓库本身上工作的 agents 提供配置。编写 setup 指南或文档时，不要指示用户把这些文件复制到他们自己的项目或全局 agent 配置中；可复用的资产是 `skills/` 里的 skills。

## 翻译

我们不接受文档（README、`docs/`）或 skills 及其内容的翻译。随着 skills 和 docs 演进，翻译副本会逐渐失去同步，而我们没有办法长期维护它们，除非依赖 agent 翻译加社区纠错，这只会增加维护成本、收益有限。所有 skills、docs 和贡献请保持英文。

## 翻译贡献

上一节是上游 `addyosmani/agent-skills` 对本体的政策：上游不接受翻译。本仓库是独立的简体中文本地化版本，翻译质量的改进在这里进行。上游内容刷新由维护者按 [.skills/translate-skill/SKILL.md](.skills/translate-skill/SKILL.md) 执行，历史记录见 [SYNC.md](SYNC.md)。

### 翻译术语：请求与认领

1. 任何人都可以为仓库里发现的英文术语开 issue 请求翻译。请求包含：术语、出现位置（`文件:行`，可列多处）、可选建议译法、可选理由。
2. 讨论后由维护者决定译法；决定的术语登入 [翻译术语表](TRANSLATION-GLOSSARY.md) 的「已决定的翻译」表。
3. 任何人都可以认领已决定的术语并开 PR 落地：按术语表替换仓库中的出现位置（大小写不敏感匹配）；PR 描述链接术语表条目与相关 issue。
4. PR 合并后由维护者把术语表条目状态改为 `applied`。
5. 术语尚未决定时保持原文，不要抢先翻译或自行发明译法；新请求先进入术语表的「Translate terms（翻译请求）」区。

### PR 检查清单

- 先 `git add` 暂存改动，再运行下面的检查：

```bash
node scripts/validate-reference-links.js
node scripts/validate-versions.js
node scripts/validate-commands.js
git diff --check
```

- 遵守 [翻译 skill](.skills/translate-skill/SKILL.md) 的保留规则：identifiers、代码、路径、行为关键 labels 不翻译。
- 只改与该术语相关的出现位置；标题译法变化时，同步更新同一文件内指向该标题的 anchor links。

### 其他贡献

- 发现翻译错误、与上游不同步或可改进处：直接开 issue 或 PR。
- 上游发布同步：按 [SYNC.md](SYNC.md) 的记录格式追加条目，流程见翻译 skill 的「仓库刷新工作流」。

## 测试 Hooks

session-start 脚本（`hooks/session-start.sh`）在接入某个宿主的 `SessionStart` hook 时注入 `using-agent-skills` meta-skill。Claude Code 插件不注册它 —— Claude Code 原生路由 skills，常开注入会为同一个任务制造两个 router（见 [docs/getting-started.md](docs/getting-started.md)）；该脚本保留给没有原生 skill 路由的宿主。`hooks/session-start-test.sh` 中的 regression test 会验证该脚本的 JSON payload，包括 `jq` 可用和不可用两种情况。

在提交任何触及以下文件的 PR 前运行它：

- `hooks/session-start.sh`
- `skills/using-agent-skills/SKILL.md`（hook 嵌入的 meta-skill 内容）

```bash
bash hooks/session-start-test.sh
```

预期输出：`session-start JSON payload OK`。任何 assertion 失败都会让脚本以非零状态退出。

### 复现 no-jq fallback

当 `jq` 不在 `PATH` 中时，该脚本仍会发出相同的 `hookSpecificOutput` envelope，其中 `additionalContext` 说明需要 `jq`。要在本地执行该分支，可在测试调用时从 `PATH` 中移除 `jq` 所在的目录：

```bash
JQ_DIR=$(dirname "$(command -v jq)")
PATH=$(echo "$PATH" | tr ':' '\n' | grep -v "^${JQ_DIR}$" | tr '\n' ':' | sed 's/:$//') \
  bash hooks/session-start-test.sh
```

当 `jq` 独占自己的目录时（例如 Homebrew 的 `/opt/homebrew/bin`，或手动安装的 `/usr/local/bin`），这样会很干净。如果你的 `jq` 与测试依赖的其他工具共用 system bin（例如 `/usr/bin` 中的 `mktemp`），更简单的做法是通过单独的 package manager 安装 `jq`，让它拥有自己的 bin 目录，然后重新运行。

在剥离后的 `PATH` 下，hook 的 `command -v jq` 检查会失败，jq-missing fallback 会运行，测试转而断言 `additionalContext` 中的 `jq is required` guidance，而不是 meta-skill 正文。

## 报告问题

如果你发现以下问题，请 open an issue：

- 某个 skill 给出不正确或过时的 guidance
- 缺少对常见工程工作流的覆盖
- Skills 之间存在不一致

如果某个 skill 的 guidance 有错、过时，或在你的项目中不适用（例如它在 Maven 或 Gradle 仓库里假设了 `npm test`），请使用 [Skill gap](https://github.com/addyosmani/agent-skills/issues/new?template=skill-gap.yml) issue 表单。它会询问受影响的 skill、相关摘录、你的项目上下文，以及你实际的做法 —— 这些信息足以让 maintainers 完成 triage，而不需要你写自由格式的说明。

## License

贡献即表示你同意你的贡献将按 MIT License 授权。
