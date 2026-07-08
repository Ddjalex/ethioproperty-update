(function () {
  'use strict';
  var KEY = '__paNavAuthV1__';
  if (window[KEY]) return;
  window[KEY] = true;

  var GOLD = '#C4922A';

  /* ─── Auth state ─────────────────────────────────────────── */
  var currentUser = null;
  var _fetching   = false;

  function fetchUser() {
    if (_fetching) return;
    _fetching = true;
    fetch('/api/user', { credentials: 'include' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(u) { _fetching = false; currentUser = u || null; renderNavButtons(); refreshMobileMenu(); })
      .catch(function() { _fetching = false; currentUser = null; renderNavButtons(); refreshMobileMenu(); });
  }

  /* ─── Logout ─────────────────────────────────────────────── */
  window.__paLogout = function() {
    fetch('/api/logout', { method: 'POST', credentials: 'include' })
      .then(function() { currentUser = null; renderNavButtons(); refreshMobileMenu(); window.location.href = '/'; })
      .catch(function() {});
  };

  /* ─── Desktop nav buttons ────────────────────────────────── */
  function navLinkStyle(extra) {
    return 'font-size:15px;font-weight:500;color:#374151;text-decoration:none;cursor:pointer;background:none;border:none;padding:0;' + (extra || '');
  }

  function renderNavButtons() {
    var bar = document.getElementById('pa-nav-bar');
    if (!bar) return;

    if (currentUser) {
      bar.innerHTML = [
        '<div style="display:flex;align-items:center;gap:12px;">',
          currentUser.isAdmin
            ? '<a href="/admin" style="padding:6px 14px;border-radius:8px;background:'+GOLD+';color:#fff;font-size:13px;font-weight:700;text-decoration:none;">Admin</a>'
            : '',
          '<div style="width:32px;height:32px;border-radius:50%;background:'+GOLD+';display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;">',
            (currentUser.username||'U')[0].toUpperCase(),
          '</div>',
          '<span style="font-size:14px;font-weight:500;color:#374151;">'+currentUser.username+'</span>',
          '<button onclick="window.__paLogout()" style="'+navLinkStyle()+'">Sign out</button>',
        '</div>'
      ].join('');
    } else {
      bar.innerHTML = [
        '<a href="/auth" style="'+navLinkStyle()+'">Login</a>',
        '<a href="/auth?tab=register" style="'+navLinkStyle('margin-left:4px;')+'">Register</a>'
      ].join('');
    }
  }

  /* ─── Mobile menu injection (Ask AI lives in the mobile header, not here) ─── */
  function buildMobileAuthHtml() {
    if (currentUser) {
      return '<div id="pa-mobile-auth" style="padding:16px 20px;border-top:1px solid #e5e7eb;display:flex;flex-direction:column;gap:8px;">'
        + (currentUser.isAdmin ? '<a href="/admin" style="display:block;font-size:16px;font-weight:500;color:#374151;text-decoration:none;padding:8px 0;">Admin Dashboard</a>' : '')
        + '<span style="font-size:14px;color:#6b7280;">Signed in as <strong>'+currentUser.username+'</strong></span>'
        + '<button onclick="window.__paLogout()" style="text-align:left;font-size:16px;font-weight:500;color:#374151;background:none;border:none;padding:8px 0;cursor:pointer;">Sign out</button>'
        + '</div>';
    }
    return '<div id="pa-mobile-auth" style="padding:16px 20px;border-top:1px solid #e5e7eb;display:flex;flex-direction:column;gap:4px;">'
      + '<div style="display:flex;gap:16px;padding-top:4px;">'
      + '<a href="/auth" style="font-size:16px;font-weight:500;color:#374151;text-decoration:none;padding:8px 0;">Login</a>'
      + '<a href="/auth?tab=register" style="font-size:16px;font-weight:500;color:'+GOLD+';text-decoration:none;padding:8px 0;">Register</a>'
      + '</div>'
      + '</div>';
  }

  function isElementVisible(el) {
    if (!el) return false;
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function injectIntoMobileMenu() {
    var old = document.getElementById('pa-mobile-auth');
    if (old) old.remove();

    var allLinks = document.querySelectorAll('a[href="/favorites"], a[href="/properties"], a[href="/contact"], a[href="/"]');
    var anchor = null;
    for (var i = 0; i < allLinks.length; i++) {
      if (isElementVisible(allLinks[i])) { anchor = allLinks[i]; break; }
    }
    if (!anchor) return;

    var container = anchor.parentElement;
    for (var depth = 0; depth < 6; depth++) {
      if (!container || container === document.body) break;
      var kids = container.children.length;
      if (kids >= 3) break;
      container = container.parentElement;
    }
    if (!container || container === document.body) return;

    if (container.id === 'pa-nav-bar' || container.querySelector('#pa-nav-bar')) return;
    if (container.closest('nav') && window.innerWidth >= 768) return;

    var tmp = document.createElement('div');
    tmp.innerHTML = buildMobileAuthHtml();
    container.appendChild(tmp.firstChild);
  }

  function buildMobileAuthFallbackHtml() {
    if (currentUser) {
      return (currentUser.isAdmin ? '<a href="/admin" style="display:block;font-size:18px;font-weight:500;color:#111827;text-decoration:none;padding:12px 20px;">Admin Dashboard</a>' : '')
        + '<div style="font-size:14px;color:#6b7280;padding:8px 20px;">Signed in as <strong>'+currentUser.username+'</strong></div>'
        + '<button onclick="window.__paLogout()" style="display:block;width:100%;text-align:left;font-size:18px;font-weight:500;color:#111827;background:none;border:none;padding:12px 20px;cursor:pointer;">Sign out</button>';
    }
    return '<a href="/auth" style="display:block;font-size:18px;font-weight:500;color:#111827;text-decoration:none;padding:12px 20px;">Login</a>'
      + '<a href="/auth?tab=register" style="display:block;font-size:18px;font-weight:500;color:#111827;text-decoration:none;padding:12px 20px 18px;">Register</a>';
  }

  function findVisibleMobileContactLink() {
    var links = document.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if ((link.textContent || '').trim().toLowerCase() !== 'contact') continue;
      if (!isElementVisible(link)) continue;
      var rect = link.getBoundingClientRect();
      if (rect.top > 0 && rect.top < Math.min(window.innerHeight * 0.65, 520)) return link;
    }
    return null;
  }

  function syncMobileAuthFallback() {
    var existing = document.getElementById('pa-mobile-auth-fallback');
    if (window.innerWidth >= 768) {
      if (existing) existing.remove();
      return;
    }
    var contact = findVisibleMobileContactLink();
    if (!contact) {
      if (existing) existing.remove();
      return;
    }
    var rect = contact.getBoundingClientRect();
    var top = Math.max(0, Math.round(rect.bottom + 16));
    var fallback = existing || document.createElement('div');
    fallback.id = 'pa-mobile-auth-fallback';
    fallback.style.cssText = 'position:fixed;left:0;right:0;top:'+top+'px;background:#fff;border-top:1px solid #eef0f3;border-bottom:1px solid #eef0f3;z-index:2147483646;box-shadow:0 1px 0 rgba(0,0,0,.04);';
    fallback.innerHTML = buildMobileAuthFallbackHtml();
    if (!existing) document.body.appendChild(fallback);
  }

  var _mobileInjectTimer = null;
  function scheduleMobileInject(delay) {
    clearTimeout(_mobileInjectTimer);
    _mobileInjectTimer = setTimeout(function() {
      injectIntoMobileMenu();
      syncMobileAuthFallback();
    }, delay || 80);
  }

  function refreshMobileMenu() {
    if (document.getElementById('pa-mobile-auth')) {
      var old = document.getElementById('pa-mobile-auth');
      old.remove();
      scheduleMobileInject(50);
    }
  }

  /* ─── Hamburger click → inject into opened mobile menu ─────── */
  var _hamburgerBound = false;
  function bindHamburger() {
    if (_hamburgerBound) return;
    var nav = document.querySelector('nav');
    if (!nav) return;
    var outerFlex = nav.querySelector(':scope > div') || nav.querySelector('div');
    if (!outerFlex) return;
    var hamburger = outerFlex.querySelector('button');
    if (!hamburger) return;
    _hamburgerBound = true;
    hamburger.addEventListener('click', function() {
      scheduleMobileInject(120);
      setTimeout(function() { scheduleMobileInject(0); }, 400);
    });
  }

  /* ─── Inject desktop nav bar ─────────────────────────────── */
  var _navAttempts = 0;

  function injectNavBar() {
    if (document.getElementById('pa-nav-bar')) {
      renderNavButtons();
      bindHamburger();
      return true;
    }
    var nav = document.querySelector('nav') || document.querySelector('header');
    if (!nav) return false;
    var outerFlex = nav.querySelector(':scope > div') || nav.querySelector('div') || nav;
    if (!outerFlex) return false;

    var bar = document.createElement('div');
    bar.id = 'pa-nav-bar';
    bar.style.cssText = 'display:flex;align-items:center;gap:16px;flex-shrink:0;';

    var hamburger = outerFlex.querySelector('button');
    if (hamburger && hamburger.parentNode === outerFlex) {
      outerFlex.insertBefore(bar, hamburger);
    } else {
      outerFlex.appendChild(bar);
    }
    renderNavButtons();
    bindHamburger();
    return true;
  }

  function tryInjectNav() {
    if (_navAttempts > 40) return;
    _navAttempts++;
    if (!injectNavBar()) setTimeout(tryInjectNav, 300);
  }

  /* ─── Watch for URL changes after SPA login redirect ────────── */
  var _lastHref = location.href;
  setInterval(function() {
    if (location.href !== _lastHref) {
      _lastHref = location.href;
      fetchUser();
    }
  }, 500);

  /* ─── MutationObserver — re-inject if nav is re-rendered ────── */
  var _obs = new MutationObserver(function() {
    if (!document.getElementById('pa-nav-bar')) {
      _navAttempts = 0;
      _hamburgerBound = false;
      tryInjectNav();
    }
    if (window.innerWidth < 768) scheduleMobileInject(80);
  });
  _obs.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('resize', function() { scheduleMobileInject(80); });
  window.addEventListener('scroll', function() { if (window.innerWidth < 768) syncMobileAuthFallback(); }, true);
  setInterval(function() { if (window.innerWidth < 768) syncMobileAuthFallback(); }, 500);

  /* ─── Boot ───────────────────────────────────────────────── */
  function boot() { tryInjectNav(); fetchUser(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  setTimeout(boot, 600);
  setTimeout(boot, 1500);
})();
