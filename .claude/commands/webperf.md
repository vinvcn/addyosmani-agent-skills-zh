---
description: 通过 web-performance-auditor persona 运行 web 性能审计
---

`/webperf` 专门面向 web 应用。不要把它用于 utility libraries、CLIs，或没有浏览器端产物的 server-only 代码。

## 确定模式

**Deep 模式** — 以下任意一项可用时激活：
- 一份 Lighthouse JSON 报告文件（例如 `npx lighthouse <url> --output json --output-path ./report.json`，或来自 Chrome DevTools MCP CLI 的 `npx -p chrome-devtools-mcp chrome-devtools lighthouse_audit --output-format=json`）
- 一份 PageSpeed Insights JSON 响应（包含 Lighthouse + CrUX）
- 一份 CrUX API 响应（需要 `CRUX_API_KEY` 或 `GOOGLE_API_KEY`）
- 一份 DevTools performance trace
- 一个 live URL，外加 harness 中已配置的 `chrome-devtools` MCP server（agent 可以直接通过 `lighthouse_audit` 和 `performance_*` tools 采集指标）
- 在本地调用的 Chrome DevTools MCP CLI（通过 `npx -p chrome-devtools-mcp chrome-devtools <tool>`，或在 `npm i -g chrome-devtools-mcp` 之后）— 用户运行类似 `chrome-devtools lighthouse_audit --output-format=json` 的命令，并把 JSON 输出交给 agent

**Quick 模式** — 以上都不可用时的默认模式。Agent 在源代码中扫描结构性反模式，并把每个发现标注为 `potential impact`。

## 运行审计

启动 `web-performance-auditor` subagent。显式传给它：

- 待 review 的文件、组件或 diff
- 任何产物路径（Lighthouse JSON、PSI JSON、CrUX 响应、trace）或粘贴的 JSON 内容
- 已知时的目标 URL 或页面名
- 一条关于你预期使用哪种模式（Quick 或 Deep）的说明，这样若本意是 Deep，agent 会把缺失的输入暴露出来

该 subagent 返回一份 scorecard（只填入有来源的数值）、一份排好序的 findings 列表、正面观察，以及主动给出的建议。

## 输出

把完整的审计报告返回给用户。不需要综合或合并步骤 — 这是单 persona 命令。
