(function () {
  var PATCH_KEY = '__ethio_public_video_currency_patch_v3__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  function replaceDollarText(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    var text = node.nodeValue;
    if (!text || text.indexOf('$') === -1) return;
    node.nodeValue = text.replace(/\$/g, 'ETB ');
  }

  function walkAndReplace(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) replaceDollarText(node);
  }

  function isPropertyDetailsPage() {
    return /^\/properties\//i.test(location.pathname || '');
  }

  function getPropertySlug() {
    var path = location.pathname || '';
    var m = path.match(/^\/properties\/(.+)$/i);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function getPropertyIdFromPath() {
    var slug = getPropertySlug();
    if (!slug) return '';
    var m = slug.match(/^(\d+)/);
    return m ? m[1] : '';
  }

  function fetchJson(url) {
    return fetch(url, { credentials: 'include' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
      return res.json();
    });
  }

  function loadPropertyData() {
    if (!isPropertyDetailsPage()) return Promise.reject(new Error('not-property-page'));

    var slug = getPropertySlug();
    var id = getPropertyIdFromPath();
    var attempts = [];

    if (slug) attempts.push('/api/properties/seo/' + encodeURIComponent(slug));
    if (id) attempts.push('/api/properties/' + encodeURIComponent(id));

    var index = 0;
    function next() {
      if (index >= attempts.length) return Promise.reject(new Error('no-property-api-worked'));
      var url = attempts[index++];
      return fetchJson(url).catch(next);
    }
    return next();
  }

  function normalizeYouTubeEmbed(url) {
    try {
      var u = new URL(url, location.origin);
      var host = (u.hostname || '').replace(/^www\./, '').toLowerCase();
      var id = '';

      if (host === 'youtu.be') {
        id = u.pathname.replace(/^\//, '').split('/')[0];
      } else if (host.indexOf('youtube.com') !== -1 || host.indexOf('youtube-nocookie.com') !== -1) {
        if (u.pathname.indexOf('/watch') === 0) id = u.searchParams.get('v') || '';
        else if (u.pathname.indexOf('/shorts/') === 0) id = u.pathname.split('/shorts/')[1] || '';
        else if (u.pathname.indexOf('/embed/') === 0) id = u.pathname.split('/embed/')[1] || '';
      }

      id = (id || '').split('?')[0].split('&')[0].split('/')[0].trim();
      if (!id) return null;
      return 'https://www.youtube.com/embed/' + encodeURIComponent(id) + '?rel=0&modestbranding=1';
    } catch (e) {
      return null;
    }
  }

  function isTelegramUrl(url) {
    try {
      var u = new URL(url, location.origin);
      var host = (u.hostname || '').replace(/^www\./, '').toLowerCase();
      return host === 't.me' || host === 'telegram.me';
    } catch (e) {
      return false;
    }
  }

  function createTelegramEmbed(url) {
    try {
      var u = new URL(url, location.origin);
      u.searchParams.set('embed', '1');
      return u.toString();
    } catch (e) {
      return null;
    }
  }

  function getElementText(el) {
    return ((el && el.textContent) || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function sameParent(elements) {
    if (!elements.length) return null;
    var parent = elements[0].parentElement;
    if (!parent) return null;
    for (var i = 1; i < elements.length; i++) {
      if (elements[i].parentElement !== parent) return null;
    }
    return parent;
  }

  function findTabElements() {
    var all = Array.prototype.slice.call(document.querySelectorAll('button, a, [role="tab"], div, span'));
    var desc = null, feat = null, loc = null;

    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var text = getElementText(el);
      if (!desc && text === 'description') desc = el;
      else if (!feat && text === 'features') feat = el;
      else if (!loc && text === 'location') loc = el;
      if (desc && feat && loc) break;
    }

    if (!(desc && feat && loc)) return null;

    var parent = sameParent([desc, feat, loc]);
    if (!parent) {
      var candidates = [desc.parentElement, feat.parentElement, loc.parentElement].filter(Boolean);
      parent = candidates[0] || null;
    }
    if (!parent) return null;

    return { parent: parent, description: desc, features: feat, location: loc, sample: desc };
  }

  function ensureStyle() {
    if (document.getElementById('ethio-video-tab-style')) return;
    var style = document.createElement('style');
    style.id = 'ethio-video-tab-style';
    style.textContent = [
      '#ethio-video-panel{display:none;margin-top:18px;width:100%;}',
      '#ethio-video-panel.is-active{display:block;}',
      '#ethio-video-panel .ethio-video-card{border:1px solid rgba(0,0,0,.08);border-radius:12px;background:#fff;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);}',
      '#ethio-video-panel .ethio-video-frame{position:relative;width:100%;padding-top:56.25%;background:#000;}',
      '#ethio-video-panel iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;}',
      '#ethio-video-panel .ethio-video-body{padding:14px 16px;}',
      '#ethio-video-panel .ethio-video-link{display:inline-block;margin-top:10px;color:#0b63ce;text-decoration:underline;word-break:break-all;}',
      '#ethio-video-tab-button{position:relative;}',
      '#ethio-video-tab-button.is-active{font-weight:600;}',
      '.ethio-video-hidden-by-patch{display:none !important;}'
    ].join('');
    document.head.appendChild(style);
  }

  function getContentTargets(tabParent) {
    var targets = [];
    if (!tabParent) return targets;

    var directNext = tabParent.nextElementSibling;
    if (directNext) targets.push(directNext);

    var parentNext = tabParent.parentElement && tabParent.parentElement.nextElementSibling;
    if (parentNext && targets.indexOf(parentNext) === -1) targets.push(parentNext);

    var rolePanels = Array.prototype.slice.call(document.querySelectorAll('[role="tabpanel"]'));
    for (var i = 0; i < rolePanels.length; i++) {
      if (targets.indexOf(rolePanels[i]) === -1) targets.push(rolePanels[i]);
    }

    return targets.filter(function (el) {
      if (!el || el.id === 'ethio-video-panel') return false;
      if (el.closest && el.closest('#ethio-video-panel')) return false;
      return true;
    });
  }

  function setActiveLook(tabEls, activeButton) {
    [tabEls.description, tabEls.features, tabEls.location, document.getElementById('ethio-video-tab-button')].forEach(function (el) {
      if (!el) return;
      if (el === activeButton) el.classList.add('is-active');
      else el.classList.remove('is-active');
    });
  }

  function hideNonVideoContent(tabParent) {
    var targets = getContentTargets(tabParent);
    targets.forEach(function (el) {
      el.classList.add('ethio-video-hidden-by-patch');
    });
  }

  function showNonVideoContent(tabParent) {
    var targets = getContentTargets(tabParent);
    targets.forEach(function (el) {
      el.classList.remove('ethio-video-hidden-by-patch');
    });
  }

  function buildVideoPanel(videoUrl) {
    var wrap = document.getElementById('ethio-video-panel');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'ethio-video-panel';
    }

    var youtubeEmbed = normalizeYouTubeEmbed(videoUrl);
    var telegramEmbed = isTelegramUrl(videoUrl) ? createTelegramEmbed(videoUrl) : null;
    var inner = '';

    if (youtubeEmbed) {
      inner = '' +
        '<div class="ethio-video-card">' +
          '<div class="ethio-video-frame">' +
            '<iframe src="' + youtubeEmbed.replace(/"/g, '&quot;') + '" title="Property video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>' +
          '</div>' +
        '</div>';
    } else if (telegramEmbed) {
      inner = '' +
        '<div class="ethio-video-card">' +
          '<div class="ethio-video-frame" style="padding-top:70%;">' +
            '<iframe src="' + telegramEmbed.replace(/"/g, '&quot;') + '" title="Property video"></iframe>' +
          '</div>' +
          '<div class="ethio-video-body">Open directly if Telegram embed does not play.<br><a class="ethio-video-link" href="' + videoUrl.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener">' + videoUrl + '</a></div>' +
        '</div>';
    } else {
      inner = '' +
        '<div class="ethio-video-card">' +
          '<div class="ethio-video-body">This property has a video link.<br><a class="ethio-video-link" href="' + videoUrl.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener">Open property video</a></div>' +
        '</div>';
    }

    wrap.innerHTML = inner;
    return wrap;
  }

  function ensureVideoTab(videoUrl) {
    if (!videoUrl) return;
    var tabEls = findTabElements();
    if (!tabEls || !tabEls.parent || !tabEls.sample) return;

    ensureStyle();

    var existing = document.getElementById('ethio-video-tab-button');
    var videoButton = existing;
    if (!videoButton) {
      videoButton = tabEls.sample.cloneNode(true);
      videoButton.id = 'ethio-video-tab-button';
      videoButton.textContent = 'Video';
      videoButton.setAttribute('type', 'button');
      if (videoButton.tagName && videoButton.tagName.toLowerCase() === 'a') {
        videoButton.setAttribute('href', '#');
      }
      tabEls.parent.appendChild(videoButton);
    }

    var panel = buildVideoPanel(videoUrl);
    if (!panel.parentElement) {
      if (tabEls.parent.nextSibling) tabEls.parent.parentNode.insertBefore(panel, tabEls.parent.nextSibling);
      else tabEls.parent.parentNode.appendChild(panel);
    }

    function activateVideo(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setActiveLook(tabEls, videoButton);
      hideNonVideoContent(tabEls.parent);
      panel.classList.add('is-active');
      panel.style.display = 'block';
    }

    function deactivateVideo(activeTab) {
      showNonVideoContent(tabEls.parent);
      panel.classList.remove('is-active');
      panel.style.display = 'none';
      setActiveLook(tabEls, activeTab || null);
    }

    if (!videoButton.__ethioVideoBound) {
      videoButton.__ethioVideoBound = true;
      videoButton.addEventListener('click', activateVideo, true);
    }

    [tabEls.description, tabEls.features, tabEls.location].forEach(function (tab) {
      if (!tab || tab.__ethioVideoDeactivateBound) return;
      tab.__ethioVideoDeactivateBound = true;
      tab.addEventListener('click', function () {
        setTimeout(function () { deactivateVideo(tab); }, 0);
      }, true);
    });
  }

  var lastVideoKey = '';
  function tryAttachVideoTab() {
    if (!isPropertyDetailsPage()) return;
    loadPropertyData().then(function (data) {
      var videoUrl = data && (data.videoUrl || data.video_url) ? String(data.videoUrl || data.video_url).trim() : '';
      if (!videoUrl) return;
      var propertyId = data && data.id ? String(data.id) : getPropertyIdFromPath();
      var key = propertyId + '|' + videoUrl;
      if (key === lastVideoKey && document.getElementById('ethio-video-tab-button')) return;
      lastVideoKey = key;
      ensureVideoTab(videoUrl);
    }).catch(function () {});
  }

  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (!m.addedNodes || !m.addedNodes.length) continue;
      for (var j = 0; j < m.addedNodes.length; j++) {
        var node = m.addedNodes[j];
        if (node.nodeType === Node.TEXT_NODE) replaceDollarText(node);
        else if (node.nodeType === Node.ELEMENT_NODE) walkAndReplace(node);
      }
    }
    tryAttachVideoTab();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  walkAndReplace(document.body);
  tryAttachVideoTab();

  var pushState = history.pushState;
  history.pushState = function () {
    pushState.apply(this, arguments);
    setTimeout(function () {
      walkAndReplace(document.body);
      tryAttachVideoTab();
    }, 80);
  };

  window.addEventListener('popstate', function () {
    setTimeout(function () {
      walkAndReplace(document.body);
      tryAttachVideoTab();
    }, 80);
  });
})();
