/**
 * GlobalContextRenderer — "India in Global Context" horizontal bar chart.
 * Shows India vs Asian peer countries + OECD average for one indicator.
 *
 * Usage:
 *   GlobalContextRenderer.render({ container, title, data, unit, indiaCode, source, indiaStats })
 *   data: [{ code, name, value, year }]
 */
const GlobalContextRenderer = (function () {

  function render(opts) {
    const { container, title, data, unit = '', indiaCode = 'IND', source = '', indiaStats } = opts;

    if (!data || !data.length) {
      container.innerHTML = '<p style="color:var(--ink-3);padding:8px">No comparison data.</p>';
      return;
    }

    // Separate OECD from peers; sort peers descending, append OECD at bottom
    const peers = [...data].filter(d => d.value != null && d.code !== 'OED');
    const oecd  = data.find(d => d.code === 'OED' && d.value != null);
    peers.sort((a, b) => b.value - a.value);

    const allRows = oecd ? [...peers, { ...oecd, _isOECD: true }] : peers;

    if (!allRows.length) {
      container.innerHTML = '<p style="color:var(--ink-3);padding:8px">No comparison data.</p>';
      return;
    }

    const maxVal = Math.max(...allRows.map(d => d.value)) * 1.08;

    // Peer median reference line (excluding India and OECD)
    const peerVals = peers.filter(d => d.code !== indiaCode).map(d => d.value).sort((a, b) => a - b);
    let peerMedian = null;
    if (peerVals.length) {
      const mid = Math.floor(peerVals.length / 2);
      peerMedian = peerVals.length % 2 ? peerVals[mid] : (peerVals[mid - 1] + peerVals[mid]) / 2;
    }
    const medianPct = peerMedian != null ? (peerMedian / maxVal) * 100 : null;

    const wrap = document.createElement('div');
    wrap.className = 'gc-wrap';

    if (title) {
      const hd = document.createElement('div');
      hd.className = 'gc-header';
      hd.textContent = title;
      wrap.appendChild(hd);
    }

    // Bar area with optional median reference line
    const barArea = document.createElement('div');
    barArea.className = 'gc-bar-area';
    barArea.style.position = 'relative';

    allRows.forEach((item, idx) => {
      const isIndia = item.code === indiaCode;
      const isOECD  = item._isOECD;
      const pct = (item.value / maxVal) * 100;

      const row = document.createElement('div');
      row.className = 'gc-row' + (isIndia ? ' gc-india' : '') + (isOECD ? ' gc-oecd' : '');

      // OECD separator line above OECD row
      if (isOECD && idx > 0) {
        const sep = document.createElement('div');
        sep.className = 'gc-oecd-sep';
        barArea.appendChild(sep);
      }

      const barColor = isOECD  ? 'var(--ink-3)'
                     : isIndia ? 'var(--saffron)'
                     : 'color-mix(in oklch, var(--indigo) 60%, var(--saffron) 40%)';

      const nameText = isOECD ? 'OECD Avg' : escHtml(item.name);
      const rankBadge = isIndia && indiaStats
        ? `<span class="gc-rank">#${indiaStats.rank}/${indiaStats.total}</span>`
        : '';

      row.innerHTML = `
        <div class="gc-name" title="${escHtml(item.name)}">${nameText}</div>
        <div class="gc-bar-wrap">
          <div class="gc-bar" style="width:${pct}%;background:${barColor}${isOECD ? ';opacity:0.55' : ''}"></div>
        </div>
        <div class="gc-val">${FMT.auto(item.value, unit)}${rankBadge}<span class="gc-yr">${item.year ? ' \''+String(item.year).slice(2) : ''}</span></div>
      `;
      barArea.appendChild(row);
    });

    // Peer median reference line — add to each bar-wrap after rendering
    if (medianPct != null) {
      barArea.querySelectorAll('.gc-bar-wrap').forEach(bw => {
        const line = document.createElement('div');
        line.className = 'gc-median-line';
        line.style.left = medianPct + '%';
        bw.style.position = 'relative';
        bw.appendChild(line);
      });
    }

    wrap.appendChild(barArea);

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
