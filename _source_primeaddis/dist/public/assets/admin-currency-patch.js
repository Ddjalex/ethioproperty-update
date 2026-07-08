(function () {
  var PATCH_KEY = '__prime_admin_currency_patch_v1__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  // Only run on admin property add/edit pages
  function isAdminPropertyPage() {
    return /\/admin\/properties\/(add|edit)/.test(location.pathname);
  }

  // The chosen currency for the current form session
  var chosenCurrency = 'ETB';

  // ── Inject currency toggle next to the Price field ───────────────────────

  function buildToggle() {
    var wrapper = document.createElement('div');
    wrapper.id = 'prime-currency-toggle';
    wrapper.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:6px',
      'margin-top:6px',
      'margin-bottom:4px',
      'font-size:13px',
      'font-weight:500',
      'color:#374151',
    ].join(';');

    wrapper.innerHTML = '<span style="margin-right:4px">Currency:</span>';

    ['ETB', '$'].forEach(function (cur) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = cur;
      btn.dataset.cur = cur;
      btn.style.cssText = [
        'padding:3px 12px',
        'border-radius:6px',
        'border:1.5px solid #d1d5db',
        'background:' + (cur === chosenCurrency ? '#0f766e' : '#fff'),
        'color:' + (cur === chosenCurrency ? '#fff' : '#374151'),
        'cursor:pointer',
        'font-size:13px',
        'font-weight:600',
        'transition:all .15s',
      ].join(';');

      btn.addEventListener('click', function () {
        chosenCurrency = cur;
        // Update button styles
        wrapper.querySelectorAll('button').forEach(function (b) {
          var active = b.dataset.cur === chosenCurrency;
          b.style.background = active ? '#0f766e' : '#fff';
          b.style.color = active ? '#fff' : '#374151';
          b.style.borderColor = active ? '#0f766e' : '#d1d5db';
        });
        // Update hidden input
        var hidden = document.getElementById('prime-currency-value');
        if (hidden) hidden.value = chosenCurrency;
        // Update price label
        updatePriceLabel();
      });

      wrapper.appendChild(btn);
    });

    // Hidden input that carries the currency value on form submit
    var hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id = 'prime-currency-value';
    hidden.name = 'currency';
    hidden.value = chosenCurrency;
    wrapper.appendChild(hidden);

    return wrapper;
  }

  function updatePriceLabel() {
    var label = document.querySelector('label[for="price"], label[for="price_field"]');
    if (!label) {
      // Try to find any label with text "Price"
      var labels = document.querySelectorAll('label');
      for (var i = 0; i < labels.length; i++) {
        if (/^price/i.test(labels[i].textContent.trim())) {
          label = labels[i];
          break;
        }
      }
    }
    if (label) {
      // Remove old currency indicator
      var old = label.querySelector('.prime-cur-indicator');
      if (old) old.remove();
      var span = document.createElement('span');
      span.className = 'prime-cur-indicator';
      span.style.cssText = 'margin-left:6px;font-size:11px;padding:1px 6px;border-radius:9px;background:' +
        (chosenCurrency === 'ETB' ? '#d1fae5;color:#065f46' : '#dbeafe;color:#1e40af') + ';font-weight:700';
      span.textContent = chosenCurrency;
      label.appendChild(span);
    }
  }

  function findPriceInput() {
    // Try id first
    var el = document.getElementById('price');
    if (el && el.type === 'number') return el;
    // Try label with "Price"
    var labels = document.querySelectorAll('label');
    for (var i = 0; i < labels.length; i++) {
      if (/^price\s*\*/i.test(labels[i].textContent.trim()) || /^price$/i.test(labels[i].textContent.trim())) {
        var forAttr = labels[i].getAttribute('for');
        if (forAttr) {
          var inp = document.getElementById(forAttr);
          if (inp) return inp;
        }
        // Find nearby input
        var parent = labels[i].closest('div');
        if (parent) {
          var inp2 = parent.querySelector('input[type="number"]');
          if (inp2) return inp2;
        }
      }
    }
    return null;
  }

  var injected = false;

  function tryInject() {
    if (!isAdminPropertyPage()) return;
    if (injected && document.getElementById('prime-currency-toggle')) return;

    var priceInput = findPriceInput();
    if (!priceInput) return;

    // Don't double-inject
    if (document.getElementById('prime-currency-toggle')) return;

    // Get parent container of the price input to insert toggle after the input
    var container = priceInput.parentElement;
    if (!container) return;

    // If editing an existing property, read its current currency from the page
    readExistingCurrency();

    var toggle = buildToggle();
    // Insert after the input
    var next = priceInput.nextSibling;
    if (next) {
      container.insertBefore(toggle, next);
    } else {
      container.appendChild(toggle);
    }

    updatePriceLabel();
    injected = true;

    // Intercept form submission to include currency
    interceptFormSubmit();
  }

  function readExistingCurrency() {
    // On edit page, try to fetch the current property's currency
    var match = location.pathname.match(/\/admin\/properties\/edit\/(\d+)/);
    if (!match) return;
    var id = match[1];
    fetch('/api/properties/' + id, { credentials: 'include' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var cur = data.currency || 'ETB';
        chosenCurrency = cur;
        // Update toggle UI
        var toggle = document.getElementById('prime-currency-toggle');
        if (toggle) {
          toggle.querySelectorAll('button').forEach(function (b) {
            var active = b.dataset.cur === chosenCurrency;
            b.style.background = active ? '#0f766e' : '#fff';
            b.style.color = active ? '#fff' : '#374151';
            b.style.borderColor = active ? '#0f766e' : '#d1d5db';
          });
          var hidden = document.getElementById('prime-currency-value');
          if (hidden) hidden.value = chosenCurrency;
        }
        updatePriceLabel();
      })
      .catch(function () {});
  }

  function interceptFormSubmit() {
    // The React form uses fetch/XHR directly, not native form submit.
    // We intercept the fetch calls to /api/admin/properties to inject currency.
    if (window.__primeCurrencyFetchPatched) return;
    window.__primeCurrencyFetchPatched = true;

    var origFetch = window.fetch;
    window.fetch = function (url, opts) {
      if (typeof url === 'string' && /\/api\/admin\/properties/.test(url) &&
          opts && (opts.method === 'POST' || opts.method === 'PATCH' || opts.method === 'PUT')) {
        try {
          var body = typeof opts.body === 'string' ? JSON.parse(opts.body) : opts.body;
          if (body && typeof body === 'object' && !body.currency) {
            var cur = (document.getElementById('prime-currency-value') || {}).value || chosenCurrency;
            body.currency = cur;
            opts = Object.assign({}, opts, { body: JSON.stringify(body) });
          }
        } catch (e) {}
      }
      return origFetch.apply(this, arguments);
    };
  }

  // ── Observe DOM for the form to appear ───────────────────────────────────

  var observer = new MutationObserver(function () {
    if (isAdminPropertyPage()) tryInject();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Also try on navigation
  var origPush = history.pushState;
  history.pushState = function () {
    origPush.apply(this, arguments);
    injected = false;
    chosenCurrency = 'ETB';
    setTimeout(tryInject, 300);
  };
  window.addEventListener('popstate', function () {
    injected = false;
    chosenCurrency = 'ETB';
    setTimeout(tryInject, 300);
  });

  setTimeout(tryInject, 500);
  setTimeout(tryInject, 1500); // retry after React hydration
})();
