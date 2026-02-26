# Telegram Troubleshooting Guide

This guide covers common issues when pairing and using Telegram with OpenClaw.

---

## Table of Contents

1. [Understanding the Pairing System](#understanding-the-pairing-system)
2. [Pairing Issues](#pairing-issues)
3. [Common Error Messages](#common-error-messages)
4. [Bot Not Responding](#bot-not-responding)
5. [Permission Issues](#permission-issues)
6. [Checking Bot Status](#checking-bot-status)

---

## Understanding the Pairing System

Before diving into troubleshooting, it helps to understand **how OpenClaw's pairing system works** and **why certain commands exist**.

### How Pairing Works

OpenClaw uses a **request-approval model** for connecting external accounts (like Telegram):

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Telegram  │  /start  │   OpenClaw   │  await  │   Admin     │
│   User      │─────────│   Gateway    │─────────│   Approval  │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │                        │                        │
      └──── Generates pairing code ────────> Stored in queue      │
                                                        │
      │<────── Code shown to user ──────────────────────────────────┘
                                                        │
      │                        │<────── Admin approves ──────┘
      │<────────────── Now connected ───────────────────────────────┘
```

### Why `openclaw pairing list` Exists

**The problem:** Each time you type `/start` in Telegram, a **new pairing code** is generated. Old codes aren't automatically cleaned up.

**Why this happens:**
- Telegram doesn't tell OpenClaw "this is the same user who tried before"
- Each `/start` looks like a fresh connection attempt
- OpenClaw keeps all requests pending until approved or expired

**The solution:** `openclaw pairing list` shows you:
1. **All pending requests** (including old ones)
2. **Which Telegram user** made each request
3. **When the request was made**

This lets you find the **correct code to approve** instead of using a newly generated one that doesn't exist in the system yet.

### Why Commands Like `status` and `channels list` Exist

| Command / URL | Why It's Useful | What It Tells You |
|---------------|-----------------|-------------------|
| `/setup` (web UI) | **Easiest: Visual pairing approval** | See pending requests, click Approve |
| `openclaw status` | Quick health check | Is gateway running? What model? |
| `openclaw pairing list` | Find pending connections | Who's waiting to be paired? |
| `openclaw channels list` | Verify channel config | Is Telegram properly configured? |
| `openclaw config get` | Debug configuration issues | What settings are actually in use? |

**The pattern:** OpenClaw provides multiple ways to **diagnose problems** — web UI (easiest), CLI commands, or API calls.

### Why the "unknown requestId" Error Happens

This is the **most common pairing confusion**:

1. User types `/start` in Telegram → Gets code `ABC123`
2. User types `/start` again → Gets code `DEF456` (ABC123 is still pending!)
3. Admin tries to approve `DEF456` → **Error: "unknown requestId"**
4. System only knows about `ABC123`, not `DEF456`

**The fix:** Always check `openclaw pairing list` first to see what codes the system actually knows about.

### Key Takeaway

> **Never use a freshly generated `/start` code for approval.**
>
> **Recommended:** Visit `/setup` and use the **"Pending Pairing Requests"** section — it shows all actual pending requests with Approve buttons.
>
> **Alternative:** Run `openclaw pairing list` to see what pending requests exist in the system, then approve with `openclaw pairing approve <code>`.

---

## Pairing Issues

### Problem: "unknown requestId" or "INVALID_REQUEST" Error

**Symptoms:**
- You try to approve a pairing code but get an error
- Log shows: `errorCode=INVALID_REQUEST errorMessage=unknown requestId`
- Bot doesn't respond to your messages

**Cause:**
The pairing code you're using doesn't match any pending request in OpenClaw. This happens because:
- Each `/start` in Telegram generates a **new** pairing code
- Previous pending requests remain in the queue
- You need to use the code from an **existing pending request**, not a newly generated one

**Solution:**

#### Method 1: Use the Setup Wizard (Recommended)

1. Visit your OpenClaw setup page: `https://your-url.up.railway.app/setup`
2. Look for the **"Pending Pairing Requests"** section (with Telegram icon)
3. If you see "No pending requests":
   - Type `/start` in your Telegram bot to generate a pairing code
   - The page **auto-refreshes every 30 seconds**, or click the **Refresh** button
4. When your request appears, click **Approve**
5. Your bot should start responding immediately

**Tips:**
- The **Refresh button** (top-right of the section) manually checks for new requests
- When empty, the list **auto-refreshes** every 30 seconds — no need to manually refresh
- After approving, the list refreshes automatically to show remaining requests

#### Method 2: Use Openclaw CLI (Railway Shell)

If you have Railway Shell access:

```bash
# List all pending pairing requests
openclaw pairing list
```

Output example:
```
Code     │ telegramUserId  │ Requested
─────────┼─────────────────┼──────────────────────────
8JZJBX62 │ 8567242898      │ 2026-02-26T05:12:34.140Z
KJSJYZ7E │ 8567242898      │ 2026-02-26T05:15:10.520Z
```

Then approve with the **first/earliest** code:
```bash
openclaw pairing approve 8JZJBX62
```

#### Method 3: Use the Setup API

Send a POST request to approve pairing:

```bash
curl -X POST https://your-url.up.railway.app/setup/api/pairing/approve \
  -H "Content-Type: application/json" \
  -u username:SETUP_PASSWORD \
  -d '{"channel": "telegram", "code": "8JZJBX62"}'
```

---

### Problem: Bot responds "I can't find your account"

**Cause:**
Your Telegram account hasn't been paired with OpenClaw yet.

**Solution:**
Follow the pairing steps above to approve your Telegram account.

---

## Common Error Messages

### "errorCode=INVALID_REQUEST errorMessage=unknown requestId"

**What it means:** The pairing code used doesn't exist in the pending requests list.

**Solution:** Run `openclaw pairing list` and use a code from that list.

---

### "disconnected (1008): pairing required"

**What it means:** The Control UI or gateway requires device pairing, but this has been disabled.

**Solution:** This should be automatically disabled during setup. If you see this:

1. Check your `openclaw.json` contains:
   ```json
   "gateway": {
     "controlUi": {
       "allowInsecureAuth": true
     }
   }
   ```
2. Or re-run the setup wizard

---

### "Bot is not a member of the chat"

**What it means:** The bot token is incorrect or the bot hasn't been properly set up.

**Solution:**
1. Verify your bot token in `openclaw.json` or Railway Variables
2. Make sure you're using the correct bot username (starts with `@`)

---

## Bot Not Responding

### Bot doesn't reply to any messages

**Checklist:**

1. **Verify the bot is running:**
   ```bash
   # Check gateway logs for:
   [telegram] [default] starting provider (@your_bot)
   ```

2. **Verify your account is paired:**
   ```bash
   openclaw pairing list
   ```

3. **Check the bot token:**
   - Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe`
   - Replace `<YOUR_BOT_TOKEN>` with your actual token
   - Should return your bot's info

4. **Check if bot can see your messages:**
   - Make sure you haven't blocked the bot
   - Make sure you're messaging in a **private chat**, not a group

---

### Bot responds but skills don't work

**Example:** "I can't check your email yet — Google Workspace isn't set up"

**Cause:** The required skill isn't configured.

**Solution:** See the appropriate setup guide:
- **Google Workspace:** `docs/GOOGLE_SETUP.md`
- **Other skills:** Check ClawHub or skill documentation

---

## Permission Issues

### Bot can't perform actions (read emails, access calendar, etc.)

**Cause:** The service (Gmail, Calendar, etc.) hasn't been authenticated.

**Solution:**
1. For Google Workspace, visit `/setup/google` and complete OAuth
2. For other services, check their specific setup requirements

---

### Bot says "I don't have permission to do that"

**Cause:** Your Telegram account may not have admin privileges, or the action is restricted.

**Solution:**
1. Check `openclaw.json` for admin settings
2. Add your Telegram user ID to the admin list if needed

---

## Checking Bot Status

### Quick Health Check

Visit these URLs to verify your setup:

| URL | What It Checks |
|-----|----------------|
| `/setup` | **Main setup page — Pending Pairing Requests section** |
| `/setup/healthz` | Wrapper is running |
| `/setup/api/status` | OpenClaw configuration status |
| `/setup/api/pairing/list` | Pending pairing requests (JSON API) |
| `/setup/api/google/status` | Google authentication status |

### Detailed Status Check

```bash
# Check if gateway is running
openclaw status

# Check channel configuration
openclaw channels list

# Check pairing status
openclaw pairing list

# Check logs
tail -f /tmp/openclaw/openclaw-*.log
```

---

## Railway-Specific Tips

### Viewing Logs

1. Go to your Railway service
2. Click the **Logs** tab
3. Look for these messages:
   ```
   [telegram] [default] starting provider (@your_bot)
   [gateway] ready at /openclaw
   ```

### Restarting the Service

If the bot is misbehaving:

1. Click **Redeploy** in Railway
2. Wait for the container to restart
3. Try pairing again

### Checking Configuration Files

Use Railway Shell to inspect configuration:

```bash
# View OpenClaw config
cat /data/.openclaw/openclaw.json

# Check for Telegram configuration
grep -A 10 '"telegram"' /data/.openclaw/openclaw.json

# Check Google credentials
cat /data/.openclaw/credentials/client_secret.json
```

---

## Getting Your Telegram User ID

To find your Telegram user ID:

1. Message `@userinfobot` on Telegram
2. It will reply with your user ID
3. Use this ID to identify yourself in pairing requests

---

## Web UI Refresh Workflow

The `/setup` page's "Pending Pairing Requests" section has built-in refresh capabilities:

### When You See "No pending requests"

1. **Type `/start`** in your Telegram bot
2. **Wait up to 30 seconds** — the page auto-refreshes automatically
3. **Or click Refresh** — the button (top-right) checks immediately

### Visual Indicators

| State | What You See |
|-------|--------------|
| Loading | Refresh icon spins, "Loading pending requests..." |
| Empty | Info box with "No pending requests" + auto-refresh note |
| Has Requests | Cards showing User ID, Requested time, Code, and Approve button |

### After Approving

The list automatically refreshes to:
- Remove the approved request
- Show any remaining pending requests
- Return to "No pending requests" if all approved

---

## Still Having Issues?

1. **Check the logs** — Railway Logs often contain detailed error messages
2. **Verify environment variables** — Make sure `TELEGRAM_BOT_TOKEN` is set correctly
3. **Reset and re-pair** — Use `/setup` → Reset to start fresh
4. **Check OpenClaw Discord** — https://discord.gg/openclaw

---

## Quick Reference Commands

```bash
# List pending pairing requests
openclaw pairing list

# Approve a pairing request
openclaw pairing approve <code>

# Check channel status
openclaw channels list

# View gateway status
openclaw status

# Test Telegram bot directly
curl https://api.telegram.org/bot<BOT_TOKEN>/getMe
```

---

**Version:** 1.2
**Last Updated:** 2026-02-26
**For:** Railway deployment of OpenClaw with Telegram integration

---

## Changelog

### v1.2 (2026-02-26)
- Added **Refresh button** to "Pending Pairing Requests" section for manual refresh
- Added **auto-refresh** every 30 seconds when no pending requests
- Added **spinning animation** on refresh button while loading
- Updated Method 1 instructions with refresh workflow tips

### v1.1 (2026-02-26)
- Added `/setup` web UI method for pairing approval (no CLI required)
- Added "Pending Pairing Requests" section documentation
- Updated health check URLs table with pairing API endpoint

### v1.0 (2026-02-26)
- Initial release with pairing system explanation and troubleshooting guide
