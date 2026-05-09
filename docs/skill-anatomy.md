# Skill Anatomy

本文档描述 agent-skills skill files 的结构和格式。贡献新 skills 或理解现有 skills 时，请将它作为指南。

## 文件位置

每个 skill 都位于 `skills/` 下自己的目录中：

```
skills/
  skill-name/
    SKILL.md           # Required: The skill definition
    supporting-file.md # Optional: Reference material loaded on demand
```

## SKILL.md 格式

### Frontmatter（必需）

```yaml
---
name: skill-name-with-hyphens
description: Guides agents through [task/workflow]. Use when [specific trigger conditions].
---
```

**Rules:**
- `name`: 小写、hyphen-separated。必须与目录名匹配。
- `description`: 先用第三人称说明 skill 做什么，再包含一个或多个清晰的 "Use when" 触发条件。要同时包含 *what* 和 *when*。最多 1024 个字符。

**为什么重要：** Agents 通过读取 descriptions 来发现 skills。Description 会注入 system prompt，因此它必须同时告诉 agent 这个 skill 提供什么，以及何时激活它。不要总结 workflow；如果 description 包含 process steps，agent 可能会遵循摘要，而不是读取完整 skill。

### 标准章节（推荐模式）

```markdown
# Skill Title

## Overview
One-two sentences explaining what this skill does and why it matters.

## When to Use
- Bullet list of triggering conditions (symptoms, task types)
- When NOT to use (exclusions)

## [Core Process / The Workflow / Steps]
The main workflow, broken into numbered steps or phases.
Include code examples where they help.
Use flowcharts (ASCII) where decision points exist.

## [Specific Techniques / Patterns]
Detailed guidance for specific scenarios.
Code examples, templates, configuration.

## Common Rationalizations
| Rationalization | Reality |
|---|---|
| Excuse agents use to skip steps | Why the excuse is wrong |

## Red Flags
- Behavioral patterns indicating the skill is being violated
- Things to watch for during review

## Verification
After completing the skill's process, confirm:
- [ ] Checklist of exit criteria
- [ ] Evidence requirements
```

## 章节用途

### Overview
Skill 的 "elevator pitch"。应回答：这个 skill 做什么，为什么 agent 应该遵循它？

### When to Use
帮助 agents 和 humans 判断当前任务是否适用该 skill。包含正向触发条件（"Use when X"）和负向排除条件（"NOT for Y"）。

### Core Process
Skill 的核心。这是 agent 遵循的分步 workflow。必须具体且可执行，而不是模糊建议。

**Good:** "Run `npm test` and verify all tests pass"
**Bad:** "Make sure the tests work"

### Common Rationalizations
优质 skills 最有辨识度的特性。这些是 agents 用来跳过重要步骤的借口，并配有反驳。它们会阻止 agent 通过合理化逃避流程。

想想每次 agent 说过的 “I'll add tests later” 或 “This is simple enough to skip the spec”；这些都应放在这里，并配上基于事实的反驳。

### Red Flags
表示 skill 被违反的可观察信号。对 code review 和 self-monitoring 很有用。

### Verification
退出标准。Agent 用它来确认 skill 的 process 已完成。每个 checkbox 都应该能用 evidence 验证（test output、build result、screenshot 等）。

## Supporting Files

仅在以下情况下创建 supporting files：
- Reference material 超过 100 行（让主 SKILL.md 保持聚焦）
- 需要 code tools 或 scripts
- Checklists 长到值得拆成单独文件

当 patterns 和 principles 少于 50 行时，保留在正文中。

## 写作原则

1. **Process over knowledge.** Skills 是 workflows，不是 reference docs。要写步骤，不只是事实。
2. **Specific over general.** "Run `npm test`" 优于 "verify the tests"。
3. **Evidence over assumption.** 每个 verification checkbox 都需要证据。
4. **Anti-rationalization.** 每个容易被跳过的步骤都需要在 rationalizations table 中有反驳。
5. **Progressive disclosure.** 主 SKILL.md 是入口点。Supporting files 只在需要时加载。
6. **Token-conscious.** 每个 section 都必须证明自己值得保留。如果移除它不会改变 agent 行为，就移除它。

## 命名约定

- Skill directories: `lowercase-hyphen-separated`
- Skill files: `SKILL.md`（始终大写）
- Supporting files: `lowercase-hyphen-separated.md`
- References: 存放在项目根目录的 `references/`，不要放在 skill directories 内

## Cross-Skill References

按名称引用其他 skills：

```markdown
Follow the `test-driven-development` skill for writing tests.
If the build breaks, use the `debugging-and-error-recovery` skill.
```

不要在 skills 之间复制内容，应引用并链接。
