/**
 * Base Scraper Class
 *
 * Abstract base class for health portal scrapers.
 * Provides common functionality for authentication, page navigation, and data extraction.
 *
 * @module health-portal/scrapers/base
 */

import { createBrowser } from '../utils/browser.js';
import { logger } from '../utils/logger.js';

class BaseScraper {
  constructor(config) {
    this.config = {
      portal_url: config.portal_url,
      username: config.username,
      password: config.password,
      timeout: config.timeout || 30000,
      headless: config.headless !== undefined ? config.headless : true,
    };
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialize the browser and page
   */
  async initialize() {
    this.browser = await createBrowser({
      headless: this.config.headless,
    });
    this.page = await this.browser.newPage();

    // Set default timeout
    this.page.setDefaultTimeout(this.config.timeout);

    // Set user agent to avoid detection
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    logger.debug('[scraper] Browser initialized');
  }

  /**
   * Authenticate with the health portal
   * Must be implemented by subclasses
   */
  async authenticate() {
    throw new Error('authenticate() must be implemented by subclass');
  }

  /**
   * Navigate to the appointments page
   * Must be implemented by subclasses
   */
  async navigateToAppointments() {
    throw new Error('navigateToAppointments() must be implemented by subclass');
  }

  /**
   * Extract appointment data from the page
   * Must be implemented by subclasses
   */
  async extractAppointments() {
    throw new Error('extractAppointments() must be implemented by subclass');
  }

  /**
   * Main scraping orchestration method
   */
  async scrape() {
    try {
      await this.initialize();
      await this.authenticate();
      await this.navigateToAppointments();
      const appointments = await this.extractAppointments();
      return appointments;
    } catch (error) {
      logger.error('[scraper] Scraping failed', {
        error: error.message,
        portal: this.config.portal_url,
      });
      throw error;
    }
  }

  /**
   * Close the browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      logger.debug('[scraper] Browser closed');
    }
  }

  /**
   * Wait for a selector to appear on the page
   */
  async waitForSelector(selector, options = {}) {
    return await this.page.waitForSelector(selector, {
      timeout: this.config.timeout,
      ...options,
    });
  }

  /**
   * Take a screenshot for debugging
   */
  async screenshot(filename) {
    if (this.page) {
      await this.page.screenshot({ path: filename, fullPage: true });
      logger.debug('[scraper] Screenshot saved', { filename });
    }
  }

  /**
   * Check if we're on a login page
   * Useful for detecting session expiration
   */
  isOnLoginPage() {
    // Subclasses can override this with specific detection logic
    return false;
  }
}

export { BaseScraper };
