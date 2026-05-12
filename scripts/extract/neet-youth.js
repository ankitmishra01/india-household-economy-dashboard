/**
 * Extract: NEET Youth (PLFS 2022-23, age 15-24)
 * Output: data/pages/neet-youth/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'neet-youth');
const MOCK    = process.argv.includes('--mock');
const PLFS    = require('../fetch/plfs-data');
const { STATES } = require('../../js/constants/states');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   neet_overall: 23.8, neet_male: 15.2, neet_female: 33.1 },
    UP: { name: 'Uttar Pradesh', neet_overall: 32.6, neet_male: 18.7, neet_female: 48.4 },
    KL: { name: 'Kerala',        neet_overall: 18.4, neet_male: 14.1, neet_female: 22.9 },
    RJ: { name: 'Rajasthan',     neet_overall: 28.3, neet_male: 16.4, neet_female: 41.7 },
    BR: { name: 'Bihar',         neet_overall: 38.1, neet_male: 22.3, neet_female: 56.2 },
  },
  national: { overall: 29.8, male: 16.2, female: 44.8 },
  nationalComposition: [
    { label: 'Employed',          value: 34, color: 'var(--chart-good)' },
    { label: 'In Education',      value: 36, color: 'var(--w2)' },
    { label: 'NEET (youth 15-24)',value: 30, color: 'var(--chart-bad)' },
  ],
};

function buildDataJson(raw) {
  const sorted = Object.entries(raw.states)
    .sort(([,a],[,b]) => b.neet_overall - a.neet_overall)
    .map(([c,s],i) => [c, {...s, rank: i+1}]);
  const states = Object.fromEntries(sorted.map(([c,s]) => [c, {name:s.name, value:s.neet_overall, rank:s.rank}]));

  return {
    meta: {
      title: 'NEET Youth',
      subtitle: '% of youth aged 15–24 not in employment, education, or training',
      source: 'PLFS 2022–23, NSO/MoSPI — derived from age 15–24 employment status tables',
      sourceUrl: 'https://mospi.gov.in/plfs-report',
      surveyPeriod: 'July 2022 – June 2023',
      notes: [
        'NEET = youth aged 15–24 who are neither employed nor in education/training.',
        'Female NEET rates are significantly higher due to domestic work not counted as employment.',
        'High female NEET partially reflects unpaid care work obligations, not just labor market failure.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'Derived from PLFS data. A person is NEET if their UPSS status is not employed AND they are not attending any educational institution or vocational training.',
    },
    mapData: { indicator: 'NEET Rate (15–24) %', unit: '%', nationalAverage: raw.national.overall, states },
    chartBlocks: [
      { id: 'waffle-neet', title: 'Where Are India\'s Youth? (Aged 15–24)', type: 'waffle', unit: '%', segments: raw.nationalComposition },
      { id: 'grouped-neet', title: 'Male vs Female NEET Rate by State', type: 'grouped-lollipop', unit: '%',
        labelA: 'Male', labelB: 'Female', colorA: 'var(--w2)', colorB: 'var(--accent-saffron)',
        seriesA: sorted.map(([c,s])=>({code:c,name:s.name,value:s.neet_male})),
        seriesB: sorted.map(([c,s])=>({code:c,name:s.name,value:s.neet_female})) },
    ],
    tableData: {
      columns: [
        { label: 'Rank', type: 'number' },
        { label: 'State / UT', type: 'string' },
        { label: 'NEET Overall (%)', type: 'number' },
        { label: 'Male NEET (%)', type: 'number' },
        { label: 'Female NEET (%)', type: 'number' },
        { label: 'Gender Gap (pp)', type: 'number' },
      ],
      rows: sorted.map(([,s]) => [s.rank, s.name, s.neet_overall, s.neet_male, s.neet_female, (s.neet_female - s.neet_male).toFixed(1)]),
    },
    insights: [],
  };
}

function buildRealData() {
  const states = {};
  for (const [code, s] of Object.entries(STATES)) {
    const p = PLFS.STATES[code];
    if (!p) { states[code] = { name: s.name, neet_overall: null, neet_male: null, neet_female: null }; continue; }
    states[code] = { name: s.name, neet_overall: p.neet[2], neet_male: p.neet[0], neet_female: p.neet[1] };
  }
  const n = PLFS.NATIONAL;
  return { states, national: { overall: n.neet[2], male: n.neet[0], female: n.neet[1] },
    nationalComposition: MOCK_DATA.nationalComposition };
}

try {
  const raw  = MOCK ? MOCK_DATA : buildRealData();
  const data = buildDataJson(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ neet-youth: ${Object.keys(raw.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ neet-youth: ${err.message}`);
  process.exit(1);
}
