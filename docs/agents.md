# Agent Personas

只扮演单一角色、持单一视角的 specialist personas。每个 persona 都是一个 Markdown 文件，由你的 harness（Claude Code、Cursor、Copilot 等）作为 system prompt 消费。

| Persona | 角色 | 最适合 |
|---------|------|----------|
| [code-reviewer](../agents/code-reviewer.md) | Senior Staff Engineer | Merge 前的五轴 review |
| [security-auditor](../agents/security-auditor.md) | Security Engineer | 漏洞检测、OWASP 风格审计 |
| [test-engineer](../agents/test-engineer.md) | QA Engineer | 测试策略、覆盖率分析、Prove-It pattern |
| [web-performance-auditor](../agents/web-performance-auditor.md) | Web Performance Engineer | Core Web Vitals 审计、加载/渲染/网络分析 |

## Personas 与 skills、commands 的关系

三层结构，各有明确分工：

| 层 | 是什么 | 示例 | 组合角色 |
|-------|-----------|---------|------------------|
| **Skill** | 带步骤和退出标准的 workflow | `code-review-and-quality` | *how* —— 在 persona 或 command 内部被调用 |
| **Persona** | 带视角和输出格式的角色 | `code-reviewer` | *who* —— 采取某个视角，产出报告 |
| **Command** | 面向用户的入口点 | `/review`、`/ship` | *when* —— 组合 personas 和 skills |

用户（或 slash command）才是 orchestrator。**Personas 不调用其他 personas。** Skills 是 persona workflow 中的必经环节。

## 各用在什么时候

### 直接调用 persona
当你只想要当前变更的一个视角、且用户在环时，选这个。

- "Review 这个 PR" → 直接调用 `code-reviewer`
- "`auth.ts` 里有安全问题吗？" → 直接调用 `security-auditor`
- "checkout 流程还缺哪些测试？" → 直接调用 `test-engineer`
- "审计产品页的 Core Web Vitals" → 直接调用 `web-performance-auditor`

### Slash command（背后单个 persona）
当存在一个可重复的 workflow、否则每次都要重新解释时，选这个。

- `/review` → 把项目的 review skill 包在 `code-reviewer` 外面
- `/test` → 把 TDD skill 包在 `test-engineer` 外面
- `/webperf` → 把 `web-performance-auditor` 包起来，用于 web 应用偏性能的审计

### Slash command（orchestrator —— fan-out）
只有当**互相独立**的调查可以并行运行、并且产出的报告随后由单个 agent 合并时，才选这个。

- `/ship` → 并行 fan-out 到 `code-reviewer` + `security-auditor` + `test-engineer`，再把它们的报告合成为 go/no-go 决策

这是本仓库唯一背书的 orchestration pattern。完整的 pattern catalog 和反模式见 [references/orchestration-patterns.md](../references/orchestration-patterns.md)。

## 决策矩阵

```
Is the work a single perspective on a single artifact?
├── Yes → Direct persona invocation
└── No  → Are the sub-tasks independent (no shared mutable state, no ordering)?
         ├── Yes → Slash command with parallel fan-out (e.g. /ship)
         └── No  → Sequential slash commands run by the user (/spec → /plan → /build → /test → /review)
```

## 示例：正确的 orchestration

`/ship` 是本仓库的 canonical fan-out orchestrator：

```
/ship
  ├── (parallel) code-reviewer    → review report
  ├── (parallel) security-auditor → audit report
  └── (parallel) test-engineer    → coverage report
                  ↓
        merge phase (main agent)
                  ↓
        go/no-go decision + rollback plan
```

为什么这样可行：
- 每个 sub-agent 处理同一个 diff，但产出**不同的视角**
- 它们彼此没有依赖 → 真正的并行，实打实的 wall-clock 节省
- 每个都在全新的 context window 中运行 → 主 session 保持清爽
- merge 这一步很小且受益于完整上下文，所以留在主 agent 里

## 示例：错误的 orchestration（不要这样构建）

一个 `meta-orchestrator` persona，其职责是"决定该调用哪个其他 persona"：

```
/work-on-pr → meta-orchestrator
                  ↓ (decides "this needs a review")
              code-reviewer
                  ↓ (returns)
              meta-orchestrator (paraphrases result)
                  ↓
              user
```

为什么会失败：
- 纯路由层，没有领域价值
- 多了两次转述 → 信息损失 + 2× token 成本
- 用户早就知道自己想要 review；让他们直接调用 `/review`
- 重复了 slash commands 和 `AGENTS.md` intent-mapping 已经在做的事

## Personas 规则

1. 一个 persona 是单一角色、单一输出格式。如果你发现自己在加第二个角色，就创建第二个 persona。
2. **Personas 不调用其他 personas。** 组合是 slash commands 或用户的职责。在 Claude Code 上这也是一条硬性平台约束——*"subagents cannot spawn other subagents"* ——所以这条规则替你强制执行了。
3. 一个 persona 可以调用 skills（*how*）。
4. 每个 persona 文件都以一个 "Composition" 块结尾，说明它适合放在哪里。

## Claude Code 互操作

本仓库的 personas 无需修改即可同时作为 Claude Code subagents 和 Agent Teams teammates 使用：

- **作为 subagents：** 启用本 plugin 后自动发现（无需路径配置）。使用 Agent tool，指定 `subagent_type: code-reviewer`（或 `security-auditor`、`test-engineer`）。`/ship` 是 canonical 示例。
- **作为 Agent Teams teammates**（实验性，需要 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`）：spawn teammate 时引用同一个 persona 名字。Persona 的正文会被**追加到** teammate 的 system prompt 上作为附加指令（不是替换），所以你的 persona 文本会叠在 lead 安装的团队协调指令（SendMessage、task-list tools 等）之上。

Subagents 只把结果汇报给主 agent。Agent Teams 允许 teammates 直接互发消息。报告够用就用 subagents；当 sub-agents 需要相互质疑对方的结论时（例如 competing-hypothesis debugging），用 Agent Teams。完整映射见 [references/orchestration-patterns.md](../references/orchestration-patterns.md)。

Plugin agents 不支持 `hooks`、`mcpServers` 或 `permissionMode` frontmatter ——这些字段会被静默忽略。在这里编写新 personas 时不要依赖它们。

## 添加新 persona

1. 创建 `agents/<role>.md`，使用与现有 personas 相同的 frontmatter 格式。
2. 定义角色、范围、输出格式和规则。
3. 在文件底部加一个 **Composition** 块（Invoke directly when / Invoke via / Do not invoke from another persona）。
4. 把这个 persona 加入本文开头的表格。
5. 如果这个 persona 启用了一种新的 orchestration pattern，把它写进 `references/orchestration-patterns.md`，而不是在 persona 文件里自行发明。
