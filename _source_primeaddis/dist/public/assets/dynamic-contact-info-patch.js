(function () {
  var PATCH_KEY = '__primeAddisDynamicContactPatch_v4__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  var settingsCache = null;

  function fetchSettings() {
    if (settingsCache) return Promise.resolve(settingsCache);
    return fetch('/api/site-settings', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (data) { settingsCache = data || {}; return settingsCache; })
      .catch(function () { return {}; });
  }

  function norm(v) { return (v == null ? '' : String(v)).trim(); }
  function digitsOnly(v) { return String(v || '').replace(/\D/g, ''); }

  function setOrHide(el, html) {
    if (!el) return;
    if (html) {
      el.innerHTML = html;
      var card = el.closest('[class*="rounded"]');
      if (card) card.style.display = '';
    } else {
      var card = el.closest('[class*="rounded"]') || el.parentElement;
      if (card) card.style.display = 'none';
    }
  }

  function runPatch() {
    if (/^\/admin/i.test(location.pathname)) return;

    fetchSettings().then(function (s) {
      var phone = norm(s.primaryPhone || s.primary_phone || '');
      var email = norm(s.email || '');
      var addr = norm(s.address || '');
      var whatsapp = norm(s.whatsappPhone || s.whatsapp_phone || phone || '');
      var fb = norm(s.facebookUrl || s.facebook_url || '');
      var ig = norm(s.instagramUrl || s.instagram_url || '');
      var tg = norm(s.telegramUrl || s.telegram_url || '');
      var tgUser = norm(s.telegramUsername || s.telegram_username || '');
      var tk = norm(s.tiktokUrl || s.tiktok_url || '');

      var telegramHref = tg || (tgUser ? 'https://t.me/' + tgUser.replace('@', '') : '');

      /* ── Top info cards ── */
      var addrEl = document.getElementById('contact-office-address');
      setOrHide(addrEl, addr ? addr.replace(/,\s*/g, ',<br>') : '');

      var phoneEmailEl = document.getElementById('contact-phone-email');
      var parts = [];
      if (phone) parts.push(phone);
      if (email) parts.push(email);
      setOrHide(phoneEmailEl, parts.join('<br>'));

      /* ── Sidebar fields ── */
      var sidebarAddr = document.getElementById('contact-sidebar-address');
      if (sidebarAddr) {
        if (addr) { sidebarAddr.innerHTML = addr.replace(/,\s*/g, ',<br>'); sidebarAddr.closest('.flex') && (sidebarAddr.closest('.flex').style.display = ''); }
        else { var row = sidebarAddr.closest('.flex'); if (row) row.style.display = 'none'; }
      }

      var sidebarPhone = document.getElementById('contact-sidebar-phone');
      if (sidebarPhone) {
        if (phone) { sidebarPhone.textContent = phone; sidebarPhone.closest('.flex') && (sidebarPhone.closest('.flex').style.display = ''); }
        else { var row = sidebarPhone.closest('.flex'); if (row) row.style.display = 'none'; }
      }

      var sidebarEmail = document.getElementById('contact-sidebar-email');
      if (sidebarEmail) {
        if (email) { sidebarEmail.textContent = email; sidebarEmail.closest('.flex') && (sidebarEmail.closest('.flex').style.display = ''); }
        else { var row = sidebarEmail.closest('.flex'); if (row) row.style.display = 'none'; }
      }

      /* ── Hours row in sidebar — always hide ── */
      var allSidebarPs = Array.from(document.querySelectorAll('p.text-primary-100'));
      allSidebarPs.forEach(function (p) {
        if (/Monday|Friday|Saturday|Sunday|AM|PM/i.test(p.textContent)) {
          var row = p.closest('.flex');
          if (row) row.style.display = 'none';
        }
      });

      /* ── WhatsApp button ── */
      var waBtn = document.getElementById('contact-wa-btn');
      if (waBtn && whatsapp) waBtn.href = 'https://wa.me/' + digitsOnly(whatsapp);

      Array.from(document.querySelectorAll('a[href*="wa.me"]')).forEach(function (a) {
        if (whatsapp) a.href = 'https://wa.me/' + digitsOnly(whatsapp);
      });

      /* ── Replace ALL hardcoded tel: links with configured phone ── */
      if (phone) {
        Array.from(document.querySelectorAll('a[href^="tel:"]')).forEach(function (a) {
          a.href = 'tel:' + digitsOnly(phone);
          var txt = (a.textContent || '').trim();
          if (txt && /^\+?[\d\s\-()]+$/.test(txt)) {
            a.textContent = phone;
          }
        });
        /* Also replace plain text nodes showing old phone numbers in the footer */
        var footerEls = document.querySelectorAll('footer span, footer p, footer div, footer a');
        Array.from(footerEls).forEach(function (el) {
          if (el.children.length > 0) return;
          var txt = (el.textContent || '').trim();
          if (/^\+?251\d{9,}$/.test(txt.replace(/\s/g, ''))) {
            el.textContent = phone;
          }
        });
      }

      /* ── Replace ALL hardcoded mailto: links with configured email ── */
      if (email) {
        Array.from(document.querySelectorAll('a[href^="mailto:"]')).forEach(function (a) {
          a.href = 'mailto:' + email;
          var txt = (a.textContent || '').trim();
          if (txt && txt.indexOf('@') !== -1 && txt.indexOf(' ') === -1) {
            a.textContent = email;
          }
        });
        /* Also replace plain email text in footer */
        var footerEls2 = document.querySelectorAll('footer span, footer p, footer div');
        Array.from(footerEls2).forEach(function (el) {
          if (el.children.length > 0) return;
          var txt = (el.textContent || '').trim();
          if (txt.indexOf('@') !== -1 && txt.indexOf(' ') === -1 && /\.\w{2,}$/.test(txt)) {
            el.textContent = email;
          }
        });
      }

      /* ── Social links ── */
      var fbEl = document.getElementById('social-facebook');
      if (fbEl) { if (fb) { fbEl.href = fb; fbEl.style.display = ''; } else { fbEl.style.display = 'none'; } }

      var lgEl = document.getElementById('social-linkedin');
      if (lgEl) lgEl.style.display = 'none';

      /* TikTok — inject CSS once to override React's inline display:none,
         then just update the href. CSS !important beats inline styles. */
      if (!document.getElementById('pa-tiktok-show-css')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'pa-tiktok-show-css';
        styleEl.textContent = tk
          ? '#social-tiktok { display: inline-flex !important; }'
          : '#social-tiktok { display: none !important; }';
        document.head.appendChild(styleEl);
      } else {
        document.getElementById('pa-tiktok-show-css').textContent = tk
          ? '#social-tiktok { display: inline-flex !important; }'
          : '#social-tiktok { display: none !important; }';
      }
      var tkEl = document.getElementById('social-tiktok');
      if (tkEl && tk) { tkEl.setAttribute('href', tk); }

      var ytEl = document.getElementById('social-youtube');
      if (ytEl) ytEl.style.display = 'none';

      /* Instagram */
      Array.from(document.querySelectorAll('a[aria-label="Instagram"]')).forEach(function (a) {
        if (ig) { a.href = ig; a.style.display = ''; } else { a.style.display = 'none'; }
      });

      /* Telegram */
      Array.from(document.querySelectorAll('a[aria-label="Telegram"]')).forEach(function (a) {
        if (telegramHref) { a.href = telegramHref; a.style.display = ''; } else { a.style.display = 'none'; }
      });
    });
  }

  var timer;
  function schedule() { clearTimeout(timer); timer = setTimeout(runPatch, 200); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  new MutationObserver(function (mutations) {
    var relevant = mutations.some(function (m) { return m.addedNodes.length > 0; });
    if (relevant) schedule();
  }).observe(document.documentElement, { childList: true, subtree: true });

  var _push = history.pushState;
  history.pushState = function () { _push.apply(this, arguments); schedule(); };
  window.addEventListener('popstate', schedule);

  setTimeout(runPatch, 500);
  setTimeout(runPatch, 1200);
  setTimeout(runPatch, 2500);
})();
