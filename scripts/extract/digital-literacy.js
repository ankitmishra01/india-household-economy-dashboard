/**
 * Extract: Digital Literacy & Internet Access (NFHS-5 2019-21)
 * Output: data/pages/digital-literacy/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'digital-literacy');
const MOCK    = process.argv.includes('--mock');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   female: 43.2, male: 68.4, gap: 25.2 },
    UP: { name: 'Uttar Pradesh', female: 23.6, male: 56.8, gap: 33.2 },
    KL: { name: 'Kerala',        female: 70.8, male: 82.1, gap: 11.3 },
    RJ: { name: 'Rajasthan',     female: 21.4, male: 55.2, gap: 33.8 },
    BR: { name: 'Bihar',         female: 16.8, male: 48.6, gap: 31.8 },
  },
  national: { female: 33.3, male: 57.8, gap: 24.5 },
  nationalGap: [
    { label: 'Women who have used internet',  value: 33, color: 'var(--accent-saffron)' },
    { label: 'Men who have used internet',    value: 58, color: 'var(--w2)' },
  ],
};

function buildDataJson(raw) {
  const sorted = Object.entries(raw.states)
    .sort(([,a],[,b]) => b.gap - a.gap)
    .map(([c,s],i) => [c, {...s, rank: i+1}]);
  const states = Object.fromEntries(sorted.map(([c,s]) => [c, {name:s.name, value:s.female, rank:s.rank}]));

  return {
    meta: {
      title: 'Digital Literacy & Internet Access',
      subtitle: '% who have ever used the internet by gender and state',
      source: 'NFHS-5 2019–21, IIPS/MoHFW — Tables on internet use',
      sourceUrl: 'https://rchiips.org/nfhs/nfhs5.shtml',
      surveyPeriod: '2019–2021',
      notes: [
        'Internet use is asked as "ever used the internet" — not regular/active use.',
        'Gender digital divide correlates with female mobile phone ownership and literacy gaps.',
        'States with >30pp gender internet gap have significant economic implications for female financial inclusion.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'NFHS-5 asks women aged 15-49 and men aged 15-54 whether they have ever used the internet.',
    },
    mapData: { indicator: '% women who have used the internet', unit: '%', nationalAverage: raw.national.female, states },
    chartBlocks: [
      {
        id: 'grouped-internet',
        title: 'Male vs Female Internet Use by State (sorted by gender gap)',
        type: 'grouped-lollipop', unit: '%',
        labelA: 'Male', labelB: 'Female', colorA: 'var(--w2)', colorB: 'var(--accent-saffron)',
        seriesA: sorted.map(([c,s])=>({code:c,name:s.name,value:s.male})),
        seriesB: sorted.map(([c,s])=>({code:c,name:s.name,value:s.female})),
      },
      { id: 'waffle-internet', title: 'National Internet Use: Men vs Women', type: 'waffle', unit: '%', segments: raw.nationalGap },
    ],
    tableData: {
      columns: [
        { label: 'State / UT', type: 'string' },
        { label: 'Female Internet Use (%)', type: 'number' },
        { label: 'Male Internet Use (%)', type: 'number' },
        { label: 'Gender Gap (pp)', type: 'number' },
      ],
      rows: Object.entries(raw.states).map(([,s]) => [s.name, s.female, s.male, s.gap]),
    },
    insights: [],
  };
}

try {
  const data = buildDataJson(MOCK_DATA);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ digital-literacy: ${Object.keys(MOCK_DATA.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ digital-literacy: ${err.message}`);
  process.exit(1);
}
