(function () {
  'use strict';

  var KEY = '__primeAddisHideSearchBarV2__';
  if (window[KEY]) return;
  window[KEY] = true;

  var style = document.createElement('style');
  style.id = 'pa-hide-search-bar-style';
  style.textContent = [
    'form[role="search"], form.search-form,',
    'input[placeholder*="Search by city"], input[placeholder*="Search by neighborhood"],',
    'input[placeholder*="Search by address"], input[placeholder*="property type"],',
    '[class*="search-bar"], [class*="searchbar"], [class*="SearchBar"], [class*="SearchForm"]',
    '{ display: none !important; }',

    /* Reduce hero height on mobile now that search bar is gone */
    '@media (max-width: 768px) {',
    '  main > *:first-child,',
    '  main .h-svh, main .min-h-svh, main .h-screen, main .min-h-screen,',
    '  main [class*="h-svh"], main [class*="min-h-svh"],',
    '  main [class*="h-screen"], main [class*="min-h-screen"] {',
    '    height: 38vh !important;',
    '    min-height: 38vh !important;',
    '    max-height: 38vh !important;',
    '  }',
    '}'
  ].join('');
  document.head.appendChild(style);

  function hideSearchBar() {
    var inputs = document.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      var placeholder = (inputs[i].placeholder || '').toLowerCase();
      if (
        placeholder.indexOf('search by city') !== -1 ||
        placeholder.indexOf('neighborhood') !== -1 ||
        placeholder.indexOf('property type') !== -1
      ) {
        var form = inputs[i].closest('form') || inputs[i].closest('div');
        while (form && form !== document.body) {
          var rect = form.getBoundingClientRect();
          if (rect.height > 30 && rect.height < 200) {
            form.style.setProperty('display', 'none', 'important');
            break;
          }
          form = form.parentElement;
        }
      }
    }
  }

  function shrinkHeroMobile() {
    if (window.innerWidth > 768) return;
    var main = document.querySelector('main');
    if (!main) return;
    var hero = main.firstElementChild;
    if (!hero || hero.id === 'pa-map-root') return;
    var TARGET = '38vh';
    hero.style.setProperty('height',     TARGET, 'important');
    hero.style.setProperty('min-height', TARGET, 'important');
    hero.style.setProperty('max-height', TARGET, 'important');
    hero.style.setProperty('overflow',   'hidden', 'important');
    var inner = hero.firstElementChild;
    if (inner) {
      inner.style.setProperty('height',     TARGET, 'important');
      inner.style.setProperty('min-height', TARGET, 'important');
      inner.style.setProperty('max-height', TARGET, 'important');
    }
    ['h-svh', 'min-h-svh', 'h-screen', 'min-h-screen'].forEach(function (cls) {
      hero.querySelectorAll('.' + cls).forEach(function (el) {
        el.style.setProperty('height',     TARGET, 'important');
        el.style.setProperty('min-height', TARGET, 'important');
        el.style.setProperty('max-height', TARGET, 'important');
      });
    });
  }

  function boot() {
    hideSearchBar();
    shrinkHeroMobile();
    setTimeout(function () { hideSearchBar(); shrinkHeroMobile(); }, 300);
    setTimeout(function () { hideSearchBar(); shrinkHeroMobile(); }, 800);
    setTimeout(function () { hideSearchBar(); shrinkHeroMobile(); }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  new MutationObserver(function () {
    hideSearchBar();
    if (window.innerWidth <= 768) shrinkHeroMobile();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
