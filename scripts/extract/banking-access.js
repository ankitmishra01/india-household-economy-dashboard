/**
 * Extract: Access to Formal Banking (NFHS-5 2019-21 + PMJDY data)
 * Output: data/pages/banking-access/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'banking-access');
const MOCK    = process.argv.includes('--mock');
const LOADER  = require('../fetch/nfhs5-loader');
const { STATES } = require('../../js/constants/states');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   any_account: 79.2, women_account: 72.4, men_account: 86.8, pmjdy_per1000: 412 },
    UP: { name: 'Uttar Pradesh', any_account: 68.4, women_account: 59.6, men_account: 78.2, pmjdy_per1000: 638 },
    KL: { name: 'Kerala',        any_account: 91.6, women_account: 89.3, men_account: 94.8, pmjdy_per1000: 287 },
    RJ: { name: 'Rajasthan',     any_account: 71.8, women_account: 63.1, men_account: 81.4, pmjdy_per1000: 524 },
    BR: { name: 'Bihar',         any_account: 62.3, women_account: 52.8, men_account: 73.6, pmjdy_per1000: 712 },
  },
  national: { any_account: 77.6, women_account: 70.5, men_account: 85.4 },
};

function buildDataJson(raw) {
  const sorted = Object.entries(raw.states)
    .sort(([,a],[,b]) => b.any_account - a.any_account)
    .map(([c,s],i) => [c, {...s, rank: i+1}]);
  const states = Object.fromEntries(sorted.map(([c,s]) => [c, {name:s.name, value:s.any_account, rank:s.rank}]));

  return {
    meta: {
      title: 'Access to Formal Banking',
      subtitle: '% of adults with a bank account and PMJDY penetration by state',
      source: 'NFHS-5 2019–21, IIPS/MoHFW; RBI FI Index; PMJDY Dashboard, Ministry of Finance',
      sourceUrl: 'https://rchiips.org/nfhs/nfhs5.shtml; https://pmjdy.gov.in',
      surveyPeriod: '2019–2021 (NFHS-5); PMJDY data as of March 2023',
      notes: [
        'Account ownership is self-reported in NFHS-5 for household members.',
        'PMJDY (Pradhan Mantri Jan Dhan Yojana) accounts include zero-balance accounts — some may be dormant.',
        'High PMJDY per-capita in states like Bihar/UP reflects financial inclusion push, but active use may differ.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'NFHS-5 asks women aged 15-49 and men aged 15-54 if they have a bank/post office account. PMJDY per-1000 computed using PMJDY dashboard totals and 2011 Census adult population.',
    },
    mapData: { indicator: '% adults with a bank account', unit: '%', nationalAverage: raw.national.any_account, states },
    tabs: [
      { label: 'Any Account', mapData: { indicator: 'Any bank account (%)', unit: '%', nationalAverage: raw.national.any_account, states },
        chartBlocks: [{ id: 'lollipop-any-account', title: 'Bank Account Ownership by State', type: 'lollipop', unit: '%', average: raw.national.any_account, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.any_account})) }] },
      { label: 'Women vs Men',
        mapData: { indicator: 'Women with bank account (%)', unit: '%', nationalAverage: raw.national.women_account, states: Object.fromEntries(sorted.sort(([,a],[,b])=>b.women_account-a.women_account).map(([c,s],i)=>[c,{name:s.name,value:s.women_account,rank:i+1}])) },
        chartBlocks: [{ id: 'grouped-account', title: 'Bank Account Ownership: Women vs Men', type: 'grouped-lollipop', unit: '%',
          labelA: 'Men', labelB: 'Women', colorA: 'var(--w2)', colorB: 'var(--accent-saffron)',
          seriesA: sorted.map(([c,s])=>({code:c,name:s.name,value:s.men_account})),
          seriesB: sorted.map(([c,s])=>({code:c,name:s.name,value:s.women_account})) }] },
    ],
    chartBlocks: [{ id: 'grouped-account', title: 'Bank Account Ownership: Women vs Men by State', type: 'grouped-lollipop', unit: '%',
      labelA: 'Men', labelB: 'Women', colorA: 'var(--w2)', colorB: 'var(--accent-saffron)',
      seriesA: sorted.map(([c,s])=>({code:c,name:s.name,value:s.men_account})),
      seriesB: sorted.map(([c,s])=>({code:c,name:s.name,value:s.women_account})) }],
    tableData: {
      columns: [
        { label: 'Rank', type: 'number' },
        { label: 'State / UT', type: 'string' },
        { label: 'Any Account (%)', type: 'number' },
        { label: "Women's Account (%)", type: 'number' },
        { label: "Men's Account (%)", type: 'number' },
        { label: 'PMJDY per 1000 adults', type: 'number' },
      ],
      rows: sorted.map(([,s]) => [s.rank, s.name, s.any_account, s.women_account, s.men_account, s.pmjdy_per1000]),
    },
    insights: [],
  };
}

function buildRealData() {
  const w = LOADER.stateMap(122);
  const nat = LOADER.national(122).total;
  const states = {};
  for (const [code, s] of Object.entries(STATES))
    states[code] = { name: s.name, any_account: w[code] ?? null,
      women_account: w[code] ?? null, men_account: null, pmjdy_per1000: null };
  return { states, national: { any_account: nat, women_account: nat, men_account: null } };
}

try {
  const raw  = MOCK ? MOCK_DATA : buildRealData();
  const data = buildDataJson(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  const n = Object.keys(raw.states).length;
  console.log(`✓ banking-access: ${n} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ banking-access: ${err.message}`);
  process.exit(1);
}
