# 加固模式

`security-and-hardening` skill 的代码模式和决策辅助。Skill 陈述每条规则；本文件给出它的一个具体实现。到写那段代码时再打开你需要的那一节 —— 它不是用来从头读到尾的。

共享检查清单（威胁建模、提交前检查、安全 headers、CORS、包管理器对照矩阵、install-script 门禁和 OWASP 速查表）在 `../../../references/security-checklist.md`。

## OWASP Top 10 防护模式

这些是防护模式，不是排名。2021 年的排序见 `../../../references/security-checklist.md#owasp-top-10-快速参考` 中的速查表。

### 注入

```typescript
// BAD: SQL injection via string concatenation
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// GOOD: Parameterized query
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// GOOD: ORM with parameterized input
const user = await prisma.user.findUnique({ where: { id: userId } });
```

### 身份认证失效

```typescript
// Password hashing
import { hash, compare } from 'bcrypt';

const SALT_ROUNDS = 12;
const hashedPassword = await hash(plaintext, SALT_ROUNDS);
const isValid = await compare(plaintext, hashedPassword);

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET,  // From environment, not code
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,     // Not accessible via JavaScript
    secure: true,       // HTTPS only
    sameSite: 'lax',    // CSRF protection
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
  },
}));
```

### 跨站脚本攻击（XSS）

```typescript
// BAD: Rendering user input as HTML
element.innerHTML = userInput;

// GOOD: Use framework auto-escaping (React does this by default)
return <div>{userInput}</div>;

// If you MUST render HTML, sanitize first
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
```

### 访问控制失效

```typescript
// Always check authorization, not just authentication
app.patch('/api/tasks/:id', authenticate, async (req, res) => {
  const task = await taskService.findById(req.params.id);

  // Check that the authenticated user owns this resource
  if (task.ownerId !== req.user.id) {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Not authorized to modify this task' }
    });
  }

  // Proceed with update
  const updated = await taskService.update(req.params.id, req.body);
  return res.json(updated);
});
```

### 安全配置错误

```typescript
// Security headers (use helmet for Express)
import helmet from 'helmet';
app.use(helmet());

// Content Security Policy
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],  // Tighten if possible
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
  },
}));

// CORS — restrict to known origins
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
}));
```

### 敏感数据泄露

```typescript
// Never return sensitive fields in API responses
function sanitizeUser(user: UserRecord): PublicUser {
  const { passwordHash, resetToken, ...publicFields } = user;
  return publicFields;
}

// Use environment variables for secrets
const API_KEY = process.env.STRIPE_API_KEY;
if (!API_KEY) throw new Error('STRIPE_API_KEY not configured');
```

### 服务端请求伪造（SSRF）

只要服务器去抓取一个受用户影响的 URL —— webhooks、"从 URL 导入"、图片代理、链接预览 —— 攻击者就能把它指向内部服务（cloud metadata、`localhost`、私有 IP）。

```typescript
// BAD: fetch whatever the user gives you
await fetch(req.body.webhookUrl);

// GOOD: allowlist scheme + host, reject if ANY resolved IP is private, forbid redirects
import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

const ALLOWED_HOSTS = new Set(['hooks.example.com']);

async function assertSafeUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== 'https:') throw new Error('https only');
  if (!ALLOWED_HOSTS.has(url.hostname)) throw new Error('host not allowed');
  // Resolve ALL records; a single private/reserved address fails the check.
  const addrs = await lookup(url.hostname, { all: true });
  if (addrs.some((a) => ipaddr.parse(a.address).range() !== 'unicast')) {
    throw new Error('private/reserved IP');
  }
  return url;
}

await fetch(await assertSafeUrl(req.body.webhookUrl), { redirect: 'error' });
```

`range() !== 'unicast'` 这个检查覆盖了 loopback、link-local `169.254.169.254`（cloud metadata，SSRF 的头号目标）、private 和 unique-local 范围，IPv4 与 IPv6 都适用。

**注意 —— 这里仍然存在一个 TOCTOU gap。** `fetch` 会在检查之后重新解析 DNS，所以攻击者用一条短 TTL 的记录，就能在校验和建立连接之间把域名 rebind 到内部 IP。对高风险场景，要么解析一次并连接固定（pinned）的 IP，要么在前面放一个过滤代理（`request-filtering-agent` / `ssrf-req-filter`）。

## 输入校验模式

### 在边界进行 Schema 校验

```typescript
import { z } from 'zod';

const CreateTaskSchema = z.object({
  title: z.string().max(200).trim().min(1),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional(),
});

// Validate at the route handler
app.post('/api/tasks', async (req, res) => {
  const result = CreateTaskSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: result.error.flatten(),
      },
    });
  }
  // result.data is now typed and validated
  const task = await taskService.create(result.data);
  return res.status(201).json(task);
});
```

### 文件上传安全

```typescript
// Restrict file types and sizes
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function validateUpload(file: UploadedFile) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new ValidationError('File type not allowed');
  }
  if (file.size > MAX_SIZE) {
    throw new ValidationError('File too large (max 5MB)');
  }
  // Don't trust the file extension — check magic bytes if critical
}
```

### 对派生路径的破坏性操作

一次 delete、move 或 overwrite，其安全性只取决于命名其目标的值的安全性。从 kernel、job payload 或兄弟服务读取这个值，只能证明它*从哪里来*，不能证明是谁*写入*的 —— 另一个进程的命令行和表单字段一样受攻击者控制。一个形状检查（"绝对路径、至少一层目录深"）只能证明格式良好，却常被误当成授权；清理脚本删掉根目录而不是叶子目录，就是这么发生的。

在发起破坏性调用之前，三个条件缺一不可：解析后的目标位于某个 **allowlisted root** 之下（在解析 symlink 之后比较，绝不在原始字符串上比较）；它至少在该 root 之下**一层**，因此 root 本身永远不会成为目标；并且它带有**属于你**的证据，这份证据要在操作*之前*、在任何会移除它的 teardown 之前读取 —— 否则"不存在"和"不是我的"无法区分。拒绝执行时，记下被拒绝的目标然后停止：一个回退到更宽默认路径的清理脚本，正是这套检查要防的事故。完整示例见 `../../../references/security-checklist.md#破坏性路径操作`。

有两个局限，因为这个检查看起来比实际更强。树内部的标记文件是自我声明 —— 任何能往那里写的东西都能写这个标记 —— 所以期望的 owner 必须来自已认证的状态，而且标记本身需要完整性保护（严格的 ownership 或一个 MAC）才算得上授权。另外，先解析路径再对*名字*执行操作，只要有一个不可信进程能换掉某个祖先目录，就存在 check/use race：在共享卷上，用文件 descriptor 持有目标，并使用不跟随 symlink、限定在 root 之下的操作，或者确保这段时间内目录层级不会变化。

## 依赖审计分诊

包管理器的 audit 报告的是已知 advisories；它既不证明一个包值得信任，也不证明易受攻击的代码是可达的。用这棵决策树：

```
The native package-manager audit reports a vulnerability
├── Severity: critical or high
│   ├── Is the vulnerable code reachable in runtime, build, test, or deployment paths?
│   │   ├── YES --> Fix immediately (update, patch, or replace the dependency)
│   │   └── NO (confirmed unused across those paths) --> Fix soon, but not a blocker
│   └── Is a fix available?
│       ├── YES --> Update to the patched version
│       └── NO --> Check for workarounds, consider replacing the dependency, or add to allowlist with a review date
├── Severity: moderate
│   ├── Reachable in production? --> Fix in the next release cycle
│   └── Dev-only? --> Fix when convenient, track in backlog
└── Severity: low
    └── Track and fix during regular dependency updates
```

**关键问题：**
- 易受攻击的那个函数在你的代码路径里真的被调用吗？
- 这个依赖是 runtime dependency 还是仅开发使用？
- 结合你的部署上下文，这个漏洞可被利用吗（例如一个仅客户端应用里的 server-side 漏洞）？

当你推迟一个修复时，记录原因并设定一个复查日期。

## 限流

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                   // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
}));

// Stricter limit for auth endpoints
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,  // 10 attempts per 15 minutes
}));
```

**一旦进程数超过一个，就用共享存储来计数。** `express-rate-limit` 默认把计数器放在进程内存里。在 load balancer 后面，每个实例各自计数，实际限额是 `max × instances`；在 serverless 或 edge 运行时，每次新调用都从零开始，所以上面那个 auth 限额可能永远不会触发。传入一个共享 `store`（通过 `rate-limit-redis` 用 Redis），或使用一个在不适合长连接 TCP 的地方也能工作的 HTTP-based limiter（例如 `@upstash/ratelimit`）：

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const authLimiter = new Ratelimit({
  redis: Redis.fromEnv(),                       // UPSTASH_REDIS_REST_URL + _TOKEN
  limiter: Ratelimit.slidingWindow(10, '15 m'), // 10 attempts per 15 minutes, across all instances
});
const { success } = await authLimiter.limit(`login:${req.ip}`);
if (!success) return res.status(429).end();
```

## Secrets 管理

```
.env files:
  ├── .env.example  → Committed (template with placeholder values)
  ├── .env          → NOT committed (contains real secrets)
  └── .env.local    → NOT committed (local overrides)

.gitignore must include:
  .env
  .env.local
  .env.*.local
  *.pem
  *.key
```

**提交前务必检查：**
```bash
# Check for accidentally staged secrets
git diff --cached | grep -i "password\|secret\|api_key\|token"
```

**如果一个 secret 已经被提交，立刻轮换它。** 删掉那一行或重写 history 都不够 —— 只要它到达过 remote 就当作已泄露。先吊销并重新签发 key，再从 history 中清除它。

## 数据分类

在添加字段时就对个人数据分类，这样日后的导出和删除请求才能找到它：

| 类别 | 示例 | 处理方式 |
|---|---|---|
| **非个人** | 聚合数据、匿名计数 | 常规处理 |
| **个人（PII）** | 姓名、邮箱、IP、设备/用户 ID | 最小化、访问控制、纳入导出/删除 |
| **敏感** | 健康、财务、位置、生物特征、政府 ID、任何关于未成年人的信息 | 收集需要额外依据、更严格的访问、通常需要加密 + 审计日志 |

## LLM 输出处理

```typescript
// BAD: trusting model output as a command or as markup
const sql = await llm.generate(`Write SQL for: ${userQuestion}`);
await db.query(sql);                                   // arbitrary query execution
container.innerHTML = await llm.reply(userMessage);   // stored XSS, via the model

// GOOD: model output is data — parse defensively, then validate, then encode
let intent;
try {
  intent = CommandSchema.parse(JSON.parse(await llm.replyJson(userMessage)));
} catch {
  throw new ValidationError('unexpected model output'); // JSON.parse or schema failed
}
await runAllowlistedAction(intent.action, intent.params);
container.textContent = await llm.reply(userMessage);
```
