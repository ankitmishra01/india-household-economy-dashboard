/**
 * Number and value formatting utilities.
 * Available globally as window.FMT after this script loads.
 */
const FMT = (function () {
  function currency(v, decimals = 0) {
    if (v == null || isNaN(v)) return '—';
    if (v >= 1e7) return '₹' + (v / 1e7).toFixed(1) + ' Cr';
    if (v >= 1e5) return '₹' + (v / 1e5).toFixed(1) + ' L';
    return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: decimals });
  }

  function percent(v, decimals = 1) {
    if (v == null || isNaN(v)) return '—';
    return parseFloat(v).toFixed(decimals) + '%';
  }

  function number(v, decimals = 1) {
    if (v == null || isNaN(v)) return '—';
    return parseFloat(v).toLocaleString('en-IN', { maximumFractionDigits: decimals });
  }

  function ratio(v, decimals = 2) {
    if (v == null || isNaN(v)) return '—';
    return parseFloat(v).toFixed(decimals);
  }

  function minutes(v) {
    if (v == null || isNaN(v)) return '—';
    const h = Math.floor(v / 60);
    const m = Math.round(v % 60);
    if (h === 0) return `${m} min`;
    return `${h}h ${m}m`;
  }

  // Detect unit type and auto-format
  function auto(v, unit) {
    if (v == null || isNaN(v)) return '—';
    const u = (unit || '').toLowerCase();
    if (u.includes('₹') || u.includes('rs') || u.includes('rupee')) return currency(v);
    if (u.includes('%') || u.includes('percent') || u.includes('rate') || u.includes('share')) return percent(v);
    if (u.includes('min') || u.includes('hour')) return minutes(v);
    if (u.includes('ratio') || u.includes('index') || u.includes('score')) return ratio(v);
    return number(v);
  }

  return { currency, percent, number, ratio, minutes, auto };
})();

if (typeof module !== 'undefined') module.exports = FMT;
