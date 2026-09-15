# 高级 per-agent 配置

本仓库中的 skills 刻意保持可移植。每个 `SKILL.md` 的 frontmatter 只包含 [Agent Skills specification](https://agentskills.io) 定义的字段，因此同一个文件在 Claude Code、Cursor、Gemini CLI、Antigravity 以及任何其他遵循 spec 的客户端中都能工作。

一些 agent 还支持额外的运行时控制：model routing、工具限制、轮次上限、执行隔离。这些控制很有价值，但它们是厂商特有的，不属于共享的、可移植的 frontmatter。本文说明每个 agent 支持哪些控制、它们应该放在哪里，以及如何以 opt-in 的方式应用它们而不破坏可移植性。

本文是 per-agent 配置的权威参考，它取代了早先把厂商字段加到顶层 `SKILL.md` frontmatter 的做法。`kind`、`model`、`temperature`、`max_turns`、`tools`、`context` 这样的字段不得出现在 skill 的顶层。它们属于 `metadata` 之下，或者属于单独的 per-agent adapter 文件，下文会具体说明。

## 原则

1. **保持 `SKILL.md` 可移植。** Agent Skills specification 把顶层 frontmatter 保留给 `name`、`description`、`license`、`compatibility`、`metadata` 以及实验性的 `allowed-tools`。厂商或客户端特有的属性属于 `metadata` 之下，而不是顶层。
2. **未知的顶层字段不保证会被忽略。** 许多解析器只读取 `name` 和 `description`，其余的会静默丢弃，但严格的、符合 spec 的校验器或客户端可能会标记或拒绝无法识别的顶层 key。把厂商字段放进 `metadata` 可以让文件在所有地方都保持 conformant。
3. **Opt-in，而不是全局。** 运行时控制应该是用户为自己的 agent 和 workflow 添加的东西，而不是烧录进仓库里每个 skill 的默认配置。
4. **优先生成，而不是手改。** 如果一处配置是重复且机械的，就从一个唯一的 source of truth 生成它，而不是手动维护副本。参见 [用脚本自动化](#用脚本自动化)。

## 厂商字段的位置

| 字段类型 | 示例 | 正确归属 |
|---|---|---|
| Spec 字段 | `name`、`description`、`license`、`compatibility` | `SKILL.md` 的顶层 frontmatter |
| 厂商 metadata | model 提示、routing tags | `SKILL.md` 中 `metadata` key 之下 |
| 运行时编排 | subagent 定义、轮次上限、工具 allowlist | 单独的 per-agent adapter 文件（见下文各 agent 小节） |

## Claude Code

Claude Code 读取 `name` 和 `description` 用于发现。Custom commands 和 skills 共享同一套 frontmatter，所以下面的 `context` 和 `allowed-tools` 字段在 `.claude/commands/*.md` 和 `.claude/skills/*/SKILL.md` 中都有效。

- **`context: fork`** 让一个 command 或 skill 在隔离的 subagent context 中运行，而不是在当前对话中。这带来 context 隔离、从干净状态开始的可重复执行、消耗在 fork 而非主 session 中的执行 tokens，以及更清爽的交接——只有结果会浮现回来。可选的 **`agent`** 字段选择由哪种 subagent 类型运行这个 fork（例如 `agent: Plan`）；默认为 `general-purpose`。
- **`allowed-tools`** 是预批准工具，不是限制工具。列出的工具在调用该 command 或 skill 的那一轮中无需权限提示即可运行，授权在你的下一条消息时失效。没有任何工具从 tool pool 中被移除。
- **`disallowed-tools`** 才是真正的限制字段：它在 skill 激活期间把列出的工具从可用池中移除，这正是 review 或 audit 这类被动阶段做最小权限所需要的。该限制同样在你的下一条消息时失效。注意它是 Claude Code 的字段，不属于 specification 的六个字段之一，因此它应该放在本地副本或 adapter 文件里；出现在已发布的 `SKILL.md` 中会导致 packaging 失败，报 unexpected-key 错误。

这些是 Claude Code 的约定。共享的、已发布的 `SKILL.md` 请限制为 spec 字段；把这些运行时控制应用在你自己的本地 command 或 skill 副本上。

## Gemini CLI 与 Antigravity

Gemini CLI 和 Antigravity 以同样的方式发现 skills：先匹配 `name` 和 `description`，再按需加载完整 skill。运行时编排存在于独立的资源中，而不是在 skill 的 frontmatter 里。

- **Subagent 定义**位于 `.gemini/agents/*.md`，它们与 skills 是两类东西。其 schema 为 `kind`（`local` 或 `remote`）、`model`、`temperature`、`max_turns` 和 `tools`。注意这是 subagent 的 schema，不是 skill 的 schema：两者不应合并进同一个 `SKILL.md`。
- **Model routing** 可以把较轻的任务（格式化、文档、git 操作）路由给更快的 model，把更强的 model 留给认知要求高的工作（debugging、安全审计、接口设计）。
- **工具限制**对每个 subagent 强制最小权限，同时也能把用不到的 tool schemas 从 prompt 中裁掉。
- **轮次上限**（`max_turns`）为执行封顶，避免失控的修正循环。

### Model 建议

Google 建议对 Gemini 3.x 系列模型省略 `temperature`，改用 `thinking_level`。不要在路由到 3.x 模型的 skills 或 subagents 上硬编码 `temperature`；优先使用 `thinking_level`，并随模型演进而重新审视这条建议。

```yaml
# .gemini/agents/security-auditor.md
---
kind: local
model: gemini-3-pro
thinking_level: high   # not: temperature: 0.1
tools: [read_file, grep]
max_turns: 10
---
```

## 用脚本自动化

在每个 skill 里手工维护 per-agent metadata 是重复劳动、容易失同步、也容易出错。更好的做法是保持一个唯一的 source of truth，然后生成 agent 专属的输出：

- 一个生成器读取 per-skill 的配置映射（每个 skill 在给定 agent 下应该用哪个 model、tool allowlist、轮次上限和隔离方式）。
- 对 metadata 类字段，把它注入每个 `SKILL.md` 的 `metadata` key 之下，保持文件符合 spec。
- 对编排类字段，它产出 agent 期望的独立 adapter 文件，例如 `.gemini/agents/*.md` subagent 定义，`SKILL.md` 保持不动。

生成还能让工具校验**语义，而不只是形状**：确认 model 名是已知的模型、tool 名是真实存在的工具、`max_turns` 是正整数、`temperature`（在仍然适用的地方）是范围内的合法数值。只查形状的校验会让 `parseInt("1.5")` 或 `parseFloat("0.2oops")` 这类非法值蒙混过关。

## 状态

本文整合了 [#272](https://github.com/addyosmani/agent-skills/pull/272)、[#36](https://github.com/addyosmani/agent-skills/pull/36) 和 [#35](https://github.com/addyosmani/agent-skills/issues/35) 的讨论，它们都已关闭并采纳本文的做法。本文是 per-agent 配置的唯一参考：它在保持共享 skills 可移植的同时，记录了每个 agent 提供的可作为 opt-in 的高级控制。上文描述的基于脚本的自动化目前还是提案，在达成一致之前不会有实现。
