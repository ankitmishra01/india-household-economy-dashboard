/**
 * Horizontal lollipop chart renderer.
 * Renders into a container element. States sorted by value descending.
 * Animates stems left-to-right with staggered delay on load.
 */
const LollipopRenderer = (function () {
  /**
   * @param {object} opts
   * @param {Element} opts.container
   * @param {Array}   opts.data       - [{ name, value, code }]
   * @param {number}  opts.average    - national average for reference line
   * @param {string}  opts.unit
   * @param {boolean} [opts.higherIsBetter=true]
   * @param {boolean} [opts.showAvgLine=true]
   * @param {number}  [opts.animDelay=20]  ms stagger per row
   */
  function render(opts) {
    const {
      container, data, average, unit,
      higherIsBetter = true,
      showAvgLine = true,
      animDelay   = 20,
    } = opts;

    if (!data || !data.length) {
      container.innerHTML = '<p class="text-muted" style="padding:16px">No data available.</p>';
      return;
    }

    // Sort descending by value (nulls last)
    const sorted = [...data].sort((a, b) => {
      if (a.value == null) return 1;
      if (b.value == null) return -1;
      return b.value - a.value;
    });

    const values = sorted.map(d => d.value).filter(v => v != null);
    const maxVal = Math.max(...values, average || 0) * 1.08;

    container.innerHTML = '';
    container.style.position = 'relative';

    // Average line overlay
    if (showAvgLine && average != null) {
      const avgPct = (average / maxVal) * 100;
      const avgWrap = document.createElement('div');
      avgWrap.className = 'avg-line-wrapper';
      avgWrap.style.cssText = `left:140px; right:64px; position:absolute; top:0; bottom:0;`;
      avgWrap.innerHTML = `
        <div style="position:absolute; left:${avgPct}%; top:0; bottom:0; width:0;">
          <div class="avg-line" style="height:100%;"></div>
          <div class="avg-label-float">${FMT.auto(average, unit)}<br><span style="font-size:0.58rem;color:var(--text-muted);">National avg</span></div>
        </div>
      `;
      container.appendChild(avgWrap);
    }

    sorted.forEach((item, i) => {
      if (item.value == null) return;

      const pct = (item.value / maxVal) * 100;
      const isGood = higherIsBetter ? item.value >= (average || 0) : item.value <= (average || 0);
      const dotClass = isGood ? 'good' : 'bad';

      const row = document.createElement('div');
      row.className = 'lollipop-row';
      row.dataset.code = item.code || '';

      row.innerHTML = `
        <div class="lollipop-label" title="${escHtml(item.name)}">${escHtml(item.name)}</div>
        <div class="lollipop-track">
          <div class="lollipop-stem" style="width:${pct}%;"></div>
          <div class="lollipop-dot ${dotClass}" style="left:${pct}%;"></div>
        </div>
        <div class="lollipop-value">${FMT.auto(item.value, unit)}</div>
      `;

      container.appendChild(row);

      // Staggered animation
      requestAnimationFrame(() => {
        setTimeout(() => {
          const stem = row.querySelector('.lollipop-stem');
          const dot  = row.querySelector('.lollipop-dot');
          if (stem) stem.classList.add('animate');
          if (dot)  dot.classList.add('animate');
        }, i * animDelay);
      });
    });
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { render };
})();
