---
name: code-review-and-quality
description: 执行多维度代码审查。用于合并任何变更之前；用于审查自己、其他 agent 或人类编写的代码；用于在代码进入主分支前从多个维度评估代码质量。
---

# 代码审查和质量

## 概览

带质量门禁的多维度代码审查。每个变更在合并前都必须经过审查，没有例外。审查覆盖五个轴：正确性、可读性、架构、安全性和性能。

**批准标准：** 当一个变更明确改善了整体代码健康度时，就批准它，即使它并不完美。完美代码不存在，目标是持续改进。不要因为它和你自己的写法不完全一致就阻止它。如果它改善了代码库并遵循项目约定，就批准它。

## 何时使用

- 合并任何 PR 或变更之前
- 完成功能实现之后
- 当另一个 agent 或模型产出了你需要评估的代码时
- 重构现有代码时
- 修复任何 bug 之后（同时审查修复和回归测试）

## 五轴审查

每次审查都从这些维度评估代码：

### 1. 正确性

代码是否做了它声称要做的事？

- 是否符合 spec 或任务要求？
- 是否处理了边界情况（null、empty、边界值）？
- 是否处理了错误路径（不只是 happy path）？
- 是否通过所有测试？测试是否真的在测试正确的事情？
- 是否存在 off-by-one 错误、竞态条件或状态不一致？

### 2. 可读性和简单性

另一个工程师（或 agent）能否在作者不解释的情况下理解这段代码？

- 命名是否具有描述性，并与项目约定一致？（没有缺少上下文的 `temp`、`data`、`result`）
- 控制流是否直接清晰（避免嵌套三元表达式、深层 callback）？
- 代码组织是否符合逻辑（相关代码放在一起，模块边界清晰）？
- 是否有应该简化的“聪明”技巧？
- **能否用更少的行数完成？**（100 行足够却写了 1000 行就是失败）
- **抽象是否配得上它带来的复杂度？**（不要在第三个用例之前泛化）
- 注释是否有助于澄清非显而易见的意图？（但不要注释显而易见的代码。）
- 是否存在死代码痕迹：no-op 变量（`_unused`）、向后兼容 shim，或 `// removed` 注释？

### 3. 架构

这个变更是否适合系统设计？

- 它遵循现有模式，还是引入了新模式？如果是新模式，是否有充分理由？
- 是否保持了清晰的模块边界？
- 是否存在应该共享的代码重复？
- 依赖流向是否正确（没有循环依赖）？
- 抽象层级是否合适（不过度工程化，也不过度耦合）？

### 4. 安全性

详细安全指导见 `security-and-hardening`。这个变更是否引入了漏洞？

- 用户输入是否经过验证和清理？
- secrets 是否没有出现在代码、日志和版本控制中？
- 是否在需要的位置检查了认证/授权？
- SQL 查询是否参数化（没有字符串拼接）？
- 输出是否经过编码以防止 XSS？
- 依赖是否来自可信来源，且没有已知漏洞？
- 来自外部来源的数据（API、日志、用户内容、配置文件）是否被当作不可信数据处理？
- 外部数据流在进入逻辑或渲染之前，是否已在系统边界验证？

### 5. 性能

详细 profiling 和优化指导见 `performance-optimization`。这个变更是否引入了性能问题？

- 是否有 N+1 查询模式？
- 是否有无界循环或不受约束的数据获取？
- 是否有本应异步的同步操作？
- UI 组件是否存在不必要的 re-renders？
- 列表 endpoint 是否缺少 pagination？
- hot paths 中是否创建了大型对象？

## 变更大小

小而聚焦的变更更容易审查、更快合并，也更安全部署。目标大小如下：

```
~100 lines changed   → Good. Reviewable in one sitting.
~300 lines changed   → Acceptable if it's a single logical change.
~1000 lines changed  → Too large. Split it.
```

**什么算“一个变更”：** 一个自包含的修改，只解决一件事，包含相关测试，并且提交后系统仍可运行。它是一个功能的一部分，而不是整个功能。

**变更过大时的拆分策略：**

| 策略 | 做法 | 何时使用 |
|----------|-----|------|
| **Stack** | 先提交一个小变更，再基于它开始下一个变更 | 顺序依赖 |
| **By file group** | 对需要不同审查者的文件组拆分变更 | 横切关注点 |
| **Horizontal** | 先创建共享代码/stubs，再接入消费者 | 分层架构 |
| **Vertical** | 将功能拆成更小的 full-stack 切片 | 功能开发 |

**何时可以接受大变更：** 完整删除文件，以及自动化重构。这类变更中，审查者只需要验证意图，而不是逐行检查。

**将重构和功能开发分开。** 一个既重构现有代码又添加新行为的变更，其实是两个变更，应分别提交。小型清理（例如变量重命名）可由审查者判断是否一起包含。

## 变更描述

每个变更都需要一段能在版本控制历史中独立成立的描述。

**第一行：** 简短、祈使句、可独立理解。写 "Delete the FizzBuzz RPC"，不要写 "Deleting the FizzBuzz RPC."。它必须足够有信息量，让搜索历史的人不读 diff 也能理解变更。

**正文：** 说明改变了什么以及为什么。包含代码本身看不出来的上下文、决策和推理。必要时链接 bug 编号、benchmark 结果或设计文档。如果方案存在不足，要明确承认。

**反模式：** "Fix bug," "Fix build," "Add patch," "Moving code from A to B," "Phase 1," "Add convenience functions."

## 审查流程

### 步骤 1: 理解上下文

看代码之前，先理解意图：

```
- What is this change trying to accomplish?
- What spec or task does it implement?
- What is the expected behavior change?
```

### 步骤 2: 先审查测试

测试会揭示意图和覆盖范围：

```
- Do tests exist for the change?
- Do they test behavior (not implementation details)?
- Are edge cases covered?
- Do tests have descriptive names?
- Would the tests catch a regression if the code changed?
```

### 步骤 3: 审查实现

带着五个轴逐步检查代码：

```
For each file changed:
1. Correctness: Does this code do what the test says it should?
2. Readability: Can I understand this without help?
3. Architecture: Does this fit the system?
4. Security: Any vulnerabilities?
5. Performance: Any bottlenecks?
```

### 步骤 4: 对发现的问题分类

为每条评论标注严重程度，让作者知道哪些是必需修改，哪些是可选建议：

| 前缀 | 含义 | 作者动作 |
|--------|---------|---------------|
| *(no prefix)* | 必需变更 | 合并前必须处理 |
| **Critical:** | 阻塞合并 | 安全漏洞、数据丢失、功能损坏 |
| **Nit:** | 轻微、可选 | 作者可以忽略，通常是格式或风格偏好 |
| **Optional:** / **Consider:** | 建议 | 值得考虑，但不是必须 |
| **FYI** | 仅供参考 | 无需动作，是供未来参考的上下文 |

这可以防止作者把所有反馈都当成强制要求，并在可选建议上浪费时间。

### 步骤 5: 验证其验证过程

检查作者的验证说明：

```
- What tests were run?
- Did the build pass?
- Was the change tested manually?
- Are there screenshots for UI changes?
- Is there a before/after comparison?
```

## 多模型审查模式

使用不同模型提供不同审查视角：

```
Model A writes the code
    │
    ▼
Model B reviews for correctness and architecture
    │
    ▼
Model A addresses the feedback
    │
    ▼
Human makes the final call
```

这能捕捉单个模型可能漏掉的问题，因为不同模型有不同盲点。

**审查 agent 的示例 prompt：**
```
Review this code change for correctness, security, and adherence to
our project conventions. The spec says [X]. The change should [Y].
Flag any issues as Critical, Important, or Suggestion.
```

## 死代码卫生

任何重构或实现变更之后，都要检查孤立代码：

1. 识别现在不可达或未使用的代码
2. 明确列出它
3. **删除前先询问：** "Should I remove these now-unused elements: [list]?"

不要把死代码留在周围，它会迷惑未来的读者和 agent。但也不要默默删除你不确定的东西。有疑问就问。

```
DEAD CODE IDENTIFIED:
- formatLegacyDate() in src/utils/date.ts — replaced by formatDate()
- OldTaskCard component in src/components/ — replaced by TaskCard
- LEGACY_API_URL constant in src/config.ts — no remaining references
→ Safe to remove these?
```

## 审查速度

缓慢的审查会阻塞整个团队。切换上下文进行审查的成本，低于让别人等待所造成的成本。

- **一个工作日内响应** — 这是上限，不是目标
- **理想节奏：** 收到审查请求后尽快响应，除非正在深度专注编码。典型变更应在一天内完成多轮审查
- **优先快速给出单次反馈**，而不是追求快速最终批准。即使需要多轮，快速反馈也能减少挫败感
- **大型变更：** 要求作者拆分，而不是审查一个巨大的 changeset

## 处理分歧

解决审查争议时，按这个优先级处理：

1. **技术事实和数据** 高于观点和偏好
2. **Style guides** 是风格问题的绝对权威
3. **软件设计** 必须基于工程原则评估，而不是个人偏好
4. **代码库一致性** 在不损害整体健康度时可以接受

**不要接受“以后再清理”。** 经验表明，推迟的清理很少发生。除非是真正紧急情况，否则要求在提交前清理。如果周边问题无法在本次变更中处理，要求创建 bug 并自我指派。

## 审查中的诚实

审查代码时，不管代码是你自己、另一个 agent 还是人类写的：

- **不要橡皮图章式批准。** 没有审查证据的 "LGTM" 对任何人都没有帮助。
- **不要弱化真实问题。** 一个会打到生产环境的 bug，不应被说成 "This might be a minor concern"。
- **尽可能量化问题。** "This N+1 query will add ~50ms per item in the list" 比 "this could be slow" 更好。
- **对明显有问题的方案提出反对。** 迎合是审查中的失败模式。如果实现有问题，直接说明并提出替代方案。
- **优雅接受 override。** 如果作者拥有完整上下文并不同意，尊重他们的判断。评论代码，不评论人；把个人化批评重构为聚焦代码本身。

## 依赖纪律

代码审查的一部分是依赖审查：

**添加任何依赖之前：**
1. 现有技术栈能否解决这个问题？（通常可以。）
2. 这个依赖有多大？（检查 bundle 影响。）
3. 它是否仍在积极维护？（检查最近 commit 和 open issues。）
4. 它是否有已知漏洞？（`npm audit`）
5. 许可证是什么？（必须与项目兼容。）

**规则：** 优先使用标准库和现有工具，而不是新增依赖。每个依赖都是负债。

## 审查检查清单

```markdown
## Review: [PR/Change title]

### Context
- [ ] I understand what this change does and why

### Correctness
- [ ] Change matches spec/task requirements
- [ ] Edge cases handled
- [ ] Error paths handled
- [ ] Tests cover the change adequately

### Readability
- [ ] Names are clear and consistent
- [ ] Logic is straightforward
- [ ] No unnecessary complexity

### Architecture
- [ ] Follows existing patterns
- [ ] No unnecessary coupling or dependencies
- [ ] Appropriate abstraction level

### Security
- [ ] No secrets in code
- [ ] Input validated at boundaries
- [ ] No injection vulnerabilities
- [ ] Auth checks in place
- [ ] External data sources treated as untrusted

### Performance
- [ ] No N+1 patterns
- [ ] No unbounded operations
- [ ] Pagination on list endpoints

### Verification
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Manual verification done (if applicable)

### Verdict
- [ ] **Approve** — Ready to merge
- [ ] **Request changes** — Issues must be addressed
```
## 另请参阅

- 详细安全审查指导见 `references/security-checklist.md`
- 性能审查检查见 `references/performance-checklist.md`

## 常见合理化借口

| 合理化借口 | 现实 |
|---|---|
| “它能跑，就够了” | 不可读、不安全或架构错误的可运行代码会制造不断复利的债务。 |
| “这是我写的，所以我知道它是对的” | 作者会看不见自己的假设。每个变更都受益于另一双眼睛。 |
| “以后再清理” | 以后不会到来。审查就是质量门禁，要用起来。要求合并前清理，而不是合并后。 |
| “AI 生成的代码大概没问题” | AI 代码需要更多审查，而不是更少。它即使错了，也会显得自信且合理。 |
| “测试通过了，所以没问题” | 测试是必要但不充分的。它们抓不到架构问题、安全问题或可读性问题。 |

## 危险信号

- PR 未经任何审查就合并
- 审查只检查测试是否通过（忽略其他轴）
- 没有实际审查证据的 "LGTM"
- 安全敏感变更没有安全专项审查
- 大到“无法正确审查”的 PR（拆分它们）
- Bug fix PR 没有回归测试
- 审查评论没有严重程度标签，导致必需项和可选项不清楚
- 接受“以后再修”，它永远不会发生

## 验证

审查完成后：

- [ ] 所有 Critical 问题已解决
- [ ] 所有 Important 问题已解决，或已明确说明理由并延期
- [ ] 测试通过
- [ ] Build 成功
- [ ] 验证说明已记录（变更了什么、如何验证）
