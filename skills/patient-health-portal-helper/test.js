#!/usr/bin/env node

/**
 * Test script for the patient-health-portal-helper skill
 * Tests the scraper against the mock portal
 *
 * Usage:
 *   node test.js
 *
 * Environment variables:
 *   MOCK_PORTAL_URL - URL of the mock portal (default: http://localhost:8080)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ScraperFactory } from './lib/scrapers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const testConfig = {
  portal_url: process.env.MOCK_PORTAL_URL || 'http://localhost:8080',
  portal_type: 'MockPortal',
  username: 'testuser',
  password: 'testpass123',
  family_attendees: ['test-family@example.com'],
  enabled: true,
};

console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     🏥 Patient Health Portal Helper - Test Script        ║
║                                                          ║
║     Testing against Mock Portal                          ║
║     URL: ${testConfig.portal_url.padEnd(45)}║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);

async function runTest() {
  let scraper;

  try {
    console.log('📋 Step 1: Creating scraper instance...');
    scraper = ScraperFactory.create(testConfig.portal_type, {
      portal_url: testConfig.portal_url,
      username: testConfig.username,
      password: testConfig.password,
    });
    console.log('✅ Scraper instance created successfully');

    console.log('\n📋 Step 2: Running scraper...');
    const appointments = await scraper.scrape();

    console.log('\n✅ Scraping completed successfully!');
    console.log('\n📊 Results:');
    console.log(`   - Appointments found: ${appointments.length}`);

    // Display extracted appointments
    if (appointments.length > 0) {
      console.log('\n📋 Extracted Appointments:');
      appointments.forEach((apt, index) => {
        console.log(`\n   ${index + 1}. ${apt.description}`);
        console.log(`      Date: ${apt.raw.date} at ${apt.raw.time}`);
        console.log(`      Location: ${apt.raw.location}`);
        console.log(`      Start: ${apt.start.dateTime}`);
        console.log(`      End: ${apt.end.dateTime}`);
      });
    }

    // Expected: 6 appointments from the mock portal
    const expectedCount = 6;
    const actualCount = appointments.length;

    if (actualCount === expectedCount) {
      console.log(`\n✅ SUCCESS: Extracted all ${expectedCount} appointments as expected!`);
      return { success: true, count: actualCount };
    } else {
      console.log(`\n⚠️  WARNING: Expected ${expectedCount} appointments, but found ${actualCount}`);
      return { success: false, count: actualCount };
    }
  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    return { success: false, error: error.message };
  } finally {
    if (scraper) {
      console.log('\n📋 Step 3: Cleaning up...');
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
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Test failed!');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
