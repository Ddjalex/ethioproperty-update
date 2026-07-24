/*
 * Property cards whose `images` array is empty fall back to a hardcoded
 * Unsplash URL baked into dist/dist/public/assets/index-CfYobwUw.js.
 * That URL can be slow or blocked, and it shows a generic red-house stock
 * photo that looks nothing like real Ethiopian property listings.
 *
 * Fix: intercept every <img> whose src is that Unsplash URL and replace it
 * with a real uploaded property photo from /uploads/. We cycle through a
 * curated list of real photos so each card shows a different image.
 */
(function () {
  if (window.__paPropertyImageFallbackV1__) return;
  window.__paPropertyImageFallbackV1__ = true;

  var UNSPLASH_FALLBACK = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa';

  // Real uploaded photos from the database, varied by look.
  // These are all confirmed present in /uploads/ and linked to real listings.
  var FALLBACK_POOL = [
    '/uploads/image-1783339203793-943453054.jpg',
    '/uploads/image-1783334315571-617255017.jpg',
    '/uploads/image-1783328170839-171065746.jpg',
    '/uploads/image-1783326121469-561302224.jpg',
    '/uploads/image-1781100835196-955148384.jpg',
    '/uploads/image-1781101398958-149775333.jpg',
    '/uploads/image-1781003028763-504212835.jpg',
    '/uploads/image-1781001755254-333457381.jpg',
    '/uploads/image-1779490071529-791945715.png',
    '/uploads/image-1779489844719-48149771.png',
    '/uploads/image-1779488507760-456161280.jpeg',
    '/uploads/image-1779487940397-566862301.jpeg',
    '/uploads/image-1778319210526-516562431.png',
    '/uploads/image-1778317860654-553314409.png',
    '/uploads/image-1778316817536-877062777.jpg',
  ];

  var poolIndex = 0;
  // Map element → assigned fallback so a re-run on the same element stays consistent
  var assigned = new WeakMap();

  function nextFallback() {
    var src = FALLBACK_POOL[poolIndex % FALLBACK_POOL.length];
    poolIndex++;
    return src;
  }

  function patchImg(img) {
    if (img.getAttribute('data-pa-fallback-patched') === '1') return;
    var src = img.getAttribute('src') || img.src || '';
    if (src.indexOf(UNSPLASH_FALLBACK) === -1) return;

    img.setAttribute('data-pa-fallback-patched', '1');
    var replacement = assigned.has(img) ? assigned.get(img) : nextFallback();
    assigned.set(img, replacement);
    img.src = replacement;
  }

  function tryPatch() {
    var imgs = document.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      patchImg(imgs[i]);
    }
  }

  // Also intercept future src assignments via error events (React sets src
  // after mount, so the attribute may appear after the initial querySelectorAll)
  document.addEventListener('error', function (e) {
    if (e.target && e.target.tagName === 'IMG') {
      patchImg(e.target);
    }
  }, true);

  tryPatch();

  var mo = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      // New nodes
      for (var j = 0; j < m.addedNodes.length; j++) {
        var node = m.addedNodes[j];
        if (node.nodeType !== 1) continue;
        if (node.tagName === 'IMG') {
          patchImg(node);
        } else {
          var imgs = node.querySelectorAll ? node.querySelectorAll('img') : [];
          for (var k = 0; k < imgs.length; k++) patchImg(imgs[k]);
        }
      }
      // Attribute changes (React updating src on existing img)
      if (m.type === 'attributes' && m.target.tagName === 'IMG') {
        patchImg(m.target);
      }
    }
  });
  mo.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src'],
  });

  // SPA navigation
  ['pushState', 'replaceState'].forEach(function (fn) {
    var orig = history[fn];
    history[fn] = function () {
      var ret = orig.apply(this, arguments);
      setTimeout(tryPatch, 100);
      return ret;
    };
  });
  window.addEventListener('popstate', function () { setTimeout(tryPatch, 100); });
})();
