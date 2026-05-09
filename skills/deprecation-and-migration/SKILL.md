---
name: deprecation-and-migration
description: 管理弃用和迁移。用于移除旧系统、API 或功能时；用于将用户从一种实现迁移到另一种实现时；用于判断应维护还是下线现有代码时。
---

# 弃用和迁移

## 概览

代码是一种负债，而不是资产。每一行代码都有持续维护成本：需要修复 bug、更新依赖、应用安全补丁，并帮助新工程师理解它。弃用是一套移除不再值得维护的代码的纪律，迁移则是将用户安全地从旧系统转移到新系统的过程。

大多数工程组织都擅长构建东西，但很少擅长移除它们。这个 skill 就是为了弥补这个缺口。

## 何时使用

- 用新系统、API 或库替换旧系统、API 或库
- 下线不再需要的功能
- 合并重复实现
- 移除无人拥有但人人依赖的死代码
- 规划新系统的生命周期（弃用规划从设计阶段就开始）
- 判断是继续维护遗留系统，还是投入迁移

## 核心原则

### 代码是一种负债

每一行代码都有持续成本：它需要测试、文档、安全补丁、依赖更新，也会给附近工作的任何人带来理解成本。代码的价值在于它提供的功能，而不是代码本身。当同样的功能可以用更少的代码、更低的复杂度或更好的抽象来提供时，旧代码就应该离开。

### Hyrum 定律让移除变得困难

只要用户足够多，每一种可观察行为都会被依赖，包括 bug、时序怪癖和未记录的副作用。这就是为什么弃用需要主动迁移，而不只是发公告。当用户依赖了替代方案没有复现的行为时，他们不能“直接切换”。

### 弃用规划从设计阶段开始

构建新东西时，要问：“三年后我们要如何移除它？”带有清晰接口、功能开关和最小表面积的系统，比到处泄漏实现细节的系统更容易弃用。

## 弃用决策

弃用任何东西之前，先回答这些问题：

```
1. Does this system still provide unique value?
   → If yes, maintain it. If no, proceed.

2. How many users/consumers depend on it?
   → Quantify the migration scope.

3. Does a replacement exist?
   → If no, build the replacement first. Don't deprecate without an alternative.

4. What's the migration cost for each consumer?
   → If trivially automated, do it. If manual and high-effort, weigh against maintenance cost.

5. What's the ongoing maintenance cost of NOT deprecating?
   → Security risk, engineer time, opportunity cost of complexity.
```

## 强制弃用与建议弃用

| 类型 | 何时使用 | 机制 |
|------|-------------|-----------|
| **Advisory** | 迁移是可选的，旧系统稳定 | 警告、文档、提示。用户按自己的节奏迁移。 |
| **Compulsory** | 旧系统有安全问题、阻碍进展，或维护成本不可持续 | 明确截止日期。旧系统将在日期 X 被移除。提供迁移工具。 |

**默认使用建议弃用。** 只有当维护成本或风险足以证明强制迁移合理时，才使用强制弃用。强制弃用要求提供迁移工具、文档和支持，不能只是宣布一个截止日期。

## 迁移流程

### 步骤 1: 构建替代方案

没有可用替代方案时不要弃用。替代方案必须：

- 覆盖旧系统的所有关键用例
- 具备文档和迁移指南
- 在生产环境中被证明可行，而不只是“理论上更好”

### 步骤 2: 公告并记录

```markdown
## Deprecation Notice: OldService

**Status:** Deprecated as of 2025-03-01
**Replacement:** NewService (see migration guide below)
**Removal date:** Advisory — no hard deadline yet
**Reason:** OldService requires manual scaling and lacks observability.
            NewService handles both automatically.

### Migration Guide
1. Replace `import { client } from 'old-service'` with `import { client } from 'new-service'`
2. Update configuration (see examples below)
3. Run the migration verification script: `npx migrate-check`
```

### 步骤 3: 增量迁移

一次迁移一个消费者，不要一次性全部迁移。对每个消费者：

```
1. Identify all touchpoints with the deprecated system
2. Update to use the replacement
3. Verify behavior matches (tests, integration checks)
4. Remove references to the old system
5. Confirm no regressions
```

**The Churn Rule:** 如果你拥有正在弃用的基础设施，你就负责迁移你的用户，或者提供不需要迁移的向后兼容更新。不要宣布弃用后让用户自己摸索。

### 步骤 4: 移除旧系统

只有在所有消费者都完成迁移之后：

```
1. Verify zero active usage (metrics, logs, dependency analysis)
2. Remove the code
3. Remove associated tests, documentation, and configuration
4. Remove the deprecation notices
5. Celebrate — removing code is an achievement
```

## 迁移模式

### Strangler Pattern（绞杀者模式）

并行运行新旧系统。将流量从旧系统逐步切到新系统。当旧系统承载 0% 流量时，移除它。

```
Phase 1: New system handles 0%, old handles 100%
Phase 2: New system handles 10% (canary)
Phase 3: New system handles 50%
Phase 4: New system handles 100%, old system idle
Phase 5: Remove old system
```

### Adapter Pattern（适配器模式）

创建一个适配器，把旧接口调用转换到新实现。在迁移后端期间，消费者仍然使用旧接口。

```typescript
// Adapter: old interface, new implementation
class LegacyTaskService implements OldTaskAPI {
  constructor(private newService: NewTaskService) {}

  // Old method signature, delegates to new implementation
  getTask(id: number): OldTask {
    const task = this.newService.findById(String(id));
    return this.toOldFormat(task);
  }
}
```

### Feature Flag Migration（功能开关迁移）

使用 feature flags 逐个将消费者从旧系统切换到新系统：

```typescript
function getTaskService(userId: string): TaskService {
  if (featureFlags.isEnabled('new-task-service', { userId })) {
    return new NewTaskService();
  }
  return new LegacyTaskService();
}
```

## Zombie Code（僵尸代码）

Zombie code 指无人拥有但人人依赖的代码。它没有被主动维护，没有明确 owner，并会累积安全漏洞和兼容性问题。迹象包括：

- 6 个月以上没有 commit，但仍有活跃消费者
- 没有指定维护者或团队
- 有失败测试但没人修复
- 依赖存在已知漏洞但没人更新
- 文档引用了已经不存在的系统

**应对方式：** 要么指定 owner 并妥善维护，要么用具体迁移计划弃用它。Zombie code 不能一直悬而未决，它要么获得投入，要么被移除。

## 常见合理化借口

| 合理化借口 | 现实 |
|---|---|
| “它还能用，为什么要移除？” | 无人维护的可用代码会累积安全债和复杂度。维护成本会悄悄增长。 |
| “以后可能有人会需要它” | 如果以后需要，可以重建。为了“以防万一”保留未使用代码，成本通常高于重建。 |
| “迁移太贵了” | 把迁移成本和未来 2-3 年的持续维护成本比较。长期看，迁移通常更便宜。 |
| “等新系统完成后再弃用它” | 弃用规划从设计阶段开始。等新系统完成时，你会有新的优先级。现在就规划。 |
| “用户会自己迁移” | 他们不会。提供工具、文档和激励，或者自己完成迁移（The Churn Rule）。 |
| “我们可以无限期维护两个系统” | 两个系统做同一件事，意味着维护、测试、文档和 onboarding 成本都翻倍。 |

## 危险信号

- 已弃用系统没有可用替代方案
- 弃用公告没有迁移工具或文档
- “软性”弃用多年仍停留在建议阶段且没有进展
- Zombie code 没有 owner 但仍有活跃消费者
- 给已弃用系统添加新功能（应该投入替代方案）
- 未衡量当前使用情况就弃用
- 未验证没有活跃消费者就移除代码

## 验证

完成一次弃用后：

- [ ] 替代方案已在生产环境中证明可行，并覆盖所有关键用例
- [ ] 迁移指南存在，且包含具体步骤和示例
- [ ] 所有活跃消费者都已迁移（通过指标/日志验证）
- [ ] 旧代码、测试、文档和配置已完全移除
- [ ] 代码库中不再引用已弃用系统
- [ ] 弃用通知已移除（它们已经完成使命）
