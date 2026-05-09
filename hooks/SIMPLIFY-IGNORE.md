# simplify-ignore hook

面向 `/code-simplify` 的 block-level protection。标记绝不能被简化的代码；模型将看不到它。

## 设置

1. 标注你想保护的 blocks：

```js
/* simplify-ignore-start: perf-critical */
// manually unrolled XOR — 3x faster than a loop
result[0] = buf[0] ^ key[0];
result[1] = buf[1] ^ key[1];
result[2] = buf[2] ^ key[2];
result[3] = buf[3] ^ key[3];
/* simplify-ignore-end */
```

2. 将 hooks 添加到 `.claude/settings.json`：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read",
        "hooks": [{ "type": "command", "command": "bash ${CLAUDE_PROJECT_DIR}/hooks/simplify-ignore.sh" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "bash ${CLAUDE_PROJECT_DIR}/hooks/simplify-ignore.sh" }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "bash ${CLAUDE_PROJECT_DIR}/hooks/simplify-ignore.sh" }]
      }
    ]
  }
}
```

3. 运行 `/code-simplify` — protected blocks 会变成 `/* BLOCK_de115a1d: perf-critical */` placeholders。模型可以围绕周边代码推理，但看不到受保护的实现。

> **注意：** 该 hook 会将临时 backups 存储在 `.claude/.simplify-ignore-cache/`。请确保此路径位于 `.gitignore` 中。

## 工作方式

一个脚本处理三个 hook events：

| Event | Action |
|---|---|
| `PreToolUse Read` | 备份文件，并就地将 blocks 替换为 `BLOCK_<hash>` placeholders |
| `PostToolUse Edit\|Write` | 将 placeholders 展开回真实代码，保存模型的变更，并再次过滤 |
| `Stop` | session 结束时从 backup 恢复所有文件 |

每个 block 都会根据内容 hash（通过 `shasum`/`sha1sum` 生成 8 个十六进制字符），因此即使模型复制或重排 placeholders，往返恢复也不会歧义。Cache 按项目隔离，以避免跨 session 干扰。

## 标注语法

```js
/* simplify-ignore-start */           // basic — hides the block
/* simplify-ignore-start: reason */   // with reason — appears in placeholder
/* simplify-ignore-end */
```

任意 comment style 都可用（`//`、`/*`、`#`、`<!--`）。支持每个文件多个 blocks，也支持单行 blocks。Placeholders 会保留原始 comment syntax（例如 Python 中的 `# BLOCK_xxx`、HTML 中的 `<!-- BLOCK_xxx -->`）。

## Crash recovery

如果 Claude Code 崩溃且没有触发 Stop hook，磁盘上的文件可能仍然带有 `BLOCK_<hash>` placeholders。手动恢复：

```bash
echo '{}' | bash hooks/simplify-ignore.sh
```

Backups 存储在项目目录内的 `.claude/.simplify-ignore-cache/`。

## 已知限制

- **单行 blocks 会隐藏整行。** 如果 `simplify-ignore-start` 和 `simplify-ignore-end` 与其他代码出现在同一行，整行都会对模型隐藏，而不仅是标注部分。请使用独立行进行标注。
- **Comment suffix detection 只覆盖 `*/` 和 `-->`。** 使用非标准 comment closers 的模板引擎（ERB `%>`、Blade `--}}`）可能产生不平衡 placeholders。请改用 `#` 或 `//` 风格注释。
- **Fallback expansion 是渐进的，不是精确的。** 如果模型改变了 placeholder 的格式（例如修改 reason text），hook 会尝试逐步更简单的匹配：完整 placeholder → prefix+hash+suffix → hash-only。hash-only fallback 可能留下外观残留（例如多余的 `:` 或 reason text）。发生这种情况时会向 stderr 打印 warning。
- **文件重命名会留下 placeholders。** 如果模型通过 shell command 重命名或移动文件，新文件会保留 `BLOCK_<hash>` placeholders。session 停止时，原始代码会保存为 `<old-filename>.recovered`。你必须手动将 recovered code 恢复到新文件中。

## 要求

- `jq`, `shasum` or `sha1sum` (auto-detected), Bash 3.2+
