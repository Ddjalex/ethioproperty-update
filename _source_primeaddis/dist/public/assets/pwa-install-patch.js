/* PWA install prompt — Prime Addis
   Shows a small "Install App" pill on phones/desktops that support PWA install.
   - Listens for the browser's beforeinstallprompt event
   - Renders a dismissible pill near the bottom of the screen
   - Remembers dismissal in localStorage so it doesn't nag visitors
   - On iOS (which has no install prompt API) shows a one-time hint card
     explaining how to add the site to the home screen.
*/
(function () {
  if (window.__paPWAInstall_v1__) return;
  window.__paPWAInstall_v1__ = true;

  var STORAGE_DISMISS = 'pa_pwa_dismissed_at';
  var STORAGE_INSTALLED = 'pa_pwa_installed';
  var DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Don't show inside the installed PWA itself
  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
           window.navigator.standalone === true;
  }

  function recentlyDismissed() {
    try {
      var t = parseInt(localStorage.getItem(STORAGE_DISMISS) || '0', 10);
      return t && (Date.now() - t) < DISMISS_COOLDOWN_MS;
    } catch (e) { return false; }
  }

  function markDismissed() {
    try { localStorage.setItem(STORAGE_DISMISS, String(Date.now())); } catch (e) {}
  }

  function markInstalled() {
    try { localStorage.setItem(STORAGE_INSTALLED, '1'); } catch (e) {}
  }

  function alreadyInstalled() {
    try { return localStorage.getItem(STORAGE_INSTALLED) === '1'; } catch (e) { return false; }
  }

  function injectStyles() {
    if (document.getElementById('pa-pwa-install-styles')) return;
    var s = document.createElement('style');
    s.id = 'pa-pwa-install-styles';
    s.textContent = [
      '.pa-pwa-pill{position:fixed;left:50%;transform:translateX(-50%);bottom:20px;z-index:2147483600;',
      'display:flex;align-items:center;gap:10px;padding:10px 14px 10px 12px;',
      'background:linear-gradient(135deg,#1B2A4A 0%,#2A3F6F 100%);color:#fff;border-radius:999px;',
      'box-shadow:0 8px 28px rgba(27,42,74,0.32),0 2px 6px rgba(0,0,0,0.18);',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px;',
      'opacity:0;animation:paPwaIn .35s ease forwards;max-width:calc(100vw - 24px);}',
      '.pa-pwa-pill .pa-pwa-icon{width:28px;height:28px;border-radius:8px;background:#fff;',
      'display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}',
      '.pa-pwa-pill .pa-pwa-icon img{width:100%;height:100%;object-fit:cover}',
      '.pa-pwa-pill .pa-pwa-text{display:flex;flex-direction:column;line-height:1.15;min-width:0}',
      '.pa-pwa-pill .pa-pwa-title{font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.pa-pwa-pill .pa-pwa-sub{font-size:11px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.pa-pwa-pill button{border:0;cursor:pointer;font-family:inherit}',
      '.pa-pwa-pill .pa-pwa-install{background:#fff;color:#1B2A4A;font-weight:600;padding:7px 14px;',
      'border-radius:999px;font-size:13px;transition:transform .12s ease}',
      '.pa-pwa-pill .pa-pwa-install:hover{transform:translateY(-1px)}',
      '.pa-pwa-pill .pa-pwa-close{background:transparent;color:#fff;opacity:.7;width:26px;height:26px;',
      'border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1}',
      '.pa-pwa-pill .pa-pwa-close:hover{opacity:1;background:rgba(255,255,255,.12)}',
      '@keyframes paPwaIn{from{opacity:0;transform:translate(-50%,16px)}to{opacity:1;transform:translate(-50%,0)}}',
      '@keyframes paPwaOut{to{opacity:0;transform:translate(-50%,16px)}}',
      '.pa-pwa-pill.pa-pwa-out{animation:paPwaOut .25s ease forwards}',
      /* iOS hint card */
      '.pa-pwa-ios{position:fixed;left:12px;right:12px;bottom:14px;z-index:2147483600;',
      'background:#fff;color:#1B2A4A;border-radius:14px;padding:14px 14px 12px;',
      'box-shadow:0 12px 32px rgba(0,0,0,0.22);font-family:inherit;font-size:14px;',
      'opacity:0;animation:paPwaIn .35s ease forwards}',
      '.pa-pwa-ios .pa-pwa-ios-row{display:flex;align-items:flex-start;gap:10px}',
      '.pa-pwa-ios .pa-pwa-icon{width:36px;height:36px;border-radius:8px;overflow:hidden;flex-shrink:0;background:#1B2A4A}',
      '.pa-pwa-ios .pa-pwa-icon img{width:100%;height:100%;object-fit:cover}',
      '.pa-pwa-ios b{display:block;font-size:14px;margin-bottom:2px}',
      '.pa-pwa-ios p{margin:0;font-size:12.5px;color:#46556f;line-height:1.4}',
      '.pa-pwa-ios .share{display:inline-block;background:#eef2f8;color:#1B2A4A;padding:1px 6px;border-radius:5px;font-weight:600}',
      '.pa-pwa-ios .pa-pwa-close{position:absolute;top:8px;right:10px;background:transparent;border:0;',
      'font-size:20px;color:#9aa6bd;cursor:pointer;line-height:1}',
      /* Sit above other floating buttons on small screens */
      '@media (max-width:500px){.pa-pwa-pill{bottom:84px}}'
    ].join('');
    document.head.appendChild(s);
  }

  var deferredPrompt = null;
  var pillEl = null;

  function removePill() {
    if (!pillEl) return;
    pillEl.classList.add('pa-pwa-out');
    setTimeout(function () {
      if (pillEl && pillEl.parentNode) pillEl.parentNode.removeChild(pillEl);
      pillEl = null;
    }, 250);
  }

  function showPill() {
    if (pillEl || isStandalone() || alreadyInstalled() || recentlyDismissed()) return;
    injectStyles();
    pillEl = document.createElement('div');
    pillEl.className = 'pa-pwa-pill';
    pillEl.setAttribute('role', 'dialog');
    pillEl.setAttribute('aria-label', 'Install Prime Addis app');
    pillEl.innerHTML =
      '<span class="pa-pwa-icon"><img src="/assets/pwa-icon-192.png" alt=""></span>' +
      '<span class="pa-pwa-text">' +
        '<span class="pa-pwa-title">Install Prime Addis</span>' +
        '<span class="pa-pwa-sub">Quick access from your home screen</span>' +
      '</span>' +
      '<button type="button" class="pa-pwa-install">Install</button>' +
      '<button type="button" class="pa-pwa-close" aria-label="Dismiss">&times;</button>';
    document.body.appendChild(pillEl);

    pillEl.querySelector('.pa-pwa-install').addEventListener('click', function () {
      if (!deferredPrompt) { removePill(); return; }
      var prompt = deferredPrompt;
      deferredPrompt = null;
      prompt.prompt();
      prompt.userChoice.then(function (choice) {
        if (choice && choice.outcome === 'accepted') markInstalled();
        else markDismissed();
        removePill();
      }).catch(function () { removePill(); });
    });
    pillEl.querySelector('.pa-pwa-close').addEventListener('click', function () {
      markDismissed();
      removePill();
    });
  }

  function showIOSHint() {
    if (document.getElementById('pa-pwa-ios') || isStandalone() ||
        alreadyInstalled() || recentlyDismissed()) return;
    injectStyles();
    var card = document.createElement('div');
    card.className = 'pa-pwa-ios';
    card.id = 'pa-pwa-ios';
    card.innerHTML =
      '<button type="button" class="pa-pwa-close" aria-label="Dismiss">&times;</button>' +
      '<div class="pa-pwa-ios-row">' +
        '<span class="pa-pwa-icon"><img src="/assets/pwa-icon-192.png" alt=""></span>' +
        '<div>' +
          '<b>Install Prime Addis</b>' +
          '<p>Tap <span class="share">Share &#x2191;</span> in Safari, then choose <b>Add to Home Screen</b>.</p>' +
        '</div>' +
      '</div>';
    document.body.appendChild(card);
    card.querySelector('.pa-pwa-close').addEventListener('click', function () {
      markDismissed();
      card.style.animation = 'paPwaOut .25s ease forwards';
      setTimeout(function () { if (card.parentNode) card.parentNode.removeChild(card); }, 250);
    });
  }

  // Standard PWA install prompt (Chrome, Edge, Samsung, etc.)
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    // Wait until the page has settled so the pill doesn't compete with first paint
    setTimeout(showPill, 1500);
  });

  window.addEventListener('appinstalled', function () {
    markInstalled();
    if (pillEl) removePill();
    var ios = document.getElementById('pa-pwa-ios');
    if (ios && ios.parentNode) ios.parentNode.removeChild(ios);
  });

  // iOS Safari support (no beforeinstallprompt)
  function isIOSSafari() {
    var ua = navigator.userAgent || '';
    var iOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    var safari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
    return iOS && safari;
  }

  function init() {
    if (isStandalone() || alreadyInstalled() || recentlyDismissed()) return;
    if (isIOSSafari()) {
      // Give the page time to load before showing the iOS hint
      setTimeout(showIOSHint, 2500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
