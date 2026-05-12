/**
 * page.js — Entry point for all data pages.
 * Fetches data.json + insights.json, mounts all components.
 * Requires: d3, STATES, GEO_NAME_TO_CODE, FMT, STATS,
 *           ChoroplethRenderer, LollipopRenderer, WaffleRenderer,
 *           GroupedLollipopRenderer, TableRenderer, nav.js
 */
(function () {
  const slug        = document.body.dataset.page;
  const DATA_URL    = `/data/pages/${slug}/data.json`;
  const INSIGHTS_URL = `/data/pages/${slug}/insights.json`;
  const MANIFEST_URL = '/data/pages-manifest.json';

  let pageData     = null;
  let insightsData = [];
  let manifestData = null;
  let activeTab    = 0;

  // Fetch everything in parallel
  Promise.all([
    fetch(DATA_URL).then(r => { if (!r.ok) throw new Error(`data.json not found for ${slug}`); return r.json(); }),
    fetch(INSIGHTS_URL).then(r => r.ok ? r.json() : []).catch(() => []),
    fetch(MANIFEST_URL).then(r => r.json()).catch(() => null),
  ])
  .then(([data, insights, manifest]) => {
    pageData     = data;
    insightsData = insights || [];
    manifestData = manifest;
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
    if (panelList) renderStatePanel(panelList, mapData);

    ChoroplethRenderer.loadGeo().then(() => {
      ChoroplethRenderer.render({
        container,
        stateData: mapData.states || {},
        unit: mapData.unit,
        indicator: mapData.indicator,
        onStateClick: (code, name) => {
          highlightPanelState(code);
        },
      });
    }).catch(err => {
      container.innerHTML = `<div style="padding:24px;color:var(--text-muted)">Map unavailable: ${err.message}</div>`;
    });
  }

  function renderStatePanel(container, mapData) {
    const states = mapData.states || {};
    // Sort by value descending (nulls last)
    const sorted = Object.entries(states)
      .sort(([, a], [, b]) => {
        if (a.value == null) return 1;
        if (b.value == null) return -1;
        return b.value - a.value;
      });

    sorted.forEach(([code, state]) => {
      const row = document.createElement('div');
      row.className = 'panel-state-row' + (state.value == null ? ' no-data' : '');
      row.dataset.code = code;
      row.innerHTML = `
        <span class="panel-rank">${state.rank != null ? '#' + state.rank : '—'}</span>
        <span class="panel-state-name">${escHtml(state.name)}</span>
        <span class="panel-value">${FMT.auto(state.value, mapData.unit)}</span>
      `;
      row.addEventListener('mouseenter', () => highlightPanelState(code));
      row.addEventListener('mouseleave', () => {
        document.querySelectorAll('.panel-state-row').forEach(r => r.classList.remove('highlighted'));
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

      const header = document.createElement('div');
      header.className = 'section-header';
      header.innerHTML = `<h2>${escHtml(block.title || '')}</h2>`;
      if (block.subtitle) {
        const sub = document.createElement('p');
        sub.textContent = block.subtitle;
        header.appendChild(sub);
      }
      if (block.modelled) {
        header.innerHTML += `<div style="margin-top:6px;"><span class="modelled-badge">Modelled estimate</span></div>`;
      }
      section.appendChild(header);

      const chartEl = document.createElement('div');
      chartEl.className = 'chart-render-area';
      section.appendChild(chartEl);

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
            colorA:    block.colorA || 'var(--w2)',
            colorB:    block.colorB || 'var(--accent-saffron)',
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

    tabs.forEach((tab, i) => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (i === 0 ? ' active' : '');
      btn.textContent = tab.label;
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
      container.innerHTML = `<div style="padding:32px;color:var(--text-muted);text-align:center;">
        <p style="margin-bottom:8px;color:var(--chart-bad);">⚠ Data not available</p>
        <p style="font-size:0.82rem;">${escHtml(msg)}</p>
        <p style="font-size:0.78rem;margin-top:8px;">Run <code>node scripts/extract/${slug}.js --mock</code> to generate mock data.</p>
      </div>`;
    }
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
})();
