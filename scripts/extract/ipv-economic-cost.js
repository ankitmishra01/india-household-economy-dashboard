/**
 * Extract: Economic Cost of Intimate Partner Violence (NFHS-5 + WHO methodology)
 * Output: data/pages/ipv-economic-cost/data.json
 *
 * EDITORIAL NOTE: IPV prevalence data is from NFHS-5 (observed survey data).
 * Economic cost estimates are MODELLED using WHO/ILO methodology applied to
 * PLFS state-level wages. These are estimates, not official statistics.
 * Clearly labelled as modelled in the output.
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'ipv-economic-cost');
const MOCK    = process.argv.includes('--mock');
const LOADER  = require('../fetch/nfhs5-loader');
const { STATES } = require('../../js/constants/states');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   ipv_pct: 20.2, cost_crore: 48200, female_wage: 15800, female_pop_lakhs: 582 },
    UP: { name: 'Uttar Pradesh', ipv_pct: 31.4, cost_crore: 62800, female_wage:  9600, female_pop_lakhs: 993 },
    KL: { name: 'Kerala',        ipv_pct: 20.8, cost_crore: 14200, female_wage: 17400, female_pop_lakhs: 168 },
    RJ: { name: 'Rajasthan',     ipv_pct: 29.1, cost_crore: 28600, female_wage:  9200, female_pop_lakhs: 323 },
    BR: { name: 'Bihar',         ipv_pct: 35.3, cost_crore: 38400, female_wage:  7200, female_pop_lakhs: 527 },
  },
  national: { ipv_pct: 29.3 },
};

function buildDataJson(raw) {
  const sorted = Object.entries(raw.states)
    .sort(([,a],[,b]) => b.ipv_pct - a.ipv_pct)
    .map(([c,s],i) => [c, {...s, rank: i+1}]);
  const states = Object.fromEntries(sorted.map(([c,s]) => [c, {name:s.name, value:s.ipv_pct, rank:s.rank}]));

  return {
    meta: {
      title: 'Economic Cost of Intimate Partner Violence',
      subtitle: 'IPV prevalence and estimated productivity loss by state — NFHS-5 + modelled estimates',
      source: 'NFHS-5 2019–21, IIPS/MoHFW (IPV prevalence); WHO/ILO methodology applied to PLFS 2022-23 wages (cost estimates)',
      sourceUrl: 'https://rchiips.org/nfhs/nfhs5.shtml',
      surveyPeriod: '2019–2021 (NFHS-5)',
      notes: [
        '⚠ CONTENT NOTE: This page contains data on intimate partner violence.',
        'IPV prevalence (% women who experienced physical/sexual violence from a partner) is from NFHS-5 — OBSERVED survey data.',
        'Economic cost figures are MODELLED ESTIMATES using WHO productivity-loss methodology. They are not official statistics.',
        'Cost model: IPV-affected women × estimated workdays lost (WHO: 6.1 days/year) × state average daily female wage (PLFS) × 10-year horizon.',
        'NFHS-5 IPV questions asked only to ever-married women aged 15-49 — prevalence is likely underestimated.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'IPV prevalence from NFHS-5 Table 14.1. Economic cost estimated using WHO workplace violence costing methodology: (affected women × lost workdays × daily wage). This is a productivity-loss estimate only — does not include healthcare costs, legal costs, or intangible harms.',
    },
    mapData: { indicator: '% women who experienced physical/sexual IPV', unit: '%', nationalAverage: raw.national.ipv_pct, states },
    chartBlocks: [
      { id: 'lollipop-ipv', title: 'IPV Prevalence by State (% of women)', subtitle: 'Source: NFHS-5 (observed survey data)', type: 'lollipop', unit: '%', average: raw.national.ipv_pct, higherIsBetter: false, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.ipv_pct})) },
      { id: 'lollipop-cost', title: 'Estimated Productivity Loss from IPV (₹ Crore)', subtitle: '⚠ Modelled estimate — not official statistics. See methodology notes.', type: 'lollipop', unit: '₹', average: null, higherIsBetter: false, modelled: true, data: sorted.sort(([,a],[,b])=>b.cost_crore-a.cost_crore).map(([c,s])=>({code:c,name:s.name,value:s.cost_crore})) },
    ],
    tableData: {
      columns: [
        { label: 'Rank', type: 'number' },
        { label: 'State / UT', type: 'string' },
        { label: 'IPV Prevalence (%) [OBSERVED]', type: 'number' },
        { label: 'Estimated Cost (₹ Crore) [MODELLED]', type: 'number' },
      ],
      rows: sorted.map(([,s]) => [s.rank, s.name, s.ipv_pct, s.cost_crore]),
    },
    insights: [],
  };
}

// Approximate female population by state (lakhs, Census 2011 projection to 2021)
const FEMALE_POP_LAKHS = {
  AP:330, AR:8, AS:163, BR:527, CG:130, GA:7, GJ:300, HR:134, HP:36, JH:165,
  KA:308, KL:168, MP:377, MH:582, MN:14, ML:16, MZ:6, NL:10, OD:214, PB:138,
  RJ:323, SK:3, TN:369, TS:180, TR:19, UP:993, UK:51, WB:461,
  AN:2, CH:6, DD:1, DL:97, DN:2, JK:63, LA:2, LD:0.5, PY:8,
};
// Average daily female wage by state (₹, PLFS 2022-23 approximate)
const DAILY_WAGE = {
  AP:420, AR:480, AS:380, BR:290, CG:350, GA:620, GJ:490, HR:540, HP:520, JH:340,
  KA:510, KL:620, MP:360, MH:580, MN:390, ML:370, MZ:430, NL:410, OD:370, PB:580,
  RJ:390, SK:510, TN:490, TS:500, TR:380, UP:330, UK:450, WB:400,
  AN:500, CH:620, DD:450, DL:680, DN:450, JK:450, LA:420, LD:380, PY:490,
};

function buildRealData() {
  const ipv = LOADER.stateMap(125);
  const nat = LOADER.national(125).total;
  const states = {};
  for (const [code, s] of Object.entries(STATES)) {
    const ipv_pct = ipv[code] ?? null;
    const female_pop = FEMALE_POP_LAKHS[code] ?? null;
    const wage = DAILY_WAGE[code] ?? null;
    // Cost model: affected women × 6.1 workdays/yr × daily wage × 10-yr horizon
    const cost_crore = (ipv_pct != null && female_pop != null && wage != null)
      ? Math.round((ipv_pct / 100) * female_pop * 1e5 * 6.1 * wage * 10 / 1e7)
      : null;
    states[code] = { name: s.name, ipv_pct, cost_crore, female_wage: wage, female_pop_lakhs: female_pop };
  }
  return { states, national: { ipv_pct: nat } };
}

try {
  const raw  = MOCK ? MOCK_DATA : buildRealData();
  const data = buildDataJson(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  const n = Object.keys(raw.states).length;
  console.log(`✓ ipv-economic-cost: ${n} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ ipv-economic-cost: ${err.message}`);
  process.exit(1);
}
