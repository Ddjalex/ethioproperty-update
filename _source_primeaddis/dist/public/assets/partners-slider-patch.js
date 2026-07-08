(function () {
  var PATCH_KEY = '__primeAddisPartnerSlider_v6__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  var injected = false;

  /* ── Styles: bright, large, clearly visible ── */
  var style = document.createElement('style');
  style.textContent = `
    .pa-partners-section {
      background: linear-gradient(135deg, #f8f9ff 0%, #eef2ff 100%);
      padding: 44px 0 40px;
      border-top: 3px solid #C4922A;
      border-bottom: 3px solid #C4922A;
      box-shadow: 0 4px 24px rgba(27,42,74,0.08);
    }
    .pa-partners-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .pa-partners-title {
      text-align: center;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: #1B2A4A;
      margin-bottom: 30px;
    }
    .pa-partners-title span {
      display: inline-block;
      padding: 6px 22px;
      background: #1B2A4A;
      color: #C4922A;
      border-radius: 999px;
    }
    .pa-slider-wrap { overflow: hidden; position: relative; }
    .pa-slider-wrap::before,
    .pa-slider-wrap::after {
      content: '';
      position: absolute;
      top: 0; bottom: 0;
      width: 70px;
      z-index: 2;
      pointer-events: none;
    }
    .pa-slider-wrap::before { left: 0; background: linear-gradient(to right, #eef2ff, transparent); }
    .pa-slider-wrap::after  { right: 0; background: linear-gradient(to left, #eef2ff, transparent); }
    .pa-slider-track {
      display: flex;
      align-items: center;
      gap: 40px;
      animation: paScroll 24s linear infinite;
      width: max-content;
    }
    .pa-slider-track:hover { animation-play-state: paused; }
    @keyframes paScroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .pa-partner-logo {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      min-width: 140px;
      padding: 14px 20px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(27,42,74,0.10);
      border: 1.5px solid rgba(196,146,42,0.18);
      opacity: 1;
      transition: transform .2s, box-shadow .2s;
      text-decoration: none;
    }
    .pa-partner-logo:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 28px rgba(27,42,74,0.18);
      border-color: #C4922A;
    }
    .pa-partner-logo img {
      height: 64px;
      max-width: 160px;
      width: auto;
      object-fit: contain;
      filter: none;
      display: block;
    }
    .pa-partner-name {
      margin-top: 8px;
      font-size: 11px;
      font-weight: 700;
      color: #1B2A4A;
      text-align: center;
      letter-spacing: .04em;
      max-width: 130px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
  document.head.appendChild(style);

  function buildSlider(partners) {
    if (!partners.length) return null;
    var section = document.createElement('section');
    section.className = 'pa-partners-section';
    section.setAttribute('data-partners-slider', '1');

    var inner = document.createElement('div');
    inner.className = 'pa-partners-inner';

    var title = document.createElement('p');
    title.className = 'pa-partners-title';
    title.innerHTML = '<span>Our Trusted Partners</span>';

    var wrap = document.createElement('div');
    wrap.className = 'pa-slider-wrap';

    var track = document.createElement('div');
    track.className = 'pa-slider-track';

    function addLogos(list) {
      list.forEach(function (p) {
        var el = document.createElement(p.website_url ? 'a' : 'div');
        el.className = 'pa-partner-logo';
        if (p.website_url) {
          el.href = p.website_url;
          el.target = '_blank';
          el.rel = 'noreferrer noopener';
        }
        var img = document.createElement('img');
        img.src = p.logo_url;
        img.alt = p.name || 'Partner';
        img.title = p.name || '';
        img.loading = 'lazy';
        el.appendChild(img);
        if (p.name) {
          var nameEl = document.createElement('span');
          nameEl.className = 'pa-partner-name';
          nameEl.textContent = p.name;
          el.appendChild(nameEl);
        }
        track.appendChild(el);
      });
    }

    addLogos(partners);
    addLogos(partners); /* duplicate for seamless infinite loop */
    if (partners.length < 5) addLogos(partners);

    wrap.appendChild(track);
    inner.appendChild(title);
    inner.appendChild(wrap);
    section.appendChild(inner);
    return section;
  }

  /* ── Find the element AFTER which the slider should be inserted.
        Strategy: find the injected map root (#pa-map-root), then locate
        the sibling in the same parent that contains the "Explore Addis
        Ababa Subcities" heading, and return THAT sibling so the slider
        lands after the entire subcities section. ── */
  function findInsertAnchor() {
    /* Prefer anchoring off the map root — it's always at the right DOM level */
    var mapRoot = document.getElementById('pa-map-root');
    if (mapRoot && mapRoot.parentElement) {
      var parent = mapRoot.parentElement;
      var siblings = Array.from(parent.children);
      /* Find the sibling after the map root that contains the "Explore Addis" heading */
      var mapIdx = siblings.indexOf(mapRoot);
      for (var i = mapIdx + 1; i < siblings.length; i++) {
        var sib = siblings[i];
        if (/explore\s+addis/i.test(sib.textContent || '')) {
          return sib; /* insert slider after this sibling */
        }
      }
    }

    /* Fallback: walk up from the heading until we are a sibling of other top-level sections */
    var heading = null;
    var headings = document.querySelectorAll('h2, h3, h4');
    for (var j = 0; j < headings.length; j++) {
      if (/explore\s+addis/i.test(headings[j].textContent || '')) {
        heading = headings[j];
        break;
      }
    }
    if (!heading) return null;

    /* Walk up until parent has more than 2 children (past the heading+content wrapper) */
    var target = heading;
    for (var k = 0; k < 10; k++) {
      var p = target.parentElement;
      if (!p || p === document.body || p === document.documentElement) break;
      if (p.children.length > 2) break;
      target = p;
    }
    return target;
  }

  function tryInject() {
    if (injected) return;

    /* Only homepage */
    if (location.pathname !== '/' && !/^\/home\/?$/i.test(location.pathname)) return;

    /* Skip if already present */
    if (document.querySelector('[data-partners-slider]')) { injected = true; return; }

    var anchor = findInsertAnchor();
    if (!anchor) return;

    fetch('/api/partners', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (partners) {
        if (!partners.length) return;
        if (document.querySelector('[data-partners-slider]')) { injected = true; return; }
        var anchorNow = findInsertAnchor();
        if (!anchorNow) return;
        var slider = buildSlider(partners);
        if (!slider) return;
        anchorNow.insertAdjacentElement('afterend', slider);
        injected = true;
      })
      .catch(function () {});
  }

  var timer;
  function schedule() {
    injected = false;
    clearTimeout(timer);
    timer = setTimeout(tryInject, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else { schedule(); }

  new MutationObserver(function (m) {
    if (m.some(function (x) { return x.addedNodes.length > 0; })) {
      if (!injected) schedule();
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  var _push = history.pushState;
  history.pushState = function () { _push.apply(this, arguments); schedule(); };
  window.addEventListener('popstate', schedule);

  setTimeout(tryInject, 900);
  setTimeout(tryInject, 2200);
})();
