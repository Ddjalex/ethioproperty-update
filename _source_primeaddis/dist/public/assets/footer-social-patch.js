(function () {
  var PATCH_KEY = '__primeAddisFooterSocialPatch_v5__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  /* ── Inject permanent CSS to hide Google Maps links ── */
  if (!document.getElementById('pa-hide-google-maps-css')) {
    var gmStyle = document.createElement('style');
    gmStyle.id = 'pa-hide-google-maps-css';
    gmStyle.textContent = 'a[href*="maps.app.goo.gl"], a[href*="maps.google.com"], a[href*="goo.gl/maps"] { display: none !important; }';
    document.head.appendChild(gmStyle);
  }

  /* ── Hide Google Maps links in footer ── */
  function hideGoogleLinks() {
    Array.from(document.querySelectorAll('a')).forEach(function (a) {
      var text = (a.textContent || '').trim();
      var href = (a.href || '');
      var isGoogleMaps = href.includes('maps.app.goo.gl') || href.includes('maps.google.com') || href.includes('goo.gl/maps');
      var isFindUs = text.toLowerCase().includes('find us on google') || text.toLowerCase().includes('google maps');
      if (isGoogleMaps || isFindUs) {
        a.style.setProperty('display', 'none', 'important');
        /* Also hide the closest wrapper (p, div, li, span) that only contains this link */
        var parent = a.parentElement;
        if (parent && parent !== document.body && (parent.tagName === 'P' || parent.tagName === 'LI' || parent.tagName === 'SPAN' || parent.tagName === 'DIV')) {
          var otherContent = (parent.textContent || '').replace(text, '').trim();
          if (!otherContent) parent.style.setProperty('display', 'none', 'important');
        }
      }
    });
  }

  /* ── TikTok icon: inject a fresh <a> into the footer social row ── */
  var tiktokInjected = false;
  var tiktokUrl = '';

  /* Fetch settings once */
  fetch('/api/site-settings', { credentials: 'same-origin' })
    .then(function (r) { return r.ok ? r.json() : {}; })
    .then(function (s) {
      tiktokUrl = ((s.tiktokUrl || s.tiktok_url || '')).trim();
      injectTikTok();
    })
    .catch(function () {});

  function injectTikTok() {
    if (tiktokInjected || !tiktokUrl) return;

    /* Find the footer social icons row — look for the Twitter/X anchor since it's always visible */
    var twitterA = document.querySelector('a[aria-label="Twitter"], a[aria-label="X"]');
    if (!twitterA) return;

    /* Don't inject twice */
    if (document.getElementById('pa-tiktok-link')) { tiktokInjected = true; return; }

    var tkA = document.createElement('a');
    tkA.id = 'pa-tiktok-link';
    tkA.href = tiktokUrl;
    tkA.target = '_blank';
    tkA.rel = 'noopener noreferrer';
    tkA.setAttribute('aria-label', 'TikTok');
    tkA.className = twitterA.className;
    tkA.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;';
    tkA.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:1.5rem;height:1.5rem;"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.77a4.85 4.85 0 0 1-1.01-.08z"/></svg>';

    /* Insert right after the Twitter anchor */
    twitterA.parentNode.insertBefore(tkA, twitterA.nextSibling);
    tiktokInjected = true;
  }

  var timer;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      hideGoogleLinks();
      injectTikTok();
    }, 200);
  }

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
  history.pushState = function () { _push.apply(this, arguments); tiktokInjected = false; schedule(); };
  window.addEventListener('popstate', function () { tiktokInjected = false; schedule(); });

  setTimeout(function () { hideGoogleLinks(); injectTikTok(); }, 800);
  setTimeout(function () { hideGoogleLinks(); injectTikTok(); }, 2000);
})();
