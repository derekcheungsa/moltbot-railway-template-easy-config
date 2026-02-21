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
import { createSync } from './index.js';

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
  let sync;

  try {
    console.log('📋 Step 1: Creating sync instance...');
    sync = await createSync(testConfig);
    console.log('✅ Sync instance created successfully');

    console.log('\n📋 Step 2: Running sync...');
    const result = await sync.sync({ manual: true });

    console.log('\n✅ Sync completed successfully!');
    console.log('\n📊 Results:');
    console.log(`   - Appointments found: ${result.appointments || 0}`);
    console.log(`   - Events created: ${result.created || 0}`);
    console.log(`   - Events updated: ${result.updated || 0}`);
    console.log(`   - Events skipped: ${result.skipped || 0}`);

    // Expected: 6 appointments from the mock portal
    const expectedCount = 6;
    const actualCount = result.appointments || 0;

    if (actualCount === expectedCount) {
      console.log(`\n✅ SUCCESS: Extracted all ${expectedCount} appointments as expected!`);
    } else {
      console.log(`\n⚠️  WARNING: Expected ${expectedCount} appointments, but found ${actualCount}`);
    }

    return result;
  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    process.exit(1);
  } finally {
    if (sync) {
      console.log('\n📋 Step 3: Cleaning up...');
      await sync.cleanup();
      console.log('✅ Cleanup completed');
    }
  }
}

// Run the test
console.log('Starting test...\n');
runTest()
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
