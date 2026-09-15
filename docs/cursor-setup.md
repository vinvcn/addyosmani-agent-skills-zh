# 在 Cursor 中使用 agent-skills

如何用当前受支持的项目上下文机制，把 [agent-skills](../README.md) 接入 **Cursor** —— 而不是过时的单体文件或 Kaizen 专属布局。

---

## Cursor 目前支持什么

Cursor 同时支持 **rules**（简短的 policy）和 **skills**（完整工作流）：

| 层 | 路径 | 角色 |
|-------|------|------|
| **Project rules** | `.cursor/rules/*.mdc` | 常驻或按文件范围生效的 instructions（`alwaysApply`、`globs`） |
| **Project skills** | `.cursor/skills/<skill-name>/SKILL.md` | 由 Agent 发现的工作流；任务匹配 skill `description` 时才会被读取 |
| **User rules** | Cursor Settings → Rules | 账号级 policy |
| **User skills**（可选） | `~/.cursor/skills/` | 在所有 workspace 可用的全局 skills |

文档：[Rules](https://docs.cursor.com/context/rules) · [Skills](https://docs.cursor.com/context/skills)（URL 可能随 Cursor 更新文档而重定向）。

### Rules vs skills

- **Rules** —— 简洁、稳定（“use conventional commits”、“type-annotate public Python APIs”）。一个文件只管一个关注点；避免粘贴大篇指南。
- **Skills** —— 来自本仓库的分步流程（`test-driven-development`、`code-review-and-quality` 等）。**不要**把整个 `SKILL.md` 正文复制进 rules；那会复制出 `.cursor/skills/` 之外的第二份内容，还浪费上下文。

### 遗留方式（新配置不要再用）

| 遗留 | 改用 |
|--------|--------|
| 根目录 `.cursorrules` | `.cursor/rules/*.mdc` |
| 把 `SKILL.md` 复制到 `.cursor/rules/` | `.cursor/skills/<name>/SKILL.md` |
| “把 10 个 skills 作为常驻 rules 加载” | 1-2 条精简的 `alwaysApply` rules + 按需 skills |

---

## 推荐的项目布局

```text
your-project/
├── .cursor/
│   ├── rules/                    # Short .mdc policies (yours)
│   │   └── agent-skills.mdc      # Optional: “use project skills” pointer
│   └── skills/                   # What Cursor Agent loads
│       ├── using-agent-skills/
│       ├── test-driven-development/
│       ├── code-review-and-quality/
│       └── …                     # Synced from agent-skills + your own skills
└── agent-skills/                 # Optional: git submodule or vendor clone
    └── skills/                   # Upstream source only
```

**agent 的唯一事实来源：** `.cursor/skills/`。  
把 `agent-skills/skills/`（或 clone 下来的 [vinvcn/addyosmani-agent-skills-zh](https://github.com/vinvcn/addyosmani-agent-skills-zh.git)）视为**上游** —— 同步进 `.cursor/skills/`；不要只改上游就指望 Cursor 能看到。

---

## 设置（任意仓库）

### 1. 把 skills 安装到 `.cursor/skills/`

**从 agent-skills 的本地 clone**（在项目根目录或其他位置）：

```bash
mkdir -p .cursor/skills
rsync -a /path/to/agent-skills/skills/ .cursor/skills/
```

**首次复制且不覆盖你自己的自定义 skills：**

```bash
rsync -a --ignore-existing /path/to/agent-skills/skills/ .cursor/skills/
```

**上游更新之后：**

```bash
rsync -a /path/to/agent-skills/skills/ .cursor/skills/
```

每个 skill 文件夹必须包含带 YAML frontmatter 的 `SKILL.md`，至少要有：

```yaml
---
name: test-driven-development
description: Drives development with tests. Use when implementing logic, fixing bugs, or changing behavior.
---
```

Cursor 用 `description`（及相关 metadata）来决定何时应用某个 skill。

### 2. 添加最简项目 rules（可选但有用）

创建 `.cursor/rules/agent-skills.mdc`：

```markdown
---
description: Use agent-skills workflows from .cursor/skills
alwaysApply: true
---

Before non-trivial technical work:

1. Route via `.cursor/skills/using-agent-skills/SKILL.md`.
2. Read and follow the matching skill under `.cursor/skills/<name>/SKILL.md`.
3. Open `reference.md` in that folder when the skill links to it.
4. Prefer project skills over guessing; user does not need to say "read skill" each time.
```

为仓库专属标准（风格、语言、技术栈）创建**独立的** `.mdc` 文件，每个文件保持聚焦。

**Rule 文件格式：**

```markdown
---
description: Shown in Cursor rule UI
alwaysApply: false
globs: "**/*.{ts,tsx}"
---

# Your rule content
```

| 字段 | 用途 |
|-------|-----|
| `alwaysApply: true` | 本项目每一次 chat |
| `globs` | 当匹配的文件进入上下文时 |
| `alwaysApply: false` + 无 globs | Agent 主动请求 / 手动引用的 rule（Cursor UI） |

### 3. 用户级 skills（可选）

把你想在所有地方使用的 skill 复制或安装到 `~/.cursor/skills/`。用于全技术栈通用的指南（例如语言模式），而不是 agent-skills 的内容。

`.cursor/skills/` 里的项目级 skills 在**本**仓库的工作流上优先。

### 4. 验证

1. **Settings → Rules** —— 能看到项目的 `.mdc` 文件。
2. **Agent chat** —— `.cursor/skills/` 里的 skills 出现在 skill 列表（取决于你的 Cursor 版本是否暴露该列表）。
3. 运行一个能映射到某个 skill 的任务（例如 “add a feature with tests first”），不点名文件 —— 路由正常时 agent 应该自己去打开 `test-driven-development`。

---

## Agent 应如何使用 skills

1. **发现** —— `using-agent-skills` 把任务阶段映射到 skill 名。
2. **阅读** —— 完整流程在 `.cursor/skills/<name>/SKILL.md`。
3. **深入** —— 当 skill 指明时，读 `reference.md`、`references/*.md` 或链接的 checklist。
4. **组合** —— 例如做 API 切片时用 `incremental-implementation` + `api-and-interface-design`。

如果 agent 跑偏，用户的显式措辞（“follow TDD”、“use code-review-and-quality”）仍然有帮助。

### 阶段 → skill（速查）

| 你正在… | Skill |
|----------|--------|
| 澄清需求 | `interview-me`、`idea-refine`、`spec-driven-development` |
| 规划任务 | `planning-and-task-breakdown` |
| 实现 | `incremental-implementation`、`frontend-ui-engineering`、`api-and-interface-design` |
| 测试 | `test-driven-development`、`browser-testing-with-devtools` |
| 调试 | `debugging-and-error-recovery` |
| Review | `code-review-and-quality`、`code-simplification` |
| 安全 / 性能 | `security-and-hardening`、`performance-optimization` |
| Git / CI / 发布 | `git-workflow-and-versioning`、`ci-cd-and-automation`、`shipping-and-launch` |

完整决策树：仓库内的 `skills/using-agent-skills/SKILL.md`。

---

## 不要做什么

| 避免 | 改用 |
|-------|------------|
| 把所有 skills 粘进一条 rule | 同步到 `.cursor/skills/` |
| 维护两份各自漂移的副本 | 用 `rsync` 从上游同步；把 `.cursor/skills/` 提交进版本库 |
| 很多条 `alwaysApply: true` rules | 一条路由 rule + 聚焦 globs 的 rules |
| 只依赖 `.cursorrules` | 迁移到 `.mdc` + skills |
| 期待 `agent-skills/agents/*.md` 自动加载 | 粘贴进 chat，或提炼成一条短 rule |

---

## 上下文技巧

- **常驻** rules 保持很小（路由 + 1-2 条不可妥协项）。
- 让 **skills** 承载长 checklist 和反合理化表格。
- 只在需要时添加按阶段区分的 **globs** rules（例如 `**/*.py`、`**/components/**`）。
- 如果验证步骤被跳过，就点名 skill 提醒一下。

---

## `agents/` 目录

`agent-skills/agents/` 下的文件（例如 code reviewer persona）**不会**被 Cursor 自动加载。可选做法：

- 引用对应的 skill（`code-review-and-quality`）。
- 把 agent markdown 粘贴进 chat，用于单次 review。
- 提炼一份**简短** checklist 写进 `.mdc` rule。

---

## 故障排查

| 症状 | 检查 |
|---------|--------|
| skill 从未被使用 | `.cursor/skills/<name>/` 下有 `SKILL.md`？frontmatter 的 `description` 有效？ |
| rules 被忽略 | 扩展名是 `.mdc`？`alwaysApply` / `globs` 正确？ |
| workflow 过时 | 从 `agent-skills/skills/` 重新 `rsync` |
| instructions 重复 | 从 rules 里移除 skill 内容；只保留一个来源 |
| 选错了 skill | 收窄自定义 skills 的 `description`；在 chat 里点名提醒 |

---

## Checklist（新项目）

- [ ] `mkdir -p .cursor/skills` 并从 `agent-skills/skills/` 同步
- [ ] 可选：带路由提示的 `.cursor/rules/agent-skills.mdc`
- [ ] 把仓库专属 rules 作为独立的小型 `.mdc` 文件添加
- [ ] 提交 `.cursor/skills/` 和 `.cursor/rules/`（团队共享行为）
- [ ] 除非遗留工具链要求，否则跳过庞大的 `.cursorrules`

---

## 参见

- [getting-started.md](getting-started.md)
- [../README.md](../README.md) —— Cursor 的简介段落
- 上游：[github.com/addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)
