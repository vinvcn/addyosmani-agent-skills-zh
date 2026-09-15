# 在 Command Code 中使用 agent-skills

[Command Code](https://commandcode.ai) 有原生的 skills 系统。内置的 `cmd skills` 命令会 clone 一个 GitHub 仓库，递归发现每个 `SKILL.md`，并安装你选中的那些。

Command Code 的可执行文件名为 `cmd`（在 Windows 上别名为 `cmdc`，另有 `command-code`）。下面的示例统一使用 `cmd`。

## 安装

**Project scope**（安装到当前 git 根目录的 `.commandcode/skills/` —— 默认方式）：

```bash
cmd skills add vinvcn/addyosmani-agent-skills-zh
```

在交互式终端中，这会显示一个多选列表，让你选择要安装 25 个 skills 中的哪些。管道/非交互式调用会安装全部发现的 skills。

**安装指定 skill：**

```bash
cmd skills add vinvcn/addyosmani-agent-skills-zh -s spec-driven-development
```

**User scope**（安装到 `~/.commandcode/skills/`，在所有项目中可用）：

```bash
cmd skills add vinvcn/addyosmani-agent-skills-zh --global
```

**其他支持的写法：**

```bash
cmd skills add vinvcn/addyosmani-agent-skills-zh@main            # a specific branch
cmd skills add vinvcn/addyosmani-agent-skills-zh/skills/interview-me   # a specific path in the repo
cmd skills add vinvcn/addyosmani-agent-skills-zh --force         # overwrite / update if already installed
```

## 管理

```bash
cmd skills list                       # list installed skills (project + user + bundled)
cmd skills remove spec-driven-development           # remove a project-scoped skill
cmd skills remove spec-driven-development --global  # remove a user-scoped skill
```

`add` 加上 `--force` 会重新拉取并覆盖已存在的 skill，这就是更新到最新版本的办法。

## 使用

已安装的 skills 会被自动发现，并出现在 TUI 的 slash 菜单中，带有 `[skill]` 标记：

```
/spec-driven-development   [skill] Write a spec before writing code…
```

输入 `/` 浏览，或开始输入 skill 名称进行过滤。用 `/skills` 启用/禁用 skills。

## Skills 的存放位置

Command Code 从以下位置发现 skills（project 条目会解析到最近的 git root）：

| Scope | 路径 |
|-------|------|
| Project | `.commandcode/skills/<name>/SKILL.md` |
| Project (agents-compat) | `.agents/skills/<name>/SKILL.md` |
| User | `~/.commandcode/skills/<name>/SKILL.md` |
| User (agents-compat) | `~/.agents/skills/<name>/SKILL.md` |

`cmd skills add` 会写入 `.commandcode/skills/`（project）或 `~/.commandcode/skills/`（`--global`）。

