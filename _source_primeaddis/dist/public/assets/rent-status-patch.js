// rent-status-patch.js
// Adds rent availability checkboxes (Available for Rent / Rented) when
// "For Rent" is selected as Property Status. When "Rented" is checked,
// shows a date picker for the re-rent date. Also displays rent status
// badge on the public property detail page.

(function () {
  var PATCH_KEY = '__primeAddisRentStatusPatch_v1__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = { lastPath: location.pathname };

  function normStr(s) { return (s || '').toString().trim(); }

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

  /* ─── STATE ─── */
  var rentState = { isRented: false, reRentDate: '' };

  /* ─── STYLES ─── */
  function ensureStyles() {
    if (document.getElementById('rent-status-patch-style')) return;
    var style = document.createElement('style');
    style.id = 'rent-status-patch-style';
    style.textContent = [
      '#rent-status-section {',
      '  margin-top: 14px;',
      '  padding: 14px 16px;',
      '  border: 1px solid #e2e8f0;',
      '  border-radius: 10px;',
      '  background: #f8fafc;',
      '}',
      '#rent-status-section .rs-heading {',
      '  display: block;',
      '  font-size: 13px;',
      '  font-weight: 700;',
      '  color: #475569;',
      '  margin-bottom: 10px;',
      '  text-transform: uppercase;',
      '  letter-spacing: 0.5px;',
      '}',
      '.rent-status-options { display: flex; gap: 12px; flex-wrap: wrap; }',
      '.rs-option {',
      '  display: flex; align-items: center; gap: 8px;',
      '  padding: 10px 18px; border-radius: 8px; border: 2px solid transparent;',
      '  cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.18s;',
      '  user-select: none; flex: 1; min-width: 150px; justify-content: center;',
      '}',
      '.rs-option.available {',
      '  background: #f0fdf4; border-color: #86efac; color: #16a34a;',
      '}',
      '.rs-option.available.active {',
      '  background: #16a34a; border-color: #15803d; color: #fff;',
      '}',
      '.rs-option.available.active input[type="checkbox"] { accent-color: #fff; }',
      '.rs-option.rented {',
      '  background: #fef2f2; border-color: #fca5a5; color: #dc2626;',
      '}',
      '.rs-option.rented.active {',
      '  background: #dc2626; border-color: #b91c1c; color: #fff;',
      '}',
      '.rs-option input[type="checkbox"] {',
      '  width: 17px; height: 17px; pointer-events: none; flex-shrink: 0;',
      '}',
      '#rerental-date-wrap {',
      '  margin-top: 12px; padding: 12px 14px;',
      '  background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px;',
      '}',
      '#rerental-date-wrap label {',
      '  display: block; font-size: 13px; font-weight: 700;',
      '  color: #c2410c; margin-bottom: 6px;',
      '}',
      '#reRentDateInput {',
      '  width: 100%; padding: 9px 12px; border: 1px solid #fed7aa;',
      '  border-radius: 6px; font-size: 14px; background: #fff; box-sizing: border-box;',
      '}',
      '#rerental-date-wrap .rerental-hint {',
      '  margin-top: 6px; font-size: 12px; color: #92400e; opacity: .8; line-height: 1.4;',
      '}',
      /* public detail page */
      '.rent-avail-badge {',
      '  display: inline-flex; align-items: center; gap: 6px;',
      '  padding: 5px 14px; border-radius: 20px; font-weight: 700; font-size: 13px;',
      '  margin-bottom: 8px;',
      '}',
      '.rent-avail-badge.available {',
      '  background: #dcfce7; color: #15803d; border: 1.5px solid #86efac;',
      '}',
      '.rent-avail-badge.rented {',
      '  background: #fee2e2; color: #b91c1c; border: 1.5px solid #fca5a5;',
      '}',
      '.rent-rerental-note {',
      '  font-size: 13px; color: #78350f; background: #fff7ed;',
      '  border: 1px solid #fed7aa; border-radius: 8px;',
      '  padding: 8px 12px; margin-top: 4px; display: inline-block;',
      '}',
      '.rent-card-status-rented {',
      '  background: #fee2e2 !important; color: #b91c1c !important;',
      '  border: 1.5px solid #fca5a5 !important;',
      '}',
      '.rent-card-rented-info {',
      '  display: flex; flex-wrap: wrap; gap: 6px; align-items: center;',
      '  margin: 10px 16px 14px; padding-top: 10px;',
      '  border-top: 1px solid #f1f5f9;',
      '}',
      '.rent-card-rented-info .rent-avail-badge, .rent-card-rented-info .rent-rerental-note {',
      '  margin: 0; font-size: 12px;',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ─── FIND STATUS ELEMENTS ─── */

  // Find the "Property Status" label element
  function findStatusLabelEl() {
    var all = Array.from(document.querySelectorAll('label, span, p, div, h2, h3, h4, strong'));
    return all.find(function (el) {
      if (el.children.length > 3) return false;
      if (el.closest && el.closest('#rent-status-section')) return false;
      var t = normStr(el.textContent).toLowerCase().replace(/\s*\*\s*$/, '').trim();
      return t === 'property status' || t === 'status';
    }) || null;
  }

  // Get the field-wrapper container for the status label
  function findStatusFieldContainer() {
    var lbl = findStatusLabelEl();
    if (!lbl) return null;
    // Walk up until we find a wrapper with siblings (i.e., a form row)
    var node = lbl.parentElement;
    for (var i = 0; i < 8 && node; i++) {
      var p = node.parentElement;
      if (p && p.children.length > 3) return node;
      node = p;
    }
    return lbl.parentElement;
  }

  // Read current status value from native select OR custom dropdown text
  function getCurrentStatusValue() {
    // 1. Native select
    var selects = Array.from(document.querySelectorAll('select'));
    for (var i = 0; i < selects.length; i++) {
      var sel = selects[i];
      var opts = Array.from(sel.options || []);
      if (opts.some(function (o) { return /for rent|for sale/i.test(o.text || o.value); })) {
        return normStr(sel.value);
      }
    }

    // 2. Custom dropdown: find text near "Property Status" label
    var container = findStatusFieldContainer();
    if (container) {
      var txt = normStr(container.textContent);
      // Exclude text from already-inserted rent section
      if (/for rent/i.test(txt) && !/rental availability/i.test(txt)) return 'For Rent';
      if (/\brented\b/i.test(txt) && !/rental availability/i.test(txt)) return 'Rented';
      if (/for sale/i.test(txt)) return 'For Sale';
      if (/\bsold\b/i.test(txt)) return 'Sold';
    }

    // 3. Combobox / custom trigger buttons anywhere in the form
    var STATUS_VALS = ['For Rent', 'Rented', 'For Sale', 'Sold'];
    var triggers = Array.from(document.querySelectorAll(
      'form [role="combobox"], form [aria-haspopup="listbox"], form [data-radix-select-trigger], form button'
    ));
    for (var j = 0; j < triggers.length; j++) {
      var tt = normStr(triggers[j].textContent);
      for (var si = 0; si < STATUS_VALS.length; si++) {
        // starts-with match to tolerate SVG / icon text appended to button
        if (tt.toLowerCase().indexOf(STATUS_VALS[si].toLowerCase()) === 0) return STATUS_VALS[si];
      }
    }

    return '';
  }

  // Find native select element (for attaching change listener)
  function findStatusSelect() {
    var selects = Array.from(document.querySelectorAll('select'));
    for (var i = 0; i < selects.length; i++) {
      var sel = selects[i];
      var opts = Array.from(sel.options || []);
      if (opts.some(function (o) { return /for rent|for sale/i.test(o.text || o.value); })) return sel;
    }
    return null;
  }

  /* ─── BUILD ADMIN UI ─── */
  function buildSectionUI() {
    var sec = document.createElement('div');
    sec.id = 'rent-status-section';
    sec.innerHTML = [
      '<span class="rs-heading">Rental Availability</span>',
      '<div class="rent-status-options">',
      '  <div class="rs-option available active" id="rs-avail-opt" tabindex="0" role="checkbox" aria-checked="true">',
      '    <input type="checkbox" id="rs-avail-cb" checked /> Available for Rent',
      '  </div>',
      '  <div class="rs-option rented" id="rs-rented-opt" tabindex="0" role="checkbox" aria-checked="false">',
      '    <input type="checkbox" id="rs-rented-cb" /> Rented',
      '  </div>',
      '</div>',
      '<div id="rerental-date-wrap" style="display:none;">',
      '  <label for="reRentDateInput">Will Be Available On (Re-rent Date)</label>',
      '  <input type="date" id="reRentDateInput" />',
      '  <div class="rerental-hint">Customers will see this date when the property becomes available for rent again.</div>',
      '</div>',
    ].join('');
    return sec;
  }

  function syncUI() {
    var availOpt = document.getElementById('rs-avail-opt');
    var rentedOpt = document.getElementById('rs-rented-opt');
    var availCb = document.getElementById('rs-avail-cb');
    var rentedCb = document.getElementById('rs-rented-cb');
    var dateWrap = document.getElementById('rerental-date-wrap');
    if (!availOpt) return;

    if (rentState.isRented) {
      availOpt.classList.remove('active');
      rentedOpt.classList.add('active');
      if (availCb) availCb.checked = false;
      if (rentedCb) rentedCb.checked = true;
      availOpt.setAttribute('aria-checked', 'false');
      rentedOpt.setAttribute('aria-checked', 'true');
      if (dateWrap) dateWrap.style.display = 'block';
    } else {
      availOpt.classList.add('active');
      rentedOpt.classList.remove('active');
      if (availCb) availCb.checked = true;
      if (rentedCb) rentedCb.checked = false;
      availOpt.setAttribute('aria-checked', 'true');
      rentedOpt.setAttribute('aria-checked', 'false');
      if (dateWrap) dateWrap.style.display = 'none';
    }
  }

  function bindSectionListeners() {
    var availOpt = document.getElementById('rs-avail-opt');
    var rentedOpt = document.getElementById('rs-rented-opt');
    var dateInput = document.getElementById('reRentDateInput');

    if (availOpt && !availOpt.dataset.rsBound) {
      availOpt.dataset.rsBound = '1';
      var clickAvail = function () { rentState.isRented = false; syncUI(); };
      availOpt.addEventListener('click', clickAvail);
      availOpt.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); clickAvail(); }
      });
    }
    if (rentedOpt && !rentedOpt.dataset.rsBound) {
      rentedOpt.dataset.rsBound = '1';
      var clickRented = function () { rentState.isRented = true; syncUI(); };
      rentedOpt.addEventListener('click', clickRented);
      rentedOpt.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); clickRented(); }
      });
    }
    if (dateInput && !dateInput.dataset.rsBound) {
      dateInput.dataset.rsBound = '1';
      dateInput.addEventListener('change', function () { rentState.reRentDate = dateInput.value || ''; });
      dateInput.addEventListener('input', function () { rentState.reRentDate = dateInput.value || ''; });
    }
  }

  /* ─── MOUNT ADMIN SECTION ─── */
  function findAnchor(sel) {
    // Walk up from the select to find the field-wrapper div, then return it
    // so we can insertAdjacentElement('afterend', section) after the whole field group.
    var node = sel.parentElement;
    for (var i = 0; i < 8 && node; i++) {
      var p = node.parentElement;
      if (!p) break;
      // Stop when parent is a large form container (has many siblings or is a form)
      if (p.tagName === 'FORM' || p.children.length > 4) return node;
      node = p;
    }
    return sel.parentElement || sel;
  }

  var lastStatusWatched = null;
  var lastDetectedStatus = '';

  function ensureAdminUI() {
    if (!isAdminPropertiesPage()) return;

    // Bind change listener on native select if present
    var sel = findStatusSelect();
    if (sel && sel !== lastStatusWatched) {
      lastStatusWatched = sel;
      sel.addEventListener('change', function () {
        lastDetectedStatus = normStr(sel.value);
        if (!/for rent|rented/i.test(lastDetectedStatus)) {
          rentState.isRented = false;
          rentState.reRentDate = '';
        }
        ensureAdminUI();
      });
    }

    // Get current status (works for native select AND custom dropdowns)
    var currentStatus = getCurrentStatusValue();
    if (!currentStatus) {
      // No status field found yet — form may still be loading
      return;
    }
    lastDetectedStatus = currentStatus;

    var isForRent = /for rent|rented/i.test(currentStatus);
    var sec = document.getElementById('rent-status-section');

    if (!isForRent) {
      if (sec) sec.style.display = 'none';
      return;
    }

    if (sec) {
      sec.style.display = 'block';
      syncUI();
      bindSectionListeners();
      var di = document.getElementById('reRentDateInput');
      if (di && rentState.reRentDate && !di.value) di.value = rentState.reRentDate;
      return;
    }

    buildAndInsertSection();
  }

  function buildAndInsertSection() {
    // Find the status field container to insert after it
    var anchor = findStatusFieldContainer();

    if (!anchor) {
      // Fallback 1: native select's container
      var sel = findStatusSelect();
      if (sel) anchor = findAnchor(sel);
    }

    if (!anchor) {
      // Fallback 2: combobox / custom select trigger near "status" text
      var FB2_VALS = ['For Rent', 'Rented', 'For Sale', 'Sold'];
      var triggers2 = Array.from(document.querySelectorAll(
        'form [role="combobox"], form [aria-haspopup="listbox"], form [data-radix-select-trigger], form button'
      ));
      var statusTrigger = triggers2.find(function (t) {
        var tt = normStr(t.textContent).toLowerCase();
        return FB2_VALS.some(function (v) { return tt.indexOf(v.toLowerCase()) === 0; });
      });
      if (statusTrigger) anchor = findAnchor(statusTrigger);
    }

    if (!anchor) {
      // Fallback 3: insert before Bedrooms label
      var allLabels = Array.from(document.querySelectorAll('label, span, div'));
      var bedroomsLabel = allLabels.find(function (el) {
        return el.children.length === 0 && /^bedrooms\s*\*?$/i.test(normStr(el.textContent));
      });
      if (bedroomsLabel) {
        var bedroomsContainer = bedroomsLabel.parentElement;
        for (var i = 0; i < 6 && bedroomsContainer; i++) {
          var p = bedroomsContainer.parentElement;
          if (p && p.children.length > 3) break;
          bedroomsContainer = p;
        }
        if (bedroomsContainer) {
          var newSec = buildSectionUI();
          bedroomsContainer.insertAdjacentElement('beforebegin', newSec);
          syncUI();
          bindSectionListeners();
          var di = document.getElementById('reRentDateInput');
          if (di && rentState.reRentDate) di.value = rentState.reRentDate;
          return;
        }
      }
    }

    if (!anchor) return;

    var newSec = buildSectionUI();
    anchor.insertAdjacentElement('afterend', newSec);
    syncUI();
    bindSectionListeners();
    var di = document.getElementById('reRentDateInput');
    if (di && rentState.reRentDate) di.value = rentState.reRentDate;
  }

  async function prefillEditRentStatus() {
    var id = getPropertyIdFromAdminUrl();
    if (!id) return;
    var data = null;
    for (var url of ['/api/admin/properties/' + id, '/api/properties/' + id]) {
      try { data = await fetchJson(url); break; } catch (e) { /* next */ }
    }
    if (!data) return;
    var prop = data && data.property ? data.property : data;
    var status = normStr(prop.status || '');

    rentState.isRented = /^rented$/i.test(status);
    rentState.reRentDate = normStr(prop.reRentDate || prop.re_rent_date || '');

    syncUI();
    var di = document.getElementById('reRentDateInput');
    if (di && rentState.reRentDate) di.value = rentState.reRentDate;
  }

  /* ─── INTERCEPT FETCH ─── */
  if (!window.__rentStatusFetchPatched) {
    window.__rentStatusFetchPatched = true;
    var _origFetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        var url = typeof input === 'string' ? input : ((input && input.url) || '');
        var isPropertyApi = /\/api\/(admin\/)?properties(\/\d+)?$/.test(url);
        var method = ((init && init.method) || 'GET').toUpperCase();
        if (isPropertyApi && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
          var body = init && init.body;
          if (typeof body === 'string') {
            var obj;
            try { obj = JSON.parse(body); } catch (e) { obj = null; }
            if (obj && typeof obj === 'object') {
              var sec = document.getElementById('rent-status-section');
              if (sec && sec.style.display !== 'none') {
                // Override status based on rent checkbox state
                var baseStatus = normStr(obj.status || '');
                if (/for rent/i.test(baseStatus) && rentState.isRented) {
                  obj.status = 'Rented';
                } else if (/^rented$/i.test(baseStatus) && !rentState.isRented) {
                  obj.status = 'For Rent';
                }
                // Save reRentDate as a top-level field
                obj.reRentDate = rentState.isRented ? (rentState.reRentDate || '') : '';
                obj.re_rent_date = obj.reRentDate;
                init = Object.assign({}, init, { body: JSON.stringify(obj) });
              }
            }
          }
        }
      } catch (e) { /* never break */ }
      return _origFetch.call(this, input, init);
    };
  }

  /* ─── PUBLIC DETAIL PAGE ─── */
  var lastPubKey = '';

  function tryAttachPublicBadge() {
    if (!isPropertyDetailPage()) return;
    var id = getPropertyIdFromDetailUrl();
    if (!id) return;

    fetchJson('/api/properties/' + id).then(function (data) {
      var prop = data && data.property ? data.property : data;
      var status = normStr(prop.status || '');
      var reRentDate = normStr(prop.reRentDate || prop.re_rent_date || '');

      var isForRent = /for rent|rented/i.test(status);
      var key = id + '|' + status + '|' + reRentDate;

      if (key === lastPubKey && document.getElementById('rent-avail-public')) return;
      lastPubKey = key;

      var old = document.getElementById('rent-avail-public');
      if (old) old.remove();

      if (!isForRent) return;

      var isRented = /^rented$/i.test(status);
      var container = document.createElement('div');
      container.id = 'rent-avail-public';
      container.style.margin = '10px 0 14px';

      var badgeHtml = isRented
        ? '<div class="rent-avail-badge rented">✖ Currently Rented</div>'
        : '<div class="rent-avail-badge available">✔ Available for Rent</div>';

      var dateHtml = '';
      if (isRented && reRentDate) {
        try {
          var d = new Date(reRentDate + 'T00:00:00');
          var fmt = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          dateHtml = '<div class="rent-rerental-note">🗓 will be available on: <strong>' + fmt + '</strong></div>';
        } catch (e) { /* ignore */ }
      }

      container.innerHTML = badgeHtml + dateHtml;

      // Mount near price or h1
      var target = document.querySelector('[class*="price"]') || document.querySelector('h1');
      if (target) {
        var wrap = target.closest('div[class]') || target.parentElement;
        if (wrap) { wrap.insertAdjacentElement('afterend', container); }
        else { target.insertAdjacentElement('afterend', container); }
      } else {
        document.body.appendChild(container);
      }
    }).catch(function () {});
  }

  var cardPropsCache = null;
  var cardPropsPromise = null;

  function formatRentDate(reRentDate) {
    if (!reRentDate) return '';
    try {
      var d = new Date(reRentDate + 'T00:00:00');
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  function loadCardProperties() {
    if (cardPropsCache) return Promise.resolve(cardPropsCache);
    if (cardPropsPromise) return cardPropsPromise;
    cardPropsPromise = fetchJson('/api/properties?_rentCardTs=' + Date.now()).then(function (data) {
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

  function paintRentedBadges(card) {
    var nodes = Array.from(card.querySelectorAll('div, span'));
    nodes.forEach(function (node) {
      if (node.children.length > 0) return;
      if (/^rented$/i.test(normStr(node.textContent))) {
        node.classList.add('rent-card-status-rented');
      }
    });
  }

  function attachCardRentInfo(card, prop) {
    if (!card || !prop) return;
    var status = normStr(prop.status || '');
    if (!/^rented$/i.test(status)) return;
    paintRentedBadges(card);
    var reRentDate = normStr(prop.reRentDate || prop.re_rent_date || '');
    var fmt = formatRentDate(reRentDate);
    var existing = card.querySelector('.rent-card-rented-info');
    if (!existing) {
      existing = document.createElement('div');
      existing.className = 'rent-card-rented-info';
      var link = card.querySelector('a[href*="/properties/"]') || card;
      link.appendChild(existing);
    }
    existing.innerHTML = '<div class="rent-avail-badge rented">✖ Currently Rented</div>' + (fmt ? '<div class="rent-rerental-note">🗓 will be available on: <strong>' + fmt + '</strong></div>' : '');
  }

  function tryAttachPropertyCardRentInfo() {
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
        attachCardRentInfo(card, prop);
      });
    });
  }

  /* ─── ROUTING & OBSERVER ─── */
  var debounce;
  function schedule(fn, d) {
    clearTimeout(debounce);
    debounce = setTimeout(fn, d || 300);
  }

  function onNavChange() {
    var newPath = location.pathname;
    if (window[PATCH_KEY].lastPath !== newPath) {
      window[PATCH_KEY].lastPath = newPath;
      lastPubKey = '';
      lastStatusWatched = null;
      rentState = { isRented: false, reRentDate: '' };
    }
    ensureStyles();
    ensureAdminUI();
    tryAttachPublicBadge();
    tryAttachPropertyCardRentInfo();
  }

  new MutationObserver(function () { schedule(onNavChange, 220); })
    .observe(document.documentElement, { childList: true, subtree: true });

  var _push = history.pushState;
  history.pushState = function () { _push.apply(this, arguments); schedule(onNavChange, 80); };
  window.addEventListener('popstate', function () { schedule(onNavChange, 80); });

  function start() {
    ensureStyles();
    ensureAdminUI();
    tryAttachPublicBadge();
    tryAttachPropertyCardRentInfo();
    [600, 1500, 3000].forEach(function (t) {
      setTimeout(function () {
        ensureAdminUI();
        tryAttachPublicBadge();
        tryAttachPropertyCardRentInfo();
        if (isAdminPropertiesPage()) prefillEditRentStatus();
      }, t);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
