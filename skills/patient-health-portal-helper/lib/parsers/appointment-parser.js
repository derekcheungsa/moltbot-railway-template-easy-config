/**
 * Appointment Parser
 *
 * Parses date and time strings from health portal appointments.
 * Handles various date formats and timezone conversions.
 *
 * @module health-portal/parsers/appointment-parser
 */

import { logger } from '../utils/logger.js';

/**
 * Month name to number mapping
 */
const MONTHS = {
  'jan': '01', 'january': '01',
  'feb': '02', 'february': '02',
  'mar': '03', 'march': '03',
  'apr': '04', 'april': '04',
  'may': '05',
  'jun': '06', 'june': '06',
  'jul': '07', 'july': '07',
  'aug': '08', 'august': '08',
  'sep': '09', 'september': '09',
  'oct': '10', 'october': '10',
  'nov': '11', 'november': '11',
  'dec': '12', 'december': '12',
};

/**
 * Timezone abbreviations to IANA timezone mapping
 */
const TIMEZONE_MAP = {
  'EST': 'America/Toronto',
  'EDT': 'America/Toronto',
  'CST': 'America/Chicago',
  'CDT': 'America/Chicago',
  'MST': 'America/Denver',
  'MDT': 'America/Denver',
  'PST': 'America/Los_Angeles',
  'PDT': 'America/Los_Angeles',
};

/**
 * Parse appointment date string
 * Supports formats like:
 * - "Mon, 23 Feb 2026"
 * - "February 23, 2026"
 * - "2026-02-23"
 *
 * @param {string} dateStr - The date string to parse
 * @returns {string|null} - ISO date string (YYYY-MM-DD) or null if parsing fails
 */
function parseAppointmentDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    logger.warn('[appointment-parser] Invalid date string', { dateStr });
    return null;
  }

  const cleanStr = dateStr.trim().toLowerCase();

  // Format: "Mon, 23 Feb 2026" or "23 Feb 2026"
  const dayMonthYearMatch = cleanStr.match(
    /(?:mon|tue|wed|thu|fri|sat|sun)?\s*,?\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/
  );

  if (dayMonthYearMatch) {
    const [, day, month, year] = dayMonthYearMatch;
    const monthNum = MONTHS[month];

    if (monthNum) {
      const paddedDay = String(day).padStart(2, '0');
      return `${year}-${monthNum}-${paddedDay}`;
    }
  }

  // Format: "February 23, 2026"
  const monthDayYearMatch = cleanStr.match(
    /([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/
  );

  if (monthDayYearMatch) {
    const [, month, day, year] = monthDayYearMatch;
    const monthNum = MONTHS[month];

    if (monthNum) {
      const paddedDay = String(day).padStart(2, '0');
      return `${year}-${monthNum}-${paddedDay}`;
    }
  }

  // Format: "2026-02-23"
  const isoMatch = cleanStr.match(/(\d{4})-(\d{2})-(\d{2})/);

  if (isoMatch) {
    return dateStr.trim(); // Already in ISO format
  }

  // Try native Date parsing as fallback
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // Fall through to error
  }

  logger.error('[appointment-parser] Failed to parse date', { dateStr });
  return null;
}

/**
 * Parse appointment time string
 * Supports formats like:
 * - "8:00 am EST"
 * - "10:30 PM EDT"
 * - "14:00"
 *
 * @param {string} timeStr - The time string to parse
 * @returns {object|null} - Object with hours, minutes, and timezone, or null if parsing fails
 */
function parseAppointmentTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    logger.warn('[appointment-parser] Invalid time string', { timeStr });
    return getDefaultTime();
  }

  const cleanStr = timeStr.trim();

  // Format: "8:00 am EST" or "10:30 PM EDT"
  const twelveHourMatch = cleanStr.match(
    /(\d{1,2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.)(?:\s+(est|edt|cst|cdt|mst|mdt|pst|pdt))?/i
  );

  if (twelveHourMatch) {
    let [, hours, minutes, meridiem, timezone] = twelveHourMatch;
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);
    meridiem = meridiem.toLowerCase().replace(/\./g, '');
    timezone = timezone ? timezone.toUpperCase() : 'EST';

    // Convert to 24-hour format
    if (meridiem === 'pm' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }

    return {
      hours,
      minutes,
      timezone: TIMEZONE_MAP[timezone] || TIMEZONE_MAP['EST'],
    };
  }

  // Format: "14:00" or "14:00:00" (24-hour format)
  const twentyFourHourMatch = cleanStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);

  if (twentyFourHourMatch) {
    let [, hours, minutes] = twentyFourHourMatch;
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);

    return {
      hours,
      minutes,
      timezone: TIMEZONE_MAP['EST'],
    };
  }

  // Try native Date parsing as fallback
  try {
    const date = new Date(`1970-01-01 ${cleanStr}`);
    if (!isNaN(date.getTime())) {
      return {
        hours: date.getHours(),
        minutes: date.getMinutes(),
        timezone: TIMEZONE_MAP['EST'],
      };
    }
  } catch (e) {
    // Fall through to default
  }

  logger.warn('[appointment-parser] Could not parse time, using default', { timeStr });
  return getDefaultTime();
}

/**
 * Get default time (9:00 AM EST)
 */
function getDefaultTime() {
  return {
    hours: 9,
    minutes: 0,
    timezone: TIMEZONE_MAP['EST'],
  };
}

/**
 * Combine date and time into a full ISO datetime string
 *
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {object} timeObj - Time object from parseAppointmentTime
 * @returns {string} - ISO datetime string
 */
function combineDateTime(dateStr, timeObj) {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(5, 7);
  const day = dateStr.substring(8, 10);

  const hours = String(timeObj.hours).padStart(2, '0');
  const minutes = String(timeObj.minutes).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
}

/**
 * Format duration in human-readable form
 *
 * @param {number} minutes - Duration in minutes
 * @returns {string} - Human-readable duration
 */
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export {
  parseAppointmentDate,
  parseAppointmentTime,
  combineDateTime,
  formatDuration,
  getDefaultTime,
  MONTHS,
  TIMEZONE_MAP,
};
