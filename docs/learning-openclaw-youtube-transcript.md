# OpenClaw on Railway - Complete Deployment Tutorial (YouTube Transcript)

> A YouTube video script based on the Learning OpenClaw Tutorial

**Video Title:** Deploy Your Personal AI Agent to Railway in 10 Minutes (Complete OpenClaw Guide)
**Estimated Duration:** 28-32 minutes
**Difficulty:** Beginner to Intermediate

---

## Transcript

### [0:00] - Intro

**[Visual: Thumbnail showing OpenClaw logo + Railway logo + "Deploy in 10 Minutes"]**

**Host (on camera):**
"What if you could deploy your own personal AI agent to the cloud in just a couple of minutes - one that works across all your favorite apps, can see your screen, hear your voice, and help with anything from coding to research to daily tasks?

Hi, I'm [Your Name], and today I'm going to show you how to deploy OpenClaw - an open-source personal AI agent platform. OpenClaw is way more than just a coding assistant. It's a full-featured AI agent that can:

- Work in 13+ platforms including WhatsApp, Telegram, Discord, Slack, Teams, and more
- Use voice commands with always-on speech recognition
- Control a browser and interact with web pages
- See and analyze images through a live canvas
- Extend its capabilities with hundreds of community-built skills
- Run completely on your own infrastructure - your data, your keys, your rules

By the end of this video, you'll have:
- A fully functional AI agent running in the cloud
- Integration with Atlas Cloud for affordable AI models
- Optional messaging platform integrations
- Persistent storage that survives redeploys

Let's dive in!"

**[Visual: Screen recording of final OpenClaw UI running on Railway]**

---

### [1:30] - What is OpenClaw?

**[Visual: Animated diagram of OpenClaw architecture]**

**Host (voiceover):**
"First, let's talk about what OpenClaw actually is. OpenClaw is an **open agent platform** that gives you a personal AI assistant running on your own infrastructure. Here's what makes it special:

**Multi-Channel Access:**
OpenClaw works wherever you are - WhatsApp, Telegram, Discord, Slack, Google Chat, Microsoft Teams, Signal, iMessage, Matrix, Zalo, or just a web browser. Your AI assistant follows you across all your favorite apps.

**Voice & Vision:**
With Voice Wake and Talk Mode, you can have continuous voice conversations. The Live Canvas feature lets the AI see and interact with visual content - it can analyze images, create diagrams, and even control a browser to navigate websites.

**Powerful Tools:**
- **Browser control** - OpenClaw can navigate websites, fill forms, and gather information
- **Camera & screen recording** - Capture screenshots, screen recordings, and photos
- **File operations** - Read, write, and edit files on your workspace
- **Webhooks & automation** - Connect to Gmail, schedule tasks with cron, and more

**Extensible Skills:**
The AgentSkills system and ClawHub registry give you access to hundreds of community-built extensions. From PDF processing to TRMNL display integration, there's a skill for almost anything.

**Local-First Privacy:**
Unlike SaaS assistants, OpenClaw runs on your infrastructure - laptop, homelab, or VPS. Your keys, your data, your rules.

**AI Model Flexibility:**
Works with all major AI providers - Anthropic Claude, OpenAI GPT, Google Gemini, and cost-effective options from Atlas Cloud. Choose the right model for each task.

It's like having a personal research assistant, coder, automation expert, and companion - all in one, available 24/7 across all your devices and platforms."

---

### [3:00] - Why OpenClaw? What Makes It Different

**[Visual: Comparison chart of OpenClaw vs. other AI assistants]**

**Host (voiceover):**
"Before we dive into the setup, let me explain why OpenClaw is different from other AI assistants like ChatGPT, Claude, or Copilot.

**Your Infrastructure, Your Data, Your Rules**
Unlike SaaS AI services that process your data on their servers, OpenClaw runs where YOU choose - your laptop, homelab, VPS, or cloud provider like Railway. Your API keys, your data, your privacy.

**Works Everywhere You Do**
ChatGPT lives in a browser. Claude lives in Claude.ai. OpenClaw lives in WhatsApp, Telegram, Discord, Slack, Teams, and more. Your AI assistant is wherever you already are, without switching apps.

**True Extensibility via Skills**
Most AI assistants are black boxes. OpenClaw's Skills system lets you extend its capabilities with community-built packages or your own custom tools. Need it to work with your company's internal API? Build a skill. Want specialized data analysis? Install a skill.

**Vision, Voice, and Browser Control**
OpenClaw can see your screen through the Canvas, hear you via Voice Wake, and even control a browser to navigate websites. It's not just generating text - it's taking action.

**Multi-Model Flexibility**
Not locked into one provider. Use Claude for reasoning, GPT-4 for coding, DeepSeek for cost efficiency. Switch per-task or per-conversation.

**The Gateway Architecture**
OpenClaw's Gateway is a local control plane that manages sessions, tools, channels, and events. This means consistent behavior across all platforms and the ability to route different conversations to different specialized agents.

It's the difference between using a tool and owning a platform."

---

### [5:00] - Prerequisites

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

### [6:30] - Getting Your Atlas Cloud API Key

**[Visual: Screen recording of Atlas Cloud website]**

**Host (voiceover):**
"First, let's get your Atlas Cloud API key. Atlas Cloud gives you access to multiple AI models at competitive prices.

**Step 1:** Go to atlascloud.ai and sign up or log in.

**Step 2:** Click on Settings in the navigation menu.

**Step 3:** Scroll down to API Key Management.

**Step 4:** Click 'Create API Key' and copy the generated key.

**Important:** Save this key securely! You'll need it in just a few minutes. Atlas Cloud offers several models including MiniMax M2.1 for general coding, DeepSeek R1 for reasoning tasks, and GLM-4.7 for Chinese language support."

---

### [8:00] - Deploying to Railway

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

### [10:00] - Configuring Railway Variables

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

### [11:30] - Adding a Volume for Persistence

**[Visual: Railway Volume settings]**

**Host (on camera):**
"This is a critical step - you need to add a Volume for persistent storage.

**Step 1:** Go to Settings, then click on 'Volumes.'

**Step 2:** Click 'New Volume.'

**Step 3:** Set the mount path to `/data` and click 'Create Volume.'

**Step 4:** Make sure the volume is attached to your service.

Without this volume, every time Railway redeploys your container, you'd lose all your configuration and have to set everything up again. The volume keeps your data safe."

---

### [12:30] - Accessing the Setup Wizard

**[Visual: Browser showing Railway deployment URL]**

**Host (voiceover):**
"Once the deployment completes, you'll see a green status indicator. Find your public URL in the Networking section - it will look something like `https://your-app.up.railway.app`.

Now, add `/setup` to the end of that URL and visit it in your browser.

You'll be prompted for a password. Enter the SETUP_PASSWORD you configured earlier.

This is the OpenClaw setup wizard - a friendly web interface that handles all the configuration for you."

**[Visual: Screen recording of setup wizard]**

---

### [13:30] - Step 1: Welcome

**[Visual: Setup wizard welcome screen]**

**Host (on camera):**
"The setup wizard has 5 steps. Let's walk through them together.

**Step 1 is the Welcome screen.** Click 'Get Started' to begin.

This wizard is going to configure your AI provider, set up your gateway, and optionally configure messaging channels - all without you having to write a single line of configuration or run any commands."

---

### [14:00] - Step 2: Configure Authentication

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

### [16:00] - Step 3: Channels (Optional)

**[Visual: Channels configuration screen]**

**Host (on camera):**
"**Step 3 is for messaging channels - this is completely optional.**

If you want to use OpenClaw in Discord, Telegram, or Slack, you can configure those here. Each platform requires a bot token that you get from their respective developer portals.

If you're just getting started, I recommend skipping this for now. You can always add channels later through the OpenClaw control panel.

Click 'Next' to continue."

---

### [17:00] - Step 4: Review

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

### [18:00] - Step 5: Complete

**[Visual: Completion screen]**

**Host (on camera):**
"Once setup completes, you'll see the success screen!

Click 'Open OpenClaw UI' to access your AI coding assistant.

This is the OpenClaw Control UI - your web-based interface to chat with the AI, manage your workspace, and configure settings.

Let's test it out!"

**[Visual: OpenClaw Control UI]**

---

### [19:00] - Testing Your Deployment

**[Visual: Typing test message in OpenClaw UI]**

**Host (voiceover):**
"Let's send a test message to make sure everything is working.

Type: 'Hello! Can you explain what you are capable of?'

OpenClaw should respond with an overview of its capabilities - from coding to research to automation.

Let's try something more interesting. Ask it: 'Can you write a Python function to calculate fibonacci numbers?'

Watch as OpenClaw generates the code, explains it, and even provides examples.

But OpenClaw can do so much more than code. Try asking it to:
- 'Research the latest trends in AI and summarize them'
- 'Help me plan a trip to Japan with a budget of $3000'
- 'Create a diagram showing the architecture of a web application'
- 'Write and send a professional email to my team'

The beauty of OpenClaw is that it's a general-purpose AI agent, not limited to just coding tasks."

**[Visual: Code generation in action]**

---

### [20:30] - Testing via API

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

### [21:30] - Monitoring and Logs

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

### [22:30] - Backups and Exports

**[Visual: Export function in setup wizard]**

**Host (on camera):**
"One of the great features of this Railway template is the backup export function.

If you ever want to migrate off Railway or just want a local backup of your configuration and workspace:

1. Visit `/setup` in your browser
2. Scroll down and click 'Export Backup'
3. You'll get a `.tar.gz` file containing all your data

This includes your configuration, API keys, workspace files, and agent memory - everything you need to restore or migrate your setup."

---

### [23:30] - Atlas Cloud Models Reference

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

### [24:30] - OpenClaw Skills & ClawHub

**[Visual: ClawHub website screenshot]**

**Host (on camera):**
"One of the most powerful features of OpenClaw is its Skills system - and this is what truly sets it apart from other AI assistants.

**What are Skills?**

Skills are modular extensions that give your AI agent new capabilities. Think of them like plugins for your AI assistant. Each skill adds specific tools and knowledge that OpenClaw can use when needed.

**The AgentSkills System**

OpenClaw uses AgentSkills - a framework that allows skills to:
- Define new tools the AI can call
- Provide domain-specific knowledge
- Integrate external APIs and services
- Modify how the agent processes requests

**ClawHub - The Skills Registry**

ClawHub at clawhub.ai is a fast skill registry with vector search. This means OpenClaw can automatically find and suggest relevant skills based on what you're trying to do. It's like having an app store for your AI agent!

**Popular Skills Available:**

- **PDF** - Extract text, images, and metadata from PDF documents
- **TRMNL Display** - Generate formatted content for e-ink displays
- **Skill Exporter** - Export skills as standalone microservices
- **Browser Automation** - Enhanced web scraping and form filling
- **Data Analysis** - Work with CSVs, Excel files, and databases
- **Image Processing** - Manipulate and analyze images
- **Calendar Integration** - Connect to Google Calendar, Outlook, etc.
- **Note Taking** - Integration with Notion, Obsidian, and other note apps
- **Weather** - Real-time weather data and forecasts
- And hundreds more!

**Installing Skills**

To install a skill, you use the ClawHub CLI:

```bash
npm i -g clawhub
clawhub install pdf
```

Skills are automatically discovered and loaded into your OpenClaw instance.

**Creating Custom Skills**

You can also create your own skills! A skill is just a markdown file with specific structure that defines tools and knowledge. This makes it incredibly easy to extend OpenClaw for your specific needs - whether that's company-specific APIs, proprietary data sources, or custom workflows."

---

### [26:00] - Troubleshooting Common Issues

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

### [27:00] - Next Steps

**[Visual: Summary of next steps]**

**Host (on camera):**
"Congratulations! You now have OpenClaw running on Railway. Here are some next steps you might want to explore:

1. **Configure messaging channels** - Add Discord, Telegram, Slack, WhatsApp, or Teams integration to chat with your AI agent wherever you already are

2. **Install Skills** - Explore ClawHub for useful add-ons. Start with the PDF skill for document processing, or browse the hundreds of community-built skills

3. **Configure web search** - Enable Brave API for real-time web search capabilities, giving your AI access to current information

4. **Explore the Canvas** - Try out OpenClaw's visual workspace where the AI can create diagrams, mind maps, and visual content

5. **Set up voice commands** - If you're using the desktop app, enable Voice Wake and Talk Mode for hands-free voice conversations

6. **Create custom skills** - Build your own specialized tools tailored to your workflow or business needs

7. **Connect companion apps** - Set up the iOS or Android nodes for mobile access, including camera and location features

8. **Join the community** - Check out the OpenClaw Discord and GitHub discussions to share your creations and learn from other users

All the links you need are in the description below."

---

### [28:00] - Outro

**[Visual: Host on camera]**

**Host:**
"Thanks for watching this complete guide to deploying OpenClaw on Railway!

You've learned:
- How to deploy OpenClaw to Railway in just 10 minutes
- How to configure Atlas Cloud for affordable AI models
- How to use the setup wizard for zero-configuration deployment
- How to test your deployment and troubleshoot issues
- About OpenClaw's powerful capabilities across voice, vision, automation, and more

Remember, OpenClaw isn't just for coding - it's a complete personal AI agent that can help with research, writing, planning, automation, and so much more. The Skills system via ClawHub means there's almost no limit to what you can extend it to do.

If you found this video helpful, please give it a like and subscribe for more tutorials on AI, cloud deployment, and developer tools.

And let me know in the comments - what would YOU build with your own personal AI agent?

Until next time, happy building!"

**[Visual: End screen with subscribe button and related videos]**

---

## Video Metadata

### Tags
`openclaw` `railway` `ai agent` `personal ai assistant` `claude` `chatgpt` `cloud deployment` `atlas cloud` `docker` `devops` `tutorial` `agent skills` `clawhub` `self-hosted ai` `ai automation`

### Description (for YouTube)

Deploy your own personal AI agent to the cloud in just 10 minutes! In this complete tutorial, I'll show you how to deploy OpenClaw - an open-source AI agent platform - to Railway.

**What is OpenClaw?**
OpenClaw is way more than just a coding assistant. It's a full-featured personal AI agent platform that works across 13+ platforms including WhatsApp, Telegram, Discord, Slack, Teams, and more. It features voice commands, a live canvas for visual content, browser automation, and hundreds of community-built skills.

You'll learn:
- How to deploy OpenClaw to Railway with zero configuration
- How to set up Atlas Cloud for affordable AI models
- How to use the web-based setup wizard
- How to test and troubleshoot your deployment
- About OpenClaw's powerful Skills system via ClawHub

OpenClaw works with Claude, GPT-4, Gemini, and cost-effective models from Atlas Cloud. It's like having your own personal AI assistant available 24/7 across all your devices and platforms - completely self-hosted with your data staying on your infrastructure!

**Timestamps:**
0:00 - Intro
1:30 - What is OpenClaw?
3:00 - Why OpenClaw? What Makes It Different
5:00 - Prerequisites
6:30 - Getting Atlas Cloud API Key
8:00 - Deploying to Railway
10:00 - Configuring Variables
11:30 - Adding Persistent Volume
12:30 - Accessing Setup Wizard
13:30 - Setup Wizard Walkthrough
19:00 - Testing Your Deployment
20:30 - API Testing
21:30 - Monitoring & Logs
22:30 - Backups & Exports
23:30 - Atlas Cloud Models Reference
24:30 - OpenClaw Skills & ClawHub
26:00 - Troubleshooting
27:00 - Next Steps
28:00 - Outro

**Links:**
- OpenClaw: https://github.com/openclaw/openclaw
- OpenClaw Docs: https://docs.openclaw.ai
- Railway: https://railway.app
- Atlas Cloud: https://www.atlascloud.ai
- ClawHub: https://clawhub.ai
- Full Tutorial: https://github.com/[your-repo]/blob/main/docs/learning-openclaw-tutorial.md

### Thumbnail Text Suggestions

```
Deploy Your Personal
AI Agent to Railway
10 Minutes
No Config Needed!
```

```
OpenClaw + Railway
Your Own AI Agent
13+ Platforms
Complete Guide
```

```
Self-Host Your AI
Assistant Today
Voice • Vision • Skills
OpenClaw on Railway
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

**Version:** 1.1
**Created:** 2026-02-10
**Updated:** 2026-02-16
**Based on:** learning-openclaw-tutorial.md (v1.0)
