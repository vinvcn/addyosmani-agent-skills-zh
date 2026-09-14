---
description: 启动 spec-driven development — 写代码前先编写结构化 specification
---

调用 agent-skills:spec-driven-development skill。

先理解用户想构建什么。围绕以下内容提出 clarifying questions：
1. Objective 和 target users
2. Core features 和 acceptance criteria
3. Tech stack preferences 和 constraints
4. Known boundaries（哪些事始终要做、哪些事要先问、哪些事绝不能做）

然后生成结构化 spec，覆盖六个核心领域：objective、commands、project structure、code style、testing strategy 和 boundaries。

如果请求打包了多个可独立测试的 capabilities，先按该 skill 的 Phase 0 提出一份 capability map（module ids、dependency direction、build order）并获得批准，然后按 dependency 顺序为每个模块编写 spec。

将 spec 保存为项目根目录中的 SPEC.md，并在继续前与用户确认。
