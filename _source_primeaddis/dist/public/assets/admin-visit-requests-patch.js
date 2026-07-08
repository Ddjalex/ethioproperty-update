(function () {
  var PATCH_KEY = '__primeAddisVisitRequestsPatch_v1__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  /* ── Styles ── */
  function ensureStyles() {
    if (document.getElementById('vr-patch-style')) return;
    var s = document.createElement('style');
    s.id = 'vr-patch-style';
    s.textContent = [
      '#vr-page { font-family: inherit; padding: 32px; max-width: 1100px; margin: 0 auto; }',
      '#vr-page h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }',
      '#vr-page .vr-sub { color: #64748b; font-size: 14px; margin-bottom: 24px; }',
      '#vr-page .vr-toolbar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }',
      '#vr-page .vr-search { flex: 1; min-width: 200px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; }',
      '#vr-page .vr-search:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }',
      '#vr-page .vr-filter { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; background: #fff; cursor: pointer; }',
      '#vr-page .vr-back { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; cursor: pointer; color: #334155; text-decoration: none; }',
      '#vr-page .vr-back:hover { background: #e2e8f0; }',
      '#vr-page table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.08); }',
      '#vr-page thead { background: #f8fafc; }',
      '#vr-page th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid #e2e8f0; }',
      '#vr-page td { padding: 14px 16px; font-size: 14px; color: #1e293b; border-bottom: 1px solid #f1f5f9; vertical-align: top; }',
      '#vr-page tr:last-child td { border-bottom: none; }',
      '#vr-page tr:hover td { background: #f8fafc; }',
      '#vr-page .vr-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }',
      '#vr-page .vr-badge.New { background: #dbeafe; color: #1d4ed8; }',
      '#vr-page .vr-badge.Confirmed { background: #dcfce7; color: #15803d; }',
      '#vr-page .vr-badge.Completed { background: #f0fdf4; color: #166534; }',
      '#vr-page .vr-badge.Cancelled { background: #fee2e2; color: #b91c1c; }',
      '#vr-page .vr-select { padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; background: #fff; cursor: pointer; }',
      '#vr-page .vr-del { padding: 4px 10px; background: #fee2e2; color: #b91c1c; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600; }',
      '#vr-page .vr-del:hover { background: #fecaca; }',
      '#vr-page .vr-empty { text-align: center; color: #94a3b8; padding: 48px 0; font-size: 15px; }',
      '#vr-page .vr-count { font-size: 13px; color: #64748b; margin-left: auto; }',
      '.vr-sidebar-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #334155; cursor: pointer; text-align: left; transition: background .15s; }',
      '.vr-sidebar-btn:hover { background: #f1f5f9; }',
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── Render visit requests page ── */
  var vrData = [];
  var vrFilter = 'All';
  var vrSearch = '';

  function renderPage() {
    var root = document.getElementById('root');
    if (!root) return;

    var filtered = vrData.filter(function (r) {
      var matchStatus = vrFilter === 'All' || r.status === vrFilter;
      var q = vrSearch.toLowerCase();
      var matchSearch = !q ||
        (r.name || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.propertyTitle || '').toLowerCase().includes(q) ||
        (r.phone || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });

    var rows = filtered.length === 0
      ? '<tr><td colspan="8" class="vr-empty">No visit requests found</td></tr>'
      : filtered.map(function (r) {
        var date = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : '—';
        var visitDate = r.visitDate ? new Date(r.visitDate).toLocaleDateString('en-GB') : '—';
        return '<tr>' +
          '<td>' + date + '</td>' +
          '<td><strong>' + esc(r.name) + '</strong></td>' +
          '<td>' + esc(r.email) + '</td>' +
          '<td>' + esc(r.phone) + '</td>' +
          '<td>' + esc(r.propertyTitle || '—') + '</td>' +
          '<td>' + visitDate + '</td>' +
          '<td><span class="vr-badge ' + esc(r.status) + '">' + esc(r.status) + '</span></td>' +
          '<td style="display:flex;gap:6px;align-items:center;">' +
            '<select class="vr-select" onchange="window.__vrUpdateStatus(' + r.id + ', this.value)">' +
              ['New','Confirmed','Completed','Cancelled'].map(function(s){ return '<option value="'+s+'"'+(r.status===s?' selected':'')+'>'+s+'</option>'; }).join('') +
            '</select>' +
            '<button class="vr-del" onclick="window.__vrDelete(' + r.id + ')">Delete</button>' +
          '</td>' +
        '</tr>';
      }).join('');

    var html = '<div id="vr-page">' +
      '<div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:20px;">' +
        '<div>' +
          '<h1>Schedule Visit Requests</h1>' +
          '<p class="vr-sub">Manage and respond to visit requests from customers</p>' +
        '</div>' +
        '<div style="margin-left:auto;">' +
          '<a class="vr-back" href="/admin/dashboard">&#8592; Back to Dashboard</a>' +
        '</div>' +
      '</div>' +
      '<div class="vr-toolbar">' +
        '<input class="vr-search" id="vr-search-input" placeholder="Search by name, email, property..." value="'+esc(vrSearch)+'" oninput="window.__vrSearch(this.value)" />' +
        '<select class="vr-filter" onchange="window.__vrFilter(this.value)">' +
          ['All','New','Confirmed','Completed','Cancelled'].map(function(s){return '<option value="'+s+'"'+(vrFilter===s?' selected':'')+'>'+s+'</option>';}).join('') +
        '</select>' +
        '<span class="vr-count">' + filtered.length + ' of ' + vrData.length + ' requests</span>' +
      '</div>' +
      '<table>' +
        '<thead><tr>' +
          '<th>Submitted</th><th>Name</th><th>Email</th><th>Phone</th><th>Property</th><th>Visit Date</th><th>Status</th><th>Actions</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';

    root.innerHTML = html;
  }

  function esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function loadAndRender() {
    fetch('/api/admin/visit-requests', { credentials: 'include' })
      .then(function(r){ return r.json(); })
      .then(function(data) {
        vrData = Array.isArray(data) ? data : [];
        renderPage();
      })
      .catch(function(err) {
        console.error('Failed to load visit requests:', err);
        vrData = [];
        renderPage();
      });
  }

  window.__vrUpdateStatus = function(id, status) {
    fetch('/api/admin/visit-requests/' + id, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status })
    }).then(function(r){ return r.json(); }).then(function(updated) {
      var idx = vrData.findIndex(function(r){ return r.id === id; });
      if (idx >= 0) { vrData[idx] = updated; renderPage(); }
    }).catch(function(e){ console.error('Update failed', e); });
  };

  window.__vrDelete = function(id) {
    if (!confirm('Delete this visit request?')) return;
    fetch('/api/admin/visit-requests/' + id, {
      method: 'DELETE',
      credentials: 'include'
    }).then(function() {
      vrData = vrData.filter(function(r){ return r.id !== id; });
      renderPage();
    }).catch(function(e){ console.error('Delete failed', e); });
  };

  window.__vrSearch = function(q) { vrSearch = q; renderPage(); };
  window.__vrFilter = function(f) { vrFilter = f; renderPage(); };
  window.__vrNav = function() { schedule(); };

  /* ── Add sidebar button to admin dashboard ── */
  function addSidebarButton() {
    if (!/^\/admin/i.test(location.pathname)) return;
    if (location.pathname.includes('visit-requests')) return;

    var allEls = Array.from(document.querySelectorAll('button, a'));
    var inquiriesBtn = allEls.find(function(b){ return b.textContent.trim() === 'View All Inquiries'; });
    if (!inquiriesBtn) return;

    var container = inquiriesBtn.closest('.space-y-2') || inquiriesBtn.closest('div') || inquiriesBtn.parentElement;
    if (!container) return;

    if (document.getElementById('vr-sidebar-btn')) return;

    var vrBtn = document.createElement('a');
    vrBtn.id = 'vr-sidebar-btn';
    vrBtn.className = inquiriesBtn.className;
    vrBtn.href = '/admin/visit-requests';
    vrBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Manage Visit Requests';
    vrBtn.addEventListener('click', function(e) {
      e.preventDefault();
      history.pushState(null, '', '/admin/visit-requests');
      schedule();
    });

    /* Insert right after "View All Property Requests" if found, else after inquiries btn */
    var propReqBtn = allEls.find(function(b){ return b.textContent.trim() === 'View All Property Requests'; });
    var insertAfter = propReqBtn || inquiriesBtn;
    if (insertAfter.nextSibling) {
      container.insertBefore(vrBtn, insertAfter.nextSibling);
    } else {
      container.appendChild(vrBtn);
    }
  }

  /* ── Route handler ── */
  function handleRoute() {
    var path = location.pathname;
    ensureStyles();
    if (path === '/admin/visit-requests') {
      loadAndRender();
    } else if (/^\/admin/.test(path)) {
      addSidebarButton();
    }
  }

  var timer;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(handleRoute, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  new MutationObserver(function(mutations) {
    if (mutations.some(function(m){ return m.addedNodes.length > 0; })) schedule();
  }).observe(document.documentElement, { childList: true, subtree: true });

  var _push = history.pushState;
  history.pushState = function() { _push.apply(this, arguments); schedule(); };
  window.addEventListener('popstate', schedule);

  setTimeout(schedule, 600);
  setTimeout(schedule, 1500);
})();
