# Gateway Restart and Origin Validation Fix

## Overview

This document summarizes the fixes applied to resolve gateway restart race conditions and origin validation issues in the OpenClaw Railway wrapper.

## Problem Description

### Issue 1: Gateway Restart Race Condition
**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::18789
Port 18789 is already in use
```

**Root Cause:** The wrapper used a fixed 750ms delay between `SIGTERM` and starting a new gateway process. This was insufficient for graceful shutdown, especially with active WebSocket connections.

### Issue 2: Origin Validation Timing
**Symptoms:**
```
[ws] origin not allowed
[ws] code=1008 reason=pairing required
[ws] Proxy headers detected from untrusted address
```

**Root Cause:** Each `config set` command triggers an automatic gateway restart (the gateway process watches its config file). During onboarding, the wrapper made multiple sequential config changes:
1. `allowedOrigins` → restart
2. `dangerouslyAllowHostHeaderOriginFallback` → restart
3. `dangerouslyDisableDeviceAuth` → restart
4. `trustedProxies` → restart
5. `gateway.mode` → restart
6. `gateway.auth.token` → restart

Connections arriving between these restarts encountered partially applied configuration, causing authentication and origin validation failures.

## Solutions Implemented

### Fix 1: Proper Process Exit Waiting
**File:** `src/server.js`

**Before:**
```javascript
// Fixed delay - insufficient for graceful shutdown
oldProc.kill("SIGTERM");
await sleep(750);
```

**After:**
```javascript
async function stopGateway() {
  if (gatewayProc) {
    const oldProc = gatewayProc;
    try {
      oldProc.kill("SIGTERM");
    } catch {
      // ignore
    }
    // Poll for actual process exit
    const timeoutMs = 10_000;
    const start = Date.now();
    while (oldProc.exitCode === null && Date.now() - start < timeoutMs) {
      await sleep(100);
    }
    if (oldProc.exitCode === null) {
      console.warn(`[gateway] Process did not exit after ${timeoutMs}ms, forcing SIGKILL`);
      try {
        oldProc.kill("SIGKILL");
        await sleep(500);
      } catch {
        // ignore
      }
    } else {
      console.log(`[gateway] Process stopped cleanly (code=${oldProc.exitCode})`);
    }
    gatewayProc = null;
  }
}
```

**Benefits:**
- Waits up to 10 seconds for graceful shutdown
- Polls for actual process exit (checking `exitCode`)
- Falls back to SIGKILL only if graceful shutdown fails
- Eliminates `EADDRINUSE` errors

### Fix 2: Atomic Config Application
**File:** `src/server.js`

**Before:**
```javascript
// Each config set triggers a restart while gateway is running
await runCmd(OPENCLAW_NODE, clawArgs(["config", "set", "gateway.controlUi.allowedOrigins", ...]));
await runCmd(OPENCLAW_NODE, clawArgs(["config", "set", "gateway.controlUi.dangerouslyDisableDeviceAuth", ...]));
await runCmd(OPENCLAW_NODE, clawArgs(["config", "set", "gateway.trustedProxies", ...]));
// ... more config sets ...
await restartGateway();
```

**After:**
```javascript
// Stop gateway FIRST - no restarts during config changes
console.log(`[onboard] Stopping gateway to apply config changes atomically...`);
await stopGateway();
console.log(`[onboard] Gateway stopped, now applying all config changes...`);

// Apply ALL configs while gateway is stopped
await runCmd(OPENCLAW_NODE, clawArgs(["config", "set", "gateway.controlUi.allowedOrigins", ...]));
await runCmd(OPENCLAW_NODE, clawArgs(["config", "set", "gateway.controlUi.dangerouslyDisableDeviceAuth", ...]));
await runCmd(OPENCLAW_NODE, clawArgs(["config", "set", "gateway.trustedProxies", ...]));
// ... all other configs ...

// Single restart at the end with complete config
await restartGateway();
```

**Benefits:**
- All config changes applied atomically
- Gateway starts once with complete configuration
- No partial-config connection errors
- Reduced total startup time (fewer restarts)

### Fix 3: Railway Public Domain Detection
**File:** `src/server.js`

**Change:** Explicitly set `gateway.controlUi.allowedOrigins` using Railway's `RAILWAY_PUBLIC_DOMAIN` environment variable.

```javascript
// Determine the allowed origin for the Control UI
const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
if (railwayDomain) {
  allowedOrigin = `https://${railwayDomain}`;
  console.log(`[onboard] Using Railway public domain: ${allowedOrigin}`);
} else {
  allowedOrigin = "http://localhost:8080";
  console.log(`[onboard] No RAILWAY_PUBLIC_DOMAIN found, using local fallback: ${allowedOrigin}`);
}

await runCmd(
  OPENCLAW_NODE,
  clawArgs(["config", "set", "--json", "gateway.controlUi.allowedOrigins", JSON.stringify([allowedOrigin])]),
);
```

**Benefits:**
- Explicit origin whitelist instead of relying solely on fallback
- Works automatically with Railway's dynamic domains
- Maintains fallback for local development

## Configuration Settings Applied

The following settings are now applied atomically during onboarding:

| Setting | Purpose |
|---------|---------|
| `gateway.controlUi.allowedOrigins` | Explicit Railway URL whitelist |
| `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback` | Safety net for local dev |
| `gateway.controlUi.dangerouslyDisableDeviceAuth` | Bypass device pairing (token auth mode) |
| `gateway.trustedProxies` | Trust wrapper for client IP detection |
| `gateway.mode` | Set to "local" |
| `gateway.auth.mode` | Set to "token" |
| `gateway.auth.token` | Sync wrapper token to config |
| `gateway.bind` | Loopback only |
| `gateway.port` | Internal port (18789) |

## Testing

### Expected Log Output
After deployment, successful onboarding should show:
```
[onboard] Stopping gateway to apply config changes atomically...
[onboard] Gateway stopped, now applying all config changes...
[onboard] Using Railway public domain: https://<deployment>.up.railway.app
[onboard] allowedOrigins result: code=0
[onboard] dangerouslyDisableDeviceAuth result: code=0
[onboard] trustedProxies result: code=0
... (other configs) ...
[gateway] Starting gateway process...
[gateway] ✓ Token verification PASSED
[gateway] ready at /openclaw
```

### What Should Be Fixed
- ❌ `Error: listen EADDRINUSE: address already in use :::18789`
- ❌ `[ws] origin not allowed`
- ❌ `[ws] code=1008 reason=pairing required`
- ❌ `[ws] Proxy headers detected from untrusted address`

## Related Files

- `src/server.js` - Main wrapper with gateway lifecycle management
- `CLAUDE.md` - Project documentation (see "Quirks & Gotchas" section)

## Commits

- `55543ee` - fix: stop gateway before config changes to prevent partial-config errors
- `0a80d46` - fix: use Railway public domain for explicit origin configuration
- (earlier commits for initial restart fix)

## Future Considerations

1. **Config Batching via CLI:** OpenClaw may add a `config set --batch` or similar feature to apply multiple settings atomically via CLI. This would further simplify the onboarding code.

2. **Gateway Watch Behavior:** The current fix works around the gateway's file-watch-and-restart behavior. A future gateway version could support a `--no-restart` flag for batch config operations.

3. **Config Validation:** Adding validation after all config changes are applied (but before gateway start) could catch configuration errors early.
