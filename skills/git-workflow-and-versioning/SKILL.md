---
name: git-workflow-and-versioning
description: 规范 git 工作流实践。用于进行任何代码变更时；用于提交、分支、解决冲突、把混乱 working tree 里未提交的工作拆成干净的 atomic commits、创建或审查 pull request（PR）、推送到远程，或需要组织多个并行工作流时。用于裁剪 release、选择语义化版本递增、打标签或编写 changelog 时。
---

# Git 工作流和版本管理

## 概览

Git 是你的安全网。把 commits 当作保存点，把 branches 当作沙盒，把 history 当作文档。AI agents 会高速生成代码，而有纪律的版本控制是让变更可管理、可审查、可回滚的机制。

## 何时使用

始终使用。每个代码变更都经过 git。

## 核心原则

### Trunk-Based Development（推荐）

保持 `main` 始终可部署。在短生命周期 feature branches 中工作，并在 1-3 天内合回。长期存在的开发分支是隐藏成本：它们会分叉、制造 merge conflicts，并延迟集成。DORA 研究持续表明，trunk-based development 与高绩效工程团队相关。

```
main ──●──●──●──●──●──●──●──●──●──  (always deployable)
        ╲      ╱  ╲    ╱
         ●──●─╱    ●──╱    ← short-lived feature branches (1-3 days)
```

这是推荐默认方式。使用 gitflow 或长期分支的团队，可以把这些原则（atomic commits、小变更、描述性消息）适配到自己的分支模型中。commit 纪律比具体分支策略更重要。

- **Dev branches 是成本。** 分支每多存活一天，就会累积 merge 风险。
- **Release branches 可以接受。** 当你需要在 main 继续前进的同时稳定某个 release。
- **Feature flags > long branches。** 优先把未完成工作藏在 flags 后部署，而不是让它在分支上停留数周。

### 1. 尽早提交，经常提交

每个成功的增量都应该有自己的 commit。不要累积大量未提交变更。

```
Work pattern:
  Implement slice → Test → Verify → Commit → Next slice

Not this:
  Implement everything → Hope it works → Giant commit
```

Commits 是保存点。如果下一个变更破坏了东西，你可以立刻回到最后一个已知良好状态。

### 2. Atomic Commits（原子提交）

每个 commit 只做一件逻辑上的事情：

```
# Good: Each commit is self-contained
git log --oneline
a1b2c3d Add task creation endpoint with validation
d4e5f6g Add task creation form component
h7i8j9k Connect form to API and add loading state
m1n2o3p Add task creation tests (unit + integration)

# Bad: Everything mixed together
git log --oneline
x1y2z3a Add task feature, fix sidebar, update deps, refactor utils
```

### 3. 描述性消息

Commit messages 解释 *why*，而不只是 *what*：

```
# Good: Explains intent
feat: add email validation to registration endpoint

Prevents invalid email formats from reaching the database.
Uses Zod schema validation at the route handler level,
consistent with existing validation patterns in auth.ts.

# Bad: Describes what's obvious from the diff
update auth.ts
```

**格式：**
```
<type>: <short description>

<optional body explaining why, not what>
```

**类型：**
- `feat` — 新功能
- `fix` — Bug fix
- `refactor` — 既不修 bug 也不加功能的代码变更
- `test` — 添加或更新测试
- `docs` — 仅文档
- `chore` — 工具、依赖、配置

### 4. 保持关注点分离

不要把格式变更和行为变更混在一起。不要把重构和功能混在一起。每种类型的变更都应是单独 commit，理想情况下也是单独 PR：

```
# Good: Separate concerns
git commit -m "refactor: extract validation logic to shared utility"
git commit -m "feat: add phone number validation to registration"

# Bad: Mixed concerns
git commit -m "refactor validation and add phone number field"
```

**将重构与功能开发分开。** 重构变更和功能变更是两个不同变更，应分别提交。这会让每个变更更容易审查、回滚，并在历史中理解。小型清理（例如变量重命名）可以由审查者判断是否包含在功能 commit 中。

### 5. 控制变更大小

目标是每个 commit/PR 约 100 行。超过约 1000 行的变更应拆分。如何拆分大变更，见 `code-review-and-quality` 中的拆分策略。

```
~100 lines  → Easy to review, easy to revert
~300 lines  → Acceptable for a single logical change
~1000 lines → Split into smaller changes
```

## 分支策略

### Feature Branches（功能分支）

```
main (always deployable)
  │
  ├── feature/task-creation    ← One feature per branch
  ├── feature/user-settings    ← Parallel work
  └── fix/duplicate-tasks      ← Bug fixes
```

- 从 `main`（或团队默认分支）创建分支
- 保持分支短生命周期（1-3 天内合并），长期分支是隐藏成本
- 合并后删除分支
- 对未完成功能，优先使用 feature flags，而不是长期分支

### 分支命名

```
feature/<short-description>   → feature/task-creation
fix/<short-description>       → fix/duplicate-tasks
chore/<short-description>     → chore/update-deps
refactor/<short-description>  → refactor/auth-module
```

## 使用 Worktrees

对于并行 AI agent 工作，使用 git worktrees 同时运行多个分支：

```bash
# Create a worktree for a feature branch
git worktree add ../project-feature-a feature/task-creation
git worktree add ../project-feature-b feature/user-settings

# Each worktree is a separate directory with its own branch
# Agents can work in parallel without interfering
ls ../
  project/              ← main branch
  project-feature-a/    ← task-creation branch
  project-feature-b/    ← user-settings branch

# When done, merge and clean up
git worktree remove ../project-feature-a
```

收益：
- 多个 agents 可以同时处理不同功能
- 不需要切换分支（每个目录都有自己的分支）
- 如果某个实验失败，删除 worktree 即可，不会丢失其他内容
- 变更在明确合并前彼此隔离

## 保存点模式

```
Agent starts work
    │
    ├── Makes a change
    │   ├── Test passes? → Commit → Continue
    │   └── Test fails? → Revert to last commit → Investigate
    │
    ├── Makes another change
    │   ├── Test passes? → Commit → Continue
    │   └── Test fails? → Revert to last commit → Investigate
    │
    └── Feature complete → All commits form a clean history
```

这个模式意味着你最多只会丢失一个增量的工作。如果 agent 跑偏，`git reset --hard HEAD` 可以带你回到最后一个成功状态。

## 变更总结

任何修改之后，都提供结构化总结。这会让审查更容易，记录范围纪律，并暴露意外变更：

```
CHANGES MADE:
- src/routes/tasks.ts: Added validation middleware to POST endpoint
- src/lib/validation.ts: Added TaskCreateSchema using Zod

THINGS I DIDN'T TOUCH (intentionally):
- src/routes/auth.ts: Has similar validation gap but out of scope
- src/middleware/error.ts: Error format could be improved (separate task)

POTENTIAL CONCERNS:
- The Zod schema is strict — rejects extra fields. Confirm this is desired.
- Added zod as a dependency (72KB gzipped) — already in package.json
```

这个模式能及早捕捉错误假设，并给审查者一张清晰的变更地图。"DIDN'T TOUCH" 部分尤其重要，它表明你遵守了范围纪律，没有进行未经请求的改造。

## Pre-Commit 卫生

每次 commit 之前：

```bash
# 1. Check what you're about to commit
git diff --staged

# 2. Ensure no secrets
git diff --staged | grep -i "password\|secret\|api_key\|token"

# 3. Run tests
npm test

# 4. Run linting
npm run lint

# 5. Run type checking
npx tsc --noEmit
```

用 git hooks 自动化这些检查：

```json
// package.json (using lint-staged + husky)
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

## 处理生成文件

- **只有项目期望时才 commit 生成文件**（例如 `package-lock.json`、Prisma migrations）
- **不要 commit** build output（`dist/`, `.next/`）、环境文件（`.env`）或 IDE config（除非共享，否则不要提交 `.vscode/settings.json`）
- **准备 `.gitignore`**，覆盖：`node_modules/`, `dist/`, `.env`, `.env.local`, `*.pem`

## 用 Git 调试

```bash
# Find which commit introduced a bug
git bisect start
git bisect bad HEAD
git bisect good <known-good-commit>
# Git checkouts midpoints; run your test at each to narrow down

# View what changed recently
git log --oneline -20
git diff HEAD~5..HEAD -- src/

# Find who last changed a specific line
git blame src/services/task.ts

# Search commit messages for a keyword
git log --grep="validation" --oneline
```

## 发布与版本管理

Commits 是*你*追踪变更的方式；**version** 则是你的*使用者*追踪它的方式。从有别的东西依赖你的代码那一刻起（另一个团队、一个已发布的包、一个已部署的客户端），"latest on main" 就不再是"我跑的是什么版本，升级安全吗"这个问题的合格答案。版本号和 changelog 就是回答这个问题的契约。

### 语义化版本（Semantic Versioning）

对任何有使用者的东西，按 `MAJOR.MINOR.PATCH` 版本化，并让数字承载含义：

```
  MAJOR  breaking change — consumers must change their code to upgrade
  MINOR  new functionality, backward-compatible — safe to upgrade
  PATCH  bug fix, backward-compatible — safe to upgrade
```

数字是一个承诺，所以让代码配得上它。一个改变了使用者依赖行为的 "patch"，就是一个伪装成补丁的 major change（Hyrum's Law，见 `api-and-interface-design` skill）。拿不准某个变更是否 breaking 时，就当它是；一个意外的 major 远比一个崩坏的使用者便宜。

### 给 release 打 tag，并让 tag 成为唯一事实来源

Release 是历史中的一个不可变点，不是移动的分支。给它打 tag，让它永远可以被复现：

```bash
git tag -a v1.4.0 -m "Release 1.4.0"
git push origin v1.4.0
```

从 tag 派生版本号，而不是在散落的文件里手动编辑，这样构建产物、tag 和 changelog 三者永远不会互相矛盾。

### 维护写给人类看的 changelog

Changelog 不是 `git log`。它是经过整理的、面向使用者的答案，回答"改了什么，我在乎吗"：按 `Added / Changed / Fixed / Deprecated / Removed / Security` 分组，最新的在顶部，每个条目围绕用户影响而非内部机制来措辞。

```markdown
## [1.4.0] - 2025-06-12
### Added
- Bulk task import via CSV
### Fixed
- Timezone drift in recurring task due dates
### Deprecated
- `GET /v1/tasks/all` — use the paginated `GET /v1/tasks` (removal in 2.0)
```

在做变更的同一个变更里写好对应条目，趁影响还清晰时记录，而不是在发布时从 commit 考古中重建。Breaking changes 要有迁移说明和弃用窗口（遵循 `deprecation-and-migration` skill）；真正执行发布是 `shipping-and-launch` skill 的职责，本节是喂给它的版本化契约。

## 常见合理化借口

| 合理化借口 | 现实 |
|---|---|
| “功能完成后再 commit” | 一个巨大的 commit 几乎无法审查、调试或回滚。每个切片都要 commit。 |
| “消息不重要” | 消息就是文档。未来的你（以及未来的 agents）需要理解变更了什么以及为什么。 |
| “以后全部 squash” | Squash 会破坏开发叙事。最好从一开始就写干净的增量 commits。 |
| “分支增加开销” | 短生命周期分支几乎没有成本，并能防止并行工作互相冲撞。长期分支才是问题，应在 1-3 天内合并。 |
| “以后再拆这个变更” | 大变更更难审查、部署风险更高，也更难回滚。提交前拆分，而不是提交后。 |
| “我不需要 .gitignore” | 直到带生产 secrets 的 `.env` 被 commit。立刻设置它。 |
| “只是个小修复，patch 加一就行” | 先看看使用者能观察到什么。他们依赖的行为变化就是 major，不管 diff 多小。 |
| “changelog 就是 commit log” | Commits 是写给你的；changelog 是写给使用者的，要按影响整理。用原始 commits 生成的 changelog 会淹没重点。 |
| “发布时再补 changelog” | 到那时影响只能凭记忆重建，而且一半都丢了。变更和条目要一起写。 |

## 危险信号

- 累积大量未提交变更
- Commit messages 像 "fix", "update", "misc"
- 格式变更和行为变更混在一起
- 项目中没有 `.gitignore`
- Commit 了 `node_modules/`, `.env` 或 build artifacts
- 长期分支与 main 显著分叉
- Force-pushing 到共享分支
- Breaking change 藏在 minor 或 patch 版本递增下发布
- Release 没有 tag，或版本号手动编辑到与 tag 不同步
- 面向用户的 release 没有 changelog 条目，或 changelog 只是把 commit messages 倾倒进去

## 验证

对每个 commit：

- [ ] Commit 只做一件逻辑上的事
- [ ] Message 解释 why，并遵循类型约定
- [ ] 提交前测试通过
- [ ] Diff 中没有 secrets
- [ ] 没有把纯格式变更混入行为变更
- [ ] `.gitignore` 覆盖标准排除项

对每个 release（任何有使用者的东西）：

- [ ] 版本递增与变更匹配：breaking → major，additive → minor，fix → patch
- [ ] Release 已打 tag，且版本号从 tag 派生，而不是手动编辑到不同步
- [ ] Changelog 中为此版本有按影响分组的、经过整理的、人类可读的条目
