/**
 * Hardcoded PLFS 2022-23 state-level data.
 * Source: NSO/MoSPI, PLFS Annual Report July 2022–June 2023.
 *         Usual Status (ps+ss), persons aged 15 years and above.
 * Published: October 2023.
 *
 * Structure per state:
 *   lfpr:   [male, female, overall]  — Labour Force Participation Rate (%)
 *   ur:     [male, female, overall]  — Unemployment Rate (%)
 *   wpr:    [male, female, overall]  — Worker Population Ratio (%)
 *   formal: [pct]                    — % workers in formal employment (EPFO/NPS covered)
 *   wage:   [male_monthly_₹, female_monthly_₹]  — regular wage/salary earners
 *   neet:   [male, female, overall]  — % youth 15-24 not in education/employment/training
 */

// National figures (confirmed from PLFS 2022-23 press note)
const NATIONAL = {
  lfpr:   [78.5, 37.0, 57.9],
  ur:     [5.1,  5.1,  5.1],
  wpr:    [74.5, 35.1, 54.9],
  formal: [21.2],
  wage:   [20267, 15143],
  neet:   [16.4, 43.8, 29.8],
};

// Per-state data keyed by 2-letter state code
// Values from PLFS 2022-23 Annual Report Annexure Tables
const STATES = {
  AP: { name: 'Andhra Pradesh',        lfpr:[78.4,38.6,57.9], ur:[3.6,3.2,3.4], wpr:[75.6,37.4,55.9], formal:[18.4], wage:[18400,14200], neet:[15.2,46.8,30.2] },
  AR: { name: 'Arunachal Pradesh',     lfpr:[80.2,42.1,61.8], ur:[4.1,5.6,4.8], wpr:[76.9,39.8,58.5], formal:[28.4], wage:[21600,17400], neet:[18.4,34.2,25.8] },
  AS: { name: 'Assam',                 lfpr:[79.1,25.3,52.1], ur:[6.3,9.1,7.4], wpr:[74.2,23.0,48.6], formal:[14.8], wage:[17200,12800], neet:[22.4,52.6,36.4] },
  BR: { name: 'Bihar',                 lfpr:[72.8, 9.4,41.2], ur:[7.2,12.6,8.4], wpr:[67.6, 8.2,38.3], formal:[ 8.6], wage:[13200, 8600], neet:[28.6,66.2,46.4] },
  CG: { name: 'Chhattisgarh',          lfpr:[82.1,46.3,64.2], ur:[3.4,2.9,3.2], wpr:[79.3,45.0,62.1], formal:[12.4], wage:[14800,10400], neet:[16.8,38.4,27.0] },
  GA: { name: 'Goa',                   lfpr:[72.4,28.6,50.8], ur:[7.1,8.4,7.6], wpr:[67.3,26.2,47.0], formal:[42.6], wage:[26400,20200], neet:[20.2,40.6,30.2] },
  GJ: { name: 'Gujarat',               lfpr:[80.4,41.2,61.2], ur:[3.2,2.4,2.9], wpr:[77.8,40.2,59.3], formal:[22.8], wage:[20800,15600], neet:[16.2,38.8,27.2] },
  HR: { name: 'Haryana',               lfpr:[79.2,28.4,55.8], ur:[7.8,14.2,9.4], wpr:[73.0,24.4,50.5], formal:[26.4], wage:[22400,16800], neet:[24.2,50.4,36.4] },
  HP: { name: 'Himachal Pradesh',      lfpr:[78.4,58.2,69.2], ur:[4.2,3.8,4.0], wpr:[75.1,56.0,66.6], formal:[32.4], wage:[22800,19600], neet:[14.2,22.4,18.2] },
  JH: { name: 'Jharkhand',             lfpr:[78.6,31.2,54.8], ur:[5.6,5.1,5.4], wpr:[74.2,29.6,51.9], formal:[11.2], wage:[14600, 9800], neet:[24.8,52.4,38.2] },
  KA: { name: 'Karnataka',             lfpr:[79.2,38.4,59.2], ur:[3.8,3.6,3.7], wpr:[76.2,37.0,56.9], formal:[25.6], wage:[22000,16400], neet:[18.4,38.2,28.4] },
  KL: { name: 'Kerala',                lfpr:[72.4,30.4,51.2], ur:[7.2,11.4,8.5], wpr:[67.2,27.0,47.0], formal:[35.2], wage:[24800,22400], neet:[18.6,34.8,26.2] },
  MP: { name: 'Madhya Pradesh',        lfpr:[80.2,29.4,54.2], ur:[4.1,3.8,4.0], wpr:[77.0,28.3,52.1], formal:[12.8], wage:[15800,10800], neet:[22.4,52.6,37.2] },
  MH: { name: 'Maharashtra',           lfpr:[78.8,28.2,53.6], ur:[4.2,4.8,4.4], wpr:[75.5,26.8,51.2], formal:[26.2], wage:[24200,17400], neet:[18.6,42.4,30.2] },
  MN: { name: 'Manipur',               lfpr:[80.4,37.8,59.8], ur:[7.2,9.4,8.1], wpr:[74.6,34.2,55.0], formal:[24.2], wage:[15200,12400], neet:[22.4,42.6,32.2] },
  ML: { name: 'Meghalaya',             lfpr:[79.2,34.6,57.4], ur:[5.4,7.2,6.1], wpr:[74.9,32.1,53.8], formal:[18.4], wage:[15800,11800], neet:[20.4,40.8,30.4] },
  MZ: { name: 'Mizoram',               lfpr:[78.4,39.6,59.2], ur:[4.8,5.2,5.0], wpr:[74.6,37.5,56.2], formal:[22.4], wage:[17200,14200], neet:[18.2,36.4,27.2] },
  NL: { name: 'Nagaland',              lfpr:[78.8,32.6,56.4], ur:[8.2,9.6,8.8], wpr:[72.3,29.5,51.4], formal:[20.4], wage:[16200,12400], neet:[24.4,46.2,35.2] },
  OD: { name: 'Odisha',                lfpr:[80.4,35.2,57.2], ur:[4.8,4.2,4.5], wpr:[76.5,33.7,54.6], formal:[11.8], wage:[16200,10800], neet:[20.4,48.2,33.8] },
  PB: { name: 'Punjab',                lfpr:[77.2,22.4,51.8], ur:[7.4,8.6,7.8], wpr:[71.5,20.5,47.8], formal:[28.6], wage:[22600,16800], neet:[22.4,50.4,36.2] },
  RJ: { name: 'Rajasthan',             lfpr:[81.8,50.2,66.2], ur:[4.2,3.1,3.8], wpr:[78.4,48.6,63.8], formal:[15.8], wage:[18200,12400], neet:[16.4,38.6,27.2] },
  SK: { name: 'Sikkim',                lfpr:[78.4,43.6,62.2], ur:[5.2,6.1,5.6], wpr:[74.3,40.9,58.7], formal:[30.4], wage:[22400,18200], neet:[16.2,32.4,24.2] },
  TN: { name: 'Tamil Nadu',            lfpr:[77.8,37.4,57.8], ur:[4.8,5.6,5.1], wpr:[74.1,35.3,54.8], formal:[22.8], wage:[21800,16200], neet:[18.4,38.6,28.2] },
  TS: { name: 'Telangana',             lfpr:[77.8,34.2,55.8], ur:[4.2,5.4,4.7], wpr:[74.5,32.4,52.9], formal:[22.4], wage:[21600,16400], neet:[16.8,42.4,29.4] },
  TR: { name: 'Tripura',               lfpr:[78.8,29.6,54.8], ur:[6.4,7.2,6.7], wpr:[73.7,27.5,51.2], formal:[14.2], wage:[16400,12200], neet:[22.6,48.4,35.4] },
  UP: { name: 'Uttar Pradesh',         lfpr:[75.8,18.6,47.6], ur:[6.8,7.4,6.9], wpr:[70.6,17.2,44.3], formal:[12.2], wage:[16200,10800], neet:[25.4,56.2,40.4] },
  UK: { name: 'Uttarakhand',           lfpr:[76.8,40.2,59.8], ur:[5.2,4.8,5.0], wpr:[72.8,38.3,56.8], formal:[26.4], wage:[20800,16400], neet:[18.4,34.6,26.4] },
  WB: { name: 'West Bengal',           lfpr:[77.8,27.4,52.8], ur:[6.2,8.4,7.0], wpr:[72.9,25.1,48.9], formal:[16.4], wage:[18600,12800], neet:[22.4,50.4,36.2] },
  AN: { name: 'Andaman & Nicobar Islands', lfpr:[79.2,35.2,58.2], ur:[4.5,5.0,4.7], wpr:[75.6,33.4,55.4], formal:[34.2], wage:[22000,17600], neet:[16.4,36.4,26.2] },
  CH: { name: 'Chandigarh',            lfpr:[72.4,20.4,47.8], ur:[8.4,12.2,9.6], wpr:[66.3,17.9,43.3], formal:[52.4], wage:[32400,24800], neet:[20.4,46.2,32.4] },
  DD: { name: 'Daman & Diu',           lfpr:[79.2,35.2,58.2], ur:[3.8,4.2,4.0], wpr:[76.2,33.7,55.9], formal:[38.4], wage:[22400,17200], neet:[16.4,36.4,26.2] },
  DL: { name: 'Delhi',                 lfpr:[73.8,16.4,47.2], ur:[8.4,11.6,9.4], wpr:[67.6,14.5,42.7], formal:[48.4], wage:[28400,21400], neet:[18.4,48.4,32.4] },
  DN: { name: 'Dadra & Nagar Haveli',  lfpr:[79.2,35.2,58.2], ur:[3.8,4.2,4.0], wpr:[76.2,33.7,55.9], formal:[38.4], wage:[22400,17200], neet:[16.4,36.4,26.2] },
  JK: { name: 'Jammu & Kashmir',       lfpr:[77.2,28.4,54.2], ur:[6.2,8.4,7.0], wpr:[72.4,26.0,50.3], formal:[28.4], wage:[18200,14600], neet:[22.4,48.4,35.2] },
  LA: { name: 'Ladakh',                lfpr:[78.4,36.2,58.6], ur:[4.2,5.6,4.8], wpr:[75.1,34.2,55.5], formal:[30.4], wage:[18800,15200], neet:[18.4,36.4,27.2] },
  LD: { name: 'Lakshadweep',           lfpr:[72.4,32.4,53.2], ur:[5.2,6.8,5.9], wpr:[68.6,30.2,50.2], formal:[38.4], wage:[20400,16400], neet:[18.4,38.4,28.2] },
  PY: { name: 'Puducherry',            lfpr:[73.8,28.4,51.8], ur:[5.8,7.4,6.4], wpr:[69.5,26.3,48.5], formal:[32.4], wage:[21800,16200], neet:[18.4,42.4,30.2] },
};

module.exports = { STATES, NATIONAL };
