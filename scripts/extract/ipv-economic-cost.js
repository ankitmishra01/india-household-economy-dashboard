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

try {
  const data = buildDataJson(MOCK_DATA);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ ipv-economic-cost: ${Object.keys(MOCK_DATA.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ ipv-economic-cost: ${err.message}`);
  process.exit(1);
}
