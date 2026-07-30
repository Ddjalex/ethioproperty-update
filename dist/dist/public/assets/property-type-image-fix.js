/*
 * Some property-type card images use dead/hotlink-blocked Unsplash URLs.
 *
 * Previous approaches (MutationObserver, onerror) failed because:
 *  - React re-renders reset the src after DOM patches.
 *  - Unsplash returns HTTP 200 for the Apartment URL (a placeholder),
 *    so onerror never fires.
 *
 * Fix: override HTMLImageElement.prototype's `src` setter so any attempt
 * to set a broken URL — even from React's virtual DOM reconciliation —
 * is silently redirected to a local asset BEFORE the request is made.
 * This runs in the <head> before React hydrates.
 */
(function () {
  if (window.__paPropertyTypeImageFixV2__) return;
  window.__paPropertyTypeImageFixV2__ = true;

  // Map: substring of bad URL → local replacement
  var URL_MAP = [
    { match: 'photo-1545324418', replacement: '/assets/apartment-property-type.jpg' }, // Apartment
    { match: 'photo-1622015663084', replacement: '/assets/villa-property-type.jpg' }   // Villa
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
