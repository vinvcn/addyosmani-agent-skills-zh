# 采用指南：新项目 vs. 已有代码库

如何引入 agent-skills，很大程度上取决于你的代码库处于生命周期的哪个阶段。一个全新项目（greenfield）可以从第一次提交开始就采用完整的生命周期。而一个有多年历史的代码库则需要一条渐进式的道路，要尊重已经存在的东西：它的约定、它未被记录的决策，以及那些你在没有测试覆盖的地方不敢盲目触碰的角落。

本指南覆盖这两条路径。安装机制参见 [getting-started.md](getting-started.md) 和各工具的 setup 指南。每个 skill 做什么，参见 [README 中的 skill catalog](../README.md#all-24-skills)。

---

## 你在走哪条路径？

| 信号                        | 全新项目（Greenfield）        | 存量项目（Brownfield）                        |
| -------------------------- | ------------------------------- | -------------------------------------------- |
| 代码库年龄                 | 几天到几周                      | 几个月到几年                                  |
| 测试覆盖率                 | 从第一天起由你掌控              | 参差不齐；部分区域无测试                      |
| 约定                       | 边做边定                        | 已经形成，常常未被记录                        |
| 团队习惯                   | 正在养成                        | 根深蒂固（有好有坏）                          |
| 一次糟糕的 agent 变更的风险 | 爆炸半径小                      | 可能弄坏没人记得怎么修的东西                  |
| 采用策略                   | **完整生命周期，立即全部启用**  | **渐进式，验证优先**                          |

如果你介于两者之间（一个已经上线生产的年轻项目），从存量项目路径开始，再逐步加速，两条路径最终会收敛到同一个状态。

---

## 路径 A | 全新项目：从第一天起走完整生命周期

新项目是最好处理的场景：没有需要保留的遗留行为，所以 skills 的质量门禁几乎不花成本，并且从第一次提交开始就持续复利。

### 第 0 天 | 安装并接入

1. 安装这个包（`npx skills add vinvcn/addyosmani-agent-skills-zh`，或你所用工具的原生集成方式，参见 [getting-started.md](getting-started.md)）。
2. 如果宿主没有原生的 skill router，就加载 `using-agent-skills`（meta-skill），让 agent 能自己把工作路由到合适的 skill。在有原生 routing 的宿主上，安装各个独立的 skills，并且不要把 meta-skill 预加载为常驻上下文。
3. 添加一个简短的项目 rules 文件（`CLAUDE.md`、`.cursorrules` 等），写清你的技术栈、命令和边界，`context-engineering` 说明了这里应该放什么。

### 第 0 天 | 先定义，再构建

对项目的第一个真实功能，按顺序跑一遍生命周期：

```
/spec   →  SPEC.md            (spec-driven-development)
/plan   →  tasks/plan.md      (planning-and-task-breakdown)
/build  →  one slice at a time (incremental-implementation + test-driven-development)
/review →  before every merge  (code-review-and-quality)
/ship   →  when going live     (shipping-and-launch)
```

`/build auto` 很适合全新项目：你只需批准一次 plan，每个 task 依然会走 test-driven 并单独提交。spec 和 plan 产物（`SPEC.md`、`tasks/`）是活文档，工作进行期间要把它们纳入版本控制。如果功能横跨多个 session，这些文件同时也是交接文档，参见 [working across sessions](getting-started.md#working-across-sessions)。

### 从一开始就按“常驻”对待这些

- **test-driven-development**，覆盖率的债在零覆盖时最便宜。
- **git-workflow-and-versioning**，原子提交和约 100 行的变更是习惯，不是事后补的。
- **security-and-hardening**，auth、输入校验和 secrets 管理是结构性的；后补等于一个迁移项目。
- **documentation-and-adrs**，最初的架构决策正是两年后没人记得 _为什么_ 的那些决策。现在写一个 ADR，就能避免路径 B 里描述的那种存量代码考古。

### 随项目成长再加载

| 何时                                | 加载                                                          |
| ----------------------------------- | ------------------------------------------------------------- |
| 第一个公开 API 或 module boundary   | `api-and-interface-design`                                    |
| 第一批 UI 工作                      | `frontend-ui-engineering`（+ `browser-testing-with-devtools`） |
| 第一个 CI pipeline                  | `ci-cd-and-automation`                                        |
| 第一次生产部署                      | `observability-and-instrumentation`、`shipping-and-launch`    |
| 出现性能要求                        | `performance-optimization`                                    |

### 全新项目的反模式

- **因为是“原型”就跳过 `/spec`。** 原型会变成产品。spec 是你为这个代码库写过的最便宜的产物。
- **把全部 25 个 skills 加载进每个 session。** 这既浪费 context，又稀释了真正重要的那几个。按阶段加载；让宿主的原生 router 或 `using-agent-skills` 来路由，但只能二选一。
- **把可观测性推迟到“有东西可观测再说”。** 边构建边埋点，事后补结构化日志是你亲手给自己制造的存量项目问题。

---

## 路径 B | 存量项目：渐进式，验证优先

在成熟的代码库里，风险特征完全反转：危险不是构建错的东西，而是_改动_一个其行为没有人完整定义过的东西。因此采用顺序从那些**读取并保护**代码库的 skills 开始，之后才转向**改变**它的 skills。

### 阶段 1 | Context 与只读 skills

目标：agent 在修改任何东西之前先理解代码库。

1. **`context-engineering` 优先。** 编写项目 rules 文件，描述真实的约定——代码里实际存在的约定，而不是 wiki 里的那些。包含 build/test 命令、目录含义、已知的地雷（"别碰 `legacy/billing`，它没有测试，还藏着三个已知的 workaround"）。
2. **对进来的变更用 `code-review-and-quality`。** Review 是零风险的，而且立刻有价值：五轴 review 及其 severity labels（区分 Critical 和 Required 哪些阻塞 merge、哪些不阻塞）适用于任何 PR，不管代码库状态如何。
3. **用 `debugging-and-error-recovery` 处理你本来就要修的 bugs。** 五步 triage（reproduce → localize → reduce → fix → guard）在不熟悉的代码里尤其出色，而 "guard" 这一步会开始构建你并不具备的回归测试套件。
4. **把 `doubt-driven-development` 当安全网。** 遗留代码正是这个 skill 针对的场景："不熟悉的代码，出错的代价高"。对 agent 关于遗留系统如何工作的论断做对抗式的 fresh-context review，能在自信的幻觉变成 commit 之前抓住它。

### 阶段 2 | 先测试，后改动

目标：agent 要碰的每个区域先有安全网。

- **`test-driven-development`，有选择地应用。** 不要追求全局覆盖率；追求在_计划变更之处_的覆盖。对于没有测试的遗留行为，先写 characterization tests——把代码当前行为（无论对错）钉死的测试——再做任何修改。Beyonce Rule 在这里适用：如果 agent 喜欢某个行为到了依赖它的程度，它就应该给它加上测试。
- **`code-simplification` 用在最糟的热点上。** Chesterton's Fence 是这里的核心原则：这个 skill 强制 agent 在删除代码之前先理解代码存在的_原因_。行为保持不变的简化，加上 characterization tests，是让遗留代码变得可改动的最低风险方式。
- **`git-workflow-and-versioning` 全面推行。** 小原子 commit 在存量项目里_更_重要：当对旧代码的改动以微妙的方式弄坏了什么，一个约 100 行的 commit 可以被 bisect；一个 2,000 行的"现代化" commit 不行。

### 阶段 3 | 新工作走完整生命周期

目标：双速采用，遗留代码保持在阶段 1-2 的规则之下；**新功能享受全新项目的待遇**。

- 旧代码库里的新功能？`/spec → /plan → /build → /review`。spec 的 boundaries 一节就是用来声明该功能可以碰、不可以碰哪些遗留表面积。
- **在接缝处使用 `api-and-interface-design`。** 当新代码必须和旧代码通信时，以 contract-first 设计边界契约。在一个有几年历史的代码库里，Hyrum's Law 不是理论——每个人都在依赖每一个可观察的行为，包括 bug。
- **`security-and-hardening` 先做 audit，再做成门禁。** 对现有攻击面（auth、输入处理、依赖项——光是 dependency audit 通常就值回全部投入）跑一次，归档发现的问题，然后对新的变更强制执行。

### 阶段 4 | 还债、弃用、可观测

- **`deprecation-and-migration`** 是存量项目的头号 skill：code-as-liability、强制 vs. 建议性的 deprecation、以及 zombie-code 清理，给了你有纪律地缩小遗留表面积的办法，而不是仅仅把它包起来。
- **`observability-and-instrumentation`** 沿着你实际 debug 的路径补建：先给 top 事故来源加上结构化日志和 RED metrics。
- **`performance-optimization`** 在回归重要时使用，它的 measure-first 规则能防止经典的遗留陷阱——优化了从来就不是瓶颈的代码。

### 存量项目的反模式

- **"大爆炸"式采用。** 第一天就把完整生命周期压到遗留代码库上，产出的是给已存在代码写的 specs 和没有安全网的重构。按顺序来。
- **让 agent 重构没有测试的代码。** 没有 characterization tests，就没有重构。这是存量项目采用中最昂贵的一条捷径。
- **以"代码即文档"为由跳过 `context-engineering`。** Agent 会从它碰巧读到的最差的那个文件里推断约定。把真正的约定告诉它。
- **默认把遗留系统的行为当成错的。** Chesterton's Fence：那个奇怪的 retry loop 可能是承重的。先理解，再改动。
- **什么都不做棘轮式收紧。** 采用过程应该让质量单调变好：每个阶段加上一道不再回去的门禁。如果一个月后你说不出"现在强制了什么、以前没有"，那这次 rollout 已经停滞了。

---

## 两条路径终将汇合

两条路都通向同一个稳态：新工作走 `/spec → /plan → /build → /review → /ship`，常驻的 TDD 和 git 纪律，merge 之前的 review 门禁，以及按阶段而非成批加载的 skills。全新项目几天到位；存量项目需要一个季度，而这两者的差距恰恰就是老代码库从来没有的那些安全网（context、characterization tests、边界）。

|                        | 全新项目（Greenfield）         | 存量项目（Brownfield）                       |
| ---------------------- | ------------------------------ | ---------------------------------------- |
| 最先加载的 skill       | 原生 router，或 `using-agent-skills` + `/spec` | `context-engineering`                    |
| 首先交付的价值         | 有 spec、有测试的第一个功能     | 零风险的 reviews 和更安全的 bug 修复       |
| TDD 姿态               | 从第一次提交起全面推行          | 有选择：在计划变更之处写测试                |
| 重构规则               | 少见（没什么可重构的）          | 永远先写 characterization tests            |
| 最危险的反模式         | 跳过 spec                       | 重构没有测试的代码                          |
| 达到完整生命周期的时间 | 第一天                          | 约一个季度，中间双速并行                    |
