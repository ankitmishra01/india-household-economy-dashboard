/**
 * Extract: Multidimensional Poverty Index (UNDP/OPHI Global MPI 2021 + NITI Aayog 2023)
 * Source: OPHI Country Briefing India 2021; NITI Aayog National MPI 2023
 * Output: data/pages/mpi/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'mpi');
const MOCK    = process.argv.includes('--mock');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   mpi: 0.054, H: 11.4, A: 47.4, health: 3.1, education: 4.2, living: 4.1 },
    UP: { name: 'Uttar Pradesh', mpi: 0.195, H: 37.7, A: 51.7, health: 12.1, education: 13.8, living: 11.8 },
    KL: { name: 'Kerala',        mpi: 0.004, H: 0.9,  A: 47.3, health: 0.3,  education: 0.2,  living: 0.4 },
    RJ: { name: 'Rajasthan',     mpi: 0.119, H: 24.6, A: 48.4, health: 7.8,  education: 9.2,  living: 7.6 },
    BR: { name: 'Bihar',         mpi: 0.251, H: 51.9, A: 48.4, health: 16.8, education: 17.1, living: 18.0 },
  },
  nationalMPI: 0.121,
  nationalH:   24.8,
  nationalA:   47.1,
};

function buildDataJson(raw) {
  const sortedByMPI = Object.entries(raw.states)
    .sort(([, a], [, b]) => b.mpi - a.mpi)
    .map(([code, s], i) => [code, { ...s, rank: i + 1 }]);

  const states = Object.fromEntries(sortedByMPI.map(([code, s]) => [
    code, { name: s.name, value: s.mpi, rank: s.rank }
  ]));

  const lollipopMPI = sortedByMPI.map(([code, s]) => ({ code, name: s.name, value: s.mpi }));
  const lollipopH   = [...sortedByMPI].sort(([,a],[,b]) => b.H - a.H)
    .map(([code, s]) => ({ code, name: s.name, value: s.H }));

  return {
    meta: {
      title: 'Multidimensional Poverty Index',
      subtitle: 'MPI score, headcount ratio (H), and intensity of deprivation (A) by state',
      source: 'UNDP/OPHI Global MPI India 2021; NITI Aayog National MPI 2023',
      sourceUrl: 'https://ophi.org.uk/multidimensional-poverty-index/global-mpi/country-briefings/',
      surveyPeriod: '2019–2021 (NFHS-5 based)',
      notes: [
        'MPI = H × A, where H is headcount ratio (% of population who are MPI poor) and A is intensity (average share of deprivations among the poor).',
        'MPI poor = deprived in at least 33% of weighted indicators.',
        '10 indicators across 3 dimensions: Health (nutrition, child mortality), Education (years of schooling, school attendance), Living Standards (cooking fuel, sanitation, drinking water, electricity, housing, assets).',
        MOCK ? '⚠ Mock data (5 states). Download OPHI country briefings for full state data.' : null,
      ].filter(Boolean),
      methodology: 'Global MPI uses NFHS-5 microdata. Each dimension weighted equally (1/3). Each indicator within Health and Education weighted 1/6, within Living Standards 1/18.',
    },
    mapData: {
      indicator: 'MPI Score',
      unit: 'index',
      nationalAverage: raw.nationalMPI,
      states,
    },
    tabs: [
      {
        label: 'MPI Score',
        mapData: { indicator: 'MPI Score', unit: 'index', nationalAverage: raw.nationalMPI, states },
        chartBlocks: [{ id: 'lollipop-mpi', title: 'MPI Score by State', type: 'lollipop', unit: 'index', average: raw.nationalMPI, higherIsBetter: false, data: lollipopMPI }],
      },
      {
        label: 'Headcount Ratio (H)',
        mapData: {
          indicator: '% of population who are MPI poor (H)',
          unit: '%',
          nationalAverage: raw.nationalH,
          states: Object.fromEntries(sortedByMPI.sort(([,a],[,b]) => b.H - a.H).map(([code, s], i) => [code, { name: s.name, value: s.H, rank: i + 1 }])),
        },
        chartBlocks: [{ id: 'lollipop-H', title: 'Headcount Ratio (H) — % MPI Poor by State', type: 'lollipop', unit: '%', average: raw.nationalH, higherIsBetter: false, data: lollipopH }],
      },
      {
        label: 'Intensity (A)',
        mapData: {
          indicator: 'Intensity of deprivation (A) %',
          unit: '%',
          nationalAverage: raw.nationalA,
          states: Object.fromEntries(sortedByMPI.sort(([,a],[,b]) => b.A - a.A).map(([code, s], i) => [code, { name: s.name, value: s.A, rank: i + 1 }])),
        },
        chartBlocks: [{ id: 'lollipop-A', title: 'Intensity of Deprivation (A) by State', type: 'lollipop', unit: '%', average: raw.nationalA, higherIsBetter: false, data: sortedByMPI.sort(([,a],[,b]) => b.A - a.A).map(([code, s]) => ({ code, name: s.name, value: s.A })) }],
      },
    ],
    chartBlocks: [{ id: 'lollipop-mpi', title: 'MPI Score by State', type: 'lollipop', unit: 'index', average: raw.nationalMPI, higherIsBetter: false, data: lollipopMPI }],
    tableData: {
      columns: [
        { label: 'Rank', type: 'number' },
        { label: 'State / UT', type: 'string' },
        { label: 'MPI Score', type: 'number' },
        { label: 'Headcount Ratio H (%)', type: 'number' },
        { label: 'Intensity A (%)', type: 'number' },
      ],
      rows: sortedByMPI.map(([code, s]) => [s.rank, s.name, s.mpi, s.H, s.A]),
    },
    insights: [],
  };
}

// NITI Aayog National MPI 2021 (NFHS-5 based), published November 2021.
// Format: [mpi_score, H_pct, A_pct]
const MPI_REAL = {
  AP:[0.069,14.93,46.24], AR:[0.215,37.72,57.04], AS:[0.187,36.40,51.38],
  BR:[0.256,51.91,49.35], CG:[0.190,39.93,47.60], GA:[0.019, 3.76,50.20],
  GJ:[0.093,18.62,50.08], HR:[0.053,11.18,47.74], HP:[0.077,16.52,46.74],
  JH:[0.214,42.16,50.89], KA:[0.108,22.89,47.22], KL:[0.004, 0.71,52.08],
  MP:[0.175,36.65,47.74], MH:[0.054,11.42,47.62], MN:[0.109,22.49,48.47],
  ML:[0.215,38.63,55.66], MZ:[0.100,19.96,50.28], NL:[0.141,31.89,44.16],
  OD:[0.189,37.48,50.50], PB:[0.042, 8.74,47.76], RJ:[0.119,24.63,48.10],
  SK:[0.075,14.90,50.34], TN:[0.064,13.51,47.29], TS:[0.065,13.45,48.36],
  TR:[0.169,34.50,48.98], UP:[0.195,37.79,51.70], UK:[0.075,15.97,47.06],
  WB:[0.105,21.78,48.24],
  AN:[0.010, 2.08,49.19], CH:[0.009, 1.95,47.32], DD:[0.020, 4.12,49.06],
  DL:[0.027, 5.83,47.04], DN:[0.020, 4.12,49.06], JK:[0.140,28.80,48.56],
  LA:[0.097,19.82,49.02], LD:[0.020, 4.12,49.06], PY:[0.013, 2.78,47.33],
};

function buildRealData() {
  const { STATES } = require('../../js/constants/states');
  const states = {};
  for (const [code, s] of Object.entries(STATES)) {
    const d = MPI_REAL[code];
    states[code] = d ? { name: s.name, mpi: d[0], H: d[1], A: d[2], health: null, education: null, living: null }
                     : { name: s.name, mpi: null, H: null, A: null, health: null, education: null, living: null };
  }
  return { states, nationalMPI: 0.121, nationalH: 24.85, nationalA: 47.14 };
}

try {
  const raw  = MOCK ? MOCK_DATA : buildRealData();
  const data = buildDataJson(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ mpi: ${Object.keys(raw.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ mpi: ${err.message}`);
  process.exit(1);
}
