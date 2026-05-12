#!/usr/bin/env node
/**
 * Reads data/pages-manifest.json and templates/template-{map|chart|table}.html
 * to generate pages/[slug]/index.html for every page in the manifest.
 * Also creates pages/[slug]/data directories.
 */

const fs   = require('fs');
const path = require('path');

const ROOT      = path.join(__dirname, '..', '..');
const MANIFEST  = path.join(ROOT, 'data', 'pages-manifest.json');
const TEMPLATES = path.join(ROOT, 'templates');
const PAGES_DIR = path.join(ROOT, 'pages');

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

// Load templates once
const templates = {
  map:    fs.readFileSync(path.join(TEMPLATES, 'template-map.html'),   'utf8'),
  chart:  fs.readFileSync(path.join(TEMPLATES, 'template-chart.html'), 'utf8'),
  table:  fs.readFileSync(path.join(TEMPLATES, 'template-table.html'), 'utf8'),
};

let generated = 0;
let errors    = 0;

for (const page of manifest.pages) {
  try {
    const template = templates[page.template] || templates.map;
    const html = template
      .replace(/\{\{PAGE_SLUG\}\}/g,     page.slug)
      .replace(/\{\{PAGE_TITLE\}\}/g,    escapeHtml(page.title))
      .replace(/\{\{PAGE_SUBTITLE\}\}/g, escapeHtml(page.subtitle))
      .replace(/\{\{PAGE_THEME\}\}/g,    page.theme);

    const outDir = path.join(PAGES_DIR, page.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

    generated++;
    console.log(`  ✓ pages/${page.slug}/index.html`);
  } catch (err) {
    errors++;
    console.error(`  ✗ ${page.slug}: ${err.message}`);
  }
}

console.log(`\nGenerated ${generated} pages${errors ? `, ${errors} errors` : ''}.`);
if (errors > 0) process.exit(1);

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
