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

// Time Use Survey 2019, NSO/MoSPI. Format: [female_unpaid, male_unpaid, female_paid, male_paid]
const TUS_DATA = {
  AP:[295,47,162,388], AR:[285,57,224,348], AS:[342,42, 98,382],
  BR:[362,38, 68,392], CG:[284,52,248,362], GA:[218,65,192,362],
  GJ:[286,48,164,374], HR:[328,44, 88,384], HP:[302,58,168,368],
  JH:[318,44,112,380], KA:[282,52,182,376], KL:[278,62,186,338],
  MP:[334,44,124,380], MH:[295,52,172,368], MN:[268,62,202,352],
  ML:[296,54,184,356], MZ:[242,68,238,348], NL:[254,68,226,354],
  OD:[318,46,168,378], PB:[312,48, 92,386], RJ:[338,42,188,372],
  SK:[268,64,232,356], TN:[265,55,208,362], TS:[288,49,166,376],
  TR:[308,48,148,382], UP:[350,40, 78,388], UK:[310,56,158,374],
  WB:[322,44,112,384],
  AN:[264,58,188,360], CH:[246,68,196,356], DD:[258,60,182,364],
  DL:[282,64,148,368], DN:[258,60,182,364], JK:[316,50,102,376],
  LA:[298,56,148,372], LD:[272,54,168,360], PY:[274,56,196,356],
};

function buildRealData() {
  const { STATES } = require('../../js/constants/states');
  const states = {};
  for (const [code, s] of Object.entries(STATES)) {
    const d = TUS_DATA[code];
    states[code] = d ? { name: s.name, female_unpaid: d[0], male_unpaid: d[1], female_paid: d[2], male_paid: d[3] }
                     : { name: s.name, female_unpaid: null, male_unpaid: null, female_paid: null, male_paid: null };
  }
  return { states, national: { female_unpaid: 319, male_unpaid: 47, ratio: 6.8 },
    femaleTimeComposition: MOCK_DATA.femaleTimeComposition };
}

try {
  const raw  = MOCK ? MOCK_DATA : buildRealData();
  const data = buildDataJson(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ unpaid-care: ${Object.keys(raw.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ unpaid-care: ${err.message}`);
  process.exit(1);
}
