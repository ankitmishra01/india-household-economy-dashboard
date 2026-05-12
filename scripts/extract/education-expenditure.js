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

try {
  const data = buildDataJson(MOCK_DATA);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ education-expenditure: ${Object.keys(MOCK_DATA.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ education-expenditure: ${err.message}`);
  process.exit(1);
}
