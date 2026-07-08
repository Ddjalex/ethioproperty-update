
(function () {
  'use strict';

  var KEY = '__ETHIO_PROPERTY_VIDEO_SYSTEM_FIX_V3__';
  if (window[KEY]) return;
  window[KEY] = true;

  var ADMIN_INPUT_ID = 'videoUrlPatchInput';
  var VIDEO_PANEL_ID = '__ethio_property_video_panel__';
  var VIDEO_TAB_ATTR = 'data-ethio-video-tab';
  var STYLE_ID = 'ethio-video-system-fix-style';
  var state = {
    currentPageKey: '',
    propertyId: null,
    videoUrl: '',
    initializedForPage: false
  };

  function normalize(value) {
    return String(value == null ? '' : value).trim();
  }

  function isAdminPropertyPage() {
    return /\/admin\/properties\/(edit\/\d+|new)$/i.test(location.pathname || '');
  }

  function isPropertyDetailPage() {
    return /\/properties\//i.test(location.pathname || '');
  }

  function getPageKey() {
    return location.pathname + '|' + location.search;
  }

  function getPropertyIdFromPath() {
    var path = location.pathname || '';
    var editMatch = path.match(/\/admin\/properties\/edit\/(\d+)/i);
    if (editMatch) return parseInt(editMatch[1], 10) || null;

    var seoMatch = path.match(/\/properties\/seo\/.*-(\d+)(?:\/)?$/i);
    if (seoMatch) return parseInt(seoMatch[1], 10) || null;

    var directMatch = path.match(/\/properties\/(\d+)(?:\/)?$/i);
    if (directMatch) return parseInt(directMatch[1], 10) || null;

    return null;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#' + VIDEO_PANEL_ID + ' { display:none; margin-top:16px; width:100%; }',
      '#' + VIDEO_PANEL_ID + '.is-active { display:block !important; }',
      '#' + VIDEO_PANEL_ID + ' .ethio-video-shell { position:relative; width:100%; padding-top:56.25%; background:#000; border-radius:12px; overflow:hidden; }',
      '#' + VIDEO_PANEL_ID + ' iframe { position:absolute; inset:0; width:100%; height:100%; border:0; }',
      '#' + VIDEO_PANEL_ID + ' .ethio-video-card { padding:14px; border:1px solid #e5e7eb; border-radius:12px; background:#fff; }',
      '[' + VIDEO_TAB_ATTR + '="1"] { cursor:pointer; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function findPropertyTabBar() {
    var tablists = Array.prototype.slice.call(document.querySelectorAll('[role="tablist"]'));
    for (var i = 0; i < tablists.length; i++) {
      var labels = Array.prototype.slice.call(tablists[i].querySelectorAll('button,a,[role="tab"]')).map(function (el) {
        return normalize(el.textContent).toLowerCase();
      });
      if (labels.indexOf('description') !== -1 && labels.indexOf('features') !== -1 && labels.indexOf('location') !== -1) {
        return tablists[i];
      }
    }

    var nodes = Array.prototype.slice.call(document.querySelectorAll('button,a,[role="tab"]'));
    var tabs = nodes.filter(function (el) {
      var t = normalize(el.textContent).toLowerCase();
      return t === 'description' || t === 'features' || t === 'location' || t === 'video';
    });
    if (!tabs.length) return null;
    var parent = tabs[0].parentElement;
    if (!parent) return null;
    var sameParentCount = tabs.filter(function (el) { return el.parentElement === parent; }).length;
    return sameParentCount >= 3 ? parent : null;
  }

  function getPropertyTabs(tabBar) {
    if (!tabBar) return [];
    return Array.prototype.slice.call(tabBar.querySelectorAll('button,a,[role="tab"]')).filter(function (el) {
      var t = normalize(el.textContent).toLowerCase();
      return t === 'description' || t === 'features' || t === 'location' || t === 'video';
    });
  }

  function getNativePanels() {
    return Array.prototype.slice.call(document.querySelectorAll('[role="tabpanel"]'));
  }

  function getVideoTab(tabBar) {
    var tabs = getPropertyTabs(tabBar);
    for (var i = 0; i < tabs.length; i++) {
      if (normalize(tabs[i].textContent).toLowerCase() === 'video') return tabs[i];
    }
    return null;
  }

  function stopVideoPlayback(panel) {
    if (!panel) return;
    Array.prototype.forEach.call(panel.querySelectorAll('iframe'), function (iframe) {
      try {
        var src = iframe.getAttribute('src');
        iframe.setAttribute('src', src || '');
      } catch (e) {}
    });
  }

  function markActiveTab(tabBar, activeName) {
    getPropertyTabs(tabBar).forEach(function (tab) {
      var name = normalize(tab.textContent).toLowerCase();
      var active = name === activeName;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.dataset.videoActive = active ? '1' : '0';
      if (name === 'video') {
        tab.setAttribute(VIDEO_TAB_ATTR, '1');
      }
    });
  }

  function showNativePanels(tabBar, activeName) {
    var panels = getNativePanels();
    panels.forEach(function (panel) {
      panel.style.display = '';
      panel.style.visibility = '';
      panel.style.opacity = '';
      panel.removeAttribute('hidden');
      panel.setAttribute('aria-hidden', 'false');
    });
    var videoPanel = document.getElementById(VIDEO_PANEL_ID);
    if (videoPanel) {
      videoPanel.classList.remove('is-active');
      videoPanel.style.display = 'none';
      videoPanel.setAttribute('hidden', 'hidden');
      stopVideoPlayback(videoPanel);
    }
    markActiveTab(tabBar, activeName);
  }

  function toYouTubeEmbed(url) {
    try {
      var u = new URL(url);
      var host = u.hostname.replace(/^www\./, '');
      var id = '';
      if (host === 'youtu.be') id = u.pathname.replace(/^\//, '');
      if (!id && (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com')) {
        if (u.pathname === '/watch') id = u.searchParams.get('v') || '';
        else if (u.pathname.indexOf('/shorts/') === 0) id = u.pathname.split('/shorts/')[1].split('/')[0];
        else if (u.pathname.indexOf('/embed/') === 0) id = u.pathname.split('/embed/')[1].split('/')[0];
      }
      if (!id) return null;
      return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id);
    } catch (e) {
      return null;
    }
  }

  function isTelegram(url) {
    try {
      var u = new URL(url);
      var host = u.hostname.replace(/^www\./, '');
      return host === 't.me' || host === 'telegram.me';
    } catch (e) {
      return false;
    }
  }

  function toTelegramEmbed(url) {
    try {
      var u = new URL(url);
      u.searchParams.set('embed', '1');
      return u.toString();
    } catch (e) {
      return null;
    }
  }

  function buildVideoPanelHtml(videoUrl) {
    var yt = toYouTubeEmbed(videoUrl);
    if (yt) {
      return '<div class="ethio-video-shell"><iframe src="' + yt + '" title="Property video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>';
    }
    var tg = isTelegram(videoUrl) ? toTelegramEmbed(videoUrl) : null;
    if (tg) {
      return '<div class="ethio-video-card"><div style="overflow:hidden;border-radius:12px;border:1px solid #e5e7eb;"><iframe src="' + tg + '" title="Property video" style="width:100%;height:520px;border:0;"></iframe></div><div style="margin-top:10px;font-size:12px;color:#6b7280;">If Telegram embed does not play, open the link directly below.</div><a href="' + videoUrl + '" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;">Open video link</a></div>';
    }
    return '<div class="ethio-video-card"><div style="font-weight:600;margin-bottom:8px;">Property video</div><a href="' + videoUrl + '" target="_blank" rel="noopener">Open video link</a></div>';
  }

  function ensureVideoPanel(tabBar, videoUrl) {
    var panel = document.getElementById(VIDEO_PANEL_ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = VIDEO_PANEL_ID;
      panel.setAttribute('hidden', 'hidden');
      var parent = tabBar.parentElement || tabBar;
      if (tabBar.nextSibling) parent.insertBefore(panel, tabBar.nextSibling);
      else parent.appendChild(panel);
    }
    panel.innerHTML = buildVideoPanelHtml(videoUrl);
    return panel;
  }

  function showVideoPanel(tabBar, videoUrl) {
    var panel = ensureVideoPanel(tabBar, videoUrl);
    getNativePanels().forEach(function (nativePanel) {
      nativePanel.style.display = 'none';
      nativePanel.setAttribute('hidden', 'hidden');
      nativePanel.setAttribute('aria-hidden', 'true');
    });
    panel.classList.add('is-active');
    panel.style.display = 'block';
    panel.removeAttribute('hidden');
    markActiveTab(tabBar, 'video');
  }

  function addVideoTab(tabBar, videoUrl) {
    var existing = getVideoTab(tabBar);
    if (!existing) {
      var sample = getPropertyTabs(tabBar)[0];
      var btn = document.createElement(sample && sample.tagName ? sample.tagName.toLowerCase() : 'button');
      if (btn.tagName.toLowerCase() === 'button') btn.type = 'button';
      btn.textContent = 'Video';
      btn.setAttribute(VIDEO_TAB_ATTR, '1');
      if (sample) {
        btn.className = sample.className;
        Array.prototype.slice.call(sample.attributes).forEach(function (attr) {
          if (/^(class|type|href|role|aria-controls|id)$/i.test(attr.name)) return;
          try { btn.setAttribute(attr.name, attr.value); } catch (e) {}
        });
      }
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        showVideoPanel(tabBar, state.videoUrl || videoUrl);
      }, true);
      btn.addEventListener('touchend', function (event) {
        event.preventDefault();
        event.stopPropagation();
        showVideoPanel(tabBar, state.videoUrl || videoUrl);
      }, { passive: false, capture: true });
      tabBar.appendChild(btn);
      existing = btn;
    }
    existing.setAttribute(VIDEO_TAB_ATTR, '1');
    ensureVideoPanel(tabBar, videoUrl);
  }

  async function fetchPropertyVideoById(id) {
    if (!id) return { id: null, videoUrl: '' };
    var response = await fetch('/api/properties/' + encodeURIComponent(id), { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to load property');
    var data = await response.json();
    return {
      id: data && data.id ? data.id : id,
      videoUrl: normalize(data && (data.videoUrl || data.video_url || data.video))
    };
  }

  async function loadCurrentPropertyVideo() {
    if (!isPropertyDetailPage()) return { id: null, videoUrl: '' };
    var pageKey = getPageKey();
    var propertyId = getPropertyIdFromPath();
    if (!propertyId) return { id: null, videoUrl: '' };
    if (state.currentPageKey === pageKey && state.propertyId === propertyId && state.initializedForPage) {
      return { id: state.propertyId, videoUrl: state.videoUrl };
    }
    var data = await fetchPropertyVideoById(propertyId);
    state.currentPageKey = pageKey;
    state.propertyId = data.id;
    state.videoUrl = data.videoUrl;
    state.initializedForPage = true;
    return data;
  }

  async function ensurePropertyVideoUi() {
    if (!isPropertyDetailPage()) return;
    ensureStyle();
    var tabBar = findPropertyTabBar();
    if (!tabBar) return;
    try {
      var data = await loadCurrentPropertyVideo();
      if (!data.videoUrl) {
        var existingPanel = document.getElementById(VIDEO_PANEL_ID);
        if (existingPanel) {
          existingPanel.remove();
        }
        var tab = getVideoTab(tabBar);
        if (tab) tab.remove();
        return;
      }
      addVideoTab(tabBar, data.videoUrl);
    } catch (e) {
      // ignore temporary navigation timing issues
    }
  }

  function hideVideoWhenOtherTabsClicked(event) {
    if (!isPropertyDetailPage()) return;
    var target = event.target && event.target.closest ? event.target.closest('button,a,[role="tab"]') : null;
    if (!target) return;
    var name = normalize(target.textContent).toLowerCase();
    if (name === 'description' || name === 'features' || name === 'location') {
      var tabBar = findPropertyTabBar();
      if (tabBar) {
        window.setTimeout(function () { showNativePanels(tabBar, name); }, 0);
        window.setTimeout(function () { showNativePanels(tabBar, name); }, 60);
      }
    }
  }

  function findFeaturedToggleLabel() {
    var labels = Array.prototype.slice.call(document.querySelectorAll('label'));
    for (var i = 0; i < labels.length; i++) {
      if (/featured property/i.test(labels[i].textContent || '')) return labels[i];
    }
    return null;
  }

  function insertAdminVideoField() {
    if (!isAdminPropertyPage()) return;
    if (document.getElementById(ADMIN_INPUT_ID)) return;
    // Don't add a second Video URL box if admin-amenities-patch already added one
    if (document.getElementById('property-video-url-patch')) return;
    var anchor = findFeaturedToggleLabel();
    if (!anchor) return;
    var container = (anchor.closest('div') && anchor.closest('div').parentElement) || anchor.closest('div') || anchor;
    if (!container || !container.parentElement) return;

    var wrapper = document.createElement('div');
    wrapper.style.marginTop = '12px';
    wrapper.innerHTML = [
      '<label style="display:block;font-size:14px;font-weight:600;margin-bottom:6px;">Video URL (YouTube or Telegram)</label>',
      '<input id="' + ADMIN_INPUT_ID + '" type="url" placeholder="https://youtu.be/VIDEO_ID or https://t.me/channel/123" style="width:100%;padding:10px 12px;border:1px solid #e5e7eb;border-radius:8px;outline:none;" />',
      '<div style="font-size:12px;color:#6b7280;margin-top:6px;">Saved per property ID from database.</div>'
    ].join('');
    container.parentElement.insertBefore(wrapper, container.nextSibling);
  }

  async function prefillAdminVideoField() {
    if (!isAdminPropertyPage()) return;
    var input = document.getElementById(ADMIN_INPUT_ID);
    if (!input) return;
    if (input.dataset.prefilled === '1') return;
    var propertyId = getPropertyIdFromPath();
    if (!propertyId) {
      input.dataset.prefilled = '1';
      return;
    }
    try {
      var data = await fetchPropertyVideoById(propertyId);
      input.value = normalize(data.videoUrl);
      input.dataset.prefilled = '1';
      input.dataset.propertyId = String(propertyId);
    } catch (e) {
      input.dataset.prefilled = '1';
    }
  }

  function patchFetchForAdminVideo() {
    if (window.__ethioAdminVideoFetchPatched) return;
    window.__ethioAdminVideoFetchPatched = true;
    var nativeFetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        if (/\/api\/admin\/properties(?:\/\d+)?$/i.test(url) && init && init.body) {
          var headers = new Headers(init.headers || {});
          var contentType = (headers.get('content-type') || headers.get('Content-Type') || '').toLowerCase();
          if (contentType.indexOf('application/json') !== -1) {
            var inputEl = document.getElementById(ADMIN_INPUT_ID);
            var videoUrl = normalize(inputEl ? inputEl.value : '');
            var body = JSON.parse(init.body);
            body.videoUrl = videoUrl;
            init.body = JSON.stringify(body);
          }
        }
      } catch (e) {}
      return nativeFetch.apply(this, arguments);
    };
  }

  function onDomChanged() {
    if (isAdminPropertyPage()) {
      insertAdminVideoField();
      prefillAdminVideoField();
    }
    if (isPropertyDetailPage()) {
      ensurePropertyVideoUi();
    }
  }

  function patchHistory() {
    if (window.__ethioVideoHistoryPatched) return;
    window.__ethioVideoHistoryPatched = true;
    var pushState = history.pushState;
    var replaceState = history.replaceState;
    function afterNav() {
      state.initializedForPage = false;
      setTimeout(onDomChanged, 40);
      setTimeout(onDomChanged, 180);
      setTimeout(onDomChanged, 500);
    }
    history.pushState = function () {
      var result = pushState.apply(this, arguments);
      afterNav();
      return result;
    };
    history.replaceState = function () {
      var result = replaceState.apply(this, arguments);
      afterNav();
      return result;
    };
    window.addEventListener('popstate', afterNav);
  }

  patchFetchForAdminVideo();
  patchHistory();
  document.addEventListener('click', hideVideoWhenOtherTabsClicked, true);
  document.addEventListener('touchend', hideVideoWhenOtherTabsClicked, true);

  var observer = new MutationObserver(function () {
    onDomChanged();
  });

  function start() {
    ensureStyle();
    onDomChanged();
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(onDomChanged, 200);
    setTimeout(onDomChanged, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
