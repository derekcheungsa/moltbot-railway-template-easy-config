/**
 * Health Portal Scraper Module
 *
 * Main entry point for health portal appointment synchronization.
 * Supports multiple portal types with automatic detection and scraping.
 *
 * @module health-portal
 */

import { ScraperFactory } from './scrapers/index.js';
import { GoogleCalendarClient } from './google-calendar.js';
import { encrypt, decrypt } from './utils/crypto.js';
import { logger } from './utils/logger.js';

/**
 * Main HealthPortalSync class for orchestrating the sync process
 */
class HealthPortalSync {
  constructor(config) {
    this.config = {
      portal_url: config.portal_url,
      portal_type: config.portal_type || 'ShinePartners',
      username: config.username,
      password: config.password_encrypted ? decrypt(config.password_encrypted) : config.password,
      family_attendees: config.family_attendees || [],
      sync_time: config.sync_time || '09:00',
      enabled: config.enabled !== undefined ? config.enabled : true,
      google_credentials_path: config.google_credentials_path || '/data/.openclaw/credentials/client_secret.json',
      state_dir: config.state_dir || '/data/.openclaw/health-portal',
    };
    this.scraper = null;
    this.calendarClient = null;
  }

  /**
   * Initialize the sync process
   * Creates scraper instance and Google Calendar client
   */
  async initialize() {
    if (!this.config.enabled) {
      logger.info('[health-portal] Sync is disabled');
      return false;
    }

    try {
      // Create appropriate scraper based on portal type
      this.scraper = ScraperFactory.create(this.config.portal_type, {
        portal_url: this.config.portal_url,
        username: this.config.username,
        password: this.config.password,
      });

      // Initialize Google Calendar client
      this.calendarClient = new GoogleCalendarClient({
        credentials_path: this.config.google_credentials_path,
        state_dir: this.config.state_dir,
      });

      await this.calendarClient.initialize();

      logger.info('[health-portal] Initialized successfully', {
        portal_type: this.config.portal_type,
        portal_url: this.config.portal_url,
      });

      return true;
    } catch (error) {
      logger.error('[health-portal] Initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Run the sync process
   * 1. Scrape appointments from health portal
   * 2. Parse and normalize appointment data
   * 3. Create/update Google Calendar events
   * 4. Send notifications
   */
  async sync(options = {}) {
    const { manual = false } = options;

    if (!this.config.enabled) {
      logger.info('[health-portal] Sync is disabled, skipping');
      return { success: false, reason: 'disabled' };
    }

    logger.info('[health-portal] Starting sync', { manual });

    try {
      // Step 1: Scrape appointments from portal
      const appointments = await this.scrapeAppointments();
      logger.info('[health-portal] Scraped appointments', { count: appointments.length });

      if (appointments.length === 0) {
        logger.info('[health-portal] No appointments found, nothing to sync');
        return { success: true, created: 0, updated: 0, skipped: 0 };
      }

      // Step 2: Sync appointments to Google Calendar
      const results = await this.syncToCalendar(appointments);

      logger.info('[health-portal] Sync completed', {
        created: results.created,
        updated: results.updated,
        skipped: results.skipped,
      });

      return {
        success: true,
        appointments: appointments.length,
        ...results,
      };
    } catch (error) {
      logger.error('[health-portal] Sync failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Scrape appointments from the health portal
   */
  async scrapeAppointments() {
    if (!this.scraper) {
      throw new Error('Scraper not initialized. Call initialize() first.');
    }

    const appointments = await this.scraper.scrape();

    // Normalize and validate appointment data
    return appointments.map(apt => ({
      ...apt,
      summary: apt.description || 'Medical Appointment',
      location: apt.location || '',
      description: this.buildEventDescription(apt),
    }));
  }

  /**
   * Build event description for Google Calendar
   */
  buildEventDescription(appointment) {
    const lines = [
      'Appointment synced from Health Portal',
      '',
      `Type: ${appointment.description || 'N/A'}`,
      `Location: ${appointment.location || 'N/A'}`,
    ];

    if (appointment.portalType) {
      lines.push(`Source: ${appointment.portalType}`);
    }

    return lines.join('\n');
  }

  /**
   * Sync appointments to Google Calendar
   */
  async syncToCalendar(appointments) {
    if (!this.calendarClient) {
      throw new Error('Calendar client not initialized. Call initialize() first.');
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
    };

    // Get existing calendar events to avoid duplicates
    const existingEvents = await this.calendarClient.listUpcomingEvents();
    const existingEventMap = new Map(
      existingEvents.map(event => [
        this.generateEventKey(event),
        event,
      ])
    );

    for (const appointment of appointments) {
      try {
        const eventKey = this.generateEventKey(appointment);
        const existingEvent = existingEventMap.get(eventKey);

        if (existingEvent) {
          // Update existing event
          await this.calendarClient.updateEvent(existingEvent.id, appointment);
          results.updated++;
        } else {
          // Create new event
          await this.calendarClient.createEvent({
            ...appointment,
            attendees: this.config.family_attendees.map(email => ({ email })),
          });
          results.created++;
        }
      } catch (error) {
        logger.error('[health-portal] Failed to sync appointment', {
          error: error.message,
          appointment: appointment.description,
        });
        results.skipped++;
      }
    }

    return results;
  }

  /**
   * Generate a unique key for an appointment/event
   * Used for deduplication
   */
  generateEventKey(appointment) {
    return `${appointment.start.dateTime}-${appointment.summary}-${appointment.location}`;
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.scraper) {
      await this.scraper.close();
    }
    if (this.calendarClient) {
      await this.calendarClient.cleanup();
    }
  }
}

/**
 * Create a sync instance from configuration
 */
async function createSync(config) {
  const sync = new HealthPortalSync(config);
  await sync.initialize();
  return sync;
}

/**
 * Run a one-time sync (for manual sync operations)
 */
async function runManualSync(config) {
  const sync = await createSync(config);
  try {
    return await sync.sync({ manual: true });
  } finally {
    await sync.cleanup();
  }
}

export {
  HealthPortalSync,
  createSync,
  runManualSync,
  encrypt,
  decrypt,
};
