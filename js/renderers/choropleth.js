/**
 * Choropleth map renderer using D3.
 * Loads /data/geo/india-states.geojson and joins with stateData from data.json.
 *
 * Expected: window.d3, window.STATES, window.GEO_NAME_TO_CODE
 *
 * Usage:
 *   ChoroplethRenderer.render({ container, stateData, unit, indicator, onStateClick })
 *   ChoroplethRenderer.highlight(stateCode)
 *   ChoroplethRenderer.clearHighlight()
 */
const ChoroplethRenderer = (function () {

  let _geojson       = null;
  let _loadPromise   = null;
  let _g             = null;   // current D3 <g> selection
  let _geoNameToData = null;   // current geo-name → {code, value, rank} map
  let _unit          = '';

  function loadGeo() {
    if (_geojson) return Promise.resolve(_geojson);
    if (_loadPromise) return _loadPromise;
    _loadPromise = d3.json('/data/geo/india-states.geojson').then(geo => {
      _geojson = geo;
      return geo;
    });
    return _loadPromise;
  }

  /**
   * @param {object} opts
   * @param {Element} opts.container   - #map-container element
   * @param {object}  opts.stateData   - mapData.states from data.json
   * @param {string}  opts.unit        - e.g. '₹' or '%'
   * @param {string}  opts.indicator   - label for legend
   * @param {Function} [opts.onStateClick] - called with stateCode on click
   * @param {boolean} [opts.higherIsBetter] - for good/bad colour coding (default: true)
   */
  function render(opts) {
    const { container, stateData, unit, indicator, onStateClick, higherIsBetter = true } = opts;
    _unit = unit || '';

    // Remove skeleton
    const skeleton = container.querySelector('#map-skeleton');
    if (skeleton) skeleton.remove();

    // Clear any existing SVG
    d3.select(container).selectAll('svg').remove();
    _g = null;
    _geoNameToData = null;

    const width  = container.clientWidth  || 600;
    const height = container.clientHeight || 500;

    // Build name-to-data lookup using GEO_NAME_TO_CODE reverse map
    // GeoJSON feature.properties.name → state code → data value
    const geoNameToData = {};
    if (typeof GEO_NAME_TO_CODE !== 'undefined') {
      for (const [geoName, code] of Object.entries(GEO_NAME_TO_CODE)) {
        const entry = stateData[code];
        if (entry) geoNameToData[geoName] = { code, ...entry };
      }
    }
    _geoNameToData = geoNameToData;

    // Compute domain
    const values = Object.values(stateData)
      .map(s => s.value)
      .filter(v => v != null && !isNaN(v));
    const [vMin, vMax] = d3.extent(values);
    const colorScale = d3.scaleSequential()
      .domain([vMin, vMax])
      .interpolator(d3.interpolateRgbBasis([
        '#0D2B45', '#1A4A70', '#2870A8', '#C87820', '#E8892A'
      ]));

    // Update legend
    const legendMin   = document.getElementById('legend-min');
    const legendMid   = document.getElementById('legend-mid');
    const legendMax   = document.getElementById('legend-max');
    const legendTitle = document.getElementById('legend-title');
    if (legendTitle) legendTitle.textContent = indicator || unit;
    if (legendMin)   legendMin.textContent   = FMT.auto(vMin, unit);
    if (legendMid)   legendMid.textContent   = FMT.auto((vMin + vMax) / 2, unit);
    if (legendMax)   legendMax.textContent   = FMT.auto(vMax, unit);

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g');
    _g = g;

    const projection = d3.geoMercator().fitSize([width, height], _geojson);
    const pathGen    = d3.geoPath().projection(projection);

    const tooltip = document.getElementById('map-tooltip');
    const ttState = document.getElementById('tt-state');
    const ttValue = document.getElementById('tt-value');
    const ttRank  = document.getElementById('tt-rank');

    g.selectAll('path')
      .data(_geojson.features)
      .join('path')
      .attr('d', pathGen)
      .attr('fill', feature => {
        const geoName = (feature.properties.name || '').toLowerCase().trim();
        const entry   = geoNameToData[geoName];
        if (!entry || entry.value == null) return '#1E2D40';
        return colorScale(entry.value);
      })
      .attr('stroke', '#0A0F14')
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .style('transition', 'fill 0.12s')
      .on('mouseenter', function (event, feature) {
        const geoName = (feature.properties.name || '').toLowerCase().trim();
        const entry   = geoNameToData[geoName];
        d3.select(this)
          .attr('stroke', 'var(--saffron)')
          .attr('stroke-width', 2)
          .raise();
        if (tooltip) {
          if (ttState) ttState.textContent = feature.properties.name || geoName;
          if (ttValue) ttValue.textContent = entry ? FMT.auto(entry.value, unit) : 'No data';
          if (ttRank && entry && entry.rank) ttRank.textContent = `Rank: #${entry.rank} of ${values.length}`;
          else if (ttRank) ttRank.textContent = '';
          tooltip.classList.add('visible');
        }
      })
      .on('mousemove', function (event) {
        if (!tooltip) return;
        const rect = container.getBoundingClientRect();
        let x = event.clientX - rect.left + 12;
        let y = event.clientY - rect.top  + 12;
        if (x + 160 > width) x = event.clientX - rect.left - 160;
        tooltip.style.left = x + 'px';
        tooltip.style.top  = y + 'px';
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('stroke', '#0A0F14')
          .attr('stroke-width', 0.5);
        if (tooltip) tooltip.classList.remove('visible');
      })
      .on('click', function (event, feature) {
        const geoName = (feature.properties.name || '').toLowerCase().trim();
        const entry   = geoNameToData[geoName];
        if (entry && entry.code && onStateClick) {
          onStateClick(entry.code, feature.properties.name);
        }
      });

    // Sync hover → data panel
    g.selectAll('path').on('mouseenter.panel', function (event, feature) {
      const geoName = (feature.properties.name || '').toLowerCase().trim();
      const entry   = geoNameToData[geoName];
      if (entry && entry.code) {
        document.querySelectorAll('.panel-state-row').forEach(r =>
          r.classList.toggle('highlighted', r.dataset.code === entry.code)
        );
      }
    }).on('mouseleave.panel', function () {
      document.querySelectorAll('.panel-state-row').forEach(r => r.classList.remove('highlighted'));
    });

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => { g.attr('transform', event.transform); });
    svg.call(zoom);

    return { svg, colorScale, projection, pathGen };
  }

  /** Highlight a state by 2-letter code (called from panel hover). */
  function highlight(code) {
    if (!_g || !_geoNameToData) return;
    _g.selectAll('path').each(function (feature) {
      const geoName = (feature.properties.name || '').toLowerCase().trim();
      const entry   = _geoNameToData[geoName];
      if (entry && entry.code === code) {
        d3.select(this)
          .attr('stroke', 'var(--saffron)')
          .attr('stroke-width', 2)
          .raise();
      }
    });
  }

  /** Remove any programmatic highlight. */
  function clearHighlight() {
    if (!_g) return;
    _g.selectAll('path')
      .attr('stroke', '#0A0F14')
      .attr('stroke-width', 0.5);
  }

  return { render, loadGeo, highlight, clearHighlight };
})();
