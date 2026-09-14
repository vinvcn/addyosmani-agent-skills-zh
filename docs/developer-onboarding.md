# 开发者上手指南

本指南面向**在** agent-skills 仓库本身上工作的人：贡献 skill、修复文档、改进 eval harness。如果你想在*自己的*项目里*使用*这些 skills，请去看 [getting-started.md](getting-started.md)。

它是一次引导式巡览，不是规则手册。规则在 [CONTRIBUTING.md](../CONTRIBUTING.md)（贡献流程）、[skill-anatomy.md](skill-anatomy.md)（skill 格式）和 [evals/README.md](../evals/README.md)（eval 框架）里；本文档告诉你何时该读哪一份，以及各部分如何拼合在一起。

---

## 1. 心智模型

这个仓库有五个可组合的层。理解每一层的*用途*，能避免最常见的贡献错误（把参考材料塞进 skill、构建会路由到其他 personas 的 persona、在多个 skills 之间复制内容）。

| 层 | 位置 | 职责 | 一个字概括 |
|---|---|---|---|
| **Skills** | `skills/<name>/SKILL.md` | 带验证门禁的分步工作流 | *How* |
| **Personas** | `agents/<role>.md` | 带视角和输出格式的角色 | *Who* |
| **Commands** | `.claude/commands/`、`.gemini/commands/`、`commands/` | 面向用户的入口点；编排层 | *When* |
| **References** | `references/*.md` | skills 按需拉取的 checklist | *What to check* |
| **Evals** | `evals/cases/<name>.json` | 证明 skills 能正确触发和行为的依据 | *Does it work* |

两条值得尽早内化的结构性规则：

- **用户（或 slash command）才是 orchestrator。** Personas 从不调用其他 personas；唯一被认可的多 persona 模式是并行 fan-out 加一个 merge 步骤（见 [references/orchestration-patterns.md](../references/orchestration-patterns.md)）。
- **不要复制，要引用。** Skills 链接到其他 skills 和 `references/`，而不是复述内容。同样的规则也适用于文档，包括这一份。

一个容易让人踩坑的范围限定：仓库根目录的 `AGENTS.md` 和 `CLAUDE.md` 是为*本仓库*的 agent 工作做配置的。它们不是可复用资产，setup 指南绝不能让用户把它们复制到自己的项目里；可复用的资产是那些 skills。

注意 commands 存在于三个平行目录中（Claude Code、Gemini CLI、Antigravity）。改动其中一个，CI 就会检查全部三个的一致性，见 §3。

## 2. 本地环境搭建

```bash
git clone https://github.com/vinvcn/addyosmani-agent-skills-zh.git
cd addyosmani-agent-skills-zh
```

没有构建步骤，也没有 `package.json`；校验器就是普通 Node 脚本。你需要：

- **Node 20+**（CI 使用的版本），用于 `scripts/` 里的校验器
- **bash**（推荐再加 `jq`），用于 hook 回归测试
- **`gh` CLI**，用于在提议新 skill 前做重复 PR 检查
- **Claude Code**，仅当你想在本地跑 Tier 3 行为评测时才需要

想在本地 checkout 上实际试用这个 skill 包：

```bash
claude --plugin-dir /path/to/agent-skills
```

## 3. 验证循环

这个仓库吃自己的狗粮：验证对 skills 是不可妥协的，对本仓库的贡献同样不可妥协。CI 跑的一切，你都能在本地几秒内跑完：

```bash
# Tier 1, structural: frontmatter, naming, required sections
node scripts/validate-skills.js

# Command parity and description sync across the three command directories
node scripts/validate-commands.js

# Tier 2, trigger & routing: positive prompts rank top-k, negatives don't collide
node scripts/run-evals.js

# Tier 3, behavioral (on demand, spends tokens; --dry-run prints the plan)
node scripts/run-evals.js --behavioral <skill-name> --dry-run

# Hook regression test, required if you touch hooks/session-start.sh
# or skills/using-agent-skills/SKILL.md
bash hooks/session-start-test.sh
```

三个 eval 层级值得理解，即使你从不碰 harness。因为 Tier 2 变红通常意味着*改好你 skill 的 description*，而不是 eval 有问题：Tier 2 是对路由的词法近似（在 descriptions 上做词干化的 TF-IDF），它的两个目标失败模式是：description 缺少用户实际会说的词汇，以及 description 过宽以至于压过了正确的 skill。完整设计、schema 和信任级别规则见 [evals/README.md](../evals/README.md)。

每个 PR 之前跑相关子集。一个在 Tier 1 + Tier 2 + command parity 上全绿的 PR 才是可评审的；否则它会在没人读内容之前就被机械检查弹回来。

## 4. 贡献路径

### 路径 1：修复或改进现有 skill（最常见，最好的首个 PR）

1. 保持改动聚焦且最小化；保留该 skill 的结构和语气。
2. 如果你改动了 frontmatter 的 `description`，预期会影响 Tier 2；运行 `node scripts/run-evals.js` 并确认该 skill 的 trigger prompts 仍然排名靠前。
3. 运行 Tier 1 确认 frontmatter 依然有效。

### 路径 2：提议新 skill（门槛更高，先做预检）

目录已经覆盖了生命周期的大部分，所以举证责任在「缺口」上。写任何东西之前，先跑 [CONTRIBUTING.md](../CONTRIBUTING.md#before-proposing-a-new-skill) 里的预检：搜索目录、检查 open PRs（`gh pr list --state open`；近似重复的簇已经存在）、确认想法符合 [skill-anatomy.md](skill-anatomy.md)，并在 PR 描述中明确论证这个缺口。如果它与某个现有 skill 重叠，对该 skill 做一次聚焦的编辑胜过一个新目录。

新 skill 是以一组文件交付的，不是单个文件：`skills/<kebab-case-name>/SKILL.md`、一个配套的 `evals/cases/<name>.json`，以及只有在确实附带可运行 helper 时才有的 `scripts/` 目录（参考材料放 `references/`，绝不放在 skill 内部）。精确的 frontmatter 规则、章节解剖和 eval-case 最低要求，在 [CONTRIBUTING.md](../CONTRIBUTING.md#structure) 和 [skill-anatomy.md](skill-anatomy.md) 里；以那两处为准而不是这份巡览，这样两边才不会漂移。

有一点值得内化而不是现查：写 trigger prompts 时，要用用户实际说话的措辞去转述；把 description 复制进 prompts 是在糊弄 eval，什么也告诉不了你。

### 路径 3：文档、references、harness

- 文档和 skills **只有英文**；翻译不被接受，因为它们会漂移（[CONTRIBUTING.md](../CONTRIBUTING.md#translations) 有理由说明）。
- 对 `scripts/run-evals.js` 或 eval schema 的改动，应与 skill-creator 的 `evals.json` schema 保持兼容（行为层级逐字采用了该 schema；这种兼容性是设计特性，不是巧合）。
- 任何涉及 session-start hook 或其内嵌 meta-skill 的改动，都需要跑 hook 回归测试（§3）。

## 5. PR 前 checklist

- [ ] Tier 1 绿：`node scripts/validate-skills.js`
- [ ] Tier 2 绿：`node scripts/run-evals.js`
- [ ] 若改动了任何 command 目录，command parity 绿：`node scripts/validate-commands.js`
- [ ] 若改动了 `hooks/` 或 `using-agent-skills`，hook 测试绿
- [ ] 新 skill → eval case 文件已存在，且满足 trigger/behavioral 的最低数量
- [ ] 新 skill → PR 描述中已论证缺口；已检查目录和 open PRs
- [ ] 没有复制内容；使用了交叉引用
- [ ] 改动小而聚焦（仓库自己的 `code-review-and-quality` 关于改动规模的指引同样适用于这里的贡献）

## 6. 建议阅读顺序

1. [README.md](../README.md)：目录和生命周期图（10 分钟）
2. `skills/using-agent-skills/SKILL.md`：从 agent 视角看路由如何工作
3. 端到端读一个成熟的 skill（例如 `test-driven-development`）：通过例子内化其解剖结构
4. [skill-anatomy.md](skill-anatomy.md)：有了上下文之后再读格式规范
5. [evals/README.md](../evals/README.md)：三个层级与 case 格式
6. [CONTRIBUTING.md](../CONTRIBUTING.md) + [AGENTS.md](../AGENTS.md)：规则与仓库范围的 agent 配置
