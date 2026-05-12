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

try {
  const data = buildDataJson(MOCK_DATA);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ age-dependency: ${Object.keys(MOCK_DATA.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ age-dependency: ${err.message}`);
  process.exit(1);
}
