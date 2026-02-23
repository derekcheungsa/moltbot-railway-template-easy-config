/**
 * Google Calendar Client
 *
 * Client for creating and managing Google Calendar events.
 * Uses the gog skill for Google Workspace API access.
 *
 * @module health-portal/google-calendar
 */

import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
import { logger } from './utils/logger.js';

/**
 * Google Calendar Client class
 */
class GoogleCalendarClient {
  constructor(config) {
    this.config = {
      credentials_path: config.credentials_path,
      state_dir: config.state_dir || '/data/.openclaw/health-portal',
      calendar_id: 'primary', // Use primary calendar by default
    };
    this.initialized = false;
  }

  /**
   * Initialize the Google Calendar client
   * Verifies that gog skill is available and credentials are configured
   */
  async initialize() {
    logger.debug('[google-calendar] Initializing');

    try {
      // Check if gog skill is available
      await this.runGogCommand(['--version']);

      // Verify credentials exist
      await this.verifyCredentials();

      this.initialized = true;
      logger.info('[google-calendar] Initialized successfully');
    } catch (error) {
      logger.error('[google-calendar] Initialization failed', { error: error.message });
      throw new Error(
        'Google Calendar initialization failed. Please ensure gog skill is installed ' +
        'and Google credentials are configured.'
      );
    }
  }

  /**
   * Verify that Google credentials exist and are valid
   */
  async verifyCredentials() {
    try {
      // Check if credentials file exists
      const { stdout } = await execAsync(`test -f "${this.config.credentials_path}" && echo "exists"`);
      if (!stdout.includes('exists')) {
        throw new Error(`Google credentials file not found: ${this.config.credentials_path}`);
      }

      // Test gog calendar access
      await this.runGogCommand(['cal', 'list', '--max-results', '1']);
    } catch (error) {
      throw new Error(
        `Google credentials verification failed: ${error.message}. ` +
        `Please check that your client_secret.json is properly configured.`
      );
    }
  }

  /**
   * Create a calendar event
   *
   * @param {object} eventData - Event data
   * @returns {object} - Created event details
   */
  async createEvent(eventData) {
    logger.debug('[google-calendar] Creating event', { summary: eventData.summary });

    try {
      // Build gog command arguments
      const args = this.buildEventCommand('create', eventData);

      const { stdout, stderr } = await this.runGogCommand(args);

      logger.info('[google-calendar] Event created', { summary: eventData.summary });

      return {
        id: this.extractEventId(stdout),
        htmlLink: this.extractEventLink(stdout),
        data: eventData,
      };
    } catch (error) {
      logger.error('[google-calendar] Failed to create event', {
        error: error.message,
        summary: eventData.summary,
      });
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   *
   * @param {string} eventId - The event ID to update
   * @param {object} eventData - Updated event data
   * @returns {object} - Updated event details
   */
  async updateEvent(eventId, eventData) {
    logger.debug('[google-calendar] Updating event', { eventId });

    try {
      const args = this.buildEventCommand('update', { ...eventData, id: eventId });

      const { stdout } = await this.runGogCommand(args);

      logger.info('[google-calendar] Event updated', { eventId });

      return {
        id: eventId,
        htmlLink: this.extractEventLink(stdout),
        data: eventData,
      };
    } catch (error) {
      logger.error('[google-calendar] Failed to update event', {
        error: error.message,
        eventId,
      });
      throw error;
    }
  }

  /**
   * List upcoming events
   *
   * @param {number} maxResults - Maximum number of events to return
   * @returns {Array<object>} - List of events
   */
  async listUpcomingEvents(maxResults = 100) {
    logger.debug('[google-calendar] Listing upcoming events');

    try {
      const { stdout } = await this.runGogCommand([
        'cal',
        'list',
        '--max-results', String(maxResults),
        '--json',
      ]);

      // Parse JSON output
      const events = JSON.parse(stdout);

      logger.debug('[google-calendar] Retrieved events', { count: events.length });
      return events;
    } catch (error) {
      logger.error('[google-calendar] Failed to list events', { error: error.message });
      return [];
    }
  }

  /**
   * Build gog command arguments for event operations
   */
  buildEventCommand(operation, eventData) {
    const args = ['cal', operation];

    // Add summary/title
    if (eventData.summary) {
      args.push('--title', eventData.summary);
    }

    // Add description
    if (eventData.description) {
      args.push('--description', eventData.description);
    }

    // Add location
    if (eventData.location) {
      args.push('--location', eventData.location);
    }

    // Add start time
    if (eventData.start && eventData.start.dateTime) {
      args.push('--start', eventData.start.dateTime);
    }

    // Add end time
    if (eventData.end && eventData.end.dateTime) {
      args.push('--end', eventData.end.dateTime);
    }

    // Add attendees
    if (eventData.attendees && eventData.attendees.length > 0) {
      const emails = eventData.attendees.map(a => a.email).join(',');
      args.push('--attendees', emails);
    }

    // Add event ID for updates
    if (operation === 'update' && eventData.id) {
      args.push('--event-id', eventData.id);
    }

    // Add JSON output flag
    args.push('--json');

    return args;
  }

  /**
   * Run a gog command
   */
  async runGogCommand(args) {
    const command = `openclaw skill run gog ${args.join(' ')}`;

    logger.debug('[google-calendar] Running gog command', { command });

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000,
        env: {
          ...process.env,
          OPENCLAW_STATE_DIR: this.config.state_dir,
        },
      });

      if (stderr && stderr.includes('ERROR')) {
        throw new Error(stderr);
      }

      return { stdout, stderr };
    } catch (error) {
      logger.error('[google-calendar] gog command failed', {
        command,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Extract event ID from gog output
   */
  extractEventId(output) {
    try {
      const data = JSON.parse(output);
      return data.id || data.eventId;
    } catch (e) {
      // Try regex fallback
      const match = output.match(/event[_-]?id[:\s]+([a-zA-Z0-9_-]+)/i);
      return match ? match[1] : null;
    }
  }

  /**
   * Extract event link from gog output
   */
  extractEventLink(output) {
    try {
      const data = JSON.parse(output);
      return data.htmlLink || data.link;
    } catch (e) {
      // Try regex fallback
      const match = output.match(/https:\/\/calendar\.google\.com\/calendar\/[^\s]+/);
      return match ? match[0] : null;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    // No specific cleanup needed for gog client
    logger.debug('[google-calendar] Cleanup complete');
  }
}

export { GoogleCalendarClient };
