#!/usr/bin/env node
/**
 * Generate AI insights for a single dashboard page.
 *
 * Usage:
 *   node scripts/insights/run-insights.js <slug>
 *   node scripts/insights/run-insights.js household-consumption
 *
 * Requires ANTHROPIC_API_KEY in env (or .env file).
 *
 * Outputs:
 *   data/pages/<slug>/insights.json       — supported/mostly_supported blocks only
 *   data/pages/<slug>/factcheck-report.json — all blocks with verdicts + evidence
 */

try { require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') }); } catch (_) {}

const fs      = require('fs');
const path    = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { buildPrompt } = require('./prompt-template');

const ROOT    = path.join(__dirname, '..', '..');
const MODEL   = 'claude-sonnet-4-6';
const slug    = process.argv[2];

if (!slug) {
  console.error('Usage: node run-insights.js <slug>');
  process.exit(1);
}

const DATA_FILE  = path.join(ROOT, 'data', 'pages', slug, 'data.json');
const INS_FILE   = path.join(ROOT, 'data', 'pages', slug, 'insights.json');
const RPT_FILE   = path.join(ROOT, 'data', 'pages', slug, 'factcheck-report.json');

if (!fs.existsSync(DATA_FILE)) {
  console.error(`✗ ${slug}: data.json not found at ${DATA_FILE}`);
  console.error('  Run the extract script first: node scripts/extract/' + slug + '.js --mock');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('✗ ANTHROPIC_API_KEY not set. Add it to .env or export it.');
  process.exit(1);
}

// ── Dot-path resolver ────────────────────────────────────────────────────────
// Resolves "mapData.states.MH.value" → data.mapData.states.MH.value
function resolvePath(obj, dotPath) {
  return dotPath.split('.').reduce((cur, key) => {
    if (cur == null) return undefined;
    return cur[key];
  }, obj);
}

// ── Factcheck a single claim ──────────────────────────────────────────────────
function factcheckClaim(claim, data) {
  const { stateOrValue, verifiedFrom } = claim;
  if (!verifiedFrom) return { verdict: 'unverifiable', reason: 'no verifiedFrom pointer' };

  const resolved = resolvePath(data, verifiedFrom);
  if (resolved === undefined || resolved === null) {
    return { verdict: 'unverifiable', reason: `path "${verifiedFrom}" not found in data.json` };
  }

  // Try to extract a number from the claimed stateOrValue string
  const claimedNum = parseFloat(String(stateOrValue).replace(/[^0-9.\-]/g, ''));
  const actualNum  = typeof resolved === 'number' ? resolved : parseFloat(String(resolved).replace(/[^0-9.\-]/g, ''));

  if (isNaN(claimedNum) || isNaN(actualNum)) {
    // String comparison for non-numeric values
    const match = String(resolved).toLowerCase().includes(String(stateOrValue).toLowerCase()) ||
                  String(stateOrValue).toLowerCase().includes(String(resolved).toLowerCase());
    return match
      ? { verdict: 'supported',    reason: `matched "${resolved}" in data`, actual: resolved }
      : { verdict: 'unsupported',  reason: `claimed "${stateOrValue}", data has "${resolved}"`, actual: resolved };
  }

  const diff = Math.abs(claimedNum - actualNum);
  const pct  = actualNum !== 0 ? diff / Math.abs(actualNum) : diff;

  if (pct <= 0.001) return { verdict: 'supported',        reason: `exact match: ${actualNum}`, actual: actualNum };
  if (pct <= 0.02)  return { verdict: 'mostly_supported', reason: `within 2%: claimed ${claimedNum}, actual ${actualNum}`, actual: actualNum };
  if (pct <= 0.10)  return { verdict: 'partly_supported', reason: `within 10%: claimed ${claimedNum}, actual ${actualNum}`, actual: actualNum };
  return              { verdict: 'unsupported',        reason: `too far off: claimed ${claimedNum}, actual ${actualNum}`, actual: actualNum };
}

// ── Score an insight block ───────────────────────────────────────────────────
// Returns the lowest verdict across all claims
const VERDICT_RANK = { supported: 4, mostly_supported: 3, partly_supported: 2, unverifiable: 1, unsupported: 0 };

function scoreBlock(block, data) {
  if (!block.claims || block.claims.length === 0) {
    return { blockVerdict: 'unverifiable', checkedClaims: [] };
  }
  const checkedClaims = block.claims.map(claim => ({
    ...claim,
    ...factcheckClaim(claim, data),
  }));
  const minRank = Math.min(...checkedClaims.map(c => VERDICT_RANK[c.verdict] ?? 0));
  const blockVerdict = Object.keys(VERDICT_RANK).find(k => VERDICT_RANK[k] === minRank) || 'unsupported';
  return { blockVerdict, checkedClaims };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const data   = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const prompt = buildPrompt(slug, data);

  console.log(`  Calling ${MODEL} for ${slug}...`);

  const client = new Anthropic();
  const message = await client.messages.create({
    model:      MODEL,
    max_tokens: 2048,
    messages: [
      {
        role:    'user',
        content: prompt,
      },
    ],
  });

  const raw = message.content[0]?.text?.trim() || '';

  // Strip markdown code fences if present
  const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  let blocks;
  try {
    blocks = JSON.parse(jsonText);
    if (!Array.isArray(blocks)) throw new Error('Response is not a JSON array');
  } catch (err) {
    console.error(`✗ ${slug}: failed to parse model response as JSON — ${err.message}`);
    console.error('Raw response snippet:', raw.slice(0, 300));
    process.exit(1);
  }

  // Factcheck each block
  const report = blocks.map(block => {
    const { blockVerdict, checkedClaims } = scoreBlock(block, data);
    return { ...block, blockVerdict, claims: checkedClaims };
  });

  // insights.json = only publishable blocks
  const publishable = report
    .filter(b => b.blockVerdict === 'supported' || b.blockVerdict === 'mostly_supported')
    .map(({ blockVerdict, ...rest }) => rest);

  fs.mkdirSync(path.dirname(INS_FILE), { recursive: true });
  fs.writeFileSync(INS_FILE,  JSON.stringify(publishable, null, 2));
  fs.writeFileSync(RPT_FILE,  JSON.stringify(report, null, 2));

  const counts = report.reduce((acc, b) => {
    acc[b.blockVerdict] = (acc[b.blockVerdict] || 0) + 1;
    return acc;
  }, {});

  console.log(
    `✓ ${slug}: ${blocks.length} blocks → ` +
    `${publishable.length} published | ` +
    Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ')
  );
}

main().catch(err => {
  console.error(`✗ ${slug}: ${err.message}`);
  process.exit(1);
});
