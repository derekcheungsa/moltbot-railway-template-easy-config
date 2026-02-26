# Telegram Troubleshooting Guide

This guide covers common issues when pairing and using Telegram with OpenClaw.

---

## Table of Contents

1. [Pairing Issues](#pairing-issues)
2. [Common Error Messages](#common-error-messages)
3. [Bot Not Responding](#bot-not-responding)
4. [Permission Issues](#permission-issues)
5. [Checking Bot Status](#checking-bot-status)

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
2. Look for the **"Pending Pairing Requests"** section
3. Find your Telegram user and click **Approve**
4. Your bot should start responding immediately

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
| `/setup/healthz` | Wrapper is running |
| `/setup/api/status` | OpenClaw configuration status |
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

**Version:** 1.0
**Last Updated:** 2026-02-26
**For:** Railway deployment of OpenClaw with Telegram integration
