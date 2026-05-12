/**
 * 10×10 waffle chart renderer.
 * Fills cells sequentially left-to-right, top-to-bottom with stagger animation.
 */
const WaffleRenderer = (function () {
  /**
   * @param {object} opts
   * @param {Element} opts.container
   * @param {Array}   opts.segments - [{ label, value, color? }] where values sum to ~100
   * @param {string}  [opts.unit='%']
   * @param {number}  [opts.animDelay=18] ms stagger per cell
   */
  function render(opts) {
    const { container, segments, unit = '%', animDelay = 18 } = opts;

    if (!segments || !segments.length) {
      container.innerHTML = '<p class="text-muted" style="padding:8px">No data.</p>';
      return;
    }

    const total = segments.reduce((acc, s) => acc + (s.value || 0), 0);

    // Build 100-cell colour array
    const cells = [];
    let filled = 0;
    segments.forEach((seg, i) => {
      const count = Math.round((seg.value / total) * 100);
      const color = seg.color || `var(--w${(i % 8) + 1})`;
      for (let j = 0; j < count && filled < 100; j++, filled++) {
        cells.push({ color, label: seg.label });
      }
    });
    // Fill any remainder with last segment's color
    while (cells.length < 100) {
      cells.push({ color: cells[cells.length - 1]?.color || 'var(--border)', label: '' });
    }

    const wrap = document.createElement('div');
    wrap.className = 'waffle-chart-wrap';

    // Grid
    const grid = document.createElement('div');
    grid.className = 'waffle-grid';
    cells.forEach((cell, i) => {
      const div = document.createElement('div');
      div.className = 'waffle-cell';
      div.style.background = cell.color;
      div.title = cell.label;
      grid.appendChild(div);

      requestAnimationFrame(() => {
        setTimeout(() => div.classList.add('filled'), i * animDelay);
      });
    });

    // Legend
    const legend = document.createElement('div');
    legend.className = 'waffle-legend';
    segments.forEach((seg, i) => {
      const color = seg.color || `var(--w${(i % 8) + 1})`;
      const item = document.createElement('div');
      item.className = 'waffle-legend-item';
      item.innerHTML = `
        <div class="waffle-swatch" style="background:${color};"></div>
        <span>${escHtml(seg.label)} — ${FMT.auto(seg.value, unit)}</span>
      `;
      legend.appendChild(item);
    });

    wrap.appendChild(grid);
    wrap.appendChild(legend);
    container.innerHTML = '';
    container.appendChild(wrap);
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { render };
})();
