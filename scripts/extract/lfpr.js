/**
 * Extract: Labor Force Participation Rate (PLFS 2022-23)
 * Source: NSO/MoSPI — PLFS Annual Report 2022-23, Statement 5/6
 * Output: data/pages/lfpr/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'lfpr');
const MOCK    = process.argv.includes('--mock');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   male: 75.1, female: 30.4, overall: 53.2 },
    UP: { name: 'Uttar Pradesh', male: 73.2, female: 18.6, overall: 46.5 },
    KL: { name: 'Kerala',        male: 69.8, female: 34.7, overall: 52.1 },
    RJ: { name: 'Rajasthan',     male: 79.6, female: 52.3, overall: 66.2 },
    BR: { name: 'Bihar',         male: 70.1, female:  9.4, overall: 41.2 },
  },
  national: { male: 76.8, female: 37.0, overall: 57.9 },
};

function buildDataJson(raw) {
  const sortedF  = Object.entries(raw.states).sort(([,a],[,b]) => b.female  - a.female).map(([c,s],i) => [c, {...s, rank: i+1}]);
  const sortedM  = Object.entries(raw.states).sort(([,a],[,b]) => b.male    - a.male).map(([c,s],i) => [c, {...s, rank: i+1}]);
  const sortedO  = Object.entries(raw.states).sort(([,a],[,b]) => b.overall - a.overall).map(([c,s],i) => [c, {...s, rank: i+1}]);

  const statesF  = Object.fromEntries(sortedF.map(([c,s]) => [c, {name:s.name, value:s.female,  rank:s.rank}]));
  const statesM  = Object.fromEntries(sortedM.map(([c,s]) => [c, {name:s.name, value:s.male,    rank:s.rank}]));
  const statesO  = Object.fromEntries(sortedO.map(([c,s]) => [c, {name:s.name, value:s.overall, rank:s.rank}]));

  const grouped = {
    id: 'grouped-lfpr',
    title: 'Male vs Female LFPR by State (sorted by gender gap)',
    type: 'grouped-lollipop',
    unit: '%',
    labelA: 'Male',
    labelB: 'Female',
    colorA: 'var(--w2)',
    colorB: 'var(--accent-saffron)',
    seriesA: sortedF.map(([c,s]) => ({code:c, name:s.name, value:s.male})),
    seriesB: sortedF.map(([c,s]) => ({code:c, name:s.name, value:s.female})),
  };

  return {
    meta: {
      title: 'Labor Force Participation Rate',
      subtitle: 'Overall, male, and female LFPR by state (UPSS basis), 2022–23',
      source: 'PLFS 2022–23, NSO/MoSPI — Annual Report, Statement 5/6',
      sourceUrl: 'https://mospi.gov.in/plfs-report',
      surveyPeriod: 'July 2022 – June 2023',
      notes: [
        'LFPR measured on Usual Principal + Subsidiary Status (UPSS) basis — considered the most comprehensive measure.',
        'UPSS includes seasonal and occasional workers who may not be active in any given week.',
        'Female LFPR in India is among the lowest in South Asia, with significant state variation.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'PLFS covers households in both rural and urban areas. LFPR = (Workers + Unemployed seeking work) / Population aged 15+.',
    },
    mapData: statesF,
    tabs: [
      { label: 'Female LFPR', mapData: { indicator: 'Female LFPR (%)', unit: '%', nationalAverage: raw.national.female, states: statesF },
        chartBlocks: [{ id: 'lollipop-female', title: 'Female LFPR by State', type: 'lollipop', unit: '%', average: raw.national.female, higherIsBetter: true, data: sortedF.map(([c,s])=>({code:c,name:s.name,value:s.female})) }] },
      { label: 'Male LFPR',   mapData: { indicator: 'Male LFPR (%)',   unit: '%', nationalAverage: raw.national.male,   states: statesM },
        chartBlocks: [{ id: 'lollipop-male',   title: 'Male LFPR by State',   type: 'lollipop', unit: '%', average: raw.national.male,   higherIsBetter: true, data: sortedM.map(([c,s])=>({code:c,name:s.name,value:s.male})) }] },
      { label: 'Overall LFPR',mapData: { indicator: 'Overall LFPR (%)',unit: '%', nationalAverage: raw.national.overall, states: statesO },
        chartBlocks: [{ id: 'lollipop-overall',title: 'Overall LFPR by State', type: 'lollipop', unit: '%', average: raw.national.overall,higherIsBetter: true, data: sortedO.map(([c,s])=>({code:c,name:s.name,value:s.overall})) }] },
    ],
    chartBlocks: [grouped],
    tableData: {
      columns: [
        { label: 'State / UT',    type: 'string' },
        { label: 'Female LFPR (%)', type: 'number' },
        { label: 'Male LFPR (%)',   type: 'number' },
        { label: 'Overall LFPR (%)',type: 'number' },
        { label: 'Gender Gap (pp)', type: 'number' },
      ],
      rows: Object.entries(raw.states).map(([,s]) => [s.name, s.female, s.male, s.overall, (s.male - s.female).toFixed(1)]),
    },
    insights: [],
  };
}

try {
  const data = buildDataJson(MOCK_DATA);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ lfpr: ${Object.keys(MOCK_DATA.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ lfpr: ${err.message}`);
  process.exit(1);
}
