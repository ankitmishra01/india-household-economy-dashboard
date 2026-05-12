/**
 * Extract: Unemployment Rate (PLFS 2022-23)
 * Source: NSO/MoSPI — PLFS Annual Report 2022-23
 * Output: data/pages/unemployment/data.json
 */
const fs   = require('fs');
const path = require('path');
const ROOT    = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'pages', 'unemployment');
const MOCK    = process.argv.includes('--mock');

const MOCK_DATA = {
  states: {
    MH: { name: 'Maharashtra',   overall: 3.4, rural: 2.1, urban: 4.8, male: 3.2, female: 4.1 },
    UP: { name: 'Uttar Pradesh', overall: 4.7, rural: 3.8, urban: 6.2, male: 4.4, female: 5.8 },
    KL: { name: 'Kerala',        overall: 7.1, rural: 5.9, urban: 8.6, male: 5.8, female: 10.2 },
    RJ: { name: 'Rajasthan',     overall: 2.8, rural: 2.1, urban: 4.2, male: 2.5, female: 3.9 },
    BR: { name: 'Bihar',         overall: 5.6, rural: 4.9, urban: 7.8, male: 5.3, female: 7.2 },
  },
  national: { overall: 4.1, rural: 3.3, urban: 5.6, male: 3.8, female: 5.4 },
};

function buildDataJson(raw) {
  const sorted = Object.entries(raw.states)
    .sort(([,a],[,b]) => b.overall - a.overall)
    .map(([c,s],i) => [c, {...s, rank: i+1}]);

  const states = Object.fromEntries(sorted.map(([c,s]) => [c, {name:s.name, value:s.overall, rank:s.rank}]));

  return {
    meta: {
      title: 'Unemployment Rate',
      subtitle: 'Usual status unemployment rate by state, 2022–23',
      source: 'PLFS 2022–23, NSO/MoSPI — Annual Report',
      sourceUrl: 'https://mospi.gov.in/plfs-report',
      surveyPeriod: 'July 2022 – June 2023',
      notes: [
        'Unemployment Rate (UR) measured on Usual Principal + Subsidiary Status (UPSS) basis.',
        'UPSS UR = those unemployed but seeking/available for work / total labour force.',
        'Kerala shows higher UR due to high labour force participation and job-seeking educated workforce — not necessarily worse welfare outcomes.',
        MOCK ? '⚠ Mock data (5 states).' : null,
      ].filter(Boolean),
      methodology: 'PLFS UPSS includes all persons who worked for major time (principal) or for subsidiary time during reference year. Unemployment = available and seeking work.',
    },
    mapData: { indicator: 'Unemployment Rate (UPSS) %', unit: '%', nationalAverage: raw.national.overall, states },
    tabs: [
      { label: 'Overall',
        mapData: { indicator: 'Overall UR (%)', unit: '%', nationalAverage: raw.national.overall, states },
        chartBlocks: [{ id: 'lollipop-ur-overall', title: 'Overall Unemployment Rate by State', type: 'lollipop', unit: '%', average: raw.national.overall, higherIsBetter: false, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.overall})) }] },
      { label: 'Rural',
        mapData: { indicator: 'Rural UR (%)', unit: '%', nationalAverage: raw.national.rural, states: Object.fromEntries(sorted.sort(([,a],[,b])=>b.rural-a.rural).map(([c,s],i)=>[c,{name:s.name,value:s.rural,rank:i+1}])) },
        chartBlocks: [{ id: 'lollipop-ur-rural', title: 'Rural Unemployment Rate by State', type: 'lollipop', unit: '%', average: raw.national.rural, higherIsBetter: false, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.rural})) }] },
      { label: 'Urban',
        mapData: { indicator: 'Urban UR (%)', unit: '%', nationalAverage: raw.national.urban, states: Object.fromEntries(sorted.sort(([,a],[,b])=>b.urban-a.urban).map(([c,s],i)=>[c,{name:s.name,value:s.urban,rank:i+1}])) },
        chartBlocks: [{ id: 'lollipop-ur-urban', title: 'Urban Unemployment Rate by State', type: 'lollipop', unit: '%', average: raw.national.urban, higherIsBetter: false, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.urban})) }] },
    ],
    chartBlocks: [{ id: 'lollipop-ur-overall', title: 'Unemployment Rate by State', type: 'lollipop', unit: '%', average: raw.national.overall, higherIsBetter: false, data: sorted.map(([c,s])=>({code:c,name:s.name,value:s.overall})) }],
    tableData: {
      columns: [
        { label: 'Rank', type: 'number' },
        { label: 'State / UT', type: 'string' },
        { label: 'Overall UR (%)', type: 'number' },
        { label: 'Rural UR (%)', type: 'number' },
        { label: 'Urban UR (%)', type: 'number' },
        { label: 'Male UR (%)', type: 'number' },
        { label: 'Female UR (%)', type: 'number' },
      ],
      rows: sorted.map(([,s]) => [s.rank, s.name, s.overall, s.rural, s.urban, s.male, s.female]),
    },
    insights: [],
  };
}

try {
  const data = buildDataJson(MOCK_DATA);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2));
  console.log(`✓ unemployment: ${Object.keys(MOCK_DATA.states).length} states${MOCK ? ' (MOCK)' : ''}`);
} catch (err) {
  console.error(`✗ unemployment: ${err.message}`);
  process.exit(1);
}
