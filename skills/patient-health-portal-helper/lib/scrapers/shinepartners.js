/**
 * Shine Partners Portal Scraper
 *
 * Scraper for patientconnect.shinepartners.ca health portal.
 * Handles authentication, navigation, and appointment extraction.
 *
 * @module health-portal/scrapers/shinepartners
 */

import { BaseScraper } from './base.js';
import { parseAppointmentDate, parseAppointmentTime } from '../parsers/appointment-parser.js';
import { logger } from '../utils/logger.js';

class ShinePartnersScraper extends BaseScraper {
  constructor(config) {
    super(config);
    this.portalType = 'ShinePartners';
  }

  /**
   * Authenticate with the Shine Partners portal
   */
  async authenticate() {
    logger.debug('[shinepartners] Starting authentication');

    // Navigate to portal URL
    await this.page.goto(this.config.portal_url, {
      waitUntil: 'networkidle2',
    });

    // Check if we're already logged in (redirected to main page)
    const currentUrl = this.page.url();
    if (!currentUrl.includes('login') && !currentUrl.includes('signin')) {
      logger.debug('[shinepartners] Already authenticated (session active)');
      return;
    }

    // Wait for login form to appear
    await this.waitForSelector('input[type="text"], input[type="email"], #username, #email');

    // Try multiple common username selectors
    const usernameSelectors = [
      'input[name="username"]',
      'input[name="email"]',
      'input[id="username"]',
      'input[id="email"]',
      'input[type="email"]',
    ];

    const passwordSelectors = [
      'input[name="password"]',
      'input[id="password"]',
      'input[type="password"]',
    ];

    let usernameField = null;
    let passwordField = null;

    // Find username field
    for (const selector of usernameSelectors) {
      try {
        usernameField = await this.page.$(selector);
        if (usernameField) break;
      } catch (e) {
        // Continue to next selector
      }
    }

    // Find password field
    for (const selector of passwordSelectors) {
      try {
        passwordField = await this.page.$(selector);
        if (passwordField) break;
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!usernameField || !passwordField) {
      throw new Error('Could not find login form fields. Page structure may have changed.');
    }

    // Fill in credentials
    await usernameField.type(this.config.username, { delay: 50 });
    await passwordField.type(this.config.password, { delay: 50 });

    // Submit form (look for submit button)
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'button:has-text("Log On")',
    ];

    for (const selector of submitSelectors) {
      try {
        const submitButton = await this.page.$(selector);
        if (submitButton) {
          await submitButton.click();
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Wait for navigation after login
    await this.page.waitForNavigation({
      waitUntil: 'networkidle2',
      timeout: this.config.timeout,
    });

    // Check for login errors
    const errorSelectors = [
      '.error',
      '.alert-danger',
      '[role="alert"]',
      '.login-error',
    ];

    for (const selector of errorSelectors) {
      const errorElement = await this.page.$(selector);
      if (errorElement) {
        const errorText = await this.page.evaluate(el => el.textContent, errorElement);
        if (errorText && errorText.trim()) {
          throw new Error(`Login failed: ${errorText.trim()}`);
        }
      }
    }

    logger.info('[shinepartners] Authentication successful');
  }

  /**
   * Navigate to the appointments page
   */
  async navigateToAppointments() {
    logger.debug('[shinepartners] Navigating to appointments page');

    // Look for "Appointments" link in navigation
    const appointmentSelectors = [
      'a:has-text("Appointments")',
      'a[href*="appointment"]',
      'nav a:contains("Appointments")',
      '#appointments-link',
    ];

    // First try to find and click the Appointments link
    for (const selector of appointmentSelectors) {
      try {
        const link = await this.page.$(selector);
        if (link) {
          await link.click();
          await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Alternative: Try to navigate directly to appointments URL
    // Many portals use predictable URL patterns
    const baseUrl = new URL(this.config.portal_url).origin;
    const possibleUrls = [
      `${baseUrl}/appointments`,
      `${baseUrl}/portal/appointments`,
      `${baseUrl}/patient/appointments`,
    ];

    for (const url of possibleUrls) {
      try {
        await this.page.goto(url, { waitUntil: 'networkidle2' });
        // Check if we found the appointments page
        const pageTitle = await this.page.title();
        if (pageTitle.toLowerCase().includes('appointment')) {
          logger.debug('[shinepartners] Found appointments page', { url });
          return;
        }
      } catch (e) {
        // Continue to next URL
      }
    }

    // Verify we're on the appointments page
    const pageContent = await this.page.content();
    if (!pageContent.toLowerCase().includes('appointment')) {
      throw new Error('Could not navigate to appointments page');
    }

    logger.info('[shinepartners] Successfully navigated to appointments page');
  }

  /**
   * Extract appointment data from the page
   */
  async extractAppointments() {
    logger.debug('[shinepartners] Extracting appointments');

    // Wait for appointment table to load
    await this.waitForSelector('table', { timeout: 10000 });

    // Get all tables on the page
    const tables = await this.page.$$('table');

    if (tables.length === 0) {
      logger.warn('[shinepartners] No tables found on appointments page');
      return [];
    }

    // Find the appointments table (usually the first data table)
    let appointmentTable = null;

    for (const table of tables) {
      const headers = await table.$$eval('th', ths => ths.map(th => th.textContent.trim()));

      // Check if this looks like an appointments table
      if (headers.some(h => h.toLowerCase().includes('date')) &&
          headers.some(h => h.toLowerCase().includes('appointment'))) {
        appointmentTable = table;
        break;
      }
    }

    if (!appointmentTable) {
      // Fallback: use the first table
      appointmentTable = tables[0];
    }

    // Extract rows from the table
    const rows = await appointmentTable.$$('tbody tr');

    if (rows.length === 0) {
      // Try without tbody
      const allRows = await appointmentTable.$$('tr');
      // Skip header row
      const dataRows = allRows.slice(1);
      if (dataRows.length === 0) {
        logger.warn('[shinepartners] No appointment rows found');
        return [];
      }
      rows.push(...dataRows);
    }

    const appointments = [];

    for (const row of rows) {
      try {
        const appointment = await this.extractRowData(row);
        if (appointment) {
          appointments.push(appointment);
        }
      } catch (error) {
        logger.warn('[shinepartners] Failed to extract row', {
          error: error.message,
        });
      }
    }

    logger.info('[shinepartners] Extracted appointments', { count: appointments.length });
    return appointments;
  }

  /**
   * Extract data from a single table row
   */
  async extractRowData(row) {
    const cells = await row.$$('td');

    if (cells.length < 3) {
      logger.debug('[shinepartners] Skipping row (not enough columns)');
      return null;
    }

    // Extract date, appointment description, and location
    const dateCell = cells[0];
    const appointmentCell = cells[1];
    const locationCell = cells[2];

    const dateText = await this.page.evaluate(el => el.textContent.trim(), dateCell);
    const appointmentText = await this.page.evaluate(el => el.textContent.trim(), appointmentCell);
    const locationText = await this.page.evaluate(el => el.textContent.trim(), locationCell);

    // Parse the date cell which contains both date and time
    // Format: "Mon, 23 Feb 2026\n8:00 am EST"
    const lines = dateText.split('\n').map(l => l.trim()).filter(l => l);

    if (lines.length === 0) {
      logger.debug('[shinepartners] Skipping row (empty date cell)');
      return null;
    }

    // First line is date, second line is time (if present)
    const dateStr = lines[0];
    const timeStr = lines.length > 1 ? lines[1] : '09:00 am EST';

    // Parse date and time
    const dateObj = parseAppointmentDate(dateStr);
    const timeObj = parseAppointmentTime(timeStr);

    if (!dateObj || !timeObj) {
      logger.warn('[shinepartners] Failed to parse date/time', { dateText });
      return null;
    }

    // Build start and end datetime
    const startDateTime = new Date(`${dateObj}T${String(timeObj.hours).padStart(2, '0')}:${String(timeObj.minutes).padStart(2, '0')}:00`);

    // Assume 1 hour duration for appointments
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    return {
      portalType: this.portalType,
      description: appointmentText,
      location: locationText,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: timeObj.timezone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: timeObj.timezone,
      },
      raw: {
        date: dateStr,
        time: timeStr,
        appointment: appointmentText,
        location: locationText,
      },
    };
  }
}

export { ShinePartnersScraper };
