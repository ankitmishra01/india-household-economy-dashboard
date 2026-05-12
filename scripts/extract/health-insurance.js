/**
 * Extract: Health Insurance Coverage (NFHS-5 2019-21)
 * Output: data/pages/health-insurance/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'health-insurance');
const MOCK    = process.argv.includes('--mock');
const LOADER  = require('../fetch/nfhs5-loader');
const { STATES } = require('../../js/constants/states');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   any_coverage: 28.4, govt_scheme: 19.6, private: 12.1 },
    UP: { name: 'Uttar Pradesh', any_coverage: 18.2, govt_scheme: 14.8, private:  5.3 },
    KL: { name: 'Kerala',        any_coverage: 41.6, govt_scheme: 28.4, private: 18.2 },
    RJ: { name: 'Rajasthan',     any_coverage: 22.1, govt_scheme: 18.7, private:  6.4 },
    BR: { name: 'Bihar',         any_coverage: 14.9, govt_scheme: 11.2, private:  4.8 },
  },
  national: { any_coverage: 41.0, govt_scheme: 28.4, private: 18.6 },
};

function buildDataJson(raw) {
  const sorted = Object.entries(raw.states)
    .sort(([,a],[,b]) => b.any_coverage - a.any_coverage)
    .map(([c,s],i) => [c, {...s, rank: i+1}]);
  const states = Object.fromEntries(sorted.map(([c,s]) => [c, {name:s.name, value:s.any_coverage, rank:s.rank}]));

  return {
    meta: {
      title: 'Health Insurance Coverage',
      subtitle: '% of population covered by any health insurance scheme by state',
      source: 'NFHS-5 2019–21, IIPS/MoHFW — Table on Health Insurance / Financing',
      sourceUrl: 'https://rchiips.org/nfhs/nfhs5.shtml',
      surveyPeriod: '2019–2021',
      notes: [
        'Coverage includes government schemes (PMJAY/Ayushman Bharat, RSBY, state schemes) and private insurance.',
        'Having insurance does not guarantee access to care — claims denial and facility availability affect actual coverage.',
        'PMJAY (Ayushman Bharat) launched 2018 — NFHS-5 captures early adoption.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'NFHS-5 asks whether household members are covered by any health insurance/financing scheme. Multiple schemes per person possible — counted as covered if any.',
    },
    mapData: { indicator: 'Health insurance coverage (%)', unit: '%', nationalAverage: raw.national.any_coverage, states },
    tabs: [
      { label: 'Any Coverage', mapData: { indicator: 'Any health insurance (%)', unit: '%', nationalAverage: raw.national.any_coverage, states },
        chartBlocks: [{ id: 'lollipop-any', title: 'Any Health Insurance Coverage by State', type: 'lollipop', unit: '%', average: raw.national.any_coverage, higherIsBetter: true, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.any_coverage})) }] },
      { label: 'Government Scheme', mapData: { indicator: 'Govt scheme coverage (%)', unit: '%', nationalAverage: raw.national.govt_scheme, states: Object.fromEntries(sorted.sort(([,a],[,b])=>b.govt_scheme-a.govt_scheme).map(([c,s],i)=>[c,{name:s.name,value:s.govt_scheme,rank:i+1}])) },
        chartBlocks: [{ id: 'lollipop-govt', title: 'Government Health Scheme Coverage by State', type: 'lollipop', unit: '%', average: raw.national.govt_scheme, higherIsBetter: true, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.govt_scheme})) }] },
      { label: 'Private Insurance', mapData: { indicator: 'Private insurance (%)', unit: '%', nationalAverage: raw.national.private, states: Object.fromEntries(sorted.sort(([,a],[,b])=>b.private-a.private).map(([c,s],i)=>[c,{name:s.name,value:s.private,rank:i+1}])) },
        chartBlocks: [{ id: 'lollipop-private', title: 'Private Insurance Coverage by State', type: 'lollipop', unit: '%', average: raw.national.private, higherIsBetter: true, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.private})) }] },
    ],
    chartBlocks: [{ id: 'lollipop-any', title: 'Any Health Insurance Coverage by State', type: 'lollipop', unit: '%', average: raw.national.any_coverage, higherIsBetter: true, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.any_coverage})) }],
    tableData: {
      columns: [
        { label: 'Rank', type: 'number' },
        { label: 'State / UT', type: 'string' },
        { label: 'Any Coverage (%)', type: 'number' },
        { label: 'Govt Scheme (%)', type: 'number' },
        { label: 'Private Insurance (%)', type: 'number' },
      ],
      rows: sorted.map(([,s]) => [s.rank, s.name, s.any_coverage, s.govt_scheme, s.private]),
    },
    insights: [],
  };
}

function buildRealData() {
  const map = LOADER.stateMap(12);
  const nat = LOADER.national(12).total;
  const states = {};
  for (const [code, s] of Object.entries(STATES))
    states[code] = { name: s.name, any_coverage: map[code] ?? null, govt_scheme: null, private: null };
  return { states, national: { any_coverage: nat, govt_scheme: null, private: null } };
}

try {
  const raw  = MOCK ? MOCK_DATA : buildRealData();
  const data = buildDataJson(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  const n = Object.keys(raw.states).length;
  console.log(`✓ health-insurance: ${n} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ health-insurance: ${err.message}`);
  process.exit(1);
}
