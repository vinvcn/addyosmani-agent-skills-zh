# 安全检查清单

Web 应用安全的快速参考。配合 `security-and-hardening` skill 使用。

## 目录

- [威胁建模（从这里开始）](#威胁建模从这里开始)
- [提交前检查](#提交前检查)
- [身份认证](#身份认证)
- [授权](#授权)
- [输入验证](#输入验证)
- [安全响应头](#安全响应头)
- [CORS 配置](#cors-配置)
- [数据保护](#数据保护)
- [依赖安全](#依赖安全)
- [AI / LLM 安全](#ai--llm-安全)
- [错误处理](#错误处理)
- [OWASP Top 10 快速参考](#owasp-top-10-快速参考)
- [OWASP LLM Top 10 快速参考](#owasp-llm-top-10-快速参考)

## 威胁建模（从这里开始）

在搬出各种控制手段之前，先花五分钟站在攻击者的角度思考：

- [ ] 画出信任边界（requests、uploads、webhooks、第三方 APIs、LLM 输出，以及由你不控制的进程写入的本地值）
- [ ] 点名资产（凭据、PII、支付数据、admin 操作、资金流转）
- [ ] 对每条边界跑一遍 STRIDE（Spoofing 伪造、Tampering 篡改、Repudiation 否认、Info disclosure 信息泄露、DoS 拒绝服务、Elevation 提权）
- [ ] 在 use cases 旁边写下 abuse cases（「我要是怎么滥用这个功能？」）

## 提交前检查

- [ ] 代码中没有 secrets（`git diff --cached | grep -i "password\|secret\|api_key\|token"`）
- [ ] `.gitignore` 覆盖：`.env`、`.env.local`、`*.pem`、`*.key`
- [ ] `.env.example` 使用占位值（不是真实 secrets）

## 身份认证

- [ ] 密码使用 bcrypt（≥12 rounds）、scrypt 或 argon2 哈希
- [ ] Session cookies：`httpOnly`、`secure`、`sameSite: 'lax'`
- [ ] 已配置 session 过期时间（合理的 max-age）
- [ ] 登录端点有 rate limiting（每 15 分钟 ≤10 次尝试）
- [ ] 密码重置 tokens：有时限（≤1 小时）、一次性使用
- [ ] 重复失败后锁定账号（可选，并发送通知）
- [ ] 敏感操作支持 MFA（可选但推荐）

## 授权

- [ ] 每个受保护端点都检查 authentication
- [ ] 每次资源访问都检查 ownership/role（防止 IDOR）
- [ ] Admin endpoints 需要 admin role verification
- [ ] API keys 限定为最小必要权限
- [ ] JWT tokens 已验证（signature、expiration、issuer）

## 输入验证

- [ ] 所有用户输入都在系统边界验证（API routes、form handlers）
- [ ] 验证使用 allowlists（不是 denylists）
- [ ] 字符串长度受约束（min/max）
- [ ] 数值范围已验证
- [ ] Email、URL 和日期格式使用合适的库验证
- [ ] 文件上传：限制类型、限制大小、验证内容
- [ ] SQL 查询参数化（不做字符串拼接）
- [ ] HTML 输出已编码（使用框架自动 escaping）
- [ ] redirect 前验证 URLs（防止 open redirect）
- [ ] 服务端 URL 抓取只允许白名单目标，封锁私有/保留 IP（防止 SSRF）
- [ ] 破坏性路径操作（删除/移动/覆盖）：先解析 symlink、限定在允许根目录内、保持最小深度，并在调用前读取 ownership 证据

### 破坏性路径操作

针对由数据指定的目标做收敛。先解析，再判断  - 并且把解析结果当作候选，而不是当作授权：

```typescript
import { realpath, readFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute, join, sep } from 'node:path';

const ALLOWED_ROOTS = ['/var/lib/myapp/sessions']; // an allowlist, not a pattern
const MIN_DEPTH = 1;                               // so a root is never the target

async function resolveDeletable(candidate: string, expectedOwner: string) {
  const target = await realpath(resolve(candidate)); // symlinks resolved BEFORE the check
  const inRoot = ALLOWED_ROOTS.some((root) => {
    const rel = relative(root, target);
    // `rel === '..'` / `'../'` only — a plain `startsWith('..')` would also
    // reject a legitimate child named `..cache`.
    if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return false;
    return rel.split(sep).length >= MIN_DEPTH;
  });
  if (!inRoot) throw new Error(`refusing: outside allowed roots (${target})`);

  const owner = await readFile(join(target, '.owner'), 'utf8').catch(() => null);
  if (owner?.trim() !== expectedOwner) throw new Error(`refusing: unproven owner (${target})`);
  return target;
}
```

这段代码没有做到的事，也是复制这段 snippet 时必须一并说明的事：

- **marker 只是自我声明。** 任何能在允许根目录内写入的东西，都能写 `.owner`。`expectedOwner` 必须来自已认证的状态；而且这个 marker 需要完整性保护（严格的 ownership，或 MAC），才能算作授权，否则它只是针对误推导目标的一道一致性检查。
- **返回一个路径会留下 check/use 竞态。** 如果不可信进程可能在检查和调用之间替换某个祖先目录，就改用无跟随（no-follow）的 descriptor、在根目录之下语义内直接操作，或保证该层级在此期间不可变。

## 安全响应头

```
Content-Security-Policy: default-src 'self'; script-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0  (disabled, rely on CSP)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## CORS 配置

```typescript
// Restrictive (recommended)
cors({
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

// NEVER use in production:
cors({ origin: '*' })  // Allows any origin
```

## 数据保护

- [ ] API 响应中排除敏感字段（`passwordHash`、`resetToken` 等）
- [ ] 不记录敏感数据（密码、tokens、完整 CC numbers）
- [ ] PII 静态加密（如果法规要求）
- [ ] 所有外部通信使用 HTTPS
- [ ] 数据库备份已加密

## 依赖安全

先找到**安装边界**。如果该包被父级的 `workspaces` 声明匹配到，就以那个 workspace root 为边界；否则以同时拥有其 manifest 和依赖图的最近项目根目录为边界。在这个边界上，交叉印证 `packageManager`（如果存在）、lockfile 和 CI 命令。一旦它们互相矛盾，或那里存在多个互相竞争的管理器 lockfile，就停下来。嵌套项目只有在其位于父 workspace 之外时才是独立的；独立子项目合理地可以使用不同的管理器。

| 管理器/版本信号 | 冻结/不可变 CI 安装 | 已知漏洞审计 |
|---|---|---|
| npm（`package-lock.json` 或 `npm-shrinkwrap.json`） | `npm ci` | `npm audit` |
| pnpm | `pnpm install --frozen-lockfile` | `pnpm audit` |
| Yarn 2+ | `yarn install --immutable` | `yarn npm audit -A -R` |
| Yarn 1 | `yarn install --frozen-lockfile` | `yarn audit` |

对于表中未列出的管理器或版本，查阅其官方文档；不要拿另一个管理器的命令或更新版本的默认值来替代。

### Install-Script 门禁

绝不要通过「先照常安装、再去发现」的方式，在一个默认设置尚未核实的客户端上摸出依赖的生命周期脚本。

1. 以禁用依赖脚本的方式 bootstrap，或采用有文档支持的默认拒绝（default-deny）策略加 fail-closed 强制执行。
2. 批准之前，检查确切版本的包及其脚本源码。
3. 在安装边界记录范围最窄的原生 allow/deny 策略，并提交到版本库。
4. 用该策略跑一次干净的 frozen/immutable 安装，并验证必需的包仍能构建。

**时点快照：** 包管理器的默认值和命令名称变化很快。依赖这张表之前，先对照所锁定客户端的当前官方文档核实一遍。

| 管理器版本 | 原生策略 |
|---|---|
| 未核实细粒度批准机制的 npm | 用 `npm ci --ignore-scripts` bootstrap；若意图是项目级全面阻断，则持久化 `ignore-scripts=true`。让脚本保持禁用，或有意升级后再允许任何经过审查的依赖脚本。 |
| npm 11.18.x（在 11.18.0 上验证） | 默认会带着警告运行未经审查的依赖脚本。在正常安装前强制 `strict-allow-scripts=true`，然后在安装边界使用不感知 workspace 的 `npm install-scripts ls`；批准按版本锁定，拒绝按包名全量生效。 |
| npm 12.x（在 12.0.1 上验证） | 默认跳过未经审查的依赖脚本；`strict-allow-scripts=true` 会在执行前就让安装因它们的存在而失败。使用同一套 `npm install-scripts` 审查与批准流程。 |
| pnpm 11+ | 使用 `pnpm approve-builds` 并提交 `allowBuilds` 决定；`strictDepBuilds` 默认为 `true`，未经审查的构建会失败。 |
| pnpm 10.26-10.x | 显式配置 `allowBuilds`，或使用 `pnpm approve-builds` 配合旧版的 `onlyBuiltDependencies` / `ignoredBuiltDependencies` 列表。设置 `strictDepBuilds: true`；v10 的默认值是 `false`。 |
| pnpm 10.1-10.25 | `pnpm approve-builds` 记录的是旧版列表；在支持的版本（10.3+）上启用 `strictDepBuilds`。 |
| 更旧或未知版本的 pnpm | 用 `pnpm install --frozen-lockfile --ignore-scripts` bootstrap。除非锁定的版本文档中有可执行策略，否则保持脚本禁用。 |
| Yarn 4.14+ | 依赖 postinstall 默认禁用。只用顶层 `dependenciesMeta.<package>.built: true` 授予必需的例外。 |
| Yarn 2-4.13 | 在 `.yarnrc.yml` 中设置 `enableScripts: false`，然后只用顶层 `dependenciesMeta.<package>.built: true` 授予必需的例外；不要全局启用脚本。 |
| Yarn 1 | 用 `yarn install --ignore-scripts` bootstrap；除非每个必需的例外都在锁定客户端的文档化流程下经过审查，否则保持脚本禁用。 |

权威检查来源：[npm install-scripts](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts/)、[install policy](https://docs.npmjs.com/cli/v11/commands/npm-install/) 和 [CLI releases](https://github.com/npm/cli/releases)；[pnpm approve-builds](https://pnpm.io/cli/approve-builds) 和 [build settings](https://pnpm.io/settings#allowbuilds)；[Yarn security](https://yarnpkg.com/features/security) 和 [manifest](https://yarnpkg.com/configuration/manifest#dependenciesMeta)。

**供应链卫生**（漏洞审计抓不到新出现的恶意包）：
- [ ] 每个项目/workspace 根目录只提交一份权威 lockfile，且 CI 绝不重写它
- [ ] Critical/high 发现按可达性（reachability）triage；暂缓处理必须写明原因和复审日期
- [ ] 强制审计自动修复（`npm audit fix --force` 或等价命令）绝不自动执行；修复的 diff 和 changelog 要经过审查
- [ ] 在管理器支持的地方验证 registry 签名/provenance
- [ ] 依赖生命周期脚本在首次执行前即被阻断，只通过所锁定管理器的原生策略批准
- [ ] 新依赖审查其 ownership、维护状态、发布时长、provenance、传递依赖图和 typosquatting

## AI / LLM 安全

适用于任何调用 LLM 的功能（chatbots、摘要器、agents、RAG）：

- [ ] 模型输出一律视为不可信  - 绝不进入 `eval`/SQL/shell/`innerHTML`/文件路径
- [ ] 假定存在 prompt injection；权限在代码里强制执行，而不是写死在 system prompt 里
- [ ] secrets、跨租户数据和完整 system prompt 都不进入 context window
- [ ] tool/agent 权限限定范围；破坏性或不可逆操作需要确认
- [ ] 设置 token、rate 和 recursion/loop 上限（约束资源消耗）

## 错误处理

```typescript
// Production: generic error, no internals
res.status(500).json({
  error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' }
});

// NEVER in production:
res.status(500).json({
  error: err.message,
  stack: err.stack,         // Exposes internals
  query: err.sql,           // Exposes database details
});
```

## OWASP Top 10 快速参考

| # | 漏洞 | 预防 |
|---|---|---|
| 1 | Broken Access Control | 每个端点做 auth checks，验证 ownership |
| 2 | Cryptographic Failures | HTTPS、强哈希、代码中无 secrets |
| 3 | Injection | 参数化查询、输入验证 |
| 4 | Insecure Design | Threat modeling、spec-driven development |
| 5 | Security Misconfiguration | Security headers、最小权限、audit deps |
| 6 | Vulnerable Components | 使用生态自带的依赖审计（`npm audit`、`pip-audit` 等），保持 deps 更新，最小化 deps |
| 7 | Auth Failures | 强密码、rate limiting、session management |
| 8 | Data Integrity Failures | 验证更新/依赖，signed artifacts |
| 9 | Logging Failures | 记录安全事件，不记录 secrets |
| 10 | SSRF | 验证/allowlist URLs，限制 outbound requests |

## OWASP LLM Top 10 快速参考

适用于带 LLM 功能的应用。参见 [OWASP GenAI Security Project](https://genai.owasp.org/llm-top-10/)。

| ID | 风险 | 预防 |
|---|---|---|
| LLM01 | Prompt Injection | 不要把 system prompt 当信任边界；权限在代码里强制执行 |
| LLM02 | Sensitive Information Disclosure | secrets/PII 不进 prompt；过滤输出 |
| LLM03 | Supply Chain | 像对待任何依赖一样审查 models、datasets 和 plugins |
| LLM04 | Data and Model Poisoning | 使用可信的模型来源并验证完整性；审查 fine-tuning 和 RAG 数据 |
| LLM05 | Improper Output Handling | 模型输出视为不可信；验证、参数化、编码 |
| LLM06 | Excessive Agency | 限定 tool 权限范围；确认破坏性操作 |
| LLM07 | System Prompt Leakage | 假定 system prompt 可能泄露；里面不放任何 secrets |
| LLM08 | Vector and Embedding Weaknesses | RAG embeddings 按租户分区；索引前先验证文档 |
| LLM09 | Misinformation | 回答附带引用作为依据；验证关键论断；保留 human in the loop |
| LLM10 | Unbounded Consumption | 对 token、请求速率和 loop/recursion 深度设上限 |
