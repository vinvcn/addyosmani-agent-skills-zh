---
name: spec-driven-development
description: 编码前先创建 spec。用于开始新项目、功能或重大变更且还没有规格说明时。用于撰写带目标和范围的 PRD 或需求文档时，或需求不清晰、有歧义、只是一段模糊想法时。用于单个需求横跨多个可独立测试的能力、需要先拆解成模块能力地图再做规格说明时。
---

# Spec-Driven Development

## 概览

在编写任何代码之前，先写一份结构化规格说明。spec 是你和人类工程师之间共享的事实来源，它定义我们要构建什么、为什么构建，以及如何知道它完成了。没有 spec 的代码就是猜测。

## 何时使用

- 开始一个新项目或功能
- 需求有歧义或不完整
- 变更触及多个文件或模块
- 你即将做出架构决策
- 任务实现需要超过 30 分钟

**何时不要使用：** 单行修复、拼写更正，或需求明确且自包含的变更。

## 门控工作流

Spec-driven development 有四个阶段，前面还有一个范围检查（阶段 0），它只在一个请求打包了多个可独立测试的能力时才会激活。当前阶段被验证之前，不要进入下一阶段。

```
SPECIFY ──→ PLAN ──→ TASKS ──→ IMPLEMENT
   │          │        │          │
   ▼          ▼        ▼          ▼
 Human      Human    Human      Human
 reviews    reviews  reviews    reviews
```

### 阶段 0：范围检查（Scope Check）

大多数请求只描述一个能力。如果当前的请求也是如此，跳过这个阶段，直接进入 Specify。阶段 0 是为例外情况存在的，不是常规；它不会给单能力功能强加层级结构。

**检测。** 当一个需求打包了多个可独立测试的能力时，先分解再做规格说明：

- 需求点名了多个各有自己的消费者或数据的独立能力（例如 identity、billing、notifications、reporting）
- 验收标准聚成可以分别交付和验证的组
- 砍掉或替换某一个能力，不需要重写其他能力的要求

**在写任何 spec 之前，先提出一份能力地图（capability map）。** 要小、可评审：一张模块表加一个构建顺序，不是项目计划：

```markdown
# Capability Map: [Initiative Name]

| Module id | Responsibility | Depends on |
|---|---|---|
| identity | Accounts, sessions, SSO | — |
| billing | Plans, invoices, payments | identity |
| notifications | Email and webhook fan-out | identity |
| reporting | Usage dashboards | billing, notifications |

Build order: identity → billing, notifications → reporting
```

- **稳定的模块 id。** kebab-case，一次选定，initiative 进行中绝不重命名。Specs、计划和下游命令都通过这些 id 来选择工作，而不是猜测当前哪个 spec 生效。
- **依赖有方向，无环。** 箭头只指向一个方向。如果两个模块互相依赖，它们其实是一个模块。
- **接口位于边界上。** 地图记录 `billing` 依赖 `identity`；两者之间的契约属于提供方模块的 spec（设计方法见 `api-and-interface-design`）。

**地图和其他阶段一样有门禁。** 在写任何模块 spec 之前，由人类评审模块边界、依赖方向和构建顺序。地图搞错的代价很高；评审十行则不然。

**然后按模块递归。** 依依赖顺序为每个模块执行 Specify → Plan → Tasks → Implement。每个模块都有自己的 spec，范围限定在该模块的目标、边界和成功标准。把批准后的地图保存在项目根目录，各模块的 spec 与之放在一起，按模块 id 命名（`SPEC-identity.md`、`SPEC-billing.md`）。存在的索引是这张地图，而不是靠猜文件名。

### 阶段 1：Specify

从高层愿景开始。向人类提出澄清问题，直到需求具体。

**立即暴露假设。** 在写任何 spec 内容之前，列出你的假设：

```
ASSUMPTIONS I'M MAKING:
1. This is a web application (not native mobile)
2. Authentication uses session-based cookies (not JWT)
3. The database is PostgreSQL (based on existing Prisma schema)
4. We're targeting modern browsers only (no IE11)
→ Correct me now or I'll proceed with these.
```

不要默默补全含糊需求。spec 的全部目的，就是在代码写出来*之前*暴露误解；假设是最危险的一种误解。

**写一份覆盖这六个核心区域的 spec 文档：**

1. **Objective**：我们在构建什么，为什么？用户是谁？成功是什么样子？

2. **Commands**：完整可执行命令，包含 flags，而不只是工具名。
   ```
   Build: npm run build
   Test: npm test -- --coverage
   Lint: npm run lint --fix
   Dev: npm run dev
   ```

3. **Project Structure**：源代码在哪里，测试放哪里，文档属于哪里。
   ```
   src/           → Application source code
   src/components → React components
   src/lib        → Shared utilities
   tests/         → Unit and integration tests
   e2e/           → End-to-end tests
   docs/          → Documentation
   ```

4. **Code Style**：一个真实代码片段展示风格，胜过三段描述。包含命名约定、格式规则和优秀输出示例。

5. **Testing Strategy**：使用什么框架、测试放在哪里、覆盖率期望、哪些关注点对应哪些测试层级。

6. **Boundaries**：三层系统：
   - **Always do:** 运行测试后再提交、遵循命名约定、验证输入
   - **Ask first:** 数据库 schema 变更、添加依赖、修改 CI 配置
   - **Never do:** 提交 secrets、编辑 vendor 目录、未经批准移除失败测试

**Spec 模板：**

```markdown
# Spec: [Project/Feature Name]

## Objective
[What we're building and why. User stories or acceptance criteria.]

## Tech Stack
[Framework, language, key dependencies with versions]

## Commands
[Build, test, lint, dev — full commands]

## Project Structure
[Directory layout with descriptions]

## Code Style
[Example snippet + key conventions]

## Testing Strategy
[Framework, test locations, coverage requirements, test levels]

## Boundaries
- Always: [...]
- Ask first: [...]
- Never: [...]

## Success Criteria
[How we'll know this is done — specific, testable conditions]

## Open Questions
[Anything unresolved that needs human input]
```

**外部 spec 工具：** 这个工作流与格式无关。如果项目已经使用 OpenSpec 或其他规格系统，保留该系统的工件格式和存储约定，不要再创建一份重复的 `SPEC.md`。这个 skill 负责澄清、内容和批准门禁；外部工具负责已批准 spec 的表示形式。

**把指令重新框定为成功标准。** 收到模糊需求时，把它们翻译成具体条件：

```
REQUIREMENT: "Make the dashboard faster"

REFRAMED SUCCESS CRITERIA:
- Dashboard LCP < 2.5s on 4G connection
- Initial data load completes in < 500ms
- No layout shift during load (CLS < 0.1)
→ Are these the right targets?
```

这样你就能围绕清晰目标进行循环、重试和解决问题，而不是猜测 “faster” 是什么意思。

### 阶段 2：Plan

在 spec 已验证后，生成技术实现计划：

1. 识别主要组件及其依赖
2. 确定实现顺序（必须先构建什么）
3. 记录风险和缓解策略
4. 识别哪些可以并行构建，哪些必须顺序执行
5. 定义阶段之间的验证检查点

> 这些步骤背后的依赖图映射和垂直切片机制，遵循 `planning-and-task-breakdown`；它是权威来源。上面的要点只是轻量摘要；两者若出现分歧，以 `planning-and-task-breakdown` 为准。
>
> **输出约定：** 把计划保存到 `tasks/plan.md`，并把任务列表记录到 `planning-and-task-breakdown` 定义的 task list target（默认 `tasks/todo.md`；项目也可以指定外部 tracker）。如果 `tasks/` 不存在则创建。下游命令（`/build` 等）依赖这些默认值。

计划应该可评审：人类读完后应该能说“对，这是正确做法”或“不，修改 X”。

### 阶段 3：Tasks

把计划拆解为离散、可实现的任务：

- 每个任务都应能在一次专注会话中完成
- 每个任务都有明确验收标准
- 每个任务都包含验证步骤（测试、构建、手动检查）
- 任务按依赖排序，而不是按感知重要性排序
- 任何任务都不应需要修改超过约 5 个文件

> 完整的任务大小划分和依赖排序机制，遵循 `planning-and-task-breakdown`；它是权威来源。下面的模板只是轻量内联形式；两者若出现分歧，以 `planning-and-task-breakdown` 为准。

**任务模板：**
```markdown
- [ ] Task: [Description]
  - Acceptance: [What must be true when done]
  - Verify: [How to confirm — test command, build, manual check]
  - Files: [Which files will be touched]
```

### 阶段 4：Implement

一次执行一个任务，并遵循 `skills/incremental-implementation/SKILL.md`（`incremental-implementation`）和 `skills/test-driven-development/SKILL.md`（`test-driven-development`）。使用 `skills/context-engineering/SKILL.md`（`context-engineering`）在每一步加载正确的 spec 章节和源文件，而不是把整个 spec 都塞给 agent。

## 让 Spec 保持鲜活

spec 是一份活文档，不是一次性工件：

- **决策变化时更新**：如果你发现数据模型需要改变，先更新 spec，再实现。
- **范围变化时更新**：新增或砍掉的功能应该反映在 spec 中。
- **提交 spec**：spec 应该和代码一起进入版本控制。
- **在 PR 中引用 spec**：链接回每个 PR 实现的 spec 章节。

## 常见合理化借口

| 合理化借口 | 现实 |
|---|---|
| “这很简单，我不需要 spec” | 简单任务不需要*长* spec，但仍然需要验收标准。两行 spec 可以。 |
| “我写完代码后再补 spec” | 那是文档，不是规格说明。spec 的价值在于在代码之前强制澄清。 |
| “spec 会拖慢我们” | 15 分钟 spec 可以避免数小时返工。15 分钟的 waterfall 胜过 15 小时的调试。 |
| “需求反正会变” | 这正是 spec 是活文档的原因。过时的 spec 仍然好过没有 spec。 |
| “用户知道自己想要什么” | 即使清晰请求也有隐含假设。spec 会暴露这些假设。 |
| “这是一个大功能，拆开它是额外开销” | 如果验收标准能聚成可独立测试的组，单体 spec 会迫使每个下游任务都在完整契约上推理。十行的能力地图是更便宜的替代方案。 |
| “我会在规划时再分解” | 规划是在一份 spec 内部切分任务。到那时超规格工件已经存在——模块边界和依赖方向必须在写 spec 之前决定，而不是之后。 |

## 红旗

- 在没有任何书面需求的情况下开始写代码
- 在澄清“完成”意味着什么之前问“我是不是直接开始构建？”
- 实现任何 spec 或任务列表中未提及的功能
- 在没有记录的情况下做出架构决策
- 因为“要构建什么很明显”而跳过 spec
- 一份 spec 的需求横跨多个可独立测试的能力
- 因为没有事先批准能力地图，模块边界或构建顺序在实现期间被隐式决定

## 验证

进入实现前，确认：

- [ ] spec 覆盖全部六个核心区域
- [ ] 人类已评审并批准 spec
- [ ] 成功标准具体且可测试
- [ ] Boundaries（Always/Ask First/Never）已定义
- [ ] spec 已保存到仓库中的文件
- [ ] 如果请求打包了多个可独立测试的能力，在写任何模块 spec 之前，能力地图（模块 id、依赖方向、构建顺序）已获批准
- [ ] 每份模块 spec 都能追溯到已批准地图中的某个模块 id
