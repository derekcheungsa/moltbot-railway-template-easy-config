/**
 * Mock Portal Scraper
 *
 * Scraper for the mock patient portal used for testing.
 * This is a simplified scraper designed for the test-mock-portal.
 *
 * @module health-portal/scrapers/mockportal
 */

import { BaseScraper } from './base.js';
import { parseAppointmentDate, parseAppointmentTime } from '../parsers/appointment-parser.js';
import { logger } from '../utils/logger.js';

class MockPortalScraper extends BaseScraper {
  constructor(config) {
    super(config);
    this.portalType = 'MockPortal';
  }

  /**
   * Authenticate with the Mock Portal
   */
  async authenticate() {
    logger.debug('[mockportal] Starting authentication');

    // Navigate to portal URL
    await this.page.goto(this.config.portal_url, {
      waitUntil: 'networkidle2',
    });

    // Check if we're already on appointments page (session active)
    if (this.page.url().includes('appointments.html')) {
      logger.debug('[mockportal] Already authenticated (session active)');
      return;
    }

    // Wait for login form
    await this.waitForSelector('input[name="username"]');

    // Fill in credentials
    await this.page.type('input[name="username"]', this.config.username, { delay: 50 });
    await this.page.type('input[name="password"]', this.config.password, { delay: 50 });

    // Submit form
    await this.page.click('button[type="submit"]');

    // Wait for URL to change to appointments page (mock portal uses JavaScript for navigation)
    await this.page.waitForFunction(
      () => window.location.pathname.includes('appointments.html') || document.title.includes('Appointments'),
      { timeout: this.config.timeout }
    );

    // Check for login errors
    const errorElement = await this.page.$('.error');
    if (errorElement) {
      const errorText = await this.page.evaluate(el => el.textContent, errorElement);
      throw new Error(`Login failed: ${errorText}`);
    }

    logger.info('[mockportal] Authentication successful');
  }

  /**
   * Navigate to the appointments page
   */
  async navigateToAppointments() {
    logger.debug('[mockportal] Navigating to appointments page');

    // If not already on appointments page, navigate there
    if (!this.page.url().includes('appointments.html')) {
      await this.page.goto(`${this.config.portal_url}/appointments.html`, {
        waitUntil: 'networkidle2',
      });
    }

    // Wait for appointments table
    await this.waitForSelector('.appointments-table');

    logger.info('[mockportal] Successfully navigated to appointments page');
  }

  /**
   * Extract appointment data from the page
   */
  async extractAppointments() {
    logger.debug('[mockportal] Extracting appointments');

    // Wait for appointment table to load
    await this.waitForSelector('table tbody tr');

    // Get all rows from the table body
    const rows = await this.page.$$('table tbody tr');

    if (rows.length === 0) {
      logger.warn('[mockportal] No appointment rows found');
      return [];
    }

    const appointments = [];

    for (const row of rows) {
      try {
        const appointment = await this.extractRowData(row);
        if (appointment) {
          appointments.push(appointment);
        }
      } catch (error) {
        logger.warn('[mockportal] Failed to extract row', {
          error: error.message,
        });
      }
    }

    logger.info('[mockportal] Extracted appointments', { count: appointments.length });
    return appointments;
  }

  /**
   * Extract data from a single table row
   */
  async extractRowData(row) {
    const cells = await row.$$('td');

    if (cells.length < 3) {
      logger.debug('[mockportal] Skipping row (not enough columns)');
      return null;
    }

    // Extract date, appointment description, and location
    const dateCell = cells[0];
    const appointmentCell = cells[1];
    const locationCell = cells[2];

    // For the mock portal, date and time are in separate divs
    const dateText = await this.page.evaluate(el => {
      const dateDiv = el.querySelector('.date');
      return dateDiv ? dateDiv.textContent.trim() : '';
    }, dateCell);

    const timeText = await this.page.evaluate(el => {
      const timeDiv = el.querySelector('.time');
      return timeDiv ? timeDiv.textContent.trim() : '';
    }, dateCell);

    const appointmentText = await this.page.evaluate(el => el.textContent.trim(), appointmentCell);
    const locationText = await this.page.evaluate(el => el.textContent.trim(), locationCell);

    if (!dateText) {
      logger.debug('[mockportal] Skipping row (empty date cell)');
      return null;
    }

    // Parse date and time
    const dateObj = parseAppointmentDate(dateText);
    const timeObj = parseAppointmentTime(timeText);

    if (!dateObj || !timeObj) {
      logger.warn('[mockportal] Failed to parse date/time', { dateText, timeText });
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
        date: dateText,
        time: timeText,
        appointment: appointmentText,
        location: locationText,
      },
    };
  }
}

export { MockPortalScraper };
