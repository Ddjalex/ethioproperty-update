// vr-tour-patch.js
// Adds VR Tour URL field to admin property pages and a VR Tour button on property detail pages.

(function () {
  var PATCH_KEY = '__primeAddisVrTourPatch_v1__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = { lastPath: location.pathname };

  /* ─── UTILS ─── */
  function normStr(s) { return (s ?? '').toString().trim(); }

  function isAdminPropertiesPage() {
    var p = location.pathname || '';
    if (!p.startsWith('/admin/properties')) return false;
    if (/(\/add$|\/new$|\/create$)/i.test(p)) return true;
    if (/(\/edit\/\d+$|\/\d+\/edit$)/i.test(p)) return true;
    return /\/admin\/properties\//i.test(p);
  }

  function isPropertyDetailPage() {
    return /^\/properties\//i.test(location.pathname || '');
  }

  function getPropertyIdFromAdminUrl() {
    var p = location.pathname || '';
    var m = p.match(/\/admin\/properties\/edit\/(\d+)/i) || p.match(/\/admin\/properties\/(\d+)\/edit/i);
    return m ? m[1] : null;
  }

  function getPropertyIdFromDetailUrl() {
    var m = (location.pathname || '').match(/^\/properties\/(\d+)/i);
    return m ? m[1] : null;
  }

  function fetchJson(url) {
    return fetch(url, { credentials: 'include' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /* ─── STYLES ─── */
  function ensureStyles() {
    if (document.getElementById('vr-tour-patch-style')) return;
    var style = document.createElement('style');
    style.id = 'vr-tour-patch-style';
    style.textContent = [
      '#vr-tour-input-wrap { margin-top: 14px; }',
      '#vr-tour-input-wrap label { display:block; font-size:14px; font-weight:600; margin-bottom:6px; }',
      '#vrTourUrlInput { width:100%; padding:10px 12px; border:1px solid rgba(0,0,0,0.15); border-radius:8px; font-size:14px; background:#fff; box-sizing:border-box; }',
      '#vr-tour-input-wrap .hint { margin-top:6px; font-size:12px; opacity:.7; line-height:1.4; }',
      /* public detail page button */
      '.vr-tour-banner { display: none !important; }',
      '.vr-tour-btn {',
      '  display: inline-flex; align-items: center; gap: 10px;',
      '  background: linear-gradient(135deg, #1B2A4A 0%, #2a3f6f 100%);',
      '  color: #fff; text-decoration: none; font-weight: 700; font-size: 15px;',
      '  padding: 14px 24px; border-radius: 12px; width: 100%; box-sizing: border-box;',
      '  justify-content: center; transition: opacity .2s, transform .2s;',
      '  border: 2px solid #C9A96E; letter-spacing: .3px;',
      '}',
      '.vr-tour-btn:hover { opacity: .92; transform: translateY(-2px); }',
      '.vr-tour-btn .vr-icon { font-size: 22px; flex-shrink: 0; }',
      '.vr-tour-btn .vr-label { display:flex; flex-direction:column; text-align:left; }',
      '.vr-tour-btn .vr-title { font-size: 15px; font-weight: 700; color: #C9A96E; }',
      '.vr-tour-btn .vr-sub { font-size: 11px; font-weight: 400; opacity: .8; margin-top:1px; }',
      '.vr-card-icon {',
      '  position: absolute; top: 10px; right: 10px; z-index: 12;',
      '  width: 34px; height: 34px; border-radius: 999px;',
      '  display: inline-flex; align-items: center; justify-content: center;',
      '  background: rgba(27, 42, 74, .94); color: #fff;',
      '  border: 1.5px solid #C9A96E; box-shadow: 0 8px 20px rgba(15,23,42,.22);',
      '  text-decoration: none; font-size: 19px; line-height: 1;',
      '}',
      '.vr-card-icon:hover { transform: translateY(-1px); }',
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ──────────────────────────────────────────────────
     ADMIN: VR Tour URL input
  ────────────────────────────────────────────────── */
  function getVrInput() { return document.getElementById('vrTourUrlInput'); }

  function buildVrInputUI() {
    var wrap = document.createElement('div');
    wrap.id = 'vr-tour-input-wrap';
    wrap.innerHTML = [
      '<label for="vrTourUrlInput">VR Tour URL</label>',
      '<input id="vrTourUrlInput" type="url" placeholder="Paste your 360° / VR tour link (e.g. Matterport, Kuula, Google Street View…)" />',
      '<div class="hint">Optional: visitors will see a "Take VR Tour" button that opens this link in a new tab.</div>',
    ].join('');
    return wrap;
  }

  function dedupeVrBoxes() {
    var boxes = Array.from(document.querySelectorAll('#vr-tour-input-wrap'));
    for (var i = 1; i < boxes.length; i++) { if (boxes[i]) boxes[i].remove(); }
  }

  function findAdminMountAnchor() {
    // Try to mount after the existing Video URL patch box
    var videoBox = document.getElementById('property-video-url-patch');
    if (videoBox) return videoBox;

    // Fallback: any label containing "featured"
    var labels = Array.from(document.querySelectorAll('label, strong, h2, h3, h4'));
    var featured = labels.find(function (l) { return /featured property/i.test(normStr(l.textContent)); });
    if (featured) {
      var node = featured.closest('div') || featured.parentElement;
      for (var i = 0; i < 8 && node; i++) {
        if (/featured/i.test(normStr(node.textContent)) && node.querySelector('input[type="checkbox"], button[role="switch"], [aria-checked]')) return node;
        node = node.parentElement;
      }
    }

    return document.querySelector('form');
  }

  function ensureVrInput() {
    if (!isAdminPropertiesPage()) return;
    dedupeVrBoxes();
    var anchor = findAdminMountAnchor();
    if (!anchor) return;

    var box = document.getElementById('vr-tour-input-wrap');
    if (!box) box = buildVrInputUI();

    if (box.previousElementSibling !== anchor) {
      anchor.insertAdjacentElement('afterend', box);
    }

    var input = getVrInput();
    if (input && !input.dataset.vrPatchBound) {
      input.dataset.vrPatchBound = '1';
      input.addEventListener('input', function () { window.__vrTourUrlValue = input.value || ''; });
      input.addEventListener('change', function () { window.__vrTourUrlValue = input.value || ''; });
    }
  }

  async function prefillVrIfEdit() {
    var id = getPropertyIdFromAdminUrl();
    if (!id) return;

    var data = null;
    for (var url of ['/api/admin/properties/' + id, '/api/properties/' + id]) {
      try { data = await fetchJson(url); break; } catch (e) { /* try next */ }
    }
    if (!data) return;

    var property = data && data.property ? data.property : data;
    var vrUrl = normStr(property && (property.vrTourUrl || property.vr_tour_url) || '');
    var input = getVrInput();
    if (input && vrUrl && !input.value) {
      input.value = vrUrl;
      window.__vrTourUrlValue = vrUrl;
    }
  }

  /* Intercept fetch to inject vrTourUrl into property save requests */
  if (!window.__vrTourFetchPatched) {
    window.__vrTourFetchPatched = true;
    var _origFetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        var isPropertyApi = /\/api\/(admin\/)?properties(\/\d+)?$/.test(url);
        var method = ((init && init.method) || 'GET').toUpperCase();
        if (isPropertyApi && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
          var body = init && init.body;
          if (typeof body === 'string') {
            var bodyObj;
            try { bodyObj = JSON.parse(body); } catch (e) { bodyObj = null; }
            if (bodyObj && typeof bodyObj === 'object') {
              var vrInput = getVrInput();
              var vrUrl = normStr((vrInput && vrInput.value) || window.__vrTourUrlValue || bodyObj.vrTourUrl || bodyObj.vr_tour_url || '');
              bodyObj.vrTourUrl = vrUrl;
              bodyObj.vr_tour_url = vrUrl;
              init = Object.assign({}, init, { body: JSON.stringify(bodyObj) });
            }
          }
        }
      } catch (e) { /* never break requests */ }
      return _origFetch.call(this, input, init);
    };
  }

  async function injectAdminVrField() {
    if (!isAdminPropertiesPage()) return;
    ensureVrInput();
    await prefillVrIfEdit();
  }

  /* ──────────────────────────────────────────────────
     PUBLIC: VR Tour button on property detail page
  ────────────────────────────────────────────────── */
  function findDetailMountTarget() {
    // Look for the property price/title area or any section with share/favorite buttons
    var selectors = [
      '[class*="property-actions"]',
      '[class*="contact"]',
      '[class*="inquiry"]',
      '[class*="agent"]',
      '[class*="sidebar"]',
      'aside',
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }
    // Fallback: after the first h1 on the page
    var h1 = document.querySelector('h1');
    return h1 ? h1.parentElement : null;
  }

  function buildVrButton(vrUrl) {
    var banner = document.createElement('div');
    banner.className = 'vr-tour-banner';
    banner.id = 'vr-tour-public-btn';

    var link = document.createElement('a');
    link.className = 'vr-tour-btn';
    link.href = vrUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.innerHTML = [
      '<span class="vr-icon">🥽</span>',
      '<span class="vr-label">',
      '  <span class="vr-title">Take VR Tour</span>',
      '  <span class="vr-sub">Opens in a new tab · 360° Virtual Tour</span>',
      '</span>',
      '<span style="margin-left:auto;opacity:.7;font-size:18px;">↗</span>',
    ].join('');

    banner.appendChild(link);
    return banner;
  }

  var lastVrKey = '';
  function tryAttachVrButton() {
    if (!isPropertyDetailPage()) return;
    var id = getPropertyIdFromDetailUrl();
    if (!id) return;

    fetchJson('/api/properties/' + id).then(function (data) {
      var property = data && data.property ? data.property : data;
      var vrUrl = normStr((property && (property.vrTourUrl || property.vr_tour_url)) || '');
      if (!vrUrl) return;

      var key = id + '|' + vrUrl;
      if (key === lastVrKey && document.getElementById('vr-tour-public-btn')) return;
      lastVrKey = key;

      // Remove stale button if URL changed
      var old = document.getElementById('vr-tour-public-btn');
      if (old) old.remove();

      var btn = buildVrButton(vrUrl);
      var target = findDetailMountTarget();
      if (target) {
        target.insertAdjacentElement('beforebegin', btn);
      } else {
        // Last resort: append to body
        document.body.appendChild(btn);
      }
    }).catch(function () {});
  }

  var cardPropsCache = null;
  var cardPropsPromise = null;

  function loadCardProperties() {
    if (cardPropsCache) return Promise.resolve(cardPropsCache);
    if (cardPropsPromise) return cardPropsPromise;
    cardPropsPromise = fetchJson('/api/properties?_vrCardTs=' + Date.now()).then(function (data) {
      cardPropsCache = Array.isArray(data) ? data : ((data && data.properties) || []);
      return cardPropsCache;
    }).catch(function () {
      return [];
    });
    return cardPropsPromise;
  }

  function getPropertyIdFromHref(href) {
    var m = (href || '').match(/\/properties\/(\d+)/i);
    return m ? String(m[1]) : '';
  }

  function attachCardVrIcon(card, prop) {
    if (!card || !prop) return;
    var vrUrl = normStr((prop && (prop.vrTourUrl || prop.vr_tour_url)) || '');
    var existing = card.querySelector('.vr-card-icon');
    if (!vrUrl) {
      if (existing) existing.remove();
      return;
    }

    var host = card.querySelector('a[href*="/properties/"]') || card;
    var hostStyle = window.getComputedStyle(host);
    if (hostStyle.position === 'static') host.style.position = 'relative';

    if (!existing) {
      existing = document.createElement('a');
      existing.className = 'vr-card-icon';
      existing.target = '_blank';
      existing.rel = 'noopener noreferrer';
      existing.title = 'Take VR Tour';
      existing.setAttribute('aria-label', 'Take VR Tour');
      existing.textContent = '🥽';
      existing.addEventListener('click', function (event) {
        event.stopPropagation();
      });
      host.appendChild(existing);
    }
    existing.href = vrUrl;
  }

  function tryAttachPropertyCardVrIcons() {
    if (/^\/admin/i.test(location.pathname || '') || isPropertyDetailPage()) return;
    var links = Array.from(document.querySelectorAll('a[href*="/properties/"]'));
    if (!links.length) return;
    loadCardProperties().then(function (props) {
      var byId = {};
      props.forEach(function (p) { if (p && p.id != null) byId[String(p.id)] = p; });
      links.forEach(function (link) {
        var id = getPropertyIdFromHref(link.getAttribute('href') || link.href || '');
        var prop = byId[id];
        if (!prop) return;
        var card = link.closest('.property-card') || link;
        attachCardVrIcon(card, prop);
      });
    });
  }

  /* ─── OBSERVER & ROUTING ─── */
  var debounceTimer;
  function schedule(fn, delay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fn, delay || 300);
  }

  function onNavChange() {
    var newPath = location.pathname;
    if (window[PATCH_KEY].lastPath !== newPath) {
      window[PATCH_KEY].lastPath = newPath;
      lastVrKey = '';
    }
    ensureStyles();
    injectAdminVrField();
    tryAttachVrButton();
    tryAttachPropertyCardVrIcons();
  }

  var mutationObserver = new MutationObserver(function () {
    schedule(onNavChange, 200);
  });
  mutationObserver.observe(document.documentElement, { childList: true, subtree: true });

  /* Intercept SPA navigation */
  var _pushState = history.pushState;
  history.pushState = function () {
    _pushState.apply(this, arguments);
    schedule(onNavChange, 80);
  };
  window.addEventListener('popstate', function () { schedule(onNavChange, 80); });

  /* Initial run */
  function start() {
    ensureStyles();
    injectAdminVrField();
    tryAttachVrButton();
    tryAttachPropertyCardVrIcons();
    setTimeout(function () { injectAdminVrField(); tryAttachVrButton(); tryAttachPropertyCardVrIcons(); }, 600);
    setTimeout(function () { injectAdminVrField(); tryAttachVrButton(); tryAttachPropertyCardVrIcons(); }, 1500);
    setTimeout(function () { injectAdminVrField(); tryAttachVrButton(); tryAttachPropertyCardVrIcons(); }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
