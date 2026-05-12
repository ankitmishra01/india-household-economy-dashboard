/**
 * Shared NFHS-5 data loader.
 * Reads data/source/nfhs-5/nfhs5_states.csv and builds a lookup:
 *   DATA[stateCode][indicatorNumber] = { total, rural, urban }
 *
 * Also exports NATIONAL[indicatorNumber] = { total, rural, urban }
 *
 * Indicator numbers match the NFHS-5 factsheet numbering (7, 8, 12, 14, ...).
 */
const fs   = require('fs');
const path = require('path');

const CSV = path.join(__dirname, '..', '..', 'data', 'source', 'nfhs-5', 'nfhs5_states.csv');

// NFHS-5 state name → our 2-letter code
const NFHS5_NAME_MAP = {
  'andaman & nicobar islands':                      'AN',
  'andhra pradesh':                                 'AP',
  'arunachal pradesh':                              'AR',
  'assam':                                          'AS',
  'bihar':                                          'BR',
  'chandigarh':                                     'CH',
  'chhattisgarh':                                   'CG',
  'dadra & nagar haveli and daman & diu':           'DN', // merged UT; assign to DN, DD gets null
  'goa':                                            'GA',
  'gujarat':                                        'GJ',
  'haryana':                                        'HR',
  'himachal pradesh':                               'HP',
  'jammu & kashmir':                                'JK',
  'jharkhand':                                      'JH',
  'karnataka':                                      'KA',
  'kerala':                                         'KL',
  'ladakh':                                         'LA',
  'lakshadweep':                                    'LD',
  'madhya pradesh':                                 'MP',
  'maharashtra':                                    'MH',
  'manipur':                                        'MN',
  'meghalaya':                                      'ML',
  'mizoram':                                        'MZ',
  'nagaland':                                       'NL',
  'nct delhi':                                      'DL',
  'odisha':                                         'OD',
  'puducherry':                                     'PY',
  'punjab':                                         'PB',
  'rajasthan':                                      'RJ',
  'sikkim':                                         'SK',
  'tamil nadu':                                     'TN',
  'telangana':                                      'TS',
  'tripura':                                        'TR',
  'uttar pradesh':                                  'UP',
  'uttarakhand':                                    'UK',
  'west bengal':                                    'WB',
};

function parseNum(v) {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// Extract leading indicator number: "7. Population..." → 7
function indNum(indicator) {
  const m = indicator.match(/^(\d+)\./);
  return m ? parseInt(m[1], 10) : null;
}

let _cache = null;

function load() {
  if (_cache) return _cache;

  if (!fs.existsSync(CSV)) {
    throw new Error(
      `NFHS-5 CSV not found at ${CSV}\nRun: node scripts/fetch/fetch-nfhs5.js`
    );
  }

  const lines  = fs.readFileSync(CSV, 'utf8').split('\n');
  const DATA   = {};   // stateCode → indicatorNum → { total, rural, urban }
  const NATIONAL = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Robust CSV split: handle commas inside quoted fields
    const cols = parseCsvLine(line);
    if (cols.length < 6) continue;

    const stateName  = cols[0].trim();
    const indicator  = cols[2].trim();
    const urban      = parseNum(cols[3]);
    const rural      = parseNum(cols[4]);
    const total      = parseNum(cols[5]);
    const num        = indNum(indicator);
    if (!num) continue;

    const entry = { total, rural, urban };

    if (stateName.toLowerCase() === 'india') {
      NATIONAL[num] = entry;
      continue;
    }

    const code = NFHS5_NAME_MAP[stateName.toLowerCase()];
    if (!code) continue; // skip header repeat or unknown

    if (!DATA[code]) DATA[code] = {};
    DATA[code][num] = entry;

    // D&D gets same values as the merged UT (DN)
    if (code === 'DN') {
      if (!DATA['DD']) DATA['DD'] = {};
      DATA['DD'][num] = entry;
    }
  }

  _cache = { DATA, NATIONAL };
  return _cache;
}

// Minimal CSV line parser (handles double-quoted fields with commas)
function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQ  = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === ',' && !inQ) { result.push(cur); cur = ''; continue; }
    cur += c;
  }
  result.push(cur);
  return result;
}

/**
 * Get a single indicator value for a specific state.
 * Returns { total, rural, urban } or null if not available.
 */
function get(stateCode, indicatorNum) {
  const { DATA } = load();
  return DATA[stateCode]?.[indicatorNum] ?? null;
}

/**
 * Get national average for an indicator.
 */
function national(indicatorNum) {
  const { NATIONAL } = load();
  return NATIONAL[indicatorNum] ?? null;
}

/**
 * Build a stateCode → value map for a given indicator.
 * valueField: 'total' | 'rural' | 'urban'  (default: 'total')
 */
function stateMap(indicatorNum, valueField = 'total') {
  const { DATA } = load();
  const result = {};
  for (const [code, inds] of Object.entries(DATA)) {
    const entry = inds[indicatorNum];
    result[code] = entry ? (entry[valueField] ?? null) : null;
  }
  return result;
}

module.exports = { load, get, national, stateMap };
