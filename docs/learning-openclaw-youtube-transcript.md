# OpenClaw on Railway - Complete Deployment Tutorial (YouTube Transcript)

> A YouTube video script based on the Learning OpenClaw Tutorial

**Video Title:** Deploy OpenClaw AI Coding Assistant to Railway in 10 Minutes (Complete Guide)
**Estimated Duration:** 25-30 minutes
**Difficulty:** Beginner to Intermediate

---

## Transcript

### [0:00] - Intro

**[Visual: Thumbnail showing OpenClaw logo + Railway logo + "Deploy in 10 Minutes"]**

**Host (on camera):**
"What if you could deploy your own AI coding assistant to the cloud in just 10 minutes - without writing a single deployment script?

Hi, I'm [Your Name], and today I'm going to show you how to deploy OpenClaw - an open-source AI coding assistant - to Railway. OpenClaw is like having your own personal Claude or ChatGPT that can read your codebase, write code, and even integrate with Discord, Telegram, and Slack.

By the end of this video, you'll have:
- A fully functional AI assistant running in the cloud
- Integration with Atlas Cloud for affordable AI models
- Optional messaging platform integrations
- Persistent storage that survives redeploys

Let's dive in!"

**[Visual: Screen recording of final OpenClaw UI running on Railway]**

---

### [1:30] - What is OpenClaw?

**[Visual: Animated diagram of OpenClaw architecture]**

**Host (voiceover):**
"First, let's talk about what OpenClaw actually is. OpenClaw is an open-source AI coding assistant platform that gives you:

- **AI-powered code generation** - It can write, refactor, and debug code
- **Multi-platform integration** - Use it in Discord, Telegram, Slack, or a web UI
- **Multiple AI providers** - Anthropic, OpenAI, Google, Atlas Cloud, and more
- **Extensible via Skills** - Add custom capabilities like a package manager
- **Self-hosted** - Your data stays on your servers

It's like having a senior developer available 24/7, and it works with popular AI models including Claude, GPT-4, and cost-effective options from Atlas Cloud."

---

### [3:00] - Prerequisites

**[Visual: Checklist on screen]**

**Host (on camera):**
"Before we start, you'll need a few things:

**Required Accounts:**
- A **Railway account** - There's a free tier, and paid plans start around $5/month
- An **Atlas Cloud API key** - This is for the AI models. They have a free tier plus pay-per-use
- A **GitHub account** - For connecting your repository to Railway

**Required Tools:**
- Git installed on your computer
- Docker is optional, just for local testing

That's it! If you have these three accounts, you're ready to go."

**[Visual: Screen recording showing sign-up pages for each service]**

---

### [4:30] - Getting Your Atlas Cloud API Key

**[Visual: Screen recording of Atlas Cloud website]**

**Host (voiceover):**
"First, let's get your Atlas Cloud API key. Atlas Cloud gives you access to multiple AI models at competitive prices.

**Step 1:** Go to atlascloud.ai and sign up or log in.

**Step 2:** Click on Settings in the navigation menu.

**Step 3:** Scroll down to API Key Management.

**Step 4:** Click 'Create API Key' and copy the generated key.

**Important:** Save this key securely! You'll need it in just a few minutes. Atlas Cloud offers several models including MiniMax M2.1 for general coding, DeepSeek R1 for reasoning tasks, and GLM-4.7 for Chinese language support."

---

### [6:00] - Deploying to Railway

**[Visual: Screen recording of Railway deployment]**

**Host (on camera):**
"Now let's deploy to Railway. I'll show you two methods, but we'll use the GitHub method since it's the most reliable.

**Step 1:** First, you need the code. Go to the GitHub repository for the OpenClaw Railway template and click 'Use this template' or fork it to your own account.

**Step 2:** Go to railway.app and click 'New Project.'

**Step 3:** Select 'Deploy from GitHub repo' and choose the repository you just forked.

**Step 4:** Click 'Deploy Now' and wait for Railway to build the container.

Railway will automatically detect the Dockerfile and build OpenClaw from source. This might take a few minutes on the first deploy."

**[Visual: Progress bar showing build process]**

---

### [8:00] - Configuring Railway Variables

**[Visual: Railway Variables settings screen]**

**Host (voiceover):**
"While that's building, let's configure the required environment variables.

**Step 1:** Go to your project settings, then click on 'Variables.'

**Step 2:** Add these variables:

1. **SETUP_PASSWORD** - Click the lock icon to generate a secure password. This protects your setup wizard.

2. **OPENCLAW_GATEWAY_TOKEN** - Also generate a secure token. This authenticates requests to the AI gateway.

3. **OPENCLAW_STATE_DIR** - Set to `/data/.openclaw`

4. **OPENCLAW_WORKSPACE_DIR** - Set to `/data/workspace`

These paths point to a persistent volume, which means your configuration and data will survive redeploys."

---

### [9:30] - Adding a Volume for Persistence

**[Visual: Railway Volume settings]**

**Host (on camera):**
"This is a critical step - you need to add a Volume for persistent storage.

**Step 1:** Go to Settings, then click on 'Volumes.'

**Step 2:** Click 'New Volume.'

**Step 3:** Set the mount path to `/data` and click 'Create Volume.'

**Step 4:** Make sure the volume is attached to your service.

Without this volume, every time Railway redeploys your container, you'd lose all your configuration and have to set everything up again. The volume keeps your data safe."

---

### [10:30] - Accessing the Setup Wizard

**[Visual: Browser showing Railway deployment URL]**

**Host (voiceover):**
"Once the deployment completes, you'll see a green status indicator. Find your public URL in the Networking section - it will look something like `https://your-app.up.railway.app`.

Now, add `/setup` to the end of that URL and visit it in your browser.

You'll be prompted for a password. Enter the SETUP_PASSWORD you configured earlier.

This is the OpenClaw setup wizard - a friendly web interface that handles all the configuration for you."

**[Visual: Screen recording of setup wizard]**

---

### [11:30] - Step 1: Welcome

**[Visual: Setup wizard welcome screen]**

**Host (on camera):**
"The setup wizard has 5 steps. Let's walk through them together.

**Step 1 is the Welcome screen.** Click 'Get Started' to begin.

This wizard is going to configure your AI provider, set up your gateway, and optionally configure messaging channels - all without you having to write a single line of configuration or run any commands."

---

### [12:00] - Step 2: Configure Authentication

**[Visual: Auth provider selection screen]**

**Host (voiceover):**
"**Step 2 is where you configure your AI provider.**

For this tutorial, we're using Atlas Cloud. In the Provider Group dropdown, select 'Atlas Cloud - API key.'

Then in the Auth Method dropdown, select 'Atlas Cloud API key.'

Paste the API key you got earlier from Atlas Cloud.

**New Feature:** Below that, you'll see 'Atlas Cloud Model' - this lets you choose which specific AI model to use. The options include:

- **MiniMax M2.1** (default) - Great for general coding, fast response times
- **DeepSeek R1** - Optimized for reasoning and complex logic
- **Z.AI GLM-4.7** - Best for Chinese language
- **KwaiKAT Coder Pro** - Has a huge 256K context window for large files
- **Moonshot V1 128K** - Also great for long documents
- **Zhipu GLM-4 5B Plus** - Most cost-effective option
- **Qwen 2.5 Coder 32B** - Specialized for code

For most coding tasks, I recommend starting with MiniMax M2.1.

For the Wizard Flow, select 'Quickstart' to use sensible defaults."

---

### [14:00] - Step 3: Channels (Optional)

**[Visual: Channels configuration screen]**

**Host (on camera):**
"**Step 3 is for messaging channels - this is completely optional.**

If you want to use OpenClaw in Discord, Telegram, or Slack, you can configure those here. Each platform requires a bot token that you get from their respective developer portals.

If you're just getting started, I recommend skipping this for now. You can always add channels later through the OpenClaw control panel.

Click 'Next' to continue."

---

### [15:00] - Step 4: Review

**[Visual: Review screen showing all settings]**

**Host (voiceover):**
"**Step 4 is the review screen.** Here you can see all your settings at a glance:

- Your AI provider (Atlas Cloud)
- The model you selected
- Any channels you configured

If everything looks good, check the confirmation box and click 'Run Setup.'

The wizard will now configure OpenClaw in the background. This typically takes 30-60 seconds."

**[Visual: Progress animation during setup]**

---

### [16:00] - Step 5: Complete

**[Visual: Completion screen]**

**Host (on camera):**
"Once setup completes, you'll see the success screen!

Click 'Open OpenClaw UI' to access your AI coding assistant.

This is the OpenClaw Control UI - your web-based interface to chat with the AI, manage your workspace, and configure settings.

Let's test it out!"

**[Visual: OpenClaw Control UI]**

---

### [17:00] - Testing Your Deployment

**[Visual: Typing test message in OpenClaw UI]**

**Host (voiceover):**
"Let's send a test message to make sure everything is working.

Type: 'Hello! Can you explain what you are?'

OpenClaw should respond that it's an AI coding assistant powered by the model you selected.

Let's try something more useful. Ask it: 'Can you write a Python function to calculate fibonacci numbers?'

Watch as OpenClaw generates the code, explains it, and even provides examples."

**[Visual: Code generation in action]**

---

### [18:30] - Testing via API

**[Visual: Terminal with curl command]**

**Host (on camera):**
"You can also interact with OpenClaw via API if you want to build your own integrations.

Here's a curl command to test the chat completions endpoint:

```bash
curl -X POST "https://your-app.up.railway.app/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "atlas/minimaxai/minimax-m2.1",
    "messages": [
      {"role": "user", "content": "Say hello!"}
    ]
  }'
```

Replace `your-app` with your actual Railway URL and `YOUR_GATEWAY_TOKEN` with the token you configured earlier."

---

### [19:30] - Monitoring and Logs

**[Visual: Railway logs screen]**

**Host (voiceover):**
"It's important to know how to monitor your deployment. Railway provides real-time logs.

Go to your service in Railway and click on the 'Logs' tab. Here you can see:

- Gateway startup messages
- API calls to Atlas Cloud
- Any errors that occur

Key log entries to look for:
- `[gateway] starting with command: ...` - Shows the gateway is starting
- `[gateway] ready at http://127.0.0.1:18789` - Confirms the gateway is ready
- Any error messages that might indicate configuration problems"

---

### [20:30] - Backups and Exports

**[Visual: Export function in setup wizard]**

**Host (on camera):**
"One of the great features of this Railway template is the backup export function.

If you ever want to migrate off Railway or just want a local backup of your configuration and workspace:

1. Visit `/setup` in your browser
2. Scroll down and click 'Export Backup'
3. You'll get a `.tar.gz` file containing all your data

This includes your configuration, API keys, workspace files, and agent memory - everything you need to restore or migrate your setup."

---

### [21:30] - Atlas Cloud Models Reference

**[Visual: Table of Atlas Cloud models with pricing]**

**Host (voiceover):**
"Let me give you a quick reference for the Atlas Cloud models available:

| Model | Context | Input Price | Output Price | Best For |
|-------|---------|-------------|--------------|----------|
| MiniMax M2.1 | 197K | $0.30/M | $1.20/M | General coding |
| DeepSeek R1 | 164K | $0.28/M | $0.40/M | Reasoning tasks |
| Z.AI GLM-4.7 | 203K | $0.52/M | $1.95/M | Chinese language |
| KwaiKAT Coder Pro | 256K | $0.30/M | $1.20/M | Large codebases |
| Moonshot V1 128K | 262K | $0.60/M | $2.50/M | Long documents |
| Zhipu GLM-4 5B Plus | 203K | $0.44/M | $1.74/M | Cost efficiency |
| Qwen 2.5 Coder 32B | 262K | $0.69/M | $2.70/M | Code specialization |

If you're looking for the lowest cost, go with DeepSeek R1. For the best balance of speed and quality, MiniMax M2.1 is a great choice."

---

### [22:30] - OpenClaw Skills

**[Visual: ClawHub website screenshot]**

**Host (on camera):**
"One of the most powerful features of OpenClaw is Skills - add-on capabilities that extend what the AI can do.

OpenClaw uses a system called AgentSkills, and there's a public registry called ClawHub at clawhub.com.

Popular skills include:
- **PDF** - Comprehensive PDF toolkit
- **TRMNL Display** - Generate content for e-ink displays
- **Skill Exporter** - Export skills as microservices
- And many more!

To install a skill, you use the ClawHub CLI:

```bash
npm i -g clawhub
clawhub install pdf
```

Skills are automatically loaded into your OpenClaw instance."

---

### [23:30] - Troubleshooting Common Issues

**[Visual: Troubleshooting checklist]**

**Host (voiceover):**
"Let's cover some common issues you might encounter:

**Issue: Build fails**
- Solution: Check the Dockerfile syntax and verify build logs

**Issue: Volume not mounted**
- Solution: Make sure you created a volume at `/data` and attached it to your service

**Issue: SETUP_PASSWORD not working**
- Solution: Clear your browser cache and verify the variable is set in Railway

**Issue: Token errors when chatting**
- Solution: Make sure OPENCLAW_GATEWAY_TOKEN is set and the gateway is running

**Issue: Atlas Cloud API errors**
- Solution: Verify your API key is valid and has credits

For more help, check the documentation links in the description below."

---

### [24:30] - Next Steps

**[Visual: Summary of next steps]**

**Host (on camera):**
"Congratulations! You now have OpenClaw running on Railway. Here are some next steps you might want to explore:

1. **Configure messaging channels** - Add Discord, Telegram, or Slack integration
2. **Install Skills** - Explore ClawHub for useful add-ons
3. **Configure web search** - Enable Brave API for web search capabilities
4. **Create custom skills** - Build your own specialized tools
5. **Join the community** - Check out the OpenClaw Discord and GitHub discussions

All the links you need are in the description below."

---

### [25:30] - Outro

**[Visual: Host on camera]**

**Host:**
"Thanks for watching this complete guide to deploying OpenClaw on Railway!

You've learned:
- How to deploy OpenClaw to Railway in just 10 minutes
- How to configure Atlas Cloud for affordable AI models
- How to use the setup wizard for zero-configuration deployment
- How to test your deployment and troubleshoot issues

If you found this video helpful, please give it a like and subscribe for more tutorials on AI, cloud deployment, and developer tools.

And let me know in the comments - what would YOU build with your own AI coding assistant?

Until next time, happy coding!"

**[Visual: End screen with subscribe button and related videos]**

---

## Video Metadata

### Tags
`openclaw` `railway` `ai coding assistant` `claude` `chatgpt` `cloud deployment` `atlas cloud` `docker` `devops` `tutorial`

### Description (for YouTube)

Deploy your own AI coding assistant to the cloud in just 10 minutes! In this complete tutorial, I'll show you how to deploy OpenClaw - an open-source AI coding platform - to Railway.

You'll learn:
- How to deploy OpenClaw to Railway with zero configuration
- How to set up Atlas Cloud for affordable AI models
- How to use the web-based setup wizard
- How to test and troubleshoot your deployment

OpenClaw integrates with Discord, Telegram, Slack, and works with Claude, GPT-4, and other AI models. It's like having your own AI pair programmer available 24/7!

**Timestamps:**
0:00 - Intro
1:30 - What is OpenClaw?
3:00 - Prerequisites
4:30 - Getting Atlas Cloud API Key
6:00 - Deploying to Railway
8:00 - Configuring Variables
9:30 - Adding Persistent Volume
10:30 - Accessing Setup Wizard
11:30 - Setup Wizard Walkthrough
17:00 - Testing Your Deployment
18:30 - API Testing
20:30 - Monitoring & Logs
21:30 - Backups & Exports
22:30 - Atlas Cloud Models Reference
23:30 - OpenClaw Skills
24:30 - Troubleshooting
25:30 - Outro

**Links:**
- OpenClaw: https://github.com/openclaw/openclaw
- Railway: https://railway.app
- Atlas Cloud: https://www.atlascloud.ai
- ClawHub: https://clawhub.com
- Full Tutorial: https://github.com/[your-repo]/blob/main/docs/learning-openclaw-tutorial.md

### Thumbnail Text Suggestions

```
Deploy AI Assistant
to Railway
10 Minutes
No Config Needed!
```

```
OpenClaw + Railway
Your Own AI
Coding Assistant
Complete Guide
```

---

## Production Notes

### Equipment Needed
- Microphone (USB or XLR)
- Webcam or screen recording software
- Good lighting
- Optional: Graphics tablet for annotations

### Screen Recording Tips
- Use 1080p or 1440p resolution
- Zoom in on important UI elements
- Use keyboard shortcuts (Cmd+Shift+4 for partial screenshots)
- Highlight mouse clicks with visual feedback

### Editing Notes
- Add intro animation (5-10 seconds)
- Use jump cuts for pacing
- Add text overlays for key commands
- Include progress bars during waiting periods
- Add end screen with subscribe prompt

---

**Version:** 1.0
**Created:** 2026-02-10
**Based on:** learning-openclaw-tutorial.md (v1.0)
