# 在 Cursor 中使用 agent-skills

## 设置

### 选项 1：Rules Directory（推荐）

Cursor 支持用 `.cursor/rules/` 目录存放项目专属 rules：

```bash
# 创建 rules 目录
mkdir -p .cursor/rules

# 复制你想作为 rules 使用的 skills
cp /path/to/agent-skills/skills/test-driven-development/SKILL.md .cursor/rules/test-driven-development.md
cp /path/to/agent-skills/skills/code-review-and-quality/SKILL.md .cursor/rules/code-review-and-quality.md
cp /path/to/agent-skills/skills/incremental-implementation/SKILL.md .cursor/rules/incremental-implementation.md
```

此目录中的 rules 会自动加载到 Cursor 的上下文中。

### 选项 2：.cursorrules 文件

在项目根目录创建 `.cursorrules` 文件，并内联关键 skills：

```bash
# 生成合并后的 rules 文件
cat /path/to/agent-skills/skills/test-driven-development/SKILL.md > .cursorrules
echo "\n---\n" >> .cursorrules
cat /path/to/agent-skills/skills/code-review-and-quality/SKILL.md >> .cursorrules
```

## 推荐配置

### Essential Skills（始终加载）

将这些添加到 `.cursor/rules/`：

1. `test-driven-development.md` — TDD workflow 和 Prove-It pattern
2. `code-review-and-quality.md` — 五轴 review
3. `incremental-implementation.md` — 以小而可验证的切片构建

### Phase-Specific Skills（按需加载）

对于特定阶段的工作，按需创建额外 rule 文件：

- `spec-development.md` -> `spec-driven-development/SKILL.md`
- `frontend-ui.md` -> `frontend-ui-engineering/SKILL.md`
- `security.md` -> `security-and-hardening/SKILL.md`
- `performance.md` -> `performance-optimization/SKILL.md`

处理相关任务时将这些添加到 `.cursor/rules/`，完成后移除，以控制上下文占用。

## 使用建议

1. **不要一次加载所有 skills** - Cursor 有上下文限制。加载 2-3 个关键 skills 作为 rules，并按需添加阶段性 skills。
2. **显式引用 skills** - 告诉 Cursor “Follow the test-driven-development rules for this change”，确保它读取已加载的 rules。
3. **用 agents 做 review** - 复制 `agents/code-reviewer.md` 内容，并告诉 Cursor “review this diff using this code review framework.”
4. **按需加载 references** - 处理性能问题时，将 `performance.md` 添加到 `.cursor/rules/`，或直接粘贴 checklist 内容。
