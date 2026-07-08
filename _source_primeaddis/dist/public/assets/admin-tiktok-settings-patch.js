(function () {
  var PATCH_KEY = '__primeAddisAdminTiktokPatch_v1__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  function runPatch() {
    if (!/^\/admin/i.test(location.pathname)) return;

    /* Find the Instagram URL input (we insert TikTok after it) */
    var allInputs = Array.from(document.querySelectorAll('input'));
    var igInput = allInputs.find(function (inp) {
      var label = inp.closest('div') && inp.closest('div').querySelector('label');
      return label && /instagram/i.test(label.textContent);
    });

    if (!igInput) return;

    /* Check if we already injected the TikTok field */
    if (document.getElementById('patch-tiktok-url-field')) return;

    var igWrapper = igInput.closest('div[class]') || igInput.parentElement;
    if (!igWrapper) return;

    /* Fetch current settings to pre-fill */
    fetch('/api/site-settings', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (s) {
        var currentVal = (s.tiktokUrl || s.tiktok_url || '');

        /* Build the TikTok field with same styling as surrounding fields */
        var wrapper = document.createElement('div');
        wrapper.id = 'patch-tiktok-url-field';
        wrapper.className = igWrapper.className;

        var label = document.createElement('label');
        label.textContent = 'TikTok URL';
        label.style.cssText = 'display:block; font-size:14px; font-weight:500; margin-bottom:6px; color:inherit;';

        var input = document.createElement('input');
        input.id = 'patch-tiktok-url-input';
        input.type = 'url';
        input.placeholder = 'https://www.tiktok.com/@yourpage';
        input.value = currentVal;
        input.className = igInput.className;
        input.style.cssText = 'width:100%;';

        wrapper.appendChild(label);
        wrapper.appendChild(input);

        /* Insert after the Instagram wrapper */
        var parentEl = igWrapper.parentElement;
        if (parentEl) {
          var nextSib = igWrapper.nextSibling;
          if (nextSib) {
            parentEl.insertBefore(wrapper, nextSib);
          } else {
            parentEl.appendChild(wrapper);
          }
        }

        /* Hook into the form submit to include tiktokUrl */
        hookFormSubmit();
      })
      .catch(function () {});
  }

  function hookFormSubmit() {
    if (window.__tiktokFormHooked) return;
    window.__tiktokFormHooked = true;

    /* Intercept fetch calls to the admin site-settings endpoint */
    var origFetch = window.fetch;
    window.fetch = function (url, opts) {
      if (typeof url === 'string' && /admin\/site-settings/i.test(url) && opts && (opts.method === 'PUT' || opts.method === 'PATCH')) {
        try {
          var body = JSON.parse(opts.body);
          var input = document.getElementById('patch-tiktok-url-input');
          if (input) {
            body.tiktokUrl = input.value.trim();
            opts = Object.assign({}, opts, { body: JSON.stringify(body) });
          }
        } catch (e) {}
      }
      return origFetch.call(this, url, opts);
    };
  }

  var timer;
  function schedule() { clearTimeout(timer); timer = setTimeout(runPatch, 400); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  new MutationObserver(function (mutations) {
    var relevant = mutations.some(function (m) { return m.addedNodes.length > 0; });
    if (relevant) schedule();
  }).observe(document.documentElement, { childList: true, subtree: true });

  var _push = history.pushState;
  history.pushState = function () { _push.apply(this, arguments); schedule(); };
  window.addEventListener('popstate', schedule);

  setTimeout(runPatch, 800);
  setTimeout(runPatch, 2000);
})();
