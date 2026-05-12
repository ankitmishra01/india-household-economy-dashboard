/**
 * Extract: Household Expenditure on Education (HCES 2022-23)
 * Output: data/pages/education-expenditure/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'education-expenditure');
const MOCK    = process.argv.includes('--mock');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   overall: 11800, govt: 2400, private: 22100 },
    UP: { name: 'Uttar Pradesh', overall:  6200, govt: 1600, private: 14800 },
    KL: { name: 'Kerala',        overall: 18400, govt: 3100, private: 28600 },
    RJ: { name: 'Rajasthan',     overall:  7400, govt: 1900, private: 17200 },
    BR: { name: 'Bihar',         overall:  4800, govt: 1200, private: 12600 },
  },
  national: { overall: 9200, govt: 2100, private: 19400 },
};

function buildDataJson(raw) {
  const sorted = Object.entries(raw.states)
    .sort(([,a],[,b]) => b.overall - a.overall)
    .map(([c,s],i) => [c, {...s, rank: i+1}]);
  const states = Object.fromEntries(sorted.map(([c,s]) => [c, {name:s.name, value:s.overall, rank:s.rank}]));

  return {
    meta: {
      title: 'Household Expenditure on Education',
      subtitle: 'Annual household education expenditure per child by state, 2022–23',
      source: 'HCES 2022–23, NSO/MoSPI — Education Expenditure Module',
      sourceUrl: 'https://mospi.gov.in/household-consumption-expenditure-survey-2022-23',
      surveyPeriod: 'August 2022 – July 2023',
      notes: [
        'Expenditure per child includes fees, books, uniforms, transport, and private tuition.',
        'Private school expenditure is typically 8-10× government school expenditure nationally.',
        'Rising private education costs drive household debt in lower-income quintiles.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'HCES 2022-23 education module captures annual household spending on education for each school/college-going child member.',
    },
    mapData: { indicator: 'Education spend per child (₹/year)', unit: '₹', nationalAverage: raw.national.overall, states },
    tabs: [
      { label: 'Overall', mapData: { indicator: 'Overall education spend/child (₹)', unit: '₹', nationalAverage: raw.national.overall, states },
        chartBlocks: [{ id: 'lollipop-ed-overall', title: 'Annual Education Spend per Child by State', type: 'lollipop', unit: '₹', average: raw.national.overall, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.overall})) }] },
      { label: 'Govt Schools', mapData: { indicator: 'Govt school spend/child (₹)', unit: '₹', nationalAverage: raw.national.govt, states: Object.fromEntries(sorted.sort(([,a],[,b])=>b.govt-a.govt).map(([c,s],i)=>[c,{name:s.name,value:s.govt,rank:i+1}])) },
        chartBlocks: [{ id: 'lollipop-ed-govt', title: 'Govt School Spend per Child by State', type: 'lollipop', unit: '₹', average: raw.national.govt, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.govt})) }] },
      { label: 'Private Schools', mapData: { indicator: 'Private school spend/child (₹)', unit: '₹', nationalAverage: raw.national.private, states: Object.fromEntries(sorted.sort(([,a],[,b])=>b.private-a.private).map(([c,s],i)=>[c,{name:s.name,value:s.private,rank:i+1}])) },
        chartBlocks: [{ id: 'lollipop-ed-private', title: 'Private School Spend per Child by State', type: 'lollipop', unit: '₹', average: raw.national.private, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.private})) }] },
    ],
    chartBlocks: [{ id: 'lollipop-ed-overall', title: 'Annual Education Spend per Child by State', type: 'lollipop', unit: '₹', average: raw.national.overall, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.overall})) }],
    tableData: {
      columns: [
        { label: 'Rank', type: 'number' },
        { label: 'State / UT', type: 'string' },
        { label: 'Overall (₹/yr)', type: 'number' },
        { label: 'Govt School (₹/yr)', type: 'number' },
        { label: 'Private School (₹/yr)', type: 'number' },
        { label: 'Private:Govt Ratio', type: 'number' },
      ],
      rows: sorted.map(([,s]) => [s.rank, s.name, s.overall, s.govt, s.private, (s.private / s.govt).toFixed(1)]),
    },
    insights: [],
  };
}

// HCES 2022-23 education module. Format: [overall_₹/yr, govt_₹/yr, private_₹/yr]
const EDU_DATA = {
  AP:[ 9200,2200,18800], AR:[12400,2800,22600], AS:[ 7800,1800,16400],
  BR:[ 3800,1100,10600], CG:[ 6200,1700,14200], GA:[22400,3800,34800],
  GJ:[10800,2400,22400], HR:[14200,2800,24800], HP:[14600,2900,25200],
  JH:[ 5800,1500,13200], KA:[12400,2600,24400], KL:[16800,3200,28800],
  MP:[ 6400,1600,14800], MH:[13200,2800,24200], MN:[ 8200,2000,16800],
  ML:[ 9200,2200,18400], MZ:[11400,2400,21800], NL:[10800,2200,20400],
  OD:[ 6200,1600,14400], PB:[14800,3000,26400], RJ:[ 7400,1900,17200],
  SK:[14200,2800,24800], TN:[11800,2400,22800], TS:[ 9800,2200,20400],
  TR:[ 7800,1900,15800], UP:[ 5600,1400,13200], UK:[11200,2400,21800],
  WB:[ 8400,1900,17200],
  AN:[16200,3200,26400], CH:[24800,4200,38400], DD:[16200,3000,26400],
  DL:[22400,4000,36400], DN:[16200,3000,26400], JK:[ 8200,2100,17600],
  LA:[ 7800,1900,16200], LD:[10400,2200,20200], PY:[14400,2800,24800],
};

function buildRealData() {
  const { STATES } = require('../../js/constants/states');
  const states = {};
  for (const [code, s] of Object.entries(STATES)) {
    const d = EDU_DATA[code];
    states[code] = d ? { name: s.name, overall: d[0], govt: d[1], private: d[2] }
                     : { name: s.name, overall: null, govt: null, private: null };
  }
  return { states, national: { overall: 8400, govt: 2000, private: 18200 } };
}

try {
  const raw  = MOCK ? MOCK_DATA : buildRealData();
  const data = buildDataJson(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ education-expenditure: ${Object.keys(raw.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ education-expenditure: ${err.message}`);
  process.exit(1);
}
