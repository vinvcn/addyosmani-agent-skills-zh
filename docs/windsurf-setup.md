# 在 Windsurf 中使用 agent-skills

## 设置

### Project Rules

Windsurf 使用 `.windsurfrules` 存放项目专属 agent instructions：

```bash
# 用最重要的 skills 创建合并 rules 文件
cat /path/to/agent-skills/skills/test-driven-development/SKILL.md > .windsurfrules
echo "\n---\n" >> .windsurfrules
cat /path/to/agent-skills/skills/incremental-implementation/SKILL.md >> .windsurfrules
echo "\n---\n" >> .windsurfrules
cat /path/to/agent-skills/skills/code-review-and-quality/SKILL.md >> .windsurfrules
```

### Global Rules

对于你希望在所有项目中使用的 skills，将它们添加到 Windsurf 的 global rules：

1. 打开 Windsurf → Settings → AI → Global Rules
2. 粘贴你最常用 skills 的内容

## 推荐配置

让 `.windsurfrules` 聚焦于 2-3 个关键 skills，以控制上下文占用：

```
# .windsurfrules
# Essential agent-skills for this project

[Paste test-driven-development SKILL.md]

---

[Paste incremental-implementation SKILL.md]

---

[Paste code-review-and-quality SKILL.md]
```

## 使用建议

1. **保持选择性** — Windsurf 的上下文有限。选择最能覆盖你主要质量缺口的 skills。
2. **在对话中引用** — 处理特定阶段时，将额外 skill 内容粘贴进 chat（例如构建 auth 时粘贴 `security-and-hardening`）。
3. **把 references 当作 checklists** — 粘贴 `references/security-checklist.md`，并让 Windsurf 逐项验证。
