/*
 * Fetches image_url from /api/property-types (DB-stored) and applies them
 * to property type card images on the homepage.
 * Overrides any hardcoded bundle URLs so the source of truth is the database.
 */
(function () {
  if (window.__paPropertyTypeDbImagesV1__) return;
  window.__paPropertyTypeDbImagesV1__ = true;

  var typeMap = {}; // lowercase name → image_url

  function applyImages() {
    var keys = Object.keys(typeMap);
    if (!keys.length) return;
    document.querySelectorAll('img[alt]').forEach(function (img) {
      var url = typeMap[img.alt.toLowerCase()];
      if (!url) return;
      // Only replace if the src is different (avoid flicker)
      var currentSrc = img.getAttribute('src') || '';
      if (currentSrc !== url) {
        img.setAttribute('src', url);
      }
    });
  }

  fetch('/api/property-types')
    .then(function (r) { return r.json(); })
    .then(function (types) {
      if (!Array.isArray(types)) return;
      types.forEach(function (t) {
        if (t.name && t.image_url) {
          typeMap[t.name.toLowerCase()] = t.image_url;
        }
      });
      if (!Object.keys(typeMap).length) return;

      applyImages();
      // Re-apply after React hydrates
      [300, 800, 2000].forEach(function (ms) {
        setTimeout(applyImages, ms);
      });

      // Watch for future React renders
      var mo = new MutationObserver(applyImages);
      mo.observe(document.documentElement, { childList: true, subtree: true });
    })
    .catch(function () {});
})();
