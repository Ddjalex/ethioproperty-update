/*
 * Some property-type card images use dead/hotlink-blocked Unsplash URLs.
 * This patch listens for image load errors in capture phase and swaps in
 * local replacements by alt-text. Fires after React renders — reliable
 * regardless of render timing.
 */
(function () {
  if (window.__paPropertyTypeImageFixV1__) return;
  window.__paPropertyTypeImageFixV1__ = true;

  var REPLACEMENTS = {
    'Villa':     '/assets/villa-property-type.jpg',
    'Apartment': '/assets/apartment-property-type.jpg'
  };

  function fixImg(img) {
    var replacement = REPLACEMENTS[img.alt];
    if (!replacement) return;
    if (img.getAttribute('data-pa-type-fixed') === '1') return;
    img.setAttribute('data-pa-type-fixed', '1');
    img.src = replacement;
  }

  // Catch load errors on any img in the page (capture phase so it fires first)
  document.addEventListener('error', function (e) {
    if (e.target && e.target.tagName === 'IMG') fixImg(e.target);
  }, true);

  // Also scan on DOMContentLoaded and after React hydrates, in case an img
  // has already errored before this script ran.
  function scanAll() {
    document.querySelectorAll('img').forEach(function (img) {
      if (!img.complete || img.naturalWidth === 0) fixImg(img);
    });
  }
  document.addEventListener('DOMContentLoaded', scanAll);
  setTimeout(scanAll, 500);
  setTimeout(scanAll, 1500);
})();
