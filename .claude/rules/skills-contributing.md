---
description: 新增或修改 skills 时的防重复护栏
paths:
  - "skills/**"
---

# 添加或修改 skill

本仓库已经覆盖了开发生命周期的绝大部分环节，因此大多数新增 skill 的想法都会与某个既有 skill 或某个 open PR 重叠。在创建新的 `skills/<name>/` 目录，或对既有 skill 做大幅重构之前：

- 先跑 [CONTRIBUTING.md](../../CONTRIBUTING.md#提出新-skill-之前) 里的 pre-flight checks：搜索 catalog，查看 open PRs（`gh pr list --state open`），并说明这个 gap 为什么成立。
- 优先扩展既有 skill，而不是添加一个近似重复的 skill。如果想法与某个既有 skill 重叠，请编辑那个 skill，而不是新建一个目录。
- 让 `SKILL.md` 保持在 [docs/skill-anatomy.md](../../docs/skill-anatomy.md) 的规范之内；绝不要在多个 skills 之间复制内容，改为引用另一个 skill。

CONTRIBUTING.md 是完整 workflow 的唯一事实来源；本规则指向它，而不是复述它的 checklist。
