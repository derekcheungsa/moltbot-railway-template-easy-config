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

### v1.1.4: Normalize X-Forwarded-For (Current) ✅

**Tag:** `v1.1.4-normalize-x-forwarded-for`

**Approach:** Replace Railway's `X-Forwarded-For` header with `127.0.0.1` (the wrapper's IP) instead of stripping it.

**Why This Was Needed:**

OpenClaw's gateway REQUIRES the `X-Forwarded-For` header to detect trusted proxy connections. The v1.1.3 approach of stripping the header caused:

```
[ws] Loopback connection with non-local Host header. Treating it as remote.
If you're behind a reverse proxy, set gateway.trustedProxies and forward X-Forwarded-For/X-Real-IP.
fwd=n/a  ← X-Forwarded-For is missing!
```

Railway adds:
```
X-Forwarded-For: 99.229.22.196, 157.52.64.23  ← Real client IPs (not trusted)
```

The gateway sees:
- Connection from: `127.0.0.1` (wrapper) ✓ trusted
- But `X-Forwarded-For` contains: `99.229.22.196` ✗ NOT trusted

**Solution:** Replace `X-Forwarded-For` with `127.0.0.1` so the gateway recognizes it as a trusted proxy:

```javascript
function normalizeProxyHeaders(req, res, next) {
  // Replace X-Forwarded-For with the wrapper's IP (127.0.0.1)
  // This allows the gateway to recognize it as a trusted proxy connection
  req.headers["x-forwarded-for"] = "127.0.0.1";

  // Remove other proxy headers that we don't need
  delete req.headers["x-forwarded-host"];
  delete req.headers["x-forwarded-proto"];
  delete req.headers["x-real-ip"];
  delete req.headers["forwarded"];
  delete req.headers["x-railway"];
  delete req.headers["x-railway-request-id"];
  delete req.headers["x-railway-edge"];
  // Don't modify Host/Origin - handled by allowedOrigins
  next();
}
```

**Pros:**
- ✅ Gateway recognizes the connection as from a trusted proxy
- ✅ No "pairing required" errors (allowInsecureAuth works)
- ✅ Works with allowedOrigins for origin validation
- ✅ No Host/Origin header manipulation (security best practice)

**Cons:**
- Header manipulation (but only proxy headers, not Host/Origin)

### v1.1.3: Strip Railway Proxy Headers (Superseded) ⚠️

**Tag:** `v1.1.3-strip-proxy-headers`

**Issue:** Stripping `X-Forwarded-For` caused the gateway to not recognize trusted proxy connections, resulting in "fwd=n/a" and "pairing required" errors.

**Use v1.1.4 instead.**

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

## Current Implementation (v1.1.4)

The final solution combines **three complementary approaches**:

1. **allowedOrigins** - Allows Railway public domain for WebSocket connections
2. **trustedProxies** - Trusts 127.0.0.1 (the wrapper) as a proxy
3. **Normalize X-Forwarded-For** - Replaces Railway's proxy header with 127.0.0.1

### Why All Three Are Needed

| Component | Purpose | What Happens Without It |
|-----------|---------|-------------------------|
| `allowedOrigins` | Validate WebSocket origin | "Origin not allowed" (code 1008) |
| `trustedProxies` | Trust 127.0.0.1 as proxy | "Proxy headers detected from untrusted address" |
| `Normalize X-Forwarded-For` | Replace with 127.0.0.1 | Gateway sees fwd=n/a, treats connection as remote |

## Current Implementation (v1.1.3 - superseded by v1.1.4)

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
    │ (uses RAILWAY_PUBLIC_DOMAIN)
    │ (sets allowedOrigins in OpenClaw config)
    │
    ▼
OpenClaw Gateway (localhost:18789)
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
| `v1.1.4-normalize-x-forwarded-for` | ✅ **Current** - Replace X-Forwarded-For with 127.0.0.1 + allowedOrigins + trustedProxies | Production, recommended |
| `v1.1.3-strip-proxy-headers` | ⚠️ Broken - Strips X-Forwarded-For (causes fwd=n/a error) | Don't use |
| `v1.1.2-trusted-proxies` | Incomplete - Only allowedOrigins + trustedProxies (missing header normalization) | Don't use |
| `v1.1.1-railway-public-domain` | Incomplete - Only allowedOrigins (missing trustedProxies + header normalization) | Don't use |
| `v1.1.0-allowed-origins` | Legacy - Manual `PUBLIC_URL` or auto-detect | If Railway env var changes |
| `v1.0.0-railway-fix` | Legacy - Full header rewriting | Last resort fallback |

### Rollback Commands

```bash
# Rollback to current version
git checkout v1.1.1-railway-public-domain

# Rollback to previous version
git checkout v1.1.0-allowed-origins

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
  // Replace X-Forwarded-For with the wrapper's IP (127.0.0.1)
  // This allows the gateway to recognize it as a trusted proxy connection
  req.headers["x-forwarded-for"] = "127.0.0.1";

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

**Important:** We DON'T modify `Host` or `Origin` headers - those are properly handled by OpenClaw's `allowedOrigins` configuration. We replace `X-Forwarded-For` with `127.0.0.1` (the wrapper's IP) so the gateway recognizes the connection as from a trusted proxy.

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
| v1.1.4 | 2026-02-22 | Replace X-Forwarded-For with 127.0.0.1 (fixes "pairing required" error) |
| v1.1.3 | 2025-02-22 | Strip Railway proxy headers (X-Forwarded-*) - BROKEN, causes fwd=n/a |
| v1.1.2 | 2025-02-22 | Configure gateway.trustedProxies to trust wrapper |
| v1.1.1 | 2025-02-22 | Use `RAILWAY_PUBLIC_DOMAIN` for zero-config setup |
| v1.1.0 | 2025-02-22 | Implement `allowedOrigins` configuration |
| v1.0.0 | 2025-02-21 | Initial header rewriting approach |

---

**Document Version:** 1.1.4
**Last Updated:** 2026-02-22
