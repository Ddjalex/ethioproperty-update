/*
 * Redirect all property-type card Unsplash URLs to locally-served assets
 * so the homepage grid never relies on external hotlink-able images.
 *
 * Runs in the <head> before React hydrates, patching the img src setter
 * so even React re-renders cannot restore the dead Unsplash URL.
 */
(function () {
  if (window.__paPropertyTypeImageFixV3__) return;
  window.__paPropertyTypeImageFixV3__ = true;

  // Map: substring of Unsplash URL → local replacement
  var URL_MAP = [
    { match: 'photo-1545324418',    replacement: '/assets/apartment-property-type.jpg'  }, // Apartment (old bundle URL)
    { match: 'photo-1622015663084', replacement: '/assets/villa-property-type.jpg'       }, // Villa (old bundle URL)
    { match: 'photo-1580587771525', replacement: '/assets/house-property-type.jpg'       }, // House
    { match: 'photo-1626178793926', replacement: '/assets/condo-property-type.jpg'       }, // Condo
    { match: 'photo-1600607687939', replacement: '/assets/townhouse-property-type.jpg'   }, // Townhouse
    { match: 'photo-1500382017468', replacement: '/assets/land-property-type.jpg'        }  // Land
  ];

  function redirectUrl(value) {
    if (typeof value !== 'string') return value;
    for (var i = 0; i < URL_MAP.length; i++) {
      if (value.indexOf(URL_MAP[i].match) !== -1) {
        return URL_MAP[i].replacement;
      }
    }
    return value;
  }

  // Patch the src property on the HTMLImageElement prototype
  var proto = HTMLImageElement.prototype;
  var descriptor = Object.getOwnPropertyDescriptor(proto, 'src');
  if (descriptor && descriptor.set) {
    Object.defineProperty(proto, 'src', {
      get: descriptor.get,
      set: function (value) {
        descriptor.set.call(this, redirectUrl(value));
      },
      configurable: true,
      enumerable: descriptor.enumerable
    });
  }

  // Also patch setAttribute so React's setAttribute('src', ...) path is covered
  var origSetAttr = proto.setAttribute;
  proto.setAttribute = function (name, value) {
    if (name === 'src') value = redirectUrl(value);
    origSetAttr.call(this, name, value);
  };
})();
