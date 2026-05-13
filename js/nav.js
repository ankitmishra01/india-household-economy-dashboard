/**
 * Renders site navigation from pages-manifest.json.
 * Injects brand mark, tricolor strip, pill actions, theme dropdowns.
 * Marks active theme from body[data-theme].
 */
(function () {
  const currentTheme = document.body.getAttribute('data-theme') || '';

  /* Apply saved palette/display preferences */
  const savedPalette = localStorage.getItem('dashboard:palette') || 'midnight-mango';
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
        const btn = document.createElement('button');
        btn.className = (theme.id === currentTheme ? 'active' : '');
        btn.textContent = theme.label;
        btn.setAttribute('aria-haspopup', 'true');

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

      actions.appendChild(aboutPill);
      actions.appendChild(githubPill);
      inner.appendChild(actions);

      header.appendChild(inner);

      /* Tricolor hairline strip */
      const tricolor = document.createElement('div');
      tricolor.className = 'tricolor';
      tricolor.setAttribute('aria-hidden', 'true');
      header.appendChild(tricolor);
    })
    .catch(() => { /* nav fails silently */ });

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
