/*
 * The "Apartments for Sale in Ethiopia" tile on the homepage's property-type
 * grid uses an Unsplash URL that is hotlink-blocked in browsers.
 * Fix: swap <img alt="Apartment"> to a locally-served image, matching the
 * same convention used by villa-image-patch.js.
 */
(function () {
  if (window.__paApartmentImagePatchV1__) return;
  window.__paApartmentImagePatchV1__ = true;

  var REPLACEMENT_SRC = '/assets/apartment-property-type.jpg';

  function tryPatch() {
    var imgs = document.querySelectorAll('img[alt="Apartment"]');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (img.getAttribute('data-pa-apt-patched') === '1') continue;
      img.setAttribute('data-pa-apt-patched', '1');
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
