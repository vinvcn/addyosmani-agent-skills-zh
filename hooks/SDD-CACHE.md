# sdd-cache hook

[`source-driven-development`](../skills/source-driven-development/SKILL.md) 的跨 session citation cache。它会跳过重复的 `WebFetch` 调用，同时不削弱该 skill “基于当前文档验证”的保证。

## 为什么

`source-driven-development` 会为每个框架相关决策获取官方文档。跨 sessions 处理同一个项目时，意味着会反复获取相同页面。把内容缓存成本地 memory 会违背该 skill 的要求：文档会变化，而过期 cache 会掩盖这一点。

这个 hook 会将获取到的内容缓存到磁盘，但每次复用时都会通过 HTTP `If-None-Match` / `If-Modified-Since` **向源站重新验证**。只有当服务器返回 `304 Not Modified` 时，才会从 cache 提供内容；这是一种 fresh verification，而不是读取 memory。

## 设置

1. 将 hooks 添加到 `.claude/settings.json`（个人使用可放在 `.claude/settings.local.json`）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "WebFetch",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PROJECT_DIR}/hooks/sdd-cache-pre.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "WebFetch",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PROJECT_DIR}/hooks/sdd-cache-post.sh",
            "async": true,
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

   `${CLAUDE_PROJECT_DIR}` 会解析为你启动 Claude Code 的目录。当 hooks 位于同一项目内时，上面的片段可以直接使用。如果你将 `agent-skills` 安装在其他位置（例如作为 `~/agent-skills` 下的共享 plugin），请将 `${CLAUDE_PROJECT_DIR}/hooks/...` 替换为每个脚本的绝对路径。

2. 确保 `.claude/sdd-cache/` 已写入 `.gitignore`（本仓库已包含）。

3. 像往常一样使用 `/source-driven-development`（或该 skill）。不需要修改 skill 或 agent workflow；cache 是透明的。

## 心智模型

这是一个以 URL 为 key 的 HTTP resource cache。新鲜度通过 `ETag` / `Last-Modified` 委托给源站判断；没有 TTL，也不会把 prompt 放进 key。

存储的 body 不是原始 HTML。`WebFetch` 会使用调用方的 prompt 经由模型后处理每个响应，因此我们缓存的是某个 agent 对页面的解读。key 保持 URL-only，以便跨 sessions 复用读取结果；原始 prompt 会作为 metadata 保存，并在 hit message 中显示，让下一个 agent 判断之前的解读是否适用。

## 工作方式

每个 URL 对应一个 cache entry，以 JSON 存储在 `.claude/sdd-cache/<sha>.json`：

| Event | Action |
|---|---|
| `PreToolUse WebFetch` | 如果 entry 存在，则带上 `If-None-Match` / `If-Modified-Since` 发送 `HEAD` 请求。若返回 `304`，阻止 fetch，并通过 stderr 将 cached content 返回给 agent，同时把原始 prompt 作为 metadata 显示。否则允许 fetch。 |
| `PostToolUse WebFetch` | 捕获响应，发送 `HEAD` 请求记录当前 `ETag` / `Last-Modified`，并存储 `{url, prompt, etag, last_modified, content, fetched_at}`。 |

**新鲜度规则：**

- 只有当源站确认 `304 Not Modified` 时，entry 才会被提供。
- 没有 `ETag` 或 `Last-Modified` header 的 entries 永不缓存；没有 validator，hook 后续无法验证新鲜度，缓存就等同于相信 memory。
- Cache key 是 `sha256(url)`。同一个 URL 即使用不同 prompt 请求，也会命中同一个 entry；cached body 反映首次 fetch 使用的 prompt，该 prompt 会随 hit 一起显示，让 agent 决定是复用还是手动重新 fetch。

**Agent 会看到什么：**

- Cache hit：`WebFetch` 会通过 exit code 2 被阻止。Claude Code 会把 hook 的 stderr payload 作为 tool error 交回给 agent；这是 cache hit 的预期信号，不是失败。payload 以 `[sdd-cache] Cache hit for <url>` 为前缀，并用 `----- BEGIN CACHED CONTENT -----` / `----- END CACHED CONTENT -----` markers 包裹 cached body，让 agent 可以像刚收到 `WebFetch` 返回一样使用它。
- Cache miss 或 stale：`WebFetch` 正常运行；结果会存储起来供下次使用。

Skill 本身不变。它继续遵循 `DETECT → FETCH → IMPLEMENT → CITE`。hook 只改变 `FETCH` 运行时底层发生的事情。

## 本地测试

### 1. 直接对脚本做 smoke test

```bash
# Simulate a PostToolUse payload: cache a page
echo '{
  "tool_input": {
    "url": "https://react.dev/reference/react/useActionState",
    "prompt": "extract the signature"
  },
  "tool_response": "useActionState(action, initialState) returns [state, formAction, isPending]"
}' | bash hooks/sdd-cache-post.sh

# Inspect the stored entry
ls .claude/sdd-cache/
cat .claude/sdd-cache/*.json | jq .

# Simulate the next PreToolUse on the same URL + prompt
echo '{
  "tool_input": {
    "url": "https://react.dev/reference/react/useActionState",
    "prompt": "extract the signature"
  }
}' | bash hooks/sdd-cache-pre.sh
echo "exit=$?"
```

预期：

- 第一个命令会在 `.claude/sdd-cache/` 下创建一个文件（仅当服务器返回 `ETag` 或 `Last-Modified` 时）。
- 当源站回复 `304` 时，第二个命令会以 `2` 退出，并在 stderr 输出 cached content；否则会静默以 `0` 退出。

### 2. 在真实 session 中做 end-to-end 验证

1. 按上文所示在 `.claude/settings.local.json` 中注册 hooks。
2. 在本仓库中启动 Claude Code session。
3. 要求 agent 获取一个文档页面（例如 "fetch `https://react.dev/reference/react/useActionState` and summarize"）。
4. 验证 `.claude/sdd-cache/` 下出现文件。
5. 再次要求 agent 用相同 prompt 获取同一页面。
6. 验证第二次 `WebFetch` 被阻止，并返回 cached content（在 session transcript 中表现为带 `[sdd-cache]` 前缀的 tool error）。

### 3. 新鲜度验证

要确认文档变化时 cache 会失效，可以强制制造 `ETag` mismatch。选择一个具体 entry；一旦 cache 里有多个文件，`*.json` 就不安全：

```bash
# Pick the entry you want to corrupt (swap in the actual filename)
ENTRY=.claude/sdd-cache/e49c9f378670cfbb1d7d871b6dee16d9.json

# Patch its ETag to something the origin will not recognize
jq '.etag = "W/\"stale-etag-forced\""' "$ENTRY" > "$ENTRY.tmp" && mv "$ENTRY.tmp" "$ENTRY"

# Next PreToolUse should miss (server returns 200, not 304)
echo '{"tool_input":{"url":"...", "prompt":"..."}}' | bash hooks/sdd-cache-pre.sh
echo "exit=$?"   # expect 0 (fetch allowed through)
```

### 4. Debugging

开启 debug mode 时，两个 hooks 都会把带时间戳的事件写入 `.claude/sdd-cache/.debug.log`。用以下任一方式启用：

```bash
# Option A: env var (per-session)
SDD_CACHE_DEBUG=1 claude

# Option B: sentinel file (persistent)
mkdir -p .claude/sdd-cache && touch .claude/sdd-cache/.debug
# …disable with: rm .claude/sdd-cache/.debug
```

日志会记录 URL、检测到的 `tool_response` shape、HEAD status，以及每次调用 hit 或 miss 的原因。当 cache miss 看起来异常时很有用（通常原因是源站停止发送 validators）。

## 已知限制

- **Body 受 prompt 影响。** Hit 返回的是先前 agent 对页面的解读，并会显示原始 prompt，让当前 agent 判断是否适用。如果不适用，删除 `.claude/sdd-cache/` 下的文件以强制重新 fetch。
- **每次 cache write 都需要额外一次 HEAD。** Claude Code 不会暴露 `WebFetch` 已收到的 response headers，因此 post hook 会重新查询源站以捕获 `ETag` / `Last-Modified`。每次 miss 多一次 roundtrip；这是保持纯 hook、无需修改 core 的代价。
- **没有 `ETag` 或 `Last-Modified` 的服务器永不缓存。** 大多数官方文档站点（react.dev、docs.djangoproject.com、developer.mozilla.org）都会发出 validators。没有 validators 的站点会始终重新 fetch。
- **行为异常的服务器可能返回错误的 `304`。** 这是需要诊断的服务器 bug，不是 cache invariant 需要防御的问题；我们不会用 TTL 掩盖它。如果发现 stale entry，请删除该 entry。
- **Cache 是本地且按项目隔离的。** 没有团队级共享 cache。要添加这种能力，需要 signed-content-addressable storage layer，超出当前范围。

## 要求

- `jq`
- `curl`
- `shasum` or `sha256sum` (auto-detected)
- Bash 3.2+
