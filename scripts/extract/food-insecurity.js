/**
 * Extract: Food Insecurity & Child Stunting (NFHS-5 2019-21)
 * Source: IIPS/MoHFW — NFHS-5 State Factsheets, Child Nutrition tables
 * Output: data/pages/food-insecurity/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'food-insecurity');
const MOCK    = process.argv.includes('--mock');
const LOADER  = require('../fetch/nfhs5-loader');
const { STATES } = require('../../js/constants/states');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   stunted: 35.2, wasted: 25.6, underweight: 36.1 },
    UP: { name: 'Uttar Pradesh', stunted: 39.7, wasted: 17.3, underweight: 39.5 },
    KL: { name: 'Kerala',        stunted: 23.4, wasted: 15.7, underweight: 16.1 },
    RJ: { name: 'Rajasthan',     stunted: 31.8, wasted: 18.7, underweight: 33.2 },
    BR: { name: 'Bihar',         stunted: 42.9, wasted: 22.9, underweight: 44.7 },
  },
  nationalStunted:     35.5,
  nationalWasted:      19.3,
  nationalUnderweight: 32.1,
  nationalFoodInsecurity: [
    { label: 'Food Secure',           value: 56, color: 'var(--chart-good)' },
    { label: 'Mild Food Insecurity',  value: 24, color: 'var(--w7)' },
    { label: 'Moderate Insecurity',   value: 13, color: 'var(--accent-saffron)' },
    { label: 'Severe Insecurity',     value: 7,  color: 'var(--chart-bad)' },
  ],
};

function buildDataJson(raw) {
  const sorted = Object.entries(raw.states)
    .sort(([, a], [, b]) => b.stunted - a.stunted)
    .map(([code, s], i) => [code, { ...s, rank: i + 1 }]);

  const states = Object.fromEntries(sorted.map(([code, s]) => [
    code, { name: s.name, value: s.stunted, rank: s.rank }
  ]));

  return {
    meta: {
      title: 'Food Insecurity & Child Stunting',
      subtitle: '% of children under 5 who are stunted, by state',
      source: 'NFHS-5 2019–21, IIPS/MoHFW — Child Nutrition Tables; Global Hunger Index 2023',
      sourceUrl: 'https://rchiips.org/nfhs/nfhs5.shtml',
      surveyPeriod: '2019–2021',
      notes: [
        'Stunting (height-for-age < -2 SD) is a proxy for chronic food insecurity and poor nutrition.',
        'Wasting (weight-for-height < -2 SD) indicates acute malnutrition.',
        'Global Hunger Index state-level estimates are modelled using NFHS-5 and other survey data.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'Anthropometric measurements follow WHO Child Growth Standards. Stunting, wasting, and underweight computed for children aged 0–59 months.',
    },
    mapData: {
      indicator: '% children under 5 who are stunted',
      unit: '%',
      nationalAverage: raw.nationalStunted,
      states,
    },
    chartBlocks: [
      {
        id: 'waffle-food',
        title: 'National Food Security Status',
        subtitle: 'Approximate distribution of households by food security status (NFHS-5)',
        type: 'waffle',
        unit: '%',
        segments: raw.nationalFoodInsecurity,
      },
      {
        id: 'lollipop-stunted',
        title: '% Children Under 5 Who Are Stunted by State',
        type: 'lollipop',
        unit: '%',
        average: raw.nationalStunted,
        higherIsBetter: false,
        data: sorted.map(([code, s]) => ({ code, name: s.name, value: s.stunted })),
      },
    ],
    tableData: {
      columns: [
        { label: 'Rank',               type: 'number' },
        { label: 'State / UT',         type: 'string' },
        { label: 'Stunted (%)',         type: 'number' },
        { label: 'Wasted (%)',          type: 'number' },
        { label: 'Underweight (%)',     type: 'number' },
      ],
      rows: sorted.map(([code, s]) => [s.rank, s.name, s.stunted, s.wasted, s.underweight]),
    },
    insights: [],
  };
}

function buildRealData() {
  const s81 = LOADER.stateMap(81), s82 = LOADER.stateMap(82), s84 = LOADER.stateMap(84);
  const n81 = LOADER.national(81).total, n82 = LOADER.national(82).total, n84 = LOADER.national(84).total;
  const states = {};
  for (const [code, s] of Object.entries(STATES))
    states[code] = { name: s.name, stunted: s81[code] ?? null, wasted: s82[code] ?? null, underweight: s84[code] ?? null };
  return { states, nationalStunted: n81, nationalWasted: n82, nationalUnderweight: n84,
    nationalFoodInsecurity: MOCK_DATA.nationalFoodInsecurity };
}

try {
  const raw  = MOCK ? MOCK_DATA : buildRealData();
  const data = buildDataJson(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  const n = Object.keys(raw.states).length;
  console.log(`✓ food-insecurity: ${n} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ food-insecurity: ${err.message}`);
  process.exit(1);
}
