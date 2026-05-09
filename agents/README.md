# Agent Personas

Specialist personas 扮演单一角色，并保持单一视角。每个 persona 都是一个 Markdown 文件，由你的 harness（Claude Code、Cursor、Copilot 等）作为 system prompt 使用。

| Persona | Role | 最适合 |
|---------|------|----------|
| [code-reviewer](code-reviewer.md) | Senior Staff Engineer | 合并前五轴 review |
| [security-auditor](security-auditor.md) | Security Engineer | 漏洞检测、OWASP 风格 audit |
| [test-engineer](test-engineer.md) | QA Engineer | 测试策略、覆盖率分析、Prove-It pattern |

## Personas、skills 和 commands 的关系

三层各有清晰职责：

| Layer | 它是什么 | Example | 组合角色 |
|-------|-----------|---------|------------------|
| **Skill** | 带步骤和退出标准的工作流 | `code-review-and-quality` | *how* — 从 persona 或 command 内部调用 |
| **Persona** | 带视角和输出格式的角色 | `code-reviewer` | *who* — 采用一个观点，生成报告 |
| **Command** | 面向用户的入口点 | `/review`, `/ship` | *when* — 组合 personas 和 skills |

用户（或 slash command）是 orchestrator。**Personas 不调用其他 personas。** Skills 是 persona workflow 内部的必经步骤。

## 何时使用各类方式

### 直接调用 persona
当你希望围绕当前变更获得一个视角，并且用户参与循环时，选择这种方式。

- "Review this PR" → 直接调用 `code-reviewer`
- "Are there security issues in `auth.ts`?" → 直接调用 `security-auditor`
- "What tests are missing for the checkout flow?" → 直接调用 `test-engineer`

### Slash command（背后单一 persona）
当存在一个你原本每次都要重复解释的可重复 workflow 时，选择这种方式。

- `/review` → 用项目的 review skill 包装 `code-reviewer`
- `/test` → 用 TDD skill 包装 `test-engineer`

### Slash command（orchestrator — fan-out）
仅当 **independent** investigations 可以并行运行，并生成报告供单个 agent 合并时，才选择这种方式。

- `/ship` → 并行 fan out 到 `code-reviewer` + `security-auditor` + `test-engineer`，然后将报告综合为 go/no-go decision

这是本仓库唯一认可的 orchestration pattern。完整 pattern catalog 和 anti-patterns 见 [references/orchestration-patterns.md](../references/orchestration-patterns.md)。

## 决策矩阵

```
Is the work a single perspective on a single artifact?
├── Yes → Direct persona invocation
└── No  → Are the sub-tasks independent (no shared mutable state, no ordering)?
         ├── Yes → Slash command with parallel fan-out (e.g. /ship)
         └── No  → Sequential slash commands run by the user (/spec → /plan → /build → /test → /review)
```

## 示例：有效编排

`/ship` 是本仓库中规范的 fan-out orchestrator：

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

它为什么可行：
- 每个 sub-agent 处理同一个 diff，但生成 **不同视角**
- 它们之间没有依赖 → 真正并行，节省真实 wall-clock 时间
- 每个都在 fresh context window 中运行 → main session 保持整洁
- merge step 很小且受益于完整上下文，所以留在 main agent 中

## 示例：无效编排（不要构建这个）

一个 `meta-orchestrator` persona，其职责是“决定调用哪个其他 persona”：

```
/work-on-pr → meta-orchestrator
                  ↓ (decides "this needs a review")
              code-reviewer
                  ↓ (returns)
              meta-orchestrator (paraphrases result)
                  ↓
              user
```

它为什么失败：
- 纯 routing layer，没有领域价值
- 增加两次转述 hop → 信息损失 + 2× token 成本
- 用户已经知道自己想要 review；让他们直接调用 `/review`
- 重复了 slash commands 和 `AGENTS.md` intent-mapping 已经承担的工作

## Personas 规则

1. Persona 是单一角色，且只有单一输出格式。如果你发现自己在添加第二个角色，请创建第二个 persona。
2. **Personas 不调用其他 personas。** 组合是 slash commands 或用户的职责。在 Claude Code 上，这也是硬性平台约束：*"subagents cannot spawn other subagents"*，所以该规则会被平台强制执行。
3. Persona 可以调用 skills（即 *how*）。
4. 每个 persona 文件都以 "Composition" block 结尾，说明它适合放在哪里。

## Claude Code interop

本仓库中的 personas 设计为无需修改即可作为 Claude Code subagents 和 Agent Teams teammates 使用：

- **As subagents:** 启用本 plugin 后自动发现（无需 path config）。使用 Agent tool 并传入 `subagent_type: code-reviewer`（或 `security-auditor`、`test-engineer`）。`/ship` 是规范示例。
- **As Agent Teams teammates**（实验性，需要 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`）：spawn teammate 时引用相同 persona 名称。Persona 正文会作为附加 instructions **追加到** teammate 的 system prompt（不是替换），因此你的 persona 文本会叠加在 lead 安装的 team-coordination instructions（SendMessage、task-list tools 等）之上。

Subagents 只把结果报告给 main agent。Agent Teams 允许 teammates 直接互相发送消息。当报告足够时使用 subagents；当 sub-agents 需要互相挑战发现时（例如 competing-hypothesis debugging），使用 Agent Teams。完整映射见 [references/orchestration-patterns.md](../references/orchestration-patterns.md)。

Plugin agents 不支持 `hooks`、`mcpServers` 或 `permissionMode` frontmatter，这些字段会被静默忽略。在这里编写新 personas 时，不要依赖这些字段。

## 添加新 persona

1. 使用现有 personas 的相同 frontmatter 格式创建 `agents/<role>.md`。
2. 定义 role、scope、output format 和 rules。
3. 在底部添加 **Composition** block（Invoke directly when / Invoke via / Do not invoke from another persona）。
4. 将 persona 添加到本文件顶部表格。
5. 如果该 persona 启用了新的 orchestration pattern，请在 `references/orchestration-patterns.md` 中记录它，而不是在 persona 文件本身发明 pattern。
