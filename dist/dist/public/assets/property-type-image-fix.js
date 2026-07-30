/*
 * Two problems fixed here:
 *
 * 1. Redirect stale/dead Unsplash URLs baked into the bundle to local assets.
 *
 * 2. The property-type grid (e8 component) picks the first real property
 *    image (images[0]) once the /api/properties query resolves, overwriting
 *    the local asset src that was set during initial render. Those
 *    /uploads/ files are gone after a fresh import, so the tile goes blank.
 *    Fix: lock the src of each type-grid img to its designated local asset
 *    by overriding the HTMLImageElement prototype setter — React re-renders
 *    cannot escape it.
 *
 * Runs in <head> before React hydrates.
 */
(function () {
  if (window.__paPropertyTypeImageFixV4__) return;
  window.__paPropertyTypeImageFixV4__ = true;

  // alt-text → local asset (matches what the bundle sets as alt="<type>")
  var ALT_MAP = {
    'House':      '/assets/house-property-type.jpg',
    'Apartment':  '/assets/apartment-property-type.jpg',
    'Villa':      '/assets/villa-property-type.jpg',
    'Condo':      '/assets/condo-property-type.jpg',
    'Townhouse':  '/assets/townhouse-property-type.jpg',
    'Land':       '/assets/land-property-type.jpg',
  };

  // Unsplash photo-id → local asset (belt-and-suspenders for old bundle URLs)
  var URL_MAP = [
    { match: 'photo-1545324418',    replacement: '/assets/apartment-property-type.jpg'  },
    { match: 'photo-1622015663084', replacement: '/assets/villa-property-type.jpg'       },
    { match: 'photo-1580587771525', replacement: '/assets/house-property-type.jpg'       },
    { match: 'photo-1626178793926', replacement: '/assets/condo-property-type.jpg'       },
    { match: 'photo-1600607687939', replacement: '/assets/townhouse-property-type.jpg'   },
    { match: 'photo-1500382017468', replacement: '/assets/land-property-type.jpg'        },
  ];

  function redirectUrl(value, element) {
    if (typeof value !== 'string') return value;

    // If the element's alt matches a known property type, always lock the src.
    var alt = element && (element.alt || element.getAttribute('alt'));
    if (alt && ALT_MAP[alt]) {
      return ALT_MAP[alt];
    }

    // Unsplash URL interception (belt-and-suspenders)
    for (var i = 0; i < URL_MAP.length; i++) {
      if (value.indexOf(URL_MAP[i].match) !== -1) {
        return URL_MAP[i].replacement;
      }
    }
    return value;
  }

  // Patch the src property on HTMLImageElement.prototype
  var proto = HTMLImageElement.prototype;
  var descriptor = Object.getOwnPropertyDescriptor(proto, 'src');
  if (descriptor && descriptor.set) {
    Object.defineProperty(proto, 'src', {
      get: descriptor.get,
      set: function (value) {
        descriptor.set.call(this, redirectUrl(value, this));
      },
      configurable: true,
      enumerable: descriptor.enumerable,
    });
  }

  // Also patch setAttribute so React's setAttribute('src', ...) path is covered
  var origSetAttr = proto.setAttribute;
  proto.setAttribute = function (name, value) {
    if (name === 'src') value = redirectUrl(value, this);
    origSetAttr.call(this, name, value);
  };

  // Edge case: alt may be set AFTER src (React sometimes sets attrs in any order).
  // Use a MutationObserver to catch elements where alt arrives late.
  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.type !== 'attributes') continue;
      var el = m.target;
      if (el.tagName !== 'IMG') continue;
      var alt = el.alt;
      if (!alt || !ALT_MAP[alt]) continue;
      var desired = ALT_MAP[alt];
      // Only fix if the current src isn't already correct
      try {
        var currentSrc = el.getAttribute('src') || '';
        if (currentSrc !== desired && !currentSrc.startsWith('data:')) {
          el.src = desired; // goes through our patched setter
        }
      } catch (e) {}
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['alt', 'src'],
  });
})();
