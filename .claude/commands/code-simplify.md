---
description: 简化代码以提升清晰度和可维护性 — 在不改变行为的前提下降低复杂度
---

调用 agent-skills:code-simplification skill。

在精确保留行为的前提下，简化最近变更的代码（或指定 scope）：

1. 阅读 CLAUDE.md 并学习项目约定
2. 识别目标代码 — 除非指定了更广 scope，否则默认为最近变更
3. 修改前理解代码目的、callers、edge cases 和 test coverage
4. 扫描 simplification opportunities：
   - Deep nesting → guard clauses 或 extracted helpers
   - Long functions → 按 responsibility 拆分
   - Nested ternaries → if/else 或 switch
   - Generic names → descriptive names
   - Duplicated logic → shared functions
   - Dead code → 确认后移除
5. 增量应用每个 simplification — 每次变更后运行 tests
6. 验证所有 tests 通过、build 成功且 diff 干净

如果 simplification 后 tests 失败，revert 该变更并重新考虑。使用 `code-review-and-quality` review 结果。
