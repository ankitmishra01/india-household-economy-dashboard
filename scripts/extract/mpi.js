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

try {
  const data = buildDataJson(MOCK_DATA);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ mpi: ${Object.keys(MOCK_DATA.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ mpi: ${err.message}`);
  process.exit(1);
}
