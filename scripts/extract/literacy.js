/**
 * Extract: Adult Literacy (NFHS-5 2019-21 + Census 2011 baseline)
 * Output: data/pages/literacy/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'literacy');
const MOCK    = process.argv.includes('--mock');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   female: 79.2, male: 89.6, overall: 84.5, gap: 10.4 },
    UP: { name: 'Uttar Pradesh', female: 59.3, male: 79.8, overall: 69.7, gap: 20.5 },
    KL: { name: 'Kerala',        female: 97.9, male: 97.4, overall: 97.7, gap: -0.5 },
    RJ: { name: 'Rajasthan',     female: 57.6, male: 80.8, overall: 69.7, gap: 23.2 },
    BR: { name: 'Bihar',         female: 53.3, male: 73.7, overall: 63.8, gap: 20.4 },
  },
  national: { female: 71.5, male: 84.7, overall: 78.1 },
};

function buildDataJson(raw) {
  const sortedF = Object.entries(raw.states).sort(([,a],[,b]) => b.female - a.female).map(([c,s],i) => [c, {...s, rank: i+1}]);
  const states  = Object.fromEntries(sortedF.map(([c,s]) => [c, {name:s.name, value:s.female, rank:s.rank}]));

  return {
    meta: {
      title: 'Adult Literacy & Gender Gap',
      subtitle: 'Literacy rates for adults (15+) by state and gender',
      source: 'NFHS-5 2019–21, IIPS/MoHFW — Literacy and Education Tables; Census 2011',
      sourceUrl: 'https://rchiips.org/nfhs/nfhs5.shtml',
      surveyPeriod: '2019–2021 (NFHS-5); Census 2011 for trend comparison',
      notes: [
        'Literacy = ability to read and write in any language (self-reported in NFHS-5).',
        'Kerala is the only state where female literacy exceeds male literacy.',
        'Rajasthan and Bihar have the largest gender literacy gaps nationally.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'NFHS-5 literacy measured for household members aged 15 and above. Self-reported ability to read and write.',
    },
    mapData: { indicator: 'Female literacy rate (%)', unit: '%', nationalAverage: raw.national.female, states },
    tabs: [
      { label: 'Female Literacy', mapData: { indicator: 'Female literacy (%)', unit: '%', nationalAverage: raw.national.female, states },
        chartBlocks: [{ id: 'lollipop-female-lit', title: 'Female Literacy Rate by State', type: 'lollipop', unit: '%', average: raw.national.female, data: sortedF.map(([c,s])=>({code:c,name:s.name,value:s.female})) }] },
      { label: 'Male Literacy',
        mapData: { indicator: 'Male literacy (%)', unit: '%', nationalAverage: raw.national.male, states: Object.fromEntries(sortedF.sort(([,a],[,b])=>b.male-a.male).map(([c,s],i)=>[c,{name:s.name,value:s.male,rank:i+1}])) },
        chartBlocks: [{ id: 'lollipop-male-lit', title: 'Male Literacy Rate by State', type: 'lollipop', unit: '%', average: raw.national.male, data: sortedF.map(([c,s])=>({code:c,name:s.name,value:s.male})) }] },
      { label: 'Gender Gap',
        mapData: { indicator: 'Literacy gender gap (M-F, pp)', unit: '%', nationalAverage: raw.national.male - raw.national.female, states: Object.fromEntries(sortedF.sort(([,a],[,b])=>b.gap-a.gap).map(([c,s],i)=>[c,{name:s.name,value:s.gap,rank:i+1}])) },
        chartBlocks: [{ id: 'lollipop-lit-gap', title: 'Literacy Gender Gap by State (Male minus Female, pp)', type: 'lollipop', unit: '%', average: raw.national.male - raw.national.female, higherIsBetter: false, data: sortedF.map(([c,s])=>({code:c,name:s.name,value:s.gap})) }] },
    ],
    chartBlocks: [{
      id: 'grouped-lit',
      title: 'Male vs Female Literacy by State (sorted by gender gap)',
      type: 'grouped-lollipop', unit: '%',
      labelA: 'Male', labelB: 'Female', colorA: 'var(--w2)', colorB: 'var(--accent-saffron)',
      seriesA: sortedF.sort(([,a],[,b])=>b.gap-a.gap).map(([c,s])=>({code:c,name:s.name,value:s.male})),
      seriesB: sortedF.map(([c,s])=>({code:c,name:s.name,value:s.female})),
    }],
    tableData: {
      columns: [
        { label: 'State / UT', type: 'string' },
        { label: 'Female Literacy (%)', type: 'number' },
        { label: 'Male Literacy (%)', type: 'number' },
        { label: 'Overall (%)', type: 'number' },
        { label: 'Gender Gap (pp)', type: 'number' },
      ],
      rows: Object.entries(raw.states).map(([,s]) => [s.name, s.female, s.male, s.overall, s.gap]),
    },
    insights: [],
  };
}

try {
  const data = buildDataJson(MOCK_DATA);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ literacy: ${Object.keys(MOCK_DATA.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ literacy: ${err.message}`);
  process.exit(1);
}
