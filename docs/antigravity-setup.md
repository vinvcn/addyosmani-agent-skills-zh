# 在 Antigravity CLI (agy) 中使用 agent-skills

`agent-skills` 包可以作为原生 plugin 安装进 Antigravity CLI（`agy`），让 agent 获得结构化 workflows 和 personas 的访问能力。

## 设置

### 选项 1：原生 Plugin 安装（推荐）

Antigravity CLI 有一等的 [plugin 系统](https://www.agy.dev/docs/plugins/)，可以注册 skills 和 agents。仓库中仍保留了旧版 command TOML，但受影响的 `agy` 版本不会暴露它们转换后的 wrapper；见 [Lifecycle Workflows 与 Command 兼容性](#lifecycle-workflows-与-command-兼容性)。

**从远程仓库安装：**

```bash
agy plugin install https://github.com/vinvcn/addyosmani-agent-skills-zh.git
```

**从本地 clone 安装：**

1. Clone 仓库：
   ```bash
   git clone https://github.com/vinvcn/addyosmani-agent-skills-zh.git
   ```
2. 用 `agy` 安装 plugin：
   ```bash
   agy plugin install /path/to/agent-skills
   ```

这会校验 plugin 并将其安装到你的全局 Antigravity 配置目录（`~/.gemini/config/plugins/agent-skills/`）。

> **注意：** 在当前 agy 版本上，plugin 落在 `~/.gemini/config/plugins/` 下，而不是旧版本使用的 `~/.gemini/antigravity-cli/plugins/` 旧路径。如果在旧路径没看到 plugin，先检查 `~/.gemini/config/plugins/agent-skills/`。

### 选项 2：从 Gemini CLI 导入

如果你已经在旧的 Gemini CLI 安装下装好了 `agent-skills`，可以直接导入：
```bash
agy plugin import gemini
```

安装完成后，验证生效的 plugin：
```bash
agy plugin list
```

---

## Lifecycle Workflows 与 Command 兼容性

Antigravity 的[迁移工具](https://www.agy.dev/docs/cli/gcli-migration/)会把 `commands/*.toml` 中的 9 个旧定义报告为 "converted to skills"。在受影响的 `agy` 1.1.x 版本中，validation 会通过，但转换后的 wrapper 不会出现在 slash-command 或 skill catalog 里。因此一次成功的 `agy plugin validate` 只能确认文件格式正确，不能确认 `/build` 及其他短 wrapper 可用。该问题记录在 [agent-skills #445](https://github.com/addyosmani/agent-skills/issues/445)，上游问题见 [antigravity-cli #788](https://github.com/google-antigravity/antigravity-cli/issues/788)。

在这个 importer 限制存在期间，直接使用原生 plugin 的 skills：

| 预期 wrapper | 在 Antigravity 中的直接调用 | 说明 |
|------------------|-------------------------------|-------|
| `/spec` | `/agent-skills:spec-driven-development` | 写代码前先生成结构化 spec |
| `/constraints` | `/agent-skills:constraint-driven-development` | 定义并执行项目的质量底线 |
| `/planning` | `/agent-skills:planning-and-task-breakdown` | Antigravity 内置的 `/planning` 命令是独立的 plan-mode 控制 |
| `/build` | `/agent-skills:incremental-implementation` | 同时调用 `/agent-skills:test-driven-development`；仅限 wrapper 的 `/build auto` 编排不可用 |
| `/test` | `/agent-skills:test-driven-development` | 运行 red-green-refactor workflow |
| `/review` | `/agent-skills:code-review-and-quality` | 运行五轴 review workflow |
| `/code-simplify` | `/agent-skills:code-simplification` | 在不改变行为的前提下简化 |
| `/ship` | `/agent-skills:shipping-and-launch` | wrapper 的自动 persona fan-out 不可用；分别调用 specialist agents |
| `/webperf` | 在 `/agents` 中选择 `web-performance-auditor` | 这个 workflow 是 persona，不是 skill |

不要通过给 TOML 文件添加 YAML frontmatter 来变通。Gemini CLI 用严格的解析器读取平行的 TOML command 格式，`---` frontmatter 会让那些文件变成非法 TOML，而且不会改变 Antigravity 的转换行为。

---

## Skills 与发现

Antigravity 会自动发现 plugin `skills/` 目录中的 skills。
* Antigravity 按需把用户任务与意图匹配到相关 skills。
* 如果任务匹配某个 skill，agent 会加载该 skill，并在执行前征求你的许可。

---

## 验证与校验

要校验本地 plugin 结构正确且包含全部 skills，运行：
```bash
agy plugin validate /path/to/agent-skills
```

然后开一个新 session，输入 `/agent-skills:` 查看带命名空间的 skill catalog。如果 validator 报告 commands 已被转换、但 `/build` 返回 `No matches`，请使用上表中的直接调用方式；重新安装或给 TOML 加 `name` 字段都解决不了这个已知的 importer 限制。

---

## 工作原理

### 1. 按需 Skill 激活
Antigravity CLI 自动发现已安装 plugin `skills/` 目录下的 `SKILL.md` 文件。利用每个 skill frontmatter 中的触发描述，agent 检测到匹配的开发者意图时会动态激活合适的 workflow。

例如，当你让 agent：
- **设计一个新系统** → 它会建议/激活 `spec-driven-development`。
- **实现一个功能** → 它会激活 `incremental-implementation` 和 `test-driven-development`。
- **修一个 bug** → 它会激活 `debugging-and-error-recovery`。

### 2. Specialized Agent Personas
Plugin 会从 `agents/` 目录注册可复用的 subagent 定义：
- `code-reviewer.md`
- `security-auditor.md`
- `test-engineer.md`

你可以在 session 内直接调用这些 personas，或在用 subagents 分派任务时调用。

---

## 配置与定制

### 项目级强制约束（`AGENTS.md`）
要强制执行严格的 skill 合规（例如写代码前必须先有 spec 或 plan），把 `AGENTS.md` 复制或链接到你的 workspace 根目录。Antigravity CLI 会读取这个文件，让 agent 的行为和 planning 阶段对齐团队约定。

### Sandbox 模式
如果你想以受限的终端权限运行 skills 或脚本（在跑第三方验证测试时更安全），用以下方式启动 CLI：

```bash
agy --sandbox
```

---

## 使用建议

1. **保持 plugin 最新：** 可以用以下命令更新 CLI 或检查更新的 plugin 版本：
   ```bash
   agy update
   ```
2. **执行前先 review：** 当 agent 用这些 skills 执行复杂重构任务时，按 `Ctrl+r` 进入 **Artifact Review** 界面，在代码 commit 之前 review、编辑或批准。
3. **控制权限：** 只在你信任的本地项目中使用 `--dangerously-skip-permissions` flag，用于跳过手动工具审批提示。
