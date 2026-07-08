(function () {
  var PATCH_KEY = '__primeAddisAdminDashboardPatch_v2__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  // Only hide legacy content once we've confirmed the user is authenticated
  var adminAuthenticated = false;

  function ensureStyles() {
    if (document.getElementById('ad-patch-style')) return;
    var s = document.createElement('style');
    s.id = 'ad-patch-style';
    s.textContent = `
      .ad-dashboard-wrap {
        --ad-navy: #13213d;
        --ad-navy-2: #1B2A4A;
        --ad-gold: #C4922A;
        --ad-gold-2: #f4c95d;
        --ad-ink: #0f172a;
        --ad-muted: #64748b;
        --ad-soft: #f8fafc;
        --ad-line: #e2e8f0;
        --ad-success: #10b981;
        --ad-danger: #ef4444;
        --ad-blue: #3b82f6;
        --ad-purple: #8b5cf6;
        font-family: inherit;
        max-width: 1440px;
        margin: 0 auto;
        padding: 0 0 40px;
        color: var(--ad-ink);
      }
      .ad-shell {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .ad-hero {
        position: relative;
        overflow: hidden;
        border-radius: 26px;
        padding: 28px;
        color: #fff;
        background:
          radial-gradient(circle at top right, rgba(196,146,42,.42), transparent 34%),
          linear-gradient(135deg, #101a31 0%, #1B2A4A 52%, #263e70 100%);
        box-shadow: 0 26px 70px rgba(15, 23, 42, .18);
      }
      .ad-hero::after {
        content: '';
        position: absolute;
        inset: auto -80px -120px auto;
        width: 320px;
        height: 320px;
        border-radius: 999px;
        background: rgba(255,255,255,.09);
      }
      .ad-hero-row {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
      }
      .ad-kicker {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border: 1px solid rgba(255,255,255,.2);
        border-radius: 999px;
        background: rgba(255,255,255,.1);
        color: rgba(255,255,255,.88);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .ad-live-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #22c55e;
        box-shadow: 0 0 0 5px rgba(34,197,94,.16);
      }
      .ad-title {
        margin: 16px 0 8px;
        max-width: 740px;
        font-size: clamp(30px, 4vw, 48px);
        line-height: 1.02;
        letter-spacing: -.04em;
        font-weight: 900;
      }
      .ad-subtitle {
        max-width: 760px;
        color: rgba(255,255,255,.76);
        font-size: 15px;
        line-height: 1.7;
      }
      .ad-hero-meta {
        min-width: 220px;
        padding: 16px;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 20px;
        background: rgba(255,255,255,.1);
        backdrop-filter: blur(10px);
      }
      .ad-hero-meta-label {
        color: rgba(255,255,255,.68);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .08em;
      }
      .ad-hero-meta-value {
        margin-top: 6px;
        font-size: 22px;
        font-weight: 900;
      }
      .ad-hero-metrics {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-top: 26px;
      }
      .ad-hero-tile {
        padding: 16px;
        border-radius: 18px;
        background: rgba(255,255,255,.1);
        border: 1px solid rgba(255,255,255,.16);
      }
      .ad-hero-tile-label {
        color: rgba(255,255,255,.68);
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .08em;
      }
      .ad-hero-tile-value {
        margin-top: 8px;
        font-size: 26px;
        font-weight: 900;
        letter-spacing: -.03em;
      }
      .ad-hero-tile-note {
        margin-top: 5px;
        color: rgba(255,255,255,.68);
        font-size: 12px;
      }
      .ad-grid {
        display: grid;
        gap: 18px;
      }
      .ad-grid-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .ad-grid-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .ad-grid-2-1 {
        grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
      }
      .ad-grid-1-1 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .ad-card, .ad-section {
        position: relative;
        overflow: hidden;
        border-radius: 22px;
        border: 1px solid rgba(226,232,240,.9);
        background: rgba(255,255,255,.96);
        box-shadow: 0 16px 44px rgba(15, 23, 42, .06);
      }
      .ad-card {
        padding: 20px;
        min-height: 156px;
      }
      .ad-card-top {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }
      .ad-card-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 14px;
        color: #fff;
        background: var(--ad-navy-2);
        box-shadow: 0 10px 25px rgba(27,42,74,.18);
        font-size: 13px;
        font-weight: 900;
      }
      .ad-card-icon.gold { background: linear-gradient(135deg, #b8871e, #e5b94e); }
      .ad-card-icon.green { background: linear-gradient(135deg, #059669, #34d399); }
      .ad-card-icon.blue { background: linear-gradient(135deg, #2563eb, #60a5fa); }
      .ad-card-icon.purple { background: linear-gradient(135deg, #7c3aed, #a78bfa); }
      .ad-card-label {
        color: var(--ad-muted);
        font-size: 12px;
        font-weight: 900;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .ad-card-value {
        margin-top: 12px;
        color: var(--ad-ink);
        font-size: clamp(26px, 3vw, 36px);
        line-height: 1;
        font-weight: 950;
        letter-spacing: -.05em;
      }
      .ad-card-sub {
        margin-top: 8px;
        color: var(--ad-muted);
        font-size: 13px;
        line-height: 1.5;
      }
      .ad-trend {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 9px;
        border-radius: 999px;
        background: #ecfdf5;
        color: #047857;
        font-size: 12px;
        font-weight: 900;
        white-space: nowrap;
      }
      .ad-trend.warn { background: #fff7ed; color: #c2410c; }
      .ad-trend.neutral { background: #eff6ff; color: #1d4ed8; }
      .ad-section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 14px;
        padding: 20px 22px 16px;
        border-bottom: 1px solid #eef2f7;
      }
      .ad-section-title {
        margin: 0;
        color: var(--ad-ink);
        font-size: 17px;
        font-weight: 900;
        letter-spacing: -.02em;
      }
      .ad-section-subtitle {
        margin-top: 5px;
        color: var(--ad-muted);
        font-size: 13px;
        line-height: 1.5;
      }
      .ad-section-body {
        padding: 20px 22px 22px;
      }
      .ad-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 10px;
        border-radius: 999px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #475569;
        font-size: 12px;
        font-weight: 800;
        white-space: nowrap;
      }
      .ad-bars {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .ad-bar-row {
        display: grid;
        grid-template-columns: minmax(90px, 150px) 1fr minmax(40px, auto);
        align-items: center;
        gap: 12px;
      }
      .ad-bar-label {
        min-width: 0;
        color: #334155;
        font-size: 13px;
        font-weight: 800;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ad-bar-track {
        height: 11px;
        overflow: hidden;
        border-radius: 999px;
        background: #edf2f7;
      }
      .ad-bar-fill {
        height: 100%;
        min-width: 3px;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--ad-navy-2), var(--ad-gold));
      }
      .ad-bar-value {
        color: #475569;
        font-size: 12px;
        font-weight: 900;
        text-align: right;
      }
      .ad-donut-layout {
        display: grid;
        grid-template-columns: 180px 1fr;
        align-items: center;
        gap: 20px;
      }
      .ad-donut {
        width: 180px;
        height: 180px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: conic-gradient(var(--ad-gold) 0deg, var(--ad-gold) var(--ad-donut-a), var(--ad-blue) var(--ad-donut-a), var(--ad-blue) var(--ad-donut-b), var(--ad-success) var(--ad-donut-b), var(--ad-success) var(--ad-donut-c), #e5e7eb var(--ad-donut-c) 360deg);
        box-shadow: inset 0 0 0 1px rgba(15,23,42,.04);
      }
      .ad-donut-center {
        width: 116px;
        height: 116px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #fff;
        text-align: center;
        box-shadow: 0 10px 24px rgba(15,23,42,.08);
      }
      .ad-donut-number {
        font-size: 30px;
        font-weight: 950;
        letter-spacing: -.05em;
      }
      .ad-donut-caption {
        color: var(--ad-muted);
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .06em;
      }
      .ad-legend {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .ad-legend-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 14px;
        background: #f8fafc;
      }
      .ad-legend-name {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        color: #334155;
        font-size: 13px;
        font-weight: 800;
      }
      .ad-dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--ad-gold);
      }
      .ad-dot.blue { background: var(--ad-blue); }
      .ad-dot.green { background: var(--ad-success); }
      .ad-dot.gray { background: #94a3b8; }
      .ad-legend-value {
        color: var(--ad-ink);
        font-size: 13px;
        font-weight: 950;
      }
      .ad-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .ad-list-item {
        display: grid;
        grid-template-columns: 40px 1fr auto;
        align-items: center;
        gap: 12px;
        padding: 13px;
        border: 1px solid #eef2f7;
        border-radius: 16px;
        background: #fff;
      }
      .ad-list-token {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 14px;
        background: #f1f5f9;
        color: var(--ad-navy-2);
        font-size: 12px;
        font-weight: 950;
      }
      .ad-list-title {
        color: var(--ad-ink);
        font-size: 13px;
        font-weight: 900;
        line-height: 1.35;
      }
      .ad-list-desc {
        margin-top: 3px;
        color: var(--ad-muted);
        font-size: 12px;
        line-height: 1.45;
      }
      .ad-list-meta {
        text-align: right;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 800;
        white-space: nowrap;
      }
      .ad-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 5px 9px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .04em;
        text-transform: uppercase;
      }
      .ad-badge.green { background: #dcfce7; color: #166534; }
      .ad-badge.blue { background: #dbeafe; color: #1e40af; }
      .ad-badge.yellow { background: #fef9c3; color: #854d0e; }
      .ad-badge.red { background: #fee2e2; color: #991b1b; }
      .ad-badge.gray { background: #f1f5f9; color: #475569; }
      .ad-badge.dark { background: #e2e8f0; color: #0f172a; }
      .ad-action-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .ad-action {
        display: flex;
        width: 100%;
        font-family: inherit;
        text-align: left;
        cursor: pointer;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        background: #fff;
        color: #1e293b;
        text-decoration: none;
        transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
      }
      .ad-action:hover {
        transform: translateY(-2px);
        border-color: rgba(196,146,42,.55);
        box-shadow: 0 16px 34px rgba(15,23,42,.08);
      }
      .ad-action-main {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .ad-action-token {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 12px;
        color: #fff;
        background: var(--ad-navy-2);
        font-size: 12px;
        font-weight: 950;
      }
      .ad-action-label {
        font-size: 13px;
        font-weight: 900;
      }
      .ad-action-note {
        margin-top: 2px;
        color: var(--ad-muted);
        font-size: 11px;
        font-weight: 700;
      }
      .ad-arrow {
        color: #94a3b8;
        font-weight: 900;
      }
      .ad-priority {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .ad-priority-card {
        padding: 14px;
        border-radius: 16px;
        border: 1px solid #fed7aa;
        background: linear-gradient(135deg, #fff7ed, #fff);
      }
      .ad-priority-card.blue {
        border-color: #bfdbfe;
        background: linear-gradient(135deg, #eff6ff, #fff);
      }
      .ad-priority-card.green {
        border-color: #bbf7d0;
        background: linear-gradient(135deg, #f0fdf4, #fff);
      }
      .ad-priority-title {
        color: var(--ad-ink);
        font-size: 13px;
        font-weight: 950;
      }
      .ad-priority-copy {
        margin-top: 4px;
        color: var(--ad-muted);
        font-size: 12px;
        line-height: 1.5;
      }
      .ad-empty {
        padding: 24px;
        border: 1px dashed #cbd5e1;
        border-radius: 18px;
        background: #f8fafc;
        color: #64748b;
        text-align: center;
        font-size: 13px;
        font-weight: 800;
      }
      .ad-loader {
        display: grid;
        place-items: center;
        min-height: 260px;
        color: #64748b;
        font-weight: 900;
      }
      .ad-injected-container {
        margin-top: 18px;
        animation: adFadeIn .28s ease-out both;
      }
      html.pa-admin-dashboard-open,
      html.pa-admin-dashboard-open body {
        height: auto !important;
        min-height: 100% !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
      }
      html.pa-admin-dashboard-open #root,
      html.pa-admin-dashboard-open main,
      html.pa-admin-dashboard-open [role="main"],
      html.pa-admin-dashboard-open [data-ad-dashboard-main="true"] {
        height: auto !important;
        min-height: 100vh !important;
        max-height: none !important;
        overflow: visible !important;
      }
      html.pa-admin-dashboard-open #ad-patch-container,
      html.pa-admin-dashboard-open .ad-dashboard-wrap,
      html.pa-admin-dashboard-open .ad-shell {
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
      }
      html.pa-admin-dashboard-open #ad-patch-container {
        position: relative;
        z-index: 20;
        isolation: isolate;
        background: #f8fafc;
      }
      html.pa-admin-dashboard-open [data-ad-hidden="true"],
      html.pa-admin-dashboard-open footer {
        display: none !important;
      }
      html.pa-admin-dashboard-open #pa-fab-wrap,
      html.pa-admin-dashboard-open iframe[src*="tawk"],
      html.pa-admin-dashboard-open iframe[title*="chat"] {
        display: none !important;
      }
      @keyframes adFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (max-width: 1180px) {
        .ad-grid-4, .ad-hero-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .ad-grid-3, .ad-grid-2-1, .ad-grid-1-1 { grid-template-columns: 1fr; }
      }
      @media (max-width: 760px) {
        html.pa-admin-dashboard-open body {
          padding-bottom: env(safe-area-inset-bottom);
        }
        #ad-patch-container.ad-injected-container {
          position: fixed;
          top: 76px;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 80;
          width: 100%;
          height: auto !important;
          max-height: none !important;
          margin: 0;
          padding: 12px 12px 160px;
          box-sizing: border-box;
          overflow: auto !important;
          background: #f8fafc;
          -webkit-overflow-scrolling: touch;
        }
        .ad-dashboard-wrap {
          width: 100%;
          max-width: 100%;
          padding-bottom: 32px;
        }
        .ad-hero { padding: 22px; border-radius: 22px; }
        .ad-hero-row { flex-direction: column; }
        .ad-hero-meta { width: 100%; min-width: 0; }
        .ad-hero-metrics, .ad-grid-4 { grid-template-columns: 1fr; }
        .ad-action-grid { grid-template-columns: 1fr; }
        .ad-donut-layout { grid-template-columns: 1fr; justify-items: center; }
        .ad-bar-row { grid-template-columns: 1fr; gap: 7px; }
        .ad-bar-value { text-align: left; }
        .ad-list-item { grid-template-columns: 40px 1fr; }
        .ad-list-meta { grid-column: 2; text-align: left; }
      }
    `;
    document.head.appendChild(s);
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function num(value) {
    var n = Number(value);
    return isFinite(n) ? n : 0;
  }

  function money(value) {
    var n = num(value);
    if (Math.abs(n) >= 1000000) return 'ETB ' + (n / 1000000).toFixed(n >= 10000000 ? 0 : 1) + 'M';
    if (Math.abs(n) >= 1000) return 'ETB ' + (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'K';
    return 'ETB ' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  }

  function int(value) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num(value));
  }

  function dateObj(value) {
    if (!value) return null;
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function daysAgo(value) {
    var d = dateObj(value);
    if (!d) return 99999;
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
  }

  function timeAgo(value) {
    var d = dateObj(value);
    if (!d) return 'No date';
    var diff = Date.now() - d.getTime();
    var mins = Math.max(1, Math.round(diff / 60000));
    if (mins < 60) return mins + ' min ago';
    var hours = Math.round(mins / 60);
    if (hours < 24) return hours + ' hr ago';
    var days = Math.round(hours / 24);
    if (days < 30) return days + ' days ago';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function cleanStatus(value) {
    return String(value || 'New').trim();
  }

  function statusKind(value) {
    var s = cleanStatus(value).toLowerCase();
    if (s.indexOf('new') >= 0 || s.indexOf('pending') >= 0 || s.indexOf('open') >= 0) return 'blue';
    if (s.indexOf('reply') >= 0 || s.indexOf('complete') >= 0 || s.indexOf('confirm') >= 0 || s.indexOf('active') >= 0 || s.indexOf('available') >= 0) return 'green';
    if (s.indexOf('sold') >= 0 || s.indexOf('rented') >= 0 || s.indexOf('cancel') >= 0 || s.indexOf('reject') >= 0) return 'red';
    if (s.indexOf('progress') >= 0 || s.indexOf('follow') >= 0) return 'yellow';
    return 'gray';
  }

  function isOpenStatus(value) {
    var s = cleanStatus(value).toLowerCase();
    return !s || s === 'new' || s.indexOf('pending') >= 0 || s.indexOf('open') >= 0 || s.indexOf('progress') >= 0 || s.indexOf('follow') >= 0;
  }

  function isClosedStatus(value) {
    var s = cleanStatus(value).toLowerCase();
    return s.indexOf('reply') >= 0 || s.indexOf('complete') >= 0 || s.indexOf('confirm') >= 0 || s.indexOf('closed') >= 0 || s.indexOf('done') >= 0;
  }

  function groupCount(items, getter) {
    var map = new Map();
    items.forEach(function (item) {
      var label = getter(item);
      label = label == null || label === '' ? 'Not specified' : String(label);
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).map(function (entry) { return { label: entry[0], value: entry[1] }; }).sort(function (a, b) { return b.value - a.value || a.label.localeCompare(b.label); });
  }

  function pct(value, total) {
    if (!total) return 0;
    return Math.max(0, Math.min(100, Math.round(value / total * 100)));
  }

  function sum(items, getter) {
    return items.reduce(function (acc, item) { return acc + num(getter(item)); }, 0);
  }

  function renderBars(rows, maxRows) {
    var top = rows.slice(0, maxRows || 6);
    var max = Math.max.apply(null, top.map(function (r) { return r.value; }).concat([1]));
    if (!top.length) return '<div class="ad-empty">No data available yet</div>';
    return '<div class="ad-bars">' + top.map(function (row) {
      return '<div class="ad-bar-row"><div class="ad-bar-label" title="' + esc(row.label) + '">' + esc(row.label) + '</div><div class="ad-bar-track"><div class="ad-bar-fill" style="width:' + pct(row.value, max) + '%"></div></div><div class="ad-bar-value">' + int(row.value) + '</div></div>';
    }).join('') + '</div>';
  }

  function renderList(items, emptyText) {
    if (!items.length) return '<div class="ad-empty">' + esc(emptyText || 'No activity yet') + '</div>';
    return '<div class="ad-list">' + items.map(function (item) {
      return '<div class="ad-list-item"><div class="ad-list-token">' + esc(item.token || 'PA') + '</div><div><div class="ad-list-title">' + esc(item.title) + '</div><div class="ad-list-desc">' + esc(item.desc) + '</div></div><div class="ad-list-meta"><span class="ad-badge ' + statusKind(item.status) + '">' + esc(item.status || 'New') + '</span><div style="margin-top:7px;">' + esc(item.time || '') + '</div></div></div>';
    }).join('') + '</div>';
  }

  function section(title, subtitle, action, body) {
    return '<section class="ad-section"><div class="ad-section-header"><div><h2 class="ad-section-title">' + esc(title) + '</h2><div class="ad-section-subtitle">' + esc(subtitle) + '</div></div>' + (action || '') + '</div><div class="ad-section-body">' + body + '</div></section>';
  }

  async function safeJson(path, options) {
    try {
      var res = await fetch(path, options || {});
      if (!res.ok) return [];
      var json = await res.json();
      return Array.isArray(json) ? json : [];
    } catch (err) {
      return [];
    }
  }

  async function fetchAllData() {
    try {
      var meRes = await fetch('/api/admin/users', { credentials: 'include' });
      if (!meRes.ok) return null;
      var usersPromise = meRes.json().catch(function () { return []; });
      var results = await Promise.all([
        safeJson('/api/properties', { credentials: 'include' }),
        safeJson('/api/admin/inquiries', { credentials: 'include' }),
        safeJson('/api/admin/property-requests', { credentials: 'include' }),
        safeJson('/api/admin/visit-requests', { credentials: 'include' }),
        safeJson('/api/admin/subscribers', { credentials: 'include' }),
        usersPromise
      ]);
      return {
        properties: toArray(results[0]),
        inquiries: toArray(results[1]),
        propertyRequests: toArray(results[2]),
        visitRequests: toArray(results[3]),
        subscribers: toArray(results[4]),
        users: toArray(results[5])
      };
    } catch (err) {
      console.error('Prime Addis dashboard analytics failed:', err);
      return null;
    }
  }

  function buildAnalytics(data) {
    var properties = data.properties;
    var inquiries = data.inquiries;
    var propertyRequests = data.propertyRequests;
    var visitRequests = data.visitRequests;
    var subscribers = data.subscribers;
    var leads = [];
    inquiries.forEach(function (item) { leads.push({ type: 'Inquiry', token: 'IN', title: 'Inquiry from ' + (item.name || 'Visitor'), desc: item.propertyId ? 'Property #' + item.propertyId + ' message' : 'General property message', status: item.status, createdAt: item.createdAt, propertyId: item.propertyId, link: '/admin/inquiries' }); });
    propertyRequests.forEach(function (item) { leads.push({ type: 'Buyer Request', token: 'BR', title: 'Buyer request from ' + (item.name || 'Visitor'), desc: item.budget ? 'Budget ' + money(item.budget) : (item.requirements || 'Requirements submitted'), status: item.status, createdAt: item.createdAt, propertyId: item.propertyId, link: '/admin/property-requests' }); });
    visitRequests.forEach(function (item) { leads.push({ type: 'Visit Request', token: 'VR', title: 'Visit request from ' + (item.name || 'Visitor'), desc: item.propertyTitle || (item.propertyId ? 'Property #' + item.propertyId : 'Property visit'), status: item.status, createdAt: item.createdAt, propertyId: item.propertyId, link: '/admin/visit-requests' }); });

    var activeProperties = properties.filter(function (p) {
      var s = cleanStatus(p.status).toLowerCase();
      return s.indexOf('sold') < 0 && s.indexOf('rented') < 0;
    });
    var totalValue = sum(properties, function (p) { return p.price; });
    var activeValue = sum(activeProperties, function (p) { return p.price; });
    var openLeads = leads.filter(function (l) { return isOpenStatus(l.status); });
    var closedLeads = leads.filter(function (l) { return isClosedStatus(l.status); });
    var freshLeads = leads.filter(function (l) { return daysAgo(l.createdAt) <= 7; });
    var monthLeads = leads.filter(function (l) { return daysAgo(l.createdAt) <= 30; });
    var staleLeads = openLeads.filter(function (l) { return daysAgo(l.createdAt) > 3; });
    var featured = properties.filter(function (p) { return !!p.isFeatured; });
    var forSale = properties.filter(function (p) { return String(p.status || '').toLowerCase().indexOf('sale') >= 0; });
    var forRent = properties.filter(function (p) { return String(p.status || '').toLowerCase().indexOf('rent') >= 0; });
    var withMedia = properties.filter(function (p) {
      var images = Array.isArray(p.images) ? p.images : [];
      return images.length > 0 || p.videoUrl || p.video_url || p.vrTourUrl || p.vr_tour_url;
    });
    var propertyLeadMap = new Map();
    leads.forEach(function (lead) {
      if (lead.propertyId) propertyLeadMap.set(String(lead.propertyId), (propertyLeadMap.get(String(lead.propertyId)) || 0) + 1);
    });
    var topLeadProperties = properties.map(function (p) {
      return { property: p, count: propertyLeadMap.get(String(p.id)) || 0 };
    }).filter(function (row) { return row.count > 0; }).sort(function (a, b) { return b.count - a.count; }).slice(0, 5);

    leads.sort(function (a, b) {
      return (dateObj(b.createdAt) ? dateObj(b.createdAt).getTime() : 0) - (dateObj(a.createdAt) ? dateObj(a.createdAt).getTime() : 0);
    });

    return {
      totalProperties: properties.length,
      activeProperties: activeProperties.length,
      totalValue: totalValue,
      activeValue: activeValue,
      averagePrice: properties.length ? totalValue / properties.length : 0,
      featured: featured.length,
      forSale: forSale.length,
      forRent: forRent.length,
      mediaCoverage: pct(withMedia.length, properties.length),
      totalLeads: leads.length,
      openLeads: openLeads.length,
      closedLeads: closedLeads.length,
      freshLeads: freshLeads.length,
      monthLeads: monthLeads.length,
      staleLeads: staleLeads.length,
      conversionRate: pct(closedLeads.length, leads.length),
      subscribers: subscribers.length,
      users: data.users.length,
      leads: leads,
      openLeadList: openLeads.sort(function (a, b) { return daysAgo(b.createdAt) - daysAgo(a.createdAt); }),
      recentActivity: leads.slice(0, 7),
      propertyStatus: groupCount(properties, function (p) { return p.status || 'Not specified'; }),
      propertyTypes: groupCount(properties, function (p) { return p.propertyType || p.property_type; }),
      locations: groupCount(properties, function (p) { return p.subcity || p.city || 'Not specified'; }),
      leadSources: groupCount(leads, function (l) { return l.type; }),
      leadStatuses: groupCount(leads, function (l) { return cleanStatus(l.status); }),
      topLeadProperties: topLeadProperties,
      inventoryHealth: {
        sale: forSale.length,
        rent: forRent.length,
        featured: featured.length,
        other: Math.max(0, properties.length - forSale.length - forRent.length)
      }
    };
  }

  function renderDashboard(data, container) {
    var a = buildAnalytics(data);
    var invTotal = Math.max(1, a.inventoryHealth.sale + a.inventoryHealth.rent + a.inventoryHealth.featured + a.inventoryHealth.other);
    var saleDeg = Math.round(a.inventoryHealth.sale / invTotal * 360);
    var rentDeg = saleDeg + Math.round(a.inventoryHealth.rent / invTotal * 360);
    var featuredDeg = rentDeg + Math.round(a.inventoryHealth.featured / invTotal * 360);
    var topPropertyList = a.topLeadProperties.map(function (row) {
      return { token: 'P' + row.property.id, title: row.property.title || 'Property #' + row.property.id, desc: (row.property.propertyType || 'Listing') + ' in ' + (row.property.subcity || row.property.city || 'Prime Addis') + ' · ' + money(row.property.price), status: row.count + ' leads', time: '' };
    });
    var priorityItems = [];
    if (a.openLeads) priorityItems.push('<div class="ad-priority-card"><div class="ad-priority-title">Follow up with ' + int(a.openLeads) + ' open leads</div><div class="ad-priority-copy">Prioritize new inquiries, buyer requests, and visit requests before they become cold.</div></div>');
    if (a.staleLeads) priorityItems.push('<div class="ad-priority-card blue"><div class="ad-priority-title">' + int(a.staleLeads) + ' leads are older than 3 days</div><div class="ad-priority-copy">Move these to replied, scheduled, or closed to keep the pipeline clean.</div></div>');
    if (a.featured < Math.min(3, a.totalProperties) && a.totalProperties) priorityItems.push('<div class="ad-priority-card green"><div class="ad-priority-title">Feature more premium listings</div><div class="ad-priority-copy">Only ' + int(a.featured) + ' listings are featured. Highlight the best inventory to improve homepage performance.</div></div>');
    if (!priorityItems.length) priorityItems.push('<div class="ad-empty">No urgent operational issues right now</div>');

    container.innerHTML = '<div class="ad-dashboard-wrap"><div class="ad-shell">' +
      '<section class="ad-hero"><div class="ad-hero-row"><div><div class="ad-kicker"><span class="ad-live-dot"></span>Live admin analytics</div><h1 class="ad-title">Prime Addis Operations Cockpit</h1><div class="ad-subtitle">A professional command center for tracking portfolio value, listing health, customer demand, follow-ups, and sales activity across the real estate business.</div></div><div class="ad-hero-meta"><div class="ad-hero-meta-label">Last refreshed</div><div class="ad-hero-meta-value">' + esc(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) + '</div><div class="ad-hero-meta-label" style="margin-top:14px;">Admin users</div><div class="ad-hero-meta-value">' + int(a.users) + '</div></div></div><div class="ad-hero-metrics"><div class="ad-hero-tile"><div class="ad-hero-tile-label">Active portfolio</div><div class="ad-hero-tile-value">' + money(a.activeValue) + '</div><div class="ad-hero-tile-note">' + int(a.activeProperties) + ' active listings</div></div><div class="ad-hero-tile"><div class="ad-hero-tile-label">30-day demand</div><div class="ad-hero-tile-value">' + int(a.monthLeads) + '</div><div class="ad-hero-tile-note">' + int(a.freshLeads) + ' new in the last 7 days</div></div><div class="ad-hero-tile"><div class="ad-hero-tile-label">Lead conversion</div><div class="ad-hero-tile-value">' + int(a.conversionRate) + '%</div><div class="ad-hero-tile-note">Closed or replied lead share</div></div><div class="ad-hero-tile"><div class="ad-hero-tile-label">Media coverage</div><div class="ad-hero-tile-value">' + int(a.mediaCoverage) + '%</div><div class="ad-hero-tile-note">Listings with photos, video, or VR</div></div></div></section>' +
      '<div class="ad-grid ad-grid-4"><article class="ad-card"><div class="ad-card-top"><div><div class="ad-card-label">Portfolio Value</div><div class="ad-card-value">' + money(a.totalValue) + '</div></div><div class="ad-card-icon gold">ETB</div></div><div class="ad-card-sub">Average listing price: ' + money(a.averagePrice) + '</div></article><article class="ad-card"><div class="ad-card-top"><div><div class="ad-card-label">Listings</div><div class="ad-card-value">' + int(a.totalProperties) + '</div></div><div class="ad-card-icon blue">PR</div></div><div class="ad-card-sub">' + int(a.forSale) + ' for sale · ' + int(a.forRent) + ' for rent · ' + int(a.featured) + ' featured</div></article><article class="ad-card"><div class="ad-card-top"><div><div class="ad-card-label">Open Leads</div><div class="ad-card-value">' + int(a.openLeads) + '</div></div><div class="ad-card-icon green">LD</div></div><div class="ad-card-sub"><span class="ad-trend ' + (a.staleLeads ? 'warn' : 'neutral') + '">' + int(a.staleLeads) + ' aging</span> awaiting action</div></article><article class="ad-card"><div class="ad-card-top"><div><div class="ad-card-label">Audience</div><div class="ad-card-value">' + int(a.subscribers) + '</div></div><div class="ad-card-icon purple">AU</div></div><div class="ad-card-sub">Subscribers and registered property interest contacts</div></article></div>' +
      '<div class="ad-grid ad-grid-2-1">' +
        section('Lead pipeline', 'Demand by source and operational status.', '<span class="ad-pill">' + int(a.totalLeads) + ' total leads</span>', '<div class="ad-grid ad-grid-1-1"><div>' + renderBars(a.leadSources, 5) + '</div><div>' + renderBars(a.leadStatuses, 6) + '</div></div>') +
        section('Priority actions', 'What needs attention first.', '<span class="ad-pill">Today</span>', '<div class="ad-priority">' + priorityItems.join('') + '</div>') +
      '</div>' +
      '<div class="ad-grid ad-grid-1-1">' +
        section('Inventory mix', 'Sale, rent, featured and other listing balance.', '<span class="ad-pill">' + int(a.activeProperties) + ' active</span>', '<div class="ad-donut-layout"><div class="ad-donut" style="--ad-donut-a:' + saleDeg + 'deg;--ad-donut-b:' + rentDeg + 'deg;--ad-donut-c:' + featuredDeg + 'deg;"><div class="ad-donut-center"><div><div class="ad-donut-number">' + int(a.totalProperties) + '</div><div class="ad-donut-caption">Listings</div></div></div></div><div class="ad-legend"><div class="ad-legend-item"><span class="ad-legend-name"><span class="ad-dot"></span>For Sale</span><span class="ad-legend-value">' + int(a.inventoryHealth.sale) + '</span></div><div class="ad-legend-item"><span class="ad-legend-name"><span class="ad-dot blue"></span>For Rent</span><span class="ad-legend-value">' + int(a.inventoryHealth.rent) + '</span></div><div class="ad-legend-item"><span class="ad-legend-name"><span class="ad-dot green"></span>Featured</span><span class="ad-legend-value">' + int(a.inventoryHealth.featured) + '</span></div><div class="ad-legend-item"><span class="ad-legend-name"><span class="ad-dot gray"></span>Other</span><span class="ad-legend-value">' + int(a.inventoryHealth.other) + '</span></div></div></div>') +
        section('Location performance', 'Where current inventory is concentrated.', '<span class="ad-pill">Subcities</span>', renderBars(a.locations, 7)) +
      '</div>' +
      '<div class="ad-grid ad-grid-1-1">' +
        section('Property type breakdown', 'Inventory by asset category.', '<span class="ad-pill">Types</span>', renderBars(a.propertyTypes, 7)) +
        section('Listing status distribution', 'Current sales and rental status.', '<span class="ad-pill">Statuses</span>', renderBars(a.propertyStatus, 7)) +
      '</div>' +
      '<div class="ad-grid ad-grid-2-1">' +
        section('Recent activity', 'Latest customer interactions across inquiries, requests, and visits.', '<a class="ad-pill" href="/admin/inquiries">Open inbox</a>', renderList(a.recentActivity.map(function (item) { return { token: item.token, title: item.title, desc: item.desc, status: item.status, time: timeAgo(item.createdAt) }; }), 'No recent customer activity yet')) +
        section('Top lead listings', 'Properties currently attracting the most demand.', '<a class="ad-pill" href="/admin/properties">Manage</a>', renderList(topPropertyList, 'No listing-specific leads yet')) +
      '</div>' +
      section('Quick operations', 'Fast access to the most common admin workflows.', '', '<div class="ad-action-grid"><a class="ad-action" href="/admin/properties"><span class="ad-action-main"><span class="ad-action-token">PR</span><span><span class="ad-action-label">Manage properties</span><span class="ad-action-note">Add, edit, feature, and update listings</span></span></span><span class="ad-arrow">›</span></a><a class="ad-action" href="/admin/visit-requests"><span class="ad-action-main"><span class="ad-action-token">VR</span><span><span class="ad-action-label">Visit requests</span><span class="ad-action-note">Schedule viewings and update status</span></span></span><span class="ad-arrow">›</span></a><a class="ad-action" href="/admin/inquiries"><span class="ad-action-main"><span class="ad-action-token">IN</span><span><span class="ad-action-label">Inquiries</span><span class="ad-action-note">Reply to customer messages</span></span></span><span class="ad-arrow">›</span></a><a class="ad-action" href="/admin/property-requests"><span class="ad-action-main"><span class="ad-action-token">BR</span><span><span class="ad-action-label">Buyer requests</span><span class="ad-action-note">Review budgets and requirements</span></span></span><span class="ad-arrow">›</span></a><a class="ad-action" href="/admin/subscribers"><span class="ad-action-main"><span class="ad-action-token">SB</span><span><span class="ad-action-label">Subscribers</span><span class="ad-action-note">Track audience growth</span></span></span><span class="ad-arrow">›</span></a><button type="button" class="ad-action" data-open-hero-manager="1"><span class="ad-action-main"><span class="ad-action-token" style="background:#0ea5e9;color:#fff">HI</span><span><span class="ad-action-label">Hero Images</span><span class="ad-action-note">Add, edit and reorder homepage slideshow</span></span></span><span class="ad-arrow">›</span></button><button type="button" class="ad-action" onclick="window.primeAddisOpenContentManagement && window.primeAddisOpenContentManagement()"><span class="ad-action-main"><span class="ad-action-token">CM</span><span><span class="ad-action-label">Content Management</span><span class="ad-action-note">Edit Blog, About, and Portfolio content</span></span></span><span class="ad-arrow">›</span></button><a class="ad-action" href="/admin/site-settings"><span class="ad-action-main"><span class="ad-action-token">ST</span><span><span class="ad-action-label">Site settings</span><span class="ad-action-note">Update public business information</span></span></span><span class="ad-arrow">›</span></a><button type="button" class="ad-action" onclick="window.primeAddisOpenAIPrompt && window.primeAddisOpenAIPrompt()"><span class="ad-action-main"><span class="ad-action-token" style="background:#7c3aed;color:#fff">AI</span><span><span class="ad-action-label">🤖 AI Prompt Settings</span><span class="ad-action-note">Edit how the AI assistant talks to visitors (English &amp; Amharic)</span></span></span><span class="ad-arrow">›</span></button></div>') +
      '</div></div>';
  }

  function findMainContainer() {
    var root = document.getElementById('root');
    if (!root) return null;
    return root.querySelector('main') || root.querySelector('[role="main"]') || root.querySelector('.p-8') || root.querySelector('.p-6') || root.querySelector('.p-4') || root;
  }

  function hideLegacyDashboard(container, injectionPoint) {
    Array.from(container.children).forEach(function (child) {
      if (child !== injectionPoint && child.id !== 'ad-patch-container' && !child.contains(injectionPoint)) {
        child.setAttribute('data-ad-hidden', 'true');
        child.style.display = 'none';
      }
    });
    var h1s = container.querySelectorAll('h1, h2');
    h1s.forEach(function (el) {
      if (/dashboard/i.test(el.textContent || '')) el.style.display = 'none';
    });
    var grids = container.querySelectorAll('.grid');
    grids.forEach(function (grid, index) {
      if (grid.id !== 'ad-patch-container' && !grid.closest('#ad-patch-container') && index < 3) grid.style.display = 'none';
    });
    Array.from(container.children).forEach(function (child) {
      if (child !== injectionPoint && child.id !== 'ad-patch-container' && !child.contains(injectionPoint)) {
        var text = (child.textContent || '').toLowerCase();
        if (text.indexOf('total properties') >= 0 || text.indexOf('recent inquiries') >= 0 || text.indexOf('dashboard') >= 0) child.style.display = 'none';
      }
    });
  }

  function injectDashboard() {
    var path = window.location.pathname;
    if (path !== '/admin' && path !== '/admin/dashboard') {
      document.documentElement.classList.remove('pa-admin-dashboard-open');
      return;
    }
    document.documentElement.classList.add('pa-admin-dashboard-open');
    if (window.Tawk_API && typeof window.Tawk_API.hideWidget === 'function') {
      try { window.Tawk_API.hideWidget(); } catch (err) {}
    }
    var main = findMainContainer();
    if (!main) return;
    main.setAttribute('data-ad-dashboard-main', 'true');
    var injectionPoint = document.getElementById('ad-patch-container');
    if (!injectionPoint) {
      injectionPoint = document.createElement('div');
      injectionPoint.id = 'ad-patch-container';
      injectionPoint.className = 'ad-injected-container';
      if (window.matchMedia && window.matchMedia('(max-width: 760px)').matches) {
        document.body.appendChild(injectionPoint);
        applyMobilePanel(injectionPoint);
      } else {
        main.prepend(injectionPoint);
      }
      injectionPoint.innerHTML = '<div class="ad-loader">Loading Prime Addis analytics...</div>';
      fetchAllData().then(function (data) {
        if (!data) {
          // Not authenticated — remove the loader and do NOT hide any content
          injectionPoint.remove();
          adminAuthenticated = false;
          return;
        }
        adminAuthenticated = true;
        renderDashboard(data, injectionPoint);
        hideLegacyDashboard(main, injectionPoint);
      });
    } else {
      if (window.matchMedia && window.matchMedia('(max-width: 760px)').matches && injectionPoint.parentElement !== document.body) {
        document.body.appendChild(injectionPoint);
        applyMobilePanel(injectionPoint);
      }
      // Only hide legacy content if we've confirmed authentication
      if (adminAuthenticated) hideLegacyDashboard(main, injectionPoint);
    }
  }

  function applyMobilePanel(node) {
    node.style.position = 'fixed';
    node.style.top = '76px';
    node.style.left = '0';
    node.style.right = '0';
    node.style.bottom = '0';
    node.style.zIndex = '80';
    node.style.width = '100%';
    node.style.height = 'auto';
    node.style.maxHeight = 'none';
    node.style.margin = '0';
    node.style.padding = '12px 12px 160px';
    node.style.boxSizing = 'border-box';
    node.style.overflow = 'auto';
    node.style.background = '#f8fafc';
    node.style.webkitOverflowScrolling = 'touch';
    document.body.style.overflow = 'hidden';
  }

  var timer;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      ensureStyles();
      injectDashboard();
    }, 180);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  new MutationObserver(function (mutations) {
    var existing = document.getElementById('ad-patch-container');
    if (existing) {
      var main = findMainContainer();
      // Only hide legacy content if authenticated — prevents hiding the login form
      if (adminAuthenticated && main && (location.pathname === '/admin' || location.pathname === '/admin/dashboard')) hideLegacyDashboard(main, existing);
      return;
    }
    if (mutations.some(function (m) { return m.addedNodes && m.addedNodes.length; })) schedule();
  }).observe(document.getElementById('root') || document.documentElement, { childList: true, subtree: true });

  var oldPush = history.pushState;
  history.pushState = function () {
    oldPush.apply(this, arguments);
    schedule();
  };
  var oldReplace = history.replaceState;
  history.replaceState = function () {
    oldReplace.apply(this, arguments);
    schedule();
  };
  window.addEventListener('popstate', schedule);
  setTimeout(schedule, 500);
  setTimeout(schedule, 1500);
})();
