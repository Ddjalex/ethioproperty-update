(function () {
  var PATCH_KEY = '__primeAddisContactSocialIconsPatch_v3__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  var settingsCache = null;

  function getSettings() {
    if (settingsCache) return Promise.resolve(settingsCache);
    return fetch('/api/site-settings', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (data) {
        settingsCache = data || {};
        return settingsCache;
      })
      .catch(function () { return {}; });
  }

  function norm(value) {
    return value == null ? '' : String(value).trim();
  }

  function withProtocol(value) {
    var url = norm(value);
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    if (/^\/\//.test(url)) return 'https:' + url;
    return 'https://' + url;
  }

  function digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function svgIcon(name) {
    var icons = {
      facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.77l-.44 2.91h-2.33V22c4.78-.76 8.45-4.92 8.45-9.94z"/></svg>',
      instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.8 2h8.4A5.81 5.81 0 0 1 22 7.8v8.4a5.81 5.81 0 0 1-5.8 5.8H7.8A5.81 5.81 0 0 1 2 16.2V7.8A5.81 5.81 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>',
      telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.78 15.36 9.4 20.7c.54 0 .78-.23 1.06-.51l2.55-2.44 5.28 3.87c.97.54 1.65.26 1.91-.89l3.46-16.23.01-.01c.31-1.43-.52-1.99-1.46-1.64L1.85 10.64c-1.39.54-1.37 1.31-.24 1.66l5.2 1.62L18.9 6.35c.57-.38 1.09-.17.66.21l-9.78 8.8z"/></svg>',
      tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 1 0 6.33 6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.77c-.34 0-.68-.03-1.01-.08z"/></svg>',
      whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.52 3.49A11.91 11.91 0 0 0 12.05 0C5.46 0 .1 5.35.1 11.94c0 2.1.55 4.16 1.6 5.97L0 24l6.25-1.64a11.95 11.95 0 0 0 5.79 1.47h.01c6.59 0 11.95-5.35 11.95-11.94 0-3.19-1.24-6.19-3.48-8.4zM12.05 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.71.97.99-3.62-.23-.37a9.85 9.85 0 0 1-1.51-5.25c0-5.44 4.43-9.87 9.88-9.87a9.8 9.8 0 0 1 6.98 2.9 9.8 9.8 0 0 1 2.89 6.96c-.01 5.44-4.44 9.87-9.88 9.87zm5.42-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.21 5.08 4.5.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/></svg>'
    };
    return icons[name] || '';
  }

  function ensureStyle() {
    if (document.getElementById('pa-contact-social-icons-style')) return;
    var style = document.createElement('style');
    style.id = 'pa-contact-social-icons-style';
    style.textContent = [
      '.pa-contact-social-icons{max-width:1120px;margin:22px auto 32px;padding:0 16px;text-align:center;}',
      '.pa-contact-social-icons-card{border:1px solid rgba(15,23,42,.10);border-radius:18px;background:#fff;box-shadow:0 10px 28px rgba(15,23,42,.06);padding:22px 18px;}',
      '.pa-contact-social-icons h2{margin:0 0 6px;font-size:20px;line-height:1.25;font-weight:800;color:#0f172a;}',
      '.pa-contact-social-icons p{margin:0 0 16px;color:#64748b;font-size:14px;}',
      '.pa-contact-social-icons-row{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;}',
      '.pa-contact-social-icons-row a{width:46px;height:46px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;color:#fff;text-decoration:none;box-shadow:0 8px 18px rgba(15,23,42,.14);transition:transform .18s ease,box-shadow .18s ease,opacity .18s ease;}',
      '.pa-contact-social-icons-row a:hover{transform:translateY(-2px);box-shadow:0 12px 24px rgba(15,23,42,.18);opacity:.95;}',
      '.pa-contact-social-icons-row svg{width:23px;height:23px;fill:currentColor;}',
      '.pa-contact-social-icons-row .facebook{background:#1877F2;}',
      '.pa-contact-social-icons-row .instagram{background:linear-gradient(135deg,#f58529,#dd2a7b,#8134af,#515bd4);}',
      '.pa-contact-social-icons-row .telegram{background:#229ED9;}',
      '.pa-contact-social-icons-row .tiktok{background:#111827;}',
      '.pa-contact-social-icons-row .whatsapp{background:#25D366;}',
      '.dark .pa-contact-social-icons-card{background:#111827;border-color:rgba(255,255,255,.12);}',
      '.dark .pa-contact-social-icons h2{color:#f8fafc;}',
      '.dark .pa-contact-social-icons p{color:#cbd5e1;}'
    ].join('');
    document.head.appendChild(style);
  }

  function buildLinks(settings) {
    var phone = norm(settings.whatsappPhone || settings.whatsapp_phone || settings.primaryPhone || settings.primary_phone || '');
    var telegramUrl = norm(settings.telegramUrl || settings.telegram_url || '');
    var telegramUser = norm(settings.telegramUsername || settings.telegram_username || '');
    var telegramHref = telegramUrl ? withProtocol(telegramUrl) : (telegramUser ? 'https://t.me/' + telegramUser.replace(/^@/, '') : '');
    var waDigits = digitsOnly(phone);

    return [
      { key: 'facebook', label: 'Facebook', href: withProtocol(settings.facebookUrl || settings.facebook_url || '') },
      { key: 'instagram', label: 'Instagram', href: withProtocol(settings.instagramUrl || settings.instagram_url || '') },
      { key: 'telegram', label: 'Telegram', href: telegramHref },
      { key: 'tiktok', label: 'TikTok', href: withProtocol(settings.tiktokUrl || settings.tiktok_url || '') },
      { key: 'whatsapp', label: 'WhatsApp', href: waDigits ? 'https://wa.me/' + waDigits : '' }
    ].filter(function (item) { return item.href; });
  }

  function makeBlock(links) {
    var wrap = document.createElement('section');
    wrap.className = 'pa-contact-social-icons';
    wrap.setAttribute('aria-label', 'Social media links');

    var card = document.createElement('div');
    card.className = 'pa-contact-social-icons-card';
    card.innerHTML = '<h2>Connect With Us</h2><p>Follow Prime Addis or message us directly on social media.</p>';

    var row = document.createElement('div');
    row.className = 'pa-contact-social-icons-row';
    links.forEach(function (item) {
      var a = document.createElement('a');
      a.className = item.key;
      a.href = item.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', item.label);
      a.setAttribute('title', item.label);
      a.innerHTML = svgIcon(item.key);
      row.appendChild(a);
    });

    card.appendChild(row);
    wrap.appendChild(card);
    return wrap;
  }

  /* Find the smallest element containing both "Our Office" and "Phone & Email" —
     that is the grid/flex container holding the two info cards. */
  function findInfoCardsContainer() {
    var main = document.querySelector('main');
    if (!main) return null;

    var all = Array.from(main.querySelectorAll('*'));
    var best = null;
    var bestSize = Infinity;

    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var t = (el.innerText || el.textContent || '');
      if (/our office/i.test(t) && /phone\s*&?\s*email/i.test(t)) {
        var size = el.querySelectorAll('*').length;
        if (size < bestSize) {
          bestSize = size;
          best = el;
        }
      }
    }

    return best;
  }

  function render() {
    if (!/^\/contact\/?$/i.test(location.pathname)) {
      var old = document.querySelector('.pa-contact-social-icons');
      if (old) old.remove();
      return;
    }

    ensureStyle();
    getSettings().then(function (settings) {
      var links = buildLinks(settings);
      var existing = document.querySelector('.pa-contact-social-icons');
      if (!links.length) {
        if (existing) existing.remove();
        return;
      }

      var container = findInfoCardsContainer();
      if (!container) {
        /* absolute fallback: append to main */
        var mainEl = document.querySelector('main');
        if (!mainEl) return;
        if (existing) return;
        mainEl.appendChild(makeBlock(links));
        return;
      }

      /* Don't re-inject if already in the right place */
      if (existing && existing.previousElementSibling === container) return;
      if (existing) existing.remove();

      container.insertAdjacentElement('afterend', makeBlock(links));
    });
  }

  var timer;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(render, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  new MutationObserver(function (mutations) {
    var relevant = mutations.some(function (m) { return m.addedNodes.length > 0 || m.removedNodes.length > 0; });
    if (relevant) schedule();
  }).observe(document.documentElement, { childList: true, subtree: true });

  var pushState = history.pushState;
  history.pushState = function () {
    pushState.apply(this, arguments);
    schedule();
  };
  window.addEventListener('popstate', schedule);
  setTimeout(render, 700);
  setTimeout(render, 1800);
})();