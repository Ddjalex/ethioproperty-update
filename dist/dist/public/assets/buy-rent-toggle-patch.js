(function () {
  'use strict';
  var KEY = '__paBuyRentToggleV1__';
  if (window[KEY]) return;
  window[KEY] = true;

  var MODE = 'buy'; /* 'buy' -> For Sale, 'rent' -> For Rent */
  var GOLD = '#0F1729';
  var FALLBACK_IMG = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80';

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

  function isOnHome() {
    return location.pathname === '/' || /^\/home/i.test(location.pathname);
  }

  function esc(s) {
    return (s == null ? '' : String(s)).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtNum(n) {
    var v = typeof n === 'number' ? n : Number(n) || 0;
    return v.toLocaleString();
  }

  /* --- In-place homepage filtering (Buy/Rent + search) --- */

  function findFeaturedSection() {
    var headings = document.querySelectorAll('h2');
    for (var i = 0; i < headings.length; i++) {
      var t = headings[i].textContent || '';
      if (/Featured Addis Ababa Properties for (Sale|Rent)/i.test(t)) {
        var section = headings[i].closest('section') || headings[i].parentElement;
        return { heading: headings[i], section: section };
      }
    }
    return null;
  }

  function getCardsGrid(section) {
    if (!section) return null;
    var grids = section.querySelectorAll('.grid');
    for (var i = 0; i < grids.length; i++) {
      var cls = grids[i].className || '';
      if (cls.indexOf('lg:grid-cols-3') !== -1 && cls.indexOf('md:grid-cols-2') !== -1) return grids[i];
    }
    return grids.length ? grids[grids.length - 1] : null;
  }

  function skeletonCard() {
    return (
      '<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);height:400px;">' +
      '<div style="height:208px;width:100%;background:#e2e8f0;"></div>' +
      '<div style="padding:20px;">' +
      '<div style="height:20px;width:75%;background:#e2e8f0;border-radius:4px;margin-bottom:12px;"></div>' +
      '<div style="height:16px;width:100%;background:#e2e8f0;border-radius:4px;margin-bottom:8px;"></div>' +
      '<div style="height:16px;width:66%;background:#e2e8f0;border-radius:4px;"></div>' +
      '</div></div>'
    );
  }

  function skeletonHtml(n) {
    var out = '';
    for (var i = 0; i < n; i++) out += skeletonCard();
    return out;
  }

  function buildCard(p) {
    var img = (p.images && p.images[0]) || FALLBACK_IMG;
    var isRent = p.status === 'For Rent';
    var badgeStyle = isRent
      ? 'background:#dbeafe;border:1px solid #3b82f6;color:#1d4ed8;'
      : 'background:#f1f5f9;border:1px solid #f1f5f9;color:#0f172a;';
    var href = '/properties/' + p.id;
    return (
      '<a href="' + href + '" class="pa-brt-card" style="display:block;text-decoration:none;">' +
      '<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);height:100%;">' +
      '<div style="position:relative;width:100%;padding-top:66.67%;">' +
      '<img src="' + esc(img) + '" alt="' + esc(p.title) + '" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;background:#f1f5f9;" onerror="this.onerror=null;this.src=\'' + FALLBACK_IMG + '\';" />' +
      (p.isFeatured ? '<div style="position:absolute;top:16px;left:16px;background:#f97316;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;padding:4px 8px;border-radius:4px;">Featured</div>' : '') +
      '</div>' +
      '<div style="padding:20px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;gap:8px;">' +
      '<h3 style="font-size:18px;font-weight:700;color:#0f172a;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">' + esc(p.title) + '</h3>' +
      '<span style="font-size:18px;font-weight:700;color:' + GOLD + ';white-space:nowrap;">$' + fmtNum(p.price) + '</span>' +
      '</div>' +
      '<p style="color:#64748b;margin:0 0 16px;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(p.address) + ', ' + esc(p.city) + ', ' + esc(p.state) + '</p>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f1f5f9;padding-top:16px;">' +
      '<div style="display:flex;gap:14px;font-size:13px;color:#334155;">' +
      '<span>' + (p.bedrooms || 0) + ' bd</span><span>' + (p.bathrooms || 0) + ' ba</span><span>' + fmtNum(p.squareFeet) + ' sqft</span>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">' +
      '<span style="font-size:11px;font-weight:600;border:1px solid rgba(15,23,41,.3);color:' + GOLD + ';border-radius:999px;padding:2px 10px;">' + esc(p.propertyType) + '</span>' +
      '<span style="font-size:11px;font-weight:600;border-radius:999px;padding:2px 10px;' + badgeStyle + '">' + esc(p.status || 'Available') + '</span>' +
      '</div></div></div></div></a>'
    );
  }

  function wireInPlaceLinks(grid) {
    var links = grid.querySelectorAll('a.pa-brt-card, a.pa-brt-browse');
    for (var i = 0; i < links.length; i++) {
      (function (a) {
        a.addEventListener('click', function (e) {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
          e.preventDefault();
          var href = a.getAttribute('href');
          window.history.pushState({}, '', href);
          window.dispatchEvent(new Event('locationchange'));
          window.dispatchEvent(new PopStateEvent('popstate'));
        });
      })(links[i]);
    }
  }

  /* Returns true if the featured section was found and an in-place update was
     kicked off (async). Returns false if the section isn't on the page yet,
     so the caller can fall back to navigating to /properties. */
  function applyHomeFilter(searchText) {
    var found = findFeaturedSection();
    if (!found || !found.section) return false;
    var grid = getCardsGrid(found.section);
    if (!grid) return false;

    var isRent = MODE === 'rent';
    var statusStr = isRent ? 'For Rent' : 'For Sale';
    found.heading.textContent = 'Featured Addis Ababa Properties for ' + (isRent ? 'Rent' : 'Sale');
    grid.innerHTML = skeletonHtml(3);

    var qs = new URLSearchParams();
    qs.set('status', statusStr);
    if (searchText && searchText.trim()) qs.set('search', searchText.trim());
    var browseHref = '/properties?' + qs.toString();

    fetch('/api/properties?' + qs.toString(), { headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('bad response');
        return r.json();
      })
      .then(function (list) {
        if (!Array.isArray(list)) list = [];
        list.sort(function (a, b) {
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        });
        var top = list.slice(0, 5);
        if (!top.length) {
          grid.innerHTML =
            '<div style="grid-column:1/-1;text-align:center;padding:40px 0;">' +
            '<p style="color:#64748b;margin-bottom:16px;">No ' + (isRent ? 'rental' : 'for-sale') + ' properties available right now.</p>' +
            '<a href="' + browseHref + '" class="pa-brt-browse" style="display:inline-block;background:#0f766e;color:#fff;font-weight:700;padding:10px 20px;border-radius:8px;text-decoration:none;">Browse All Properties</a>' +
            '</div>';
        } else {
          grid.innerHTML =
            top.map(buildCard).join('') +
            '<div style="grid-column:1/-1;margin-top:8px;text-align:center;">' +
            '<a href="' + browseHref + '" class="pa-brt-browse" style="display:inline-block;background:#0f766e;color:#fff;font-weight:700;font-size:16px;padding:14px 22px;border-radius:10px;text-decoration:none;">View More Properties</a>' +
            '</div>';
        }
        wireInPlaceLinks(grid);
      })
      .catch(function () {
        grid.innerHTML =
          '<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:#64748b;">' +
          "Couldn't load properties. Please try again." +
          '</div>';
      });

    return true;
  }

  function navigateToProperties(text) {
    var params = new URLSearchParams();
    if (text && text.trim()) params.set('search', text.trim());
    params.set('status', MODE === 'rent' ? 'For Rent' : 'For Sale');
    var url = '/properties?' + params.toString();
    showTransitionOverlay();
    window.history.pushState({}, '', url);
    window.dispatchEvent(new Event('locationchange'));
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  function doSearch() {
    var input = document.querySelector('input[placeholder*="Search by city"]');
    var text = input ? input.value : '';
    if (isOnHome()) {
      showTransitionOverlay();
      var applied = applyHomeFilter(text);
      if (applied) return;
      /* Featured section isn't on the page yet (still loading) -- fall back
         to the properties page so the click always does something. */
    }
    navigateToProperties(text);
  }

  /* Brief dim + spinner over the search bar so a Buy/Rent click gives instant
     visual feedback while results refresh in place. */
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
    if (!isOnHome()) return;
    var ok = injectToggle();
    if (!ok) setTimeout(tryInject, 300);
  }

  function onNav() {
    _attempts = 0;
    syncModeFromUrl();
    if (isOnHome()) {
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
    if (!isOnHome()) return;
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
