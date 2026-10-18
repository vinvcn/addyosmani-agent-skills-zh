---
name: security-and-hardening
description: 加固代码以防漏洞。用于审计某个输入处理函数是否存在漏洞、处理用户输入、认证、数据存储或外部集成时，或用于检查登录流程是否安全、是否符合 OWASP Top Ten 时。用于构建任何接受不可信数据、管理用户会话或与第三方服务交互的功能时。用于审计依赖中的已知漏洞、分诊包管理器的 audit 结果，或评估新包的供应链风险时。当涉及个人数据或隐私合规（GDPR、CCPA）时也使用。
---

# 安全和加固

## 概览

面向 Web 应用的 security-first 开发实践。把每一个外部输入都当作敌意的，把每一个 secret 都当作神圣的，把每一次 authorization 检查都当作强制的。Security 不是一个阶段，它是对每一行接触用户数据、认证或外部系统的代码的约束。

## 何时使用

- 构建任何接受用户输入的东西
- 实现 authentication 或 authorization
- 存储或传输敏感数据
- 集成外部 API 或服务
- 添加文件上传、webhooks 或 callbacks
- 处理支付或 PII 数据

## 流程：威胁建模优先

没有 threat model 就往上堆 controls，那只是猜测。在做加固之前，先花五分钟像攻击者一样思考：

1. **画出 trust boundaries。** 不可信数据在哪些位置进入你的系统？HTTP 请求、表单字段、文件上传、webhooks、第三方 API、消息队列，以及 **LLM 输出**；还包括那些因为由 OS 交给你而看起来是内部的本地值：另一个进程的命令行或环境变量、共享卷上的文件名、job payload 里的路径。信任跟随的是*写入*某个值的人，而不是传送它的通道。每一条边界都是攻击面。
2. **点名资产。** 有什么值得偷或值得破坏？Credentials、PII、支付数据、admin 操作、资金流转。
3. **对每条边界跑一遍 STRIDE** —— 它是一个快速视角，不是仪式：

| 威胁 | 要问的问题 | 典型 mitigation |
|---|---|---|
| **S**poofing（假冒） | 有人能冒充某个用户/服务吗？ | 认证、签名验证 |
| **T**ampering（篡改） | 数据能在传输中或静态存储时被篡改吗？ | 完整性检查、参数化查询、HTTPS |
| **R**epudiation（否认） | 某个行为事后能被否认吗？ | 对安全事件做审计日志 |
| **I**nformation disclosure（信息泄露） | 数据会泄露吗？ | 加密、字段 allowlist、通用错误信息 |
| **D**enial of service（拒绝服务） | 它会被打垮吗？ | 限流、输入大小上限、超时 |
| **E**levation of privilege（提权） | 用户能获得本不该有的权限吗？ | Authorization 检查、最小权限 |

4. **在每个 use case 旁边写下 abuse case。** 对每个功能问自己："我会怎么滥用它？" 然后把那答案变成你的第一个测试。

如果你说不出某个功能的 trust boundaries，你就还没准备好保护它。这就是 OWASP 的 **A04: Insecure Design** —— 大多数 breaches 始于设计，而不是代码。

## 三层边界系统

### Always Do（没有例外）

- **在所有系统边界（API routes、form handlers）校验全部外部输入**
- **参数化所有数据库查询** —— 绝不把用户输入拼接进 SQL
- **对输出做编码** 以防 XSS（使用框架的自动转义，不要绕过它）
- **所有外部通信使用 HTTPS**
- **用 bcrypt/scrypt/argon2 对密码做 hash**（绝不存明文）
- **设置安全 headers**（CSP、HSTS、X-Frame-Options、X-Content-Type-Options）
- **对 session 使用 httpOnly、secure、sameSite cookies**
- **每次发布前，用检测到的包管理器的原生 audit 针对已提交的 lockfile 跑一遍**

### Ask First（需要人工批准）

- 新增 authentication 流程或修改 auth 逻辑
- 存储新类别的敏感数据（PII、支付信息）
- 新增外部服务集成
- 修改 CORS 配置
- 添加文件上传处理器
- 修改 rate limiting 或 throttling
- 授予更高权限或角色

### 绝不执行

- **绝不把 secrets 提交**到版本控制（API keys、密码、tokens）
- **绝不在日志里记录敏感数据**（密码、tokens、完整信用卡号）
- **绝不把客户端校验当作安全边界**
- **绝不为图省事而禁用安全 headers**
- **绝不对用户提供的数据使用 `eval()` 或 `innerHTML`**
- **绝不把 sessions 存放在客户端可访问的存储里**（用 localStorage 存 auth tokens）
- **绝不向用户暴露 stack traces** 或内部错误细节

## 加固控制

下面的规则就是工作流；每条规则的一个具体实现放在 [references/hardening-patterns.md](references/hardening-patterns.md)。到写那段代码时再打开你需要的那一节，不要提前读。

### Injection、XSS 与访问控制

- 参数化每一个查询。绝不要用输入字符串拼出 SQL、NoSQL 或 shell 命令。
- 通过框架的自动转义对输出编码。如果原始 HTML 不可避免，先用一个 allowlist sanitizer 做清洗。
- 对每一个请求检查 **authorization**，而不只是 authentication：已认证用户必须拥有（或被允许访问）那个具体资源（A01，IDOR）。

模式：[注入](references/hardening-patterns.md#注入)、[XSS](references/hardening-patterns.md#跨站脚本攻击xss)、[访问控制](references/hardening-patterns.md#访问控制失效)。

### 认证与会话

- 用 bcrypt（≥12 rounds）、scrypt 或 argon2 对密码做 hash。Session secret 来自环境变量，绝不来自代码。
- Session cookie 要带 `httpOnly`、`secure` 和 `sameSite: 'lax'` 或 `'strict'`（这是 CSRF 防线；`'none'` 会在跨站请求中带上 cookie），并设置一个有界的 `maxAge`。

模式：[身份认证](references/hardening-patterns.md#身份认证失效)。

### 安全 headers、CORS 与响应

- 每个响应都带安全 headers（helmet 或框架等价物）；CSP 从 `default-src 'self'` 起步，然后收紧，而不是放松。
- CORS 限定为配置中的显式 origin 列表。带 credentials 时绝不用 `*`。
- 任何响应发出前先剥离敏感字段（`passwordHash`、reset tokens）。错误响应体保持通用；内部细节只进服务端日志。

模式：[安全配置错误](references/hardening-patterns.md#安全配置错误)、[敏感数据泄露](references/hardening-patterns.md#敏感数据泄露)。

### 输入校验与上传

- 在边界用 schema 校验：allowlist 的形状、长度、枚举、格式。拒绝时返回 422 和结构化 details；下游代码只用解析后的、有类型的值。
- 上传：allowlist MIME 类型、限制大小、在关键处校验内容（magic bytes）。扩展名证明不了任何事。

模式：[Schema 校验](references/hardening-patterns.md#在边界进行-schema-校验)、[文件上传](references/hardening-patterns.md#文件上传安全)。

### 服务端抓取（SSRF）

任何受用户影响的 URL —— webhooks、从 URL 导入、图片代理、链接预览 —— 都可能被指向内部服务。对 scheme 和 host 做 allowlist，解析 **全部** DNS 记录，只要有私有或保留地址（loopback、link-local `169.254.169.254`、private、unique-local，IPv4 和 IPv6 都算）就拒绝，并不允许重定向。这个检查仍然存在 DNS-rebinding 的 TOCTOU 缺口：对高风险的入口，固定（pin）解析出的 IP，或在前面放一个过滤代理。

模式：[SSRF](references/hardening-patterns.md#服务端请求伪造ssrf)。

### 对派生路径的破坏性操作

一次 delete、move 或 overwrite，其安全性只取决于命名其目标的值；信任跟随的是*写入*那个值的人，而不是投递它的通道：另一个进程的命令行和表单字段一样受攻击者控制。形状检查只能证明格式良好，不能证明授权。在调用之前，三个条件缺一不可：解析后的目标（已解析 symlinks）位于某个 **allowlisted root** 之下；它至少在该 root **下一层**；并且它带有**在操作之前读取的 ownership 证据**。拒绝执行时，记下被拒绝的目标然后停止；绝不回退到更宽的默认路径。

这个检查为什么比看起来更弱（标记自我声明、check/use 竞争）：[对派生路径的破坏性操作](references/hardening-patterns.md#对派生路径的破坏性操作)。完整示例：`../../references/security-checklist.md`。

### 限流

对 API 总体上限制，对 auth 端点严格限制（约每 15 分钟 10 次尝试）。一旦有多个进程在服务流量，内存计数器就会悄悄变成 `max × instances`，或者在 serverless 上永远不触发：用共享存储支撑限流器。

模式：[限流](references/hardening-patterns.md#限流)。

### Secrets

Secrets 来自环境变量。`.env.example` 带占位值提交；真实的 `.env*` 文件和密钥材料进 gitignore；提交前先 grep 一遍暂存的 diff。**一个一旦到达 remote 的 secret 在落地那一刻就已泄露：先轮换它，再清除 history。**

模式：[Secrets 管理](references/hardening-patterns.md#secrets-管理)。

### 依赖与供应链

1. **找到 installation boundary 和 manager。** 使用拥有 lockfile 的 workspace 根目录；只有在独立嵌套项目位于该 workspace 之外时才使用它。交叉验证 `packageManager`（存在时）、lockfile 和 CI；出现分歧或互相竞争的 lockfiles 时停下。固定 manager 版本。
2. **在首次执行前阻断依赖脚本。** 以禁用脚本的方式 bootstrap，或采用一个有文档的 fail-closed 策略；检查待执行脚本的源码，只批准最低限度必需的包，提交这个策略，然后用一次干净的 frozen/immutable install 验证。绝不无差别批准。
3. **每次发布前，用原生 audit 针对已提交的 lockfile 跑一遍。** 按 **可达性**（runtime、build、test、deploy 路径）和修复可得性分诊 critical/high。绝不自动应用强制修复（`npm audit fix --force` 或等价命令），因为强制修复可能越过声明的依赖范围；先预览、阅读 changelogs，并逐一测试产生的升级。每一次推迟都要记录原因和复查日期。
4. **Audit 只能匹配已知 advisories。** 它抓不到新出现的恶意包或 typosquatting 包（`cross-env` 对比 `crossenv`）。把新依赖、lockfile diff 和 script-policy 变更放在一起 review：ownership、维护状况、发布时长、provenance、传递依赖图。在支持的地方验证 registry 签名（`npm audit signatures`、`pnpm audit signatures`），并把"缺失"当作需要调查的信号，而不是被攻破的自动证明（A06，LLM03）。

分诊决策树：[依赖审计分诊](references/hardening-patterns.md#依赖审计分诊)。Manager 对照矩阵和 install-script 门禁：`../../references/security-checklist.md`。

### 个人数据与隐私

加固问的是"攻击者能读到它吗？"Privacy 问的是"我们*到底该不该*持有它，该持有多久？" 最好保护、最不会泄露、最省合规成本的数据，是你从未收集过的数据；把个人数据当作要最小化的负债。

- **在添加字段时就分类**（非个人、PII、敏感），并按类别分别处理。你无法保护、也无法兑现删除请求的数据，是你找不到的数据。
- **只针对一个声明过的目的去收集。** "以后可能用得上"是潜在的 breach 范围，不是目的。不要把 PII 写进 telemetry（`observability-and-instrumentation` skill 从 ops 角度表达了同一个观点）。
- **事先设定保留期限，然后真的去删除。** 每个个人数据存储都需要一个 TTL 和一条可用的删除路径，包括备份、缓存、搜索索引和分析副本。
- **支持你所在司法辖区要求的数据主体权利**（GDPR、CCPA 及同类法规）：导出、更正、删除。设计 schema 时让用户的数据可查找、可擦除，而不是不可逆地抹散在各个系统里。
- **同意控制收集和第三方共享，并且可审计。** 把 PII 发给分析、广告或 LLM 厂商就属于"共享"；厂商需要一份数据处理协议。把地区做成可配置的策略，而不是硬编码的假设。

分类表：[数据分类](references/hardening-patterns.md#数据分类)。Privacy 事件会启动 breach-notification 的倒计时；用 `debugging-and-error-recovery` skill 跑 postmortem。

### AI / LLM 功能

调用 LLM —— chatbots、摘要器、agents、RAG —— 会增加一个新的攻击面；把它映射到 [OWASP Top 10 for LLM Applications (2025)](https://genai.owasp.org/llm-top-10/)：

- **模型输出是不可信输入**（LLM05）。绝不进 `eval`、SQL、shell、`innerHTML` 或文件路径；先防御式解析，用 schema 校验，再编码。
- **Prompts 可能被劫持**（LLM01）。上下文里的不可信文本 —— 用户消息、抓取的网页、PDF —— 都可能携带指令。System prompt 不是安全边界；权限要在代码里强制执行。
- **把 secrets、其他租户的数据和完整 system prompt 挡在 context window 之外**（LLM02，LLM07）；限定工具权限，校验每一个工具参数，并对破坏性操作要求确认（LLM06）；给 tokens、请求速率和递归深度设上限（LLM10）；按租户分区 RAG embeddings，并在索引文档前先校验它们（LLM08）。

模式：[LLM 输出处理](references/hardening-patterns.md#llm-输出处理)。

## 审查清单

签字之前，走一遍 `../../references/security-checklist.md`：它覆盖身份认证、授权、输入、数据保护与隐私、headers 与 CORS、依赖与供应链、AI/LLM 和错误处理，外加 OWASP 速查表。

## 常见合理化借口

| 自我合理化 | 现实 |
|---|---|
| "这是内部工具，security 不重要" | 内部工具也会被攻破。攻击者专挑最弱的环节。 |
| "我们以后再加安全" | 事后补安全比一开始就构建难 10 倍。现在就加。 |
| "没人会来 exploiting 这个" | 自动化扫描器会找到它。靠隐蔽来保证安全不是安全。 |
| "框架会处理安全" | 框架提供工具，不提供保证。你还是得正确使用它们。 |
| "这只是个原型" | 原型会上生产。安全习惯从第一天开始。 |
| "这里搞 threat modeling 太过了" | 五分钟思考"我会怎么攻击它"，能防住那些事后任何 control 都补不回来的设计缺陷。 |
| "只是 LLM 输出，不过是文本而已" | 那"文本"可能是一条 SQL 语句、一个 script 标签或一条 shell 命令。像对待任何不可信输入一样对待它。 |
| "audit 通过了，所以依赖是安全的" | Audit 匹配的是已知 advisories。它检测不出新出现的恶意包，也不会让未经 review 的 install 脚本变得安全可执行。 |
| "先收集起来，以后可能用得上" | 你没有持有的数据不会被 breach、被传票调取或被误删。"可能用得上"是 breach 范围，不是目的。 |
| "删除请求我们手动处理" | 手动擦除会漏掉备份、缓存和分析副本。如果 schema 找不出某个用户的数据，你就无法兑现删除请求 —— 要为它做设计。 |
| "合规是法务的问题，不是我们的" | 导出、删除、保留和同意都是 schema 和代码的事。等你把 PII 抹散到十个系统之后，法务没法再补上去。 |

## 危险信号

- 用户输入直接传入数据库查询、shell 命令或 HTML 渲染
- delete、move 或 overwrite 的目标来自 payload、配置值或另一个进程的命令行，只靠一个路径形状检查来防护
- 源码或 commit history 里有 secrets
- API endpoints 没有 authentication 或 authorization 检查
- 缺少 CORS 配置，或使用了通配符（`*`）origins
- 认证 endpoints 没有 rate limiting，或者多个实例前面放了一个内存态 limiter
- 向用户暴露 stack traces 或内部错误
- 依赖存在已知 critical 漏洞、同一 installation boundary 有互相竞争的 lockfiles、install 不可复现、脚本被无差别批准
- 服务端在没有 allowlist 的情况下抓取用户提供的 URLs（SSRF）
- LLM/模型输出被传进查询、DOM、shell 或 `eval`
- Secrets、PII 或完整 system prompt 被放进 LLM context window
- 收集个人数据时没有声明目的、保留期限或删除路径
- 在没有同意或数据处理协议的情况下把 PII 发给分析/广告/LLM 厂商
- "删除我的账号"只翻了个标志位，个人数据仍留在各个存储和备份里

## 验证

实现安全相关代码之后：

- [ ] 原生 audit 没有未缓解且可达的 critical/high findings；CI 保留 authoritative lockfile 并阻断未经 review 的依赖脚本
- [ ] 源码和 git history 中没有 secrets
- [ ] 所有用户输入都在系统边界做了校验
- [ ] 破坏性文件系统操作先解析 symlinks，再在执行前验证 allowlisted root、最小深度和 ownership
- [ ] 每个受保护 endpoint 都检查了 authentication 和 authorization
- [ ] 响应中存在安全 headers（用浏览器 DevTools 检查）
- [ ] 错误响应不暴露内部细节
- [ ] auth endpoints 启用了 rate limiting，且当有多个实例服务流量时由共享存储支撑
- [ ] 服务端 URL 抓取按 allowlist 校验过（无 SSRF）
- [ ] LLM/模型输出在使用前经过校验和编码（如果使用了 AI 功能）
- [ ] 个人数据已分类、按声明目的最小化收集，并设有保留期限
- [ ] 删除和导出请求端到端可用（包括备份、缓存和分析副本）
