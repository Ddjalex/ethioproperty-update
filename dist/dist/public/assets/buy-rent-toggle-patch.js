(function () {
  'use strict';
  var KEY = '__paBuyRentToggleV1__';
  if (window[KEY]) return;
  window[KEY] = true;

  var MODE = 'buy'; /* 'buy' -> For Sale, 'rent' -> For Rent */
  var GOLD = '#0F1729';

  function syncModeFromUrl() {
    try {
      var qs = new URLSearchParams(window.location.search);
      var status = qs.get('status');
      if (status === 'For Rent') MODE = 'rent';
      else if (status === 'For Sale') MODE = 'buy';
    } catch (e) {}
  }

  function updateToggleUI() {
    var buyBtn = document.getElementById('pa-brt-buy');
    var rentBtn = document.getElementById('pa-brt-rent');
    if (!buyBtn || !rentBtn) return;
    var active = { background: GOLD, color: '#fff' };
    var inactive = { background: 'transparent', color: '#374151' };
    var buyStyle = MODE === 'buy' ? active : inactive;
    var rentStyle = MODE === 'rent' ? active : inactive;
    buyBtn.style.background = buyStyle.background;
    buyBtn.style.color = buyStyle.color;
    rentBtn.style.background = rentStyle.background;
    rentBtn.style.color = rentStyle.color;
  }

  function doSearch() {
    var input = document.querySelector('input[placeholder*="Search by city"]');
    var text = input ? input.value : '';
    var params = new URLSearchParams();
    if (text && text.trim()) params.set('search', text.trim());
    params.set('status', MODE === 'rent' ? 'For Rent' : 'For Sale');
    var url = '/properties?' + params.toString();
    showTransitionOverlay();
    window.history.pushState({}, '', url);
    window.dispatchEvent(new Event('locationchange'));
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  /* Brief dim + spinner over the search bar so a Buy/Rent click gives instant
     visual feedback while the properties page mounts and fetches results
     (that page shows its own skeleton once it takes over). */
  var _overlayHideTimer = null;
  function showTransitionOverlay() {
    var wrap = document.getElementById('pa-buy-rent-toggle');
    var input = document.querySelector('input[placeholder*="Search by city"]');
    var searchOuter = input ? input.closest('.relative.w-full.max-w-2xl.mx-auto') : null;
    if (!wrap || !searchOuter) return;
    var overlay = document.getElementById('pa-brt-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pa-brt-overlay';
      overlay.style.cssText = [
        'position:absolute;inset:0;z-index:5;border-radius:12px;',
        'background:rgba(255,255,255,0.55);display:flex;align-items:center;justify-content:center;',
        'transition:opacity .15s ease;opacity:0;pointer-events:none;'
      ].join('');
      var spinner = document.createElement('div');
      spinner.style.cssText = 'width:26px;height:26px;border-radius:50%;border:3px solid rgba(15,23,41,0.25);border-top-color:#0F1729;animation:pa-brt-spin .7s linear infinite;';
      overlay.appendChild(spinner);
      if (!document.getElementById('pa-brt-spin-kf')) {
        var style = document.createElement('style');
        style.id = 'pa-brt-spin-kf';
        style.textContent = '@keyframes pa-brt-spin{to{transform:rotate(360deg);}}';
        document.head.appendChild(style);
      }
      var host = wrap.parentElement;
      if (host && getComputedStyle(host).position === 'static') host.style.position = 'relative';
      if (host) host.appendChild(overlay);
    }
    overlay.style.opacity = '1';
    clearTimeout(_overlayHideTimer);
    _overlayHideTimer = setTimeout(function () {
      var el = document.getElementById('pa-brt-overlay');
      if (el) el.style.opacity = '0';
    }, 900);
  }

  function hijackSearchBar() {
    var input = document.querySelector('input[placeholder*="Search by city"]');
    if (!input) return false;
    var bar = input.closest('.relative.flex.items-center') || input.parentElement;
    var btn = bar ? bar.querySelector('button') : null;
    if (!btn) return false;

    if (!btn.__paBrtHijacked) {
      btn.__paBrtHijacked = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        doSearch();
      }, true);
    }
    if (!input.__paBrtHijacked) {
      input.__paBrtHijacked = true;
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          doSearch();
        }
      }, true);
    }
    return true;
  }

  function injectToggle() {
    if (document.getElementById('pa-buy-rent-toggle')) { hijackSearchBar(); updateToggleUI(); return true; }
    var input = document.querySelector('input[placeholder*="Search by city"]');
    if (!input) return false;
    var searchOuter = input.closest('.relative.w-full.max-w-2xl.mx-auto');
    if (!searchOuter || !searchOuter.parentElement) return false;

    var wrap = document.createElement('div');
    wrap.id = 'pa-buy-rent-toggle';
    wrap.style.cssText = 'display:flex;justify-content:center;margin-bottom:14px;';
    wrap.innerHTML =
      '<div style="display:inline-flex;background:#fff;border-radius:999px;padding:4px;' +
      'box-shadow:0 4px 14px rgba(0,0,0,.18);">' +
      '<button id="pa-brt-buy" type="button" style="border:none;cursor:pointer;font-size:14px;' +
      'font-weight:700;padding:9px 26px;border-radius:999px;transition:background .18s,color .18s;">Buy</button>' +
      '<button id="pa-brt-rent" type="button" style="border:none;cursor:pointer;font-size:14px;' +
      'font-weight:700;padding:9px 26px;border-radius:999px;transition:background .18s,color .18s;">Rent</button>' +
      '</div>';

    searchOuter.parentElement.insertBefore(wrap, searchOuter);

    document.getElementById('pa-brt-buy').addEventListener('click', function () {
      MODE = 'buy';
      updateToggleUI();
      doSearch();
    });
    document.getElementById('pa-brt-rent').addEventListener('click', function () {
      MODE = 'rent';
      updateToggleUI();
      doSearch();
    });

    updateToggleUI();
    hijackSearchBar();
    return true;
  }

  var _attempts = 0;
  function tryInject() {
    if (_attempts > 40) return;
    _attempts++;
    var onHome = location.pathname === '/' || /^\/home/i.test(location.pathname);
    if (!onHome) return;
    var ok = injectToggle();
    if (!ok) setTimeout(tryInject, 300);
  }

  function onNav() {
    _attempts = 0;
    syncModeFromUrl();
    var onHome = location.pathname === '/' || /^\/home/i.test(location.pathname);
    if (onHome) {
      setTimeout(tryInject, 300);
    } else {
      var old = document.getElementById('pa-buy-rent-toggle');
      if (old) old.parentNode.removeChild(old);
    }
  }

  var _origPush = history.pushState;
  history.pushState = function () {
    _origPush.apply(this, arguments);
    setTimeout(onNav, 50);
  };
  window.addEventListener('popstate', function () { setTimeout(onNav, 50); });

  var _obs = new MutationObserver(function () {
    var onHome = location.pathname === '/' || /^\/home/i.test(location.pathname);
    if (!onHome) return;
    if (document.getElementById('pa-buy-rent-toggle')) {
      hijackSearchBar();
      return;
    }
    _attempts = 0;
    injectToggle();
  });
  _obs.observe(document.documentElement, { childList: true, subtree: true });

  function boot() {
    syncModeFromUrl();
    tryInject();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  setTimeout(boot, 800);
  setTimeout(boot, 2200);
})();
