#!/usr/bin/env tsx

/**
 * Scraper runner with proper environment loading
 */

import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
const envPath = join(__dirname, '../../.env');
console.log(`Loading environment from: ${envPath}`);
const result = config({ path: envPath });

if (result.error) {
  console.error('Error loading .env:', result.error);
  process.exit(1);
}

console.log('✅ Environment loaded');
console.log(`  POSTGRES_URL: ${process.env.POSTGRES_URL ? '✓ Set' : '✗ Missing'}`);
console.log(`  PEXELS_API_KEY: ${process.env.PEXELS_API_KEY ? '✓ Set' : '✗ Missing'}`);
console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Missing'}`);
console.log('');

// Now import and run main
const { default: main } = await import('./src/main.js');
