/**
 * Grouped lollipop renderer — two series per state (e.g. Male vs Female).
 * Each state shows two parallel horizontal bars.
 */
const GroupedLollipopRenderer = (function () {
  /**
   * @param {object} opts
   * @param {Element} opts.container
   * @param {Array}   opts.states   - state names (sorted order)
   * @param {Array}   opts.seriesA  - [{ name, value, code }] first series
   * @param {Array}   opts.seriesB  - [{ name, value, code }] second series
   * @param {string}  opts.labelA   - e.g. 'Male'
   * @param {string}  opts.labelB   - e.g. 'Female'
   * @param {string}  opts.colorA   - CSS color
   * @param {string}  opts.colorB   - CSS color
   * @param {string}  opts.unit
   * @param {number}  [opts.sortBy='gap'] - sort by 'gap', 'A', 'B'
   * @param {number}  [opts.animDelay=15]
   */
  function render(opts) {
    const {
      container, seriesA, seriesB,
      labelA = 'Series A', labelB = 'Series B',
      colorA = 'var(--indigo)', colorB = 'var(--saffron)',
      unit = '', sortBy = 'gap', animDelay = 15,
    } = opts;

    if (!seriesA || !seriesB || !seriesA.length) {
      container.innerHTML = '<p style="color:var(--ink-3)" style="padding:16px">No data.</p>';
      return;
    }

    // Align by state name/code
    const mergedMap = {};
    seriesA.forEach(d => { mergedMap[d.code || d.name] = { name: d.name, code: d.code, a: d.value }; });
    seriesB.forEach(d => {
      const key = d.code || d.name;
      if (!mergedMap[key]) mergedMap[key] = { name: d.name, code: d.code };
      mergedMap[key].b = d.value;
    });

    let rows = Object.values(mergedMap).filter(r => r.a != null || r.b != null);

    // Sort
    if (sortBy === 'gap') {
      rows.sort((x, y) => Math.abs((y.a || 0) - (y.b || 0)) - Math.abs((x.a || 0) - (x.b || 0)));
    } else if (sortBy === 'A') {
      rows.sort((x, y) => (y.a || 0) - (x.a || 0));
    } else if (sortBy === 'B') {
      rows.sort((x, y) => (y.b || 0) - (x.b || 0));
    }

    const allVals = rows.flatMap(r => [r.a, r.b]).filter(v => v != null);
    const maxVal  = Math.max(...allVals) * 1.08;

    // Legend header
    const legend = document.createElement('div');
    legend.style.cssText = 'display:flex;gap:16px;margin-bottom:12px;padding-left:160px;';
    legend.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:var(--ink-2);">
        <div style="width:10px;height:10px;border-radius:50%;background:${colorA};flex-shrink:0;"></div>${escHtml(labelA)}
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:var(--ink-2);">
        <div style="width:10px;height:10px;border-radius:50%;background:${colorB};flex-shrink:0;"></div>${escHtml(labelB)}
      </div>
    `;

    container.innerHTML = '';
    container.appendChild(legend);

    rows.forEach((item, i) => {
      const pctA = item.a != null ? (item.a / maxVal) * 100 : 0;
      const pctB = item.b != null ? (item.b / maxVal) * 100 : 0;

      const block = document.createElement('div');
      block.className = 'grouped-lollipop-row';
      block.innerHTML = `
        <div class="group-state-label">${escHtml(item.name)}</div>
        <div class="group-track-wrap">
          <div class="group-series-label" style="color:${colorA};">${escHtml(labelA)}</div>
          <div class="lollipop-track" style="flex:1;">
            <div class="lollipop-stem" style="width:${pctA}%;background:${colorA};opacity:0.5;"></div>
            <div class="lollipop-dot" style="left:${pctA}%;background:${colorA};"></div>
          </div>
          <div class="lollipop-value">${item.a != null ? FMT.auto(item.a, unit) : '—'}</div>
        </div>
        <div class="group-track-wrap">
          <div class="group-series-label" style="color:${colorB};">${escHtml(labelB)}</div>
          <div class="lollipop-track" style="flex:1;">
            <div class="lollipop-stem" style="width:${pctB}%;background:${colorB};opacity:0.5;"></div>
            <div class="lollipop-dot" style="left:${pctB}%;background:${colorB};"></div>
          </div>
          <div class="lollipop-value">${item.b != null ? FMT.auto(item.b, unit) : '—'}</div>
        </div>
      `;

      container.appendChild(block);

      requestAnimationFrame(() => {
        setTimeout(() => {
          block.querySelectorAll('.lollipop-stem').forEach(el => el.classList.add('animate'));
          block.querySelectorAll('.lollipop-dot').forEach(el  => el.classList.add('animate'));
        }, i * animDelay);
      });
    });
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { render };
})();
