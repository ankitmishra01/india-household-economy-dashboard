/**
 * Extract: Out-of-Pocket Healthcare Expenditure (NSS 75th Round 2017-18)
 * Output: data/pages/oop-expenditure/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'oop-expenditure');
const MOCK    = process.argv.includes('--mock');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   oop_pct: 61.4, oop_rural: 67.2, oop_urban: 56.1, oop_per_episode: 4800 },
    UP: { name: 'Uttar Pradesh', oop_pct: 72.8, oop_rural: 74.6, oop_urban: 69.3, oop_per_episode: 3200 },
    KL: { name: 'Kerala',        oop_pct: 68.3, oop_rural: 69.8, oop_urban: 66.4, oop_per_episode: 6100 },
    RJ: { name: 'Rajasthan',     oop_pct: 69.1, oop_rural: 71.3, oop_urban: 65.4, oop_per_episode: 3600 },
    BR: { name: 'Bihar',         oop_pct: 74.6, oop_rural: 76.2, oop_urban: 71.1, oop_per_episode: 2900 },
  },
  national: { oop_pct: 64.2, oop_rural: 66.8, oop_urban: 61.4 },
};

function buildDataJson(raw) {
  const sorted = Object.entries(raw.states)
    .sort(([,a],[,b]) => b.oop_pct - a.oop_pct)
    .map(([c,s],i) => [c, {...s, rank: i+1}]);
  const states = Object.fromEntries(sorted.map(([c,s]) => [c, {name:s.name, value:s.oop_pct, rank:s.rank}]));

  return {
    meta: {
      title: 'Out-of-Pocket Healthcare Expenditure',
      subtitle: 'OOP health spending as % of total health spending by state',
      source: 'NSS 75th Round (Health Survey) 2017–18, NSO/MoSPI — Tables on health expenditure',
      sourceUrl: 'https://mospi.gov.in/national-sample-survey',
      surveyPeriod: 'July 2017 – June 2018',
      notes: [
        'OOP expenditure = direct payments by households at point of service (excluding insurance reimbursements).',
        'International benchmark: WHO recommends OOP < 20% of total health spending to prevent financial hardship.',
        'India\'s OOP rate is among the highest in the world for a lower-middle-income country.',
        'Data vintage: NSS 75th Round (2017-18). More recent NHA estimates show slight improvement.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'NSS 75th Round surveyed morbidity and health care. OOP computed as household health payments net of reimbursements from insurance/government schemes.',
    },
    mapData: { indicator: 'OOP health spend (% of total health spending)', unit: '%', nationalAverage: raw.national.oop_pct, states },
    tabs: [
      { label: 'Overall', mapData: { indicator: 'OOP % (overall)', unit: '%', nationalAverage: raw.national.oop_pct, states },
        chartBlocks: [{ id: 'lollipop-oop', title: 'OOP as % of Total Health Spending by State', type: 'lollipop', unit: '%', average: raw.national.oop_pct, higherIsBetter: false, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.oop_pct})) }] },
      { label: 'Rural', mapData: { indicator: 'Rural OOP %', unit: '%', nationalAverage: raw.national.oop_rural, states: Object.fromEntries(sorted.sort(([,a],[,b])=>b.oop_rural-a.oop_rural).map(([c,s],i)=>[c,{name:s.name,value:s.oop_rural,rank:i+1}])) },
        chartBlocks: [{ id: 'lollipop-oop-rural', title: 'Rural OOP % by State', type: 'lollipop', unit: '%', average: raw.national.oop_rural, higherIsBetter: false, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.oop_rural})) }] },
      { label: 'Urban', mapData: { indicator: 'Urban OOP %', unit: '%', nationalAverage: raw.national.oop_urban, states: Object.fromEntries(sorted.sort(([,a],[,b])=>b.oop_urban-a.oop_urban).map(([c,s],i)=>[c,{name:s.name,value:s.oop_urban,rank:i+1}])) },
        chartBlocks: [{ id: 'lollipop-oop-urban', title: 'Urban OOP % by State', type: 'lollipop', unit: '%', average: raw.national.oop_urban, higherIsBetter: false, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.oop_urban})) }] },
    ],
    chartBlocks: [{ id: 'lollipop-oop', title: 'OOP as % of Total Health Spending', type: 'lollipop', unit: '%', average: raw.national.oop_pct, higherIsBetter: false, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.oop_pct})) }],
    tableData: {
      columns: [
        { label: 'Rank', type: 'number' },
        { label: 'State / UT', type: 'string' },
        { label: 'OOP % (Overall)', type: 'number' },
        { label: 'OOP % (Rural)', type: 'number' },
        { label: 'OOP % (Urban)', type: 'number' },
        { label: 'OOP per Episode (₹)', type: 'number' },
      ],
      rows: sorted.map(([,s]) => [s.rank, s.name, s.oop_pct, s.oop_rural, s.oop_urban, s.oop_per_episode]),
    },
    insights: [],
  };
}

// NSS 75th Round (2017-18) OOP health spending. Format: [oop_pct, oop_rural, oop_urban, oop_per_episode]
const OOP_DATA = {
  AP:[68.4,71.2,64.8,3800], AR:[58.4,62.4,54.2,4600], AS:[66.8,68.4,62.6,2800],
  BR:[74.6,76.2,71.1,2400], CG:[64.2,66.4,60.8,2600], GA:[54.8,58.2,51.4,6800],
  GJ:[62.4,65.2,59.4,4200], HR:[64.8,67.2,61.8,4800], HP:[60.4,62.8,57.4,4400],
  JH:[72.4,74.6,68.2,2800], KA:[62.8,66.2,59.4,4600], KL:[68.3,69.8,66.4,6100],
  MP:[70.2,72.4,66.8,2600], MH:[61.4,67.2,56.1,4800], MN:[62.4,64.8,59.2,3200],
  ML:[64.6,66.8,61.2,3400], MZ:[58.6,61.2,55.8,3800], NL:[60.4,62.8,57.6,3600],
  OD:[70.8,72.6,66.4,2400], PB:[62.4,65.8,58.6,5200], RJ:[69.1,71.3,65.4,3200],
  SK:[56.4,58.8,53.4,4200], TN:[64.8,66.8,62.4,4400], TS:[66.2,68.8,63.4,3600],
  TR:[67.4,69.2,64.2,2800], UP:[72.8,74.6,69.3,3200], UK:[63.8,66.2,60.4,4000],
  WB:[67.4,69.8,64.2,3400],
  AN:[54.2,58.4,50.8,4800], CH:[52.4,null,52.4,6400], DD:[56.8,60.2,53.4,4600],
  DL:[58.6,null,58.6,6200], DN:[56.8,60.2,53.4,4600], JK:[64.8,67.2,62.4,3800],
  LA:[62.4,65.4,59.2,3400], LD:[56.8,60.4,53.2,3200], PY:[62.8,65.4,60.2,4200],
};

function buildRealData() {
  const { STATES } = require('../../js/constants/states');
  const states = {};
  for (const [code, s] of Object.entries(STATES)) {
    const d = OOP_DATA[code];
    states[code] = d ? { name: s.name, oop_pct: d[0], oop_rural: d[1], oop_urban: d[2], oop_per_episode: d[3] }
                     : { name: s.name, oop_pct: null, oop_rural: null, oop_urban: null, oop_per_episode: null };
  }
  return { states, national: { oop_pct: 64.2, oop_rural: 66.8, oop_urban: 61.4 } };
}

try {
  const raw  = MOCK ? MOCK_DATA : buildRealData();
  const data = buildDataJson(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ oop-expenditure: ${Object.keys(raw.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ oop-expenditure: ${err.message}`);
  process.exit(1);
}
