/**
 * Build global-context.json for each indicator page.
 * Reads data/external/world-bank.json, data/external/imf-weo.json, data/external/who-gho.json
 * and outputs data/pages/{slug}/global-context.json
 *
 * Usage: node scripts/build-global-context.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT      = path.join(__dirname, '..');
const WB_PATH   = path.join(ROOT, 'data', 'external', 'world-bank.json');
const IMF_PATH  = path.join(ROOT, 'data', 'external', 'imf-weo.json');
const WHO_PATH  = path.join(ROOT, 'data', 'external', 'who-gho.json');
const META_PATH = path.join(ROOT, 'data', 'external', 'refresh-metadata.json');

const COUNTRY_NAMES = {
  IND: 'India', CHN: 'China', BGD: 'Bangladesh', PAK: 'Pakistan',
  LKA: 'Sri Lanka', IDN: 'Indonesia', VNM: 'Vietnam', THA: 'Thailand',
  KOR: 'Korea', JPN: 'Japan', USA: 'United States',
};

// Map slug → array of { src, code, title, unit }
// src: 'wb' = World Bank, 'weo' = IMF WEO, 'adb' = ADB, 'who' = WHO GHO
const PAGE_CONTEXT_MAP = {
  'household-consumption': [
    { src: 'wb',  code: 'NY.GDP.PCAP.PP.CD', title: 'GDP per capita, PPP',      unit: 'intl $'  },
    { src: 'weo', code: 'NGDPDPC',           title: 'GDP per capita (nominal)', unit: 'USD'     },
    { src: 'weo', code: 'PCPIPCH',           title: 'Inflation rate',           unit: '%'       },
    { src: 'weo', code: 'NGSD_NGDP',         title: 'Gross national savings',   unit: '% of GDP'},
  ],
  'lfpr': [
    { src: 'wb',  code: 'SL.TLF.CACT.ZS',    title: 'Labour force participation',         unit: '% of 15+' },
    { src: 'wb',  code: 'SL.TLF.CACT.FE.ZS', title: 'Female labour force participation',  unit: '% of female pop. 15+' },
    { src: 'wb',  code: 'SL.UEM.TOTL.ZS',    title: 'Unemployment rate',                  unit: '%'        },
    { src: 'weo', code: 'NGDP_RPCH',          title: 'Real GDP growth',                    unit: '%'        },
  ],
  'unemployment': [
    { src: 'wb',  code: 'SL.UEM.TOTL.ZS',    title: 'Unemployment rate',          unit: '%'        },
    { src: 'wb',  code: 'SL.UEM.TOTL.FE.ZS', title: 'Female unemployment rate',   unit: '% of female labour force' },
    { src: 'wb',  code: 'SL.TLF.CACT.ZS',    title: 'Labour force participation', unit: '% of 15+' },
    { src: 'weo', code: 'NGDP_RPCH',          title: 'Real GDP growth',            unit: '%'        },
  ],
  'gender-wage-gap': [
    { src: 'wb',  code: 'SG.GEN.PARL.ZS',    title: 'Women in parliament',                unit: '% of seats'           },
    { src: 'wb',  code: 'SL.TLF.CACT.FE.ZS', title: 'Female labour force participation',  unit: '% of female pop. 15+' },
    { src: 'adb', code: 'gdi',                title: 'Gender Development Index',           unit: 'index (0–1)'          },
  ],
  'literacy': [
    { src: 'wb',  code: 'SE.ADT.LITR.ZS', title: 'Adult literacy rate',     unit: '%'                },
    { src: 'wb',  code: 'SE.PRM.NENR',    title: 'Primary enrollment rate', unit: '%'                },
    { src: 'wb',  code: 'SE.SEC.NENR',    title: 'Secondary enrollment',    unit: '%'                },
    { src: 'wb',  code: 'IT.NET.USER.ZS', title: 'Internet users',          unit: '% of population'  },
  ],
  'digital-literacy': [
    { src: 'wb',  code: 'IT.NET.USER.ZS',   title: 'Internet users',          unit: '% of population' },
    { src: 'adb', code: 'mobile_broadband', title: 'Mobile broadband subs.',  unit: 'per 100'         },
  ],
  'food-insecurity': [
    { src: 'who', code: 'NUTSTUNTINGPREV',  title: 'Stunting prevalence',      unit: '% under 5'    },
    { src: 'who', code: 'MDG_0000000026',   title: 'Under-5 mortality rate',   unit: 'per 1,000'    },
    { src: 'wb',  code: 'SH.STA.WAST.ZS',  title: 'Wasting prevalence',       unit: '% under 5'    },
  ],
  'health-insurance': [
    { src: 'wb',  code: 'SH.XPD.CHEX.GD.ZS',  title: 'Health expenditure',         unit: '% of GDP'     },
    { src: 'who', code: 'UHC_INDEX_REPORTED',  title: 'UHC Service Coverage Index', unit: 'index (0–100)'},
    { src: 'who', code: 'WHS4_100',            title: 'Maternal mortality ratio',   unit: 'per 100,000'  },
    { src: 'wb',  code: 'SP.DYN.IMRT.IN',      title: 'Infant mortality rate',      unit: 'per 1,000'    },
  ],
  'oop-expenditure': [
    { src: 'wb',  code: 'SH.XPD.CHEX.GD.ZS',  title: 'Health expenditure',         unit: '% of GDP'     },
    { src: 'who', code: 'UHC_INDEX_REPORTED',  title: 'UHC Service Coverage Index', unit: 'index (0–100)'},
    { src: 'who', code: 'WHS4_100',            title: 'Maternal mortality ratio',   unit: 'per 100,000'  },
  ],
  'catastrophic-spending': [
    { src: 'wb',  code: 'SH.XPD.CHEX.GD.ZS',  title: 'Health expenditure',    unit: '% of GDP' },
    { src: 'wb',  code: 'SI.POV.GINI',         title: 'Gini Index',            unit: 'index'    },
    { src: 'who', code: 'UHC_INDEX_REPORTED',  title: 'UHC Service Coverage',  unit: 'index (0–100)'},
  ],
  'mpi': [
    { src: 'wb',  code: 'SI.POV.DDAY',         title: 'Poverty < $2.15/day',       unit: '% of population' },
    { src: 'adb', code: 'poverty_national',     title: 'Poverty (national line)',   unit: '% of population' },
    { src: 'wb',  code: 'SI.POV.GINI',         title: 'Gini Index',                unit: 'index'           },
    { src: 'who', code: 'WHOSIS_000001',        title: 'Life expectancy at birth',  unit: 'years'           },
  ],
  'banking-access': [
    { src: 'wb',  code: 'FX.OWN.TOTL.ZS',  title: 'Financial account ownership', unit: '% of 15+' },
    { src: 'wb',  code: 'IT.NET.USER.ZS',   title: 'Internet users',              unit: '%'        },
  ],
  'mobile-money': [
    { src: 'wb',  code: 'FX.OWN.TOTL.ZS',     title: 'Financial account ownership', unit: '% of 15+' },
    { src: 'adb', code: 'mobile_broadband',    title: 'Mobile broadband subs.',      unit: 'per 100'  },
  ],
  'housing-utilities': [
    { src: 'wb',  code: 'SH.H2O.BASW.ZS',     title: 'Basic drinking water access', unit: '% of population' },
    { src: 'wb',  code: 'SH.STA.BASS.ZS',      title: 'Basic sanitation access',     unit: '% of population' },
    { src: 'adb', code: 'electricity_access',  title: 'Access to electricity',       unit: '% of population' },
    { src: 'wb',  code: 'SP.URB.TOTL.IN.ZS',  title: 'Urban population share',      unit: '%'               },
  ],
  'female-assets': [
    { src: 'wb',  code: 'SG.GEN.PARL.ZS',     title: 'Women in parliament',         unit: '% of seats'  },
    { src: 'adb', code: 'gdi',                 title: 'Gender Development Index',    unit: 'index (0–1)' },
  ],
  'ipv-economic-cost': [
    { src: 'wb',  code: 'SG.GEN.PARL.ZS',     title: 'Women in parliament',         unit: '% of seats'  },
    { src: 'adb', code: 'gdi',                 title: 'Gender Development Index',    unit: 'index (0–1)' },
    { src: 'wb',  code: 'SE.ADT.LITR.ZS',     title: 'Adult literacy rate',         unit: '%'           },
  ],
  'unpaid-care': [
    { src: 'adb', code: 'gdi',                 title: 'Gender Development Index',    unit: 'index (0–1)'          },
    { src: 'wb',  code: 'SL.TLF.CACT.FE.ZS',  title: 'Female labour force participation', unit: '% of female pop. 15+' },
    { src: 'wb',  code: 'SP.DYN.TFRT.IN',     title: 'Fertility rate',              unit: 'births/woman'         },
  ],
  'age-dependency': [
    { src: 'wb',  code: 'SP.POP.GROW',         title: 'Population growth',           unit: '% annual'     },
    { src: 'wb',  code: 'SP.URB.TOTL.IN.ZS',  title: 'Urban population share',      unit: '%'            },
    { src: 'wb',  code: 'SP.DYN.TFRT.IN',     title: 'Fertility rate',              unit: 'births/woman' },
  ],
  'education-expenditure': [
    { src: 'wb',  code: 'SE.ADT.LITR.ZS',     title: 'Adult literacy rate',         unit: '%'    },
    { src: 'wb',  code: 'SE.PRM.NENR',         title: 'Primary enrollment rate',     unit: '%'    },
    { src: 'wb',  code: 'SE.SEC.NENR',         title: 'Secondary enrollment',        unit: '%'    },
    { src: 'weo', code: 'NGDPDPC',             title: 'GDP per capita (nominal)',     unit: 'USD'  },
  ],
  'formal-employment': [
    { src: 'wb',  code: 'SL.TLF.CACT.ZS',     title: 'Labour force participation',  unit: '% of 15+' },
    { src: 'wb',  code: 'SL.EMP.SELF.ZS',      title: 'Self-employed workers',       unit: '% of employment' },
    { src: 'wb',  code: 'SL.UEM.TOTL.ZS',      title: 'Unemployment rate',           unit: '%'               },
  ],
  'neet-youth': [
    { src: 'wb',  code: 'SL.UEM.TOTL.ZS',     title: 'Unemployment rate',           unit: '%'                },
    { src: 'wb',  code: 'SE.SEC.NENR',         title: 'Secondary enrollment',        unit: '%'                },
    { src: 'wb',  code: 'SE.ADT.LITR.ZS',     title: 'Adult literacy rate',         unit: '%'                },
  ],
  'wealth-quintiles': [
    { src: 'wb',  code: 'SI.POV.GINI',         title: 'Gini Index',             unit: 'index'           },
    { src: 'wb',  code: 'SI.POV.DDAY',         title: 'Poverty < $2.15/day',    unit: '% of population' },
    { src: 'wb',  code: 'NY.GDP.PCAP.PP.CD',   title: 'GDP per capita, PPP',    unit: 'intl $'          },
  ],
};

function buildPageContext(slug, wb, imf, who, dataUpdatedAt) {
  const mappings = PAGE_CONTEXT_MAP[slug];
  if (!mappings) return null;

  const charts = [];
  for (const m of mappings) {
    const ind = m.src === 'wb'  ? wb.indicators?.[m.code]
              : m.src === 'weo' ? imf.weo?.[m.code]
              : m.src === 'adb' ? imf.adb?.[m.code]
              : m.src === 'who' ? who?.indicators?.[m.code]
              : null;

    if (!ind) continue;

    const countries = Object.entries(ind.data || {})
      .map(([cCode, v]) => ({
        code:  cCode,
        name:  COUNTRY_NAMES[cCode],
        value: v?.value ?? v,
        year:  v?.year,
      }))
      .filter(d => d.name && d.value != null);

    if (!countries.length) continue;

    const src = m.src === 'wb'  ? (wb.meta?.source  || 'World Bank Open Data')
              : m.src === 'weo' ? 'IMF World Economic Outlook April 2025'
              : m.src === 'adb' ? 'ADB Key Indicators for Asia and the Pacific 2024'
              :                    'WHO Global Health Observatory';

    charts.push({ title: m.title, unit: m.unit, source: src, countries });
  }

  if (!charts.length) return null;
  return {
    meta: {
      note: 'International comparison using World Bank, IMF, ADB, and WHO data. Most recent available year shown.',
      dataUpdatedAt: dataUpdatedAt || null,
    },
    charts,
  };
}

function main() {
  if (!fs.existsSync(WB_PATH)) {
    console.error('World Bank data not found. Run: node scripts/fetch/fetch-world-bank.js');
    process.exit(1);
  }
  if (!fs.existsSync(IMF_PATH)) {
    console.error('IMF/ADB data not found. Run: node scripts/fetch/fetch-imf.js');
    process.exit(1);
  }

  const wb  = JSON.parse(fs.readFileSync(WB_PATH, 'utf8'));
  const imf = JSON.parse(fs.readFileSync(IMF_PATH, 'utf8'));
  const who = fs.existsSync(WHO_PATH) ? JSON.parse(fs.readFileSync(WHO_PATH, 'utf8')) : null;
  if (!who) console.warn('  ⚠ WHO data not found — health indicators will use fallbacks');

  // Determine the earliest fetch timestamp from refresh-metadata
  let dataUpdatedAt = null;
  if (fs.existsSync(META_PATH)) {
    const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
    const timestamps = Object.values(meta)
      .map(m => m.fetchedAt)
      .filter(Boolean)
      .sort();
    if (timestamps.length) dataUpdatedAt = timestamps[timestamps.length - 1]; // most recent
  }

  let built = 0;
  for (const slug of Object.keys(PAGE_CONTEXT_MAP)) {
    const ctx = buildPageContext(slug, wb, imf, who, dataUpdatedAt);
    if (!ctx) { console.warn(`  ⚠ No context built for ${slug}`); continue; }

    const dir = path.join(ROOT, 'data', 'pages', slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'global-context.json'), JSON.stringify(ctx, null, 2), 'utf8');
    console.log(`  ✓ ${slug}: ${ctx.charts.length} comparison chart(s)`);
    built++;
  }
  console.log(`\nBuilt global context for ${built}/${Object.keys(PAGE_CONTEXT_MAP).length} pages.`);
}

main();
