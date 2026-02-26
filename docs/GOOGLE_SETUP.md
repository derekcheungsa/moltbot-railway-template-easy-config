# Google Workspace (gog) Skill Setup Guide

This guide walks you through setting up the **gog** skill for OpenClaw, which provides Google Workspace CLI access to:
- Gmail
- Google Calendar
- Google Drive
- Google Contacts
- Google Sheets
- Google Docs

---

## Overview

The **gog** skill uses the `gog` CLI to interact with Google Workspace APIs. It requires OAuth 2.0 credentials to authenticate with Google's services.

**Deployment Method:** This guide uses the base64 environment variable approach for secure credential storage on Railway.

---

## Prerequisites

- A Google account with Google Workspace access
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Railway deployed OpenClaw instance
- Base64 encoding tool (available on Linux, macOS, Windows)

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **New Project**
4. Enter a project name (e.g., "OpenClaw-Google-Integration")
5. Click **Create**

---

## Step 2: Enable Google Workspace APIs

1. In your new project, go to **APIs & Services** → **Library**
2. Search for and enable the APIs you need:

### Required APIs (enable all that apply):
- **Gmail API** - For email access
- **Google Calendar API** - For calendar management
- **Google Drive API** - For file storage
- **People API** - For contacts (replaces Contacts API)
- **Google Sheets API** - For spreadsheet operations
- **Google Docs API** - For document manipulation

### To enable an API:
1. Search for the API name
2. Click on it
3. Click **Enable**

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace account)
3. Click **Create**

### Fill in the required information:
- **App name**: OpenClaw Google Integration
- **User support email**: Your email
- **Developer contact information**: Your email
- Click **Save and Continue**

### Scopes (important!):
For the **Desktop app** OAuth type (which we'll use), you don't need to add specific scopes in the consent screen. Just:
1. Click **Save and Continue**
2. Skip the "Test users" step (for External user type)
3. Click **Back to Dashboard**

---

## Step 4: Create OAuth 2.0 Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials**
3. Select **OAuth client ID**

### Application Type: Desktop App
1. Select **Desktop app**
2. Enter a name (e.g., "OpenClaw Desktop Client")
3. Click **Create**

### Download the Credentials
1. A dialog will appear with your client ID
2. Click **Download JSON**
3. Save the file as `client_secret.json`

---

## Step 5: Encode Credentials to Base64

The Railway deployment requires credentials to be base64-encoded for secure environment variable storage.

### On Linux/macOS:
```bash
base64 -w 0 client_secret.json
```

### On Windows (PowerShell):
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("client_secret.json"))
```

### On Windows (Command Prompt):
```cmd
certutil -encode client_secret.txt output.b64
REM Then remove headers/footers from the output file
```

**Copy the entire base64 string** (it should be a long string of characters).

---

## Step 6: Update the Railway Environment Variable

When you deploy from this Railway template, the `GOOGLE_CLIENT_SECRET_BASE64` variable is **automatically created** for you with a placeholder value. You only need to update it with your actual credentials.

1. Go to your Railway project
2. Click on your **OpenClaw service**
3. Go to **Variables** tab
4. Find the variable named `GOOGLE_CLIENT_SECRET_BASE64` (it's pre-created!)
5. Edit the variable:
   - Click the variable to edit it
   - **Value:** Replace `"Replace_Me"` with the base64 string from Step 5
6. Click **Save**

**Note:** If you don't see the variable, click "New Variable" and add it manually, then contact us to check the template configuration.

### Additional Required Variables

For the gog CLI to work properly in Railway's container environment, you also need to set these variables (they are pre-created in the template):

| Variable | Value | Description |
|----------|-------|-------------|
| `GOG_KEYRING_BACKEND` | `file` | Use file-based storage (required for containers) |
| `GOG_KEYRING_PASSWORD` | *(secure password)* | Password for encrypted token storage - **set a strong password** |
| `GOG_CONFIG_DIR` | `/data/.gog-config` | Directory to persist gog config (tokens, settings) |

**Important:** The `GOG_KEYRING_PASSWORD` is required to encrypt/decrypt your OAuth tokens. Choose a strong password and save it - changing it later will require re-authenticating.

---

## Step 7: Redeploy and Verify

1. Trigger a redeploy of your Railway service
2. Check the logs for the credentials setup message:
   ```
   [credentials] ✅ Successfully decoded and wrote Google credentials to /data/.openclaw/credentials/client_secret.json
   ```

3. If you see the placeholder warning instead:
   ```
   [credentials] ⚠️  GOOGLE_CLIENT_SECRET_BASE64 contains placeholder value
   ```
   Return to Step 5 and make sure you replaced the placeholder with your actual base64-encoded credentials.

---

## Step 8: Authenticate Your Google Account

The `client_secret.json` file is now in place, but you still need to authorize your Google account. This is a one-time setup that stores an OAuth refresh token.

**Choose your method:**

- **Method A: Browser-Based** ⭐ (Recommended - No shell access required)
- **Method B: Railway Shell** (Alternative - Requires shell access)

---

### Method A: Browser-Based Authentication (Recommended)

This method uses a web interface and requires no shell access.

1. Visit the Google setup page:
   ```
   https://your-project.up.railway.app/setup/google
   ```

2. Enter your Google account email

3. Select the services you want to enable (Gmail, Calendar, Drive, etc.)

4. Click **"Generate Authorization Link"**

5. Click the authorization link to open Google's OAuth page in a new tab

6. Sign in to Google and click **"Allow"** to grant access

7. After approving, Google will redirect to a page showing **ERR_CONNECTION_REFUSED** — this is expected!

8. Copy the **full URL** from your browser's address bar (it starts with `http://127.0.0.1...`)

9. Paste the URL into the form on the setup page and click **"Complete Authentication"**

10. You should see a success message confirming your account is authenticated

---

### Method B: Railway Shell (Alternative)

If you have Railway Shell access, you can use the command-line method:

#### Open Railway Shell

1. Go to your Railway service
2. Click the **Shell** tab to open a terminal in your container

#### Run the Authentication Commands

```bash
# 1. Tell gog where to find the OAuth client credentials
gog auth credentials /data/.openclaw/credentials/client_secret.json

# 2. Authorize your Google account (uses manual flow for headless containers)
gog auth add your@gmail.com --services gmail --manual
```

#### Manual OAuth Flow

The `--manual` flag will:
1. Print an authorization URL in the terminal
2. Open that URL in your **local** browser
3. After approving, copy the full redirect URL from your browser's address bar
4. Paste it back into the Railway Shell terminal

**Example:**

```bash
$ gog auth add you@gmail.com --services gmail --manual
Open this URL in a browser: https://accounts.google.com/o/oauth2/auth?...
Enter the full redirect URL: http://127.0.0.1:8080/?code=4/0A...
✅ Authorized: you@gmail.com
```

#### Verify Authentication

```bash
# Check authenticated accounts
gog auth list

# Test Gmail access
gog gmail labels list
```

---

## Step 9: Test the gog Skill

Once authenticated, you can test the gog skill via the OpenClaw Control UI or your configured channel (Telegram, Discord, etc.):

### Example Commands:

**Gmail:**
```
"Check my Gmail for recent emails"
"Send an email to john@example.com with subject Hello"
```

**Calendar:**
```
"List my calendar events for today"
"Create a calendar event for tomorrow at 2pm called 'Team Meeting'"
```

**Drive:**
```
"List files in my Google Drive"
"Upload document.txt to Google Drive"
```

**Sheets:**
```
"Create a Google Sheet with columns: Date, Task, Status"
"Read the values from cell A1 to Z100 in my spreadsheet"
```

---

## Troubleshooting

### Issue: "Google Workspace (gog) isn't set up on this system"

**Solution:** This means the `gog` CLI is installed but you haven't authenticated your Google account yet.

**Use the browser-based method (recommended):**
1. Visit `https://your-project.up.railway.app/setup/google`
2. Follow the steps to authenticate your Google account

**Or use Railway Shell:**
1. Open Railway Shell
2. Run `gog auth list` - should show "No accounts found"
3. Run the authentication commands from **Step 8, Method B**:
   ```bash
   gog auth credentials /data/.openclaw/credentials/client_secret.json
   gog auth add your@gmail.com --services gmail --manual
   ```
4. Verify with `gog auth list` - should now show your account

### Issue: "Invalid Credentials" Error

**Solution:**
- Verify the base64 encoding was done correctly
- Ensure you copied the entire base64 string
- Check that the client_secret.json file is valid JSON

### Issue: "API Not Enabled" Error

**Solution:**
- Go back to Google Cloud Console
- Ensure all required APIs are enabled (Step 2)
- It may take a few minutes for API enablement to propagate

### Issue: "Redirect URI Mismatch" Warning

**Note:** This is expected for Desktop app OAuth type. The gog skill uses OAuth out-of-band flow, so redirect URIs are not applicable.

### Issue: Credentials Not Persisting After Redeploy

**Solution:**
- Verify you have a Railway Volume mounted at `/data`
- Check the `railway.toml` includes the `[volumes]` section
- The credentials should persist automatically due to the volume

---

## Security Notes

### Best Practices:

1. **Never commit `client_secret.json` to git**
   - The base64 environment variable approach keeps secrets out of your repository

2. **Use a dedicated Google Cloud project**
   - Separate from production projects
   - Makes it easier to revoke access if needed

3. **Limit API access to only what you need**
   - Only enable the APIs you'll actually use

4. **Regularly rotate credentials**
   - Delete and recreate OAuth credentials periodically
   - Update the base64 value in Railway

### Revoking Access:

If you need to revoke OpenClaw's access:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click the trash icon next to your OAuth client ID
4. Remove the `GOOGLE_CLIENT_SECRET_BASE64` variable from Railway

---

## Alternative: Manual Upload via Railway Shell

If you prefer not to use the base64 approach:

1. Go to your Railway service → **Shell** tab
2. Create the credentials directory:
   ```bash
   mkdir -p /data/.openclaw/credentials
   ```
3. Use a text editor or `cat` to create the file:
   ```bash
   cat > /data/.openclaw/credentials/client_secret.json << 'EOF'
   {
     "installed": {
       "client_id": "YOUR_CLIENT_ID",
       "client_secret": "YOUR_CLIENT_SECRET",
       "redirect_uris": ["http://localhost"],
       "auth_uri": "https://accounts.google.com/o/oauth2/auth",
       "token_uri": "https://oauth2.googleapis.com/token"
     }
   }
   EOF
   ```

**Note:** The base64 environment variable method is recommended as it persists across container rebuilds automatically.

---

## Related Documentation

- [OpenClaw Skills Documentation](https://docs.openclaw.ai/tools/skills)
- [ClawHub Registry](https://clawhub.ai)
- [Google Cloud OAuth Documentation](https://cloud.google.com/docs/authentication)
- [Railway Environment Variables Guide](https://docs.railway.app/reference/variables)

---

## Need Help?

If you encounter issues:

1. Check Railway logs for credential setup messages
2. Verify Google Cloud Console API enablement status
3. Ensure your Railway Volume is properly configured
4. Check the [OpenClaw Discord](https://discord.gg/openclaw) for community support

---

**Version:** 1.0
**Last Updated:** 2026-02-19
**For:** Railway deployment of OpenClaw with gog skill
