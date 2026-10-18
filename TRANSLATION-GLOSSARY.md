# 翻译术语表

记录已决定的翻译术语与正在征集的翻译请求；流程见 [贡献指南](CONTRIBUTING.md#翻译术语请求与认领)，刷新工作流见 [.skills/translate-skill/SKILL.md](.skills/translate-skill/SKILL.md)。

## 已决定的翻译

只有决定后的译法才移入本表。

| 英文术语 | 中文译法 | 说明/语境 | 首次来源 | 决定于（issue/PR） |
| --- | --- | --- | --- | --- |
| `Overview` | `概览` | skill 文件的概述小节 | 23/24 个 skills 沿用（如 `skills/interview-me/SKILL.md`） | 维护者于 2026-10-18 v0.6.13 同步时批准（本 PR 待复核） |
| `When to Use` | `何时使用` | skill 文件的触发条件小节；frontmatter `description` 中的 "Use when …" 从句译作「用于……时」 | 24/24 个 skills 沿用 | 维护者于 2026-10-18 v0.6.13 同步时批准（本 PR 待复核） |
| `Common Rationalizations` | `常见合理化借口` | 反合理化表格小节 | 18 个 skills 沿用 | 维护者于 2026-10-18 v0.6.13 同步时批准（本 PR 待复核） |
| `Red Flags` | `危险信号` | 警示信号小节。既有 5 个文件作「红旗」，统一见请求区 | 19/24 个 skills 沿用 | 维护者于 2026-10-18 v0.6.13 同步时批准（本 PR 待复核） |
| `Verification` | `验证` | 验证小节/验证清单 | 24/24 个 skills 沿用 | 维护者于 2026-10-18 v0.6.13 同步时批准（本 PR 待复核） |
| `Steps` / `Step N:`（编号步骤标题） | `步骤 N` | 工作流步骤标题。既有文件混用英文 `Step N:`，统一见请求区 | `skills/performance-optimization/SKILL.md` 等 | 维护者于 2026-10-18 v0.6.13 同步时批准（本 PR 待复核） |
| `addyosmani/agent-skills`（用户可见安装/接入命令中的仓库路径） | `vinvcn/addyosmani-agent-skills-zh` | 仅替换告诉用户如何安装或使用本地化仓库的命令；上游署名、issue 链接、schema/规范链接不动 | `README.md` | 2026-05-09 初版本地化时确立的既有约定，2026-10-18 登记 |
| 模板结构标题（spec/ADR 模板内的 `Objective`、`Tech Stack`、`Status` 等） | 保留英文，与上游模板逐字一致 | 模板是给 agent 读取的行为关键内容，不属于说明性标题 | `skills/spec-driven-development/SKILL.md`、`skills/documentation-and-adrs/SKILL.md` | 维护者于 2026-10-18 v0.6.13 同步时批准（本 PR 待复核） |

## Translate terms（翻译请求）

| 英文术语 | 来源引用 | 建议译法 | 状态 | 关联 issue/PR | 备注 |
| --- | --- | --- | --- | --- | --- |
| `Red Flags` | `skills/spec-driven-development/SKILL.md`、`skills/planning-and-task-breakdown/SKILL.md`、`skills/incremental-implementation/SKILL.md`、`skills/idea-refine/SKILL.md`、`skills/test-driven-development/SKILL.md` | `危险信号`（与已决定译法统一） | `pending` | — | 「红旗」5 处、「危险信号」19 处；落地时只改标题行，注意同步同文件指向该标题的 anchor。 |
| `Overview` | `skills/planning-and-task-breakdown/SKILL.md` | `概览` | `pending` | — | 唯一保留英文 `Overview` 标题的文件。 |
| `Step N:`（编号步骤标题） | `skills/interview-me/SKILL.md`、`skills/spec-driven-development/SKILL.md` 等 | `步骤 N` | `pending` | — | 英文编号 18 处、中文「步骤 N」21 处；两个大 lifecycle skill 现用英文编号。落地时注意同步同文件指向该标题的 anchor（`validate-reference-links.js` 会断链报错）。 |
| `skills` / `skill`（普通名词） | `README.md`、`AGENTS.md` 等全文 | 正文保留英文 `skill(s)`，不译「技能」；标题性陈述句可用「技能」 | `pending` | — | 现状混用：README 标题句「生产级工程技能」与正文「25 个 skills」并存，`AGENTS.md` 用「生产级工程 skills」。建议只统一正文用法，避免大范围重写。 |

## 如何更新本表

- 请求一经提交就加进 Translate terms 表。
- 术语决定后从请求区迁入已决定的翻译表并填「决定于」。
- 应用 PR 合并后由维护者把状态改为 `applied`，并保留该行。
- 应用时按大小写不敏感匹配，同一术语的大小写变体视为同一术语。
- 来源引用与 issue/PR 链接必须保留；不要删除历史行。
