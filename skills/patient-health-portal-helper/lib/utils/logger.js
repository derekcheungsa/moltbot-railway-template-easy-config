/**
 * Logger Utility
 *
 * Simple logging utility for the health portal module.
 * Supports different log levels and structured logging.
 *
 * @module health-portal/utils/logger
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const LOG_LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR',
};

/**
 * Get current log level from environment
 */
function getCurrentLogLevel() {
  const envLevel = process.env.HEALTH_PORTAL_LOG_LEVEL || 'INFO';
  return LOG_LEVELS[envLevel.toUpperCase()] || LOG_LEVELS.INFO;
}

/**
 * Format log entry
 */
function formatLogEntry(level, context, data = {}) {
  const timestamp = new Date().toISOString();
  const levelName = LOG_LEVEL_NAMES[level];

  const entry = {
    timestamp,
    level: levelName,
    ...context,
    ...data,
  };

  return JSON.stringify(entry);
}

/**
 * Logger class
 */
class Logger {
  constructor(prefix = '') {
    this.prefix = prefix;
    this.currentLevel = getCurrentLogLevel();
  }

  log(level, context, data) {
    if (level < this.currentLevel) {
      return; // Skip logs below current level
    }

    const message = formatLogEntry(level, { prefix: this.prefix, ...context }, data);

    switch (level) {
      case LOG_LEVELS.DEBUG:
      case LOG_LEVELS.INFO:
        console.log(message);
        break;
      case LOG_LEVELS.WARN:
        console.warn(message);
        break;
      case LOG_LEVELS.ERROR:
        console.error(message);
        break;
    }
  }

  debug(context, data) {
    this.log(LOG_LEVELS.DEBUG, context, data);
  }

  info(context, data) {
    this.log(LOG_LEVELS.INFO, context, data);
  }

  warn(context, data) {
    this.log(LOG_LEVELS.WARN, context, data);
  }

  error(context, data) {
    this.log(LOG_LEVELS.ERROR, context, data);
  }
}

// Create singleton logger instance
const logger = new Logger('[health-portal]');

export { logger, Logger, LOG_LEVELS };
