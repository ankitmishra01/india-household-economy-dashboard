/**
 * Extract: Mobile Money & Digital Payments (NFHS-5 + RBI)
 * Output: data/pages/mobile-money/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'mobile-money');
const MOCK    = process.argv.includes('--mock');
const LOADER  = require('../fetch/nfhs5-loader');
const { STATES } = require('../../js/constants/states');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   female_mobile: 64.3, male_mobile: 88.4, upi_per_capita: 218 },
    UP: { name: 'Uttar Pradesh', female_mobile: 41.2, male_mobile: 78.6, upi_per_capita: 126 },
    KL: { name: 'Kerala',        female_mobile: 83.6, male_mobile: 94.2, upi_per_capita: 312 },
    RJ: { name: 'Rajasthan',     female_mobile: 38.4, male_mobile: 76.8, upi_per_capita: 108 },
    BR: { name: 'Bihar',         female_mobile: 29.8, male_mobile: 71.4, upi_per_capita:  84 },
  },
  national: { female_mobile: 54.1, male_mobile: 82.4, upi_per_capita: 164 },
};

function buildDataJson(raw) {
  const sorted = Object.entries(raw.states)
    .sort(([,a],[,b]) => b.female_mobile - a.female_mobile)
    .map(([c,s],i) => [c, {...s, rank: i+1}]);
  const states = Object.fromEntries(sorted.map(([c,s]) => [c, {name:s.name, value:s.female_mobile, rank:s.rank}]));

  return {
    meta: {
      title: 'Mobile Money & Digital Payments',
      subtitle: 'Female mobile ownership and UPI transaction volume by state',
      source: 'NFHS-5 2019–21, IIPS/MoHFW (mobile ownership); RBI Payment System Data (UPI)',
      sourceUrl: 'https://rchiips.org/nfhs/nfhs5.shtml; https://rbi.org.in/scripts/PaymentSystems.aspx',
      surveyPeriod: 'NFHS-5: 2019–2021; RBI UPI data: 2022–23',
      notes: [
        'Female mobile phone ownership is a key proxy for digital financial access.',
        'UPI per capita = annual transactions / state population (using census projections).',
        'States with high UPI but low female mobile ownership have a digital gender inclusion gap.',
        MOCK ? '⚠ Mock data (5 states). RBI provides UPI data at state level on request.' : null,
      ].filter(Boolean),
      methodology: 'NFHS-5 asks women aged 15-49 whether they personally own a mobile phone. UPI data from RBI payment system statistics aggregated to annual per-capita basis.',
    },
    mapData: { indicator: '% women who own a mobile phone', unit: '%', nationalAverage: raw.national.female_mobile, states },
    chartBlocks: [{
      id: 'grouped-mobile',
      title: 'Mobile Phone Ownership: Male vs Female by State',
      type: 'grouped-lollipop', unit: '%',
      labelA: 'Male', labelB: 'Female', colorA: 'var(--w2)', colorB: 'var(--accent-saffron)',
      seriesA: sorted.map(([c,s])=>({code:c,name:s.name,value:s.male_mobile})),
      seriesB: sorted.map(([c,s])=>({code:c,name:s.name,value:s.female_mobile})),
    }],
    tableData: {
      columns: [
        { label: 'State / UT', type: 'string' },
        { label: 'Female Mobile Ownership (%)', type: 'number' },
        { label: 'Male Mobile Ownership (%)', type: 'number' },
        { label: 'Gender Gap (pp)', type: 'number' },
        { label: 'UPI Transactions per Capita', type: 'number' },
      ],
      rows: Object.entries(raw.states).map(([,s]) => [s.name, s.female_mobile, s.male_mobile, (s.male_mobile - s.female_mobile).toFixed(1), s.upi_per_capita]),
    },
    insights: [],
  };
}

function buildRealData() {
  const f = LOADER.stateMap(123);
  const nf = LOADER.national(123).total;
  const states = {};
  for (const [code, s] of Object.entries(STATES))
    states[code] = { name: s.name, female_mobile: f[code] ?? null, male_mobile: null, upi_per_capita: null };
  return { states, national: { female_mobile: nf, male_mobile: null, upi_per_capita: null } };
}

try {
  const raw  = MOCK ? MOCK_DATA : buildRealData();
  const data = buildDataJson(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  const n = Object.keys(raw.states).length;
  console.log(`✓ mobile-money: ${n} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ mobile-money: ${err.message}`);
  process.exit(1);
}
