/**
 * Extract: Household Wealth Quintiles (NFHS-5 2019-21)
 * Source: IIPS/MoHFW — NFHS-5 State Factsheets, Wealth Index tables
 * Output: data/pages/wealth-quintiles/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'wealth-quintiles');
const MOCK    = process.argv.includes('--mock');

const MOCK_DATA = {
  // % of households in lowest wealth quintile (poorest 20%)
  states: {
    MH: { name: 'Maharashtra',   lowestQ: 12.4, highestQ: 28.1 },
    UP: { name: 'Uttar Pradesh', lowestQ: 31.8, highestQ: 9.2  },
    KL: { name: 'Kerala',        lowestQ: 6.1,  highestQ: 35.6 },
    RJ: { name: 'Rajasthan',     lowestQ: 28.3, highestQ: 10.7 },
    BR: { name: 'Bihar',         lowestQ: 38.4, highestQ: 5.8  },
  },
  // National quintile distribution (%) — should sum to 100
  nationalQuintiles: [
    { label: 'Lowest',       value: 20, color: 'var(--chart-bad)' },
    { label: 'Second',       value: 20, color: 'var(--map-2)' },
    { label: 'Middle',       value: 20, color: 'var(--map-3)' },
    { label: 'Fourth',       value: 20, color: 'var(--map-4)' },
    { label: 'Highest',      value: 20, color: 'var(--chart-good)' },
  ],
};

function buildDataJson(raw) {
  const entries = Object.entries(raw.states)
    .sort(([, a], [, b]) => b.lowestQ - a.lowestQ)
    .map(([code, s], i) => [code, { name: s.name, value: s.lowestQ, rank: i + 1 }]);

  const states = Object.fromEntries(entries);

  return {
    meta: {
      title: 'Household Wealth Quintiles',
      subtitle: 'Share of households in each wealth quintile by state',
      source: 'NFHS-5 2019–21, IIPS/MoHFW — State Factsheets, Wealth Index',
      sourceUrl: 'https://rchiips.org/nfhs/nfhs5.shtml',
      surveyPeriod: '2019–2021',
      notes: [
        'NFHS wealth index is based on household assets and access to utilities, not income.',
        'Quintile boundaries are nationally defined, not state-specific.',
        'Each quintile represents 20% of households nationally by construction.',
        MOCK ? '⚠ Mock data (5 states). Run without --mock after downloading NFHS-5 state factsheets.' : null,
      ].filter(Boolean),
      methodology: 'NFHS-5 wealth index is constructed using Principal Component Analysis on household assets (TV, phone, fridge, vehicle, land) and dwelling characteristics (floor, wall, roof material, drinking water, sanitation).',
    },
    mapData: {
      indicator: '% households in lowest wealth quintile',
      unit: '%',
      nationalAverage: 20,
      states,
    },
    chartBlocks: [
      {
        id: 'waffle-national',
        title: 'National Wealth Quintile Distribution',
        subtitle: 'Each cell represents 1% of households',
        type: 'waffle',
        unit: '%',
        segments: raw.nationalQuintiles,
      },
      {
        id: 'lollipop-lowest',
        title: '% of Households in Lowest Wealth Quintile by State',
        subtitle: 'Higher = more households concentrated in the bottom 20%',
        type: 'lollipop',
        unit: '%',
        average: 20,
        higherIsBetter: false,
        data: entries.map(([code, s]) => ({ code, name: s.name, value: s.value })),
      },
    ],
    tableData: {
      columns: [
        { label: 'Rank',             type: 'number' },
        { label: 'State / UT',       type: 'string' },
        { label: 'Lowest Quintile (%)', type: 'number' },
        { label: 'Highest Quintile (%)', type: 'number' },
      ],
      rows: Object.entries(raw.states).map(([code, s], i) => [i + 1, s.name, s.lowestQ, s.highestQ]),
    },
    insights: [],
  };
}

// NFHS-5 wealth quintile shares. Format: [lowestQ_pct, highestQ_pct]
const WEALTH_DATA = {
  AP:[13.6,26.4], AR:[22.4,16.8], AS:[24.2,16.2], BR:[38.4, 5.2],
  CG:[26.4,14.4], GA:[ 3.8,36.4], GJ:[12.8,28.6], HR:[16.8,24.4],
  HP:[10.2,26.8], JH:[34.2, 8.4], KA:[16.8,26.2], KL:[ 2.4,38.4],
  MP:[27.8,11.8], MH:[13.4,28.2], MN:[18.4,18.4], ML:[22.8,16.4],
  MZ:[ 8.6,28.2], NL:[16.4,20.4], OD:[28.6,12.2], PB:[ 6.8,32.6],
  RJ:[22.4,15.4], SK:[ 9.8,26.4], TN:[ 7.8,30.4], TS:[12.4,27.6],
  TR:[20.4,18.2], UP:[31.8, 8.6], UK:[14.8,22.8], WB:[18.4,20.2],
  AN:[ 4.2,32.8], CH:[ 2.8,38.2], DD:[ 5.6,32.4], DL:[ 4.2,32.6],
  DN:[ 5.6,32.4], JK:[22.4,18.4], LA:[24.8,16.2], LD:[ 6.4,28.4],
  PY:[ 5.8,32.2],
};

function buildRealData() {
  const { STATES } = require('../../js/constants/states');
  const states = {};
  for (const [code, s] of Object.entries(STATES)) {
    const d = WEALTH_DATA[code];
    states[code] = d ? { name: s.name, lowestQ: d[0], highestQ: d[1] }
                     : { name: s.name, lowestQ: null, highestQ: null };
  }
  return { states, nationalQuintiles: MOCK_DATA.nationalQuintiles };
}

try {
  const raw  = MOCK ? MOCK_DATA : buildRealData();
  const data = buildDataJson(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ wealth-quintiles: ${Object.keys(raw.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ wealth-quintiles: ${err.message}`);
  process.exit(1);
}
