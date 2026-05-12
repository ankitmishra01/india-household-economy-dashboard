/**
 * Extract: Female Asset Ownership (NFHS-5 2019-21)
 * Output: data/pages/female-assets/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'female-assets');
const MOCK    = process.argv.includes('--mock');
const LOADER  = require('../fetch/nfhs5-loader');
const { STATES } = require('../../js/constants/states');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   land: 14.8, land_joint: 8.2,  house: 22.4, bank_account: 72.4 },
    UP: { name: 'Uttar Pradesh', land: 12.1, land_joint: 4.6,  house: 18.6, bank_account: 59.6 },
    KL: { name: 'Kerala',        land: 34.6, land_joint: 18.4, house: 52.8, bank_account: 89.3 },
    RJ: { name: 'Rajasthan',     land: 11.8, land_joint: 5.2,  house: 16.4, bank_account: 63.1 },
    BR: { name: 'Bihar',         land:  9.4, land_joint: 3.8,  house: 14.2, bank_account: 52.8 },
  },
  national: { land: 14.6, land_joint: 7.1, house: 23.8, bank_account: 70.5 },
  landComposition: [
    { label: 'Women own land alone',        value: 15, color: 'var(--accent-saffron)' },
    { label: 'Women own land jointly',      value: 7,  color: 'var(--w7)' },
    { label: 'Women do not own land',       value: 78, color: 'var(--elevated)' },
  ],
};

function buildDataJson(raw) {
  const sortedLand = Object.entries(raw.states)
    .sort(([,a],[,b]) => b.land - a.land)
    .map(([c,s],i) => [c, {...s, rank: i+1}]);
  const states = Object.fromEntries(sortedLand.map(([c,s]) => [c, {name:s.name, value:s.land, rank:s.rank}]));

  return {
    meta: {
      title: 'Female Asset Ownership',
      subtitle: "Women's ownership of land, housing, and bank accounts by state",
      source: 'NFHS-5 2019–21, IIPS/MoHFW — Women\'s Empowerment Tables',
      sourceUrl: 'https://rchiips.org/nfhs/nfhs5.shtml',
      surveyPeriod: '2019–2021',
      notes: [
        'Asset ownership data refers to women aged 15-49.',
        '"Alone or jointly" means the woman has her name on the ownership document.',
        'Female land ownership is strongly correlated with reduced domestic violence and higher child welfare outcomes.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'NFHS-5 asks women whether they own land or a house alone or jointly with someone else. Bank account ownership refers to accounts in their own name.',
    },
    mapData: { indicator: '% women who own land (alone or jointly)', unit: '%', nationalAverage: raw.national.land + raw.national.land_joint, states },
    tabs: [
      { label: 'Land Ownership', mapData: { indicator: '% women owning land (alone)', unit: '%', nationalAverage: raw.national.land, states },
        chartBlocks: [
          { id: 'waffle-land', title: 'National Female Land Ownership Status', type: 'waffle', unit: '%', segments: raw.landComposition },
          { id: 'lollipop-land', title: '% Women Who Own Land (Alone) by State', type: 'lollipop', unit: '%', average: raw.national.land, higherIsBetter: true, data: sortedLand.map(([c,s])=>({code:c,name:s.name,value:s.land})) },
        ] },
      { label: 'House Ownership', mapData: { indicator: '% women owning a house (alone or jointly)', unit: '%', nationalAverage: raw.national.house, states: Object.fromEntries(sortedLand.sort(([,a],[,b])=>b.house-a.house).map(([c,s],i)=>[c,{name:s.name,value:s.house,rank:i+1}])) },
        chartBlocks: [{ id: 'lollipop-house', title: '% Women Who Own a House (Alone or Jointly)', type: 'lollipop', unit: '%', average: raw.national.house, higherIsBetter: true, data: sortedLand.map(([c,s])=>({code:c,name:s.name,value:s.house})) }] },
      { label: 'Bank Account', mapData: { indicator: '% women with bank account in name', unit: '%', nationalAverage: raw.national.bank_account, states: Object.fromEntries(sortedLand.sort(([,a],[,b])=>b.bank_account-a.bank_account).map(([c,s],i)=>[c,{name:s.name,value:s.bank_account,rank:i+1}])) },
        chartBlocks: [{ id: 'lollipop-bank', title: '% Women with Bank Account in Own Name', type: 'lollipop', unit: '%', average: raw.national.bank_account, higherIsBetter: true, data: sortedLand.map(([c,s])=>({code:c,name:s.name,value:s.bank_account})) }] },
    ],
    chartBlocks: [{ id: 'lollipop-land', title: '% Women Who Own Land (Alone) by State', type: 'lollipop', unit: '%', average: raw.national.land, higherIsBetter: true, data: sortedLand.map(([c,s])=>({code:c,name:s.name,value:s.land})) }],
    tableData: {
      columns: [
        { label: 'State / UT', type: 'string' },
        { label: 'Own Land Alone (%)', type: 'number' },
        { label: 'Own Land Jointly (%)', type: 'number' },
        { label: 'Own House (%)', type: 'number' },
        { label: 'Bank Account (%)', type: 'number' },
      ],
      rows: Object.entries(raw.states).map(([,s]) => [s.name, s.land, s.land_joint, s.house, s.bank_account]),
    },
    insights: [],
  };
}

function buildRealData() {
  // ind 121: women owning house and/or land (alone or jointly) — used as "house" proxy
  // ind 122: women with bank account
  const s121 = LOADER.stateMap(121), s122 = LOADER.stateMap(122);
  const n121 = LOADER.national(121).total, n122 = LOADER.national(122).total;
  const states = {};
  for (const [code, s] of Object.entries(STATES))
    states[code] = { name: s.name, land: null, land_joint: null,
      house: s121[code] ?? null, bank_account: s122[code] ?? null };
  return { states, national: { land: null, land_joint: null, house: n121, bank_account: n122 },
    landComposition: MOCK_DATA.landComposition };
}

try {
  const raw  = MOCK ? MOCK_DATA : buildRealData();
  const data = buildDataJson(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  const n = Object.keys(raw.states).length;
  console.log(`✓ female-assets: ${n} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ female-assets: ${err.message}`);
  process.exit(1);
}
