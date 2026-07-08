(function () {
  var PATCH_KEY = '__paHomeFilterButtons_v8__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  var CSS = `
    #pa-filter-btns {
      display: flex;
      justify-content: center;
      gap: 10px;
      padding: 10px;
      margin: 0;
      background: transparent;
    }

    .pa-filter-btn {
      padding: 10px;
      width: 180px;
      margin: 8px;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      border: 2.5px solid #e2e8f0;
      background: #ffffff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.10);
      cursor: pointer;
      transition: all 0.2s ease;
      color: #1e293b;
      font-family: inherit;
      outline: none;
    }

    .pa-filter-btn:hover {
      box-shadow: 0 6px 20px rgba(0,0,0,0.14);
      transform: translateY(-2px);
    }

    .pa-filter-btn.pa-active {
      border-color: #b45309;
      background: #fffbf2;
      box-shadow: 0 4px 16px rgba(180,83,9,0.18);
    }

    .pa-filter-btn .pa-btn-icon {
      font-size: 30px;
      line-height: 1;
    }

    .pa-filter-btn .pa-btn-label {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      text-align: center;
      line-height: 1.3;
    }

    .pa-filter-btn .pa-btn-sub {
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }

    .pa-filter-btn.buy-btn .pa-btn-icon { color: #0f766e; }
    .pa-filter-btn.rent-btn .pa-btn-icon { color: #b45309; }
    .pa-filter-btn.buy-btn.pa-active { border-color: #0f766e; background: #f0fdfa; box-shadow: 0 4px 16px rgba(15,118,110,0.18); }
    .pa-filter-btn.rent-btn.pa-active { border-color: #b45309; background: #fffbf2; }

    @media (max-width: 480px) {
      #pa-filter-btns { padding: 10px; gap: 10px; }
      .pa-filter-btn { padding: 10px; width: 160px; margin: 8px; gap: 6px; }
      .pa-filter-btn .pa-btn-icon { font-size: 28px; }
      .pa-filter-btn .pa-btn-label { font-size: 13px; }
      .pa-filter-btn .pa-btn-sub { font-size: 11px; }
    }
  `;

  var styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  var activeFilter = null;

  function isHomePage() {
    var p = window.location.pathname;
    return p === '/' || p === '';
  }

  /**
   * Read the status of a property card by finding a leaf element
   * whose trimmed text is exactly "For Sale", "For Rent", or "Available".
   */
  function getCardStatus(card) {
    var allNodes = card.querySelectorAll('*');
    for (var i = allNodes.length - 1; i >= 0; i--) {
      var el = allNodes[i];
      if (el.children.length === 0) {
        var txt = (el.textContent || '').trim();
        if (txt === 'For Sale' || txt === 'For Rent' || txt === 'Available') {
          return txt;
        }
      }
    }
    return null;
  }

  /**
   * Find the section that contains the "Featured … for Sale" heading
   * to hide/show it when filtering for rent.
   */
  function findFeaturedForSaleSection() {
    var headings = document.querySelectorAll('h2, h3');
    for (var i = 0; i < headings.length; i++) {
      var txt = (headings[i].textContent || '').toLowerCase();
      if (txt.indexOf('featured') !== -1 && txt.indexOf('sale') !== -1) {
        /* Walk up to a meaningful section container */
        var el = headings[i];
        while (el && el.tagName !== 'SECTION' && el.tagName !== 'MAIN') {
          el = el.parentElement;
        }
        return el && el.tagName === 'SECTION' ? el : headings[i].closest('section') || headings[i].parentElement;
      }
    }
    return null;
  }

  /**
   * Find the section that holds all property listing cards (the grid).
   */
  function findAllPropertiesSection() {
    var headings = document.querySelectorAll('h2, h3');
    for (var i = 0; i < headings.length; i++) {
      var txt = (headings[i].textContent || '').toLowerCase();
      if (txt.indexOf('ethiopian') !== -1 || txt.indexOf('all') !== -1) {
        var el = headings[i];
        while (el && el.tagName !== 'SECTION' && el.tagName !== 'MAIN') {
          el = el.parentElement;
        }
        return el && el.tagName === 'SECTION' ? el : headings[i].closest('section') || headings[i].parentElement;
      }
    }
    return null;
  }

  function applyFilter(status) {
    /* --- Filter individual property cards --- */
    var cards = document.querySelectorAll('.property-card');
    cards.forEach(function (card) {
      if (status === null) {
        card.style.removeProperty('display');
        return;
      }

      var cardStatus = getCardStatus(card);

      if (cardStatus === null) {
        /* Can't determine status — leave visible */
        card.style.removeProperty('display');
        return;
      }

      if (cardStatus === status) {
        card.style.removeProperty('display');
      } else {
        card.style.setProperty('display', 'none', 'important');
      }
    });

    /* --- Show/hide the featured-for-sale section --- */
    var featuredSection = findFeaturedForSaleSection();
    if (featuredSection) {
      if (status === 'For Rent') {
        featuredSection.style.setProperty('display', 'none', 'important');
      } else {
        featuredSection.style.removeProperty('display');
      }
    }

    /* --- Scroll to the listings area --- */
    if (status !== null) {
      var target = (status === 'For Rent' ? findAllPropertiesSection() : null) || featuredSection || findAllPropertiesSection();
      if (target) {
        setTimeout(function () {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    }
  }

  function handleBtnClick(status, btn) {
    var allBtns = document.querySelectorAll('.pa-filter-btn');
    if (activeFilter === status) {
      activeFilter = null;
      allBtns.forEach(function (b) { b.classList.remove('pa-active'); });
      applyFilter(null);
    } else {
      activeFilter = status;
      allBtns.forEach(function (b) { b.classList.remove('pa-active'); });
      btn.classList.add('pa-active');
      applyFilter(status);
    }
  }

  function findInsertionPoint() {
    /* Insert the buttons just before the first section that has properties */
    var featuredSection = findFeaturedForSaleSection();
    if (featuredSection) return featuredSection;
    var allSection = findAllPropertiesSection();
    return allSection || null;
  }

  function createButtons() {
    if (!isHomePage()) return;
    if (document.getElementById('pa-filter-btns')) return;

    var insertBefore = findInsertionPoint();
    if (!insertBefore) return;

    var container = document.createElement('div');
    container.id = 'pa-filter-btns';

    var buyBtn = document.createElement('button');
    buyBtn.className = 'pa-filter-btn buy-btn';
    buyBtn.innerHTML =
      '<span class="pa-btn-icon">🏡</span>' +
      '<span class="pa-btn-label">Buy a home?</span>' +
      '<span class="pa-btn-sub">Browse properties for sale</span>';
    buyBtn.addEventListener('click', function () { handleBtnClick('For Sale', buyBtn); });

    var rentBtn = document.createElement('button');
    rentBtn.className = 'pa-filter-btn rent-btn';
    rentBtn.innerHTML =
      '<span class="pa-btn-icon">🔑</span>' +
      '<span class="pa-btn-label">Rent a home?</span>' +
      '<span class="pa-btn-sub">Browse properties for rent</span>';
    rentBtn.addEventListener('click', function () { handleBtnClick('For Rent', rentBtn); });

    container.appendChild(buyBtn);
    container.appendChild(rentBtn);

    insertBefore.parentElement.insertBefore(container, insertBefore);
  }

  function boot() {
    createButtons();
    setTimeout(createButtons, 500);
    setTimeout(createButtons, 1500);

    var lastPath = window.location.pathname;
    new MutationObserver(function () {
      var currentPath = window.location.pathname;
      if (currentPath !== lastPath) {
        lastPath = currentPath;
        activeFilter = null;
        if (!isHomePage()) {
          var el = document.getElementById('pa-filter-btns');
          if (el) el.remove();
        }
        return;
      }
      if (isHomePage() && !document.getElementById('pa-filter-btns')) {
        createButtons();
      }
    }).observe(document.body, { childList: true, subtree: true });

    ['pushState', 'replaceState'].forEach(function (method) {
      var orig = history[method];
      history[method] = function () {
        orig.apply(this, arguments);
        activeFilter = null;
        var el = document.getElementById('pa-filter-btns');
        if (!isHomePage() && el) el.remove();
        if (isHomePage() && !el) setTimeout(createButtons, 200);
      };
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
