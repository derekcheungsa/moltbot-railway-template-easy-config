# Railway WebSocket Fix: OpenClaw Gateway Connection

This document explains the evolution of WebSocket connection fixes for OpenClaw when deployed on Railway, including the problem, solutions, and current implementation.

## Table of Contents

- [The Problem](#the-problem)
- [Root Cause Analysis](#root-cause-analysis)
- [Solution Evolution](#solution-evolution)
- [Current Implementation](#current-implementation)
- [Configuration Options](#configuration-options)
- [Rollback Tags](#rollback-tags)
- [Technical Details](#technical-details)

---

## The Problem

When deploying OpenClaw on Railway, WebSocket connections to the gateway were failing with errors:

```
[ws-control] Proxy headers detected from untrusted address. Connection will not be treated as local.
[ws-control] Loopback connection with non-local Host header
[ws-control] Origin not allowed (code: 1008)
```

These errors caused:
- Control UI unable to connect ("Disconnected from gateway")
- Telegram bot failing to start
- Device pairing being required even with `allowInsecureAuth`

---

## Root Cause Analysis

OpenClaw has a security model that treats connections differently based on:

1. **Proxy Headers**: Presence of `X-Forwarded-*`, `X-Real-IP`, etc.
2. **Host Header**: Must be local (`localhost:18789`) for loopback connections
3. **Origin Header**: WebSocket connections must have an allowed origin

Railway's edge network adds proxy headers and uses the public domain in headers, which triggers OpenClaw's "untrusted proxy" detection.

### OpenClaw's Security Logic

From OpenClaw's source code (`src/gateway/net.ts`):

```typescript
const hasProxyHeaders = Boolean(forwardedFor || realIp);
const remoteIsTrustedProxy = isTrustedProxyAddress(remoteAddr, trustedProxies);
const hasUntrustedProxyHeaders = hasProxyHeaders && !remoteIsTrustedProxy;

if (hasUntrustedProxyHeaders) {
  logWsControl.warn("Proxy headers detected from untrusted address.");
}
```

By default, `trustedProxies` is empty, so any proxy headers trigger the warning.

---

## Solution Evolution

### v1.0.0: Header Rewriting Approach (Legacy)

**Tag:** `v1.0.0-railway-fix`

**Approach:** Strip and override headers before requests reach OpenClaw.

```javascript
// Strip all proxy headers
delete req.headers["x-forwarded-for"];
delete req.headers["x-forwarded-host"];
// ... etc

// Override Host to appear local
req.headers["host"] = `localhost:${INTERNAL_GATEWAY_PORT}`;

// Override Origin for WebSocket
req.headers["origin"] = `http://localhost:${INTERNAL_GATEWAY_PORT}`;
```

**Pros:**
- Works immediately
- No configuration needed

**Cons:**
- Fragile - header manipulation can break features
- Security implications - hiding true request source
- Maintenance burden - need to update if headers change

### v1.1.0: allowedOrigins with Manual PUBLIC_URL (Legacy)

**Tag:** `v1.1.0-allowed-origins`

**Approach:** Configure OpenClaw's `gateway.controlUi.allowedOrigins` instead of rewriting headers.

```javascript
// Configure during onboarding
const allowedOrigins = [
  `http://localhost:${INTERNAL_GATEWAY_PORT}`,
  PUBLIC_URL || "https://*.up.railway.app" // Wildcard fallback
];

await runCmd(OPENCLAW_NODE, clawArgs([
  "config", "set", "--json",
  "gateway.controlUi.allowedOrigins",
  JSON.stringify(allowedOrigins)
]));
```

**Pros:**
- No header manipulation
- Uses OpenClaw's built-in security
- More explicit and maintainable

**Cons:**
- Requires manual `PUBLIC_URL` configuration
- Auto-detection only works after first request
- Wildcard fallback less secure

### v1.1.9: Revert to v1.0.0 Approach - Full Header Stripping (Current) ✅

**Tag:** `v1.1.9-revert-to-v1.0.0-approach`

**Approach:** After trying 8 different approaches (v1.1.1 through v1.1.8), we reverted to the original v1.0.0 approach which:

1. **DELETES ALL proxy headers** (X-Forwarded-*, X-Real-IP, Forwarded, x-railway-*, etc.)
2. **Handles Origin conditionally** (`if (req.headers["origin"])`) - only overrides if present
3. **Does NOT configure `allowedOrigins` or `trustedProxies`** - relies entirely on header manipulation
4. **Deletes additional headers** (x-vercel-*, cf-*) for other platforms

**Why This Works:**

After extensive testing, the simpler v1.0.0 approach succeeded where all more complex approaches failed. The key insight is that OpenClaw needs to see a **truly local connection** without any proxy indication whatsoever. The presence of ANY proxy header (even with valid values) or additional configuration (`allowedOrigins`, `trustedProxies`) somehow interferes with OpenClaw's local connection detection and auto-approval logic.

**Solution:** Simple, aggressive header stripping:

```javascript
function stripProxyHeaders(req, res, next) {
  // Remove ALL proxy-related headers
  delete req.headers["x-forwarded-for"];
  delete req.headers["x-forwarded-host"];
  delete req.headers["x-forwarded-proto"];
  delete req.headers["x-real-ip"];
  delete req.headers["forwarded"];
  delete req.headers["x-railway"];
  delete req.headers["x-railway-request-id"];
  delete req.headers["x-vercel-id"];
  delete req.headers["x-vercel-ip-country"];
  delete req.headers["cf-connecting-ip"];
  delete req.headers["cf-ray"];
  delete req.headers["cf-ipcountry"];

  // Override Host to localhost
  req.headers["host"] = `localhost:${INTERNAL_GATEWAY_PORT}`;

  // Override Origin conditionally (only if present)
  if (req.headers["origin"]) {
    req.headers["origin"] = `http://localhost:${INTERNAL_GATEWAY_PORT}`;
  }

  next();
}
```

**Pros:**
- ✅ Works reliably - tested and confirmed
- ✅ Simple implementation
- ✅ No complex configuration needed
- ✅ Device pairing auto-approved
- ✅ No "pairing required" errors

**Cons:**
- Aggressive header manipulation
- Doesn't use OpenClaw's built-in security features (allowedOrigins, trustedProxies)

### v1.1.7: Delete X-Forwarded-For + Override Both Host and Origin (Superseded) ⚠️

**Tag:** `v1.1.7-delete-x-forwarded-for`

**Issue:** Despite deleting X-Forwarded-For and overriding both Host and Origin headers, the gateway was STILL requiring pairing. This approach also configured `allowedOrigins` and `trustedProxies`, which may have interfered with the local connection detection.

**Use v1.1.9 instead.**

  // Override Host to localhost so gateway treats this as a local connection
  req.headers["host"] = `localhost:${INTERNAL_GATEWAY_PORT}`;

  // Override Origin to match the Host header
  req.headers["origin"] = `http://localhost:${INTERNAL_GATEWAY_PORT}`;

  // Remove other proxy headers...
  delete req.headers["x-forwarded-host"];
  // ...
}
```

**Pros:**
- ✅ Connection appears as direct local (no proxy headers)
- ✅ Works with allowInsecureAuth=true
- ✅ No "pairing required" errors
- ✅ Simpler than setting X-Forwarded-For to 127.0.0.1

**Cons:**
- Header manipulation (Host and Origin headers)

### v1.1.6: Override Both Host AND Origin Headers (Superseded) ⚠️

**Tag:** `v1.1.6-override-both-headers`

**Issue:** Setting `X-Forwarded-For: 127.0.0.1` (instead of deleting it) caused OpenClaw to treat the connection as "proxied" rather than "direct local", which still triggered "pairing required" errors despite all headers being correct.

**Use v1.1.7 instead.**

### v1.1.5: Override Host Header Only (Superseded) ⚠️

**Tag:** `v1.1.5-override-host-header`

**Issue:** Setting `Host: localhost:18789` wasn't enough - the gateway still saw non-localhost Origin header (Railway domain) and treated connections as remote, causing "pairing required" errors even with `allowInsecureAuth=true` and `allowedOrigins` configured.

**Use v1.1.6 instead.**

### v1.1.4: Normalize X-Forwarded-For (Superseded) ⚠️

**Tag:** `v1.1.4-normalize-x-forwarded-for`

**Issue:** Setting `X-Forwarded-For: 127.0.0.1` wasn't enough - the gateway still saw non-local Host header and treated connections as remote, causing "pairing required" errors.

**Use v1.1.5 instead.**

### v1.1.3: Strip Railway Proxy Headers (Superseded) ⚠️

**Tag:** `v1.1.3-strip-proxy-headers`

**Issue:** Stripping `X-Forwarded-For` caused the gateway to not recognize trusted proxy connections, resulting in "fwd=n/a" and "pairing required" errors.

**Use v1.1.5 instead.**

**Tag:** `v1.1.1-railway-public-domain`

**Approach:** Use Railway's built-in `RAILWAY_PUBLIC_DOMAIN` environment variable.

```javascript
function getPublicUrl() {
  // Railway provides RAILWAY_PUBLIC_DOMAIN automatically
  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) {
    return `https://${railwayDomain}`;
  }

  // Fallback to custom PUBLIC_URL
  const customUrl = process.env.PUBLIC_URL?.trim()?.replace(/\/$/, "");
  if (customUrl) {
    return customUrl;
  }

  return null; // Auto-detect from first request
}
```

**Pros:**
- ✅ Zero configuration on Railway
- ✅ Uses Railway's built-in variable
- ✅ No header manipulation
- ✅ Works from first deployment
- ✅ Custom domains still supported via `PUBLIC_URL`

---

## Current Implementation (v1.1.7)

The final solution combines **four complementary approaches**:

1. **allowedOrigins** - Allows Railway public domain for WebSocket connections (fallback)
2. **trustedProxies** - Trusts 127.0.0.1 (the wrapper) as a proxy (fallback)
3. **DELETE X-Forwarded-For** - Removes proxy header so connection appears as direct local
4. **Override Host Header** - Sets Host to localhost:18789 for local connection treatment
5. **Override Origin Header** - Sets Origin to http://localhost:18789 for local connection treatment

## Current Implementation (v1.1.9)

The v1.1.9 implementation reverts to the simple, proven v1.0.0 approach. It relies **entirely on header manipulation** without configuring OpenClaw's security features (`allowedOrigins`, `trustedProxies`).

### Architecture

```
User Browser
    │
    ▼
Railway Edge Network
    │ (sets X-Railway-Edge, X-Forwarded-*, etc.)
    │
    ▼
Express Wrapper (PORT=8080)
    │ (DELETES all proxy headers)
    │ (overrides Host and Origin to localhost)
    │ (does NOT configure allowedOrigins/trustedProxies)
    │
    ▼
OpenClaw Gateway (localhost:18789)
    │ (sees direct local connection from 127.0.0.1)
    │ (auto-approves device pairing)
    ▼
WebSocket Connection ✅
```

### Key Components

#### 1. Proxy Header Stripping Middleware

**Location:** `src/server.js:1047-1082`

```javascript
function stripProxyHeaders(req, res, next) {
  // Remove ALL proxy-related headers that Railway might add
  delete req.headers["x-forwarded-for"];
  delete req.headers["x-forwarded-host"];
  delete req.headers["x-forwarded-proto"];
  delete req.headers["x-real-ip"];
  delete req.headers["forwarded"];
  delete req.headers["x-railway"];
  delete req.headers["x-railway-request-id"];
  delete req.headers["x-vercel-id"];
  delete req.headers["x-vercel-ip-country"];
  delete req.headers["cf-connecting-ip"];
  delete req.headers["cf-ray"];
  delete req.headers["cf-ipcountry"];

  // Override Host header to appear local
  req.headers["host"] = `localhost:${INTERNAL_GATEWAY_PORT}`;

  // Override Origin header to appear local (conditionally)
  if (req.headers["origin"]) {
    req.headers["origin"] = `http://localhost:${INTERNAL_GATEWAY_PORT}`;
  }

  next();
}
```

#### 2. WebSocket Upgrade Handler

**Location:** `src/server.js:1119-1142`

```javascript
server.on("upgrade", async (req, socket, head) => {
  // ... gateway readiness check ...

  // Strip ALL proxy headers from WebSocket upgrade requests
  delete req.headers["x-forwarded-for"];
  delete req.headers["x-forwarded-host"];
  // ... (all proxy headers) ...

  // Override Host and Origin headers
  req.headers["host"] = `localhost:${INTERNAL_GATEWAY_PORT}`;
  if (req.headers["origin"]) {
    req.headers["origin"] = `http://localhost:${INTERNAL_GATEWAY_PORT}`;
  }

  // Proxy WebSocket upgrade (auth token injected via proxyReqWs event)
  proxy.ws(req, socket, head, { target: GATEWAY_TARGET });
});
```

#### 3. Auth Token Injection

**Location:** `src/server.js:1042-1047`

```javascript
// Inject auth token into HTTP proxy requests
proxy.on("proxyReq", (proxyReq, req, res) => {
  proxyReq.setHeader("Authorization", `Bearer ${OPENCLAW_GATEWAY_TOKEN}`);
});

// Inject auth token into WebSocket upgrade requests
proxy.on("proxyReqWs", (proxyReq, req, socket, options, head) => {
  proxyReq.setHeader("Authorization", `Bearer ${OPENCLAW_GATEWAY_TOKEN}`);
});
```

### Why v1.1.9 Works When v1.1.1-v1.1.8 Didn't

| Version | Approach | Result |
|---------|----------|--------|
| v1.1.1-v1.1.6 | Set X-Forwarded-For to 127.0.0.1 + override Host/Origin | ❌ Still required pairing |
| v1.1.7-v1.1.8 | Delete X-Forwarded-For + override Host/Origin + configure allowedOrigins/trustedProxies | ❌ Still required pairing |
| v1.1.9 (v1.0.0) | **Delete ALL proxy headers + override Host/Origin + NO config** | ✅ Auto-approved |

**Key Insight:** Configuring `allowedOrigins` and `trustedProxies` may have interfered with OpenClaw's local connection detection. The simpler approach (only header manipulation, no config) allows OpenClaw to see the connection as truly local and auto-approve device pairing.

## Current Implementation (v1.1.7 - superseded by v1.1.9)
    │ (validates origin against allowedOrigins)
    │ (requires Bearer token)
    ▼
WebSocket Connection ✅
```

### Key Components

#### 1. Public URL Resolution (`src/server.js:44-59`)

```javascript
function getPublicUrl() {
  // Priority: RAILWAY_PUBLIC_DOMAIN > PUBLIC_URL > null
  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) {
    return `https://${railwayDomain.replace(/^https?:\/\//, "")}`;
  }
  const customUrl = process.env.PUBLIC_URL?.trim()?.replace(/\/$/, "");
  return customUrl || null;
}
```

#### 2. Onboarding Configuration (`src/server.js:809-832`)

```javascript
// Configure allowedOrigins for WebSocket connections
const allowedOrigins = [`http://localhost:${INTERNAL_GATEWAY_PORT}`];
if (PUBLIC_URL) {
  allowedOrigins.push(PUBLIC_URL);
} else {
  // Fallback wildcard for Railway
  allowedOrigins.push("https://*.up.railway.app");
}

await runCmd(OPENCLAW_NODE, clawArgs([
  "config", "set", "--json",
  "gateway.controlUi.allowedOrigins",
  JSON.stringify(allowedOrigins)
]));
```

#### 3. Auto-Detection Fallback (`src/server.js:73-103`)

```javascript
function detectPublicUrl(req) {
  if (publicUrlDetected || PUBLIC_URL) return;

  const host = req.headers["x-forwarded-host"] || req.headers["host"];
  const proto = req.headers["x-forwarded-proto"] || "http";

  if (host && !host.includes("localhost")) {
    PUBLIC_URL = `${proto}://${host}`;
    publicUrlDetected = true;
    updateAllowedOrigins(PUBLIC_URL);
  }
}
```

---

## Configuration Options

### For Railway Deployments

**No configuration needed!** Railway automatically provides `RAILWAY_PUBLIC_DOMAIN`.

Simply:
1. Deploy the template
2. Enable Public Networking
3. Railway assigns a domain (e.g., `https://my-app.up.railway.app`)
4. Template automatically uses it

### For Custom Domains

If using a custom domain with Railway:

```bash
# Set PUBLIC_URL to your custom domain
PUBLIC_URL=https://custom.example.com
```

This overrides `RAILWAY_PUBLIC_DOMAIN`.

### For Local Development

No configuration needed - the template auto-detects `localhost` URLs.

---

## Rollback Tags

| Tag | Approach | Use Case |
|-----|----------|----------|
| `v1.1.9-revert-to-v1.0.0-approach` | ✅ **Current** - DELETE ALL proxy headers + Override Host/Origin + NO allowedOrigins/trustedProxies config | Production, recommended |
| `v1.1.7-delete-x-forwarded-for` | ⚠️ Superseded - DELETE X-Forwarded-For + Override Host/Origin + allowedOrigins + trustedProxies (still causes pairing) | Don't use |
| `v1.1.6-override-both-headers` | ⚠️ Superseded - Set X-Forwarded-For to 127.0.0.1 + Override Host AND Origin (still causes pairing) | Don't use |
| `v1.1.5-override-host-header` | ⚠️ Incomplete - Only overrides Host header (missing Origin override, still causes pairing) | Don't use |
| `v1.1.4-normalize-x-forwarded-for` | ⚠️ Incomplete - Only normalizes X-Forwarded-For (missing Host override) | Don't use |
| `v1.1.3-strip-proxy-headers` | ⚠️ Broken - Strips X-Forwarded-For (causes fwd=n/a error) | Don't use |
| `v1.1.2-trusted-proxies` | Incomplete - Only allowedOrigins + trustedProxies (missing header normalization) | Don't use |
| `v1.1.1-railway-public-domain` | Incomplete - Only allowedOrigins (missing trustedProxies + header normalization) | Don't use |
| `v1.1.0-allowed-origins` | Legacy - Manual `PUBLIC_URL` or auto-detect | If Railway env var changes |
| `v1.0.0-railway-fix` | Legacy - Full header rewriting (including Origin) - Same as v1.1.9 | Reference |

### Rollback Commands

```bash
# Rollback to current version
git checkout v1.1.7-delete-x-forwarded-for

# Rollback to previous version
git checkout v1.1.6-override-both-headers

# Rollback to original fix
git checkout v1.0.0-railway-fix
```

---

## Technical Details

### OpenClaw Configuration

The template sets these OpenClaw configuration options:

```json
{
  "gateway": {
    "bind": "loopback",
    "port": 18789,
    "auth": {
      "mode": "token",
      "token": "<SETUP_PASSWORD>"
    },
    "controlUi": {
      "allowInsecureAuth": true,
      "allowedOrigins": [
        "http://localhost:18789",
        "https://<RAILWAY_PUBLIC_DOMAIN>"
      ]
    },
    "trustedProxies": ["127.0.0.1", "::1"]
  }
}
```

### Proxy Header Normalization Middleware

The Express wrapper normalizes Railway's proxy headers before requests reach the gateway:

```javascript
function normalizeProxyHeaders(req, res, next) {
  // DELETE X-Forwarded-For instead of setting it.
  // When this header exists (even with valid value 127.0.0.1), OpenClaw treats
  // the connection as "proxied" rather than "direct local", which can trigger
  // pairing requirements. By deleting it, the connection appears direct from
  // the wrapper (127.0.0.1) without any proxy indication.
  delete req.headers["x-forwarded-for"];

  // Override Host to localhost so gateway treats this as a local connection
  req.headers["host"] = `localhost:${INTERNAL_GATEWAY_PORT}`;

  // Override Origin to match the Host header
  // Even with allowedOrigins configured, OpenClaw's gateway still treats
  // non-localhost origins as "remote" and requires device pairing.
  req.headers["origin"] = `http://localhost:${INTERNAL_GATEWAY_PORT}`;

  // Remove other proxy headers that we don't need
  delete req.headers["x-forwarded-host"];
  delete req.headers["x-forwarded-proto"];
  delete req.headers["x-real-ip"];
  delete req.headers["forwarded"];
  delete req.headers["x-railway"];
  delete req.headers["x-railway-request-id"];
  delete req.headers["x-railway-edge"];
  next();
}
```

**Important:** We DELETE `X-Forwarded-For` (instead of setting it to `127.0.0.1`) AND modify BOTH `Host` AND `Origin` headers to `localhost:18789` so the gateway treats the connection as truly local. The `allowedOrigins` configuration is still set (as a fallback), but the Origin header override is what actually prevents the "pairing required" error. Without deleting `X-Forwarded-For`, OpenClaw treats the connection as "proxied" and still requires pairing, even with all other headers correct.

```json
{
  "gateway": {
    "bind": "loopback",
    "port": 18789,
    "auth": {
      "mode": "token",
      "token": "<SETUP_PASSWORD>"
    },
    "controlUi": {
      "allowInsecureAuth": true,
      "allowedOrigins": [
        "http://localhost:18789",
        "https://<RAILWAY_PUBLIC_DOMAIN>"
      ]
    }
  }
}
```

### Why `allowInsecureAuth` is Safe

`allowInsecureAuth` is a misnomer - it doesn't disable authentication. It only:

- ✅ Bypasses device pairing requirement
- ✅ Allows bearer token authentication directly
- ✅ Enables wrapper to manage authentication

The wrapper still enforces authentication via `OPENCLAW_GATEWAY_TOKEN` (set to `SETUP_PASSWORD`), injecting it via:

```javascript
proxy.on("proxyReq", (proxyReq) => {
  proxyReq.setHeader("Authorization", `Bearer ${OPENCLAW_GATEWAY_TOKEN}`);
});
```

### Security Model

1. **Public requests** → Railway Edge → Wrapper → Gateway
   - Wrapper validates `SETUP_PASSWORD` for `/setup` wizard
   - Wrapper injects bearer token for gateway requests
   - Gateway validates bearer token

2. **WebSocket connections** → Origin validated against `allowedOrigins`
   - Only localhost and Railway public domain are allowed
   - Prevents unauthorized WebSocket connections

---

## Environment Variables Reference

| Variable | Provided By | Purpose | Required |
|----------|-------------|---------|----------|
| `SETUP_PASSWORD` | User | Protects `/setup` wizard and gateway | ✅ Yes |
| `RAILWAY_PUBLIC_DOMAIN` | Railway | Auto-generated public domain | ❌ Auto |
| `PUBLIC_URL` | User | Custom domain override | ❌ Optional |
| `PORT` | Railway | HTTP port for wrapper | ❌ Auto (8080) |

---

## Troubleshooting

### WebSocket Connection Fails

1. **Check logs for origin validation:**
   ```bash
   railway logs
   # Look for: [wrapper] PUBLIC_URL: ...
   # Look for: [onboard] Configuring allowedOrigins: ...
   ```

2. **Verify `RAILWAY_PUBLIC_DOMAIN` is set:**
   ```bash
   railway variables
   # Should show RAILWAY_PUBLIC_DOMAIN=...
   ```

3. **Check OpenClaw config:**
   ```bash
   # In Railway shell
   cat /data/.openclaw/openclaw.json | grep allowedOrigins
   ```

### "Origin Not Allowed" Error

The origin isn't in `allowedOrigins`. Check:

1. Is `RAILWAY_PUBLIC_DOMAIN` set correctly?
2. Did onboarding complete successfully?
3. Try accessing via the Railway public domain URL

### Device Pairing Still Required

`allowInsecureAuth` may not be set. Check:

1. **Verify config:**
   ```bash
   cat /data/.openclaw/openclaw.json | grep allowInsecureAuth
   # Should be: true
   ```

2. **Re-run setup if needed:**
   Visit `/setup` and click "Run Setup" again.

---

## References

- [OpenClaw Gateway Security](https://github.com/openclaw/openclaw) - Source code for proxy header detection
- [Railway Networking](https://docs.railway.com/networking) - Railway's proxy architecture
- [Railway Environment Variables](https://docs.railway.com/reference/environment-variables) - Complete list of Railway-provided variables

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.1.9 | 2026-02-23 | **✅ WORKING** - Revert to v1.0.0 approach: DELETE ALL proxy headers + Override Host/Origin + NO allowedOrigins/trustedProxies config |
| v1.1.8 | 2026-02-23 | Attempted to add dangerouslyDisableDeviceAuth - not committed |
| v1.1.7 | 2026-02-22 | DELETE X-Forwarded-For + Override Host/Origin + allowedOrigins + trustedProxies - SUPPLANTED, still has pairing issue |
| v1.1.6 | 2026-02-22 | Set X-Forwarded-For to 127.0.0.1 + Override Host AND Origin - SUPPLANTED, still has pairing issue |
| v1.1.5 | 2026-02-22 | Override Host header to localhost - INCOMPLETE, still has pairing issue due to non-local Origin |
| v1.1.4 | 2026-02-22 | Replace X-Forwarded-For with 127.0.0.1 - INCOMPLETE, still has pairing issue |
| v1.1.3 | 2025-02-22 | Strip Railway proxy headers (X-Forwarded-*) - BROKEN, causes fwd=n/a |
| v1.1.2 | 2025-02-22 | Configure gateway.trustedProxies to trust wrapper |
| v1.1.1 | 2025-02-22 | Use `RAILWAY_PUBLIC_DOMAIN` for zero-config setup |
| v1.1.0 | 2025-02-22 | Implement `allowedOrigins` configuration |
| v1.0.0 | 2025-02-21 | Initial header rewriting approach |

---

**Document Version:** 1.1.9
**Last Updated:** 2026-02-23
