# 同步记录

本文件记录 `vinvcn/addyosmani-agent-skills-zh` 对上游 `addyosmani/agent-skills` 的内容同步历史。流程见 [.skills/translate-skill/SKILL.md](.skills/translate-skill/SKILL.md)，术语译法以 [TRANSLATION-GLOSSARY.md](TRANSLATION-GLOSSARY.md) 为唯一权威。

## 最新同步

`addyosmani/agent-skills@aeac41d`（v0.6.13）于 2026-10-18。

提醒：每次同步上游 release 导致 `.claude-plugin/plugin.json`、`.codex-plugin/plugin.json`、`plugin.json` 等 manifest 版本变化时，要把本地化仓库的对应 manifest 一并 bump 到同一版本号（保留本地化 description），并用 `node scripts/validate-versions.js` 确认一致。

## 同步记录

- 2026-10-18：已同步 `addyosmani/agent-skills@aeac41d`（v0.6.13）：plugin manifest bump 至 0.6.13；`performance-optimization` 与 `security-and-hardening` 重构为精简 SKILL.md + references 模式（新增 `references/optimization-patterns.md`、`references/hardening-patterns.md`）；`idea-refine` 对齐到 skill anatomy（新增 Overview/When to Use/Common Rationalizations）；`interview-me` 新增 Step 6 终止回合规则、`spec-driven-development` 新增写完 spec 即停止规则；`code-review-and-quality`、`test-driven-development` description 扩展；`documentation-and-adrs` 新增「文字审阅」小节、`frontend-ui-engineering` 新增「参考驱动的 UI 质量」小节；新增 `docs/other-hosts.md`，以及 skill-lint、floor-guard 参考测试、hook 回归测试等基础设施（原样复制）；本地同步 commit `待定`（提交后替换）。
- 2026-09-14：已同步 `addyosmani/agent-skills@be4e44a`（v0.6.9），本地同步 commit `8899c97`。新增 `constraint-driven-development`、`interview-me`、`observability-and-instrumentation` 三个 skills，`/constraints`、`/webperf` 两个命令，`web-performance-auditor` persona，以及 Codex/Antigravity/Command Code 适配器、evals 和校验脚本；刷新全部 docs 与 skills 翻译。后续 `436ef84` 补记同步版本号，`4af1427` 将 plugin manifest 对齐到上游 0.6.9，`1987d02` 修复翻译标题后的 anchor 链接。
- 2026-05-09：已同步 `addyosmani/agent-skills@4c585c3`，本地同步 commit `dbc2a47`。全量简体中文本地化：25 个 skills、docs、commands、personas 与各 agent 适配器；`1c4fc64` 补记同步 revision，`754daff` 补上游署名链接。
