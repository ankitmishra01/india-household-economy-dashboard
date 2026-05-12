/**
 * Renders the site navigation dynamically from pages-manifest.json.
 * Marks the active theme based on data-theme attribute on <body>.
 */
(function () {
  const currentTheme = document.body.getAttribute('data-theme') || '';

  fetch('/data/pages-manifest.json')
    .then(r => r.json())
    .then(manifest => {
      const nav   = document.getElementById('site-nav');
      if (!nav) return;

      const pageMap = {};
      manifest.pages.forEach(p => { pageMap[p.slug] = p; });

      manifest.themes.forEach(theme => {
        const item = document.createElement('div');
        item.className = 'nav-item' + (theme.id === currentTheme ? ' active' : '');

        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.textContent = theme.label + ' ▾';
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');

        const dropdown = document.createElement('div');
        dropdown.className = 'nav-dropdown';
        dropdown.setAttribute('role', 'menu');

        theme.slugs.forEach(slug => {
          const page = pageMap[slug];
          if (!page) return;
          const link = document.createElement('a');
          link.href = `/pages/${slug}/`;
          link.setAttribute('role', 'menuitem');
          link.innerHTML = `${escHtml(page.title)}<span>${escHtml(page.source || '')}</span>`;
          dropdown.appendChild(link);
        });

        item.appendChild(btn);
        item.appendChild(dropdown);
        nav.appendChild(item);
      });

      // Append static links
      const staticLinks = [
        { label: 'About', href: '/about.html' },
        { label: 'Data', href: '#data-sources' },
      ];
      // (These are in the header-right div, so we skip them here)
    })
    .catch(() => {/* nav fails silently — page still loads */});

  function escHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }
})();
