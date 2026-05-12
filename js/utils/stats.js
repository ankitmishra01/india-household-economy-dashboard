/**
 * Lightweight stats helpers for insight generation and chart thresholds.
 */
const STATS = (function () {
  function mean(values) {
    const vals = values.filter(v => v != null && !isNaN(v));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  function stddev(values) {
    const vals = values.filter(v => v != null && !isNaN(v));
    if (vals.length < 2) return 0;
    const m = mean(vals);
    const variance = vals.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / vals.length;
    return Math.sqrt(variance);
  }

  // Returns states more than `threshold` SDs from the mean
  function outliers(statesObj, threshold = 1.5) {
    const entries = Object.entries(statesObj)
      .filter(([, s]) => s.value != null && !isNaN(s.value));
    const values = entries.map(([, s]) => s.value);
    const m = mean(values);
    const sd = stddev(values);
    return entries
      .filter(([, s]) => Math.abs(s.value - m) > threshold * sd)
      .map(([code, s]) => ({ code, ...s, zscore: (s.value - m) / sd }))
      .sort((a, b) => Math.abs(b.zscore) - Math.abs(a.zscore));
  }

  function minMax(values) {
    const vals = values.filter(v => v != null && !isNaN(v));
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }

  return { mean, stddev, outliers, minMax };
})();

if (typeof module !== 'undefined') module.exports = STATS;
