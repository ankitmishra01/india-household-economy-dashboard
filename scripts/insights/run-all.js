#!/usr/bin/env node
/**
 * Run insights generation for all pages sequentially.
 * Pass --slug <name> to run a single page only.
 *
 * Usage:
 *   node scripts/insights/run-all.js
 *   node scripts/insights/run-all.js --slug household-consumption
 */
const { execSync } = require('child_process');
const path         = require('path');
const fs           = require('fs');

const ROOT   = path.join(__dirname, '..', '..');
const RUNNER = path.join(__dirname, 'run-insights.js');

const slugArg = (() => {
  const i = process.argv.indexOf('--slug');
  return i !== -1 ? process.argv[i + 1] : null;
})();

const allSlugs = [
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

const slugs = slugArg ? [slugArg] : allSlugs;

let ok = 0, skip = 0, fail = 0;

for (const slug of slugs) {
  const dataFile = path.join(ROOT, 'data', 'pages', slug, 'data.json');
  if (!fs.existsSync(dataFile)) {
    console.log(`  ⚠ ${slug}: data.json not found — run extract script first`);
    skip++;
    continue;
  }
  try {
    execSync(`node ${RUNNER} ${slug}`, { stdio: 'inherit' });
    ok++;
  } catch {
    fail++;
  }
}

console.log(`\nInsights complete: ${ok} succeeded, ${skip} skipped, ${fail} failed.`);
if (fail > 0) process.exit(1);
