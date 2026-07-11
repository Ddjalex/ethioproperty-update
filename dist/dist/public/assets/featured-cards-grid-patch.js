/*
 * Fix: the homepage "Featured Addis Ababa Properties for Sale" section uses
 * the exact same property-card component as the "All Ethiopian Properties
 * by Type" section further down — the visual "excess padding/whitespace"
 * difference the cards have is not a different card style, it's that the
 * Featured section's grid only goes up to `lg:grid-cols-3` while the All
 * Properties grid also has `xl:grid-cols-4`, so on wide screens Featured
 * cards render noticeably wider/roomier than the compact All Properties
 * cards.
 *
 * Fix is scoped to the Featured grid only (matched via its unique heading)
 * and reuses the already-compiled `xl:grid-cols-4` utility class — so it
 * can't affect the property-card component itself, other listing sections,
 * or property detail pages.
 */
(function () {
  if (window.__paFeaturedCardsGridPatchV1__) return;
  window.__paFeaturedCardsGridPatchV1__ = true;

  function findHeading(text) {
    var all = document.querySelectorAll('h2');
    for (var i = 0; i < all.length; i++) {
      if ((all[i].textContent || '').trim() === text) return all[i];
    }
    return null;
  }

  function tryPatch() {
    if (window.location.pathname !== '/') return;
    var heading = findHeading('Featured Addis Ababa Properties for Sale');
    if (!heading) return;
    var section = heading.closest('section');
    if (!section) return;
    var grids = section.querySelectorAll('div.grid');
    for (var i = 0; i < grids.length; i++) {
      var grid = grids[i];
      if (grid.getAttribute('data-pa-featured-grid-patched') === '1') continue;
      if (grid.classList.contains('lg:grid-cols-3') && !grid.classList.contains('xl:grid-cols-4')) {
        grid.classList.add('xl:grid-cols-4');
        grid.setAttribute('data-pa-featured-grid-patched', '1');
      }
    }
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
