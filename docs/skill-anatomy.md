# Skill Anatomy

本文档描述 agent-skills skill files 的结构和格式。贡献新 skills 或理解现有 skills 时，请将它作为指南。

## 文件位置

每个 skill 都位于 `skills/` 下自己的目录中：

```
skills/
  skill-name/
    SKILL.md           # Required: The skill definition
    scripts/           # Optional: Runnable helpers used by the skill workflow
    references/        # Optional: Skill-specific reference documentation
    supporting-file.md # Optional: Reference material loaded on demand
```

`SKILL.md` 是唯一必需的文件。只在 skill 确实需要时才添加 `scripts/` 或 `references/`；更简单的 skills 干脆两者都不要。

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

已发布的名称是兼容性标识符。特别是，`browser-testing-with-devtools` 是稳定的上游名称，因为其他 skills 会直接引用它。下游 catalog 可以重命名它，但 alias 或迁移映射由那个 catalog 负责；仅下游使用的 aliases 不在本仓库维护。

**为什么重要：** Agents 通过读取 descriptions 来发现 skills。Description 会注入 system prompt，因此它必须同时告诉 agent 这个 skill 提供什么，以及何时激活它。不要总结 workflow；如果 description 包含 process steps，agent 可能会遵循摘要，而不是读取完整 skill。

### 标准章节（推荐模式）

上面的 frontmatter 契约是必需的。下面的章节布局是推荐模式，不是死板模板：当等价标题能清晰服务同一目的时，完全可以替换。

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

如果某个 skill 不需要可运行的 helper，不要仅仅为了跟其他 skill 对齐而创建空的 `scripts/` 目录。空目录只会增加噪音，不会改变 skill 的工作方式。

## Shared References

被多个 skills 使用的 checklists —— testing、security、performance、accessibility、definition-of-done —— 存放在仓库根目录的 `references/` 中，并且是*有意*不放进任何 skill 目录的。

这是包级设计选择。Agent Skills 规范把 skill 描述为一个自包含目录，但这里有多个 skills 指向同一批 checklists。若选择就近放置，只有两条路：把 checklist 复制进每个使用它的 skill，或指定某一个 skill “拥有”它、其他 skills 伸进那个目录取用。两种方式都会随时间漂移。仓库根目录保持唯一一份，就是唯一事实来源。

代价是可移植性：整仓库安装（比如 Claude Code marketplace plugin）会连同 `references/` 一起带上，但只复制 `skills/<name>/` 的单 skill 安装会把仓库根目录的兄弟目录落在原地，那些链接就什么都解析不到。这个缺口在 [#361](https://github.com/addyosmani/agent-skills/issues/361) 中跟踪。

当前约定：只被一个 skill 使用的材料，作为 supporting file 放在那个 skill 的目录内；跨 skills 共享的材料放 `references/`。

## Context Efficiency

Skills 按需加载：启动时进入上下文的只有 skill 名称和 description。只有当 agent 判断某个 skill 相关时，完整 `SKILL.md` 才会被加载。为保持这种加载廉价：

- **`SKILL.md` 控制在 500 行以内。** 详细参考材料移到 supporting files。
- **写具体的 descriptions。** 精准的 description 能帮 agent 在正确时机激活 skill，并在其他时候跳过它。
- **使用 progressive disclosure。** 引用只在工作流到达时才读取的 supporting files。
- **优先用 scripts 而不是内联代码。** 执行脚本不消耗上下文；只有它的输出消耗。内联代码块在每次加载时都要付 token。
- **文件引用只保持一层深度。** 从 `SKILL.md` 直接链接到 supporting files，不要经由中间文档层层转引。

## Script Requirements

当某个 skill 在 `scripts/` 下附带可运行 helper 时，每个脚本遵循这些约定：

- 使用 `#!/bin/bash` shebang。
- 用 `set -e` 实现 fail-fast 行为。
- 状态消息写到 stderr：`echo "Message" >&2`。
- 机器可读的输出（JSON）写到 stdout。
- 为临时文件包含 cleanup trap。
- 脚本路径写作 `skills/<skill-name>/scripts/<script>.sh`（仓库相对路径）。

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
- Shared references: 存放在根目录的 `references/`，不要放在 skill 目录内（原因见 [Shared References](#shared-references)）
- Skill 专属的 references: 单个 supporting doc 可以作为散放文件留在 skill 目录里（即上面 “Supporting files” 条目）；当有多份相关文档要随 skill 分发时，新兴约定是把它们归入 skill 目录内的 `references/` 子目录，让 skill 自带其 supporting docs。

## Cross-Skill References

按名称引用其他 skills：

```markdown
Follow the `test-driven-development` skill for writing tests.
If the build breaks, use the `debugging-and-error-recovery` skill.
```

不要在 skills 之间复制内容，应引用并链接。

## Required vs Recommended

必需（Required）：

- 一个 `skills/<skill-name>/SKILL.md` 文件
- 带 `name` 和 `description` 的有效 YAML frontmatter
- description 同时包含 skill 做什么以及何时使用

推荐（Recommended）：

- 上面展示的标准章节流程
- 等价标题，如 `How It Works`、`Core Process` 或 `Workflow`，只要它们对该 skill 读起来更自然
- 仅在能让主 `SKILL.md` 更聚焦时才使用 supporting files
