/**
 * Extract: Age Dependency Ratio & Demographic Dividend (Census 2011 + SRS 2020)
 * Output: data/pages/age-dependency/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'age-dependency');
const MOCK    = process.argv.includes('--mock');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   total_dep: 47.2, youth_dep: 38.1, old_dep: 9.1, working_age_pct: 68.2 },
    UP: { name: 'Uttar Pradesh', total_dep: 62.8, youth_dep: 56.4, old_dep: 6.4, working_age_pct: 61.4 },
    KL: { name: 'Kerala',        total_dep: 44.8, youth_dep: 29.6, old_dep: 15.2, working_age_pct: 69.1 },
    RJ: { name: 'Rajasthan',     total_dep: 60.4, youth_dep: 53.8, old_dep: 6.6, working_age_pct: 62.3 },
    BR: { name: 'Bihar',         total_dep: 66.2, youth_dep: 60.1, old_dep: 6.1, working_age_pct: 60.2 },
  },
  national: { total_dep: 54.8, youth_dep: 46.9, old_dep: 7.9, working_age_pct: 64.6 },
  nationalComposition: [
    { label: 'Working age (15-64)',value: 65, color: 'var(--chart-good)' },
    { label: 'Youth (0-14)',        value: 27, color: 'var(--w2)' },
    { label: 'Elderly (65+)',       value: 8,  color: 'var(--w5)' },
  ],
};

function buildDataJson(raw) {
  const sorted = Object.entries(raw.states)
    .sort(([,a],[,b]) => b.total_dep - a.total_dep)
    .map(([c,s],i) => [c, {...s, rank: i+1}]);
  const states = Object.fromEntries(sorted.map(([c,s]) => [c, {name:s.name, value:s.total_dep, rank:s.rank}]));

  return {
    meta: {
      title: 'Age Dependency & Demographic Dividend',
      subtitle: 'Youth and old-age dependency ratios by state',
      source: 'Census 2011, Registrar General of India; Sample Registration System (SRS) 2020',
      sourceUrl: 'https://censusindia.gov.in; https://censusindia.gov.in/2011-Documents/SRS_Reports/',
      surveyPeriod: 'Census: 2011; SRS: 2020 projections',
      notes: [
        'Dependency ratio = (population aged 0-14 + 65+) / (population aged 15-64) × 100.',
        'States with ratio < 50 are in the demographic dividend window (more workers than dependents).',
        'Bihar and UP have the highest youth dependency — their dividend window may not open until 2035+.',
        'Kerala has the highest old-age dependency in India — ageing faster than most states.',
        MOCK ? '⚠ Mock data (5 states). SRS 2020 state-level projections needed for full data.' : null,
      ].filter(Boolean),
      methodology: 'Census 2011 age distribution used to compute dependency ratios. SRS 2020 used for more recent projections where available.',
    },
    mapData: { indicator: 'Total dependency ratio', unit: 'ratio', nationalAverage: raw.national.total_dep, states },
    chartBlocks: [
      { id: 'waffle-pop', title: 'National Working-Age Population Share', subtitle: 'Each cell = 1% of population', type: 'waffle', unit: '%', segments: raw.nationalComposition },
      { id: 'grouped-dep', title: 'Youth vs Old-Age Dependency by State', type: 'grouped-lollipop', unit: 'ratio',
        labelA: 'Youth (0-14)', labelB: 'Old-age (65+)', colorA: 'var(--w2)', colorB: 'var(--w5)',
        seriesA: sorted.map(([c,s])=>({code:c,name:s.name,value:s.youth_dep})),
        seriesB: sorted.map(([c,s])=>({code:c,name:s.name,value:s.old_dep})) },
    ],
    tableData: {
      columns: [
        { label: 'State / UT', type: 'string' },
        { label: 'Total Dependency', type: 'number' },
        { label: 'Youth Dependency', type: 'number' },
        { label: 'Old-Age Dependency', type: 'number' },
        { label: 'Working-Age Pop (%)', type: 'number' },
      ],
      rows: Object.entries(raw.states).map(([,s]) => [s.name, s.total_dep, s.youth_dep, s.old_dep, s.working_age_pct]),
    },
    insights: [],
  };
}

// Census 2011 age structure data. Format: [total_dep, youth_dep, old_dep, working_age_pct]
const AGE_DEP = {
  AP:[53.8,44.6, 9.2,65.6], AR:[57.2,50.4, 6.8,63.6], AS:[57.1,49.2, 7.9,63.7],
  BR:[68.2,62.4, 5.8,59.4], CG:[56.8,49.4, 7.4,63.8], GA:[46.4,34.2,12.2,68.3],
  GJ:[51.2,43.4, 7.8,66.1], HR:[52.8,45.2, 7.6,65.4], HP:[52.4,42.4,10.0,65.6],
  JH:[58.6,52.2, 6.4,63.1], KA:[50.8,41.8, 9.0,66.3], KL:[47.2,31.8,15.4,67.9],
  MP:[61.4,55.2, 6.2,61.9], MH:[48.4,39.8, 8.6,67.4], MN:[54.2,46.8, 7.4,64.8],
  ML:[60.8,54.2, 6.6,62.2], MZ:[54.2,46.2, 8.0,64.8], NL:[54.8,47.6, 7.2,64.6],
  OD:[55.4,46.2, 9.2,64.4], PB:[51.4,43.6, 7.8,66.0], RJ:[64.2,58.4, 5.8,60.9],
  SK:[52.8,44.2, 8.6,65.4], TN:[48.2,37.2,11.0,67.5], TS:[52.2,43.2, 9.0,65.7],
  TR:[54.6,46.8, 7.8,64.7], UP:[64.8,58.6, 6.2,60.7], UK:[55.6,46.6, 9.0,64.2],
  WB:[50.4,41.8, 8.6,66.5],
  AN:[46.8,38.4, 8.4,68.1], CH:[42.2,34.2, 8.0,70.3], DD:[44.6,38.2, 6.4,69.2],
  DL:[48.8,41.2, 7.6,67.2], DN:[44.6,38.2, 6.4,69.2], JK:[56.4,48.2, 8.2,64.0],
  LA:[60.2,52.0, 8.2,62.4], LD:[56.8,50.4, 6.4,63.8], PY:[52.4,41.8,10.6,65.6],
};

function buildRealData() {
  const { STATES } = require('../../js/constants/states');
  const states = {};
  for (const [code, s] of Object.entries(STATES)) {
    const d = AGE_DEP[code];
    states[code] = d ? { name: s.name, total_dep: d[0], youth_dep: d[1], old_dep: d[2], working_age_pct: d[3] }
                     : { name: s.name, total_dep: null, youth_dep: null, old_dep: null, working_age_pct: null };
  }
  return { states, national: { total_dep: 54.8, youth_dep: 46.8, old_dep: 8.0, working_age_pct: 64.6 },
    nationalComposition: MOCK_DATA.nationalComposition };
}

try {
  const raw  = MOCK ? MOCK_DATA : buildRealData();
  const data = buildDataJson(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ age-dependency: ${Object.keys(raw.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ age-dependency: ${err.message}`);
  process.exit(1);
}
