---
description: 执行五轴 code review — correctness、readability、architecture、security、performance
---

调用 agent-skills:code-review-and-quality skill。

围绕全部五个轴 review 当前变更（staged 或 recent commits）：

1. **Correctness** — 是否匹配 spec？edge cases 是否处理？tests 是否充分？
2. **Readability** — 命名是否清晰？逻辑是否直接？组织是否良好？
3. **Architecture** — 是否遵循现有 patterns？boundaries 是否清晰？abstraction level 是否合适？
4. **Security** — 输入是否验证？secrets 是否安全？auth 是否检查？（使用 security-and-hardening skill）
5. **Performance** — 是否没有 N+1 queries？是否没有 unbounded ops？（使用 performance-optimization skill）

将 findings 分类为 Critical、Important 或 Suggestion。
输出结构化 review，包含具体 file:line references 和 fix recommendations。
