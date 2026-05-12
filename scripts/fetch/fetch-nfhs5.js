#!/usr/bin/env node
/**
 * Downloads NFHS-5 state-level CSV from pratapvardhan/NFHS-5 (CC BY 4.0)
 * Output: data/source/nfhs-5/nfhs5_states.csv
 */
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const URL     = 'https://raw.githubusercontent.com/pratapvardhan/NFHS-5/master/NFHS-5-States.csv';
const OUT_DIR = path.join(__dirname, '..', '..', 'data', 'source', 'nfhs-5');
const OUT     = path.join(OUT_DIR, 'nfhs5_states.csv');

fs.mkdirSync(OUT_DIR, { recursive: true });

console.log('Downloading NFHS-5 states CSV...');
https.get(URL, res => {
  if (res.statusCode !== 200) {
    console.error(`HTTP ${res.statusCode}`);
    process.exit(1);
  }
  const file = fs.createWriteStream(OUT);
  res.pipe(file);
  file.on('finish', () => {
    const kb = Math.round(fs.statSync(OUT).size / 1024);
    console.log(`✓ Saved ${OUT} (${kb} KB)`);
  });
}).on('error', err => {
  console.error(err.message);
  process.exit(1);
});
