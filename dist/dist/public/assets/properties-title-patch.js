(function () {
  'use strict';
  var KEY = '__paPropertiesTitlePatchV1__';
  if (window[KEY]) return;
  window[KEY] = true;

  var SITE = 'Ethio Property';

  function onPropertiesPage() {
    return /^\/properties\/?$/.test(location.pathname);
  }

  function mode() {
    try {
      var qs = new URLSearchParams(window.location.search);
      return qs.get('status') === 'For Rent' ? 'rent' : 'sale';
    } catch (e) {
      return 'sale';
    }
  }

  function copyFor(m) {
    var isRent = m === 'rent';
    return {
      shortTitle: isRent ? 'Properties for Rent in Ethiopia' : 'Properties for Sale in Ethiopia',
      heading: isRent
        ? 'Properties for Rent in Ethiopia - Houses, Apartments & Commercial Real Estate'
        : 'Properties for Sale in Ethiopia - Houses, Apartments & Commercial Real Estate',
      description: isRent
        ? 'Browse our collection of rental properties across Ethiopia. Find your next rental home today!'
        : 'Browse our collection of real estate properties across Ethiopia. Find your dream property today!'
    };
  }

  function setMeta(selector, value) {
    var el = document.querySelector(selector);
    if (el && el.getAttribute('content') !== value) el.setAttribute('content', value);
  }

  function apply() {
    if (!onPropertiesPage()) return;
    var c = copyFor(mode());
    var fullTitle = c.shortTitle + ' | ' + SITE;

    if (document.title !== fullTitle) document.title = fullTitle;

    setMeta('meta[name="description"]', c.description);
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:description"]', c.description);
    setMeta('meta[property="twitter:title"]', fullTitle);
    setMeta('meta[property="twitter:description"]', c.description);

    var headings = document.querySelectorAll('h1');
    for (var i = 0; i < headings.length; i++) {
      var t = headings[i].textContent || '';
      if (/^Properties for (Sale|Rent) in Ethiopia/i.test(t) && t !== c.heading) {
        headings[i].textContent = c.heading;
      }
    }
  }

  function schedule() {
    apply();
    setTimeout(apply, 150);
    setTimeout(apply, 500);
    setTimeout(apply, 1200);
  }

  var _origPush = history.pushState;
  history.pushState = function () {
    _origPush.apply(this, arguments);
    setTimeout(schedule, 30);
  };
  var _origReplace = history.replaceState;
  history.replaceState = function () {
    _origReplace.apply(this, arguments);
    setTimeout(schedule, 30);
  };
  window.addEventListener('popstate', function () { setTimeout(schedule, 30); });

  var _obs = new MutationObserver(function () {
    if (onPropertiesPage()) apply();
  });
  _obs.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
})();
