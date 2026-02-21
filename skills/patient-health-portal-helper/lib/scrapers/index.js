/**
 * Scraper Factory
 *
 * Factory for creating portal-specific scrapers.
 * Automatically detects portal type or creates based on configuration.
 *
 * @module health-portal/scrapers
 */

import { ShinePartnersScraper } from './shinepartners.js';
import { MockPortalScraper } from './mockportal.js';
import { logger } from '../utils/logger.js';

/**
 * Available scraper types
 */
const SCRAPER_TYPES = {
  SHINEPARTNERS: 'ShinePartners',
  MOCKPORTAL: 'MockPortal',
  MYCHART: 'MyChart',
  CERNER: 'Cerner',
  ATHENAHEALTH: 'AthenaHealth',
  EPIC: 'Epic',
};

/**
 * Scraper registry
 */
const SCRAPERS = {
  [SCRAPER_TYPES.SHINEPARTNERS]: ShinePartnersScraper,
  [SCRAPER_TYPES.MOCKPORTAL]: MockPortalScraper,
  // Additional scrapers can be registered here
  // [SCRAPER_TYPES.MYCHART]: MyChartScraper,
  // [SCRAPER_TYPES.CERNER]: CernerScraper,
  // [SCRAPER_TYPES.ATHENAHEALTH]: AthenaHealthScraper,
  // [SCRAPER_TYPES.EPIC]: EpicScraper,
};

/**
 * ScraperFactory class
 */
class ScraperFactory {
  /**
   * Create a scraper instance for the specified portal type
   *
   * @param {string} portalType - The type of portal (e.g., 'ShinePartners', 'MyChart')
   * @param {object} config - Configuration object with portal_url, username, password
   * @returns {BaseScraper} - A scraper instance
   */
  static create(portalType, config) {
    const ScraperClass = SCRAPERS[portalType];

    if (!ScraperClass) {
      logger.warn('[scraper-factory] Unknown portal type, using default', {
        portalType,
        available: Object.keys(SCRAPERS),
      });

      // Try to auto-detect from URL
      const detectedType = this.detectFromUrl(config.portal_url);
      if (detectedType && SCRAPERS[detectedType]) {
        logger.info('[scraper-factory] Auto-detected portal type', { detectedType });
        return new SCRAPERS[detectedType](config);
      }

      throw new Error(
        `Unsupported portal type: ${portalType}. ` +
        `Supported types: ${Object.keys(SCRAPERS).join(', ')}`
      );
    }

    logger.info('[scraper-factory] Creating scraper', { portalType });
    return new ScraperClass(config);
  }

  /**
   * Detect portal type from URL
   *
   * @param {string} url - The portal URL
   * @returns {string|null} - Detected portal type or null
   */
  static detectFromUrl(url) {
    const lowerUrl = url.toLowerCase();

    // Mock portal detection (for testing)
    if (lowerUrl.includes('localhost') ||
        lowerUrl.includes('127.0.0.1') ||
        lowerUrl.includes('mock') ||
        lowerUrl.includes('test-mock-portal')) {
      return SCRAPER_TYPES.MOCKPORTAL;
    }

    // Shine Partners detection
    if (lowerUrl.includes('shinepartners.ca')) {
      return SCRAPER_TYPES.SHINEPARTNERS;
    }

    // MyChart detection
    if (lowerUrl.includes('mychart') ||
        lowerUrl.includes('mychartportal') ||
        lowerUrl.includes('epicmychart')) {
      return SCRAPER_TYPES.MYCHART;
    }

    // Cerner detection
    if (lowerUrl.includes('cerner') ||
        lowerUrl.includes('powerchart') ||
        lowerUrl.includes('healtheintent')) {
      return SCRAPER_TYPES.CERNER;
    }

    // AthenaHealth detection
    if (lowerUrl.includes('athenahealth') ||
        lowerUrl.includes('athena')) {
      return SCRAPER_TYPES.ATHENAHEALTH;
    }

    // Epic detection (besides MyChart)
    if (lowerUrl.includes('epic') ||
        lowerUrl.includes('epiccare') ||
        lowerUrl.includes('mychart') === false && lowerUrl.includes('chart')) {
      return SCRAPER_TYPES.EPIC;
    }

    return null;
  }

  /**
   * Get list of supported portal types
   */
  static getSupportedTypes() {
    return Object.keys(SCRAPERS);
  }

  /**
   * Check if a portal type is supported
   */
  static isSupported(portalType) {
    return portalType in SCRAPERS;
  }
}

export {
  ScraperFactory,
  SCRAPER_TYPES,
};
