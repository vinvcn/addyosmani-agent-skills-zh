# 在 GitHub Copilot CLI 中使用 agent-skills

独立的 `copilot` 命令行工具可以把本仓库作为 plugin 安装，并发现 `skills/` 中的每一个 skill。VS Code 内的 Copilot 请看 [copilot-setup.md](copilot-setup.md) —— 那里的设置和调用模型不一样。

## 安装

**从本仓库的 marketplace 安装** —— 先注册，再从中安装。`addy-agent-skills` 是本仓库声明的 marketplace 名称，不是 GitHub 全局的 registry，而且这个名字只有在 `marketplace add` 之后才能解析：

```bash
copilot plugin marketplace add vinvcn/addyosmani-agent-skills-zh
copilot plugin install agent-skills@addy-agent-skills
```

**直接从仓库安装**，无需注册 marketplace：

```bash
copilot plugin install vinvcn/addyosmani-agent-skills-zh
```

**从本地 clone 安装**，用于 session 级的开发安装：

```bash
git clone https://github.com/vinvcn/addyosmani-agent-skills-zh.git
copilot --plugin-dir /path/to/agent-skills
```

`--plugin-dir` 只为那个 session 加载 plugin，不做任何持久安装 —— 在编辑 skills 时使用它。

## 验证

```bash
copilot plugin list   # agent-skills@addy-agent-skills
copilot skill list    # the plugin's skills, alongside the built-in ones
```

在交互式 session 中，`/skills list` 显示同一份 catalog。

## 你能得到什么、得不到什么

根目录的 `plugin.json` 是 Copilot CLI 读取的 manifest —— 它的优先级高于属于 Claude Code 的 `.claude-plugin/plugin.json`。根 manifest 只声明了 name、version 和 description，因此各组件路径回落到默认值：

- **Skills —— 可用。** 没有显式路径时，CLI 使用约定的 `skills/` 目录，skills 在那里被发现。
- **Lifecycle commands —— 不可用。** 根 manifest 没有 `commands` 字段，因此 `/spec`、`/plan`、`/build`、`/test`、`/review` 或 `/ship` 都不会注册。那些文件位于 `.claude/commands/`，是 Claude Code 的 commands。

关于 manifest 优先级和各组件路径的默认值，参见 [CLI plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference) 和 [Creating plugins](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating)。

## 使用

点名你要的 skill，或描述任务、让 agent 路由过去：

> Use the spec-driven-development skill to write a spec for [the feature].

> Use the test-driven-development skill: write a failing test for this bug first, then fix it.

> Use the code-review-and-quality skill to review my staged changes.

## 故障排查

| 症状 | 检查什么 |
|---------|---------------|
| `plugin install` 无法解析 `agent-skills@addy-agent-skills` | 先运行 `copilot plugin marketplace add vinvcn/addyosmani-agent-skills-zh` —— 该 marketplace 注册后这个名字才能解析。或者直接安装仓库。 |
| Plugin 装了但没有 skills | 用 `copilot plugin list` 确认 plugin，再用 `copilot skill list`（或 session 内的 `/skills list`）查看发现了什么。 |
| 找不到 `/spec`、`/build` 等命令 | 这是预期行为，不是安装坏了：根 manifest 没有注册任何 commands。改为点名 skill。 |
| 本地改了 skills 但 CLI 还显示旧副本 | 开一个新 session，或用 `--plugin-dir` 指向你的 clone 运行。 |
