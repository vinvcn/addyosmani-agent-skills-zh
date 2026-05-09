# agent-skills

这是 agent-skills 项目：面向 AI coding agents 的生产级工程 skills 集合。

## 项目结构

```
skills/       → Core skills (SKILL.md per directory)
agents/       → Reusable agent personas (code-reviewer, test-engineer, security-auditor)
hooks/        → Session lifecycle hooks
.claude/commands/ → Slash commands (/spec, /plan, /build, /test, /review, /code-simplify, /ship)
references/   → Supplementary checklists (testing, performance, security, accessibility)
docs/         → Setup guides for different tools
```

## 按阶段划分的 Skills

**Define:** spec-driven-development
**Plan:** planning-and-task-breakdown
**Build:** incremental-implementation, test-driven-development, context-engineering, source-driven-development, doubt-driven-development, frontend-ui-engineering, api-and-interface-design
**Verify:** browser-testing-with-devtools, debugging-and-error-recovery
**Review:** code-review-and-quality, code-simplification, security-and-hardening, performance-optimization
**Ship:** git-workflow-and-versioning, ci-cd-and-automation, deprecation-and-migration, documentation-and-adrs, shipping-and-launch

## 约定

- 每个 skill 都位于 `skills/<name>/SKILL.md`
- YAML frontmatter 包含 `name` 和 `description` 字段
- Description 先说明 skill 做什么（第三人称），再包含触发条件（"Use when..."）
- 每个 skill 都包含：Overview、When to Use、Process、Common Rationalizations、Red Flags、Verification
- References 放在 `references/`，不要放在 skill directories 内
- 只有当内容超过 100 行时才创建 supporting files

## 命令

- `npm test` — 不适用（这是文档项目）
- Validate：检查所有 SKILL.md 文件是否有有效的 YAML frontmatter，并包含 name 和 description

## 边界

- Always：为新 skills 遵循 skill-anatomy.md 格式
- Never：添加模糊建议式 skills，而不是可执行流程
- Never：在 skills 之间复制内容，应改为引用其他 skills
