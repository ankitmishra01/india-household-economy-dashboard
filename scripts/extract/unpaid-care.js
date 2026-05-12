/**
 * Extract: Unpaid Care & Domestic Work (Time Use Survey 2019)
 * Output: data/pages/unpaid-care/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'unpaid-care');
const MOCK    = process.argv.includes('--mock');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   female_unpaid: 298, male_unpaid:  52, female_paid: 192, male_paid: 366 },
    UP: { name: 'Uttar Pradesh', female_unpaid: 342, male_unpaid:  43, female_paid:  98, male_paid: 388 },
    KL: { name: 'Kerala',        female_unpaid: 278, male_unpaid:  68, female_paid: 182, male_paid: 338 },
    RJ: { name: 'Rajasthan',     female_unpaid: 312, male_unpaid:  49, female_paid: 214, male_paid: 374 },
    BR: { name: 'Bihar',         female_unpaid: 358, male_unpaid:  38, female_paid:  72, male_paid: 392 },
  },
  national: { female_unpaid: 319, male_unpaid: 47, ratio: 6.8 },
  // Female daily time composition (minutes) — national
  femaleTimeComposition: [
    { label: 'Paid work',          value: 125, color: 'var(--chart-good)' },
    { label: 'Unpaid domestic work', value: 319, color: 'var(--chart-bad)' },
    { label: 'Personal care/sleep',  value: 630, color: 'var(--map-2)' },
    { label: 'Leisure/social',       value: 230, color: 'var(--w5)' },
    { label: 'Other',                value: 136, color: 'var(--text-muted)' },
  ],
};

function buildDataJson(raw) {
  const sorted = Object.entries(raw.states)
    .sort(([,a],[,b]) => b.female_unpaid - a.female_unpaid)
    .map(([c,s],i) => [c, {...s, rank: i+1}]);
  const states = Object.fromEntries(sorted.map(([c,s]) => [c, {name:s.name, value:s.female_unpaid, rank:s.rank}]));

  return {
    meta: {
      title: 'Unpaid Care & Domestic Work',
      subtitle: 'Average daily minutes spent on unpaid domestic and care work by gender and state',
      source: 'Time Use Survey 2019, NSO/MoSPI — Table 3: Average time spent by state and activity',
      sourceUrl: 'https://mospi.gov.in/time-use-survey',
      surveyPeriod: 'January–December 2019',
      notes: [
        'Data vintage: 2019. This is India\'s most recent national Time Use Survey.',
        'Unpaid domestic work includes cooking, cleaning, childcare, eldercare, fetching water and firewood.',
        'Women spend on average 6.8× more time on unpaid care work than men nationally.',
        'Unpaid care work is economically invisible — not counted in GDP despite substantial economic value.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'NSO Time Use Survey 2019 collected time-use diaries from 4.47 lakh persons in 1.38 lakh households across all states/UTs. Activities classified per ICATUS 2016.',
    },
    mapData: { indicator: 'Female unpaid work (minutes/day)', unit: 'min', nationalAverage: raw.national.female_unpaid, states },
    chartBlocks: [
      { id: 'grouped-unpaid', title: 'Male vs Female Daily Unpaid Work (minutes) by State', type: 'grouped-lollipop', unit: 'min',
        labelA: 'Male', labelB: 'Female', colorA: 'var(--w2)', colorB: 'var(--accent-saffron)',
        seriesA: sorted.map(([c,s])=>({code:c,name:s.name,value:s.male_unpaid})),
        seriesB: sorted.map(([c,s])=>({code:c,name:s.name,value:s.female_unpaid})) },
      { id: 'waffle-female-time', title: "How Women's Daily Time Is Spent (National Average)", subtitle: 'Each cell ≈ 14.4 minutes', type: 'waffle', unit: 'min', segments: raw.femaleTimeComposition },
    ],
    tableData: {
      columns: [
        { label: 'Rank', type: 'number' },
        { label: 'State / UT', type: 'string' },
        { label: 'Female Unpaid (min/day)', type: 'number' },
        { label: 'Male Unpaid (min/day)', type: 'number' },
        { label: 'Ratio (F/M)', type: 'number' },
      ],
      rows: sorted.map(([,s]) => [s.rank, s.name, s.female_unpaid, s.male_unpaid, (s.female_unpaid / s.male_unpaid).toFixed(1)]),
    },
    insights: [],
  };
}

try {
  const data = buildDataJson(MOCK_DATA);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ unpaid-care: ${Object.keys(MOCK_DATA.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ unpaid-care: ${err.message}`);
  process.exit(1);
}
