#!/usr/bin/env node
/**
 * Applies template-map.html to all indicator pages (except household-consumption,
 * which was already manually updated).
 */
const fs   = require('fs');
const path = require('path');

const ROOT      = path.join(__dirname, '..');
const TEMPLATE  = fs.readFileSync(path.join(ROOT, 'templates/template-map.html'), 'utf8');
const MANIFEST  = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/pages-manifest.json'), 'utf8'));

const THEME_LABELS = {
  wealth:   'Wealth & Living',
  labor:    'Labour & Work',
  health:   'Health Economics',
  hcapital: 'Human Capital',
  finance:  'Financial Inclusion',
};

const SKIP = new Set(['household-consumption']); // already manually updated

let updated = 0;
MANIFEST.pages.forEach(page => {
  if (SKIP.has(page.slug)) return;

  const pageDir = path.join(ROOT, 'pages', page.slug);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  const themeLabel = THEME_LABELS[page.theme] || page.theme || '';

  const html = TEMPLATE
    .replace(/\{\{PAGE_TITLE\}\}/g,        page.title    || '')
    .replace(/\{\{PAGE_SUBTITLE\}\}/g,     page.subtitle || '')
    .replace(/\{\{PAGE_SLUG\}\}/g,         page.slug)
    .replace(/\{\{PAGE_THEME\}\}/g,        page.theme    || '')
    .replace(/\{\{PAGE_THEME_LABEL\}\}/g,  themeLabel);

  const outPath = path.join(pageDir, 'index.html');
  fs.writeFileSync(outPath, html);
  console.log(`✓ ${page.slug}`);
  updated++;
});

console.log(`\nDone — ${updated} pages updated.`);
