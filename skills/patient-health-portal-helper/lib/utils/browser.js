/**
 * Browser Utility
 *
 * Creates and configures Puppeteer browser instances for web scraping.
 * Optimized for containerized environments (Railway).
 *
 * @module health-portal/utils/browser
 */

import puppeteer from 'puppeteer';
import { logger } from './logger.js';

/**
 * Browser configuration
 */
const BROWSER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1920x1080',
    '--disable-features=IsolateOrigins,site-per-process',
  ],
};

/**
 * Create a browser instance
 *
 * @param {object} options - Browser options
 * @returns {Promise<Browser>} - Puppeteer browser instance
 */
async function createBrowser(options = {}) {
  const config = {
    ...BROWSER_CONFIG,
    ...options,
  };

  logger.debug('[browser] Creating browser instance', {
    headless: config.headless,
  });

  try {
    // Determine which executable to use
    let executablePath = undefined;

    // Check if we're in a container environment
    if (process.env.RAILWAY_ENVIRONMENT || process.env.VERCEL || process.env.DOCKER) {
      // Use Chromium installed via apt-get
      executablePath = '/usr/bin/google-chrome-stable';
    }

    const browser = await puppeteer.launch({
      headless: config.headless ? 'new' : false,
      executablePath,
      args: config.args,
    });

    logger.debug('[browser] Browser created successfully');
    return browser;
  } catch (error) {
    logger.error('[browser] Failed to create browser', {
      error: error.message,
    });

    // Provide helpful error message for common issues
    if (error.message.includes('executable')) {
      throw new Error(
        'Chromium not found. Please ensure Chromium is installed. ' +
        'In Docker: RUN apt-get update && apt-get install -y google-chrome-stable'
      );
    }

    throw error;
  }
}

/**
 * Create a page with common settings
 *
 * @param {Browser} browser - Puppeteer browser instance
 * @returns {Promise<Page>} - Configured page
 */
async function createPage(browser) {
  const page = await browser.newPage();

  // Set viewport
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });

  // Block unnecessary resources for faster loading
  await page.setRequestInterception(true);

  page.on('request', (req) => {
    const resourceType = req.resourceType();

    // Block images, fonts, media if not needed
    if (['image', 'font', 'media'].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  logger.debug('[browser] Page created with optimized settings');
  return page;
}

/**
 * Navigate to URL with retry logic
 *
 * @param {Page} page - Puppeteer page
 * @param {string} url - URL to navigate to
 * @param {object} options - Navigation options
 * @returns {Promise<HTTPResponse>} - Navigation response
 */
async function navigateWithRetry(page, url, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const waitUntil = options.waitUntil || 'networkidle2';
  const timeout = options.timeout || 30000;

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug('[browser] Navigating', { url, attempt });

      const response = await page.goto(url, {
        waitUntil,
        timeout,
      });

      logger.debug('[browser] Navigation successful', {
        url,
        status: response?.status(),
      });

      return response;
    } catch (error) {
      lastError = error;
      logger.warn('[browser] Navigation failed', {
        url,
        attempt,
        error: error.message,
      });

      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  throw new Error(
    `Navigation failed after ${maxRetries} attempts: ${lastError.message}`
  );
}

/**
 * Wait for selector with timeout
 *
 * @param {Page} page - Puppeteer page
 * @param {string} selector - CSS selector
 * @param {object} options - Wait options
 * @returns {Promise<ElementHandle>} - Matching element
 */
async function waitForSelector(page, selector, options = {}) {
  const timeout = options.timeout || 30000;
  const visible = options.visible !== undefined ? options.visible : true;

  try {
    return await page.waitForSelector(selector, {
      timeout,
      visible,
    });
  } catch (error) {
    logger.error('[browser] Selector not found', {
      selector,
      timeout,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Take screenshot for debugging
 *
 * @param {Page} page - Puppeteer page
 * @param {string} filename - Output filename
 * @returns {Promise<Buffer>} - Screenshot buffer
 */
async function takeScreenshot(page, filename) {
  try {
    const screenshot = await page.screenshot({
      path: filename,
      fullPage: true,
    });
    logger.debug('[browser] Screenshot saved', { filename });
    return screenshot;
  } catch (error) {
    logger.error('[browser] Screenshot failed', {
      filename,
      error: error.message,
    });
    throw error;
  }
}

export {
  createBrowser,
  createPage,
  navigateWithRetry,
  waitForSelector,
  takeScreenshot,
  BROWSER_CONFIG,
};
