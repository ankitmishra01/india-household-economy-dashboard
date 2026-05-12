/**
 * Choropleth map renderer using D3.
 * Loads /data/geo/india-states.geojson and joins with stateData from data.json.
 *
 * Expected: window.d3, window.STATES, window.GEO_NAME_TO_CODE
 *
 * Usage:
 *   ChoroplethRenderer.render({ container, stateData, unit, indicator, onStateClick })
 */
const ChoroplethRenderer = (function () {

  let _geojson = null;
  let _loadPromise = null;

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

    // Remove skeleton
    const skeleton = container.querySelector('#map-skeleton');
    if (skeleton) skeleton.remove();

    // Clear any existing SVG
    d3.select(container).selectAll('svg').remove();

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
    const legendMin  = document.getElementById('legend-min');
    const legendMid  = document.getElementById('legend-mid');
    const legendMax  = document.getElementById('legend-max');
    const legendTitle = document.getElementById('legend-title');
    if (legendTitle) legendTitle.textContent = indicator || unit;
    if (legendMin)   legendMin.textContent  = FMT.auto(vMin, unit);
    if (legendMid)   legendMid.textContent  = FMT.auto((vMin + vMax) / 2, unit);
    if (legendMax)   legendMax.textContent  = FMT.auto(vMax, unit);

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g');

    const projection = d3.geoMercator().fitSize([width, height], _geojson);
    const pathGen    = d3.geoPath().projection(projection);

    const tooltip    = document.getElementById('map-tooltip');
    const ttState    = document.getElementById('tt-state');
    const ttValue    = document.getElementById('tt-value');
    const ttRank     = document.getElementById('tt-rank');

    g.selectAll('path')
      .data(_geojson.features)
      .join('path')
      .attr('d', pathGen)
      .attr('fill', feature => {
        const geoName = (feature.properties.name || '').toLowerCase().trim();
        const entry   = geoNameToData[geoName];
        if (!entry || entry.value == null) return 'var(--border)';
        return colorScale(entry.value);
      })
      .attr('stroke', 'var(--bg)')
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .style('transition', 'fill 0.12s')
      .on('mouseenter', function (event, feature) {
        const geoName = (feature.properties.name || '').toLowerCase().trim();
        const entry   = geoNameToData[geoName];
        d3.select(this)
          .attr('stroke', 'var(--accent-saffron)')
          .attr('stroke-width', 2);
        if (tooltip) {
          if (ttState) ttState.textContent = feature.properties.name || geoName;
          if (ttValue) ttValue.textContent = entry ? FMT.auto(entry.value, unit) : 'No data';
          if (ttRank && entry && entry.rank) ttRank.textContent = `Rank: #${entry.rank} of ${values.length}`;
          tooltip.classList.add('visible');
        }
      })
      .on('mousemove', function (event) {
        if (!tooltip) return;
        const rect = container.getBoundingClientRect();
        let x = event.clientX - rect.left + 12;
        let y = event.clientY - rect.top  + 12;
        // Prevent tooltip overflowing right edge
        if (x + 160 > width) x = event.clientX - rect.left - 160;
        tooltip.style.left = x + 'px';
        tooltip.style.top  = y + 'px';
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('stroke', 'var(--bg)')
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

    // Highlight the hovered state in data panel
    g.selectAll('path').on('mouseenter.panel', function (event, feature) {
      const geoName = (feature.properties.name || '').toLowerCase().trim();
      const entry   = geoNameToData[geoName];
      if (entry && entry.code) {
        const rows = document.querySelectorAll('.panel-state-row');
        rows.forEach(r => r.classList.toggle('highlighted', r.dataset.code === entry.code));
      }
    }).on('mouseleave.panel', function () {
      document.querySelectorAll('.panel-state-row').forEach(r => r.classList.remove('highlighted'));
    });

    // Zoom support
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => { g.attr('transform', event.transform); });
    svg.call(zoom);

    return { svg, colorScale, projection, pathGen };
  }

  return { render, loadGeo };
})();
