# Openclaw Railway Template (1‑click deploy)

This repo packages **Openclaw** for Railway with a small **/setup** web wizard so users can deploy and onboard **without running any commands**.

## What you get

- **Openclaw Gateway + Control UI** (served at `/` and `/openclaw`)
- A friendly **Setup Wizard** at `/setup` (protected by a password)
- Persistent state via **Railway Volume** (so config/credentials/memory survive redeploys)
- One-click **Export backup** (so users can migrate off Railway later)
- **7 Pre-installed Skills** from ClawHub:
  - **gog** - Google Workspace CLI (Gmail, Calendar, Drive, Contacts, Sheets, Docs)
  - **summarize** - Summarize URLs/files (web, PDFs, images, audio, YouTube)
  - **weather** - Weather forecasts (no API key required)
  - **skill-creator** - Create custom skills
  - **daily-ai-news** - AI news aggregator
  - **market-news-analyst** - Financial market analysis
  - **pdf** - PDF manipulation toolkit

## How it works (high level)

- The container runs a wrapper web server.
- The wrapper protects `/setup` with `SETUP_PASSWORD`.
- During setup, the wrapper runs `openclaw onboard --non-interactive ...` inside the container, writes state to the volume, and then starts the gateway.
- After setup, **`/` is Openclaw**. The wrapper reverse-proxies all traffic (including WebSockets) to the local gateway process.

## Railway deploy instructions

Create a new template in Railway with these steps:

1. **Create a new template** from this GitHub repo
2. **Add a Volume** mounted at `/data`
3. **Set one environment variable**:
   - `SETUP_PASSWORD` — Your password to access the setup wizard and authenticate with the gateway
4. **Enable Public Networking** (HTTP) — Railway will assign a domain like `https://your-app.up.railway.app`
5. **Deploy**

That's it! Railway automatically provides `RAILWAY_PUBLIC_DOMAIN` which the template uses to configure OpenClaw's allowedOrigins for WebSocket connections.

**Note**: For custom domains, set `PUBLIC_URL` to your custom domain (e.g., `https://custom.example.com`).

## Getting started

After deployment:

1. Visit `https://<your-app>.up.railway.app/setup`
2. Login with your `SETUP_PASSWORD`
3. Select your AI provider and enter your API key
4. Optionally configure messaging channels (Telegram, Discord, Slack)
5. Click "Run Setup" and you're done!

The setup wizard supports these AI providers:
- **Anthropic** (Claude) - Recommended
- **OpenAI** (GPT models)
- **Google** (Gemini)
- **OpenRouter**
- **Atlas Cloud** - [See testing guide →](docs/ATLAS_CLOUD_TESTING.md) *(NEW: Model selection)*
- **Vercel AI Gateway**
- **Moonshot AI**
- **Z.AI (GLM 4.7)**
- **MiniMax**
- **Qwen**
- **Synthetic**
- **OpenCode Zen**

## Getting chat tokens (so you don’t have to scramble)

### Telegram bot token

1. Open Telegram and message **@BotFather**
2. Run `/newbot` and follow the prompts
3. BotFather will give you a token that looks like: `123456789:AA...`
4. Paste that token into `/setup`

### Discord bot token

1. Go to the Discord Developer Portal: https://discord.com/developers/applications
2. **New Application** → pick a name
3. Open the **Bot** tab → **Add Bot**
4. Copy the **Bot Token** and paste it into `/setup`
5. Invite the bot to your server (OAuth2 URL Generator → scopes: `bot`, `applications.commands`; then choose permissions)

### Google OAuth credentials (for gog skill)

The **gog** skill provides Google Workspace CLI access (Gmail, Calendar, Drive, Contacts, Sheets, Docs). To set up Google OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Workspace APIs you need (Gmail, Calendar Drive, etc.)
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth client ID**
6. Choose **Desktop app** as the application type
7. Download the JSON file and rename it to `client_secret.json`

**To use with Railway (recommended - secure):**

1. Encode your `client_secret.json` to base64:
   ```bash
   base64 -w 0 client_secret.json
   ```

2. Add the base64 string as a Railway environment variable:
   - Name: `GOOGLE_CLIENT_SECRET_BASE64`
   - Value: `<paste the base64 string>`

3. Redeploy your service. The credentials will be automatically decoded and stored securely in the persistent volume.

**The credentials file will persist** across container rebuilds thanks to the Railway Volume mounted at `/data`.

## Local testing

```bash
# Build the container
docker build -t openclaw-railway-template .

# Run locally (only need SETUP_PASSWORD!)
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e SETUP_PASSWORD=test \
  -v $(pwd)/.tmpdata:/data \
  openclaw-railway-template

# Open http://localhost:8080/setup
# Password: test
```

## Documentation

- **[Atlas Cloud Testing Guide](docs/ATLAS_CLOUD_TESTING.md)** - Step-by-step guide for deploying and testing OpenClaw with Atlas Cloud on Railway
- **[Learning OpenClaw Tutorial](docs/learning-openclaw-tutorial.md)** - Comprehensive deployment and configuration tutorial
- **[Magic Patterns Integration](docs/MAGICPATTERNS_INTEGRATION.md)** - Guide to integrating Magic Patterns AI design generation with OpenClaw
- **[Patient Portal Testing Guide](docs/PATIENT_PORTAL_TESTING_GUIDE.md)** - How to test the Patient Health Portal Helper skill with real credentials
- **[Patient Assistant System](docs/PATIENT_ASSISTANT.md)** - Complete patient personal assistant documentation
