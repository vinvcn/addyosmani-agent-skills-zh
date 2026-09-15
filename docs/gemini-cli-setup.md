# 在 Gemini CLI 中使用 agent-skills

## 设置

### 选项 1：作为 Skills 安装（推荐）

Gemini CLI 有原生 skills 系统，会自动发现 `.gemini/skills/` 或 `.agents/skills/` 目录中的 `SKILL.md` 文件。每个 skill 会在匹配你的任务时按需激活。

**从仓库安装：**

```bash
gemini skills install https://github.com/vinvcn/addyosmani-agent-skills-zh.git --path skills
```

**或从本地 clone 安装：**

```bash
git clone https://github.com/vinvcn/addyosmani-agent-skills-zh.git
gemini skills install /path/to/agent-skills/skills/
```

**只为特定 workspace 安装：**

```bash
gemini skills install /path/to/agent-skills/skills/ --scope workspace
```

以 workspace scope 安装的 skills 会进入 `.gemini/skills/`（或 `.agents/skills/`）。用户级 skills 会进入 `~/.gemini/skills/`。

安装后，用以下命令验证：

```
/skills list
```

Gemini CLI 会自动将 skill 名称和 description 注入 prompt。当它识别出匹配任务时，会在加载完整 instructions 前请求激活该 skill 的权限。

### 选项 2：GEMINI.md（持久上下文）

对于你希望始终作为项目持久上下文加载的 skills（而不是按需激活），将它们添加到项目的 `GEMINI.md`：

```bash
# Create GEMINI.md with core skills as persistent context
cat /path/to/agent-skills/skills/incremental-implementation/SKILL.md > GEMINI.md
echo -e "\n---\n" >> GEMINI.md
cat /path/to/agent-skills/skills/code-review-and-quality/SKILL.md >> GEMINI.md
```

你也可以通过从独立文件导入来模块化：

```markdown
# Project Instructions

@skills/test-driven-development/SKILL.md
@skills/incremental-implementation/SKILL.md
```

使用 `/memory show` 验证已加载上下文，修改后用 `/memory reload` 刷新。

> **Skills vs GEMINI.md:** Skills 是按需激活的专业能力，只在相关时加载，能保持上下文窗口干净。GEMINI.md 提供每个 prompt 都会加载的持久上下文。将 skills 用于阶段性 workflows，将 GEMINI.md 用于始终生效的项目约定。

## 推荐配置

### Always-On（GEMINI.md）

将这些作为每个 session 的持久上下文：

- `incremental-implementation` — 以小而可验证的切片构建
- `code-review-and-quality` — 五轴 review

### On-Demand（Skills）

将这些安装为 skills，让它们只在相关时激活：

- `test-driven-development` — 实现逻辑或修复 bug 时激活
- `spec-driven-development` — 开始新项目或新功能时激活
- `frontend-ui-engineering` — 构建 UI 时激活
- `security-and-hardening` — security reviews 期间激活
- `performance-optimization` — 性能工作期间激活

## 高级配置

### MCP Integration

本包中的许多 skills 会借助 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) tools 与环境交互。例如：

- `browser-testing-with-devtools` 使用 `chrome-devtools` MCP extension。
- `performance-optimization` 可以受益于性能相关的 MCP tools。

要启用这些能力，请确保你的 Gemini CLI 配置（`~/.gemini/config.json`）中安装了相关 MCP extensions。

### Session Hooks

Gemini CLI 支持 session lifecycle hooks。你可以用它们在 session 开始时自动注入上下文或运行验证脚本。

要复刻其他工具中的 `agent-skills` 体验，可以配置一个 `SessionStart` hook，用来提醒可用 skills 或加载一个 meta-skill。

### Explicit Context Loading

你可以在 prompt 中用 `@` 符号引用任意 skill，将它显式加载到当前 session：

```markdown
Use the @skills/test-driven-development/SKILL.md skill to implement this fix.
```

当你希望确保遵循特定 workflow、而不是等待自动发现时，这会很有用。

## Slash Commands

本仓库在 `.gemini/commands/` 下提供 9 个 slash commands：8 个生命周期命令，外加 `/webperf` 这个专项审计命令。从项目根目录运行时，Gemini CLI 会自动发现它们。

| Command | 作用 |
|---------|--------------|
| `/spec` | 写代码前先编写结构化 spec |
| `/constraints` | 定义并执行项目的质量标准 |
| `/planning` | 将工作拆成小而可验证的任务 |
| `/build` | 增量实现下一个任务 |
| `/test` | 运行 TDD workflow：red、green、refactor |
| `/review` | 五轴 code review |
| `/code-simplify` | 在不改变行为的前提下降低复杂度 |
| `/ship` | 通过并行 persona fan-out 执行发布前 checklist |
| `/webperf` | 审计面向浏览器应用的性能问题与 Core Web Vitals |

每个 command 都会自动调用对应 skill，无需手动加载 skill。

> **注意:** 使用 `/planning` 而不是 `/plan`。`/plan` 会与 Gemini CLI 内部 command 名称冲突。

## 使用建议

1. **优先使用 skills，而不是 GEMINI.md** — Skills 按需激活，让上下文窗口保持聚焦。只有当你希望它们始终加载时，才把 skills 放进 GEMINI.md。
2. **Skill descriptions 很重要** — 每个 SKILL.md 的 frontmatter 都有 `description` 字段，用来告诉 agents 何时激活它。本仓库的 descriptions 已针对所有支持工具（Claude Code、Gemini CLI 等）的自动发现做了优化，明确说明 skill *做什么* 以及 *何时* 触发。
3. **用 agents 做 review** — 请求结构化 code reviews 时，复制 `agents/code-reviewer.md` 的内容。
4. **结合 references** — 处理 testing 或 performance 等特定质量领域时，引用 `references/` 中的 checklists。
