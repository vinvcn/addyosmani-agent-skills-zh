---
description: 通过并行 fan-out 到 specialist personas 运行发布前 checklist，然后综合 go/no-go decision
---

调用 agent-skills:shipping-and-launch skill。

`/ship` 是一个 **fan-out orchestrator**。它会针对当前变更并行运行三个 specialist personas，然后将它们的报告合并为一个带 rollback plan 的 go/no-go decision。Personas 独立运行，没有共享状态，也没有顺序依赖；这正是此处并行执行安全且有用的原因。

## Phase A — Parallel fan-out

使用 Agent tool 并发 spawn 三个 subagents。**在同一个 assistant turn 中发出全部三个 Agent tool calls，让它们并行执行**；顺序调用会违背此 command 的目的。

在 Claude Code 中，每次调用都传入与 persona 的 `name` 字段匹配的 `subagent_type`：

1. **`code-reviewer`** — 对 staged changes 或 recent commits 执行五轴 review（correctness、readability、architecture、security、performance）。输出标准 review template。
2. **`security-auditor`** — 执行 vulnerability 和 threat-model pass。检查 OWASP Top 10、secrets handling、auth/authz、dependency CVEs。输出标准 audit report。
3. **`test-engineer`** — 分析该变更的 test coverage。识别 happy path、edge cases、error paths 和 concurrency scenarios 中的 gaps。输出标准 coverage analysis。

在没有 Agent tool 的其他 harnesses 中，顺序调用每个 persona 的 system prompt，并将它们的输出视作并行返回；merge phase 仍然有效。

约束（来自 Claude Code 的 subagent model）：
- Subagents 不能 spawn 其他 subagents；不要让一个 persona delegate 给另一个。
- 每个 subagent 都有自己的 context window，并且只向这个 main session 返回自己的 report。
- 如果你需要 teammates 互相对话，而不只是回传报告，请使用 Claude Code Agent Teams，并将这些 personas 引用为 teammate types（见 `references/orchestration-patterns.md`）。

**Persona resolution。** 如果你在 `.claude/agents/` 或 `~/.claude/agents/` 中定义了自己的 `code-reviewer`、`security-auditor` 或 `test-engineer`，它们会优先于此 plugin 的版本；`/ship` 会自动采用你的自定义内容。这是有意设计的：plugin subagents 位于 Claude Code scope priority table 的底部，因此 user-level definitions 会按设计优先。

## Phase B — Merge in main context

三个 reports 都返回后，main agent（不是 sub-persona）进行综合：

1. **Code Quality** — 汇总 `code-reviewer` 的 Critical/Important findings，以及任何 failing tests、lint 或 build output。合并 reviewers 之间的重复项。
2. **Security** — 将任何 Critical/High `security-auditor` findings 提升为 launch blockers。与 `code-reviewer` 的 security axis 交叉核对。
3. **Performance** — 从 `code-reviewer` 的 performance axis 提取；如适用，交叉检查 Core Web Vitals。
4. **Accessibility** — 验证 keyboard nav、screen reader support、contrast（三个 personas 不覆盖这一项；在这里直接处理，或调用 accessibility checklist）。
5. **Infrastructure** — Env vars、migrations、monitoring、feature flags。直接验证。
6. **Documentation** — README、ADRs、changelog。直接验证。

## Phase C — Decision and rollback

产出单一输出：

```markdown
## Ship Decision: GO | NO-GO

### Blockers (must fix before ship)
- [Source persona: Critical finding + file:line]

### Recommended fixes (should fix before ship)
- [Source persona: Important finding + file:line]

### Acknowledged risks (shipping anyway)
- [Risk + mitigation]

### Rollback plan
- Trigger conditions: [what signals would prompt rollback]
- Rollback procedure: [exact steps]
- Recovery time objective: [target]

### Specialist reports (full)
- [code-reviewer report]
- [security-auditor report]
- [test-engineer report]
```

## Rules

1. 三个 Phase A personas 并行运行；绝不顺序运行。
2. Personas 不互相调用。Main agent 在 Phase B 中合并。
3. 任何 GO decision 之前都必须有 rollback plan。
4. 如果任何 persona 返回 Critical finding，默认 verdict 是 NO-GO，除非用户明确接受风险。
5. **只有当以下条件全部成立时，才跳过 fan-out：** 变更触及 2 个或更少文件，diff 少于 50 行，并且不触及 auth、payments、data access 或 config/env。否则默认执行 fan-out。`/ship` 面向即将进入生产的变更；当 blast radius 非平凡时，即使 diff 看起来很小，也要运行 parallel review。
