# 为 Agent Skills 做贡献

感谢你有兴趣贡献！本项目是面向 AI coding agents 的生产级工程 skills 集合。

## 添加新 Skill

1. 在 `skills/` 下创建一个 kebab-case 名称的目录
2. 添加一个遵循 [docs/skill-anatomy.md](docs/skill-anatomy.md) 格式的 `SKILL.md`
3. 包含带 `name` 和 `description` 字段的 YAML frontmatter
4. 确保 `description` 简要说明 skill 做什么（第三人称），然后包含 `Use when` 触发条件

### Skill 质量标准

Skills 应该是：

- **Specific** — 可执行步骤，而不是模糊建议
- **Verifiable** — 带证据要求的清晰退出标准
- **Battle-tested** — 基于真实工程工作流，而不是理论理想
- **Minimal** — 只包含正确引导 agent 所需的内容

### 结构

每个新 skill 都必须有：

- skill 目录中的 `SKILL.md`
- 带有效 `name` 和 `description` 的 YAML frontmatter

新 skills 通常应遵循标准 anatomy：

- **Overview** — 这个 skill 做什么，以及为什么重要
- **When to Use** — 触发条件
- **Process** — 分步工作流
- **Common Rationalizations** — agents 用来跳过步骤的借口及其反驳
- **Red Flags** — skill 被错误应用的警示信号
- **Verification** — 如何确认 skill 已被正确应用

### 不要做什么

- 不要在 skills 之间复制内容，应改为引用其他 skills
- 不要添加模糊建议式 skills，而不是可执行流程
- 除非内容超过 100 行，否则不要创建 supporting files
- 不要把 reference material 放进 skill directories，应使用 `references/`

## 修改现有 Skills

- 保持变更聚焦且最小
- 保留现有结构和语气
- 编辑后测试 YAML frontmatter 仍然有效

## 测试 Hooks

session-start hook（`hooks/session-start.sh`）会将 `using-agent-skills` meta-skill 注入每个新的 Claude Code session。`hooks/session-start-test.sh` 中的 regression test 会验证 hook 的 JSON payload，包括 `jq` 可用和不可用两种情况。

在提交任何触及以下文件的 PR 前运行它：

- `hooks/session-start.sh`
- `skills/using-agent-skills/SKILL.md`（hook 嵌入的 meta-skill 内容）

```bash
bash hooks/session-start-test.sh
```

预期输出：`session-start JSON payload OK`。任何 assertion 失败都会让脚本以非零状态退出。

### 复现 no-jq fallback

当 `jq` 不在 `PATH` 中时，hook 会优雅降级为 `INFO` priority payload。要在本地执行该分支，可在测试调用时从 `PATH` 中移除 `jq` 的目录：

```bash
JQ_DIR=$(dirname "$(command -v jq)")
PATH=$(echo "$PATH" | tr ':' '\n' | grep -v "^${JQ_DIR}$" | tr '\n' ':' | sed 's/:$//') \
  bash hooks/session-start-test.sh
```

当 `jq` 独占自己的目录时（例如 Homebrew 的 `/opt/homebrew/bin`，或手动安装的 `/usr/local/bin`），这会很干净。如果你的 `jq` 与测试依赖的其他工具共用 system bin（例如 `/usr/bin` 中的 `mktemp`），更简单的做法是通过单独的 package manager 安装 `jq`，让它拥有自己的 bin 目录，然后重新运行。

在剥离后的 `PATH` 下，hook 的 `command -v jq` check 会失败，`INFO` priority fallback 会运行，测试会断言 `jq is required` guidance message，而不是正常 payload。

## 报告问题

如果你发现以下问题，请 open an issue：

- 某个 skill 给出不正确或过时的 guidance
- 缺少对常见工程工作流的覆盖
- Skills 之间存在不一致

## License

贡献即表示你同意你的贡献将按 MIT License 授权。
