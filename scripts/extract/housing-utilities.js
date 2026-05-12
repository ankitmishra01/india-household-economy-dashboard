/**
 * Extract: Housing & Basic Utilities (Census 2011 + NFHS-5 2019-21)
 * Output: data/pages/housing-utilities/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'housing-utilities');
const MOCK    = process.argv.includes('--mock');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   ownership: 78.2, electricity: 89.3, water: 67.1, sanitation: 71.4, electricity_rural: 72.1, electricity_urban: 98.2 },
    UP: { name: 'Uttar Pradesh', ownership: 92.1, electricity: 85.9, water: 45.2, sanitation: 48.7, electricity_rural: 81.3, electricity_urban: 97.8 },
    KL: { name: 'Kerala',        ownership: 95.5, electricity: 99.4, water: 88.9, sanitation: 98.6, electricity_rural: 99.1, electricity_urban: 99.8 },
    RJ: { name: 'Rajasthan',     ownership: 91.4, electricity: 83.7, water: 59.4, sanitation: 56.2, electricity_rural: 79.2, electricity_urban: 96.3 },
    BR: { name: 'Bihar',         ownership: 93.8, electricity: 73.2, water: 38.7, sanitation: 36.1, electricity_rural: 68.4, electricity_urban: 97.1 },
  },
  national: { ownership: 86.6, electricity: 88.6, water: 58.6, sanitation: 63.4 },
};

function buildTab(raw, field, label, unit, national, notes) {
  const sorted = Object.entries(raw.states)
    .sort(([, a], [, b]) => b[field] - a[field])
    .map(([code, s], i) => [code, { name: s.name, value: s[field], rank: i + 1 }]);

  return {
    label,
    mapData: {
      indicator: label,
      unit,
      nationalAverage: national,
      states: Object.fromEntries(sorted),
    },
    chartBlocks: [{
      id: `lollipop-${field}`,
      title: `${label} by State`,
      type: 'lollipop',
      unit,
      average: national,
      higherIsBetter: true,
      data: sorted.map(([code, s]) => ({ code, name: s.name, value: s.value })),
    }],
  };
}

function buildDataJson(raw) {
  const electricityTab = buildTab(raw, 'electricity', '% households with electricity', '%', raw.national.electricity);
  const waterTab       = buildTab(raw, 'water',       '% households with improved drinking water', '%', raw.national.water);
  const sanitationTab  = buildTab(raw, 'sanitation',  '% households with improved sanitation', '%', raw.national.sanitation);
  const ownershipTab   = buildTab(raw, 'ownership',   '% households that own their home', '%', raw.national.ownership);

  // Grouped lollipop: urban vs rural electricity
  const groupedElec = {
    id: 'grouped-electricity',
    title: 'Electricity Access: Urban vs Rural Gap by State',
    type: 'grouped-lollipop',
    unit: '%',
    labelA: 'Rural',
    labelB: 'Urban',
    colorA: 'var(--chart-stem)',
    colorB: 'var(--accent-saffron)',
    seriesA: Object.entries(raw.states).map(([code, s]) => ({ code, name: s.name, value: s.electricity_rural })),
    seriesB: Object.entries(raw.states).map(([code, s]) => ({ code, name: s.name, value: s.electricity_urban })),
  };

  return {
    meta: {
      title: 'Housing & Basic Utilities',
      subtitle: 'Homeownership, electricity, drinking water, and sanitation access by state',
      source: 'Census 2011 Housing Tables, Registrar General of India; NFHS-5 2019–21, IIPS/MoHFW',
      sourceUrl: 'https://censusindia.gov.in; https://rchiips.org/nfhs/nfhs5.shtml',
      surveyPeriod: 'Census: 2011; NFHS-5: 2019–2021',
      notes: [
        'Homeownership data is from Census 2011 and may not reflect post-2011 changes.',
        'Electricity, water, and sanitation figures are from NFHS-5 (2019-21) and are more recent.',
        'Improved drinking water includes piped, borehole, protected dug well, rainwater, and packaged water.',
        'Improved sanitation includes flush toilets and pit latrines with slabs.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'NFHS-5 uses USAID DHS methodology. Census homeownership asks the household respondent whether they own or rent the dwelling.',
    },
    mapData: electricityTab.mapData,
    tabs: [electricityTab, waterTab, sanitationTab, ownershipTab],
    chartBlocks: [electricityTab.chartBlocks[0], groupedElec],
    tableData: {
      columns: [
        { label: 'State / UT',        type: 'string' },
        { label: 'Owns Home (%)',      type: 'number' },
        { label: 'Electricity (%)',    type: 'number' },
        { label: 'Clean Water (%)',    type: 'number' },
        { label: 'Sanitation (%)',     type: 'number' },
      ],
      rows: Object.entries(raw.states).map(([, s]) => [s.name, s.ownership, s.electricity, s.water, s.sanitation]),
    },
    insights: [],
  };
}

try {
  const data = buildDataJson(MOCK_DATA);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ housing-utilities: ${Object.keys(MOCK_DATA.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ housing-utilities: ${err.message}`);
  process.exit(1);
}
