(function () {
  'use strict';
  var KEY = '__paAdminSubcityPatchV1__';
  if (window[KEY]) return;
  window[KEY] = true;

  var SUBCITIES = [
    'Addis Ketema','Akaki Kaliti','Arada','Bole','Gulele',
    'Kirkos','Kolfe Keraniyo','Lemi Kura','Lideta',
    'Nifas Silk Lafto','Yeka'
  ];

  var GOLD = '#C4922A';
  var NAVY = '#1B2A4A';
  var currentSubcity = '';

  /* ── Intercept fetch so every PATCH /api/admin/properties/:id carries subcity ── */
  var _origFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = (typeof input === 'string') ? input : (input && input.url ? input.url : '');
    if (
      init &&
      init.method &&
      init.method.toUpperCase() === 'PATCH' &&
      /\/api\/admin\/properties\/\d+/.test(url)
    ) {
      try {
        var body = JSON.parse(init.body || '{}');
        if (currentSubcity !== undefined) {
          body.subcity = currentSubcity;
          init = Object.assign({}, init, { body: JSON.stringify(body) });
        }
      } catch (e) {}
    }
    return _origFetch.call(this, input, init);
  };

  /* ── Build the injected Subcity dropdown ── */
  function buildDropdown(current) {
    var wrap = document.createElement('div');
    wrap.id = 'pa-subcity-inject';
    wrap.style.cssText = 'margin-bottom:16px;';

    var label = document.createElement('label');
    label.textContent = 'Subcity/Area *';
    label.style.cssText = 'display:block;font-size:14px;font-weight:500;margin-bottom:6px;color:#374151;';
    wrap.appendChild(label);

    var select = document.createElement('select');
    select.style.cssText = [
      'width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;',
      'font-size:14px;background:#fff;color:#111827;cursor:pointer;',
      'outline:none;appearance:auto;'
    ].join('');
    select.id = 'pa-subcity-select';

    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select subcity or area';
    placeholder.disabled = true;
    select.appendChild(placeholder);

    SUBCITIES.forEach(function (sc) {
      var opt = document.createElement('option');
      opt.value = sc;
      opt.textContent = sc;
      if (sc === current) opt.selected = true;
      select.appendChild(opt);
    });

    if (!current) placeholder.selected = true;

    select.addEventListener('focus', function () {
      select.style.borderColor = GOLD;
      select.style.boxShadow = '0 0 0 2px rgba(196,146,42,0.2)';
    });
    select.addEventListener('blur', function () {
      select.style.borderColor = '#d1d5db';
      select.style.boxShadow = '';
    });
    select.addEventListener('change', function () {
      currentSubcity = select.value;
    });

    wrap.appendChild(select);
    return wrap;
  }

  /* ── Find the edit form's Location section and inject ── */
  function tryInject(subcity) {
    if (document.getElementById('pa-subcity-inject')) return true;

    /* Look for the City input label to find the right spot */
    var cityLabel = null;
    document.querySelectorAll('label').forEach(function (lbl) {
      if (/^city\s*\*?$/i.test((lbl.textContent || '').trim())) cityLabel = lbl;
    });
    if (!cityLabel) return false;

    /* Walk up to the City field's container, then to its parent row/grid */
    var cityField = cityLabel.closest('div[class]') || cityLabel.parentElement;
    var row = cityField ? (cityField.parentElement || cityField) : null;
    if (!row) return false;

    var dropdown = buildDropdown(subcity);

    /* Insert before the row that contains City (or as the first child of its parent) */
    var insertBefore = cityField.parentElement && cityField.parentElement.children.length > 1
      ? cityField.parentElement          // grid row with City + State side-by-side → insert before it
      : cityField;

    insertBefore.parentNode.insertBefore(dropdown, insertBefore);
    return true;
  }

  /* ── Fetch current property to get existing subcity ── */
  function getPropertyId() {
    var m = location.pathname.match(/\/admin\/properties\/edit\/(\d+)/);
    return m ? m[1] : null;
  }

  function init() {
    var pid = getPropertyId();
    if (!pid) return;

    _origFetch('/api/properties/' + pid, { credentials: 'include' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (prop) {
        currentSubcity = (prop && prop.subcity) ? prop.subcity : '';
        attemptInject(currentSubcity, 0);
      })
      .catch(function () {
        currentSubcity = '';
        attemptInject('', 0);
      });
  }

  function attemptInject(subcity, tries) {
    if (document.getElementById('pa-subcity-inject')) return;
    if (tries > 40) return;
    var ok = tryInject(subcity);
    if (!ok) setTimeout(function () { attemptInject(subcity, tries + 1); }, 200);
  }

  /* ── Watch for navigation to edit pages ── */
  function onNav() {
    setTimeout(function () {
      var el = document.getElementById('pa-subcity-inject');
      if (el) el.parentNode && el.parentNode.removeChild(el);
      if (getPropertyId()) init();
    }, 300);
  }

  var _origPush = history.pushState;
  history.pushState = function () {
    _origPush.apply(this, arguments);
    onNav();
  };
  window.addEventListener('popstate', onNav);

  /* ── Boot ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { if (getPropertyId()) init(); });
  } else {
    if (getPropertyId()) init();
  }
  setTimeout(function () { if (getPropertyId() && !document.getElementById('pa-subcity-inject')) init(); }, 1000);
})();
