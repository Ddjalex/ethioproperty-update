/*
 * The "Villas for Sale in Ethiopia" tile on the homepage's "All Ethiopian
 * Properties by Type" grid falls back to a hardcoded Unsplash URL
 * (baked into dist/dist/public/assets/index-CfYobwUw.js, no source to edit
 * directly) whenever there are no Villa listings with photos yet. That
 * Unsplash URL is dead, so the tile shows a broken-image icon.
 *
 * Fix: swap that one <img alt="Villa"> to a local villa photo
 * (/assets/villa-property-type.jpg), matching this project's existing
 * convention of small vanilla-JS DOM patches for UI fixes with no source.
 */
(function () {
  if (window.__paVillaImagePatchV1__) return;
  window.__paVillaImagePatchV1__ = true;

  var REPLACEMENT_SRC = '/assets/villa-property-type.jpg';

  function tryPatch() {
    var imgs = document.querySelectorAll('img[alt="Villa"]');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (img.getAttribute('data-pa-villa-patched') === '1') continue;
      img.setAttribute('data-pa-villa-patched', '1');
      img.src = REPLACEMENT_SRC;
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
