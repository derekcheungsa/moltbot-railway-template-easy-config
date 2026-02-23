# Patient Portal Scraper Analysis

## Executive Summary

This document analyzes the patient portal at `https://patientconnect.shinepartners.ca` to determine the optimal approach for extracting appointment data for the OpenClaw Patient Assistant.

**Key Finding**: This is a **custom portal implementation** (not MyChart/Epic/Cerner/AthenaHealth) with a simple table-based structure that is well-suited for automated scraping.

---

## 1. Portal Analysis

### 1.1 Portal Type
- **Type**: Custom implementation (not a major commercial portal)
- **Base URL**: `https://patientconnect.shinepartners.ca`
- **Example Path**: `/wctbhgzx00001tp1uz.mthd` (patient-specific path)

### 1.2 Page Structure

#### Main Page (Logged In)
- **Header**: Portal name, username, logout button
- **Navigation Menu**:
  - Health Record
  - Medications
  - Appointments
  - Profile
- **Main Content**:
  - Announcements
  - What's New
  - Helpful Resources
  - Upcoming Appointments

#### Appointments Page
- **Title**: "{Patient Name}'s Appointments"
- **Navigation**: Home | Log Off
- **Content**:
  - Print button (top-right)
  - Hospital affiliations list
  - Instructions for in-person visits
  - Instructions for virtual visits
  - **Appointment table** (primary data source)

---

## 2. Appointment Data Structure

### 2.1 Table Format
Appointments are displayed in a **simple HTML table** with three columns:

| Column | Sample Value | Notes |
|--------|--------------|-------|
| Date | `Mon, 23 Feb 2026`<br>`8:00 am EST` | Date and time on separate lines |
| Appointment | `DR Procedure No Lab W/ Recovery` | Procedure/description |
| Location | `MSH-DIAGNOSTIC IMAGING` | Hospital/clinic name |

### 2.2 Sample Appointment Data
```
Row 1:
- Date: Mon, 23 Feb 2026 / 8:00 am EST
- Appointment: DR Procedure No Lab W/ Recovery
- Location: MSH-DIAGNOSTIC IMAGING

Row 2:
- Date: Mon, 23 Feb 2026 / 9:00 am EST
- Appointment: Onc Lab (blood work)
- Location: MSH-Chemotherapy Clinic

Row 3:
- Date: Fri, 13 Mar 2024 / 10:00 am EDT
- Appointment: ONC Pain and Symptom Followup
- Location: MSH-Chemotherapy Clinic
```

### 2.3 Key Observations
- **No pagination**: All appointments on single page
- **No detail pages**: All data visible in table
- **Timezone**: Times shown with EST/EDT (Eastern Time)
- **Date format**: `Day, DD MMM YYYY` (e.g., `Mon, 23 Feb 2026`)
- **Time format**: `h:mm am/pm TZ` (e.g., `8:00 am EST`)

---

## 3. Recommended Scraping Approach

### 3.1 Tool Selection: Puppeteer

**Why Puppeteer over BeautifulSoup/Selenium:**

| Factor | Puppeteer | BeautifulSoup | Selenium |
|--------|-----------|---------------|----------|
| JavaScript rendering | ✅ Native | ❌ Requires additional setup | ✅ Supported |
| Authentication handling | ✅ Excellent | ❌ Manual cookies | ✅ Good |
| Dynamic content | ✅ Handles well | ❌ Static only | ✅ Handles well |
| Speed | Fast | Fastest | Moderate |
| Maintenance | Low | Medium (if API changes) | Medium |

**Rationale**:
- The portal likely uses JavaScript for authentication/session management
- Puppeteer handles cookies/sessions automatically
- Can wait for dynamic content to load
- Screenshot capability for debugging
- Docker-compatible

### 3.2 Authentication Flow

Based on typical patient portal patterns:

```
1. Navigate to base URL
2. Handle login page (username/password fields)
3. Submit credentials
4. Wait for redirect to main page
5. Navigate to Appointments section
6. Extract table data
```

**Required credentials**:
- Portal URL (patient-specific path)
- Username
- Password

### 3.3 CSS Selectors for Data Extraction

**Appointment table selector**:
```javascript
// Primary table selector (to be confirmed with actual HTML)
table.appointments-table
// OR
table:nth-of-type(1)  // First table on appointments page
```

**Row data extraction**:
```javascript
// For each row in tbody
rows.forEach(row => {
  const dateCell = row.querySelector('td:nth-child(1)');
  const apptCell = row.querySelector('td:nth-child(2)');
  const locCell = row.querySelector('td:nth-child(3)');

  // Extract date and time from nested spans or divs
  const dateText = dateCell.textContent.trim();
  const timeText = dateCell.querySelector('.time')?.textContent.trim();
  const appointment = apptCell.textContent.trim();
  const location = locCell.textContent.trim();
});
```

---

## 4. Data Parsing Strategy

### 4.1 Date Parsing
```javascript
// Input: "Mon, 23 Feb 2026"
// Output: ISO date string "2026-02-23"

function parseAppointmentDate(dateStr) {
  const months = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };

  const parts = dateStr.split(', ')[1].split(' ');
  const year = parts[2];
  const month = months[parts[1]];
  const day = parts[0].padStart(2, '0');

  return `${year}-${month}-${day}`;
}
```

### 4.2 Time Parsing
```javascript
// Input: "8:00 am EST" or "10:00 am EDT"
// Output: ISO time string with timezone

function parseAppointmentTime(timeStr) {
  // Extract time and timezone
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)\s*(\w+)/);
  if (!match) return null;

  let [, hours, minutes, meridiem, timezone] = match;
  hours = parseInt(hours);

  // Convert to 24-hour format
  if (meridiem === 'pm' && hours !== 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  // Map EST/EDT to timezone offset
  const tzMap = {
    'EST': 'America/Toronto',
    'EDT': 'America/Toronto'
  };

  return {
    hours,
    minutes,
    timezone: tzMap[timezone] || 'America/Toronto'
  };
}
```

### 4.3 Output Format
```javascript
// Structured appointment data for Google Calendar API
{
  summary: "DR Procedure No Lab W/ Recovery",
  location: "MSH-DIAGNOSTIC IMAGING",
  description: "Appointment synced from Health Portal\nType: DR Procedure No Lab W/ Recovery\nLocation: MSH-DIAGNOSTIC IMAGING",
  start: {
    dateTime: "2026-02-23T08:00:00-05:00",
    timeZone: "America/Toronto"
  },
  end: {
    dateTime: "2026-02-23T09:00:00-05:00",  // Assume 1 hour duration
    timeZone: "America/Toronto"
  },
  attendees: familyAttendees.map(email => ({ email }))
}
```

---

## 5. Implementation Architecture

### 5.1 Module Structure
```
src/
├── health-portal/
│   ├── index.js           # Main entry point
│   ├── scrapers/
│   │   ├── base.js        # Base scraper class
│   │   └── shinepartners.js  # Shine Partners portal scraper
│   ├── parsers/
│   │   └── appointment-parser.js  # Date/time parsing
│   └── utils/
│       ├── browser.js     # Puppeteer setup
│       └── crypto.js      # Password encryption/decryption
```

### 5.2 Configuration Schema
```javascript
{
  portal_url: "https://patientconnect.shinepartners.ca/wctbhgzx00001tp1uz.mthd",
  portal_type: "ShinePartners",
  username: "patient_username",
  password_encrypted: "base64_encrypted_password",
  family_attendees: ["family1@example.com", "family2@example.com"],
  sync_time: "09:00",
  enabled: true
}
```

### 5.3 Docker Dependencies
```dockerfile
# Add to Dockerfile
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Chromium for Puppeteer
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install puppeteer
RUN npm install puppeteer
```

---

## 6. Error Handling

### 6.1 Common Scenarios
| Scenario | Detection | Recovery |
|----------|-----------|----------|
| Login failed | Check for error message on page | Retry with exponential backoff |
| Session expired | Redirected to login page | Re-authenticate |
| No appointments | Empty table or no rows found | Return empty array (not error) |
| Network timeout | Puppeteer timeout | Retry up to 3 times |
| Malformed date | Date parse error | Log error, skip appointment |

### 6.2 Logging Strategy
```javascript
logger.info('[health-portal] Starting sync', { portal: config.portal_url });
logger.debug('[health-portal] Found N appointments', { count: appointments.length });
logger.error('[health-portal] Login failed', { error: error.message });
```

---

## 7. Security Considerations

### 7.1 Password Storage
- Encrypt password using AES-256-GCM before storing
- Store only encrypted version in environment variables
- Decrypt only in memory at runtime
- Never log passwords or tokens

### 7.2 Session Management
- Use Puppeteer's incognito mode for each sync
- Clear cookies/sessions after sync
- Don't persist browser state

### 7.3 Rate Limiting
- Limit sync to once per day (configurable)
- Add random jitter to sync time (±15 minutes)
- Implement manual sync cooldown (minimum 1 hour between manual syncs)

---

## 8. Testing Strategy

### 8.1 Unit Tests
- Date parsing: `parseAppointmentDate()`
- Time parsing: `parseAppointmentTime()`
- Encryption/decryption utilities

### 8.2 Integration Tests
- Mock HTML response from portal
- Test table extraction logic
- Test Google Calendar API call formatting

### 8.3 Manual Testing
1. Use test portal credentials
2. Run scraper in development environment
3. Verify extracted data matches portal display
4. Test Google Calendar event creation
5. Verify family attendee invitations

---

## 9. Next Steps

1. **Confirm portal URL pattern** - Validate if patient path is consistent
2. **Test actual login flow** - Verify authentication method
3. **Inspect actual HTML** - Get exact CSS selectors
4. **Implement base scraper** - Create Puppeteer wrapper
5. **Add Shine Partners scraper** - Implement portal-specific logic
6. **Integrate with Google Calendar** - Create event with attendees
7. **Add scheduling** - Implement daily sync cron
8. **Add manual sync endpoints** - Telegram, HTTP API, console
9. **Test end-to-end** - Full integration test
10. **Document setup** - User guide for configuration

---

## 10. Alternative Approaches Considered

### 10.1 Official API
**Status**: No official API documented for Shine Partners portal.

### 10.2 MyChart FHIR API
**Status**: Not applicable - this is not a MyChart portal.

### 10.3 RSS/Atom Feed
**Status**: No feeds available on inspected pages.

### 10.4 Conclusion
**Web scraping with Puppeteer is the recommended approach** given:
- Custom portal implementation
- Simple, table-based structure
- No official API available
- Straightforward authentication flow
- All data visible on single page

---

**Document Version**: 1.0
**Analysis Date**: 2026-02-21
**Portal**: patientconnect.shinepartners.ca
**Status**: Ready for Implementation
