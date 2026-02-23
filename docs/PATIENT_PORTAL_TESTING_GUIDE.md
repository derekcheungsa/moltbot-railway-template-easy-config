# Patient Health Portal Helper - Testing Guide

This guide covers how to test the **patient-health-portal-helper** OpenClaw skill with both the mock portal (safe testing) and real portal credentials.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Testing with Mock Portal](#testing-with-mock-portal)
3. [Testing with Real Portal Credentials](#testing-with-real-portal-credentials)
4. [Environment Variables](#environment-variables)
5. [Troubleshooting](#troubleshooting)
6. [Security Best Practices](#security-best-practices)
7. [Expected Output](#expected-output)

---

## Quick Start

### Safest Way to Test (Mock Portal)

```bash
cd skills/patient-health-portal-helper/test-mock-portal
node server.js  # Terminal 1 - Start mock portal

cd skills/patient-health-portal-helper  # Terminal 2
MOCK_PORTAL_URL=http://localhost:8080 node test.js
```

### Testing with Real Credentials

```bash
cd skills/patient-health-portal-helper

# Set environment variables
export HEALTH_PORTAL_URL="https://patientconnect.shinepartners.ca/..."
export HEALTH_PORTAL_USERNAME="your_username"
export HEALTH_PORTAL_PASSWORD="your_password"
export HEALTH_PORTAL_TYPE="ShinePartners"

# Run test
node test-real-portal.js
```

---

## Testing with Mock Portal

The mock portal provides a safe environment to test the scraper without accessing real patient data.

### Step 1: Start the Mock Portal Server

```bash
cd skills/patient-health-portal-helper/test-mock-portal
node server.js
```

The server will start at: **http://localhost:8080**

**Expected Output:**
```
╔══════════════════════════════════════════════════════════╗
║        🏥 Mock Patient Portal Server                     ║
║        Server running at: http://localhost:8080        ║
║        Test Credentials:                                ║
║        Username: testuser                                ║
║        Password: testpass123                             ║
╚══════════════════════════════════════════════════════════╝
```

### Step 2: Run the Test

In a new terminal:

```bash
cd skills/patient-health-portal-helper
MOCK_PORTAL_URL=http://localhost:8080 node test.js
```

### Mock Portal Test Data

The mock portal contains **6 sample appointments**:

| Date | Time | Appointment | Location |
|------|------|-------------|----------|
| Feb 23, 2026 | 8:00 am EST | DR Procedure No Lab W/ Recovery | MSH-DIAGNOSTIC IMAGING |
| Feb 23, 2026 | 9:00 am EST | Onc Lab (blood work) | MSH-Chemotherapy Clinic |
| Feb 23, 2026 | 10:00 am EST | CT Lymph Node Biopsy | MSH-DIAGNOSTIC IMAGING |
| Mar 13, 2026 | 10:00 am EST | ONC Pain and Symptom Followup | MSH-Chemotherapy Clinic |
| Mar 30, 2026 | 2:00 pm EDT | Annual Physical Examination | MSH-Primary Care Clinic |
| Apr 15, 2026 | 11:00 am EDT | Cardiology Follow-up | MSH-Cardiology Department |

### Expected Test Output

```
╔══════════════════════════════════════════════════════════╗
║     🏥 Patient Health Portal Helper - Test Script        ║
║     Testing against Mock Portal                          ║
╚══════════════════════════════════════════════════════════╝

✅ Scraper instance created successfully
✅ Scraping completed successfully!

📊 Found 6 appointment(s)

📋 Extracted Appointments:
   1. DR Procedure No Lab W/ Recovery
      Date: Mon, 23 Feb 2026 at 8:00 am EST
      Location: MSH-DIAGNOSTIC IMAGING
      Start: 2026-02-23T13:00:00.000Z
      End: 2026-02-23T14:00:00.000Z
   [... more appointments ...]

✅ SUCCESS: Extracted all 6 appointments as expected!
```

---

## Testing with Real Portal Credentials

### Option 1: Using Environment Variables

**Step 1: Set Environment Variables**

```bash
export HEALTH_PORTAL_URL="https://patientconnect.shinepartners.ca/wctbhgzx00001tp1uz.mthd"
export HEALTH_PORTAL_TYPE="ShinePartners"
export HEALTH_PORTAL_USERNAME="your_username"
export HEALTH_PORTAL_PASSWORD="your_password"
export HEALTH_PORTAL_FAMILY_ATTENDEES="family1@email.com,family2@email.com"
```

**Step 2: Install Dependencies**

```bash
cd skills/patient-health-portal-helper/lib
npm install
```

**Step 3: Run the Test**

```bash
cd skills/patient-health-portal-helper
node test-real-portal.js
```

### Option 2: Using .env File

**Step 1: Create .env File**

```bash
cd skills/patient-health-portal-helper
cp .env.example .env
nano .env  # Edit with your credentials
```

**Step 2: Fill in Your Credentials**

```bash
# .env file
HEALTH_PORTAL_URL=https://patientconnect.shinepartners.ca/wctbhgzx00001tp1uz.mthd
HEALTH_PORTAL_TYPE=ShinePartners
HEALTH_PORTAL_USERNAME=your_username
HEALTH_PORTAL_PASSWORD=your_password
HEALTH_PORTAL_FAMILY_ATTENDEES=family1@email.com,family2@email.com
HEALTH_PORTAL_ENABLED=true
```

**Step 3: Run the Test**

```bash
node test-real-portal.js
```

### Option 3: Testing on Railway (Recommended)

For the most secure testing, deploy to Railway:

**Step 1: Push to GitHub**

```bash
git add skills/patient-health-portal-helper/
git commit -m "Add patient portal skill"
git push
```

**Step 2: Deploy on Railway**

1. Go to [Railway](https://railway.app)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Add environment variables in Railway dashboard:

```bash
HEALTH_PORTAL_URL = https://patientconnect.shinepartners.ca/...
HEALTH_PORTAL_TYPE = ShinePartners
HEALTH_PORTAL_USERNAME = your_username
HEALTH_PORTAL_PASSWORD = your_password
HEALTH_PORTAL_FAMILY_ATTENDEES = family1@email.com,family2@email.com
HEALTH_PORTAL_ENABLED = true
```

5. Deploy the service

**Step 3: Check Logs**

```bash
# View logs in Railway dashboard
# Look for:
[health-portal] ✅ Configuration loaded from environment variables
[health-portal] ✅ Portal Type: ShinePartners
[health-portal] ✅ Username: your_username
```

---

## Environment Variables

### Required Variables

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `HEALTH_PORTAL_URL` | string | Full URL of your patient portal | `https://patientconnect.shinepartners.ca/wctbhgzx00001tp1uz.mthd` |
| `HEALTH_PORTAL_TYPE` | string | Portal system type | `ShinePartners`, `MyChart`, `Cerner`, `AthenaHealth` |
| `HEALTH_PORTAL_USERNAME` | string | Your portal username | `john.doe@email.com` |
| `HEALTH_PORTAL_PASSWORD` | string | Your portal password | `your_secure_password` |

### Optional Variables

| Variable | Type | Description | Default | Example |
|----------|------|-------------|---------|---------|
| `HEALTH_PORTAL_FAMILY_ATTENDEES` | string | Family emails to invite (comma-separated) | None | `fam1@email.com,fam2@email.com` |
| `HEALTH_PORTAL_SYNC_TIME` | string | Daily sync time (UTC, 24-hour format) | `09:00` | `09:00` (9 AM UTC = 4 AM EST) |
| `HEALTH_PORTAL_ENABLED` | boolean | Enable/disable automatic sync | `true` | `true` or `false` |
| `HEALTH_PORTAL_LOG_LEVEL` | string | Logging verbosity | `INFO` | `DEBUG`, `INFO`, `WARN`, `ERROR` |

### Setting Environment Variables

**Linux/macOS:**
```bash
export HEALTH_PORTAL_URL="https://..."
export HEALTH_PORTAL_USERNAME="username"
export HEALTH_PORTAL_PASSWORD="password"
```

**Windows PowerShell:**
```powershell
$env:HEALTH_PORTAL_URL="https://..."
$env:HEALTH_PORTAL_USERNAME="username"
$env:HEALTH_PORTAL_PASSWORD="password"
```

**Railway Dashboard:**
1. Go to your service → Variables tab
2. Click **New Variable**
3. Add each variable with its value

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Missing required credentials"

**Error:**
```
❌ Error: Missing required credentials!
Please set the following environment variables:
  HEALTH_PORTAL_URL
  HEALTH_PORTAL_USERNAME
  HEALTH_PORTAL_PASSWORD
```

**Solution:**
- Make sure all required environment variables are set
- Check for typos in variable names (case-sensitive!)
- Verify variables are exported in the same shell session

#### Issue: "Login failed"

**Error:**
```
❌ Authentication failed
Error: Login failed: Invalid credentials
```

**Solution:**
- Verify your username and password are correct
- Try logging into the portal manually first
- Check that the portal URL is correct
- Ensure your account is active

#### Issue: "Navigation timeout"

**Error:**
```
❌ Test failed!
Error: Navigation timeout of 30000 ms exceeded
```

**Solution:**
- The portal might be slow or experiencing issues
- Check your internet connection
- Try running the test again
- Verify the portal URL is accessible from your network

#### Issue: "Cannot find module 'puppeteer'"

**Error:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'puppeteer'
```

**Solution:**
```bash
cd skills/patient-health-portal-helper/lib
npm install
```

#### Issue: "No appointments found"

**Output:**
```
📊 Found 0 appointment(s)
📭 No upcoming appointments found.
```

**Solution:**
- This is normal if you have no upcoming appointments
- Check the portal manually to confirm
- Try logging into the portal to see your appointments list

#### Issue: Scraper extracts wrong data

**Solution:**
- Your portal might have a different structure than expected
- Check the portal manually and note the table structure
- You may need to create a custom scraper for your portal

---

## Security Best Practices

### ✅ DO

- **Use environment variables** for credentials
- **Test on Railway first** before local testing
- **Rotate your passwords** regularly
- **Use a dedicated password** for portal access
- **Check that .env is in .gitignore**
- **Review logs** to ensure no credentials are logged

### ❌ DON'T

- **Never commit .env files** to git
- **Never hardcode credentials** in source code
- **Never share screenshots** with visible credentials
- **Never use production credentials** for development
- **Never log passwords** in plain text

### Credential Security

The skill uses **AES-256-GCM encryption** for password storage:
- Passwords are encrypted before storage
- Decryption happens only in memory at runtime
- Encrypted credentials are never logged

### Railway Security

When deploying to Railway:
- Credentials are stored in **environment variables**
- Environment variables are **not visible in logs**
- Only authorized users can access the dashboard
- Data is encrypted at rest and in transit

---

## Expected Output

### Successful Test Output

When the test runs successfully, you should see:

```
╔══════════════════════════════════════════════════════════╗
║     🏥 Patient Health Portal Helper - Real Portal Test    ║
║     ⚠️  TESTING WITH REAL CREDENTIALS                     ║
╚══════════════════════════════════════════════════════════╝

📋 Step 1: Creating scraper instance...
✅ Scraper instance created successfully

📋 Step 2: Authenticating to portal...
✅ Authentication successful

📋 Step 3: Navigating to appointments page...
✅ Navigation successful

📋 Step 4: Extracting appointments...
✅ Scraping completed successfully!

📊 Found X appointment(s)

📋 Extracted Appointments:

   1. Your Appointment Name
      📅 Date: Mon, 23 Feb 2026
      🕐 Time: 8:00 am EST
      📍 Location: Your Clinic/Hospital
      🌐 Start: 2026-02-23T13:00:00.000Z
      🌐 End: 2026-02-23T14:00:00.000Z

   [More appointments...]

✅ Test completed successfully!
```

### What the Test Does

1. **Creates scraper instance** - Configures scraper for your portal type
2. **Authenticates** - Logs into the portal with your credentials
3. **Navigates** - Goes to the appointments page
4. **Extracts appointments** - Scrapes appointment data from the table
5. **Parses data** - Converts date/time/location to structured format
6. **Displays results** - Shows all extracted appointments
7. **Cleans up** - Closes browser and releases resources

---

## Next Steps After Testing

### If Test Succeeded

1. **Deploy to Railway** for automatic daily sync
2. **Configure Google Calendar** integration
3. **Add family attendees** for automatic invitations
4. **Set up notifications** for new appointments

### If Test Failed

1. **Check error messages** above
2. **Verify your portal credentials** work manually
3. **Ensure portal URL is correct**
4. **Check network connectivity**
5. **Review [Troubleshooting](#troubleshooting)** section

---

## Additional Resources

- [Patient Assistant Documentation](PATIENT_ASSISTANT.md) - Full system documentation
- [Portal Scraper Analysis](../skills/patient-health-portal-helper/references/portal_scraper_analysis.md) - Technical analysis
- [Railway Deployment Guide](README.md) - Deployment instructions
- [Health Portal Skill Documentation](../skills/patient-health-portal-helper/SKILL.md) - Skill usage guide

---

**Last Updated:** 2026-02-21
**Version:** 1.0.0
**For:** OpenClaw Railway Template - Patient Health Portal Helper Skill
