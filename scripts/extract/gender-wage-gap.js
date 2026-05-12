/**
 * Extract: Gender Wage Gap (PLFS 2022-23)
 * Output: data/pages/gender-wage-gap/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'gender-wage-gap');
const MOCK    = process.argv.includes('--mock');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   male_wage: 21400, female_wage: 15800, ratio: 0.738 },
    UP: { name: 'Uttar Pradesh', male_wage: 14200, female_wage:  9600, ratio: 0.676 },
    KL: { name: 'Kerala',        male_wage: 22100, female_wage: 17400, ratio: 0.787 },
    RJ: { name: 'Rajasthan',     male_wage: 14800, female_wage:  9200, ratio: 0.622 },
    BR: { name: 'Bihar',         male_wage: 11600, female_wage:  7200, ratio: 0.621 },
  },
  national: { male_wage: 17900, female_wage: 12400, ratio: 0.693 },
};

function buildDataJson(raw) {
  const sorted = Object.entries(raw.states)
    .sort(([,a],[,b]) => a.ratio - b.ratio)  // lowest ratio (widest gap) first
    .map(([c,s],i) => [c, {...s, rank: i+1, gap: s.male_wage - s.female_wage}]);
  const states = Object.fromEntries(sorted.map(([c,s]) => [c, {name:s.name, value:s.ratio, rank:s.rank}]));

  return {
    meta: {
      title: 'Gender Wage Gap',
      subtitle: 'Female-to-male earnings ratio for regular salaried workers by state',
      source: 'PLFS 2022–23, NSO/MoSPI — Earnings of Regular Wage/Salaried Employees',
      sourceUrl: 'https://mospi.gov.in/plfs-report',
      surveyPeriod: 'July 2022 – June 2023',
      notes: [
        'Wage gap computed for regular wage/salaried employees only — excludes casual and self-employed.',
        'A ratio of 0.70 means women earn ₹70 for every ₹100 earned by men.',
        'Occupational segregation (women concentrated in lower-paid sectors) accounts for part of the gap.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'Mean monthly earnings compared for regular wage/salaried workers aged 15-59. Not adjusted for occupation, sector, or hours worked.',
    },
    mapData: { indicator: 'Female-to-male earnings ratio', unit: 'ratio', nationalAverage: raw.national.ratio, states },
    tabs: [
      { label: 'Earnings Ratio',
        mapData: { indicator: 'F:M earnings ratio', unit: 'ratio', nationalAverage: raw.national.ratio, states },
        chartBlocks: [{ id: 'lollipop-ratio', title: 'Female-to-Male Earnings Ratio by State', subtitle: 'Ratio of 1.0 = equal pay', type: 'lollipop', unit: 'ratio', average: raw.national.ratio, higherIsBetter: true, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.ratio})) }] },
      { label: '₹ Gap',
        mapData: { indicator: 'Absolute wage gap (₹/month)', unit: '₹', nationalAverage: raw.national.male_wage - raw.national.female_wage,
          states: Object.fromEntries(sorted.sort(([,a],[,b])=>b.gap-a.gap).map(([c,s],i)=>[c,{name:s.name,value:s.gap,rank:i+1}])) },
        chartBlocks: [{ id: 'lollipop-gap', title: 'Absolute Monthly Wage Gap (₹) by State', type: 'lollipop', unit: '₹', average: raw.national.male_wage - raw.national.female_wage, higherIsBetter: false, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.gap})) }] },
    ],
    chartBlocks: [{ id: 'lollipop-ratio', title: 'Female-to-Male Earnings Ratio by State', type: 'lollipop', unit: 'ratio', average: raw.national.ratio, higherIsBetter: true, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.ratio})) }],
    tableData: {
      columns: [
        { label: 'Rank (widest gap)', type: 'number' },
        { label: 'State / UT', type: 'string' },
        { label: 'Male Avg Wage (₹/mo)', type: 'number' },
        { label: 'Female Avg Wage (₹/mo)', type: 'number' },
        { label: 'F:M Ratio', type: 'number' },
        { label: 'Gap (₹/mo)', type: 'number' },
      ],
      rows: sorted.map(([,s]) => [s.rank, s.name, s.male_wage, s.female_wage, s.ratio.toFixed(3), s.gap]),
    },
    insights: [],
  };
}

try {
  const data = buildDataJson(MOCK_DATA);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ gender-wage-gap: ${Object.keys(MOCK_DATA.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ gender-wage-gap: ${err.message}`);
  process.exit(1);
}
