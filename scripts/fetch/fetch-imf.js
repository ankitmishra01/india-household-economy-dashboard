/**
 * IMF World Economic Outlook (WEO) + ADB Key Indicators — hardcoded from published reports.
 *
 * Sources:
 *   IMF WEO April 2025 (https://www.imf.org/en/Publications/WEO/weo-database/2025/April)
 *   ADB Key Indicators for Asia and the Pacific 2024 (https://data.adb.org/dataset/key-indicators-asia-and-pacific)
 *
 * Values for India and key Asian peer countries.
 * Output: data/external/imf-weo.json
 *
 * Usage: node scripts/fetch/fetch-imf.js
 */

const fs   = require('fs');
const path = require('path');

const OUT_PATH = path.join(__dirname, '..', '..', 'data', 'external', 'imf-weo.json');

// IMF WEO April 2025 — selected indicators for India and comparators
// Format: { countryCode: { value, year } }
const WEO_DATA = {
  // GDP, current prices (USD billions)
  NGDPD: {
    label: 'GDP, current prices', unit: 'USD billions',
    data: {
      IND: { value: 4187.0, year: 2025 }, CHN: { value: 18919.0, year: 2025 },
      BGD: { value: 479.8,  year: 2025 }, PAK: { value: 372.0,  year: 2025 },
      LKA: { value: 88.7,   year: 2025 }, IDN: { value: 1562.0, year: 2025 },
      VNM: { value: 509.0,  year: 2025 }, THA: { value: 573.0,  year: 2025 },
      KOR: { value: 1798.0, year: 2025 }, JPN: { value: 4186.0, year: 2025 },
      USA: { value: 30507.0,year: 2025 },
    }
  },
  // GDP per capita, current prices (USD)
  NGDPDPC: {
    label: 'GDP per capita, current prices', unit: 'USD',
    data: {
      IND: { value: 2756,  year: 2025 }, CHN: { value: 13439, year: 2025 },
      BGD: { value: 2731,  year: 2025 }, PAK: { value: 1524,  year: 2025 },
      LKA: { value: 4072,  year: 2025 }, IDN: { value: 5490,  year: 2025 },
      VNM: { value: 4987,  year: 2025 }, THA: { value: 8130,  year: 2025 },
      KOR: { value: 34538, year: 2025 }, JPN: { value: 34017, year: 2025 },
      USA: { value: 89662, year: 2025 },
    }
  },
  // GDP per capita, PPP (current international $)
  NGDPDPCPPP: {
    label: 'GDP per capita, PPP', unit: 'current international $',
    data: {
      IND: { value: 11160, year: 2024 }, CHN: { value: 24272, year: 2024 },
      BGD: { value: 9037,  year: 2024 }, PAK: { value: 6820,  year: 2024 },
      LKA: { value: 15040, year: 2024 }, IDN: { value: 16880, year: 2024 },
      VNM: { value: 17200, year: 2024 }, THA: { value: 23120, year: 2024 },
      KOR: { value: 52710, year: 2024 }, JPN: { value: 49280, year: 2024 },
      USA: { value: 87030, year: 2024 },
    }
  },
  // Real GDP growth (%)
  NGDP_RPCH: {
    label: 'Real GDP growth', unit: '% annual change',
    data: {
      IND: { value: 6.5,  year: 2025 }, CHN: { value: 4.6,  year: 2025 },
      BGD: { value: 4.9,  year: 2025 }, PAK: { value: 3.2,  year: 2025 },
      LKA: { value: 4.4,  year: 2025 }, IDN: { value: 5.0,  year: 2025 },
      VNM: { value: 6.2,  year: 2025 }, THA: { value: 2.9,  year: 2025 },
      KOR: { value: 1.8,  year: 2025 }, JPN: { value: 0.8,  year: 2025 },
      USA: { value: 1.8,  year: 2025 },
    }
  },
  // Inflation, avg consumer prices (%)
  PCPIPCH: {
    label: 'Inflation, avg consumer prices', unit: '% annual change',
    data: {
      IND: { value: 4.4,  year: 2025 }, CHN: { value: 0.2,  year: 2025 },
      BGD: { value: 7.8,  year: 2025 }, PAK: { value: 7.5,  year: 2025 },
      LKA: { value: 4.5,  year: 2025 }, IDN: { value: 2.6,  year: 2025 },
      VNM: { value: 3.8,  year: 2025 }, THA: { value: 0.9,  year: 2025 },
      KOR: { value: 1.8,  year: 2025 }, JPN: { value: 2.4,  year: 2025 },
      USA: { value: 2.9,  year: 2025 },
    }
  },
  // Current account balance (% of GDP)
  BCA_NGDPD: {
    label: 'Current account balance', unit: '% of GDP',
    data: {
      IND: { value: -1.0, year: 2025 }, CHN: { value: 2.0,  year: 2025 },
      BGD: { value: -0.4, year: 2025 }, PAK: { value: -0.4, year: 2025 },
      LKA: { value: -2.0, year: 2025 }, IDN: { value: -0.5, year: 2025 },
      VNM: { value: 4.2,  year: 2025 }, THA: { value: 3.6,  year: 2025 },
      KOR: { value: 4.1,  year: 2025 }, JPN: { value: 3.8,  year: 2025 },
      USA: { value: -3.5, year: 2025 },
    }
  },
  // General government gross debt (% of GDP)
  GGXWDG_NGDP: {
    label: 'Government gross debt', unit: '% of GDP',
    data: {
      IND: { value: 83.5, year: 2025 }, CHN: { value: 92.4, year: 2025 },
      BGD: { value: 40.2, year: 2025 }, PAK: { value: 78.5, year: 2025 },
      LKA: { value: 99.5, year: 2025 }, IDN: { value: 41.2, year: 2025 },
      VNM: { value: 37.0, year: 2025 }, THA: { value: 64.8, year: 2025 },
      KOR: { value: 54.1, year: 2025 }, JPN: { value: 249.7,year: 2025 },
      USA: { value: 122.3,year: 2025 },
    }
  },
  // Gross national savings (% of GDP)
  NGSD_NGDP: {
    label: 'Gross national savings', unit: '% of GDP',
    data: {
      IND: { value: 33.5, year: 2025 }, CHN: { value: 46.7, year: 2025 },
      BGD: { value: 32.0, year: 2025 }, PAK: { value: 17.0, year: 2025 },
      LKA: { value: 26.0, year: 2025 }, IDN: { value: 35.8, year: 2025 },
      VNM: { value: 38.5, year: 2025 }, THA: { value: 32.5, year: 2025 },
      KOR: { value: 35.2, year: 2025 }, JPN: { value: 28.5, year: 2025 },
      USA: { value: 18.5, year: 2025 },
    }
  },
};

// ADB Key Indicators for Asia and the Pacific 2024
// Source: https://data.adb.org/dataset/key-indicators-asia-and-pacific
const ADB_DATA = {
  // Poverty headcount ratio at national poverty line (%)
  poverty_national: {
    label: 'Poverty headcount (national poverty line)', unit: '% of population',
    data: {
      IND: { value: 16.4, year: 2023 }, CHN: { value: 0.6,  year: 2020 },
      BGD: { value: 18.7, year: 2022 }, PAK: { value: 34.2, year: 2019 },
      LKA: { value: 5.3,  year: 2023 }, IDN: { value: 9.1,  year: 2023 },
      VNM: { value: 3.3,  year: 2022 }, THA: { value: 6.0,  year: 2022 },
      KOR: { value: 14.4, year: 2022 }, JPN: { value: 15.7, year: 2021 },
    }
  },
  // Access to electricity (% of population)
  electricity_access: {
    label: 'Access to electricity', unit: '% of population',
    data: {
      IND: { value: 99.6, year: 2023 }, CHN: { value: 100.0, year: 2023 },
      BGD: { value: 99.5, year: 2023 }, PAK: { value: 97.6,  year: 2023 },
      LKA: { value: 99.9, year: 2023 }, IDN: { value: 99.7,  year: 2023 },
      VNM: { value: 99.9, year: 2023 }, THA: { value: 99.9,  year: 2023 },
      KOR: { value: 100.0,year: 2023 }, JPN: { value: 100.0, year: 2023 },
    }
  },
  // Under-5 mortality rate (per 1,000 live births)
  under5_mortality: {
    label: 'Under-5 mortality rate', unit: 'per 1,000 live births',
    data: {
      IND: { value: 31.0, year: 2023 }, CHN: { value: 7.4,   year: 2023 },
      BGD: { value: 29.8, year: 2023 }, PAK: { value: 58.9,  year: 2023 },
      LKA: { value: 7.4,  year: 2023 }, IDN: { value: 21.9,  year: 2023 },
      VNM: { value: 20.7, year: 2023 }, THA: { value: 8.2,   year: 2023 },
      KOR: { value: 3.0,  year: 2023 }, JPN: { value: 2.1,   year: 2023 },
    }
  },
  // Maternal mortality ratio (per 100,000 live births)
  maternal_mortality: {
    label: 'Maternal mortality ratio', unit: 'per 100,000 live births',
    data: {
      IND: { value: 103,  year: 2020 }, CHN: { value: 23,   year: 2020 },
      BGD: { value: 123,  year: 2020 }, PAK: { value: 154,  year: 2020 },
      LKA: { value: 29,   year: 2020 }, IDN: { value: 173,  year: 2020 },
      VNM: { value: 124,  year: 2020 }, THA: { value: 29,   year: 2020 },
      KOR: { value: 8,    year: 2020 }, JPN: { value: 4,    year: 2020 },
    }
  },
  // Internet subscribers per 100 population (mobile broadband)
  mobile_broadband: {
    label: 'Mobile broadband subscriptions', unit: 'per 100 population',
    data: {
      IND: { value: 66.8, year: 2023 }, CHN: { value: 106.6, year: 2023 },
      BGD: { value: 44.0, year: 2023 }, PAK: { value: 40.2,  year: 2023 },
      LKA: { value: 66.4, year: 2023 }, IDN: { value: 85.6,  year: 2023 },
      VNM: { value: 82.4, year: 2023 }, THA: { value: 106.8, year: 2023 },
      KOR: { value: 151.0,year: 2023 }, JPN: { value: 157.2, year: 2023 },
    }
  },
  // CO2 emissions (metric tons per capita)
  co2_per_capita: {
    label: 'CO₂ emissions', unit: 'metric tons per capita',
    data: {
      IND: { value: 1.9,  year: 2022 }, CHN: { value: 7.9,  year: 2022 },
      BGD: { value: 0.8,  year: 2022 }, PAK: { value: 0.9,  year: 2022 },
      LKA: { value: 0.9,  year: 2022 }, IDN: { value: 2.3,  year: 2022 },
      VNM: { value: 3.6,  year: 2022 }, THA: { value: 4.0,  year: 2022 },
      KOR: { value: 11.5, year: 2022 }, JPN: { value: 8.3,  year: 2022 },
      USA: { value: 14.9, year: 2022 },
    }
  },
  // Gender Development Index (UNDP HDR 2023)
  gdi: {
    label: 'Gender Development Index', unit: 'index (0–1)',
    data: {
      IND: { value: 0.849, year: 2022 }, CHN: { value: 0.969, year: 2022 },
      BGD: { value: 0.909, year: 2022 }, PAK: { value: 0.749, year: 2022 },
      LKA: { value: 0.956, year: 2022 }, IDN: { value: 0.925, year: 2022 },
      VNM: { value: 0.972, year: 2022 }, THA: { value: 0.986, year: 2022 },
      KOR: { value: 0.936, year: 2022 }, JPN: { value: 0.992, year: 2022 },
      USA: { value: 0.995, year: 2022 },
    }
  },
};

// Combined countries list
const COUNTRIES = {
  IND: 'India',
  CHN: 'China',
  BGD: 'Bangladesh',
  PAK: 'Pakistan',
  LKA: 'Sri Lanka',
  IDN: 'Indonesia',
  VNM: 'Vietnam',
  THA: 'Thailand',
  KOR: 'Korea, Rep.',
  JPN: 'Japan',
  USA: 'United States',
};

function buildResult() {
  const result = {
    meta: {
      source: 'IMF World Economic Outlook April 2025 + ADB Key Indicators 2024 + UNDP HDR 2023',
      sourceUrls: [
        'https://www.imf.org/en/Publications/WEO/weo-database/2025/April',
        'https://data.adb.org/dataset/key-indicators-asia-and-pacific',
        'https://hdr.undp.org/data-center/documentation-and-downloads',
      ],
      generatedAt: new Date().toISOString(),
      note: 'Values are from latest published editions. Forecasts (marked year>=2025) are IMF projections.',
    },
    countries: COUNTRIES,
    weo: WEO_DATA,
    adb: ADB_DATA,
    indiaContext: {},
  };

  // Build flat India summary
  for (const [key, ind] of Object.entries({ ...WEO_DATA, ...ADB_DATA })) {
    const val = ind.data?.['IND'];
    if (val) {
      result.indiaContext[key] = {
        label: ind.label,
        unit: ind.unit,
        value: val.value,
        year: val.year,
      };
    }
  }

  return result;
}

const result = buildResult();
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2), 'utf8');

console.log(`✓ IMF WEO + ADB data saved to ${path.relative(process.cwd(), OUT_PATH)}`);
console.log(`  WEO indicators: ${Object.keys(result.weo).length}`);
console.log(`  ADB indicators: ${Object.keys(result.adb).length}`);
console.log(`  India context entries: ${Object.keys(result.indiaContext).length}`);
