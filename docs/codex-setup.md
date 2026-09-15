# 在 Codex 中使用 agent-skills

本仓库同时也是一个 [Codex plugin](https://developers.openai.com/codex/plugins/build)。Claude Code 使用的根目录 `skills/` 目录会被 Codex 直接消费，因此没有任何文件被复制或重复。

## 安装

```bash
codex plugin marketplace add vinvcn/addyosmani-agent-skills-zh
codex plugin add agent-skills@agent-skills
```

> 需要 Codex CLI v0.122 或更高版本。在更早的版本上，命令是 `codex marketplace add`。参见 [Codex CLI docs](https://developers.openai.com/codex/cli)。

第一条命令把本仓库注册为 `agent-skills` marketplace。第二条命令从该 marketplace 安装并启用 `agent-skills` plugin。安装后请开始一个新的 Codex session，以便 skills 被发现。

本地 clone 也可以：

```bash
codex plugin marketplace add /path/to/your/clone
codex plugin add agent-skills@agent-skills
```

## 使用

安装后，在 Codex 聊天中用 `@` 调用 skill（例如 `@spec-driven-development`），或者直接描述任务、让 Codex 挑选合适的 skill。`skills/` 下全部 25 个 skills 都可用。

[Codex 使用渐进式披露](https://developers.openai.com/codex/skills)：它先从每个 skill 的 `name` 和 `description` 开始，按需选择 skills，只有被选中时才加载完整的 `SKILL.md`。不要把 `using-agent-skills/SKILL.md` 再粘贴进 `AGENTS.md`、system prompt 或其他常驻上下文：那会把本包的 meta-router 叠在 Codex 的原生 router 之上，白白增加 routing 工作。meta-skill 可以随包保持安装状态；这里警告的仅是预加载它的完整指令。

## 工作原理

- `.codex-plugin/plugin.json` — 仓库根目录的 Codex plugin manifest。把 `skills` 指向 `./skills/`，并提供 Codex 所需的 metadata。
- `.agents/plugins/marketplace.json` — marketplace 条目，声明仓库根目录（`./`）为 plugin 来源。
- `skills/<name>/SKILL.md` — 保持原样。Codex 和 Claude Code 共享同一套 `name` + `description` frontmatter 格式，一个文件同时服务两个平台。

`.claude/commands/` 中的 slash commands、`agents/` 中的 personas，以及 `hooks/` 下的 lifecycle hook 仍然是 Claude Code 专属的。在 Codex 上，直接调用底层的 skill 来替代 slash command（例如用 `@spec-driven-development` 而不是 `/spec`）。
