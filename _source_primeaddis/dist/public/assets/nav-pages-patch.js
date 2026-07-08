(function () {
  'use strict';

  var KEY = '__primeAddisNavPagesV1__';
  if (window[KEY]) return;
  window[KEY] = true;

  var pages = {
    '/about': {
      title: 'About Prime Addis',
      eyebrow: 'About Us',
      body: [
        'Prime Addis helps buyers, renters, owners, and investors discover trusted real estate opportunities across Addis Ababa and Ethiopia.',
        'Our platform brings property listings, neighborhood information, direct contact options, and practical tools together in one simple experience.',
        'We focus on making property discovery clearer, faster, and more accessible for people looking for homes, apartments, villas, commercial spaces, and investment properties.'
      ],
      cards: [
        ['Local Focus', 'Listings and property information centered on Addis Ababa and Ethiopia.'],
        ['Simple Discovery', 'Search, compare, and contact property teams from one easy website.'],
        ['Trusted Connections', 'Direct contact options help visitors move from browsing to action.']
      ]
    },
    '/blog': {
      title: 'Prime Addis Blog',
      eyebrow: 'Blog',
      body: [
        'Read updates, property tips, neighborhood insights, and real estate guidance from Prime Addis.',
        'This page is ready for articles about buying, renting, investing, and understanding the Ethiopian property market.',
        'New posts can be added here as the site grows.'
      ],
      cards: [
        ['Buying Property in Addis Ababa', 'A practical guide for comparing locations, prices, and property types.'],
        ['Renting Tips', 'What renters should check before choosing an apartment, villa, or house.'],
        ['Investment Notes', 'Market observations for people exploring real estate opportunities in Ethiopia.']
      ]
    }
  };

  function styleText() {
    return [
      '.pa-page-shell{min-height:100vh;background:#f8fafc;color:#0f172a;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
      '.pa-page-nav{height:64px;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid #e5e7eb;position:sticky;top:0;z-index:50;}',
      '.pa-page-logo{display:flex;align-items:center;text-decoration:none;color:#0f172a;font-size:28px;font-weight:500;}',
      '.pa-page-logo img{height:38px;width:auto;}',
      '.pa-page-links{display:flex;align-items:center;gap:28px;font-size:15px;font-weight:500;}',
      '.pa-page-links a{color:#111827;text-decoration:none;}',
      '.pa-page-links a:hover{color:#C4922A;}',
      '.pa-page-hero{position:relative;overflow:hidden;background:linear-gradient(135deg,#0f172a,#1B2A4A);color:#fff;padding:86px 20px;}',
      '.pa-page-hero:after{content:"";position:absolute;inset:auto -80px -180px auto;width:360px;height:360px;background:rgba(196,146,42,.24);border-radius:999px;}',
      '.pa-page-container{max-width:1120px;margin:0 auto;position:relative;z-index:1;}',
      '.pa-page-eyebrow{color:#C4922A;text-transform:uppercase;letter-spacing:.14em;font-weight:800;font-size:13px;margin-bottom:14px;}',
      '.pa-page-title{font-size:clamp(38px,6vw,72px);line-height:1.02;font-weight:900;margin:0 0 22px;}',
      '.pa-page-lead{max-width:760px;font-size:19px;line-height:1.75;color:#e5e7eb;margin:0;}',
      '.pa-page-content{padding:56px 20px 76px;}',
      '.pa-page-text{background:#fff;border:1px solid #e5e7eb;border-radius:22px;padding:30px;box-shadow:0 18px 40px rgba(15,23,42,.08);margin-bottom:26px;}',
      '.pa-page-text p{font-size:17px;line-height:1.8;color:#334155;margin:0 0 18px;}',
      '.pa-page-text p:last-child{margin-bottom:0;}',
      '.pa-page-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;}',
      '.pa-page-card{background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:24px;box-shadow:0 12px 28px rgba(15,23,42,.06);}',
      '.pa-page-card h3{font-size:20px;margin:0 0 10px;color:#0f172a;}',
      '.pa-page-card p{font-size:15px;line-height:1.65;color:#475569;margin:0;}',
      '.pa-page-footer{background:#0f172a;color:#cbd5e1;text-align:center;padding:24px 20px;}',
      '@media(max-width:800px){.pa-page-nav{height:auto;align-items:flex-start;gap:14px;flex-direction:column;padding:14px 18px}.pa-page-links{gap:14px;flex-wrap:wrap}.pa-page-grid{grid-template-columns:1fr}.pa-page-hero{padding:62px 20px}.pa-page-logo{font-size:24px}}'
    ].join('');
  }

  function ensureStyle() {
    if (document.getElementById('pa-nav-pages-style')) return;
    var style = document.createElement('style');
    style.id = 'pa-nav-pages-style';
    style.textContent = styleText();
    document.head.appendChild(style);
  }

  function navHtml() {
    return '<nav class="pa-page-nav"><a class="pa-page-logo" href="/"><img src="/assets/prime-addis-logo.png" alt="Prime Addis"></a><div class="pa-page-links"><a href="/">Home</a><a href="/properties">Properties</a><a href="/about">About</a><a href="/blog">Blog</a><a href="/favorites">Favorites</a><a href="/contact">Contact</a></div><div id="pa-nav-bar" style="display:flex;align-items:center;gap:16px;flex-shrink:0;"></div></nav>';
  }

  function renderPage(path) {
    var page = pages[path];
    if (!page) return false;
    ensureStyle();
    var root = document.getElementById('root');
    if (!root) return false;
    root.innerHTML = '<div class="pa-page-shell">' + navHtml() + '<section class="pa-page-hero"><div class="pa-page-container"><div class="pa-page-eyebrow">' + page.eyebrow + '</div><h1 class="pa-page-title">' + page.title + '</h1><p class="pa-page-lead">' + page.body[0] + '</p></div></section><main class="pa-page-content"><div class="pa-page-container"><div class="pa-page-text">' + page.body.map(function (text) { return '<p>' + text + '</p>'; }).join('') + '</div><div class="pa-page-grid">' + page.cards.map(function (card) { return '<article class="pa-page-card"><h3>' + card[0] + '</h3><p>' + card[1] + '</p></article>'; }).join('') + '</div></div></main><footer class="pa-page-footer">Prime Addis Real Estate</footer></div>';
    removePortfolio();
    return true;
  }

  function isPortfolioText(text) {
    return (text || '').trim().toLowerCase() === 'portfolio';
  }

  function removePortfolio() {
    var nodes = document.querySelectorAll('a,button,li,span');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (isPortfolioText(node.textContent) || (node.getAttribute && String(node.getAttribute('href') || '').toLowerCase().indexOf('portfolio') !== -1)) {
        var target = node.closest && (node.closest('li') || node.closest('a') || node);
        if (target && target.parentNode) target.parentNode.removeChild(target);
      }
    }
  }

  function linkExists(href) {
    return !!document.querySelector('a[href="' + href + '"]');
  }

  function createNavLink(href, label) {
    var a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    a.style.cssText = 'font-size:15px;font-weight:500;color:#374151;text-decoration:none;cursor:pointer;';
    return a;
  }

  function isElementVisible(el) {
    if (!el) return false;
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /* ── Mobile: inject About + Blog into the open hamburger menu ── */
  function injectMobileMenuLinks() {
    if (pages[location.pathname]) return;
    if (window.innerWidth >= 768) return;

    // Find the visible Properties link in the mobile menu panel
    var propertiesLink = null;
    var allAnchors = document.querySelectorAll('a[href="/properties"]');
    for (var i = 0; i < allAnchors.length; i++) {
      if (isElementVisible(allAnchors[i])) {
        propertiesLink = allAnchors[i];
        break;
      }
    }
    if (!propertiesLink) return;

    var parent = propertiesLink.parentNode;
    if (!parent) return;

    // Already injected into this exact parent — skip
    if (parent.querySelector('a[href="/about"]')) return;

    // Read computed styles from the Properties link to match exactly
    var computed = window.getComputedStyle(propertiesLink);
    var matchedStyle = [
      'display:block',
      'font-size:' + computed.fontSize,
      'font-weight:' + computed.fontWeight,
      'color:' + computed.color,
      'text-decoration:none',
      'padding:' + computed.paddingTop + ' ' + computed.paddingRight + ' ' + computed.paddingBottom + ' ' + computed.paddingLeft,
      'line-height:' + computed.lineHeight,
      'letter-spacing:' + computed.letterSpacing,
      'background:none',
      'border:none',
      'width:100%',
      'box-sizing:border-box'
    ].join(';');

    var aboutLink = document.createElement('a');
    aboutLink.href = '/about';
    aboutLink.textContent = 'About';
    aboutLink.setAttribute('style', matchedStyle);

    var blogLink = document.createElement('a');
    blogLink.href = '/blog';
    blogLink.textContent = 'Blog';
    blogLink.setAttribute('style', matchedStyle);

    // Insert About then Blog right after the Properties link
    var nextSib = propertiesLink.nextSibling;
    parent.insertBefore(aboutLink, nextSib);
    parent.insertBefore(blogLink, aboutLink.nextSibling);
  }

  var _mobileInjectPending = false;
  function scheduleMobileLinks(delay) {
    if (_mobileInjectPending) return;
    _mobileInjectPending = true;
    setTimeout(function () {
      _mobileInjectPending = false;
      injectMobileMenuLinks();
    }, delay || 150);
  }

  /* ── Desktop nav injection ────────────────────────────────── */
  function injectLinks() {
    removePortfolio();
    if (pages[location.pathname]) return;
    var nav = document.querySelector('nav');
    if (!nav) return;
    var desktop = nav.querySelector('a[href="/properties"]');
    if (desktop && desktop.parentNode) {
      if (!linkExists('/about')) desktop.parentNode.insertBefore(createNavLink('/about', 'About'), desktop.nextSibling);
      var about = document.querySelector('a[href="/about"]');
      if (about && !linkExists('/blog')) about.parentNode.insertBefore(createNavLink('/blog', 'Blog'), about.nextSibling);
    }
    var links = nav.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      if ((links[i].textContent || '').trim() === 'Portfolio') links[i].remove();
    }
  }

  /* ── Bind hamburger button ────────────────────────────────── */
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
    hamburger.addEventListener('click', function () {
      // Schedule multiple attempts to catch after React animates the menu open
      setTimeout(injectMobileMenuLinks, 100);
      setTimeout(injectMobileMenuLinks, 300);
      setTimeout(injectMobileMenuLinks, 600);
    });
  }

  var _bindTimer = setInterval(function () {
    bindHamburger();
    if (_hamburgerBound) clearInterval(_bindTimer);
  }, 300);

  /* ── SPA routing ──────────────────────────────────────────── */
  function routeTo(path) {
    if (pages[path]) {
      history.pushState({}, '', path);
      renderPage(path);
      return true;
    }
    return false;
  }

  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    var url = new URL(link.href, location.origin);
    if (url.origin !== location.origin) return;
    if (pages[url.pathname]) {
      event.preventDefault();
      routeTo(url.pathname);
    }
  }, true);

  var originalPushState = history.pushState;
  history.pushState = function () {
    var result = originalPushState.apply(this, arguments);
    setTimeout(function () {
      renderPage(location.pathname);
      injectLinks();
    }, 40);
    return result;
  };

  window.addEventListener('popstate', function () {
    setTimeout(function () {
      renderPage(location.pathname);
      injectLinks();
    }, 40);
  });

  /* ── MutationObserver — only re-inject desktop links ─────── */
  new MutationObserver(function () {
    if (pages[location.pathname]) return;
    injectLinks();
    // For mobile: only schedule if About link is missing in the open menu
    if (window.innerWidth < 768) {
      var propertiesLinks = document.querySelectorAll('a[href="/properties"]');
      for (var i = 0; i < propertiesLinks.length; i++) {
        if (isElementVisible(propertiesLinks[i])) {
          var parent = propertiesLinks[i].parentNode;
          if (parent && !parent.querySelector('a[href="/about"]')) {
            scheduleMobileLinks(80);
          }
          break;
        }
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* ── Boot ─────────────────────────────────────────────────── */
  function boot() {
    if (!renderPage(location.pathname)) injectLinks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  var attempts = 0;
  var timer = setInterval(function () {
    attempts++;
    boot();
    if (attempts > 40) clearInterval(timer);
  }, 250);
})();
