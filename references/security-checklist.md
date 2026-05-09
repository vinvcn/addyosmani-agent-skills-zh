# 安全检查清单

Web 应用安全的快速参考。配合 `security-and-hardening` skill 使用。

## 目录

- [提交前检查](#提交前检查)
- [身份认证](#身份认证)
- [授权](#授权)
- [输入验证](#输入验证)
- [安全响应头](#安全响应头)
- [CORS 配置](#cors-配置)
- [数据保护](#数据保护)
- [依赖安全](#依赖安全)
- [错误处理](#错误处理)
- [OWASP Top 10 快速参考](#owasp-top-10-快速参考)

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

```bash
# Audit dependencies
npm audit

# Fix automatically where possible
npm audit fix

# Check for critical vulnerabilities
npm audit --audit-level=critical

# Keep dependencies updated
npx npm-check-updates
```

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
| 6 | Vulnerable Components | `npm audit`，保持 deps 更新，最小化 deps |
| 7 | Auth Failures | 强密码、rate limiting、session management |
| 8 | Data Integrity Failures | 验证更新/依赖，signed artifacts |
| 9 | Logging Failures | 记录安全事件，不记录 secrets |
| 10 | SSRF | 验证/allowlist URLs，限制 outbound requests |
