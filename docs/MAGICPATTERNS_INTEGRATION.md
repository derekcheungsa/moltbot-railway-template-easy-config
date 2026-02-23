# Magic Patterns Integration with OpenClaw

> A comprehensive guide to integrating Magic Patterns AI design generation with OpenClaw for rapid UI prototyping and development.

## Table of Contents

1. [Overview](#overview)
2. [Magic Patterns API](#magic-patterns-api)
3. [Integration Approaches](#integration-approaches)
4. [OpenClaw Skill Implementation](#openclaw-skill-implementation)
5. [Usage Examples](#usage-examples)
6. [Railway Deployment](#railway-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Magic Patterns?

**Magic Patterns** is an AI-powered design platform that generates production-ready UI designs from text descriptions. Key features:

- **Text-to-UI Generation** - Describe what you want, get a complete design
- **Instant Prototyping** - Generate mockups in seconds
- **Code Export** - Get production-ready source code (React, Vue, HTML)
- **Design System Support** - Use custom presets for brand consistency
- **Hosted Previews** - Share designs via URL without rendering yourself

### Why Integrate with OpenClaw?

Combining Magic Patterns with OpenClaw creates a powerful AI-assisted development workflow:

```
User Request          OpenClaw Agent           Magic Patterns API
     │                      │                         │
     │ "Create a login      │                         │
     │  page with social    │                         │
     │  login"              │                         │
     ├─────────────────────>│                         │
     │                      │ Generate UI design      │
     │                      ├────────────────────────>│
     │                      │                         │
     │                      │ ← Preview URL           │
     │                      │ ← Source code           │
     │                      │                         │
     │ ← Preview + Code     │                         │
     │ ← Implementation     │                         │
```

**Benefits:**

| Benefit | Description |
|---------|-------------|
| **Visual Preview** | See UI before writing code |
| **Faster Prototyping** | Generate mockups in seconds |
| **Consistent Design** | Use design system presets |
| **Code Export** | Get production-ready code |
| **Team Collaboration** | Share preview URLs for feedback |

---

## Magic Patterns API

### Getting Started

1. **Sign Up / Log In**
   - Visit: https://www.magicpatterns.com
   - Create an account or log in

2. **Get API Key**
   - Click your profile picture → **Settings**
   - Scroll to **API Key Management**
   - Click **Create API Key**
   - Copy and store securely

3. **Add Payment Method**
   - Required for API usage (returns 402 without payment)
   - Pricing starts at [check their pricing page](https://www.magicpatterns.com/docs/documentation/api/getting-started)

### API Endpoint

**Create a new design (V2)**

```
POST https://api.magicpatterns.com/api/v2/pattern
```

**Authentication:**
```http
x-mp-api-key: <your-api-key>
Content-Type: multipart/form-data
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | ✅ Yes | Design description |
| `mode` | enum | ❌ No | `fast` (default) or `best` |
| `presetId` | string | ❌ No | Design preset (default: `html-tailwind`) |
| `images` | file[] | ❌ No | Inspiration images (max 5MB each) |

### Available Presets

| Preset ID | Description | Best For |
|-----------|-------------|----------|
| `html-tailwind` | HTML + Tailwind CSS | General web apps |
| `shadcn-tailwind` | shadcn/ui components | Modern React apps |
| `chakraUi-inline` | Chakra UI components | React with Chakra |
| `mantine-inline` | Mantine components | React with Mantine |
| Custom | Your design system | Brand consistency |

### Response Format

```json
{
  "id": "abc123",
  "sourceFiles": [
    {
      "id": "<string>",
      "name": "<string>",
      "code": "<string>",
      "type": "javascript"
    }
  ],
  "compiledFiles": [
    {
      "id": "<string>",
      "fileName": "<string>",
      "hostedUrl": "<string>",
      "type": "javascript"
    }
  ],
  "editorUrl": "https://www.magicpatterns.com/c/abc123",
  "previewUrl": "https://abc123-preview.magicpatterns.app",
  "chatMessages": [
    {
      "role": "assistant",
      "content": "I will create a login page with a centered layout."
    }
  ]
}
```

### cURL Example

```bash
curl --request POST \
  --url https://api.magicpatterns.com/api/v2/pattern \
  --header 'Content-Type: multipart/form-data' \
  --header 'x-mp-api-key: <api-key>' \
  --form mode=fast \
  --form 'prompt=Create a login page with email and password fields' \
  --form presetId=html-tailwind
```

---

## Integration Approaches

### Approach 1: OpenClaw Skill (Recommended)

Create a dedicated skill that enables OpenClaw agents to generate UI designs on demand.

**Best for:** Interactive conversations where users ask for UI generation

### Approach 2: Agent Workflow Enhancement

Integrate Magic Patterns into the agent's development workflow for automatic visualization.

**Best for:** Automated prototyping in development pipelines

### Approach 3: User Story Visualization

Transform JIRA/Linear tickets into visual mockups.

**Best for:** Product teams and sprint planning

---

## OpenClaw Skill Implementation

### Skill Structure

Create a new skill at `./skills/magicpattern/`:

```
skills/
└── magicpattern/
    ├── SKILL.md           # Skill definition and instructions
    ├── index.ts           # Tool implementations
    ├── utils.ts           # Helper functions
    └── types.ts           # TypeScript types
```

### SKILL.md

Create `./skills/magicpattern/SKILL.md`:

```markdown
---
name: magicpattern
description: Generate UI designs using Magic Patterns AI API
metadata:
{
  "openclaw": {
    "emoji": "🎨",
    "requires": {
      "env": ["MAGICPATTERNS_API_KEY"]
    },
    "primaryEnv": "MAGICPATTERNS_API_KEY"
  }
}
---

You are a UI design assistant powered by Magic Patterns AI.

## Available Tools

### generate_ui
Generate a UI design from a text description.

**Parameters:**
- `prompt` (string, required): Design description
- `presetId` (string, optional): Design preset (default: "html-tailwind")
- `mode` (string, optional): "fast" or "best" (default: "fast")

**Returns:**
- `previewUrl`: Hosted preview of the design
- `sourceFiles`: Raw source code
- `editorUrl`: Magic Patterns editor link

### generate_ui_from_image
Generate a UI design from a text description with image inspiration.

**Parameters:**
- `prompt` (string, required): Design description
- `imagePath` (string, required): Path to inspiration image
- `presetId` (string, optional): Design preset
- `mode` (string, optional): "fast" or "best"

### list_presets
List all available design presets.

**Returns:**
- Array of preset IDs and descriptions

## Usage Guidelines

1. **Be Specific in Prompts**
   - Include layout details: "centered layout", "sidebar navigation"
   - Specify components: "email input", "password field with visibility toggle"
   - Mention style preferences: "minimalist", "modern", "dark mode"

2. **Choose the Right Preset**
   - `html-tailwind`: General web apps, landing pages
   - `shadcn-tailwind`: Modern React apps with shadcn/ui
   - `chakraUi-inline`: React apps with Chakra UI
   - `mantine-inline`: React apps with Mantine

3. **Mode Selection**
   - Use `fast` for quick iterations (default)
   - Use `best` for final production designs

## Example Prompts

- "Create a login page with email and password fields, social login buttons, and a minimalist design"
- "Generate a dashboard with a sidebar navigation, statistics cards, and a data table"
- "Build a product listing page with filters, sort options, and a grid layout"

## API Configuration

API Key: {env.MAGICPATTERNS_API_KEY}
API Endpoint: https://api.magicpatterns.com/api/v2/pattern
```

### index.ts (Tool Implementation)

Create `./skills/magicpattern/index.ts`:

```typescript
import axios from 'axios';

const MAGIC_PATTERNS_API = 'https://api.magicpatterns.com/api/v2/pattern';

interface GenerateUIOptions {
  prompt: string;
  presetId?: string;
  mode?: 'fast' | 'best';
}

interface MagicPatternsResponse {
  id: string;
  sourceFiles: Array<{
    id: string;
    name: string;
    code: string;
    type: string;
  }>;
  compiledFiles: Array<{
    id: string;
    fileName: string;
    hostedUrl: string;
    type: string;
  }>;
  editorUrl: string;
  previewUrl: string;
  chatMessages: Array<{
    role: string;
    content: string;
  }>;
}

export async function generateUI(
  apiKey: string,
  options: GenerateUIOptions
): Promise<MagicPatternsResponse> {
  const formData = new FormData();
  formData.append('prompt', options.prompt);
  formData.append('mode', options.mode || 'fast');
  formData.append('presetId', options.presetId || 'html-tailwind');

  const response = await axios.post(MAGIC_PATTERNS_API, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'x-mp-api-key': apiKey,
    },
  });

  return response.data;
}

export const PRESETS = {
  'html-tailwind': 'HTML + Tailwind CSS - General web apps',
  'shadcn-tailwind': 'shadcn/ui components - Modern React apps',
  'chakraUi-inline': 'Chakra UI components - React with Chakra',
  'mantine-inline': 'Mantine components - React with Mantine',
};

export function listPresets(): Record<string, string> {
  return PRESETS;
}
```

---

## Usage Examples

### Example 1: Generate a Login Page

**User Input:**
```
Create a login page with email and password fields,
remember me checkbox, and social login buttons
```

**OpenClaw Agent Action:**
```typescript
const result = await generateUI(process.env.MAGICPATTERNS_API_KEY, {
  prompt: "Create a login page with email and password fields, remember me checkbox, forgot password link, and social login buttons for Google and GitHub",
  presetId: "html-tailwind",
  mode: "fast"
});

console.log(`Preview: ${result.previewUrl}`);
console.log(`Editor: ${result.editorUrl}`);
```

**Response:**
```
Generated UI design:
Preview: https://abc123-preview.magicpatterns.app
Editor: https://www.magicpatterns.com/c/abc123

Files created:
- index.html
- styles.css
- app.js
```

### Example 2: Dashboard with Sidebar

**User Input:**
```
Generate an admin dashboard with sidebar navigation,
stats cards at the top, and a data table
```

**OpenClaw Agent Action:**
```typescript
const result = await generateUI(process.env.MAGICPATTERNS_API_KEY, {
  prompt: "Admin dashboard with sidebar navigation (Dashboard, Users, Settings, Reports), 4 statistics cards at the top (Total Users, Revenue, Active Sessions, Conversion Rate), and a data table showing recent transactions with columns for ID, User, Amount, Date, and Status",
  presetId: "shadcn-tailwind",
  mode: "best"
});
```

### Example 3: E-commerce Product Grid

**User Input:**
```
Create an e-commerce product grid with filters
```

**OpenClaw Agent Action:**
```typescript
const result = await generateUI(process.env.MAGICPATTERNS_API_KEY, {
  prompt: "E-commerce product page with category filter sidebar, sort dropdown (Price: Low to High, Price: High to Low, Newest), product grid with card layout showing product image, title, price, and Add to Cart button",
  presetId: "html-tailwind",
  mode: "fast"
});
```

---

## Railway Deployment

### Step 1: Add API Key to Railway Variables

1. Go to your Railway project
2. Navigate to **Settings** → **Variables**
3. Add new variable:
   - Name: `MAGICPATTERNS_API_KEY`
   - Value: Your Magic Patterns API key

### Step 2: Include Skill in Docker Image

Update your `Dockerfile` to include the skill:

```dockerfile
# Copy OpenClaw skills
COPY ./skills /data/.openclaw/skills

# Ensure permissions
RUN chmod -R 755 /data/.openclaw/skills
```

### Step 3: Configure Skill in OpenClaw

The skill configuration will be auto-loaded from the `SKILL.md` frontmatter.

To verify it's loaded:

```bash
# SSH into Railway container
railway shell

# Check loaded skills
openclaw config get skills

# Test the skill
openclaw skill run magicpattern "Create a login page"
```

---

## Advanced Workflows

### User Story to UI

Automatically convert user stories into visual mockups:

```typescript
// Input: User story from JIRA/Linear
const userStory = `
As a user, I want to filter products by category
so that I can find items more quickly.
`;

// OpenClaw extracts requirements and generates UI
const result = await generateUI(apiKey, {
  prompt: `E-commerce product page with category filter sidebar showing:
  - All Products
  - Electronics
  - Clothing
  - Home & Garden
  Product grid below filters with card layout`,
  presetId: "html-tailwind"
});

// Share preview URL with team for feedback
console.log(`Share for review: ${result.previewUrl}`);
```

### Design System Integration

1. **Create a Custom Preset** in Magic Patterns
2. **Configure Skill** to use your custom preset ID:
   ```typescript
   const result = await generateUI(apiKey, {
     prompt: "Dashboard page",
     presetId: "your-custom-preset-id"  // Your design system
   });
   ```
3. **All generated designs** match your brand guidelines

### Iterative Design Process

```
1. Generate initial design (fast mode)
2. Share preview URL with team
3. Collect feedback
4. Generate refined version (best mode)
5. Export source code
6. Implement in your project
```

---

## Troubleshooting

### Issue: 402 Payment Required

**Cause:** No payment method configured for Magic Patterns account

**Solution:**
1. Log in to Magic Patterns
2. Navigate to Settings → Billing
3. Add a payment method

### Issue: 401 Unauthorized

**Cause:** Invalid or missing API key

**Solution:**
1. Verify API key in Magic Patterns Settings
2. Check `MAGICPATTERNS_API_KEY` environment variable
3. Regenerate API key if needed

### Issue: Design generation fails

**Cause:** Prompt too vague or malformed

**Solution:**
- Be specific about layout, components, and style
- Include examples: "like Twitter's profile page"
- Use proper terminology: "navbar", "sidebar", "cards"

### Issue: Generated design doesn't match expectations

**Solution:**
- Try `mode: "best"` for higher quality
- Specify a different `presetId`
- Add more detail to the prompt
- Use inspiration images with `generate_ui_from_image`

### Issue: Skill not loading in OpenClaw

**Solution:**
```bash
# Check skill file exists
ls -la ./skills/magicpattern/

# Verify SKILL.md syntax
cat ./skills/magicpattern/SKILL.md

# Check OpenClaw logs
railway logs

# Restart gateway
openclaw gateway restart
```

---

## Best Practices

### Prompt Engineering

| Practice | Example |
|----------|---------|
| **Be specific** | "Create a login page with..." vs "Make a login page" |
| **Mention layout** | "with sidebar navigation" vs just "navigation" |
| **Specify components** | "email input, password field with visibility toggle" |
| **Describe style** | "minimalist design with blue accent colors" |
| **Include functionality** | "with client-side validation" |

### Preset Selection

| Use Case | Recommended Preset |
|----------|-------------------|
| Landing pages | `html-tailwind` |
| React apps | `shadcn-tailwind` |
| Admin dashboards | `chakraUi-inline` |
| Enterprise apps | `mantine-inline` |
| Custom brand | Custom preset ID |

### Cost Optimization

- Use `mode: "fast"` for iterations
- Use `mode: "best"` for final designs only
- Batch multiple designs in one request when possible
- Reuse existing presets before creating custom ones

---

## References

### Magic Patterns Resources

- **Website**: https://www.magicpatterns.com
- **API Documentation**: https://www.magicpatterns.com/docs/documentation/api/getting-started
- **Create Design (V2)**: https://www.magicpatterns.com/docs/patterns/v2-create-a-new-design
- **MCP Server**: https://lobehub.com/mcp/ryanleecode-magic-patterns-mcp

### OpenClaw Resources

- **Skills Guide**: https://docs.openclaw.ai/tools/skills
- **ClawHub**: https://clawhub.com
- **Railway Template**: This repository

---

**Version:** 1.0
**Last Updated:** 2026-02-10
**Magic Patterns API Version:** v2
