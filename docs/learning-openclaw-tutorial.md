# Learning Openclaw Tutorial

> A comprehensive guide to deploying, configuring, and integrating Openclaw with Atlas Cloud and messaging platforms.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Overview](#overview)
3. [Quick Start](#quick-start)
4. [Deployment](#deployment)
5. [Configuration](#configuration)
6. [Integrations](#integrations)
7. [OpenClaw Skills](#openclaw-skills)
8. [Use Case Topics](#use-case-topics)
9. [Security Hardening](#security-hardening)
10. [Testing & Validation](#testing--validation)
11. [Troubleshooting](#troubleshooting)
12. [References](#references)
13. [Bonus: Advanced Integrations](#bonus-advanced-integrations)

---

## Prerequisites

Before starting this tutorial, ensure you have:

### Required Accounts

| Service | Purpose | Cost |
|---------|---------|------|
| [Railway](https://railway.app/) | Hosting platform | Free tier available, ~$5/month for paid |
| [Atlas Cloud](https://www.atlascloud.ai/) | AI model provider | Free tier + pay-per-use |
| [GitHub](https://github.com/) | Code hosting | Free |

### Required Tools

- **Git** - For cloning the repository
- **Docker** (optional) - For local testing
- **Basic CLI knowledge** - For running commands

### Skill Level

- **Beginner to Intermediate** - No prior Openclaw experience required
- **Basic understanding** of environment variables and API keys

### Time Estimate

- **Quick Start**: 10 minutes
- **Full Tutorial**: 1-2 hours
- **Each Integration**: 15-30 minutes

---

## Overview

### What is Openclaw?

Openclaw (formerly Moltbot/Clawdbot) is an open-source AI coding assistant platform that:

- **Provides AI-powered code generation** - Generate, refactor, and debug code
- **Integrates with messaging platforms** - Discord, Telegram, Slack, LINE, etc.
- **Supports multiple AI providers** - Anthropic, OpenAI, Google, Atlas Cloud, and more
- **Offers extensible architecture** - Skills, plugins, custom agents
- **Runs self-hosted** - Your data stays on your servers

### Key Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Railway Deployment                        │
│                      *.up.railway.app                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Express Wrapper (src/server.js)                 │
│                   Port: 8080 (external)                     │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ /setup (Basic Auth) → Setup Wizard                   │    │
│  │ /openclaw, /* → Proxy to Gateway (Bearer Token)     │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Openclaw Gateway (localhost:18789)            │
│   ┌────────────────┐    ┌────────────────┐                  │
│   │  Agent Engine  │    │  Auth Store    │                  │
│   │  - AI Models   │    │  - API Keys     │                  │
│   │  - Skills      │    │  - Profiles     │                  │
│   └────────────────┘    └────────────────┘                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  AI Providers                               │
│   ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐     │
│   │Atlas Cloud│ │Anthropic│ │ OpenAI   │ │ Google  │     │
│   └──────────┘ └─────────┘ └──────────┘ └─────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Common Use Cases

| Use Case | Difficulty | Description |
|----------|-----------|-------------|
| **24/7 Personal Assistant** | Easy | AI chatbot for general questions and tasks |
| **Code Review & Debugging** | Medium | Analyze code, find bugs, suggest fixes |
| **Image/Video Generation** | Medium | Generate visual content using Atlas Cloud models |
| **Financial Analysis** | Advanced | Process financial data, generate reports |
| **Security Auditing** | Advanced | Scan code for vulnerabilities |
| **Social Media Management** | Easy | Schedule posts, analyze engagement |

---

## Quick Start

Get Openclaw running on Railway in **5 minutes**:

### Step 1: Deploy to Railway (2 minutes)

<details>
<summary>Click to expand</summary>

1. Go to [railway.app](https://railway.app/) and log in
2. Click **New Project** → **Deploy from GitHub repo**
3. Enter: `https://github.com/[your-username]/openclaw-railway-template-easy-config`
4. **Add a Volume** mounted at `/data`
5. Set environment variable: `SETUP_PASSWORD=your-secure-password`
6. Click **Deploy**

Wait for deployment to complete (~2 minutes).
</details>

### Step 2: Run Setup Wizard (3 minutes)

<details>
<summary>Click to expand</summary>

1. Visit `https://your-app.up.railway.app/setup`
2. Login with your `SETUP_PASSWORD`
3. Select **Atlas Cloud** as provider
4. Paste your Atlas Cloud API key
5. Click **Run Setup**

That's it! Your Openclaw instance is ready.
</details>

### Success Indicators

✅ Setup completes without errors
✅ Gateway starts: `[gateway] ready at /openclaw`
✅ Control UI accessible at `/openclaw`

---

## Deployment

### Deployment Processes to Railway Platform

**Learning Objectives:**
- ✓ Create a Railway project from this template
- ✓ Configure persistent storage
- ✓ Set up environment variables
- ✓ Verify deployment health

**Time:** 15 minutes

### Option 1: Deploy from GitHub Template (Recommended)

<details>
<summary>Step-by-step instructions</summary>

1. **Prepare your GitHub repository**
   ```bash
   # Fork this repository to your GitHub account
   # Or push your own version
   ```

2. **Create Railway Project**
   - Go to [railway.app](https://railway.app/)
   - Click **New Project** → **Deploy from GitHub repo**
   - Select your forked repository
   - Click **Import**

3. **Configure the Service**
   - **Root Directory**: `/`
   - **Builder**: `Dockerfile`
   - **Add Variables**:
     - `SETUP_PASSWORD` - Your secure password

4. **Add Persistent Volume**
   - Click **Settings** → **Variables**
   - Click **New Volume**
   - Mount path: `/data`
   - Name: `openclaw-data`

5. **Enable Public Networking**
   - Click **Settings** → **Networking**
   - Enable **Public Networking**
   - Railway will assign a domain like `https://your-app.up.railway.app`

6. **Deploy**
   - Click **Deploy**
   - Wait for build and deployment (~5 minutes)

7. **Verify Health**
   - Visit `https://your-app.up.railway.app/setup/healthz`
   - Should return: `{"ok":true}`
</details>

### Option 2: Manual Deployment from Local

<details>
<summary>For custom builds or development</summary>

```bash
# Clone the repository
git clone https://github.com/[your-username]/openclaw-railway-template-easy-config.git
cd openclaw-railway-template-easy-config

# Build the Docker image
docker build -t openclaw-railway-template .

# Run locally (for testing)
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e SETUP_PASSWORD=test \
  -v $(pwd)/.tmpdata:/data \
  openclaw-railway-template

# Or push to your own registry
docker tag openclaw-railway-template ghcr.io/[your-username]/openclaw:latest
docker push ghcr.io/[your-username]/openclaw:latest
```
</details>

### Deployment Checklist

- [ ] Repository cloned or forked
- [ ] Railway project created
- [ ] Volume mounted at `/data`
- [ ] `SETUP_PASSWORD` environment variable set
- [ ] Public networking enabled
- [ ] Deployment successful
- [ ] Health check endpoint returns `{"ok":true}`

---

## Configuration

### General Tutorial

**Learning Objectives:**
- ✓ Navigate the setup wizard
- ✓ Configure AI providers
- ✓ Set up messaging channels
- ✓ Understand configuration files

**Time:** 20 minutes

### Setup Wizard Walkthrough

The setup wizard at `/setup` guides you through 5 steps:

#### Step 1: Welcome
Overview of Openclaw features and what you'll need.

#### Step 2: Authentication
Select your AI provider and enter your API key.

**Available Providers:**
- **Anthropic** (Claude) - Recommended for coding
- **OpenAI** (GPT models)
- **Google** (Gemini)
- **Atlas Cloud** - Multi-model with competitive pricing
- **OpenRouter** - Access to multiple models
- **Vercel AI Gateway**
- **Moonshot AI**, **Z.AI**, **MiniMax**, **Qwen**, **Synthetic**, **OpenCode Zen**

> ⚠️ **Common Mistake**: Entering an invalid API key
>
> **Solution**: Verify your API key by testing it directly:
> ```bash
> # Atlas Cloud
> curl -H "Authorization: Bearer YOUR_KEY" https://api.atlascloud.ai/v1/models
> ```

#### Step 3: Channels (Optional)
Configure messaging platforms:
- **Telegram** - Bot token from @BotFather
- **Discord** - Bot token from Discord Developer Portal
- **Slack** - Bot token and App token

> ⚠️ **Discord Requirement**: Enable **MESSAGE CONTENT INTENT** in your Discord bot settings or messages won't be received.

#### Step 4: Review
Verify your settings before running setup.

#### Step 5: Complete
Watch the setup progress and access your Openclaw instance.

### Configuration File Structure

```
/data/.openclaw/
├── openclaw.json          # Main configuration file
├── gateway.token           # Gateway authentication token
├── agents/
│   └── main/
│       └── agent/
│           └── auth-profiles.json  # AI provider API keys
└── channels/
    ├── telegram/
    ├── discord/
    └── slack/
```

---

## Integrations

### Integrating OpenClaw with Atlas Cloud Platform

**Learning Objectives:**
- ✓ Understand how Atlas Cloud integrates with OpenClaw
- ✓ Configure Atlas Cloud with model selection
- ✓ Select the right Atlas Cloud model for your use case
- ✓ Verify the integration works

**Time:** 15 minutes

#### What is Atlas Cloud?

Atlas Cloud is a GPU cloud platform providing:
- **100+ AI models** including LLMs, image, and video generation
- **OpenAI-compatible API** for seamless integration
- **Competitive pricing** - Pay only for what you use
- **High-performance GPUs** for faster inference

#### How the Integration Works

OpenClaw's Railway template integrates Atlas Cloud as a **custom provider** using the OpenAI-compatible API:

```
┌─────────────────────────────────────────────────────────────┐
│                    Setup Wizard (/setup)                     │
│  User selects: Atlas Cloud → Atlas Cloud API key            │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│              src/server.js (Express Wrapper)                 │
│  1. Receives API key from user                              │
│  2. Maps to --openai-api-key flag                           │
│  3. Creates custom provider config:                         │
│     - baseUrl: https://api.atlascloud.ai/v1/               │
│     - api: "openai-completions"                             │
│     - apiKey: "${OPENAI_API_KEY}"                           │
│  4. Runs: openclaw config set --json models.providers.atlas │
│  5. Sets model: atlas/{selected-model-id}                   │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  OpenClaw Configuration                      │
│  models.providers.atlas.baseUrl = "https://api.atlascloud.ai/v1/" │
│  models.providers.atlas.api = "openai-completions"          │
│  agents.defaults.model.primary = "atlas/minimaxai/minimax-m2.1" │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                Atlas Cloud API Requests                      │
│  OpenClaw sends OpenAI-format requests → Atlas responds     │
└─────────────────────────────────────────────────────────────┘
```

#### Atlas Cloud Models Available

The setup wizard includes **7 Atlas Cloud models** to choose from:

| Model ID | Name | Context | Input | Output | Best For |
|----------|------|---------|-------|--------|----------|
| `minimaxai/minimax-m2.1` | MiniMax M2.1 (default) | 197K | $0.30/M | $1.20/M | Coding, fast response |
| `deepseek-ai/deepseek-r1` | DeepSeek R1 | 164K | $0.28/M | $0.40/M | Reasoning, chain-of-thought |
| `zai-org/glm-4.7` | Z.AI GLM-4.7 | 203K | $0.52/M | $1.95/M | Chinese language optimization |
| `kwai-kat/kat-coder-pro` | KwaiKAT Coder Pro | 256K | $0.30/M | $1.20/M | Large codebases, long context |
| `moonshot-ai/moonshot-v1-128k` | Moonshot V1 128K | 262K | $0.60/M | $2.50/M | Long documents, analysis |
| `zhipu-ai/glm-4-5b-plus` | Zhipu GLM-4 5B Plus | 203K | $0.44/M | $1.74/M | Cost-effective, efficiency |
| `qwen/qwen-2.5-coder-32b-instruct` | Qwen 2.5 Coder 32B | 262K | $0.69/M | $2.70/M | Code specialization |

**Model Selection Guide:**

| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| **General coding** | MiniMax M2.1 | Fast, affordable, good for code |
| **Complex reasoning** | DeepSeek R1 | Chain-of-thought capabilities |
| **Large files** | KwaiKAT Coder Pro | 256K context window |
| **Cost-sensitive** | DeepSeek R1 | Lowest output price ($0.40/M) |
| **Chinese content** | Z.AI GLM-4.7 | Optimized for Chinese |
| **Code-focused** | Qwen 2.5 Coder 32B | Specialized for coding tasks |

#### Configuration Steps

<details>
<summary>Click to see detailed configuration</summary>

1. **Get Atlas Cloud API Key**
   - Visit [atlascloud.ai](https://www.atlascloud.ai/)
   - Sign up/login
   - Navigate to **Settings** → **API Key Management**
   - Click "Create API Key"
   - Copy the generated key

2. **Run Setup Wizard**
   - Visit `https://your-app.up.railway.app/setup`
   - Login with `SETUP_PASSWORD`
   - Click "Get Started"

3. **Configure Atlas Cloud** (Step 2: Authentication)
   - **Provider Group**: Select "Atlas Cloud"
   - **Auth Method**: Select "Atlas Cloud API key"
   - **API Key**: Paste your Atlas Cloud API key
   - **Atlas Cloud Model**: Select from dropdown (default: MiniMax M2.1)
   - **Flow**: Select "Quickstart" (or your preference)

4. **Review Model Info** (shown in real-time)
   The setup wizard displays:
   - Model name and description
   - Context window size
   - Input/output pricing per million tokens

5. **Complete Setup**
   - Configure optional channels (Telegram/Discord/Slack)
   - Review settings in Step 4
   - Check the confirmation box
   - Click "Run Setup"

6. **Verify Configuration**
   After setup completes, you can verify:
   ```bash
   # SSH into Railway container (optional)
   railway shell

   # Check the configured provider
   openclaw config get models.providers.atlas

   # Check the active model
   openclaw config get agents.defaults.model.primary
   # Should show: atlas/minimaxai/minimax-m2.1 (or your selected model)
   ```
</details>

#### Technical Implementation Details

**How the Wrapper Configures Atlas Cloud:**

The integration uses Atlas Cloud's **OpenAI-compatible API**. Here's what happens under the hood:

1. **API Key Mapping** (`src/server.js:500-515`)
   ```javascript
   // Atlas Cloud uses OpenAI-compatible API, so map it to openai-api-key
   const envVarMapping = {
     "atlas-api-key": "OPENAI_API_KEY",  // Environment variable
   };

   const flagMapping = {
     "atlas-api-key": "--openai-api-key",  // CLI flag for onboard
   };
   ```

2. **Provider Configuration** (`src/server.js:804-818`)
   ```javascript
   const providerConfig = {
     baseUrl: "https://api.atlascloud.ai/v1/",
     apiKey: "${OPENAI_API_KEY}",  // Env variable substitution
     api: "openai-completions",     // OpenAI-compatible API
     models: [
       { id: "minimaxai/minimax-m2.1", name: "MiniMax M2.1" },
       { id: "deepseek-ai/deepseek-r1", name: "DeepSeek R1" },
       { id: "zai-org/glm-4.7", name: "Z.AI GLM-4.7" },
       { id: "kwai-kat/kat-coder-pro", name: "KwaiKAT Coder Pro" },
       { id: "moonshot-ai/moonshot-v1-128k", name: "Moonshot V1 128K" },
       { id: "zhipu-ai/glm-4-5b-plus", name: "Zhipu GLM-4 5B Plus" },
       { id: "qwen/qwen-2.5-coder-32b-instruct", name: "Qwen 2.5 Coder 32B" },
     ]
   };
   ```

3. **OpenClaw Commands Executed**
   ```bash
   # Set models mode to merge (doesn't clobber existing providers)
   openclaw config set models.mode merge

   # Configure the Atlas provider
   openclaw config set --json 'models.providers.atlas' '{"baseUrl":"https://api.atlascloud.ai/v1/","apiKey":"${OPENAI_API_KEY}","api":"openai-completions","models":[...]}'

   # Set the active model
   openclaw config set 'agents.defaults.model.primary' 'atlas/minimaxai/minimax-m2.1'
   ```

#### Testing the Integration

**1. Test via Control UI**
```
Visit: https://your-app.up.railway.app/openclaw
Send: "Hello! What model are you using?"
Expected: Response should indicate the selected Atlas Cloud model
```

**2. Test via API**
```bash
GATEWAY_URL="https://your-app.up.railway.app"
GATEWAY_TOKEN="your-gateway-token"

curl -X POST "${GATEWAY_URL}/v1/chat/completions" \
  -H "Authorization: Bearer ${GATEWAY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "atlas/minimaxai/minimax-m2.1",
    "messages": [
      {"role": "user", "content": "Say hello from Atlas Cloud!"}
    ]
  }'
```

**3. Check Gateway Logs**
```bash
# In Railway logs, look for:
[atlas] Checking authChoice: "atlas-api-key"
[atlas] Configuring Atlas Cloud provider with model: minimaxai/minimax-m2.1
[atlas] Provider config: {...}
[atlas] Set provider result: exit=0
[atlas] Set model result: exit=0
[atlas] configured Atlas Cloud provider (model: minimaxai/minimax-m2.1)
```

#### Switching Models After Setup

To switch to a different Atlas Cloud model after initial setup:

**Option 1: Via OpenClaw CLI (SSH into container)**
```bash
railway shell

# List available models
openclaw config get models.providers.atlas.models

# Set a different model
openclaw config set agents.defaults.model.primary "atlas/deepseek-ai/deepseek-r1"

# Restart gateway
openclaw gateway restart
```

**Option 2: Via Setup Wizard**
1. Visit `/setup`
2. Click "Reset Configuration"
3. Re-run setup with a different model selected

#### Atlas Cloud vs Other Providers

| Feature | Atlas Cloud | Anthropic | OpenAI |
|---------|-------------|-----------|--------|
| **Setup Complexity** | Easy (one API key) | Easy | Easy |
| **Model Variety** | 7 LLMs + 100+ total | Claude 3/3.5 series | GPT-4o, o1, etc. |
| **Pricing** | $0.28-$0.69/M input | $3-$15/M input | $2.50-$15/M input |
| **Context Windows** | Up to 262K tokens | Up to 200K tokens | Up to 128K tokens |
| **Special Features** | Cost-effective diversity | Extended thinking | Function calling, o1 reasoning |
| **Best For** | Budget-conscious, multi-model | Production coding | General purpose, advanced reasoning |

#### Troubleshooting

| Issue | Solution |
|-------|----------|
| **API requests failing** | Verify API key at https://api.atlascloud.ai/v1/models |
| **Model not responding** | Check model ID format: `atlas/{model-id}` |
| **Wrong model being used** | Run `openclaw config get agents.defaults.model.primary` |
| **Provider not configured** | Check `models.providers.atlas` exists in config |
| **Context limit errors** | Switch to a model with larger context window |

> ⚠️ **Common Pitfall**: Model reference format
>
> The correct format is `atlas/{model-id}`, not `venice/{model-id}` or just `{model-id}`.
>
> ❌ Wrong: `venice/minimaxai/minimax-m2.1`
> ❌ Wrong: `minimaxai/minimax-m2.1`
> ✅ Correct: `atlas/minimaxai/minimax-m2.1`

---

### Integrating OpenClaw with Discord

| Aspect | Without Atlas Cloud | With Atlas Cloud |
|--------|---------------------|------------------|
| **Available Models** | Limited to configured provider | 100+ models available |
| **Cost** | Provider-dependent | Potentially lower costs |
| **Setup** | Simple API key entry | Simple API key entry |
| **Model Switching** | Requires reconfiguration | Easy model switching |

> ⚠️ **Common Pitfall**: Default model still shows as anthropic
>
> **Solution**: After setup, verify the agent model is set:
> ```bash
> openclaw config get agents.main.model
> # Should show: venice/zai-org/glm-4.7
> ```

---

### Integrating Openclaw with Discord

**Learning Objectives:**
- ✓ Create Discord application and bot
- ✓ Configure MESSAGE CONTENT INTENT
- ✓ Generate bot token and invite link
- ✓ Test Discord integration

**Time:** 20 minutes

#### Discord Integration Overview

```
User → Discord Server → Discord Bot → Openclaw Gateway → AI Response
```

#### Step-by-Step Setup

<details>
<summary>Click to expand Discord setup</summary>

1. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click **New Application**
   - Name it "Openclaw" or similar
   - Click **Create**

2. **Create Bot User**
   - Open the **Bot** tab
   - Click **Add Bot**
   - Copy the **Bot Token** (save this!)

3. **Enable Privileged Gateway Intents** ⚠️ IMPORTANT
   - In the Bot section, scroll to **Privileged Gateway Intents**
   - Enable:
     - ✅ **MESSAGE CONTENT INTENT** (Critical!)
     - ✅ Server Members Intent
   - Click **Save Changes**

4. **Configure OAuth2 Permissions**
   - Open **OAuth2** → **URL Generator**
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions:
     - Send Messages
     - Read Messages/View Channels
     - Read Message History
     - Add Reactions
   - Copy generated URL and open in browser
   - Authorize the bot for your server

5. **Configure in Openclaw**
   - In setup wizard, go to Step 3 (Channels)
   - Expand **Discord Bot** section
   - Paste the bot token
   - Click **Run Setup**
</details>

#### Discord Use Cases

| Use Case | Description |
|----------|-------------|
| **Server Assistant** | Answer questions in Discord servers |
| **Code Help** | Debug code snippets shared in Discord |
| **Image Generation** | Generate images in channels with Atlas Cloud |
| **Admin Commands** | `/help`, `/status`, `/reset` commands |

> ⚠️ **Common Mistake**: Forgetting MESSAGE CONTENT INTENT
>
> **Solution**: Always enable this intent or the bot won't receive message content!

---

### Integrating Openclaw with Telegram

**Learning Objectives:**
- ✓ Create Telegram bot via BotFather
- ✓ Configure bot permissions
- ✓ Test Telegram integration

**Time:** 15 minutes

#### Step-by-Step Setup

<details>
<summary>Click to expand Telegram setup</summary>

1. **Create Telegram Bot**
   - Open Telegram and search for **@BotFather**
   - Send `/newbot`
   - Follow prompts to name your bot
   - BotFather will give you a token like: `123456789:ABC...`

2. **Configure Bot Permissions**
   - With BotFather, use `/setprivacy` → **Disabled**
   - This allows the bot to read all messages

3. **Configure in Openclaw**
   - In setup wizard, go to Step 3 (Channels)
   - Expand **Telegram Bot** section
   - Paste the bot token
   - Click **Run Setup**
</details>

#### Telegram Use Cases

| Use Case | Description |
|----------|-------------|
| **Personal Assistant** | DM the bot for private conversations |
| **Group Chats** | Add bot to groups for collaborative assistance |
| **File Sharing** | Share code files for analysis |
| **Inline Queries** | Use `@botname query` inline in chats |

> ⚠️ **Common Mistake**: Bot privacy settings enabled
>
> **Solution**: Use `/setprivacy` → **Disabled** in BotFather

---

## Use Case Topics

### 24/7 Personal Assistance

**Learning Objectives:**
- ✓ Set up always-available AI assistant
- ✓ Configure for different time zones
- ✓ Handle multiple concurrent users

**Configuration:**
```javascript
// In openclaw.json
{
  "gateway": {
    "mode": "local",
    "port": 18789
  },
  "agents": {
    "main": {
      "model": "venice/zai-org/glm-4.7"
    }
  }
}
```

**Best Practices:**
- Use Railway's always-free tier for testing
- Configure auto-restart on failure
- Set up monitoring for gateway health

### OpenClaw Skills

**Learning Objectives:**
- ✓ Understand what Skills are and how they work
- ✓ Install skills from ClawHub
- ✓ Create custom skills
- ✓ Configure skill gating and permissions

**Time:** 30-45 minutes

#### What Are Skills?

OpenClaw uses **AgentSkills-compatible** skill folders to teach the agent how to use tools. Each skill is a directory containing:

- **`SKILL.md`** - Main file with YAML frontmatter and instructions
- **Optional supporting files** - Configs, scripts, or resources

```
my-skill/
├── SKILL.md          # Required: Skill definition and instructions
├── config.json       # Optional: Configuration
└── scripts/          # Optional: Helper scripts
```

#### Skill Locations & Precedence

Skills are loaded from **three** places, in order of precedence:

| Location | Priority | Scope | Path |
|----------|----------|-------|------|
| **Workspace Skills** | Highest | Per-agent only | `/skills` |
| **Managed/Local Skills** | Medium | All agents on machine | `~/.openclaw/skills` |
| **Bundled Skills** | Lowest | Shipped with install | Built-in |

If a skill name conflicts, **workspace skills win** → managed skills → bundled skills.

> **Tip:** In multi-agent setups, use workspace skills (`/skills`) for agent-specific capabilities, and managed skills (`~/.openclaw/skills`) for shared capabilities.

#### ClawHub: The Skills Registry

**ClawHub** is the public skills registry for OpenClaw. Browse at [clawhub.com](https://clawhub.com).

**Features:**
- 🔍 **Vector search** - Find skills by semantic meaning, not just keywords
- 📦 **Versioning** - Semver versioning with changelogs
- ⭐ **Community feedback** - Stars and comments
- 🔄 **One-line install** - `clawhub install <skill>`

##### Installing the ClawHub CLI

```bash
# Using npm
npm i -g clawhub

# Using pnpm
pnpm add -g clawhub

# Using bun
bun add -g clawhub
```

##### Common ClawHub Commands

```bash
# Search for skills
clawhub search "pdf"
clawhub search "database"

# Install a skill
clawhub install pdf
clawhub install trmnl-display

# List installed skills
clawhub list

# Update all skills
clawhub update --all

# Sync local skills to ClawHub (backup)
clawhub sync --all
```

#### Popular Skills from ClawHub

| Skill | Description | Use Case |
|-------|-------------|----------|
| **TRMNL Display** | Generate content for e-ink displays | IoT dashboards, status displays |
| **Pdf** | Comprehensive PDF toolkit | Extract text, fill forms, merge/split |
| **Skill Exporter** | Export skills as microservices | Docker + FastAPI deployment |
| **Clawpedia** | Shared knowledge base for agents | Collaborative AI knowledge |
| **Bags** | Solana launchpad integration | Crypto trading, token management |
| **Openwork** | Agent-only marketplace | Post jobs, earn tokens |
| **Yollomi** | Image/video generation | AI visual content creation |

#### Installing Skills

##### Method 1: Using ClawHub CLI (Recommended)

```bash
# Install into your workspace
clawhub install pdf

# Install a specific version
clawhub install pdf --version 2.1.0

# Force reinstall
clawhub install pdf --force
```

##### Method 2: Manual Installation

```bash
# Create the skills directory
mkdir -p ./skills/my-skill

# Download skill from ClawHub
# Visit: https://clawhub.com/skill/<skill-name>
# Download and extract to ./skills/my-skill/
```

##### Method 3: Railway Deployment

For Railway deployments, skills must be included in the Docker image:

```dockerfile
# In Dockerfile
COPY ./skills /data/.openclaw/skills
```

Or mount skills as a volume in Railway settings.

#### Creating Custom Skills

##### Basic Skill Template

Create a file at `./skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Brief description of what this skill does
metadata: { "openclaw": { "emoji": "🚀" } }
---

You are a specialized assistant for [specific task].

When the user asks for [task], use these tools:

1. Tool 1 - Description
2. Tool 2 - Description

Rules:
- Always confirm before taking destructive actions
- Provide clear explanations of your actions
```

##### Advanced Skill with Gating

```markdown
---
name: advanced-skill
description: Advanced skill with API key and binary requirements
metadata:
{
  "openclaw": {
    "emoji": "⚡",
    "requires": {
      "bins": ["python3", "git"],
      "env": ["MY_API_KEY"],
      "config": ["browser.enabled"]
    },
    "primaryEnv": "MY_API_KEY",
    "os": ["darwin", "linux"],
    "install": [
      {
        "id": "brew",
        "kind": "brew",
        "formula": "my-tool",
        "bins": ["my-tool"],
        "label": "Install My Tool (brew)"
      }
    ]
  }
}
---

# Advanced skill instructions here...

Use `{baseDir}` to reference the skill folder path.
```

##### Frontmatter Options

| Key | Type | Description |
|-----|------|-------------|
| `name` | string | Unique skill identifier |
| `description` | string | What the skill does |
| `metadata.openclaw.emoji` | string | Icon for UI display |
| `metadata.openclaw.requires.bins` | array | Required binaries on PATH |
| `metadata.openclaw.requires.env` | array | Required environment variables |
| `metadata.openclaw.primaryEnv` | string | Main API key variable |
| `user-invocable` | boolean | Expose as slash command (default: true) |
| `disable-model-invocation` | boolean | Only invoke via user command |
| `command-dispatch` | "tool" | Bypass model, call tool directly |

#### Learning Path for Skills

**Level 1: Beginner (Use Existing Skills)**

1. Install ClawHub CLI
2. Browse and search for skills
3. Install and test basic skills
4. Understand skill configuration

**Level 2: Intermediate (Create Simple Skills)**

1. Learn the `SKILL.md` structure
2. Understand gating mechanisms (`requires.bins`, `requires.env`)
3. Practice with simple utility skills
4. Test skills in local environment

**Level 3: Advanced (Complex Skills)**

1. Plugin integration - Bundle skills with plugins
2. Remote node skills - Cross-platform skills
3. Sandbox-aware skills - Container-compatible tools
4. Direct tool dispatch - `command-dispatch: tool`
5. Publish skills to ClawHub

#### Configuring Skills

Skills can be configured in `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "entries": {
      "my-skill": {
        "enabled": true,
        "apiKey": "API_KEY_HERE",
        "env": {
          "MY_API_KEY": "API_KEY_HERE"
        },
        "config": {
          "endpoint": "https://api.example.com",
          "model": "custom-model"
        }
      }
    },
    "load": {
      "watch": true,
      "watchDebounceMs": 250
    },
    "allowBundled": ["banana", "browser", "github"]
  }
}
```

**Configuration Keys:**

| Key | Purpose |
|-----|---------|
| `enabled` | Enable/disable the skill |
| `apiKey` | Convenience for `primaryEnv` |
| `env` | Inject environment variables |
| `config` | Custom per-skill configuration |
| `allowBundled` | Allowlist for bundled skills |

#### Example: Weather Skill

Create `./skills/weather-checker/SKILL.md`:

```markdown
---
name: weather-checker
description: Get current weather and forecasts for any location
metadata:
{
  "openclaw": {
    "emoji": "🌤️",
    "requires": { "env": ["WEATHER_API_KEY"] },
    "primaryEnv": "WEATHER_API_KEY"
  }
}
---

You are a weather assistant. Use the weather API to:

1. Get current weather for a city
2. Fetch 5-day forecasts
3. Check weather alerts/warnings

The API endpoint is: https://api.openweathermap.org/data/2.5

API Key: {env.WEATHER_API_KEY}

Always display temperatures in both Celsius and Fahrenheit.

When user asks for weather:
- Use the /weather endpoint for current conditions
- Use the /forecast endpoint for multi-day forecasts
- Include humidity, wind speed, and conditions
```

Configure the API key in Railway Variables:

```bash
WEATHER_API_KEY=your_openweathermap_api_key
```

Or in `openclaw.json`:

```json
{
  "skills": {
    "entries": {
      "weather-checker": {
        "enabled": true,
        "env": {
          "WEATHER_API_KEY": "your_api_key_here"
        }
      }
    }
  }
}
```

#### Publishing Skills to ClawHub

```bash
# Login to ClawHub
clawhub login

# Publish a skill
clawhub publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --tags latest \
  --changelog "Initial release"

# Sync all local skills
clawhub sync --all

# Update a skill
clawhub publish ./my-skill \
  --slug my-skill \
  --version 1.1.0 \
  --changelog "Added new feature"
```

#### Security Considerations

⚠️ **Treat third-party skills as untrusted code:**

- Read the `SKILL.md` and any scripts before enabling
- Prefer sandboxed runs for untrusted inputs
- Keep secrets out of prompts and logs
- `skills.entries.*.env` injects secrets into the host process

#### Troubleshooting Skills

| Issue | Solution |
|-------|----------|
| Skill not loading | Check `SKILL.md` syntax, verify path |
| Binary not found | Install required binary or add to PATH |
| API key errors | Set `skills.entries.<skill>.env` variable |
| Skill disabled | Set `enabled: true` in config |
| Token impact too high | Disable unused skills, use gating |

> **Token Impact:** Each skill adds ~97 characters + name/description length to the system prompt. Roughly 24 tokens per skill.

### Searching

Openclaw has built-in web search capabilities:

**Enable Web Search:**
```bash
# Set Brave API key
openclaw config set tools.web.braveApiKey YOUR_KEY

# Or use in setup wizard
```

**Usage:**
```
User: Search for the latest Openclaw release
Openclaw: [Searching...] Found version 2026.1.30
```

### Imaging and Video Generation

With Atlas Cloud integration:

**Image Generation:**
```javascript
// Available models:
- stability-ai/sdxl-turbo
- flux.1-dev
- midjourney-like models
```

**Video Generation:**
```javascript
// Available models:
- zeroscope/luma-dream-machine
- stable-video-diffusion
```

**Configuration:**
```bash
# Set image model
openclaw config set agents.main.model "venice/flux.1-dev"

# Generate image in chat
User: Generate an image of a sunset over mountains
```

### Financial Use Cases

**Applications:**
- Expense tracking and categorization
- Invoice processing (OCR + analysis)
- Financial report generation
- Market trend analysis

**Privacy Considerations:**
- Never share real financial data in public channels
- Use private DMs or self-hosted instances
- Redact sensitive numbers from logs

### Security Use Cases

**Applications:**
- Code vulnerability scanning
- Security audit automation
- Threat detection in logs
- Security policy documentation

**Best Practices:**
```javascript
// Enable security auditing
openclaw config set tools.exec.securityMode "ask"
openclaw config set tools.exec.safeBins ["/usr/bin/git"]

// Run security audit
openclaw security audit
```

### Privacy Best Practices

**Data Protection:**
1. **Use persistent volumes** - Data survives redeploys
2. **Set strong SETUP_PASSWORD** - Prevents unauthorized access
3. **Enable gateway authentication** - Token-based auth required
4. **Regular backups** - Export `/setup/export` regularly

**Log Redaction:**
```javascript
// Openclaw automatically redacts:
- API keys (partial)
- Passwords
- Sensitive tokens

// Verify:
openclaw config get logging.redaction
```

### Social Media Use Cases

**Platform-Specific Features:**

| Platform | Features |
|----------|----------|
| **Discord** | Slash commands, rich embeds, thread support |
| **Telegram** | Inline queries, file sharing, group chats |
| **Slack** | Workflow builder, slash commands, file uploads |

**Automation Examples:**
- Auto-moderation (content filtering)
- Scheduled posts
- Analytics reporting
- Community management

---

## Security Hardening

### How to Secure Login Console

**Current Implementation:**

The `/setup` wizard is protected by **HTTP Basic Authentication**:

```javascript
// src/server.js
function requireSetupAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, encoded] = header.split(" ");

  if (scheme !== "Basic" || !encoded) {
    res.set("WWW-Authenticate", 'Basic realm="Openclaw Setup"');
    return res.status(401).send("Auth required");
  }

  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const password = decoded.slice(decoded.indexOf(":") + 1);

  if (password !== SETUP_PASSWORD) {
    return res.status(401).send("Invalid password");
  }

  return next();
}
```

**Best Practices:**

1. **Use Strong Passwords**
   ```
   ❌ "password123"
   ✅ "P@ssw0rd!2026$Openclaw"
   ✅ Use Railway's ${{ secret() }} for random generation
   ```

2. **Enable HTTPS Only**
   - Railway automatically provides HTTPS
   - Redirect all HTTP traffic to HTTPS

3. **Change Password Regularly**
   - Rotate `SETUP_PASSWORD` periodically
   - Update in Railway Variables → Redeploy

### How to Redact Sensitive Information from Logs

**Openclaw's Built-in Redaction:**

Openclaw automatically redacts:
- API keys (shows first 4 and last 4 characters only)
- Passwords (fully redacted)
- Authentication tokens (partially redacted)

**Example Log Output:**
```
[onboard] Wrapper token: a1b2c3d4...5678 (length: 32)
[onboard] Config token:  a1b2c3d4...5678 (length: 32)
```

**Manual Log Redaction:**

For custom logging, use Openclaw's redaction utilities:

```javascript
import { redactApiKey } from '@openclaw/shared';

console.log(`Using API key: ${redactApiKey(apiKey)}`);
// Output: Using API key: sk-ant...xyz
```

**Environment Variable Redaction:**

```bash
# Don't log full API keys
echo "API_KEY configured"  # ✅ Good
echo "API_KEY=${API_KEY}"    # ❌ Bad - logs full key

# Use partial logging
echo "API_KEY=${API_KEY:0:8}..."  # ✅ Better - shows first 8 chars
```

### Security Checklist

- [ ] Strong `SETUP_PASSWORD` configured
- [ ] Gateway token authentication enabled
- [ ] HTTPS enforced (automatic on Railway)
- [ ] No plaintext credentials in logs
- [ ] Volume mounted at `/data` for persistence
- [ ] Firewall rules configured (if applicable)
- [ ] Regular security updates (`git pull` latest changes)

---

## Testing & Validation

### Testing Openclaw Installation

**Health Check Endpoint:**

```bash
curl https://your-app.up.railway.app/setup/healthz
# Should return: {"ok":true}
```

**Gateway Status:**

```bash
# SSH into Railway container
railway shell

# Check gateway status
openclaw status

# Check configuration
openclaw config get gateway
```

**Chat Test:**

1. Visit `/openclaw` (Control UI)
2. Send: "Hello, can you hear me?"
3. Verify response comes from configured model

### Testing Atlas Cloud Integration

**Step 1: Verify API Key**

```bash
curl -X GET "https://api.atlascloud.ai/v1/models" \
  -H "Authorization: Bearer YOUR_ATLAS_API_KEY"
```

**Step 2: Check Configuration**

```bash
# SSH into Railway container
railway shell

# Check agent model
openclaw config get agents.main.model
# Should return: "venice/zai-org/glm-4.7"

# Check auth profiles
cat /data/.openclaw/agents/main/agent/auth-profiles.json
# Should contain: {"default":{"provider":"venice","apiKey":"sk-..."}}
```

**Step 3: Test Chat**

```
User: What model are you using?
Openclaw: I'm using the GLM-4.7 model from Z.AI through Atlas Cloud.
```

### Testing Discord Integration

**Verification Steps:**

1. **Check Bot is Online**
   - Discord bot should show "Online" status

2. **Send Test Message**
   ```
   /help
   ```
   - Should display available commands

3. **Test in DM**
   - Direct message the bot
   - Should respond to messages

4. **Test in Group**
   - Add bot to a group
   - Mention the bot: `@botname help`

> ⚠️ **Common Issue**: Bot not responding
>
> **Check**:
> - MESSAGE CONTENT INTENT enabled?
> - Bot invited to server?
> - Token correctly pasted?

### Testing Telegram Integration

**Verification Steps:**

1. **Find Bot on Telegram**
   - Search for your bot username
   - Start conversation

2. **Test Commands**
   ```
   /start
   /help
   ```

3. **Test Group Chat**
   - Add bot to a group
   - Send: `/help` or mention bot

---

## Troubleshooting

### Common Deployment Issues

| Issue | Solution |
|-------|----------|
| **Build fails** | Check Dockerfile syntax, verify build logs |
| **Container crashes** | Check Railway logs for error messages |
| **Volume not mounted** | Verify Volume is configured at `/data` |
| **SETUP_PASSWORD not working** | Clear browser cache, verify variable is set |

### Atlas Cloud Integration Issues

**Issue:** "No API key found for provider 'anthropic'"

**Cause:** Agent model not configured to use Venice provider

**Solution:**
```bash
# SSH into container
railway shell

# Set agent model
openclaw config set agents.main.model "venice/zai-org/glm-4.7"

# Restart gateway
openclaw gateway restart
```

**Issue:** "unknown option '--venice-api-key'"

**Cause:** Using old version of Openclaw (pre-2026.1.29)

**Solution:**
- Ensure template builds from `main` branch
- Check Dockerfile `ARG OPENCLAW_GIT_REF=main`

**Issue:** API requests to Atlas Cloud failing

**Troubleshooting:**
```bash
# Test API key directly
curl -H "Authorization: Bearer YOUR_KEY" \
  https://api.atlascloud.ai/v1/models

# Check base URL configuration
openclaw config get env.ATLAS_API_BASE
# Should return: "https://api.atlascloud.ai/v1/"

# Check model configuration
openclaw config get env.ATLAS_API_MODEL
# Should return: "zai-org/glm-4.7"
```

### Discord Integration Issues

**Issue:** Bot not responding to messages

**Checklist:**
- [ ] MESSAGE CONTENT INTENT enabled
- [ ] Bot invited to server
- [ ] Bot token correct
- [ ] Gateway running

**Debug:**
```bash
# Check Discord channel status
openclaw channels status discord

# Check gateway logs
railway logs
```

**Issue:** "disallowed intents" error

**Solution:**
1. Go to Discord Developer Portal
2. Your App → Bot → Privileged Gateway Intents
3. Enable MESSAGE CONTENT INTENT
4. Save Changes
5. Restart Openclaw gateway

### Telegram Integration Issues

**Issue:** Bot can't read messages

**Solution:**
```
In BotFather:
/newbot
/setprivacy → Disabled
```

**Issue:** Bot commands not working

**Solution:**
```bash
# Check bot permissions
# In BotFather:
/mybots
→ Select your bot
→ Bot Settings → Allow Groups? (if needed)
```

### Getting Help

If issues persist:

1. **Check Logs**
   ```bash
   railway logs
   # Or in container:
   tail -f /var/log/openclaw.log
   ```

2. **Run Diagnostics**
   ```bash
   openclaw doctor
   ```

3. **Community Resources**
   - [Openclaw GitHub Issues](https://github.com/openclaw/openclaw/issues)
   - [Openclaw Documentation](https://docs.openclaw.ai/)
   - [Discord Community](https://discord.gg/openclaw)

4. **Reset Configuration**
   ```
   Visit: /setup
   Click: "Reset Configuration"
   Re-run setup wizard
   ```

---

## Progress Tracker

Use this checklist to track your progress through the tutorial:

### Phase 1: Deployment
- [ ] Prerequisites completed
- [ ] Railway account created
- [ ] Atlas Cloud API key obtained
- [ ] Repository cloned/forked
- [ ] Railway project deployed
- [ ] Volume configured at `/data`
- [ ] `SETUP_PASSWORD` set
- [ ] Health check passing

### Phase 2: Configuration
- [ ] Setup wizard completed
- [ ] AI provider configured
- [ ] Gateway running
- [ ] Control UI accessible

### Phase 3: Integrations
- [ ] Atlas Cloud API key obtained
- [ ] Atlas Cloud model selected in setup wizard
- [ ] Atlas Cloud integration tested (chat response)
- [ ] Verified correct model is being used
- [ ] Discord bot configured (optional)
- [ ] Telegram bot configured (optional)
- [ ] Test messages sent and received

### Phase 4: Validation
- [ ] Chat test successful
- [ ] API key verified
- [ ] Configuration validated
- [ ] Integration tested

### Phase 5: Advanced Skills (Optional)
- [ ] ClawHub CLI installed
- [ ] Explored available skills on ClawHub
- [ ] Installed at least one skill from ClawHub
- [ ] Tested installed skill functionality
- [ ] Created a custom skill
- [ ] Configured skill gating (bins/env/config)
- [ ] Published or backed up skills to ClawHub
- [ ] Web search configured
- [ ] Custom agents created
- [ ] Security hardening applied

---

## Knowledge Check

Test your understanding:

<details>
<summary>1. How does OpenClaw integrate with Atlas Cloud?</summary>

**Answer:** OpenClaw configures Atlas Cloud as a **custom provider** using its **OpenAI-compatible API**.

The integration:
1. Uses Atlas Cloud's endpoint: `https://api.atlascloud.ai/v1/`
2. Maps the API key to `OPENAI_API_KEY` environment variable
3. Sets `api: "openai-completions"` for OpenAI-compatible format
4. Creates provider at `models.providers.atlas`
5. Sets model reference as `atlas/{model-id}`

No "Venice" provider is used - that's outdated information.
</details>

<details>
<summary>2. What is the correct model reference format for Atlas Cloud models?</summary>

**Answer:** `atlas/{model-id}`

Examples:
- `atlas/minimaxai/minimax-m2.1` (default)
- `atlas/deepseek-ai/deepseek-r1`
- `atlas/zai-org/glm-4.7`
- `atlas/kwai-kat/kat-coder-pro`
- `atlas/moonshot-ai/moonshot-v1-128k`
- `atlas/zhipu-ai/glm-4-5b-plus`
- `atlas/qwen/qwen-2.5-coder-32b-instruct`

This is set via: `openclaw config set agents.defaults.model.primary "atlas/{model-id}"`
</details>

<details>
<summary>3. What privileged gateway intent is required for Discord?</summary>

**Answer:** MESSAGE CONTENT INTENT

This is critical - without it, the bot cannot read message content.
</details>

<details>
<summary>4. How do you reset the Openclaw configuration?</summary>

**Answer:** Visit `/setup` and click "Reset Configuration" to delete the config file and re-run the wizard.
</details>

<details>
<summary>5. What environment variable must be set for Railway deployment?</summary>

**Answer:** `SETUP_PASSWORD` - This protects the `/setup` wizard and is also used as the gateway authentication token.
</details>

<details>
<summary>6. What is the precedence order for skill locations in OpenClaw?</summary>

**Answer:** Workspace skills (`/skills`) → Managed skills (`~/.openclaw/skills`) → Bundled skills

Workspace skills have the highest priority, allowing per-agent customization. Managed skills are shared across all agents on the machine, while bundled skills are shipped with the installation.
</details>

<details>
<summary>7. How do you install a skill from ClawHub?</summary>

**Answer:** Use the ClawHub CLI:
```bash
clawhub install <skill-name>
# Example: clawhub install pdf
```

This installs the skill into `./skills` (workspace skills), which takes precedence over bundled skills.
</details>

<details>
<summary>8. What are the 7 Atlas Cloud models available in the setup wizard?</summary>

**Answer:**
1. **MiniMax M2.1** - Default, 197K context, $0.30/$1.20 per M
2. **DeepSeek R1** - Reasoning-focused, 164K context, $0.28/$0.40 per M
3. **Z.AI GLM-4.7** - Chinese-optimized, 203K context, $0.52/$1.95 per M
4. **KwaiKAT Coder Pro** - Large context (256K), $0.30/$1.20 per M
5. **Moonshot V1 128K** - Long documents, 262K context, $0.60/$2.50 per M
6. **Zhipu GLM-4 5B Plus** - Cost-effective, 203K context, $0.44/$1.74 per M
7. **Qwen 2.5 Coder 32B** - Code-specialized, 262K context, $0.69/$2.70 per M
</details>

<details>
<summary>9. Which Atlas Cloud model should you use for the lowest cost?</summary>

**Answer:** **DeepSeek R1** has the lowest pricing:
- Input: $0.28 per million tokens
- Output: $0.40 per million tokens

It's also optimized for reasoning tasks with chain-of-thought capabilities.
</details>

---

## Next Steps

After completing this tutorial:

1. **Explore OpenClaw Skills**
   - Browse ClawHub: https://clawhub.com
   - Search for skills: `clawhub search "pdf"`
   - Install a skill: `clawhub install pdf`
   - Create your first custom skill using the template above

2. **Configure Web Search**
   - Get Brave API key: https://brave.com/search/api/
   - Set in config: `openclaw config set tools.web.braveApiKey YOUR_KEY`

3. **Join the Community**
   - Discord: [OpenClaw Discord](https://discord.gg/openclaw)
   - GitHub: [OpenClaw Discussions](https://github.com/openclaw/openclaw/discussions)
   - Reddit: [r/OpenClaw](https://reddit.com/r/OpenClaw)

4. **Advanced Topics**
   - Multi-agent setups for specialized tasks
   - Custom skill development and publishing to ClawHub
   - Performance optimization and token management
   - Sandbox configuration for secure skill execution

5. **Stay Updated**
   - Watch for new releases: https://github.com/openclaw/openclaw/releases
   - Read CHANGELOG: https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md
   - Follow Skills Documentation: https://docs.openclaw.ai/tools/skills

---

## References

### Official Documentation
- **Openclaw GitHub**: https://github.com/openclaw/openclaw
- **Openclaw Releases**: https://github.com/openclaw/openclaw/releases
- **CHANGELOG**: https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md
- **Documentation**: https://docs.openclaw.ai/
- **Providers Guide**: https://docs.openclaw.ai/providers
- **Skills Guide**: https://docs.openclaw.ai/tools/skills
- **ClawHub**: https://clawhub.com

### Atlas Cloud Resources
- **Atlas Cloud**: https://www.atlascloud.ai/
- **Documentation**: https://www.atlascloud.ai/docs
- **API Reference**: https://www.atlascloud.ai/docs/en/models/get-start
- **Model List**: https://www.atlascloud.ai/models
- **Models API**: https://api.atlascloud.ai/v1/models (test your API key here)

### Platform Documentation
- **Railway**: https://railway.app/docs
- **Discord Developers**: https://discord.com/developers/applications
- **Telegram BotFather**: https://t.me/BotFather

### Community
- **Openclaw Discord**: https://discord.gg/openclaw
- **Openclaw Reddit**: https://reddit.com/r/OpenClaw
- **Twitter/X**: [@OpenClawAI](https://twitter.com/OpenClawAI)

---

## Bonus: Advanced Integrations

Beyond the core integrations covered in this tutorial, OpenClaw can be extended with powerful third-party services.

### Magic Patterns: AI-Powered UI Generation

[**Magic Patterns**](https://www.magicpatterns.com) is an AI design platform that generates production-ready UI designs from text descriptions. When integrated with OpenClaw, it enables:

- **Visual Prototyping** - Generate UI mockups from natural language
- **Code Export** - Get production-ready React, Vue, or HTML code
- **Design System Integration** - Use custom presets for brand consistency
- **Team Collaboration** - Share preview URLs for feedback

#### Quick Example

```
User: Create a login page with email/password fields and social login buttons

OpenClaw: [Calls Magic Patterns API]
→ Generated preview: https://abc123-preview.magicpatterns.app
→ Source code exported to workspace
→ Editor URL: https://www.magicpatterns.com/c/abc123
```

#### Learn More

📖 **[Complete Integration Guide →](./MAGICPATTERNS_INTEGRATION.md)**

The guide covers:
- Magic Patterns API setup and authentication
- OpenClaw skill implementation
- Railway deployment configuration
- Usage examples and best practices
- Troubleshooting common issues

#### Integration Highlights

| Feature | Description |
|---------|-------------|
| **Text-to-UI** | Generate designs from natural language |
| **Multiple Presets** | Tailwind, shadcn/ui, Chakra UI, Mantine |
| **Code Export** | Production-ready source code |
| **Hosted Previews** | Share designs without rendering |

#### Prerequisites

- Magic Patterns account with API key
- `MAGICPATTERNS_API_KEY` environment variable
- OpenClaw skill installed (see guide)

---

## Tutorial Feedback

Found an issue with this tutorial? Have suggestions for improvement?

1. **Report Issues**: https://github.com/[your-username]/openclaw-railway-template-easy-config/issues
2. **Submit PR**: Improve the tutorial directly
3. **Discussions**: Start a discussion on GitHub

---

**Version:** 1.0
**Last Updated:** 2026-02-01
**Openclaw Version:** 2026.1.30+
