(function () {
  'use strict';
  var KEY = '__paMapV18__';
  if (window[KEY]) return;
  window[KEY] = true;

  /* ── Global mobile overflow + map responsive fixes ── */
  var _mapMobileStyle = document.createElement('style');
  _mapMobileStyle.textContent = [
    /* Prevent any element from causing horizontal scroll */
    'html,body{overflow-x:hidden!important;max-width:100vw!important;}',
    '*{box-sizing:border-box;}',
    /* Map section mobile layout */
    '@media(max-width:767px){',
      '#pa-map-root{padding:32px 12px 28px!important;}',
      '#pa-svg-wrap{min-height:unset!important;}',
      /* Stack the two flex children vertically and make them full width */
      '#pa-map-root > div > div{flex-direction:column!important;}',
      '#pa-map-root > div > div > div:first-child{flex:1 1 100%!important;min-width:0!important;width:100%!important;}',
      '#pa-map-root > div > div > div:last-child{flex:1 1 100%!important;min-width:0!important;width:100%!important;}',
    '}'
  ].join('');
  document.head.appendChild(_mapMobileStyle);

  var MODE     = 'all';
  var PROPS    = null;
  var SELECTED = null;
  var SVG_TEXT = null;

  var SUBCITY_NAMES = [
    'Kolfe Keraniyo','Gulele','Yeka','Addis Ketema','Arada',
    'Lideta','Kirkos','Bole','Lemi Kura','Nifas Silk Lafto','Akaki Kaliti'
  ];

  var ID_TO_NAME = {
    'Gullele':          'Gulele',
    'Arada':            'Arada',
    'Addis-Ketema':     'Addis Ketema',
    'Kirkos':           'Kirkos',
    'Yeka':             'Yeka',
    'Lemi-Kura':        'Lemi Kura',
    'subcity Bole':     'Bole',
    'Akaky-Kaliti':     'Akaki Kaliti',
    'Lideta':           'Lideta',
    'Kolfe-Keranio':    'Kolfe Keraniyo',
    'Nifas-Silk-Lafto': 'Nifas Silk Lafto'
  };

  var SCALE = ['#dce8f5','#b3cfe8','#7aaed4','#4089bf','#1f64a3','#0d3f7a'];
  var GOLD  = '#C4922A';

  function colorFor(n) {
    return n===0?SCALE[0]:n<3?SCALE[1]:n<6?SCALE[2]:n<10?SCALE[3]:n<15?SCALE[4]:SCALE[5];
  }
  function fmt(v) {
    if (!v) return 'ETB 0';
    return 'ETB ' + Number(v).toLocaleString('en-US');
  }

  function computeStats(mode, subcity) {
    var all = (PROPS||[]).filter(function(p){
      if (mode === 'all') return true;
      var s = (p.status||'').toLowerCase();
      return mode==='buy' ? (s.indexOf('sale')!==-1||s.indexOf('sold')!==-1)
                          : (s.indexOf('rent')!==-1);
    });
    var counts = {};
    SUBCITY_NAMES.forEach(function(n){ counts[n]=0; });
    all.forEach(function(p){
      var sc=(p.subcity||p.sub_city||'').trim();
      if(sc && counts[sc]!==undefined) counts[sc]++;
    });
    var filtered = subcity ? all.filter(function(p){
      return (p.subcity||p.sub_city||'').trim()===subcity;
    }) : all;
    var prices=[];
    filtered.forEach(function(p){ var pr=Number(p.price); if(pr>0) prices.push(pr); });
    return {
      counts:  counts,
      total:   filtered.length,
      highest: prices.length ? Math.max.apply(null,prices) : 0,
      avg:     prices.length ? Math.round(prices.reduce(function(a,b){return a+b;},0)/prices.length) : 0,
      lowest:  prices.length ? Math.min.apply(null,prices) : 0
    };
  }

  function applyColors(svgEl, counts) {
    var paths = svgEl.querySelectorAll('path[class*="subcity"]');
    paths.forEach(function(path) {
      var id   = path.id || '';
      var name = ID_TO_NAME[id];
      if (!name) return;
      var isSelected = SELECTED === name;
      var count = counts[name] || 0;
      path.style.fill        = isSelected ? GOLD : colorFor(count);
      path.style.stroke      = '#ffffff';
      path.style.strokeWidth = '1.5px';
      path.style.cursor      = 'pointer';
      path.style.transition  = 'fill 0.22s';
      path.style.filter      = '';
      path.setAttribute('data-sc-name',  name);
      path.setAttribute('data-sc-count', String(count));
    });

    svgEl.querySelectorAll('text, tspan').forEach(function(t) {
      t.style.fill         = '#111827';
      t.style.fontWeight   = '700';
      t.style.pointerEvents= 'none';
      t.style.fontSize     = '17px';
      t.style.fontFamily   = 'system-ui,sans-serif';
    });
  }

  function renderRealSVG(wrap, svgText, counts) {
    var modified = svgText
      .replace(/id=['"]svgCanvas\d*['"]/, 'id="pa-choropleth"')
      .replace(/background-color\s*:\s*[^;]+;/g, 'background-color:#f0f5fb;')
      .replace(/border\s*:\s*[^;]+;/g, '')
      .replace(/display\s*:\s*block[^;]*;/g, '')
      .replace(/margin-(?:left|right)\s*:\s*auto[^;]*;/g, '');

    wrap.innerHTML = modified;

    var svgEl = document.getElementById('pa-choropleth');
    if (!svgEl) return;

    svgEl.style.cssText = 'width:100%;display:block;border-radius:12px;';

    applyColors(svgEl, counts);
    attachSVGEvents(svgEl, wrap);
  }

  function loadAndRenderSVG(counts, callback) {
    var wrap = document.getElementById('pa-svg-wrap');
    if (!wrap) { if (callback) callback(); return; }
    if (SVG_TEXT) {
      renderRealSVG(wrap, SVG_TEXT, counts);
      if (callback) callback();
      return;
    }
    fetch('/assets/addis-subcities.svg?v=14')
      .then(function(r){ return r.text(); })
      .then(function(txt){
        SVG_TEXT = txt;
        renderRealSVG(wrap, SVG_TEXT, counts);
        if (callback) callback();
      })
      .catch(function(){
        wrap.innerHTML = '<p style="padding:40px;text-align:center;color:#9ca3af;">Map unavailable</p>';
        if (callback) callback();
      });
  }

  function refreshSVG() {
    var st  = computeStats(MODE, SELECTED);
    var svg = document.getElementById('pa-choropleth');
    if (svg) {
      applyColors(svg, st.counts);
    } else {
      loadAndRenderSVG(st.counts, null);
    }
    return st;
  }

  function updatePanel(st) {
    var set = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
    var title = document.getElementById('pa-market-title');
    if (title) title.textContent = SELECTED ? SELECTED+' Market' : 'Addis Ababa Market';
    set('pa-total',   st.total);
    set('pa-highest', fmt(st.highest));
    set('pa-avg',     fmt(st.avg));
    set('pa-lowest',  fmt(st.lowest));
    var link = document.getElementById('pa-explore-link');
    if (link) link.href = SELECTED ? '/properties?subcity='+encodeURIComponent(SELECTED) : '/properties';
    var all  = document.getElementById('pa-btn-all');
    var buy  = document.getElementById('pa-btn-buy');
    var rent = document.getElementById('pa-btn-rent');
    [['all',all],['buy',buy],['rent',rent]].forEach(function(pair){
      var m = pair[0], btn = pair[1];
      if (!btn) return;
      btn.style.background = MODE===m ? GOLD : '#fff';
      btn.style.color      = MODE===m ? '#fff' : '#374151';
    });
  }

  function updateUI() {
    var st = refreshSVG();
    updatePanel(st);
  }

  var _tipHideTimer = null;

  function positionTip(tip, wrap, clientX, clientY) {
    var box     = wrap.getBoundingClientRect();
    var tipW    = tip.offsetWidth  || 160;
    var tipH    = tip.offsetHeight || 36;
    var rawLeft = clientX - box.left + 14;
    var rawTop  = clientY - box.top  - 12;
    /* Clamp so the tooltip never overflows the right or bottom of the card */
    var maxLeft = box.width  - tipW  - 8;
    var maxTop  = box.height - tipH  - 8;
    tip.style.left = Math.max(4, Math.min(rawLeft, maxLeft)) + 'px';
    tip.style.top  = Math.max(4, Math.min(rawTop,  maxTop))  + 'px';
  }

  function showTip(tip, name, count) {
    if (!tip) return;
    tip.innerHTML = '<strong>' + name + '</strong>: ' + count +
      ' ' + (count === '1' ? 'property' : 'properties');
    tip.style.display = 'block';
  }

  function hideTip(tip) {
    if (tip) tip.style.display = 'none';
    clearTimeout(_tipHideTimer);
  }

  function attachSVGEvents(svgEl, wrap) {
    var tip = document.getElementById('pa-tip');

    /* ── Mouse events (desktop) ── */
    svgEl.addEventListener('mouseover', function(e) {
      var path = e.target;
      if (!path || !path.getAttribute) return;
      var name  = path.getAttribute('data-sc-name');
      if (!name) return;
      var count = path.getAttribute('data-sc-count') || '0';
      if (SELECTED !== name) path.style.filter = 'brightness(0.82)';
      showTip(tip, name, count);
    });

    svgEl.addEventListener('mousemove', function(e) {
      if (!tip || tip.style.display === 'none') return;
      positionTip(tip, wrap, e.clientX, e.clientY);
    });

    svgEl.addEventListener('mouseout', function(e) {
      var path = e.target;
      if (path && path.getAttribute && path.getAttribute('data-sc-name')) {
        path.style.filter = '';
      }
      var to = e.relatedTarget;
      if (!to || !to.getAttribute || !to.getAttribute('data-sc-name')) {
        hideTip(tip);
      }
    });

    svgEl.addEventListener('click', function(e) {
      var path = e.target;
      var name = path && path.getAttribute && path.getAttribute('data-sc-name');
      SELECTED = (name && SELECTED !== name) ? name : null;
      updateUI();
    });

    /* ── Touch events (mobile) ── */
    svgEl.addEventListener('touchstart', function(e) {
      var touch = e.changedTouches[0];
      var el    = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!el || !el.getAttribute) return;
      var name  = el.getAttribute('data-sc-name');
      if (!name) { hideTip(tip); return; }
      var count = el.getAttribute('data-sc-count') || '0';
      showTip(tip, name, count);
      positionTip(tip, wrap, touch.clientX, touch.clientY);
      /* Auto-hide after 2 s on mobile */
      clearTimeout(_tipHideTimer);
      _tipHideTimer = setTimeout(function() { hideTip(tip); }, 2000);
    }, { passive: true });

    svgEl.addEventListener('touchend', function(e) {
      var touch = e.changedTouches[0];
      var el    = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!el || !el.getAttribute) return;
      var name = el.getAttribute('data-sc-name');
      if (name) {
        SELECTED = (SELECTED !== name) ? name : null;
        updateUI();
      }
    }, { passive: true });
  }

  function inject() {
    if (document.getElementById('pa-map-root')) return true;
    var heading = null;
    Array.from(document.querySelectorAll('h2,h3,h4')).forEach(function(h){
      if (!heading && /explore\s+addis/i.test(h.textContent||'')) heading = h;
    });
    if (!heading) return false;

    var insertTarget = heading;
    for (var i=0; i<6; i++) {
      var p = insertTarget.parentElement;
      if (!p || p===document.body || p===document.documentElement) break;
      if (p.children.length > 1) break;
      insertTarget = p;
    }
    var anchor = insertTarget.parentElement || document.body;

    var initialSt = computeStats('buy', null);
    var scaleStripes = SCALE.map(function(c){
      return '<div style="flex:1;background:'+c+';height:100%;"></div>';
    }).join('');

    var html = [
      '<div id="pa-map-root" style="background:#f5f7fa;padding:60px 20px 52px;box-sizing:border-box;width:100%;">',

        '<h2 style="text-align:center;font-size:28px;font-weight:800;color:#111827;margin:0 0 6px;letter-spacing:-0.3px;">',
          'Price and Property Overview',
        '</h2>',
        '<p style="text-align:center;color:#6b7280;font-size:14px;margin:0 0 36px;">',
          'Click a subcity on the map to see its market statistics',
        '</p>',

        '<div style="display:flex;gap:28px;max-width:1120px;margin:0 auto;flex-wrap:wrap;align-items:flex-start;">',

          '<div style="flex:1 1 460px;background:#fff;border-radius:16px;overflow:hidden;',
               'border:1px solid #e5e7eb;box-shadow:0 4px 24px rgba(0,0,0,.07);position:relative;">',
            '<div id="pa-svg-wrap" style="width:100%;padding:10px;box-sizing:border-box;min-height:400px;">',
              '<div style="display:flex;align-items:center;justify-content:center;height:400px;',
                   'color:#9ca3af;font-size:14px;">Loading map\u2026</div>',
            '</div>',
            '<div id="pa-tip" style="display:none;position:absolute;pointer-events:none;',
                 'background:rgba(17,24,39,0.92);color:#fff;font-size:12px;padding:7px 12px;',
                 'border-radius:8px;white-space:nowrap;z-index:20;',
                 'box-shadow:0 4px 12px rgba(0,0,0,.22);">',
            '</div>',
          '</div>',

          '<div style="flex:0 0 278px;">',
            '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;',
                  'padding:26px 22px;box-shadow:0 4px 24px rgba(0,0,0,.07);">',

              '<p id="pa-market-title" style="font-size:19px;font-weight:800;color:#111827;',
                 'margin:0 0 18px;letter-spacing:-0.2px;">Addis Ababa Market</p>',

              '<div style="display:flex;border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:18px;">',
                '<button id="pa-btn-all" onclick="__paBuyRent(\'all\')"',
                  ' style="flex:1;padding:10px 0;border:none;cursor:pointer;font-size:13px;',
                         'font-weight:700;background:'+GOLD+';color:#fff;transition:background .2s,color .2s;">All</button>',
                '<button id="pa-btn-buy" onclick="__paBuyRent(\'buy\')"',
                  ' style="flex:1;padding:10px 0;border:none;cursor:pointer;font-size:13px;',
                         'font-weight:700;background:#fff;color:#374151;transition:background .2s,color .2s;">Buy</button>',
                '<button id="pa-btn-rent" onclick="__paBuyRent(\'rent\')"',
                  ' style="flex:1;padding:10px 0;border:none;cursor:pointer;font-size:13px;',
                         'font-weight:700;background:#fff;color:#374151;transition:background .2s,color .2s;">Rent</button>',
              '</div>',

              '<p style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin:0 0 6px;">Property Count Indicator</p>',
              '<div style="display:flex;height:10px;border-radius:6px;overflow:hidden;margin-bottom:4px;">'+scaleStripes+'</div>',
              '<div style="display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;margin-bottom:22px;">',
                '<span>Less</span><span>More</span>',
              '</div>',

              '<p style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin:0 0 6px;">Total Properties</p>',
              '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">',
                '<div style="width:40px;height:40px;border-radius:50%;background:#1B2A4A;',
                     'display:flex;align-items:center;justify-content:center;">',
                  '<span id="pa-total" style="color:#fff;font-size:15px;font-weight:800;">'+initialSt.total+'</span>',
                '</div>',
              '</div>',
              '<div style="height:3px;background:linear-gradient(to right,'+GOLD+',#1B2A4A);border-radius:2px;margin:10px 0 20px;"></div>',

              '<div>',
                '<div style="padding:12px 0;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;">',
                  '<div style="display:flex;align-items:center;gap:8px;">',
                    '<span style="width:22px;height:22px;border-radius:50%;border:1.5px solid #e5e7eb;',
                          'display:inline-flex;align-items:center;justify-content:center;">',
                      '<svg width="10" height="10" viewBox="0 0 10 10" fill="none">',
                        '<path d="M5 8V2M2 5l3-3 3 3" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
                      '</svg>',
                    '</span>',
                    '<span style="font-size:12px;color:#6b7280;">Highest Price</span>',
                  '</div>',
                  '<span id="pa-highest" style="font-size:13px;font-weight:700;color:#111827;">'+fmt(initialSt.highest)+'</span>',
                '</div>',
                '<div style="padding:12px 0;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;">',
                  '<div style="display:flex;align-items:center;gap:8px;">',
                    '<span style="width:22px;height:22px;border-radius:50%;border:1.5px solid #e5e7eb;',
                          'display:inline-flex;align-items:center;justify-content:center;">',
                      '<svg width="10" height="10" viewBox="0 0 10 10" fill="none">',
                        '<path d="M2 5h6" stroke="#374151" stroke-width="1.5" stroke-linecap="round"/>',
                      '</svg>',
                    '</span>',
                    '<span style="font-size:12px;color:#6b7280;">Average Price</span>',
                  '</div>',
                  '<span id="pa-avg" style="font-size:13px;font-weight:700;color:#111827;">'+fmt(initialSt.avg)+'</span>',
                '</div>',
                '<div style="padding:12px 0;display:flex;align-items:center;justify-content:space-between;">',
                  '<div style="display:flex;align-items:center;gap:8px;">',
                    '<span style="width:22px;height:22px;border-radius:50%;border:1.5px solid #e5e7eb;',
                          'display:inline-flex;align-items:center;justify-content:center;">',
                      '<svg width="10" height="10" viewBox="0 0 10 10" fill="none">',
                        '<path d="M5 2v6M8 5L5 8 2 5" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
                      '</svg>',
                    '</span>',
                    '<span style="font-size:12px;color:#6b7280;">Lowest Price</span>',
                  '</div>',
                  '<span id="pa-lowest" style="font-size:13px;font-weight:700;color:#111827;">'+fmt(initialSt.lowest)+'</span>',
                '</div>',
              '</div>',

              '<a id="pa-explore-link" href="/properties"',
                 ' style="display:flex;align-items:center;justify-content:center;gap:6px;',
                 'margin-top:20px;padding:12px;background:'+GOLD+';color:#fff;',
                 'border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;',
                 'transition:opacity .18s;" onmouseover="this.style.opacity=\'0.87\'" onmouseout="this.style.opacity=\'1\'">',
                'Explore Properties ',
                '<svg width="14" height="14" viewBox="0 0 14 14" fill="none">',
                  '<path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
                '</svg>',
              '</a>',

            '</div>',
          '</div>',

        '</div>',
      '</div>'
    ].join('');

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    anchor.insertBefore(wrapper.firstElementChild, insertTarget);

    loadAndRenderSVG(initialSt.counts, function() {
      updatePanel(initialSt);
    });

    return true;
  }

  window.__paBuyRent = function(mode) {
    MODE = mode;
    updateUI();
  };

  function fetchAndRender() {
    if (PROPS !== null) { tryInject(); return; }
    fetch('/api/properties?_mapTs='+Date.now(), { credentials:'include' })
      .then(function(r){ return r.ok?r.json():[]; })
      .then(function(data){
        PROPS = Array.isArray(data)?data:((data&&data.properties)||[]);
        tryInject();
      })
      .catch(function(){ PROPS=[]; tryInject(); });
  }

  var _attempts = 0;
  function tryInject() {
    if (document.getElementById('pa-map-root')) {
      if (PROPS !== null) updateUI();
      return;
    }
    if (_attempts > 30) return;
    _attempts++;
    var ok = inject();
    if (!ok) { setTimeout(tryInject, 400); }
    else { if (PROPS !== null) updateUI(); }
  }

  function onNav() {
    _attempts = 0;
    SELECTED  = null;
    var onHome = location.pathname==='/' || /^\/home/i.test(location.pathname);
    if (onHome) {
      var old = document.getElementById('pa-map-root');
      if (old) old.parentNode.removeChild(old);
      setTimeout(fetchAndRender, 400);
    }
  }
  var _origPush = history.pushState;
  history.pushState = function() { _origPush.apply(this,arguments); setTimeout(onNav,50); };
  window.addEventListener('popstate', function(){ setTimeout(onNav,50); });

  var _obs = new MutationObserver(function() {
    if (document.getElementById('pa-map-root')) return;
    var onHome = location.pathname==='/'||/^\/home/i.test(location.pathname);
    if (!onHome) return;
    var found = Array.from(document.querySelectorAll('h2,h3,h4')).some(function(h){
      return /explore\s+addis/i.test(h.textContent||'');
    });
    if (found && PROPS!==null) { _attempts=0; inject(); updateUI(); }
  });
  _obs.observe(document.documentElement,{childList:true,subtree:true});

  function boot() {
    var onHome = location.pathname==='/'||/^\/home/i.test(location.pathname);
    if (!onHome) return;
    fetchAndRender();
  }
  if (document.readyState==='loading') { document.addEventListener('DOMContentLoaded',boot); }
  else { boot(); }
  setTimeout(boot, 800);
  setTimeout(boot, 2200);
})();
