# 在 GitHub Copilot 中使用 agent-skills

## 设置

### Copilot Instructions

Copilot 支持在仓库中通过 `.github/skills`、`.claude/skills` 或 `.agents/skills` 目录创建 agent skills。

```bash
mkdir -p .github

# 为关键 skills 创建文件
cat /path/to/agent-skills/skills/test-driven-development/SKILL.md > .github/skills/test-driven-development/SKILL.md
cat /path/to/agent-skills/skills/code-review-and-quality/SKILL.md > .github/skills/code-review-and-quality/SKILL.md
```

更多细节参见 [Creating agent skills for GitHub Copilot](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-skills)。

### Agent Personas（agents.md）

Copilot 支持专门的 agent personas。使用 agent-skills 中的 agents：

```bash
# 复制 agent definitions
cp /path/to/agent-skills/agents/code-reviewer.md .github/agents/code-reviewer.md
cp /path/to/agent-skills/agents/test-engineer.md .github/agents/test-engineer.md
cp /path/to/agent-skills/agents/security-auditor.md .github/agents/security-auditor.md
```

在 Copilot Chat 中调用 agents：
- `@code-reviewer Review this PR`
- `@test-engineer Analyze test coverage for this module`
- `@security-auditor Check this endpoint for vulnerabilities`

### Custom Instructions（用户级）

对于你希望在所有仓库中使用的 skills：

1. 打开 VS Code → Settings → GitHub Copilot → Custom Instructions
2. 添加你最常用的 skill 摘要

## 推荐配置

### .github/copilot-instructions.md

GitHub Copilot 支持通过 `.github/copilot-instructions.md` 提供项目级 instructions。

```markdown
# Project Coding Standards

## Testing
- Write tests before code (TDD)
- For bugs: write a failing test first, then fix (Prove-It pattern)
- Test hierarchy: unit > integration > e2e (use the lowest level that captures the behavior)
- Run `npm test` after every change

## Code Quality
- Review across five axes: correctness, readability, architecture, security, performance
- Every PR must pass: lint, type check, tests, build
- No secrets in code or version control

## Implementation
- Build in small, verifiable increments
- Each increment: implement → test → verify → commit
- Never mix formatting changes with behavior changes

## Boundaries
- Always: Run tests before commits, validate user input
- Ask first: Database schema changes, new dependencies
- Never: Commit secrets, remove failing tests, skip verification
```

### Specialized Agents

在 Copilot Chat 中使用这些 agents 执行有针对性的 review workflow。

## 使用建议

1. **保持 instructions 简洁** — Copilot instructions 聚焦时效果最好。摘要化关键规则，而不是塞入完整 skill 文件。
2. **用 agents 做 review** — code-reviewer、test-engineer 和 security-auditor agents 是为 Copilot 的 agent model 设计的。
3. **在 chat 中引用** — 处理某个具体阶段时，把相关 skill 内容粘贴到 Copilot Chat 作为上下文。
4. **结合 PR reviews** — 配置 Copilot 使用 code-reviewer agent persona 来 review PR。
