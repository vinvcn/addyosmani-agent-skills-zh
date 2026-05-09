---
name: spec-driven-development
description: 编码前先创建 spec。用于开始新项目、功能或重大变更且还没有规格说明时。用于需求不清晰、有歧义，或只是一段模糊想法时。
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

Spec-driven development 有四个阶段。当前阶段被验证之前，不要进入下一阶段。

```
SPECIFY ──→ PLAN ──→ TASKS ──→ IMPLEMENT
   │          │        │          │
   ▼          ▼        ▼          ▼
 Human      Human    Human      Human
 reviews    reviews  reviews    reviews
```

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

计划应该可评审：人类读完后应该能说“对，这是正确做法”或“不，修改 X”。

### 阶段 3：Tasks

把计划拆解为离散、可实现的任务：

- 每个任务都应能在一次专注会话中完成
- 每个任务都有明确验收标准
- 每个任务都包含验证步骤（测试、构建、手动检查）
- 任务按依赖排序，而不是按感知重要性排序
- 任何任务都不应需要修改超过约 5 个文件

**任务模板：**
```markdown
- [ ] Task: [Description]
  - Acceptance: [What must be true when done]
  - Verify: [How to confirm — test command, build, manual check]
  - Files: [Which files will be touched]
```

### 阶段 4：Implement

一次执行一个任务，并遵循 `incremental-implementation` 和 `test-driven-development` skills。使用 `context-engineering` 在每一步加载正确的 spec 章节和源文件，而不是把整个 spec 都塞给 agent。

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

## 红旗

- 在没有任何书面需求的情况下开始写代码
- 在澄清“完成”意味着什么之前问“我是不是直接开始构建？”
- 实现任何 spec 或任务列表中未提及的功能
- 在没有记录的情况下做出架构决策
- 因为“要构建什么很明显”而跳过 spec

## 验证

进入实现前，确认：

- [ ] spec 覆盖全部六个核心区域
- [ ] 人类已评审并批准 spec
- [ ] 成功标准具体且可测试
- [ ] Boundaries（Always/Ask First/Never）已定义
- [ ] spec 已保存到仓库中的文件
