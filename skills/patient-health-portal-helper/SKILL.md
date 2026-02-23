---
name: patient-health-portal-helper
description: Automatically sync appointments from patient health portals (MyChart, Epic, Cerner, Shine Partners) to Google Calendar with family invitations. Supports daily auto-sync and manual sync triggers via Telegram or API.
homepage: https://github.com/openclaw/openclaw-railway-template
metadata: {"clawdbot":{"emoji":"🏥","requires":{"bins":["node"],"npm":["puppeteer"]}}}
---

# Patient Health Portal Helper

Automatically sync appointments from patient health portals to Google Calendar with family notifications.

## Overview

This skill integrates with patient health portals to:
- **Auto-sync appointments** - Daily scheduled sync from health portals
- **Google Calendar integration** - Create events with family invitations
- **Multiple portal support** - Shine Partners, MyChart, Cerner, AthenaHealth
- **Manual sync triggers** - Via Telegram, HTTP API, or Railway console
- **Secure credential storage** - AES-256-GCM encryption

## Supported Portals

| Portal Type | Status | Notes |
|-------------|--------|-------|
| **Shine Partners** | ✅ Supported | `patientconnect.shinepartners.ca` |
| **Epic MyChart** | 🔧 Planned | Requires authentication module |
| **Cerner** | 🔧 Planned | Requires API access |
| **AthenaHealth** | 🔧 Planned | Requires authentication module |

## Quick Start

### 1. Configure Environment Variables

Set these in Railway dashboard or `.env` file:

```bash
# Required - Portal credentials
HEALTH_PORTAL_URL="https://patientconnect.shinepartners.ca/..."
HEALTH_PORTAL_TYPE="ShinePartners"
HEALTH_PORTAL_USERNAME="your_username"
HEALTH_PORTAL_PASSWORD="your_password"

# Optional - Sync configuration
HEALTH_PORTAL_FAMILY_ATTENDEES="family1@email.com,family2@email.com"
HEALTH_PORTAL_SYNC_TIME="09:00"  # 9 AM UTC = 4 AM EST
HEALTH_PORTAL_ENABLED="true"
```

### 2. Install Dependencies

```bash
cd skills/patient-health-portal-helper/lib
npm install
```

### 3. Test the Sync

```bash
# Manual sync test
node skills/patient-health-portal-helper/lib/index.js
```

## Testing

### Using the Mock Portal

A **mock patient portal** is included for testing without accessing real patient data:

```bash
# Start the mock portal server
cd skills/patient-health-portal-helper/test-mock-portal
node server.js

# In another terminal, run the test
cd skills/patient-health-portal-helper
MOCK_PORTAL_URL=http://localhost:8080 node test.js
```

**Test Credentials:**
- Username: `testuser`
- Password: `testpass123`

**Expected Results:**
- Extracts 6 sample appointments
- Creates Google Calendar events
- Invites family members

See [test-mock-portal/README.md](test-mock-portal/README.md) for detailed testing instructions.

## Usage

### Telegram Commands

```
# Sync now
"sync my health portal"

# Check status
"check health portal status"

# List appointments
"show my appointments"
```

### API Endpoint

```bash
# Manual sync via HTTP
curl -X POST http://your-app.up.railway.app/api/sync-portal \
  -H "Authorization: Bearer YOUR_GATEWAY_TOKEN"
```

## Implementation Details

### Module Structure

```
lib/
├── index.js              # Main entry point
├── scrapers/
│   ├── index.js          # Scraper factory
│   ├── base.js           # Base scraper class
│   └── shinepartners.js  # Shine Partners scraper
├── parsers/
│   └── appointment-parser.js  # Date/time parsing
└── utils/
    ├── browser.js        # Puppeteer setup
    ├── crypto.js         # AES-256-GCM encryption
    └── logger.js         # Logging
```

### Data Flow

```
Health Portal → Puppeteer Scraper → Appointment Parser
     ↓
Google Calendar API (via gog skill) → Calendar Events
     ↓
Family Notifications → Email Invitations
```

### Appointment Event Format

```javascript
{
  summary: "🏥 DR Procedure No Lab W/ Recovery",
  location: "MSH-DIAGNOSTIC IMAGING",
  description: "Appointment synced from Health Portal...",
  start: {
    dateTime: "2026-02-23T08:00:00-05:00",
    timeZone: "America/Toronto"
  },
  end: {
    dateTime: "2026-02-23T09:00:00-05:00",
    timeZone: "America/Toronto"
  },
  attendees: [
    { email: "patient@example.com" },
    { email: "family1@example.com" }
  ]
}
```

## Configuration

### Sync Schedule

Default: Daily at 9:00 AM UTC (4:00 AM EST)

```javascript
// Cron expression: 0 9 * * *
const syncSchedule = {
  enabled: true,
  frequency: "0 9 * * *",  // Daily at 9:00 AM UTC
  timezone: "UTC"
};
```

### Family Attendees

Comma-separated list of email addresses:

```bash
HEALTH_PORTAL_FAMILY_ATTENDEES="spouse@email.com,daughter@email.com,son@email.com"
```

### Manual Sync Cooldown

Minimum 1 hour between manual syncs to prevent API rate limiting.

## Security

- **Encryption**: AES-256-GCM for password storage
- **Session Management**: Automatic cleanup after each sync
- **No Credential Logging**: Passwords never logged
- **HTTPS Only**: All portal connections use HTTPS
- **Environment Variables**: Credentials stored securely

## Troubleshooting

### Sync Not Running

```bash
# Check if enabled
echo $HEALTH_PORTAL_ENABLED  # Should be "true"

# Check logs
grep "health-portal" /var/log/openclaw.log
```

### Authentication Failed

```bash
# Verify credentials
echo "URL: $HEALTH_PORTAL_URL"
echo "User: $HEALTH_PORTAL_USERNAME"
echo "Type: $HEALTH_PORTAL_TYPE"
```

### No Appointments Found

```bash
# Manual sync with debug output
DEBUG=health-portal:* node lib/index.js
```

## Dependencies

- **puppeteer** (^23.11.1) - Web scraping
- **crypto** (built-in) - Encryption
- **node:child_process** (built-in) - gog skill integration

## References

- [Portal Scraper Analysis](../references/portal_scraper_analysis.md)
- [Patient Assistant Documentation](../references/patient_assistant.md)
- [Google Setup Guide](../references/google_setup.md)

## License

MIT License - See LICENSE.txt for details
