#!/usr/bin/env node

/**
 * Test script for real patient portal
 * Uses your actual portal credentials from environment variables
 *
 * Usage:
 *   # Set environment variables first
 *   export HEALTH_PORTAL_URL="https://..."
 *   export HEALTH_PORTAL_USERNAME="your_username"
 *   export HEALTH_PORTAL_PASSWORD="your_password"
 *
 *   node test-real-portal.js
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ScraperFactory } from './lib/scrapers/index.js';
import { logger } from './lib/utils/logger.js';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: '.env' });

// Configuration from environment variables
const config = {
  portal_url: process.env.HEALTH_PORTAL_URL,
  portal_type: process.env.HEALTH_PORTAL_TYPE || 'ShinePartners',
  username: process.env.HEALTH_PORTAL_USERNAME,
  password: process.env.HEALTH_PORTAL_PASSWORD,
  family_attendees: (process.env.HEALTH_PORTAL_FAMILY_ATTENDEES || '').split(',').filter(e => e),
  enabled: process.env.HEALTH_PORTAL_ENABLED !== 'false',
};

console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     🏥 Patient Health Portal Helper - Real Portal Test    ║
║                                                          ║
║     ⚠️  TESTING WITH REAL CREDENTIALS                     ║
║                                                          ║
║     Portal: ${config.portal_url || 'NOT SET'}          ║
║     Type: ${config.portal_type || 'NOT SET'}              ║
║     Username: ${config.username || 'NOT SET'}             ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);

if (!config.portal_url || !config.username || !config.password) {
  console.error('\n❌ Error: Missing required credentials!');
  console.error('\nPlease set the following environment variables:');
  console.error('  HEALTH_PORTAL_URL');
  console.error('  HEALTH_PORTAL_USERNAME');
  console.error('  HEALTH_PORTAL_PASSWORD');
  console.error('\nExample:');
  console.error('  export HEALTH_PORTAL_URL="https://patientconnect.shinepartners.ca/..."');
  console.error('  export HEALTH_PORTAL_USERNAME="your_username"');
  console.error('  export HEALTH_PORTAL_PASSWORD="your_password"');
  process.exit(1);
}

async function runTest() {
  let scraper;

  try {
    console.log('\n📋 Step 1: Creating scraper instance...');
    scraper = ScraperFactory.create(config.portal_type, {
      portal_url: config.portal_url,
      username: config.username,
      password: config.password,
      headless: true, // Run in headless mode
    });
    console.log('✅ Scraper instance created successfully');

    console.log('\n📋 Step 2: Authenticating to portal...');
    await scraper.authenticate();
    console.log('✅ Authentication successful');

    console.log('\n📋 Step 3: Navigating to appointments page...');
    await scraper.navigateToAppointments();
    console.log('✅ Navigation successful');

    console.log('\n📋 Step 4: Extracting appointments...');
    const appointments = await scraper.extractAppointments();

    console.log('\n✅ Scraping completed successfully!');
    console.log(`\n📊 Found ${appointments.length} appointment(s)`);

    if (appointments.length > 0) {
      console.log('\n📋 Extracted Appointments:');
      appointments.forEach((apt, index) => {
        console.log(`\n   ${index + 1}. ${apt.description}`);
        console.log(`      📅 Date: ${apt.raw.date}`);
        console.log(`      🕐 Time: ${apt.raw.time}`);
        console.log(`      📍 Location: ${apt.raw.location}`);
        console.log(`      🌐 Start: ${apt.start.dateTime}`);
        console.log(`      🌐 End: ${apt.end.dateTime}`);
      });

      // Show family attendees info
      if (config.family_attendees.length > 0) {
        console.log(`\n👥 Family members to invite: ${config.family_attendees.join(', ')}`);
      }
    } else {
      console.log('\n📭 No upcoming appointments found.');
    }

    return {
      success: true,
      count: appointments.length,
      appointments: appointments,
    };
  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error(`Error: ${error.message}`);

    // Provide helpful error messages
    if (error.message.includes('Login failed')) {
      console.error('\n💡 Tip: Check your username and password');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Tip: The portal might be slow or the URL might be incorrect');
    } else if (error.message.includes('Cannot find')) {
      console.error('\n💡 Tip: Check that the portal URL is correct and accessible');
    }

    console.error(`\nStack trace:\n${error.stack}`);

    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (scraper) {
      console.log('\n📋 Step 5: Cleaning up...');
      await scraper.close();
      console.log('✅ Cleanup completed');
    }
  }
}

// Run the test
console.log('Starting test...\n');
runTest()
  .then((result) => {
    if (result.success) {
      console.log('\n✅ Test completed successfully!');
      console.log(`\n📊 Summary: ${result.count} appointments extracted`);
      process.exit(0);
    } else {
      console.log('\n❌ Test failed!');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
