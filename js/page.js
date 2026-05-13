/**
 * page.js — Entry point for all data pages.
 * Fetches data.json + insights.json, mounts all components.
 * Requires: d3, STATES, GEO_NAME_TO_CODE, FMT, STATS,
 *           ChoroplethRenderer, LollipopRenderer, WaffleRenderer,
 *           GroupedLollipopRenderer, TableRenderer, nav.js
 */
(function () {
  const slug              = document.body.dataset.page;
  const DATA_URL          = `/data/pages/${slug}/data.json`;
  const INSIGHTS_URL      = `/data/pages/${slug}/insights.json`;
  const MANIFEST_URL      = '/data/pages-manifest.json';
  const GLOBAL_CTX_URL    = `/data/pages/${slug}/global-context.json`;

  let pageData        = null;
  let insightsData    = [];
  let manifestData    = null;
  let globalCtxData   = null;
  let activeTab       = 0;

  // Fetch everything in parallel
  Promise.all([
    fetch(DATA_URL).then(r => { if (!r.ok) throw new Error(`data.json not found for ${slug}`); return r.json(); }),
    fetch(INSIGHTS_URL).then(r => r.ok ? r.json() : []).catch(() => []),
    fetch(MANIFEST_URL).then(r => r.json()).catch(() => null),
    fetch(GLOBAL_CTX_URL).then(r => r.ok ? r.json() : null).catch(() => null),
  ])
  .then(([data, insights, manifest, globalCtx]) => {
    pageData      = data;
    insightsData  = insights || [];
    manifestData  = manifest;
    globalCtxData = globalCtx;
    init();
  })
  .catch(err => {
    console.error('Page load error:', err);
    showError(err.message);
  });

  function init() {
    const meta = pageData.meta || {};

    // Page meta
    setTextById('page-title',    meta.title);
    setTextById('page-subtitle', meta.subtitle);
    setTextById('source-badge',  meta.source);

    // Footer
    setTextById('footer-source',        meta.source);
    setTextById('footer-methodology',   meta.methodology);
    setTextById('footer-survey-period', meta.surveyPeriod ? `Survey period: ${meta.surveyPeriod}` : '');

    // Content warning (check manifest for this page)
    const pageManifest = manifestData?.pages?.find(p => p.slug === slug);
    if (pageManifest?.contentWarning) {
      showContentWarning(pageManifest.contentWarning);
    }

    // Notes
    renderNotes(meta.notes || []);

    // Tabs
    if (pageData.tabs && pageData.tabs.length > 1) {
      renderTabs(pageData.tabs);
    }

    // Map (if mapData present)
    if (pageData.mapData) {
      renderMap(pageData.mapData);
    }

    // Charts
    if (pageData.chartBlocks && pageData.chartBlocks.length) {
      renderCharts(pageData.chartBlocks);
    }

    // Table
    if (pageData.tableData) {
      renderTable(pageData.tableData);
    }

    // Global context (World Bank / IMF / ADB comparisons)
    if (globalCtxData) {
      renderGlobalContext(globalCtxData);
    }

    // Insights
    renderInsights(insightsData);
  }

  // ---------- Map ----------
  function renderMap(mapData) {
    const container = document.getElementById('map-container');
    if (!container) return;

    const panelAvg  = document.getElementById('panel-avg-value');
    const panelList = document.getElementById('panel-state-list');
    const indicator = document.getElementById('panel-indicator-label');

    if (indicator) indicator.textContent = mapData.indicator || 'States ranked by indicator';
    if (panelAvg)  panelAvg.textContent  = FMT.auto(mapData.nationalAverage, mapData.unit);

    // Ranked list in data panel
    if (panelList) {
      panelList.innerHTML = '';
      renderStatePanel(panelList, mapData);
    }

    // Geographic choropleth is the primary map; tile cartogram is fallback only
    ChoroplethRenderer.loadGeo().then(() => {
      ChoroplethRenderer.render({
        container,
        stateData: mapData.states || {},
        unit: mapData.unit,
        indicator: mapData.indicator,
        onStateClick: (code) => { highlightPanelState(code); },
      });
    }).catch(err => {
      // Fallback to tile cartogram if GeoJSON fails to load
      if (typeof TilemapRenderer !== 'undefined') {
        container.innerHTML = '';
        TilemapRenderer.render({
          container,
          stateData: mapData.states || {},
          unit: mapData.unit,
          indicator: mapData.indicator,
          avg: mapData.nationalAverage,
          onStateClick: (code) => { highlightPanelState(code); },
        });
      } else {
        container.innerHTML = `<div style="padding:24px;color:var(--ink-3)">Map unavailable: ${escHtml(err.message)}</div>`;
      }
    });
  }

  function renderStatePanel(container, mapData) {
    const states = mapData.states || {};
    const avg = mapData.nationalAverage;

    // Sort by value descending (nulls last)
    const sorted = Object.entries(states)
      .sort(([, a], [, b]) => {
        if (a.value == null) return 1;
        if (b.value == null) return -1;
        return b.value - a.value;
      });

    const maxVal = sorted.find(([, s]) => s.value != null)?.[1].value || 1;

    sorted.forEach(([code, state], idx) => {
      const noData = state.value == null;
      const pct    = noData ? 0 : Math.min(100, (state.value / maxVal) * 100);
      const above  = !noData && avg != null && state.value >= avg;
      const barColor = above ? 'var(--sage)' : 'var(--vermillion)';

      const row = document.createElement('div');
      row.className = 'panel-state-row' + (noData ? ' no-data' : '');
      row.dataset.code = code;

      const rankStr = state.rank != null ? String(state.rank).padStart(2, '0') : '—';

      row.innerHTML = `
        <span class="panel-rank">${rankStr}</span>
        <div>
          <div class="panel-state-name">${escHtml(state.name)}</div>
          ${!noData ? `<div class="minibar"><span style="width:${pct}%;background:${barColor}"></span></div>` : ''}
        </div>
        <span class="panel-value">${FMT.auto(state.value, mapData.unit)}</span>
      `;

      row.addEventListener('mouseenter', () => {
        highlightPanelState(code);
        ChoroplethRenderer.highlight(code);
      });
      row.addEventListener('mouseleave', () => {
        document.querySelectorAll('.panel-state-row').forEach(r => r.classList.remove('highlighted'));
        ChoroplethRenderer.clearHighlight();
      });
      container.appendChild(row);
    });
  }

  function highlightPanelState(code) {
    document.querySelectorAll('.panel-state-row').forEach(r => {
      r.classList.toggle('highlighted', r.dataset.code === code);
    });
    const target = document.querySelector(`.panel-state-row[data-code="${code}"]`);
    if (target) target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ---------- Charts ----------
  function renderCharts(blocks) {
    const container = document.getElementById('charts-container');
    if (!container) return;

    blocks.forEach(block => {
      const section = document.createElement('div');
      section.className = 'chart-section';
      section.id = `chart-${block.id}`;

      const card = document.createElement('div');
      card.className = 'chart-card';

      const header = document.createElement('div');
      header.className = 'chart-head';
      const titleSplit = (block.title || '').replace(/(\S+)\s*$/, '<em>$1</em>');
      header.innerHTML = `<div><h3>${titleSplit}</h3>${block.subtitle ? `<div style="font-size:12.5px;color:var(--ink-3);margin-top:4px">${escHtml(block.subtitle)}</div>` : ''}</div>`;
      if (block.modelled) {
        header.querySelector('div').insertAdjacentHTML('beforeend', '<div style="margin-top:6px;"><span class="modelled-badge">Modelled estimate</span></div>');
      }
      card.appendChild(header);

      const chartEl = document.createElement('div');
      chartEl.className = 'chart-render-area';
      card.appendChild(chartEl);
      section.appendChild(card);

      container.appendChild(section);

      // Render based on type
      switch (block.type) {
        case 'lollipop':
          LollipopRenderer.render({
            container:        chartEl,
            data:             block.data,
            average:          block.average,
            unit:             block.unit,
            higherIsBetter:   block.higherIsBetter !== false,
          });
          break;
        case 'waffle':
          WaffleRenderer.render({
            container: chartEl,
            segments:  block.segments || block.data,
            unit:      block.unit,
          });
          break;
        case 'grouped-lollipop':
          GroupedLollipopRenderer.render({
            container: chartEl,
            seriesA:   block.seriesA,
            seriesB:   block.seriesB,
            labelA:    block.labelA || 'Series A',
            labelB:    block.labelB || 'Series B',
            colorA:    block.colorA || 'var(--indigo)',
            colorB:    block.colorB || 'var(--saffron)',
            unit:      block.unit,
          });
          break;
        default:
          chartEl.innerHTML = `<p class="text-muted" style="padding:8px">Unknown chart type: ${block.type}</p>`;
      }
    });
  }

  // ---------- Tabs ----------
  function renderTabs(tabs) {
    const tabBar = document.getElementById('tab-controls');
    if (!tabBar) return;
    tabBar.classList.remove('hidden');
    tabBar.innerHTML = '';

    const DEVA_NUMS = ['०१','०२','०३','०४','०५'];
    tabs.forEach((tab, i) => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (i === 0 ? ' active' : '');
      btn.innerHTML = `${escHtml(tab.label)}<span class="num" style="font-family:var(--font-deva)">${DEVA_NUMS[i] || ''}</span>`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.addEventListener('click', () => {
        activeTab = i;
        tabBar.querySelectorAll('.tab-btn').forEach((b, j) => {
          b.classList.toggle('active', j === i);
          b.setAttribute('aria-selected', j === i ? 'true' : 'false');
        });
        // Re-render map and charts with tab data
        if (tab.mapData) renderMap(tab.mapData);
        if (tab.chartBlocks) {
          const cc = document.getElementById('charts-container');
          if (cc) { cc.innerHTML = ''; renderCharts(tab.chartBlocks); }
        }
      });
      tabBar.appendChild(btn);
    });
  }

  // ---------- Table ----------
  function renderTable(tableData) {
    const headEl  = document.getElementById('table-head');
    const bodyEl  = document.getElementById('table-body');
    const searchEl = document.getElementById('table-search');
    const csvBtn  = document.getElementById('csv-export-btn');
    if (!headEl || !bodyEl) return;

    TableRenderer.render({ tableData, headEl, bodyEl, searchEl, csvBtn });
  }

  // ---------- Insights ----------
  function renderInsights(insights) {
    const container = document.getElementById('insights-container');
    if (!container) return;

    const visible = insights.filter(b =>
      b.verdict === 'supported' || b.verdict === 'mostly_supported'
    );

    if (!visible.length) return;

    container.innerHTML = '';
    visible.forEach(block => {
      const div = document.createElement('div');
      div.className = 'insight-block';
      const badge = block.verdict === 'mostly_supported'
        ? '<span class="verdict-badge verdict-mostly">Verified</span>'
        : '<span class="verdict-badge verdict-supported">Verified</span>';
      div.innerHTML = `${badge}<p>${escHtml(block.text)}</p>`;
      container.appendChild(div);
    });
  }

  // ---------- Global Context ----------
  function renderGlobalContext(ctx) {
    const container = document.getElementById('global-context-container');
    if (!container || !ctx?.charts?.length) return;

    container.innerHTML = '';
    const section = document.createElement('div');
    section.className = 'global-context-section';

    const updated = ctx.meta?.dataUpdatedAt
      ? `<span class="gc-updated">Updated ${new Date(ctx.meta.dataUpdatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}</span>`
      : '';
    section.innerHTML = `
      <h2>India in Global Context${updated}</h2>
      <p class="gc-subtitle">How India compares with key Asian economies and global benchmarks.</p>
      <div class="gc-cards-grid" id="gc-cards"></div>
    `;
    const grid = section.querySelector('#gc-cards');

    ctx.charts.forEach(chart => {
      if (!chart.countries?.length) return;
      const card = document.createElement('div');
      card.className = 'gc-card';
      card.innerHTML = `<div class="gc-card-title">${escHtml(chart.title)}</div><div class="gc-chart-area"></div>`;
      const area = card.querySelector('.gc-chart-area');
      if (typeof GlobalContextRenderer !== 'undefined') {
        GlobalContextRenderer.render({
          container: area,
          data: chart.countries,
          unit: chart.unit,
          source: chart.source,
        });
      }
      grid.appendChild(card);
    });

    container.appendChild(section);
  }

  // ---------- Notes ----------
  function renderNotes(notes) {
    const list = document.getElementById('notes-list');
    if (!list || !notes.length) return;
    notes.forEach(note => {
      const li = document.createElement('li');
      li.textContent = note;
      list.appendChild(li);
    });
  }

  // ---------- Content Warning ----------
  function showContentWarning(text) {
    const storageKey = `cw-dismissed-${slug}`;
    if (localStorage.getItem(storageKey)) return;

    const banner = document.getElementById('content-warning');
    const cwText = document.getElementById('cw-text');
    const cwDismiss = document.getElementById('cw-dismiss');
    if (!banner) return;

    if (cwText) cwText.textContent = text;
    banner.classList.remove('hidden');

    if (cwDismiss) {
      cwDismiss.addEventListener('click', () => {
        banner.classList.add('dismissed');
        localStorage.setItem(storageKey, '1');
      });
    }
  }

  // ---------- Helpers ----------
  function setTextById(id, text) {
    const el = document.getElementById(id);
    if (el && text != null) el.textContent = text;
  }

  function showError(msg) {
    const container = document.getElementById('map-container');
    if (container) {
      container.innerHTML = `<div style="padding:32px;color:var(--ink-3);text-align:center;">
        <p style="margin-bottom:8px;color:var(--vermillion);">⚠ Data not available</p>
        <p style="font-size:13px;">${escHtml(msg)}</p>
        <p style="font-size:12px;margin-top:8px;">Run <code>node scripts/extract/${slug}.js --mock</code> to generate mock data.</p>
      </div>`;
    }
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
})();
