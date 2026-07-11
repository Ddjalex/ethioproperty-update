/*
 * Adds a working "Continue with Google" button to the real login/register
 * page at /auth (dist/dist/public/assets/index-CfYobwUw.js has no source to
 * edit directly, so — matching this project's existing convention — this is
 * a small vanilla-JS DOM patch loaded after the main bundle).
 *
 * Clicking the button does a full-page navigation to /auth/google, which is
 * handled server-side (extensions/features.js) via passport-google-oauth20.
 */
(function () {
  if (window.__paGoogleSigninPatchV1__) return;
  window.__paGoogleSigninPatchV1__ = true;

  var GOOGLE_ICON =
    '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">' +
    '<path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>' +
    '<path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.6 0-14.1 4.3-17.4 10.7z"/>' +
    '<path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6c-2 1.5-4.7 2.5-7.7 2.5-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.8 39.6 16.3 44 24 44z"/>' +
    '<path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.5 36 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z"/>' +
    '</svg>';

  function injectStyles() {
    if (document.getElementById('pa-google-signin-style')) return;
    var style = document.createElement('style');
    style.id = 'pa-google-signin-style';
    style.textContent =
      '.pa-google-btn{display:flex;align-items:center;justify-content:center;gap:10px;' +
      'width:100%;padding:10px 16px;margin-bottom:16px;border:1px solid #d1d5db;' +
      'border-radius:6px;background:#fff;color:#1f2937;font-size:14px;font-weight:500;' +
      'cursor:pointer;transition:background .15s;font-family:inherit;}' +
      '.pa-google-btn:hover{background:#f9fafb;}' +
      '.pa-google-divider{display:flex;align-items:center;gap:12px;margin:0 0 16px;' +
      'color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.05em;}' +
      '.pa-google-divider span{flex:1;height:1px;background:#e5e7eb;}';
    document.head.appendChild(style);
  }

  function makeGoogleBlock() {
    var wrap = document.createElement('div');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pa-google-btn';
    btn.innerHTML = GOOGLE_ICON + '<span>Continue with Google</span>';
    btn.addEventListener('click', function () {
      window.location.href = '/auth/google';
    });

    var divider = document.createElement('div');
    divider.className = 'pa-google-divider';
    divider.innerHTML = '<span></span><em style="font-style:normal">or</em><span></span>';

    wrap.appendChild(btn);
    wrap.appendChild(divider);
    return wrap;
  }

  // Finds a leaf element whose exact trimmed text matches one of `texts`.
  function findHeading(texts) {
    var all = document.querySelectorAll('div,h1,h2,h3,h4,span');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.children.length > 0) continue;
      var t = (el.textContent || '').trim();
      if (texts.indexOf(t) !== -1) return el;
    }
    return null;
  }

  function patchForm(headingTexts) {
    var heading = findHeading(headingTexts);
    if (!heading) return false;
    // Walk up to the card, which contains the <form> a few levels down.
    var card = heading;
    var form = null;
    for (var depth = 0; depth < 6 && card; depth++) {
      form = card.querySelector && card.querySelector('form');
      if (form) break;
      card = card.parentElement;
    }
    if (!form || !form.parentElement) return false;
    if (form.parentElement.getAttribute('data-pa-google-patched') === '1') return true;
    form.parentElement.setAttribute('data-pa-google-patched', '1');
    form.parentElement.insertBefore(makeGoogleBlock(), form);
    return true;
  }

  function tryPatch() {
    if (!/^\/auth\/?$/.test(window.location.pathname)) return;
    injectStyles();
    patchForm(['Account Login']);
    patchForm(['Create Account']);
  }

  tryPatch();

  var mo = new MutationObserver(function () {
    tryPatch();
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  ['pushState', 'replaceState'].forEach(function (fn) {
    var orig = history[fn];
    history[fn] = function () {
      var ret = orig.apply(this, arguments);
      setTimeout(tryPatch, 50);
      return ret;
    };
  });
  window.addEventListener('popstate', function () {
    setTimeout(tryPatch, 50);
  });
})();
