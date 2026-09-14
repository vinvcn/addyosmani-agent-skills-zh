# agent-skills

这是 agent-skills 项目：面向 AI coding agents 的生产级工程 skills 集合。

> **适用范围：** 本文件为在 [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills) 仓库本身上工作的 agents 提供配置，而不是为其他项目。不要把它复制到其他项目或全局 agent 配置中；可复用的资产是 `skills/` 里的 skills。

## 项目结构

```
skills/       → Core skills (SKILL.md per directory)
agents/       → Reusable agent personas (code-reviewer, test-engineer, security-auditor, web-performance-auditor)
hooks/        → Session lifecycle hooks
.claude/commands/ → Slash commands (/spec, /plan, /build, /test, /review, /code-simplify, /ship; plus /webperf specialist audit)
references/   → Supplementary checklists (testing, performance, security, accessibility, observability)
evals/        → Skill eval cases + framework (see evals/README.md)
docs/         → Setup guides for different tools
```

## 按阶段划分的 Skills

**Define:** interview-me, idea-refine, spec-driven-development
**Plan:** planning-and-task-breakdown
**Build:** incremental-implementation, test-driven-development, context-engineering, source-driven-development, doubt-driven-development, frontend-ui-engineering, api-and-interface-design
**Verify:** browser-testing-with-devtools, debugging-and-error-recovery
**Review:** code-review-and-quality, code-simplification, security-and-hardening, performance-optimization
**Ship:** git-workflow-and-versioning, ci-cd-and-automation, deprecation-and-migration, documentation-and-adrs, observability-and-instrumentation, shipping-and-launch

## 约定

- 每个 skill 都位于 `skills/<name>/SKILL.md`
- YAML frontmatter 包含 `name` 和 `description` 字段
- Description 以 skill 做什么开头（第三人称），随后给出触发条件（"Use when..."）
- 每个 skill 都包含：Overview、When to Use、Process、Common Rationalizations、Red Flags、Verification
- 共享 references 放在根目录 `references/` 中；对于自包含、可分发的 skill，正在形成的约定是把 skill 自己的 references 放在 `skills/<name>/references/` 内
- 只有当内容超过 100 行时才创建 supporting files

## 贡献

在新增 skill 或对现有 skill 做重大改造之前，先运行 [CONTRIBUTING.md](CONTRIBUTING.md#before-proposing-a-new-skill) 中的预检：搜索目录、检查 open PRs、确认想法符合 [docs/skill-anatomy.md](docs/skill-anatomy.md)，并论证这个缺口。能扩展现有 skill，就优先于新增一个近似重复的 skill。CONTRIBUTING.md 是这套工作流的唯一权威来源；不要在这里或其他地方复述它的 checklist，链接过去即可。

## 命令

- `npm test` — 不适用（这是文档项目）
- Validate：检查所有 SKILL.md 文件是否有有效的 YAML frontmatter，并包含 name 和 description
- Evals：`node scripts/run-evals.js` — 为每个 skill 运行 trigger/routing evals（CI）；`--behavioral <skill>` 用于 graded runs

## Pull Requests

PRs 以上游仓库的默认分支为目标。在典型的 fork 设置中，upstream remote 叫 `upstream`，你的 fork 叫 `origin`，但真正重要的不是这些 remote 名称。

- 开 PR 之前，先搜索上游仓库的 open PRs 和 issues，看有没有触及相同文件或规则的改动。如有重叠，先去协调（在其基础上构建、与它的规则对齐，或在它合并后 rebase），而不是开一个会冲突的 PR。
- 与其大规模重构被广泛共享的文件（例如 `scripts/` 下的文件，它们更容易与进行中的工作冲突），不如优先小而聚焦的 PR。

## 边界

- Always：创建新 skill 目录前运行 CONTRIBUTING.md 预检
- Always：为新 skills 遵循 skill-anatomy.md 格式
- Always：开新 PR 前检查上游仓库的 open PRs 和 issues 是否有重叠
- Never：添加模糊建议式 skills，而不是可执行流程
- Never：在 skills 之间复制内容，应改为引用其他 skills
