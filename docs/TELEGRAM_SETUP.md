# Telegram Setup Guide for OpenClaw

A complete guide to integrating OpenClaw with Telegram for AI-powered conversations on the go.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step-by-Step Setup](#step-by-step-setup)
  - [Step 1: Create Your Telegram Bot](#step-1-create-your-telegram-bot)
  - [Step 2: Configure Bot Privacy](#step-2-configure-bot-privacy)
  - [Step 3: Add Bot to OpenClaw Setup](#step-3-add-bot-to-openclaw-setup)
  - [Step 4: Generate and Approve the Pairing Code](#step-4-generate-and-approve-the-pairing-code)
  - [Step 5: Test Your Bot](#step-5-test-your-bot)
- [Using OpenClaw on Telegram](#using-openclaw-on-telegram)
- [Troubleshooting](#troubleshooting)
- [BotFather Command Reference](#botfather-command-reference)

---

## Overview

Telegram is one of the 13+ platforms supported by OpenClaw. Setting it up allows you to:
- Chat with your AI assistant from anywhere
- Get code help on the go
- Add OpenClaw to group chats for collaborative assistance
- Share files and get instant analysis

**Time required:** 10-15 minutes
**Difficulty:** Beginner

---

## Prerequisites

- [ ] OpenClaw deployed to Railway
- [ ] Telegram app installed (mobile or desktop)
- [ ] Access to your OpenClaw setup wizard (`/setup`)

---

## Step-by-Step Setup

### Step 1: Create Your Telegram Bot

1. **Open Telegram** and search for **[@BotFather](https://t.me/BotFather)** (the official bot creation tool)

2. **Start a conversation** and send the command:
   ```
   /newbot
   ```

3. **Choose a name** for your bot (e.g., "My AI Assistant", "Code Helper")

4. **Choose a username** for your bot (must end in `bot`, e.g., `my_ai_assistant_bot`, `code_helper_bot`)

5. **Copy the bot token** - BotFather will provide a token like:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

   > ⚠️ **Keep this token secure!** It's like a password for your bot. Anyone with the token can control it.

---

### Step 2: Configure Bot Privacy

**This is the most important step!** By default, Telegram bots can only read commands that start with `/`. For OpenClaw to work properly with natural language, you need to disable this restriction.

1. **In BotFather**, send the command:
   ```
   /setprivacy
   ```

2. **Select your bot** from the list

3. **Choose "Disabled"** - this allows the bot to read all messages in chats

> 💡 **Why disable privacy?** When enabled, the bot only receives messages that start with `/` or mention the bot. When disabled, the bot can read all messages, allowing natural conversation with OpenClaw.

---

### Step 3: Add Bot to OpenClaw Setup

1. **Access your OpenClaw setup wizard** at:
   ```
   https://your-app.up.railway.app/setup
   ```

2. **Navigate to Step 3 (Channels)** in the setup wizard

3. **Expand the Telegram section**

4. **Paste your bot token** from Step 1

5. **Click "Run Setup"** or "Next" to apply the configuration

---

### Step 4: Generate and Approve the Pairing Code

By default, OpenClaw uses a **pairing system** for security. You'll need to authorize your Telegram account before using the bot.

#### 4.1 Start the Bot and Get Your Pairing Code

1. **Search for your bot** on Telegram using the username you created in Step 1

2. **Send the `/start` command** to begin the conversation

3. **The bot will reply** with a pairing message like:
   ```
   OpenClaw: access not configured.

   Your Telegram user id: 1234567890

   Pairing code: ABC123XY

   Ask the bot owner to approve with:
   openclaw pairing approve telegram ABC123XY
   ```

4. **Copy the pairing code** (e.g., `ABC123XY`) - you'll need it for the next step

---

#### 4.2 Approve the Pairing

Use one of these methods to authorize your Telegram account:

**Method 1: Web UI (Recommended)**

1. Access the OpenClaw Control UI at:
   ```
   https://your-app.up.railway.app/openclaw
   ```

2. In the chat interface, type:
   ```
   openclaw pairing approve telegram ABC123XY
   ```
   (Replace `ABC123XY` with your actual pairing code)

**Method 2: Railway Console**

1. Go to your Railway project
2. Click on your OpenClaw service
3. Click the **"Console"** tab
4. Run the command:
   ```bash
   npx openclaw pairing approve telegram ABC123XY
   ```

---

#### 4.3 Verify Approval

1. **Check Telegram** - You should receive a confirmation message like:
   ```
   ✓ Your account has been approved! You can now use OpenClaw.
   ```

2. **Send a test message** to confirm everything is working:
   ```
   Hello! Can you help me?
   ```

3. **The bot should respond** normally now without any pairing errors.

> 💡 **Note:** The pairing code is unique per Telegram user. Each person who wants to use your bot will need to go through this approval process (or you can change the `dmPolicy` to `allowAll` - see [Advanced Configuration](#advanced-configuration)).

---

### Step 5: Test Your Bot

1. **Send a real test message** like:
   ```
   Can you help me write a Python function to calculate fibonacci numbers?
   ```

2. **Your OpenClaw AI should respond** with helpful code!

3. **Try more complex tasks:**
   - "Debug this code: [paste code]"
   - "Explain how async/await works in JavaScript"
   - "Create a React component for a todo list"

---

## Using OpenClaw on Telegram

### Use Cases

| Use Case | Description | Example |
|----------|-------------|---------|
| **Personal Assistant** | DM the bot for private 1-on-1 conversations | "Help me debug this code..." |
| **Group Chats** | Add bot to group chats for collaborative AI assistance | Add to `#dev-team` group |
| **Code Analysis** | Forward code files or paste code directly | Paste a function for review |
| **Quick Questions** | Get instant answers without opening a browser | "What's the difference between let and const?" |
| **Inline Queries** | Use `@botname query` in any chat | `@mybot explain async/await` |

### Example Conversations

**Code Generation:**
```
You: Write a React component for a todo list
Bot: [Generates complete React component with hooks]
```

**Debugging Help:**
```
You: This code throws an error: [paste code]
Bot: [Analyzes and suggests fixes]
```

**Learning:**
```
You: Explain how OAuth works
Bot: [Provides clear explanation with examples]
```

---

## Troubleshooting

### Problem: Bot isn't responding to messages

**Symptoms:** Bot shows as online but doesn't reply to any messages

**Solutions:**
1. Check that bot privacy is disabled:
   ```
   In BotFather: /setprivacy → Disabled
   ```

2. Verify your OpenClaw gateway is running:
   - Check Railway logs for errors
   - Ensure the deployment is active

3. Confirm the token was correctly pasted in the setup wizard

---

### Problem: Bot responds with errors

**Symptoms:** Bot replies but the response contains error messages

**Solutions:**
1. Check Railway logs for detailed error information
2. Verify your Atlas Cloud API key is valid
3. Ensure the selected AI model is available on Atlas Cloud

---

### Problem: Bot can't be added to groups

**Symptoms:** When trying to add bot to a group, it doesn't appear in the list

**Solutions:**
1. In BotFather: `/mybots` → Select your bot → Bot Settings → Allow Groups
2. Wait a few minutes for the setting to take effect
3. Make sure you're using the correct bot username

---

### Problem: Bot privacy mode keeps re-enabling

**Symptoms:** You disable privacy but it gets re-enabled later

**Solution:** This is controlled by BotFather. Use `/setprivacy` again and ensure you select "Disabled" and save the changes.

---

## BotFather Command Reference

| Command | Description |
|---------|-------------|
| `/newbot` | Create a new bot |
| `/mybots` | Manage your existing bots |
| `/setprivacy` | Control which messages the bot reads (Disable for OpenClaw) |
| `/setabout` | Set a short description for your bot |
| `/setdescription` | Set a detailed description |
| `/setuserpic` | Set a profile picture for your bot |
| `/setcommands` | Set up slash commands for your bot |
| `/deletebot` | Delete your bot |

---

## Security Best Practices

1. **Never share your bot token publicly** - treat it like a password
2. **Enable two-factor authentication** on your Telegram account
3. **Regularly check Railway logs** for suspicious activity
4. **Use a separate API key** for each deployment if running multiple instances

---

## Advanced Configuration

### Customizing Bot Behavior

After setup, you can customize your OpenClaw bot behavior through the OpenClaw Control UI:

1. Access the Control UI at `/openclaw`
2. Navigate to Channels → Telegram
3. Adjust settings like:
   - Response style (concise vs detailed)
   - Language preference
   - Code formatting options

### Multiple Telegram Bots

You can configure multiple Telegram bots for different purposes:
- Create separate bots in BotFather
- Add each bot token to different OpenClaw instances
- Use different AI models for specialized tasks

---

## Related Resources

- **Main Tutorial:** [Learning OpenClaw Tutorial](./learning-openclaw-tutorial.md)
- **YouTube Transcript:** [YouTube Deployment Guide](./learning-openclaw-youtube-transcript.md)
- **Atlas Cloud Guide:** [Atlas Cloud Testing](./ATLAS_CLOUD_TESTING.md)
- **OpenClaw Docs:** https://docs.openclaw.ai
- **Telegram Bot API:** https://core.telegram.org/bots/api

---

**Need help?** Join the [OpenClaw Discord](https://discord.gg/openclaw) for community support.
