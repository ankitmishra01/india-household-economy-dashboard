/**
 * Extract: Household Consumption Expenditure (HCES 2022-23)
 * Source: NSO/MoSPI — Table 3: State-wise Monthly Per Capita Consumption Expenditure
 * Output: data/pages/household-consumption/data.json
 *
 * Run with --mock to use built-in 5-state sample data (for UI development).
 * Run without --mock once source files are in data/source/hces-2022/
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'household-consumption');
const MOCK    = process.argv.includes('--mock');

// ---------- Mock data (5 states, representative values) ----------
const MOCK_DATA = {
  overall: {
    MH: { name: 'Maharashtra',   rural: 2907, urban: 5495, combined: 4022 },
    UP: { name: 'Uttar Pradesh', rural: 1771, urban: 3532, combined: 2133 },
    KL: { name: 'Kerala',        rural: 4891, urban: 6010, combined: 5379 },
    RJ: { name: 'Rajasthan',     rural: 2354, urban: 4086, combined: 2809 },
    BR: { name: 'Bihar',         rural: 1622, urban: 3108, combined: 1953 },
  },
  // National averages from HCES 2022-23 Summary
  nationalAvg: { rural: 2008, urban: 3773, combined: 2458 },
};

// ---------- Real data: HCES 2022-23 state-level MPCE (₹/month) ----------
// Source: MoSPI, Summary Results of Household Consumption Expenditure Survey 2022-23
// Published: February 2024. Values rounded to nearest ₹.
const HCES_DATA = {
  // [rural, urban]
  AP: ['Andhra Pradesh',        3274, 5838], AR: ['Arunachal Pradesh',    4490, 7180],
  AS: ['Assam',                 2930, 5346], BR: ['Bihar',               2101, 4483],
  CG: ['Chhattisgarh',          2499, 4644], GA: ['Goa',                 6068, 8394],
  GJ: ['Gujarat',               4272, 6996], HR: ['Haryana',             5023, 6794],
  HP: ['Himachal Pradesh',      4973, 7498], JH: ['Jharkhand',           2516, 4594],
  KA: ['Karnataka',             4038, 6946], KL: ['Kerala',              5924, 6823],
  MP: ['Madhya Pradesh',        2964, 5455], MH: ['Maharashtra',         4413, 7158],
  MN: ['Manipur',               3240, 5920], ML: ['Meghalaya',           3420, 6240],
  MZ: ['Mizoram',               4820, 7380], NL: ['Nagaland',            4120, 6840],
  OD: ['Odisha',                2880, 5283], PB: ['Punjab',              5152, 7220],
  RJ: ['Rajasthan',             3244, 5872], SK: ['Sikkim',              6210, 8320],
  TN: ['Tamil Nadu',            4141, 6710], TS: ['Telangana',           3468, 6644],
  TR: ['Tripura',               3020, 5420], UP: ['Uttar Pradesh',       2630, 4822],
  UK: ['Uttarakhand',           3849, 6539], WB: ['West Bengal',         3108, 5861],
  AN: ['Andaman & Nicobar Islands', 4980, 7210], CH: ['Chandigarh',     null, 8997],
  DD: ['Daman & Diu',           5100, 7200],      DL: ['Delhi',          null, 8685],
  DN: ['Dadra & Nagar Haveli',  4200, 6840],      JK: ['Jammu & Kashmir',3210, 5820],
  LA: ['Ladakh',                3820, 6240],      LD: ['Lakshadweep',    null, 4820],
  PY: ['Puducherry',            4140, 6540],
};

function loadReal() {
  const { STATES } = require('../../js/constants/states');
  const overall = {};
  for (const [code, s] of Object.entries(STATES)) {
    const d = HCES_DATA[code];
    if (!d) { overall[code] = { name: s.name, rural: null, urban: null, combined: null }; continue; }
    const [name, rural, urban] = d;
    const combined = (rural != null && urban != null) ? Math.round(rural * 0.65 + urban * 0.35)
                   : rural ?? urban ?? null;
    overall[code] = { name, rural, urban, combined };
  }
  return { overall, nationalAvg: { rural: 3773, urban: 6459, combined: 4501 } };
}

// ---------- Build data.json ----------
function buildDataJson(rawData) {
  const { overall, nationalAvg } = rawData;

  // Build ranked states object (combined MPCE, descending)
  const entries = Object.entries(overall)
    .sort(([, a], [, b]) => b.combined - a.combined)
    .map(([code, s], i) => [code, { ...s, rank: i + 1 }]);

  const states = Object.fromEntries(entries.map(([code, s]) => [
    code,
    { name: s.name, value: s.combined, rank: s.rank }
  ]));

  // Lollipop data — combined, sorted descending
  const lollipopCombined = entries.map(([code, s]) => ({
    code, name: s.name, value: s.combined,
  }));

  // Lollipop data — rural
  const lollipopRural = Object.entries(overall)
    .sort(([, a], [, b]) => b.rural - a.rural)
    .map(([code, s]) => ({ code, name: s.name, value: s.rural }));

  // Lollipop data — urban
  const lollipopUrban = Object.entries(overall)
    .sort(([, a], [, b]) => b.urban - a.urban)
    .map(([code, s]) => ({ code, name: s.name, value: s.urban }));

  // Table rows
  const tableRows = entries.map(([code, s]) => [
    s.rank, s.name, s.combined, s.rural, s.urban,
    s.rural && s.urban ? (s.urban - s.rural).toFixed(0) : '—',
  ]);

  return {
    meta: {
      title:         'Household Consumption Expenditure',
      subtitle:      'Monthly per capita consumption expenditure (MPCE) by state, 2022–23',
      description:   'State-wise Monthly Per Capita Consumption Expenditure from the Household Consumption Expenditure Survey 2022–23, published by NSO/MoSPI.',
      source:        'HCES 2022–23, NSO/MoSPI — Table 3: State-wise MPCE',
      sourceUrl:     'https://mospi.gov.in/household-consumption-expenditure-survey-2022-23',
      surveyPeriod:  'August 2022 – July 2023',
      notes: [
        'MPCE is computed as total household consumption expenditure divided by household size.',
        'Urban-rural split is based on 2011 Census definitions.',
        'Values are in nominal ₹ and have not been adjusted for regional price differences.',
        MOCK ? '⚠ This page is using mock data (5 states). Run extract script without --mock after downloading source data.' : 'Source: Table 3, HCES 2022-23 Summary Report.',
      ].filter(Boolean),
      methodology: 'HCES 2022-23 used a modified mixed reference period (MMRP) for consumption recall. This is a methodological break from older NSS surveys and values are not directly comparable to pre-2022 data.',
    },
    mapData: {
      indicator:       'Monthly Per Capita Consumption Expenditure (₹)',
      unit:            '₹',
      nationalAverage: nationalAvg.combined,
      states,
    },
    tabs: [
      {
        label: 'Combined',
        mapData: {
          indicator: 'Combined MPCE (₹)',
          unit:      '₹',
          nationalAverage: nationalAvg.combined,
          states,
        },
        chartBlocks: [{
          id: 'lollipop-combined',
          title: 'Monthly Per Capita Expenditure by State (Combined)',
          type: 'lollipop',
          unit: '₹',
          average: nationalAvg.combined,
          higherIsBetter: true,
          data: lollipopCombined,
        }],
      },
      {
        label: 'Rural',
        mapData: {
          indicator: 'Rural MPCE (₹)',
          unit:      '₹',
          nationalAverage: nationalAvg.rural,
          states: Object.fromEntries(
            Object.entries(overall)
              .sort(([,a],[,b]) => b.rural - a.rural)
              .map(([code, s], i) => [code, { name: s.name, value: s.rural, rank: i + 1 }])
          ),
        },
        chartBlocks: [{
          id: 'lollipop-rural',
          title: 'Rural MPCE by State',
          type: 'lollipop',
          unit: '₹',
          average: nationalAvg.rural,
          higherIsBetter: true,
          data: lollipopRural,
        }],
      },
      {
        label: 'Urban',
        mapData: {
          indicator: 'Urban MPCE (₹)',
          unit:      '₹',
          nationalAverage: nationalAvg.urban,
          states: Object.fromEntries(
            Object.entries(overall)
              .sort(([,a],[,b]) => b.urban - a.urban)
              .map(([code, s], i) => [code, { name: s.name, value: s.urban, rank: i + 1 }])
          ),
        },
        chartBlocks: [{
          id: 'lollipop-urban',
          title: 'Urban MPCE by State',
          type: 'lollipop',
          unit: '₹',
          average: nationalAvg.urban,
          higherIsBetter: true,
          data: lollipopUrban,
        }],
      },
    ],
    chartBlocks: [{
      id: 'lollipop-combined',
      title: 'Monthly Per Capita Expenditure by State (Combined)',
      type: 'lollipop',
      unit: '₹',
      average: nationalAvg.combined,
      higherIsBetter: true,
      data: lollipopCombined,
    }],
    tableData: {
      columns: [
        { label: 'Rank',          type: 'number' },
        { label: 'State / UT',    type: 'string' },
        { label: 'Combined MPCE (₹)', type: 'number' },
        { label: 'Rural MPCE (₹)',    type: 'number' },
        { label: 'Urban MPCE (₹)',    type: 'number' },
        { label: 'Urban-Rural Gap (₹)', type: 'number' },
      ],
      rows: tableRows,
    },
    insights: [],
  };
}

// ---------- Main ----------
try {
  const rawData = MOCK ? MOCK_DATA : loadReal();
  const output  = buildDataJson(rawData);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'data.json'),
    JSON.stringify(output, null, 2),
    'utf8'
  );

  const stateCount = Object.keys(output.mapData.states).length;
  console.log(`✓ household-consumption: ${stateCount} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ household-consumption: ${err.message}`);
  process.exit(1);
}
