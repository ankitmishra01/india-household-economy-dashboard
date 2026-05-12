// Canonical mapping for all 36 Indian states and Union Territories.
// geoName: the exact value of the `name` property in india-states.geojson
// Note: Ladakh is merged with J&K in the GeoJSON (pre-2019 boundary data).
// Note: D&NH and D&D are separate entries in the GeoJSON (pre-2020 merger).

const STATES = {
  AP: { name: "Andhra Pradesh",                    geoName: "Andhra Pradesh" },
  AR: { name: "Arunachal Pradesh",                 geoName: "Arunachal Pradesh" },
  AS: { name: "Assam",                             geoName: "Assam" },
  BR: { name: "Bihar",                             geoName: "Bihar" },
  CG: { name: "Chhattisgarh",                      geoName: "Chhattisgarh" },
  GA: { name: "Goa",                               geoName: "Goa" },
  GJ: { name: "Gujarat",                           geoName: "Gujarat" },
  HR: { name: "Haryana",                           geoName: "Haryana" },
  HP: { name: "Himachal Pradesh",                  geoName: "Himachal Pradesh" },
  JH: { name: "Jharkhand",                         geoName: "Jharkhand" },
  KA: { name: "Karnataka",                         geoName: "Karnataka" },
  KL: { name: "Kerala",                            geoName: "Kerala" },
  MP: { name: "Madhya Pradesh",                    geoName: "Madhya Pradesh" },
  MH: { name: "Maharashtra",                       geoName: "Maharashtra" },
  MN: { name: "Manipur",                           geoName: "Manipur" },
  ML: { name: "Meghalaya",                         geoName: "Meghalaya" },
  MZ: { name: "Mizoram",                           geoName: "Mizoram" },
  NL: { name: "Nagaland",                          geoName: "Nagaland" },
  OD: { name: "Odisha",                            geoName: "Odisha" },
  PB: { name: "Punjab",                            geoName: "Punjab" },
  RJ: { name: "Rajasthan",                         geoName: "Rajasthan" },
  SK: { name: "Sikkim",                            geoName: "Sikkim" },
  TN: { name: "Tamil Nadu",                        geoName: "Tamil Nadu" },
  TS: { name: "Telangana",                         geoName: "Telangana" },
  TR: { name: "Tripura",                           geoName: "Tripura" },
  UP: { name: "Uttar Pradesh",                     geoName: "Uttar Pradesh" },
  UK: { name: "Uttarakhand",                       geoName: "Uttarakhand" },
  WB: { name: "West Bengal",                       geoName: "West Bengal" },
  // Union Territories
  AN: { name: "Andaman & Nicobar Islands",         geoName: "Andaman and Nicobar Islands" },
  CH: { name: "Chandigarh",                        geoName: "Chandigarh" },
  DN: { name: "Dadra & Nagar Haveli",              geoName: "Dadra and Nagar Haveli" },
  DD: { name: "Daman & Diu",                       geoName: "Daman and Diu" },
  DL: { name: "Delhi",                             geoName: "Delhi" },
  JK: { name: "Jammu & Kashmir",                   geoName: "Jammu and Kashmir" },
  LA: { name: "Ladakh",                            geoName: "Jammu and Kashmir" }, // merged with J&K in GeoJSON
  LD: { name: "Lakshadweep",                       geoName: "Lakshadweep" },
  PY: { name: "Puducherry",                        geoName: "Puducherry" },
};

// Build reverse lookup: normalized GeoJSON name → state code(s)
// Used by choropleth.js to join data.json state codes to GeoJSON features.
const GEO_NAME_TO_CODE = {};
for (const [code, state] of Object.entries(STATES)) {
  const key = state.geoName.toLowerCase().trim();
  if (!GEO_NAME_TO_CODE[key]) GEO_NAME_TO_CODE[key] = code;
}

// For environments that support ES modules
if (typeof module !== "undefined") {
  module.exports = { STATES, GEO_NAME_TO_CODE };
}
