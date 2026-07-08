(function () {
  var KEY = '__paHeroH1SeoV1__';
  if (window[KEY]) return;
  window[KEY] = true;

  var OLD_FRAGMENT = 'Real Estate for Sale in Addis Ababa';
  var NEW_TEXT     = "Ethiopia's First Real Estate Platform with 3D & VR Property Tours";

  function swapH1() {
    var h1s = document.querySelectorAll('h1');
    for (var i = 0; i < h1s.length; i++) {
      var el = h1s[i];
      if (el.textContent.indexOf('Real Estate for Sale') !== -1 ||
          el.textContent.indexOf('Real Estate in Addis') !== -1) {
        el.textContent = NEW_TEXT;
        return true;
      }
    }
    return false;
  }

  if (!swapH1()) {
    var obs = new MutationObserver(function () {
      if (swapH1()) obs.disconnect();
    });
    var target = document.body || document.documentElement;
    if (target) obs.observe(target, { childList: true, subtree: true });
    setTimeout(function () { swapH1(); obs.disconnect(); }, 5000);
  }
})();
