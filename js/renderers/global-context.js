/**
 * GlobalContextRenderer — "India in Global Context" horizontal bar chart.
 * Shows India vs Asian peer countries for one indicator.
 *
 * Usage:
 *   GlobalContextRenderer.render({ container, title, data, unit, indiaCode='IND' })
 *   data: [{ code, name, value, year }] sorted descending
 */
const GlobalContextRenderer = (function () {

  function render(opts) {
    const { container, title, data, unit = '', indiaCode = 'IND', source = '' } = opts;

    if (!data || !data.length) {
      container.innerHTML = '<p style="color:var(--ink-3);padding:8px">No comparison data.</p>';
      return;
    }

    const sorted = [...data]
      .filter(d => d.value != null)
      .sort((a, b) => b.value - a.value);

    if (!sorted.length) {
      container.innerHTML = '<p style="color:var(--ink-3);padding:8px">No comparison data.</p>';
      return;
    }

    const maxVal = sorted[0].value * 1.08;
    const wrap = document.createElement('div');
    wrap.className = 'gc-wrap';

    if (title) {
      const hd = document.createElement('div');
      hd.className = 'gc-header';
      hd.textContent = title;
      wrap.appendChild(hd);
    }

    sorted.forEach(item => {
      const isIndia = item.code === indiaCode;
      const pct = (item.value / maxVal) * 100;

      const row = document.createElement('div');
      row.className = 'gc-row' + (isIndia ? ' gc-india' : '');

      row.innerHTML = `
        <div class="gc-name" title="${escHtml(item.name)}">${escHtml(item.name)}</div>
        <div class="gc-bar-wrap">
          <div class="gc-bar" style="width:${pct}%"></div>
        </div>
        <div class="gc-val">${FMT.auto(item.value, unit)}<span class="gc-yr">${item.year ? ' \''+String(item.year).slice(2) : ''}</span></div>
      `;
      wrap.appendChild(row);
    });

    if (source) {
      const src = document.createElement('div');
      src.className = 'gc-source';
      src.textContent = 'Source: ' + source;
      wrap.appendChild(src);
    }

    container.innerHTML = '';
    container.appendChild(wrap);
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { render };
})();
