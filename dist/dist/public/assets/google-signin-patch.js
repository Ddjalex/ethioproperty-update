/*
 * Adds a working "Continue with Google" button to:
 *  - the real login/register page at /auth
 *  - the homepage "Request Property Updates" lead-capture form
 *  - the property detail page "Interested in this property?" (Inquiry) and
 *    "Schedule a visit" (Visit) forms
 *
 * dist/dist/public/assets/index-CfYobwUw.js has no source to edit directly,
 * so — matching this project's existing convention — this is a small
 * vanilla-JS DOM patch loaded after the main bundle.
 *
 * On /auth, clicking the button does a full-page navigation to
 * /auth/google (handled server-side in extensions/features.js via
 * passport-google-oauth20), same as before.
 *
 * On the three lead-capture forms, clicking the button navigates to
 * /auth/google?returnTo=<current path>, so after Google sign-in the user
 * lands back on the same form instead of on /auth. The server appends the
 * Google account's display name to that redirect
 * (?paGoogleName=...); combined with an authenticated /api/user call, this
 * script fills in the Name/Email fields (without overwriting anything the
 * user already typed) rather than logging them into an admin-style session
 * silently replacing the form.
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

  function makeGoogleBlock(onClick) {
    var wrap = document.createElement('div');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pa-google-btn';
    btn.innerHTML = GOOGLE_ICON + '<span>Continue with Google</span>';
    btn.addEventListener('click', onClick);

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

  // mode: 'auth' (login/register page, unchanged original behavior) or
  // 'lead' (Request Updates / Inquiry / Visit forms: round-trips through
  // Google and returns to the same form to prefill it).
  function patchForm(headingTexts, mode) {
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
    if (mode === 'lead') form.parentElement.setAttribute('data-pa-lead-form', '1');
    var onClick = mode === 'lead'
      ? function () {
          var returnTo = window.location.pathname + window.location.search;
          window.location.href = '/auth/google?returnTo=' + encodeURIComponent(returnTo);
        }
      : function () {
          window.location.href = '/auth/google';
        };
    form.parentElement.insertBefore(makeGoogleBlock(onClick), form);
    return true;
  }

  // ─── Prefill support for the lead-capture forms ────────────────────────
  var PREFILL_KEY = 'paGooglePrefill';
  var PREFILL_TTL_MS = 10 * 60 * 1000;

  function storePrefill(name, email) {
    try {
      sessionStorage.setItem(PREFILL_KEY, JSON.stringify({ name: name || '', email: email || '', ts: Date.now() }));
    } catch (e) {}
  }

  function getPrefill() {
    try {
      var raw = sessionStorage.getItem(PREFILL_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || Date.now() - data.ts > PREFILL_TTL_MS) {
        sessionStorage.removeItem(PREFILL_KEY);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  function setReactInputValue(input, value) {
    var proto = input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, 'value') && Object.getOwnPropertyDescriptor(proto, 'value').set;
    if (setter) setter.call(input, value); else input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function prefillAllKnownForms() {
    var profile = getPrefill();
    if (!profile || (!profile.name && !profile.email)) return;
    var wraps = document.querySelectorAll('[data-pa-lead-form="1"]');
    for (var i = 0; i < wraps.length; i++) {
      var form = wraps[i].querySelector('form');
      if (!form) continue;
      if (profile.email) {
        var emailInput = form.querySelector('input[type="email"]');
        if (emailInput && !emailInput.value) setReactInputValue(emailInput, profile.email);
      }
      if (profile.name) {
        var nameInput = form.querySelector('input[type="text"], input:not([type])');
        if (nameInput && !nameInput.value) setReactInputValue(nameInput, profile.name);
      }
    }
  }

  // Consumes the one-time ?paGoogleName=... marker left by the server
  // redirect, confirms the session via /api/user, caches the result, and
  // cleans the URL so it doesn't linger in the address bar.
  function consumeGoogleReturnMarker() {
    var params = new URLSearchParams(window.location.search);
    if (!params.has('paGoogleName')) return;
    var name = params.get('paGoogleName') || '';
    params.delete('paGoogleName');
    var newSearch = params.toString();
    var newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
    window.history.replaceState(window.history.state, '', newUrl);

    fetch('/api/user', { credentials: 'same-origin' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (user) {
        storePrefill(name, user && user.email);
        prefillAllKnownForms();
      })
      .catch(function () {});
  }

  function tryPatch() {
    var path = window.location.pathname;
    injectStyles();
    if (/^\/auth\/?$/.test(path)) {
      patchForm(['Account Login'], 'auth');
      patchForm(['Create Account'], 'auth');
    }
    if (path === '/') {
      patchForm(['Request Property Updates'], 'lead');
    }
    if (/^\/properties\//.test(path)) {
      patchForm(['Interested in this property?'], 'lead');
      patchForm(['Schedule a visit'], 'lead');
    }
    prefillAllKnownForms();
  }

  consumeGoogleReturnMarker();
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
