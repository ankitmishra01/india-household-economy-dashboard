#!/usr/bin/env node
/**
 * Run all extraction scripts sequentially.
 * Pass --mock to use built-in 5-state sample data.
 */
const { execSync } = require('child_process');
const path         = require('path');
const fs           = require('fs');

const MOCK = process.argv.includes('--mock') ? ' --mock' : '';
const DIR  = __dirname;

const scripts = [
  'household-consumption',
  'wealth-quintiles',
  'mpi',
  'food-insecurity',
  'housing-utilities',
  'lfpr',
  'unemployment',
  'neet-youth',
  'formal-employment',
  'gender-wage-gap',
  'unpaid-care',
  'oop-expenditure',
  'catastrophic-spending',
  'health-insurance',
  'education-expenditure',
  'literacy',
  'digital-literacy',
  'age-dependency',
  'banking-access',
  'mobile-money',
  'female-assets',
  'ipv-economic-cost',
];

let ok = 0, fail = 0;

for (const slug of scripts) {
  const scriptPath = path.join(DIR, `${slug}.js`);
  if (!fs.existsSync(scriptPath)) {
    console.log(`  ⚠ ${slug}: script not found, skipping`);
    continue;
  }
  try {
    execSync(`node ${scriptPath}${MOCK}`, { stdio: 'inherit' });
    ok++;
  } catch {
    fail++;
  }
}

console.log(`\nExtraction complete: ${ok} succeeded, ${fail} failed.`);
if (fail > 0) process.exit(1);
