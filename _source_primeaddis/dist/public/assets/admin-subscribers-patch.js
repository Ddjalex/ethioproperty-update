(function () {
  'use strict';
  var PATCH_KEY = '__primeAddisSubscribersPatch_v1__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  /* ── Styles ── */
  function ensureStyles() {
    if (document.getElementById('sub-patch-style')) return;
    var s = document.createElement('style');
    s.id = 'sub-patch-style';
    s.textContent = [
      '#sub-page { font-family: inherit; padding: 32px; max-width: 1100px; margin: 0 auto; }',
      '#sub-page h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }',
      '#sub-page .sub-desc { color: #64748b; font-size: 14px; margin-bottom: 24px; }',
      '#sub-page .sub-toolbar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }',
      '#sub-page .sub-search { flex: 1; min-width: 200px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; }',
      '#sub-page .sub-search:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }',
      '#sub-page .sub-back { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; cursor: pointer; color: #334155; text-decoration: none; }',
      '#sub-page .sub-back:hover { background: #e2e8f0; }',
      '#sub-page table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.08); }',
      '#sub-page thead { background: #f8fafc; }',
      '#sub-page th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid #e2e8f0; }',
      '#sub-page td { padding: 14px 16px; font-size: 14px; color: #1e293b; border-bottom: 1px solid #f1f5f9; vertical-align: top; }',
      '#sub-page tr:last-child td { border-bottom: none; }',
      '#sub-page tr:hover td { background: #f8fafc; }',
      '#sub-page .sub-interests { font-size: 12px; color: #64748b; max-width: 180px; line-height: 1.5; }',
      '#sub-page .sub-del { padding: 4px 10px; background: #fee2e2; color: #b91c1c; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600; }',
      '#sub-page .sub-del:hover { background: #fecaca; }',
      '#sub-page .sub-empty { text-align: center; color: #94a3b8; padding: 48px 0; font-size: 15px; }',
      '#sub-page .sub-count { font-size: 13px; color: #64748b; margin-left: auto; }',
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── Data ── */
  var subData = [];
  var subSearch = '';

  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderPage() {
    var root = document.getElementById('root');
    if (!root) return;

    var filtered = subData.filter(function (r) {
      var q = subSearch.toLowerCase();
      return !q ||
        (r.name || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.phone || '').toLowerCase().includes(q) ||
        (r.propertyInterests || '').toLowerCase().includes(q) ||
        (r.budget || '').toLowerCase().includes(q);
    });

    var rows = filtered.length === 0
      ? '<tr><td colspan="7" class="sub-empty">No property requests found</td></tr>'
      : filtered.map(function (r) {
          var date = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : '—';
          return '<tr>' +
            '<td>' + date + '</td>' +
            '<td><strong>' + esc(r.name) + '</strong></td>' +
            '<td><a href="mailto:' + esc(r.email) + '" style="color:#2563eb;text-decoration:none;">' + esc(r.email) + '</a></td>' +
            '<td>' + esc(r.phone || '—') + '</td>' +
            '<td>' + esc(r.budget || '—') + '</td>' +
            '<td class="sub-interests">' + esc(r.propertyInterests || '—') + '</td>' +
            '<td><button class="sub-del" onclick="window.__subDelete(' + r.id + ')">Delete</button></td>' +
          '</tr>';
        }).join('');

    var html = '<div id="sub-page">' +
      '<div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:20px;">' +
        '<div>' +
          '<h1>Property Update Requests</h1>' +
          '<p class="sub-desc">Visitors who submitted the "Request Property Updates" form</p>' +
        '</div>' +
        '<div style="margin-left:auto;">' +
          '<a class="sub-back" href="/admin/dashboard">&#8592; Back to Dashboard</a>' +
        '</div>' +
      '</div>' +
      '<div class="sub-toolbar">' +
        '<input class="sub-search" placeholder="Search by name, email, phone, interests..." value="' + esc(subSearch) + '" oninput="window.__subSearch(this.value)" />' +
        '<span class="sub-count">' + filtered.length + ' of ' + subData.length + ' requests</span>' +
      '</div>' +
      '<table>' +
        '<thead><tr>' +
          '<th>Date</th><th>Name</th><th>Email</th><th>Phone</th><th>Budget</th><th>Property Interests</th><th>Actions</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';

    root.innerHTML = html;
  }

  function loadAndRender() {
    fetch('/api/admin/subscribers', { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        subData = Array.isArray(data) ? data : [];
        renderPage();
      })
      .catch(function (err) {
        console.error('Failed to load subscribers:', err);
        subData = [];
        renderPage();
      });
  }

  window.__subDelete = function (id) {
    if (!confirm('Delete this property request?')) return;
    fetch('/api/admin/subscribers/' + id, {
      method: 'DELETE',
      credentials: 'include'
    }).then(function () {
      subData = subData.filter(function (r) { return r.id !== id; });
      renderPage();
    }).catch(function (e) { console.error('Delete failed', e); });
  };

  window.__subSearch = function (q) { subSearch = q; renderPage(); };

  /* ── Add sidebar button to admin dashboard ── */
  function addSidebarButton() {
    if (!/^\/admin/i.test(location.pathname)) return;
    if (location.pathname.includes('property-requests')) return;
    if (document.getElementById('sub-sidebar-btn')) return;

    var allEls = Array.from(document.querySelectorAll('button, a'));
    var inquiriesBtn = allEls.find(function (b) { return b.textContent.trim() === 'View All Inquiries'; });
    if (!inquiriesBtn) return;

    var container = inquiriesBtn.closest('.space-y-2') || inquiriesBtn.closest('div') || inquiriesBtn.parentElement;
    if (!container) return;

    var subBtn = document.createElement('a');
    subBtn.id = 'sub-sidebar-btn';
    subBtn.className = inquiriesBtn.className;
    subBtn.href = '/admin/property-requests';
    subBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg> View Property Requests';
    subBtn.addEventListener('click', function (e) {
      e.preventDefault();
      history.pushState(null, '', '/admin/property-requests');
      schedule();
    });

    container.appendChild(subBtn);
  }

  /* ── Route handler ── */
  function handleRoute() {
    var path = location.pathname;
    ensureStyles();
    if (path === '/admin/property-requests') {
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

  new MutationObserver(function (mutations) {
    if (mutations.some(function (m) { return m.addedNodes.length > 0; })) schedule();
  }).observe(document.documentElement, { childList: true, subtree: true });

  var _push = history.pushState;
  history.pushState = function () { _push.apply(this, arguments); schedule(); };
  window.addEventListener('popstate', schedule);

  setTimeout(schedule, 600);
  setTimeout(schedule, 1500);
})();
