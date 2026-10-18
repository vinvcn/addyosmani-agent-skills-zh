# 其他 host

这些 host 能安装本包，但没有出现在 README 的安装章节里，因为还没有 maintainer 在当前发布版本上跑过它们。每条记录只有一行：host 及其安装命令。要新增一条，参见 [添加 Host 指南](../CONTRIBUTING.md#添加-host-指南)。

Skills 就是普通的 `SKILL.md` 目录，因此任何能读取 Agent Skills 布局的 agent 都能加载它们。参见 [getting-started.md](getting-started.md)。

- **Dojo Workspace**：`dojo skills add vinvcn/addyosmani-agent-skills-zh`
- **fx**：`git clone https://github.com/vinvcn/addyosmani-agent-skills-zh.git /tmp/agent-skills && mkdir -p .fx/skills && cp -R /tmp/agent-skills/skills/* .fx/skills/`（项目作用域；要让每个 workspace 都能用，请改用 `~/.fx/skills/`；需要 fx 0.0.5 或更高版本）
- **Oh My Pi**：`omp plugin marketplace add vinvcn/addyosmani-agent-skills-zh`，然后 `omp plugin install agent-skills@addy-agent-skills`
- **Pi**：`pi install git:github.com/vinvcn/addyosmani-agent-skills-zh`
