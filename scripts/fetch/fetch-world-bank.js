/**
 * Fetch India indicators from World Bank Open Data API.
 * No API key required. Country code = IND.
 *
 * Indicators fetched:
 *   NY.GDP.PCAP.PP.CD  — GDP per capita, PPP (current international $)
 *   NY.GDP.PCAP.KD.ZG  — GDP per capita growth (annual %)
 *   SI.POV.DDAY        — Poverty headcount ratio at $2.15/day (% of population)
 *   SI.POV.GINI        — Gini index
 *   SL.UEM.TOTL.ZS     — Unemployment, total (% of total labour force)
 *   SL.TLF.CACT.ZS     — Labour force participation rate, total (% of total population 15+)
 *   SE.ADT.LITR.ZS     — Literacy rate, adult total (% of people 15+)
 *   SH.STA.STNT.ZS     — Prevalence of stunting (% of children under 5)
 *   SH.STA.WAST.ZS     — Prevalence of wasting (% of children under 5)
 *   SP.DYN.IMRT.IN     — Infant mortality rate (per 1,000 live births)
 *   SP.DYN_LE00.IN     — Life expectancy at birth, total (years)
 *   SH.XPD.CHEX.GD.ZS  — Current health expenditure (% of GDP)
 *   IT.NET.USER.ZS     — Individuals using the internet (% of population)
 *   FX.OWN.TOTL.ZS     — Account ownership at a financial institution (% of 15+)
 *   AG.LND.AGRI.ZS     — Agricultural land (% of land area)
 *   EN.ATM.CO2E.PC     — CO2 emissions (metric tons per capita)
 *   SP.POP.TOTL        — Population, total
 *   SP.URB.TOTL.IN.ZS  — Urban population (% of total population)
 *   SP.POP.GROW        — Population growth (annual %)
 *   SG.GEN.PARL.ZS     — Proportion of seats held by women in national parliaments (%)
 *   SP.DYN.TFRT.IN     — Fertility rate, total (births per woman)
 *
 * Output: data/external/world-bank.json
 *
 * Usage: node scripts/fetch/fetch-world-bank.js
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

const OUT_PATH  = path.join(__dirname, '..', '..', 'data', 'external', 'world-bank.json');
const META_PATH = path.join(__dirname, '..', '..', 'data', 'external', 'refresh-metadata.json');

const INDICATORS = {
  'NY.GDP.PCAP.PP.CD':  { label: 'GDP per capita, PPP', unit: 'current international $' },
  'NY.GDP.PCAP.KD.ZG':  { label: 'GDP per capita growth', unit: '% annual' },
  'SI.POV.DDAY':        { label: 'Poverty headcount (< $2.15/day)', unit: '% of population' },
  'SI.POV.GINI':        { label: 'Gini Index', unit: 'index (0–100)' },
  'SL.UEM.TOTL.ZS':     { label: 'Unemployment rate', unit: '% of labour force' },
  'SL.TLF.CACT.ZS':     { label: 'Labour force participation rate', unit: '% of population 15+' },
  'SE.ADT.LITR.ZS':     { label: 'Adult literacy rate', unit: '% of people 15+' },
  'SH.STA.STNT.ZS':     { label: 'Stunting prevalence', unit: '% of children under 5' },
  'SH.STA.WAST.ZS':     { label: 'Wasting prevalence', unit: '% of children under 5' },
  'SP.DYN.IMRT.IN':     { label: 'Infant mortality rate', unit: 'per 1,000 live births' },
  'SP.DYN.LE00.IN':     { label: 'Life expectancy at birth', unit: 'years' },
  'SH.XPD.CHEX.GD.ZS':  { label: 'Health expenditure', unit: '% of GDP' },
  'IT.NET.USER.ZS':     { label: 'Internet users', unit: '% of population' },
  'FX.OWN.TOTL.ZS':     { label: 'Financial account ownership', unit: '% of 15+' },
  'EN.ATM.CO2E.KT':     { label: 'CO₂ emissions', unit: 'kilotonnes' },
  'SP.POP.TOTL':        { label: 'Population', unit: 'people' },
  'SP.URB.TOTL.IN.ZS':  { label: 'Urban population share', unit: '% of total' },
  'SP.POP.GROW':        { label: 'Population growth', unit: '% annual' },
  'SG.GEN.PARL.ZS':     { label: 'Women in parliament', unit: '% of seats' },
  'SP.DYN.TFRT.IN':     { label: 'Fertility rate', unit: 'births per woman' },
  'SL.EMP.SELF.ZS':     { label: 'Self-employed workers', unit: '% of total employment' },
  'SL.UEM.TOTL.FE.ZS':  { label: 'Female unemployment rate', unit: '% of female labour force' },
  'SL.TLF.CACT.FE.ZS':  { label: 'Female labour force participation', unit: '% of female pop. 15+' },
  'SE.PRM.NENR':        { label: 'Net enrollment rate, primary', unit: '%' },
  'SE.SEC.NENR':        { label: 'Net enrollment rate, secondary', unit: '%' },
  'SH.H2O.BASW.ZS':     { label: 'Basic drinking water access', unit: '% of population' },
  'SH.STA.BASS.ZS':     { label: 'Basic sanitation access', unit: '% of population' },
  'SH.IMM.MEAS':        { label: 'Immunization, measles', unit: '% children 12–23 months' },
  'EG.FEC.RNEW.ZS':     { label: 'Renewable energy consumption', unit: '% of total final energy' },
  'SP.DYN.LE00.FE.IN':  { label: 'Life expectancy, female', unit: 'years' },
};

// Asian peers for comparison context + OECD aggregate benchmark
const COMPARISON_COUNTRIES = {
  IND: 'India',
  CHN: 'China',
  BGD: 'Bangladesh',
  PAK: 'Pakistan',
  LKA: 'Sri Lanka',
  NPL: 'Nepal',
  IDN: 'Indonesia',
  PHL: 'Philippines',
  VNM: 'Vietnam',
  THA: 'Thailand',
  KOR: 'Korea, Rep.',
  JPN: 'Japan',
  USA: 'United States',
  OED: 'OECD Average',
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'india-dashboard/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error for ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

async function fetchIndicator(indicatorCode, countryCodes) {
  const countries = countryCodes.join(';');
  // Per-page=50 ensures we get all countries in one request, mrv=5 gets last 5 years
  const url = `https://api.worldbank.org/v2/country/${countries}/indicator/${indicatorCode}?format=json&mrv=5&per_page=500`;
  try {
    const response = await fetchJson(url);
    if (!Array.isArray(response) || response.length < 2) {
      console.warn(`  ⚠ No data for ${indicatorCode}`);
      return {};
    }
    const records = response[1] || [];
    // Build: { countryCode: { year: value } }
    const byCountry = {};
    for (const rec of records) {
      if (!rec.value && rec.value !== 0) continue;
      const code = rec.countryiso3code;
      if (!byCountry[code]) byCountry[code] = {};
      byCountry[code][rec.date] = rec.value;
    }
    // For each country, pick the most recent non-null value within last 5 years
    const latest = {};
    for (const [code, years] of Object.entries(byCountry)) {
      const sortedYears = Object.keys(years).sort((a, b) => b - a);
      if (sortedYears.length) {
        const yr = sortedYears[0];
        latest[code] = { value: years[yr], year: parseInt(yr) };
      }
    }
    return latest;
  } catch (err) {
    console.warn(`  ⚠ Error fetching ${indicatorCode}: ${err.message}`);
    return {};
  }
}

async function main() {
  console.log('Fetching World Bank indicators for India + comparison countries...');
  const countryCodes = Object.keys(COMPARISON_COUNTRIES);

  const result = {
    meta: {
      source: 'World Bank Open Data',
      sourceUrl: 'https://data.worldbank.org',
      fetchedAt: new Date().toISOString(),
      note: 'Most recent available value within last 5 years. Values may differ from dashboard page data which uses India-specific sources.',
    },
    countries: COMPARISON_COUNTRIES,
    indicators: {},
  };

  for (const [code, meta] of Object.entries(INDICATORS)) {
    process.stdout.write(`  Fetching ${code} (${meta.label})... `);
    const data = await fetchIndicator(code, countryCodes);
    result.indicators[code] = {
      ...meta,
      data,
    };
    // Count non-null IND values
    const indVal = data['IND'];
    if (indVal) {
      console.log(`India=${indVal.value?.toFixed(1)} (${indVal.year})`);
    } else {
      console.log('no India data');
    }
    // Small delay to be polite to the API
    await new Promise(r => setTimeout(r, 300));
  }

  // Build India context summary for easy access
  result.indiaContext = {};
  for (const [code, meta] of Object.entries(INDICATORS)) {
    const indVal = result.indicators[code]?.data?.['IND'];
    if (indVal) {
      result.indiaContext[code] = {
        label: meta.label,
        unit: meta.unit,
        value: indVal.value,
        year: indVal.year,
      };
    }
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\n✓ World Bank data saved to ${path.relative(process.cwd(), OUT_PATH)}`);
  console.log(`  India context: ${Object.keys(result.indiaContext).length} indicators`);

  // Update shared refresh metadata
  const existing = fs.existsSync(META_PATH) ? JSON.parse(fs.readFileSync(META_PATH, 'utf8')) : {};
  existing['world-bank'] = {
    fetchedAt: result.meta.fetchedAt,
    indicatorCount: Object.keys(result.indicators).length,
  };
  fs.writeFileSync(META_PATH, JSON.stringify(existing, null, 2), 'utf8');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
