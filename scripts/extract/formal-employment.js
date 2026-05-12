/**
 * Extract: Formal vs Informal Employment (PLFS 2022-23)
 * Output: data/pages/formal-employment/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'formal-employment');
const MOCK    = process.argv.includes('--mock');
const PLFS    = require('../fetch/plfs-data');
const { STATES } = require('../../js/constants/states');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   formal: 24.3, informal: 75.7 },
    UP: { name: 'Uttar Pradesh', formal: 11.2, informal: 88.8 },
    KL: { name: 'Kerala',        formal: 31.8, informal: 68.2 },
    RJ: { name: 'Rajasthan',     formal: 14.7, informal: 85.3 },
    BR: { name: 'Bihar',         formal:  8.4, informal: 91.6 },
  },
  national: { formal: 19.2, informal: 80.8 },
  nationalSplit: [
    { label: 'Formal (written contract + social security)', value: 19, color: 'var(--chart-good)' },
    { label: 'Informal employment',                         value: 81, color: 'var(--chart-bad)' },
  ],
};

function buildDataJson(raw) {
  const sorted = Object.entries(raw.states)
    .sort(([,a],[,b]) => b.formal - a.formal)
    .map(([c,s],i) => [c, {...s, rank: i+1}]);
  const states = Object.fromEntries(sorted.map(([c,s]) => [c, {name:s.name, value:s.formal, rank:s.rank}]));

  return {
    meta: {
      title: 'Formal vs. Informal Employment',
      subtitle: 'Share of workers in formal employment by state, 2022–23',
      source: 'PLFS 2022–23, NSO/MoSPI — enterprise type and social security modules',
      sourceUrl: 'https://mospi.gov.in/plfs-report',
      surveyPeriod: 'July 2022 – June 2023',
      notes: [
        'Formal employment defined as: written job contract AND eligible for social security (EPF/ESI/NPS).',
        'India has one of the world\'s highest informality rates among major economies.',
        'Informality is highest in agriculture, construction, and domestic work.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'PLFS identifies enterprise type (proprietary, partnership, public sector, etc.) and whether workers receive written job contract and social security benefits.',
    },
    mapData: { indicator: 'Formalization Rate (%)', unit: '%', nationalAverage: raw.national.formal, states },
    chartBlocks: [
      { id: 'waffle-formality', title: 'National Formal vs Informal Employment Split', type: 'waffle', unit: '%', segments: raw.nationalSplit },
      { id: 'lollipop-formal', title: 'Formalization Rate by State', type: 'lollipop', unit: '%', average: raw.national.formal, higherIsBetter: true, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.formal})) },
    ],
    tableData: {
      columns: [
        { label: 'Rank', type: 'number' },
        { label: 'State / UT', type: 'string' },
        { label: 'Formal Employment (%)', type: 'number' },
        { label: 'Informal Employment (%)', type: 'number' },
      ],
      rows: sorted.map(([,s]) => [s.rank, s.name, s.formal, s.informal]),
    },
    insights: [],
  };
}

function buildRealData() {
  const states = {};
  for (const [code, s] of Object.entries(STATES)) {
    const p = PLFS.STATES[code];
    if (!p) { states[code] = { name: s.name, formal: null, informal: null }; continue; }
    const f = p.formal[0];
    states[code] = { name: s.name, formal: f, informal: f != null ? +(100 - f).toFixed(1) : null };
  }
  const nf = PLFS.NATIONAL.formal[0];
  return { states, national: { formal: nf, informal: +(100 - nf).toFixed(1) },
    nationalSplit: MOCK_DATA.nationalSplit };
}

try {
  const raw  = MOCK ? MOCK_DATA : buildRealData();
  const data = buildDataJson(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ formal-employment: ${Object.keys(raw.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ formal-employment: ${err.message}`);
  process.exit(1);
}
