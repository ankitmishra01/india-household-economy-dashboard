/**
 * Sortable, filterable data table with CSV export.
 */
const TableRenderer = (function () {
  let _currentData = [];
  let _columns     = [];
  let _sortCol     = null;
  let _sortAsc     = false;

  function render(opts) {
    const { tableData, headEl, bodyEl, searchEl, csvBtn } = opts;
    if (!tableData || !tableData.rows || !tableData.columns) return;

    _columns     = tableData.columns;
    _currentData = [...tableData.rows];
    _sortCol     = null;
    _sortAsc     = false;

    // Header
    headEl.innerHTML = '';
    const tr = document.createElement('tr');
    _columns.forEach((col, i) => {
      const th = document.createElement('th');
      th.innerHTML = `${escHtml(col.label)} <span class="sort-icon">⇅</span>`;
      th.dataset.idx = i;
      th.addEventListener('click', () => {
        if (_sortCol === i) {
          _sortAsc = !_sortAsc;
        } else {
          _sortCol = i;
          _sortAsc = false;
        }
        headEl.querySelectorAll('th').forEach(t => t.classList.remove('sorted'));
        th.classList.add('sorted');
        th.querySelector('.sort-icon').textContent = _sortAsc ? '↑' : '↓';
        paintBody(bodyEl);
      });
      tr.appendChild(th);
    });
    headEl.appendChild(tr);

    paintBody(bodyEl);

    // Search
    if (searchEl) {
      searchEl.addEventListener('input', () => {
        paintBody(bodyEl, searchEl.value.trim().toLowerCase());
      });
    }

    // CSV export
    if (csvBtn) {
      csvBtn.addEventListener('click', () => exportCsv(tableData));
    }
  }

  function paintBody(bodyEl, filter = '') {
    let rows = [..._currentData];

    if (filter) {
      rows = rows.filter(row =>
        row.some(cell => String(cell ?? '').toLowerCase().includes(filter))
      );
    }

    if (_sortCol != null) {
      rows.sort((a, b) => {
        const va = a[_sortCol], vb = b[_sortCol];
        const na = parseFloat(va), nb = parseFloat(vb);
        if (!isNaN(na) && !isNaN(nb)) return _sortAsc ? na - nb : nb - na;
        return _sortAsc
          ? String(va ?? '').localeCompare(String(vb ?? ''))
          : String(vb ?? '').localeCompare(String(va ?? ''));
      });
    }

    bodyEl.innerHTML = '';
    rows.forEach((row, rowIdx) => {
      const tr = document.createElement('tr');
      row.forEach((cell, colIdx) => {
        const td = document.createElement('td');
        const isNum = _columns[colIdx]?.type === 'number';
        if (isNum) td.className = 'num';
        td.textContent = cell ?? '—';
        tr.appendChild(td);
      });
      bodyEl.appendChild(tr);
    });

    if (!rows.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = _columns.length;
      td.textContent = 'No results.';
      td.style.color = 'var(--text-muted)';
      td.style.textAlign = 'center';
      td.style.padding = '16px';
      tr.appendChild(td);
      bodyEl.appendChild(tr);
    }
  }

  function exportCsv(tableData) {
    const header = tableData.columns.map(c => `"${String(c.label).replace(/"/g,'""')}"`).join(',');
    const rows   = tableData.rows.map(row =>
      row.map(cell => {
        const s = String(cell ?? '');
        return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
      }).join(',')
    );
    const csv  = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = (document.body.dataset.page || 'data') + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { render };
})();
