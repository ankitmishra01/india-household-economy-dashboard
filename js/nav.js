/**
 * Renders site navigation from pages-manifest.json.
 * Injects brand mark, tricolor strip, pill actions, theme dropdowns.
 * Marks active theme from body[data-theme].
 */
(function () {
  const currentTheme = document.body.getAttribute('data-theme') || '';

  /* Apply saved palette/display preferences — fall back to OS dark/light preference */
  const osPref = window.matchMedia('(prefers-color-scheme: light)').matches ? 'paper-white' : 'midnight-mango';
  const savedPalette = localStorage.getItem('dashboard:palette') || osPref;
  const savedDisplay = localStorage.getItem('dashboard:display') || 'bricolage';
  document.body.dataset.palette = savedPalette;
  document.body.dataset.display = savedDisplay;

  fetch('/data/pages-manifest.json')
    .then(r => r.json())
    .then(manifest => {
      const header = document.getElementById('site-header');
      if (!header) return;

      /* Rebuild header as new structure */
      header.innerHTML = '';
      header.style.height = '';
      header.style.display = '';

      const inner = document.createElement('div');
      inner.className = 'site-header-inner';

      /* Brand mark + name */
      const brand = document.createElement('a');
      brand.href = '/';
      brand.className = 'brand';
      brand.setAttribute('aria-label', 'India Economy home');

      const mark = document.createElement('div');
      mark.className = 'brand-mark';
      mark.setAttribute('aria-hidden', 'true');

      const name = document.createElement('div');
      name.className = 'brand-name';
      name.innerHTML = 'India <em>Economy</em>';

      brand.appendChild(mark);
      brand.appendChild(name);
      inner.appendChild(brand);

      /* Center nav */
      const nav = document.createElement('nav');
      nav.className = 'links';
      nav.setAttribute('aria-label', 'Main navigation');
      nav.id = 'site-nav';

      const pageMap = {};
      manifest.pages.forEach(p => { pageMap[p.slug] = p; });

      manifest.themes.forEach(theme => {
        const firstSlug = theme.slugs[0];

        // Theme label is a direct link to the first page — always navigates on click
        const btn = document.createElement('a');
        btn.href = firstSlug ? `/pages/${firstSlug}/` : '#';
        btn.className = 'nav-theme-link' + (theme.id === currentTheme ? ' active' : '');
        btn.textContent = theme.label;

        const dropdown = document.createElement('div');
        dropdown.className = 'nav-dropdown';
        dropdown.setAttribute('role', 'menu');

        theme.slugs.forEach(slug => {
          const page = pageMap[slug];
          if (!page) return;
          const link = document.createElement('a');
          link.href = `/pages/${slug}/`;
          link.setAttribute('role', 'menuitem');
          link.innerHTML = escHtml(page.title) + (page.source ? `<span>${escHtml(page.source)}</span>` : '');
          dropdown.appendChild(link);
        });

        const item = document.createElement('div');
        item.className = 'nav-item' + (theme.id === currentTheme ? ' active' : '');
        item.appendChild(btn);
        item.appendChild(dropdown);
        nav.appendChild(item);
      });

      inner.appendChild(nav);

      /* Right pill actions */
      const actions = document.createElement('div');
      actions.className = 'nav-actions';

      const aboutPill = document.createElement('a');
      aboutPill.href = '/about.html';
      aboutPill.className = 'pill';
      aboutPill.textContent = 'About';

      const githubPill = document.createElement('a');
      githubPill.href = 'https://github.com/ankitmishra01/india-household-economy-dashboard';
      githubPill.className = 'pill solid';
      githubPill.textContent = '↗ GitHub';
      githubPill.target = '_blank';
      githubPill.rel = 'noopener';

      /* Search button (desktop + mobile) */
      const searchBtn = document.createElement('button');
      searchBtn.className = 'nav-search-btn';
      searchBtn.setAttribute('aria-label', 'Search indicators');
      searchBtn.title = 'Search (⌘K)';
      searchBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
      searchBtn.addEventListener('click', openSearch);
      actions.appendChild(searchBtn);

      actions.appendChild(aboutPill);
      actions.appendChild(githubPill);

      /* Mobile hamburger */
      const hamburger = document.createElement('button');
      hamburger.className = 'nav-hamburger';
      hamburger.setAttribute('aria-label', 'Open menu');
      hamburger.innerHTML = '<span></span><span></span><span></span>';
      inner.appendChild(actions);
      inner.appendChild(hamburger);

      header.appendChild(inner);

      /* Tricolor hairline strip */
      const tricolor = document.createElement('div');
      tricolor.className = 'tricolor';
      tricolor.setAttribute('aria-hidden', 'true');
      header.appendChild(tricolor);

      /* Mobile drawer */
      const drawer = document.createElement('div');
      drawer.className = 'nav-drawer';
      drawer.setAttribute('aria-hidden', 'true');
      const drawerInner = document.createElement('div');
      drawerInner.className = 'nav-drawer-inner';

      manifest.themes.forEach(theme => {
        const themeHead = document.createElement('div');
        themeHead.className = 'drawer-theme-head';
        themeHead.textContent = theme.label;
        drawerInner.appendChild(themeHead);
        theme.slugs.forEach(slug => {
          const page = pageMap[slug];
          if (!page) return;
          const a = document.createElement('a');
          a.href = `/pages/${slug}/`;
          a.className = 'drawer-link';
          a.textContent = page.title;
          a.addEventListener('click', closeDrawer);
          drawerInner.appendChild(a);
        });
      });

      const drawerAbout = document.createElement('a');
      drawerAbout.href = '/about.html';
      drawerAbout.className = 'drawer-link drawer-about';
      drawerAbout.textContent = 'About';
      drawerInner.appendChild(drawerAbout);

      drawer.appendChild(drawerInner);
      document.body.appendChild(drawer);

      let drawerOpen = false;
      hamburger.addEventListener('click', () => {
        drawerOpen = !drawerOpen;
        drawer.classList.toggle('open', drawerOpen);
        drawer.setAttribute('aria-hidden', String(!drawerOpen));
        hamburger.classList.toggle('open', drawerOpen);
        document.body.style.overflow = drawerOpen ? 'hidden' : '';
      });

      function closeDrawer() {
        drawerOpen = false;
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        hamburger.classList.remove('open');
        document.body.style.overflow = '';
      }

      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

      /* ── Search modal ── */
      buildSearchModal(manifest);
    })
    .catch(() => { /* nav fails silently */ });

  /* Global Cmd+K shortcut */
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  });

  function openSearch() {
    const modal = document.getElementById('search-modal');
    if (!modal) return;
    modal.classList.add('open');
    modal.querySelector('.search-input')?.focus();
  }

  function buildSearchModal(manifest) {
    const modal = document.createElement('div');
    modal.id = 'search-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Search indicators');

    const backdrop = document.createElement('div');
    backdrop.className = 'search-backdrop';
    backdrop.addEventListener('click', closeSearch);

    const box = document.createElement('div');
    box.className = 'search-box';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'search-input';
    input.placeholder = 'Search indicators…';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');

    const results = document.createElement('div');
    results.className = 'search-results';

    const themeMap = {};
    manifest.themes.forEach(t => t.slugs.forEach(s => { themeMap[s] = t.label; }));

    const allPages = manifest.pages.map(p => ({
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle || '',
      theme: themeMap[p.slug] || '',
      source: p.source || '',
    }));

    function renderResults(query) {
      const q = query.toLowerCase().trim();
      const hits = q
        ? allPages.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.subtitle.toLowerCase().includes(q) ||
            p.theme.toLowerCase().includes(q)
          )
        : allPages;
      results.innerHTML = '';
      if (!hits.length) {
        results.innerHTML = '<div class="search-empty">No results</div>';
        return;
      }
      hits.slice(0, 8).forEach(p => {
        const row = document.createElement('a');
        row.href = `/pages/${p.slug}/`;
        row.className = 'search-result-row';
        row.innerHTML = `
          <div class="sr-title">${escHtml(p.title)}</div>
          <div class="sr-meta">${escHtml(p.theme)}${p.source ? ' · ' + escHtml(p.source) : ''}</div>`;
        row.addEventListener('click', closeSearch);
        results.appendChild(row);
      });
    }

    renderResults('');
    input.addEventListener('input', () => renderResults(input.value));

    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeSearch();
      if (e.key === 'ArrowDown') {
        const first = results.querySelector('a');
        if (first) { e.preventDefault(); first.focus(); }
      }
    });

    results.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeSearch(); input.focus(); }
      if (e.key === 'ArrowDown') {
        const next = document.activeElement?.nextElementSibling;
        if (next) { e.preventDefault(); next.focus(); }
      }
      if (e.key === 'ArrowUp') {
        const prev = document.activeElement?.previousElementSibling;
        if (prev) { e.preventDefault(); prev.focus(); }
        else { e.preventDefault(); input.focus(); }
      }
    });

    box.appendChild(input);
    box.appendChild(results);
    modal.appendChild(backdrop);
    modal.appendChild(box);
    document.body.appendChild(modal);
  }

  function closeSearch() {
    const modal = document.getElementById('search-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.querySelector('.search-input').value = '';
  }

  /* Palette toggle in footer — injected after DOM load */
  document.addEventListener('DOMContentLoaded', function () {
    injectPaletteToggle();
    injectTilemapLegend();
  });

  function injectPaletteToggle() {
    const toggle = document.createElement('div');
    toggle.className = 'palette-toggle';
    toggle.setAttribute('aria-label', 'Switch colour palette');
    toggle.title = 'Switch palette';

    const palettes = [
      { key: 'midnight-mango', label: 'Midnight' },
      { key: 'khadi-ink',      label: 'Khadi & Ink' },
      { key: 'paper-white',    label: 'Paper White' },
    ];
    const current = document.body.dataset.palette || 'midnight-mango';

    palettes.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'pal-btn' + (p.key === current ? ' active' : '');
      btn.dataset.pal = p.key;
      btn.title = p.label;
      btn.setAttribute('aria-label', p.label);
      btn.addEventListener('click', function () {
        document.body.dataset.palette = p.key;
        localStorage.setItem('dashboard:palette', p.key);
        toggle.querySelectorAll('.pal-btn').forEach(b => b.classList.toggle('active', b.dataset.pal === p.key));
      });
      toggle.appendChild(btn);
    });

    document.body.appendChild(toggle);
  }

  function injectTilemapLegend() {
    /* Add inline 5-bucket legend to any .map-card that has a .legend-bar */
    document.querySelectorAll('.map-card .legend-bar').forEach(bar => {
      if (bar.children.length === 0) {
        for (let i = 0; i < 5; i++) {
          const span = document.createElement('span');
          bar.appendChild(span);
        }
      }
    });
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
})();
