/**
 * Fetch India health indicators from WHO Global Health Observatory (GHO) API.
 * Free, no authentication required.
 * API docs: https://www.who.int/data/gho/info/gho-odata-api
 *
 * Indicators fetched:
 *   WHOSIS_000001   — Life expectancy at birth (total)
 *   WHS4_100        — Maternal mortality ratio (per 100,000 live births)
 *   MDG_0000000026  — Under-5 mortality rate (per 1,000 live births)
 *   UHC_INDEX_REPORTED — UHC Service Coverage Index (0–100)
 *   NUTRITION_HA_2  — Stunting prevalence (% children under 5)
 *   WHS9_86         — DTP3 immunization coverage (% children)
 *   NCD_BMI_30C     — Obesity prevalence in adults (%)
 *
 * Output: data/external/who-gho.json
 *
 * Usage: node scripts/fetch/fetch-who.js
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const OUT_PATH  = path.join(__dirname, '..', '..', 'data', 'external', 'who-gho.json');
const META_PATH = path.join(__dirname, '..', '..', 'data', 'external', 'refresh-metadata.json');

const COUNTRIES = ['IND','CHN','BGD','PAK','LKA','IDN','VNM','THA','KOR','JPN','USA'];

const COUNTRY_NAMES = {
  IND: 'India', CHN: 'China', BGD: 'Bangladesh', PAK: 'Pakistan',
  LKA: 'Sri Lanka', IDN: 'Indonesia', VNM: 'Vietnam', THA: 'Thailand',
  KOR: 'Korea', JPN: 'Japan', USA: 'United States',
};

// dim1: sex dimension filter — 'SEX_BTSX' = both sexes. null = indicator has no sex split.
// Note: GHO uses 'SEX_BTSX'/'SEX_MLE'/'SEX_FMLE'; not bare 'BTSX'.
const INDICATORS = {
  'WHOSIS_000001':    { label: 'Life expectancy at birth',     unit: 'years',                   dim1: 'SEX_BTSX' },
  'WHS4_100':         { label: 'Maternal mortality ratio',     unit: 'per 100,000 live births', dim1: null       },
  'MDG_0000000026':   { label: 'Under-5 mortality rate',       unit: 'per 1,000 live births',   dim1: null       },
  'UHC_INDEX_REPORTED': { label: 'UHC Service Coverage Index', unit: 'index (0–100)',           dim1: null       },
  'NUTSTUNTINGPREV':  { label: 'Stunting prevalence',          unit: '% of children under 5',  dim1: null       },
  'WHS8_110':         { label: 'DTP3 immunization coverage',   unit: '% of children',           dim1: null       },
  'NCD_BMI_30C':      { label: 'Obesity prevalence (adults)',  unit: '% of adults',             dim1: 'SEX_BTSX' },
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'india-dashboard/1.0' } }, res => {
      // Follow one redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        return https.get(res.headers.location, { headers: { 'User-Agent': 'india-dashboard/1.0' } }, res2 => {
          let data = '';
          res2.on('data', c => { data += c; });
          res2.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch (e) { reject(new Error(`JSON parse error on redirect: ${e.message}`)); }
          });
        }).on('error', reject);
      }
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error for ${url.slice(0, 80)}: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(new Error('Request timed out')); });
  });
}

async function fetchIndicator(code, meta) {
  // Build OData $filter — country list + optional sex dimension
  const countryList  = COUNTRIES.map(c => `'${c}'`).join(',');
  let filter = `SpatialDim in (${countryList})`;
  if (meta.dim1) filter += ` and Dim1 eq '${meta.dim1}'`;

  const url = `https://ghoapi.azureedge.net/api/${code}?$filter=${encodeURIComponent(filter)}&$select=SpatialDim,TimeDim,NumericValue&$orderby=TimeDim desc`;

  try {
    const resp = await fetchJson(url);
    const records = resp?.value || [];

    // Pick most recent non-null year per country
    const byCountry = {};
    for (const rec of records) {
      const c = rec.SpatialDim;
      if (!c || !COUNTRY_NAMES[c]) continue;
      if (rec.NumericValue == null) continue;
      if (!byCountry[c] || rec.TimeDim > byCountry[c].year) {
        byCountry[c] = { value: parseFloat(rec.NumericValue.toFixed(2)), year: rec.TimeDim };
      }
    }
    return byCountry;
  } catch (err) {
    console.warn(`  ⚠ Error fetching ${code}: ${err.message}`);
    return {};
  }
}

async function main() {
  console.log('Fetching WHO Global Health Observatory data...');

  const result = {
    meta: {
      source: 'WHO Global Health Observatory',
      sourceUrl: 'https://www.who.int/data/gho',
      fetchedAt: new Date().toISOString(),
      note: 'Most recent available year per country. Sex-disaggregated indicators filtered to both-sexes (BTSX).',
    },
    countries: COUNTRY_NAMES,
    indicators: {},
    indiaContext: {},
  };

  for (const [code, meta] of Object.entries(INDICATORS)) {
    process.stdout.write(`  ${code} (${meta.label})... `);
    const data = await fetchIndicator(code, meta);
    result.indicators[code] = { ...meta, data };

    const ind = data['IND'];
    if (ind) {
      console.log(`India=${ind.value} (${ind.year})`);
      result.indiaContext[code] = {
        label: meta.label,
        unit:  meta.unit,
        value: ind.value,
        year:  ind.year,
      };
    } else {
      console.log('no India data');
    }
    await new Promise(r => setTimeout(r, 300));
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\n✓ WHO GHO data saved to ${path.relative(process.cwd(), OUT_PATH)}`);
  console.log(`  India context: ${Object.keys(result.indiaContext).length} indicators`);

  // Update shared refresh metadata
  const existing = fs.existsSync(META_PATH) ? JSON.parse(fs.readFileSync(META_PATH, 'utf8')) : {};
  existing['who-gho'] = {
    fetchedAt: result.meta.fetchedAt,
    indicatorCount: Object.keys(result.indicators).length,
  };
  fs.writeFileSync(META_PATH, JSON.stringify(existing, null, 2), 'utf8');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
