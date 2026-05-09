---
description: 运行 TDD workflow — 编写失败测试、实现、验证。对于 bugs，使用 Prove-It pattern。
---

调用 agent-skills:test-driven-development skill。

对于 new features：
1. 编写描述预期行为的 tests（它们应该 FAIL）
2. 实现代码让它们通过
3. 在保持 tests green 的同时 refactor

对于 bug fixes（Prove-It pattern）：
1. 编写复现 bug 的 test（必须 FAIL）
2. 确认 test 失败
3. 实现 fix
4. 确认 test 通过
5. 运行完整 test suite 检查 regressions

对于 browser-related issues，还要调用 agent-skills:browser-testing-with-devtools，并用 Chrome DevTools MCP 验证。
