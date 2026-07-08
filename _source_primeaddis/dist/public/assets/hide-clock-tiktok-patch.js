(function () {
  var PATCH_KEY = '__primeAddisHideClockTiktokPatch_v1__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  function run() {
    /* ── 1. Hide any flex row that contains ONLY a Clock SVG with no text ── */
    /* The clock icon uses two path points: circle + polyline with "12 6 12 12 16 14" */
    var allPolylines = document.querySelectorAll('polyline[points="12 6 12 12 16 14"]');
    allPolylines.forEach(function (poly) {
      var row = poly.closest('.flex');
      if (!row) return;
      var text = (row.textContent || '').replace(/\s/g, '');
      if (!text) {
        row.style.display = 'none';
      }
    });

    /* ── 2. Hide any flex row that wraps a Clock SVG icon in a contact sidebar ──
       The clock SVG itself is within the icon wrapper; hide the whole row          */
    var svgEls = document.querySelectorAll('svg');
    svgEls.forEach(function (svg) {
      /* Lucide Clock has a circle + a polyline child */
      var hasCircle = svg.querySelector('circle[cx="12"][cy="12"][r="10"]');
      var hasPoly   = svg.querySelector('polyline[points="12 6 12 12 16 14"]');
      if (!hasCircle || !hasPoly) return;

      /* Walk up to the nearest flex row */
      var row = svg.closest('.flex');
      if (!row) return;

      /* Only hide if the text beside the icon is empty / whitespace */
      var clone = row.cloneNode(true);
      clone.querySelectorAll('svg').forEach(function (s) { s.remove(); });
      var textBesideIcon = (clone.textContent || '').trim();
      if (!textBesideIcon) {
        row.style.display = 'none';
      }
    });

    /* ── 3. Hide TikTok icon from the contact info sidebar
       (distinct from the "Connect With Us" social bar) ──                          */
    /* The sidebar TikTok link is rendered by React with id="social-tiktok"         */
    var tkEl = document.getElementById('social-tiktok');
    if (tkEl) {
      tkEl.style.display = 'none';
    }

    /* Also hide any <a> whose aria-label is "TikTok" that sits inside the
       contact info sidebar (not the pa-contact-social-icons section) */
    var tiktokLinks = document.querySelectorAll('a[aria-label="TikTok"]');
    tiktokLinks.forEach(function (a) {
      if (!a.closest('.pa-contact-social-icons')) {
        a.style.display = 'none';
      }
    });
  }

  /* Override the pa-tiktok-show-css injected by dynamic-contact-info-patch
     so that it always forces #social-tiktok to be hidden */
  function overrideTiktokCss() {
    var styleEl = document.getElementById('pa-tiktok-show-css');
    if (styleEl) {
      styleEl.textContent = '#social-tiktok { display: none !important; }';
    } else {
      var s = document.createElement('style');
      s.id = 'pa-tiktok-show-css';
      s.textContent = '#social-tiktok { display: none !important; }';
      document.head.appendChild(s);
    }
  }

  overrideTiktokCss();

  var timer;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(function () { overrideTiktokCss(); run(); }, 200);
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

  var pushState = history.pushState;
  history.pushState = function () { pushState.apply(this, arguments); schedule(); };
  window.addEventListener('popstate', schedule);

  setTimeout(run, 500);
  setTimeout(run, 1200);
  setTimeout(run, 2500);
})();
