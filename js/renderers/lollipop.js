/**
 * Horizontal lollipop chart renderer.
 * Two-column grid, 4-column rows (rank | name | stem-dot | value).
 * sage dot = above average, vermillion = below.
 */
const LollipopRenderer = (function () {
  /**
   * @param {object} opts
   * @param {Element} opts.container
   * @param {Array}   opts.data         - [{code, name, value}]
   * @param {number}  [opts.average]    - national average
   * @param {string}  [opts.unit]       - e.g. '₹' or '%'
   * @param {boolean} [opts.higherIsBetter=true]
   * @param {string}  [opts.avgLabel]   - label above avg line (default: unit + ' avg')
   */
  function render(opts) {
    const {
      container, data, average, unit,
      higherIsBetter = true,
      avgLabel,
    } = opts;

    if (!data || !data.length) {
      container.innerHTML = '<p style="padding:16px;color:var(--ink-3)">No data available.</p>';
      return;
    }

    // Sort descending (nulls last)
    const sorted = [...data].sort((a, b) => {
      if (a.value == null) return 1;
      if (b.value == null) return -1;
      return b.value - a.value;
    });
    const valid = sorted.filter(d => d.value != null);
    const maxVal = Math.max(...valid.map(d => d.value), average || 0) * 1.05;
    const avgPct = (average != null) ? (average / maxVal) * 100 : null;
    const lineLabel = avgLabel || (average != null ? FMT.auto(average, unit) : null);

    // Split into two halves for two-column layout
    const half  = Math.ceil(valid.length / 2);
    const col1  = valid.slice(0, half);
    const col2  = valid.slice(half);

    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'lollipop-grid';

    [col1, col2].forEach((col, ci) => {
      const colWrap = document.createElement('div');
      colWrap.style.position = 'relative';

      // Average line overlay spanning the stem column
      // stem column starts at: 24px rank + 130px name + 10px gap + 10px gap = ~174px from left
      if (avgPct != null) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position:absolute; left:174px; right:70px; top:0; bottom:0;
          pointer-events:none; z-index:2;
        `;
        const line = document.createElement('div');
        line.className = 'avgline';
        line.style.left = avgPct + '%';
        if (lineLabel) {
          // Use a child element instead of ::after for dynamic label
          const lbl = document.createElement('span');
          lbl.className = 'avgline-lbl';
          lbl.textContent = lineLabel;
          lbl.style.cssText = `
            position:absolute; bottom:calc(100% + 2px); left:50%;
            transform:translateX(-50%); font-family:var(--font-data);
            font-size:9.5px; color:var(--ink-2); white-space:nowrap;
            background:var(--paper); padding:0 4px;
          `;
          line.appendChild(lbl);
        }
        overlay.appendChild(line);
        colWrap.appendChild(overlay);
      }

      // Rows
      col.forEach((item, i) => {
        const rank   = ci === 0 ? i + 1 : i + half + 1;
        const pct    = (item.value / maxVal) * 100;
        const above  = average != null
          ? (higherIsBetter ? item.value >= average : item.value <= average)
          : true;
        const rowCls = 'lollipop-row ' + (above ? 'above' : 'below');

        const row = document.createElement('div');
        row.className = rowCls;
        row.dataset.code = item.code || '';

        // 4 cells: rank | name | stem-wrap | value
        const rankEl = document.createElement('span');
        rankEl.className = 'rank';
        rankEl.textContent = String(rank).padStart(2, '0');

        const nameEl = document.createElement('span');
        nameEl.className = 'name';
        nameEl.textContent = item.name;
        nameEl.title = item.name;

        const stemWrap = document.createElement('div');
        stemWrap.className = 'stem-wrap';

        const stem = document.createElement('div');
        stem.className = 'stem';
        stem.style.width = pct + '%';

        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = pct + '%';

        stemWrap.appendChild(stem);
        stemWrap.appendChild(dot);

        const valEl = document.createElement('span');
        valEl.className = 'vl';
        valEl.textContent = FMT.auto(item.value, unit);

        row.appendChild(rankEl);
        row.appendChild(nameEl);
        row.appendChild(stemWrap);
        row.appendChild(valEl);

        colWrap.appendChild(row);
      });

      grid.appendChild(colWrap);
    });

    container.appendChild(grid);
  }

  return { render };
})();
