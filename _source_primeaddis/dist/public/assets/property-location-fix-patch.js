(function () {
  var KEY = '__paLocFixV7__';
  if (window[KEY]) return;
  window[KEY] = true;

  /* Map: property id (string) → "Subcity, City" */
  var idMap = {};
  var loaded = false;

  function norm(v) { return (v == null ? '' : String(v)).trim(); }

  function buildIdMap(props) {
    idMap = {};
    props.forEach(function (p) {
      if (!p || p.id == null) return;
      var city    = norm(p.city);
      var subcity = norm(p.subcity || p.sub_city || '');
      if (!city && !subcity) return;
      idMap[String(p.id)] = subcity ? subcity + ', ' + city : city;
    });
  }

  /* Extract property ID from href.
     Works for /properties/7  AND  /properties/slug-title-7 */
  function idFromHref(href) {
    /* Use the same regex that compare-card-patch uses — it works in practice */
    var m = (href || '').match(/\/properties\/(\d+)/i);
    if (m) return m[1];
    /* Fallback: trailing number in the path segment */
    var seg = (href || '').split('?')[0].split('#')[0].replace(/\/$/, '').split('/').pop();
    var m2 = (seg || '').match(/(\d+)$/);
    return m2 ? m2[1] : null;
  }

  /* Use the same card-finding logic as compare-card-patch so we always
     search within exactly one card element. */
  function findCard(link) {
    return link.closest('.property-card') ||
           link.closest('[class*="property"]') ||
           link.closest('[class*="card"]') ||
           link;
  }

  function fixCards() {
    if (/^\/admin/i.test(location.pathname)) return;
    if (!Object.keys(idMap).length) return;

    var links = document.querySelectorAll('a[href*="/properties/"]');
    links.forEach(function (link) {
      var id = idFromHref(link.getAttribute('href') || link.href || '');
      if (!id || !idMap[id]) return;

      var card = findCard(link);
      var good = idMap[id];

      /* Find location spans inside this specific card.
         The React card uses <span class="line-clamp-1"> for the location line,
         rendering it as: address + ", " + city + ", " + state (separate children). */
      var spans = Array.from(card.querySelectorAll('span.line-clamp-1'));
      spans.forEach(function (span) {
        var txt = norm(span.textContent);
        if (txt === good) return;          /* already correct — skip */
        if (txt.indexOf(',') === -1) return; /* no comma → title span, not location */
        span.textContent = good;
      });
    });
  }

  function loadAndFix() {
    if (loaded) { fixCards(); return; }
    fetch('/api/properties', { credentials: 'include' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (data) {
        var arr = Array.isArray(data) ? data : (data.properties || []);
        buildIdMap(arr);
        loaded = true;
        fixCards();
      })
      .catch(function () {});
  }

  loadAndFix();
  [400, 900, 1800, 3500, 6000].forEach(function (d) {
    setTimeout(loadAndFix, d);
  });

  var fixTimer;
  new MutationObserver(function () {
    if (/^\/admin/i.test(location.pathname)) return;
    if (!loaded) return;
    clearTimeout(fixTimer);
    fixTimer = setTimeout(fixCards, 150);
  }).observe(document.body || document.documentElement,
    { childList: true, subtree: true });

  var origPush = history.pushState;
  history.pushState = function () {
    origPush.apply(this, arguments);
    setTimeout(loadAndFix, 300);
  };
  window.addEventListener('popstate', function () {
    setTimeout(loadAndFix, 300);
  });
})();
