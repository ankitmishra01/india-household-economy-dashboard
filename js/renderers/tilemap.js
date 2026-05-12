/**
 * Tile-grid cartogram renderer — vanilla DOM port of TileMap from prototype.
 *
 * Usage:
 *   TilemapRenderer.render({ container, stateData, unit, indicator, avg, onStateClick })
 *   TilemapRenderer.highlight(code)   — highlight a tile from panel hover
 *   TilemapRenderer.clearHighlight()
 *
 * Expected globals: window.STATES, window.FMT
 */
const TilemapRenderer = (function () {

  /* Integer grid positions [col, row] for all 37 states/UTs */
  const TILE_POS = {
    JK:[3,0], LA:[4,0],
    PB:[2,1], HP:[3,1], UK:[4,1],
    CH:[2,2], HR:[3,2], DL:[4,2], AR:[8,2],
    RJ:[1,3], UP:[3,3], BR:[4,3], SK:[6,3], AS:[7,3], NL:[8,3],
    GJ:[0,4], MP:[2,4], JH:[4,4], WB:[5,4], ML:[6,4], MN:[8,4],
    DD:[0,5], DN:[1,5], MH:[2,5], CG:[4,5], OD:[5,5], TR:[6,5], MZ:[7,5],
    TS:[3,6], AP:[4,6], AN:[7,6],
    LD:[0,7], GA:[1,7], KA:[2,7],
    KL:[2,8], TN:[3,8], PY:[4,8],
  };

  /* Region label positions [left, top, text] */
  const REGION_LABELS = [
    [130, -14, 'North'],
    [445, 130, 'North-east'],
    [-8,  248, 'West'],
    [330, 295, 'East'],
    [150, 498, 'South'],
  ];

  const CELL = 60;
  const SIZE = 54;

  let _container = null;
  let _selected = null;

  /* 5-bucket color ramp — dark and light variants */
  function bucketColor(v, min, max, dark) {
    if (v == null) return null;
    const t = (v - min) / (max - min || 1);
    const bucket = Math.min(4, Math.max(0, Math.floor(t * 5)));
    if (dark) {
      const stops = [
        'oklch(0.30 0.04 60)',
        'oklch(0.40 0.07 60)',
        'oklch(0.52 0.12 62)',
        'oklch(0.66 0.16 62)',
        'oklch(0.80 0.17 65)',
      ];
      return stops[bucket];
    }
    const stops = [
      'oklch(0.94 0.018 70)',
      'oklch(0.89 0.045 70)',
      'oklch(0.82 0.085 65)',
      'oklch(0.73 0.135 62)',
      'oklch(0.63 0.165 58)',
    ];
    return stops[bucket];
  }

  function isDarkPalette() {
    return !document.body.dataset.palette || document.body.dataset.palette === 'midnight-mango';
  }

  function fmtShort(v, unit) {
    if (v == null) return '—';
    if (unit === '₹') {
      if (v >= 10000) return '₹' + (v / 1000).toFixed(0) + 'k';
      return '₹' + (v / 1000).toFixed(1) + 'k';
    }
    if (unit === '%') return v.toFixed(1) + '%';
    if (typeof window.FMT !== 'undefined') return FMT.auto(v, unit);
    return String(v);
  }

  function fmtFull(v, unit) {
    if (v == null) return 'No data';
    if (typeof window.FMT !== 'undefined') return FMT.auto(v, unit);
    if (unit === '₹') return '₹' + v.toLocaleString('en-IN');
    if (unit === '%') return v.toFixed(1) + '%';
    return String(v);
  }

  function render(opts) {
    const { container, stateData, unit, indicator, avg, onStateClick, higherIsBetter = true } = opts;
    _container = container;
    _selected = null;

    /* Clear previous */
    container.innerHTML = '';

    /* Collect valid values for color scale */
    const entries = Object.entries(stateData || {});
    const values = entries.map(([, s]) => s.value).filter(v => v != null && !isNaN(v));
    const vMin = values.length ? Math.min(...values) : 0;
    const vMax = values.length ? Math.max(...values) : 1;

    const dark = isDarkPalette();

    /* Outer wrapper */
    const wrap = document.createElement('div');
    wrap.className = 'tilemap-wrap';

    const map = document.createElement('div');
    map.className = 'tilemap';
    map.style.position = 'relative';
    map.style.width  = (9 * CELL) + 'px';
    map.style.height = (9 * CELL) + 'px';

    /* Tooltip element */
    const tip = document.createElement('div');
    tip.className = 'tile-tip';
    tip.style.display = 'none';
    tip.innerHTML = '<div class="tt-state"></div><div class="tt-value"></div>';
    map.appendChild(tip);

    /* Region labels */
    REGION_LABELS.forEach(([left, top, text]) => {
      const lbl = document.createElement('div');
      lbl.className = 'region-label';
      lbl.style.left = left + 'px';
      lbl.style.top  = top  + 'px';
      lbl.textContent = text;
      map.appendChild(lbl);
    });

    /* Build tiles */
    entries.forEach(([code, s]) => {
      const pos = TILE_POS[code];
      if (!pos) return;
      const [col, row] = pos;
      const v = s.value;
      const noData = v == null;

      const fill = noData ? null : bucketColor(v, vMin, vMax, dark);

      /* Decide text color based on fill lightness */
      let textColor = 'white';
      if (!noData && fill) {
        const lMatch = fill.match(/oklch\(([\d.]+)/);
        if (lMatch && parseFloat(lMatch[1]) > 0.75) {
          textColor = 'oklch(0.22 0.04 250)';
        }
      }

      const tile = document.createElement('div');
      tile.className = 'tile' + (noData ? ' no-data' : '');
      tile.dataset.code = code;
      tile.style.left   = (col * CELL) + 'px';
      tile.style.top    = (row * CELL) + 'px';
      tile.style.width  = SIZE + 'px';
      tile.style.height = SIZE + 'px';
      if (fill) {
        tile.style.background = fill;
        tile.style.color = textColor;
      }

      const codeEl = document.createElement('div');
      codeEl.className = 'code';
      codeEl.textContent = code;

      const valEl = document.createElement('div');
      valEl.className = 'val';
      valEl.textContent = noData ? '' : fmtShort(v, unit);

      tile.appendChild(codeEl);
      tile.appendChild(valEl);

      /* Hover: show tooltip + sync panel */
      tile.addEventListener('mouseenter', function (e) {
        const stateName = (typeof STATES !== 'undefined' && STATES[code])
          ? STATES[code].name
          : code;

        /* Tooltip */
        tip.querySelector('.tt-state').textContent = stateName;
        tip.querySelector('.tt-value').textContent = fmtFull(v, unit);
        tip.style.display = 'block';
        const x = col * CELL + SIZE / 2;
        const y = row * CELL;
        tip.style.left = x + 'px';
        tip.style.top  = y + 'px';

        /* Sync panel rows */
        document.querySelectorAll('.panel-state-row, .panel-row').forEach(r => {
          r.classList.toggle('highlighted', r.dataset.code === code);
        });
      });

      tile.addEventListener('mouseleave', function () {
        tip.style.display = 'none';
        document.querySelectorAll('.panel-state-row, .panel-row').forEach(r => {
          r.classList.remove('highlighted');
        });
      });

      /* Click: select + callback */
      tile.addEventListener('click', function () {
        /* Toggle selection */
        if (_selected === code) {
          _selected = null;
          tile.classList.remove('selected');
        } else {
          _selected = code;
          map.querySelectorAll('.tile.selected').forEach(t => t.classList.remove('selected'));
          tile.classList.add('selected');
        }
        if (onStateClick) onStateClick(code, (typeof STATES !== 'undefined' && STATES[code]) ? STATES[code].name : code);
      });

      map.appendChild(tile);
    });

    wrap.appendChild(map);
    container.appendChild(wrap);

    /* Caption */
    const caption = document.createElement('div');
    caption.style.fontSize = '11.5px';
    caption.style.color = 'var(--ink-3)';
    caption.style.marginTop = '8px';
    caption.style.textAlign = 'center';
    caption.textContent = 'Tile-grid cartogram · each square represents one state or UT, equal weight';
    container.appendChild(caption);

    /* Update inline legend buckets if present */
    const legendBar = container.closest('.map-card')?.querySelector('.legend-bar');
    if (legendBar) {
      legendBar.innerHTML = '';
      for (let i = 0; i < 5; i++) {
        const span = document.createElement('span');
        span.style.background = bucketColor(i, 0, 4, dark);
        legendBar.appendChild(span);
      }
    }
  }

  function highlight(code) {
    if (!_container) return;
    _container.querySelectorAll('.tile').forEach(t => {
      t.classList.toggle('highlighted-from-panel', t.dataset.code === code);
      if (t.dataset.code === code) t.style.outline = '2px solid var(--saffron)';
      else if (!t.classList.contains('selected')) t.style.outline = '';
    });
  }

  function clearHighlight() {
    if (!_container) return;
    _container.querySelectorAll('.tile').forEach(t => {
      if (!t.classList.contains('selected')) t.style.outline = '';
    });
  }

  return { render, highlight, clearHighlight };
})();
