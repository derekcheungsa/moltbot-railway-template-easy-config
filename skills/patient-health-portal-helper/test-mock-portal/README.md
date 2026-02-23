# Mock Patient Portal for Testing

This is a mock patient portal for testing the `patient-health-portal-helper` OpenClaw skill without accessing real patient data.

## Purpose

- Test web scraping functionality safely
- Validate appointment extraction logic
- Debug and develop without privacy concerns
- Demo the skill without real credentials

## Quick Start

### Option 1: Local Testing with Python

```bash
# Start a simple HTTP server
cd skills/patient-health-portal-helper/test-mock-portal
python3 -m http.server 8080
```

Then access at: http://localhost:8080

### Option 2: Using Node.js

```bash
npx http-server -p 8080
```

### Option 3: Deploy to Railway

1. Create a new Railway service from this directory
2. Enable public networking
3. Use the generated Railway URL for testing

## Test Credentials

- **Username**: `testuser`
- **Password**: `testpass123`

## Test Data

The mock portal contains **6 sample appointments**:

| Date | Time | Appointment | Location |
|------|------|-------------|----------|
| Feb 23, 2026 | 8:00 am EST | DR Procedure No Lab W/ Recovery | MSH-DIAGNOSTIC IMAGING |
| Feb 23, 2026 | 9:00 am EST | Onc Lab (blood work) | MSH-Chemotherapy Clinic |
| Feb 23, 2026 | 10:00 am EST | CT Lymph Node Biopsy | MSH-DIAGNOSTIC IMAGING |
| Mar 13, 2026 | 10:00 am EST | ONC Pain and Symptom Followup | MSH-Chemotherapy Clinic |
| Mar 30, 2026 | 2:00 pm EDT | Annual Physical Examination | MSH-Primary Care Clinic |
| Apr 15, 2026 | 11:00 am EDT | Cardiology Follow-up | MSH-Cardiology Department |

## Configuring the Skill

Set these environment variables to use the mock portal:

```bash
# If using localhost (requires ngrok for external access)
HEALTH_PORTAL_URL="https://your-ngrok-url.test-mock-portal"
HEALTH_PORTAL_TYPE="MockPortal"
HEALTH_PORTAL_USERNAME="testuser"
HEALTH_PORTAL_PASSWORD="testpass123"
HEALTH_PORTAL_ENABLED="true"

# If deployed to Railway
HEALTH_PORTAL_URL="https://your-mock-portal.up.railway.app"
```

## Expected Results

When the scraper runs successfully:

1. **Login succeeds** with test credentials
2. **Navigates to appointments page**
3. **Extracts 6 appointments** from the table
4. **Creates 6 Google Calendar events**
5. **Invites family members** (if configured)

## Troubleshooting

### "Login failed" Error

- Verify username is `testuser` and password is `testpass123`
- Check if the portal URL is accessible

### "No appointments found"

- Verify the scraper is targeting the correct CSS selectors
- Check browser console for any JavaScript errors

### "Cannot access localhost"

- Localhost cannot be accessed from within a Docker container
- Use ngrok or deploy the mock portal to Railway

## Testing with ngrok

```bash
# In one terminal
cd skills/patient-health-portal-helper/test-mock-portal
python3 -m http.server 8080

# In another terminal
ngrok http 8080

# Use the ngrok URL in your health portal configuration
HEALTH_PORTAL_URL="https://abc123.ngrok.io"
```

## Security Note

This mock portal is for **testing purposes only**. Do not use real patient credentials or data in this environment.
