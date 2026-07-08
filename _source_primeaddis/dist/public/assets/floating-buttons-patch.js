(function () {
  var KEY = '__paFloatingBtnsV1__';
  if (window[KEY]) return;
  window[KEY] = true;

  var NAVY = '#1B2A4A';
  var GOLD = '#C4922A';

  /* ── Inject styles ── */
  var style = document.createElement('style');
  style.textContent = `
    /* Hide original circular floating buttons */
    .pa-fab-hidden { display: none !important; }

    /* New pill-style floating buttons container */
    #pa-fab-wrap {
      position: fixed;
      bottom: 24px;
      right: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: flex-end;
    }

    .pa-fab {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 6px 11px 6px 9px;
      border-radius: 50px;
      text-decoration: none;
      font-size: 10px;
      font-weight: 700;
      font-family: system-ui, sans-serif;
      letter-spacing: 0.02em;
      box-shadow: 0 3px 12px rgba(0,0,0,0.22);
      transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
      cursor: pointer;
      white-space: nowrap;
      border: none;
    }
    .pa-fab:hover {
      transform: translateY(-3px) scale(1.04);
      box-shadow: 0 8px 28px rgba(0,0,0,0.28);
      opacity: 0.93;
    }
    .pa-fab:active { transform: scale(0.97); }

    .pa-fab-wa {
      background: ${NAVY};
      color: #fff;
    }
    .pa-fab-call {
      background: ${GOLD};
      color: #fff;
    }

    .pa-fab svg {
      flex-shrink: 0;
    }

    @media (max-width: 480px) {
      #pa-fab-wrap {
        bottom: 14px;
        right: 10px;
        gap: 6px;
      }
      .pa-fab {
        padding: 5px 9px 5px 7px;
        font-size: 9px;
      }
    }

    /* Lift the React app's scroll-to-top arrow above our floating buttons */
    button.fixed.bottom-6.right-6.rounded-full,
    a.fixed.bottom-6.right-6.rounded-full {
      bottom: 88px !important;
      z-index: 9998 !important;
    }
    @media (max-width: 480px) {
      button.fixed.bottom-6.right-6.rounded-full,
      a.fixed.bottom-6.right-6.rounded-full {
        bottom: 76px !important;
      }
    }
  `;
  document.head.appendChild(style);

  var WA_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.845L.057 23.5l5.83-1.527A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.653-.502-5.193-1.378l-.372-.221-3.857 1.011 1.029-3.757-.242-.386A9.938 9.938 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>';

  var CALL_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.39 21 3 13.61 3 4.5c0-.55.45-1 1-1H7.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.21 2.2z"/></svg>';

  function buildButtons(phone, whatsapp) {
    var wrap = document.getElementById('pa-fab-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'pa-fab-wrap';
      document.body.appendChild(wrap);
    }
    wrap.innerHTML = '';

    if (whatsapp) {
      var waBtn = document.createElement('a');
      waBtn.className = 'pa-fab pa-fab-wa';
      waBtn.href = 'https://wa.me/' + whatsapp.replace(/\D/g, '');
      waBtn.target = '_blank';
      waBtn.rel = 'noopener noreferrer';
      waBtn.innerHTML = WA_ICON + '<span>WhatsApp Us</span>';
      wrap.appendChild(waBtn);
    }

    if (phone) {
      var callBtn = document.createElement('a');
      callBtn.className = 'pa-fab pa-fab-call';
      callBtn.href = 'tel:' + phone.replace(/[^\d+]/g, '');
      callBtn.innerHTML = CALL_ICON + '<span>Call Now</span>';
      wrap.appendChild(callBtn);
    }
  }

  function hideOriginals() {
    /* Find the fixed bottom-right container from the React app and hide it */
    var all = document.querySelectorAll('[class*="fixed"][class*="bottom"]');
    all.forEach(function (el) {
      var hasWa  = el.querySelector('a[href*="wa.me"]');
      var hasCall = el.querySelector('a[href*="tel:"]');
      if (hasWa || hasCall) {
        el.classList.add('pa-fab-hidden');
      }
    });
  }

  function init() {
    fetch('/api/site-settings', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (s) {
        var phone    = (s.primaryPhone || s.primary_phone || '').trim();
        var whatsapp = (s.whatsappPhone || s.whatsapp_phone || phone).trim();
        hideOriginals();
        buildButtons(phone, whatsapp);
      })
      .catch(function () {});
  }

  /* Run once DOM is ready, then re-check when React renders */
  function boot() {
    init();
    setTimeout(function () { hideOriginals(); }, 800);
    setTimeout(function () { hideOriginals(); }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* Watch for React rehydration restoring the originals */
  new MutationObserver(function (mutations) {
    var shouldCheck = mutations.some(function (m) { return m.addedNodes.length > 0; });
    if (shouldCheck) hideOriginals();
  }).observe(document.documentElement, { childList: true, subtree: true });

})();
