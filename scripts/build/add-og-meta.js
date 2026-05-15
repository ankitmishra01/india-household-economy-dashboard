/**
 * Adds / updates Open Graph meta tags in all indicator pages, index.html and about.html.
 * Safe to re-run — replaces existing og: tags.
 * Usage: node scripts/build/add-og-meta.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..', '..');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages-manifest.json'), 'utf8'));
const BASE_URL = 'https://india-household-economy-dashboard.vercel.app';

// Shared OG image (static branded card — one file, works for all pages)
const OG_IMAGE = `${BASE_URL}/og-image.png`;

function stripOgTags(html) {
  return html.replace(/<meta\s+property="og:[^"]*"[^>]*>\n?/gi, '')
             .replace(/<meta\s+name="twitter:[^"]*"[^>]*>\n?/gi, '')
             .replace(/<meta\s+property="twitter:[^"]*"[^>]*>\n?/gi, '');
}

function buildOgBlock(title, description, url, image) {
  return [
    `  <meta property="og:type" content="website">`,
    `  <meta property="og:title" content="${title}">`,
    `  <meta property="og:description" content="${description}">`,
    `  <meta property="og:url" content="${url}">`,
    `  <meta property="og:image" content="${image}">`,
    `  <meta property="og:site_name" content="India Household Economy Dashboard">`,
    `  <meta name="twitter:card" content="summary_large_image">`,
    `  <meta name="twitter:title" content="${title}">`,
    `  <meta name="twitter:description" content="${description}">`,
    `  <meta name="twitter:image" content="${image}">`,
  ].join('\n');
}

function injectOg(html, title, description, url, image) {
  const clean = stripOgTags(html);
  const ogBlock = buildOgBlock(title, description, url, image);
  // Insert before </head>
  return clean.replace('</head>', `${ogBlock}\n</head>`);
}

function escAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

let count = 0;

// Indicator pages
const pageMap = {};
MANIFEST.pages.forEach(p => { pageMap[p.slug] = p; });

MANIFEST.pages.forEach(page => {
  const htmlPath = path.join(ROOT, 'pages', page.slug, 'index.html');
  if (!fs.existsSync(htmlPath)) return;

  const title = escAttr(`${page.title} — India Household Economy`);
  const description = escAttr(page.subtitle || `Interactive data on ${page.title} across Indian states`);
  const url = `${BASE_URL}/pages/${page.slug}/`;

  let html = fs.readFileSync(htmlPath, 'utf8');
  html = injectOg(html, title, description, url, OG_IMAGE);
  fs.writeFileSync(htmlPath, html, 'utf8');
  count++;
  console.log(`  ✓ ${page.slug}`);
});

// Homepage
{
  const htmlPath = path.join(ROOT, 'index.html');
  const title = escAttr("India's Household Economy — Made Explorable");
  const description = escAttr("Open, interactive maps and charts on wealth, work, health, learning and financial inclusion across all 37 Indian states. Built from HCES, PLFS, NFHS-5 and Census micro-data.");
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = injectOg(html, title, description, BASE_URL + '/', OG_IMAGE);
  fs.writeFileSync(htmlPath, html, 'utf8');
  count++;
  console.log('  ✓ index.html');
}

// About page
{
  const htmlPath = path.join(ROOT, 'about.html');
  if (fs.existsSync(htmlPath)) {
    const title = escAttr("About — India Household Economy Dashboard");
    const description = escAttr("How the dashboard was built: data sources, methodology, scripts and technology behind India's open household economy data platform.");
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = injectOg(html, title, description, BASE_URL + '/about.html', OG_IMAGE);
    fs.writeFileSync(htmlPath, html, 'utf8');
    count++;
    console.log('  ✓ about.html');
  }
}

console.log(`\n✓ OG meta added to ${count} pages`);
