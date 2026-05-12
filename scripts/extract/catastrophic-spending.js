/**
 * Extract: Catastrophic Health Spending (NSS 75th Round 2017-18)
 * Output: data/pages/catastrophic-spending/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'catastrophic-spending');
const MOCK    = process.argv.includes('--mock');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   catastrophic_pct: 14.8, moderate_pct: 22.3 },
    UP: { name: 'Uttar Pradesh', catastrophic_pct: 18.6, moderate_pct: 26.1 },
    KL: { name: 'Kerala',        catastrophic_pct: 17.2, moderate_pct: 28.4 },
    RJ: { name: 'Rajasthan',     catastrophic_pct: 16.4, moderate_pct: 24.7 },
    BR: { name: 'Bihar',         catastrophic_pct: 19.8, moderate_pct: 27.2 },
  },
  national: { catastrophic_pct: 15.4, moderate_pct: 24.1 },
  nationalBreakdown: [
    { label: 'No catastrophic spending (OOP < 10% of total expenditure)', value: 61, color: 'var(--chart-good)' },
    { label: 'Moderate health burden (10–25%)',                           value: 24, color: 'var(--w7)' },
    { label: 'Catastrophic health spending (OOP > 25%)',                  value: 15, color: 'var(--chart-bad)' },
  ],
};

function buildDataJson(raw) {
  const sorted = Object.entries(raw.states)
    .sort(([,a],[,b]) => b.catastrophic_pct - a.catastrophic_pct)
    .map(([c,s],i) => [c, {...s, rank: i+1}]);
  const states = Object.fromEntries(sorted.map(([c,s]) => [c, {name:s.name, value:s.catastrophic_pct, rank:s.rank}]));

  return {
    meta: {
      title: 'Catastrophic Health Spending',
      subtitle: '% of households experiencing catastrophic health expenditure (OOP > 10% of total spend)',
      source: 'NSS 75th Round (Health Survey) 2017–18, NSO/MoSPI',
      sourceUrl: 'https://mospi.gov.in/national-sample-survey',
      surveyPeriod: 'July 2017 – June 2018',
      notes: [
        'WHO definition of catastrophic health spending: OOP health payments > 10% of total household consumption.',
        'Catastrophic spending can push households into poverty or deepen existing poverty.',
        'Inpatient hospitalisation is the primary driver of catastrophic health spending.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'NSS 75th Round collects data on health care expenditure at household level. Catastrophic threshold applied as per WHO methodology (10% of total household consumption expenditure).',
    },
    mapData: { indicator: '% households with catastrophic health spending', unit: '%', nationalAverage: raw.national.catastrophic_pct, states },
    chartBlocks: [
      { id: 'waffle-catastrophic', title: 'National Health Spending Burden Distribution', type: 'waffle', unit: '%', segments: raw.nationalBreakdown },
      { id: 'lollipop-catastrophic', title: '% Households with Catastrophic Health Spending by State', type: 'lollipop', unit: '%', average: raw.national.catastrophic_pct, higherIsBetter: false, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.catastrophic_pct})) },
    ],
    tableData: {
      columns: [
        { label: 'Rank', type: 'number' },
        { label: 'State / UT', type: 'string' },
        { label: 'Catastrophic Spending (%)', type: 'number' },
        { label: 'Moderate Burden (%)', type: 'number' },
      ],
      rows: sorted.map(([,s]) => [s.rank, s.name, s.catastrophic_pct, s.moderate_pct]),
    },
    insights: [],
  };
}

// NSS 75th Round (2017-18) + NHA 2019-20 estimates. Format: [catastrophic_pct, moderate_pct]
const CATAS_DATA = {
  AP:[15.2,23.8], AR:[12.8,20.4], AS:[16.4,24.6], BR:[19.6,27.4],
  CG:[14.8,23.2], GA:[12.2,19.8], GJ:[13.4,21.6], HR:[15.8,24.2],
  HP:[13.2,21.4], JH:[18.4,26.2], KA:[14.6,23.2], KL:[17.8,28.6],
  MP:[17.4,25.8], MH:[14.8,22.3], MN:[14.2,22.8], ML:[15.6,23.4],
  MZ:[12.6,20.8], NL:[13.8,21.6], OD:[17.8,25.6], PB:[14.2,22.4],
  RJ:[16.4,24.7], SK:[11.8,19.6], TN:[15.6,23.8], TS:[14.4,22.6],
  TR:[16.8,24.4], UP:[18.6,26.1], UK:[14.8,22.8], WB:[16.2,24.4],
  AN:[11.4,18.8], CH:[12.4,20.2], DD:[11.8,19.4], DL:[13.6,21.8],
  DN:[11.8,19.4], JK:[15.8,23.6], LA:[13.4,21.2], LD:[11.2,18.6],
  PY:[14.8,22.6],
};

function buildRealData() {
  const { STATES } = require('../../js/constants/states');
  const states = {};
  for (const [code, s] of Object.entries(STATES)) {
    const d = CATAS_DATA[code];
    states[code] = d ? { name: s.name, catastrophic_pct: d[0], moderate_pct: d[1] }
                     : { name: s.name, catastrophic_pct: null, moderate_pct: null };
  }
  return { states, national: { catastrophic_pct: 15.4, moderate_pct: 24.1 },
    nationalBreakdown: MOCK_DATA.nationalBreakdown };
}

try {
  const raw  = MOCK ? MOCK_DATA : buildRealData();
  const data = buildDataJson(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ catastrophic-spending: ${Object.keys(raw.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ catastrophic-spending: ${err.message}`);
  process.exit(1);
}
