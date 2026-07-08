/* Prime Addis — notifications patch
   Two responsibilities:
   1. When the installed PWA opens, ask the visitor for permission to
      send notifications (with a friendly explanatory card, not a raw
      browser dialog out of nowhere).
   2. When an admin is signed in, poll the /api/admin/notifications
      endpoint every 30 s and raise a native browser notification for
      each new visit request, inquiry, or subscriber. Clicking the
      notification opens the relevant admin page.
*/
(function () {
  if (window.__paNotifications_v1__) return;
  window.__paNotifications_v1__ = true;

  if (!('Notification' in window)) return;

  var STORE_LAST_SEEN = 'pa_notif_last_seen_at';
  var STORE_PROMPT_DISMISSED = 'pa_notif_prompt_dismissed_at';
  var STORE_FIRED_KEYS = 'pa_notif_fired_keys';
  var PROMPT_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
  var POLL_INTERVAL_MS = 30 * 1000;
  var FIRED_KEY_LIMIT = 200;

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
           window.navigator.standalone === true;
  }

  function readJSON(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  function readNum(key) {
    try { return parseInt(localStorage.getItem(key) || '0', 10) || 0; } catch (e) { return 0; }
  }
  function writeNum(key, val) {
    try { localStorage.setItem(key, String(val)); } catch (e) {}
  }

  function recentlyDismissedPrompt() {
    var t = readNum(STORE_PROMPT_DISMISSED);
    return t && (Date.now() - t) < PROMPT_COOLDOWN_MS;
  }

  /* ----- Permission prompt UI ----- */

  function injectStyles() {
    if (document.getElementById('pa-notif-styles')) return;
    var s = document.createElement('style');
    s.id = 'pa-notif-styles';
    s.textContent = [
      '.pa-notif-card{position:fixed;left:12px;right:12px;bottom:14px;z-index:2147483600;',
      'background:#fff;color:#1B2A4A;border-radius:14px;padding:14px;',
      'box-shadow:0 12px 32px rgba(0,0,0,.22);max-width:420px;margin:0 auto;',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px;',
      'opacity:0;animation:paNotifIn .35s ease forwards}',
      '.pa-notif-card .pa-notif-row{display:flex;align-items:flex-start;gap:12px}',
      '.pa-notif-card .pa-notif-bell{width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,#1B2A4A,#2A3F6F);',
      'color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;line-height:1}',
      '.pa-notif-card b{display:block;font-size:14.5px;margin-bottom:2px}',
      '.pa-notif-card p{margin:0;font-size:12.5px;color:#46556f;line-height:1.45}',
      '.pa-notif-card .pa-notif-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}',
      '.pa-notif-card button{border:0;cursor:pointer;font-family:inherit;font-weight:600;font-size:13px;',
      'padding:8px 14px;border-radius:999px;transition:transform .12s ease}',
      '.pa-notif-card .pa-notif-allow{background:#1B2A4A;color:#fff}',
      '.pa-notif-card .pa-notif-allow:hover{transform:translateY(-1px)}',
      '.pa-notif-card .pa-notif-skip{background:transparent;color:#6b7791}',
      '@keyframes paNotifIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}',
      '@keyframes paNotifOut{to{opacity:0;transform:translateY(16px)}}',
      '.pa-notif-card.pa-notif-out{animation:paNotifOut .25s ease forwards}'
    ].join('');
    document.head.appendChild(s);
  }

  function removeCard(card) {
    if (!card) return;
    card.classList.add('pa-notif-out');
    setTimeout(function () { if (card.parentNode) card.parentNode.removeChild(card); }, 250);
  }

  function showPermissionCard() {
    if (document.getElementById('pa-notif-card')) return;
    injectStyles();
    var card = document.createElement('div');
    card.id = 'pa-notif-card';
    card.className = 'pa-notif-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Allow notifications');
    card.innerHTML =
      '<div class="pa-notif-row">' +
        '<span class="pa-notif-bell">&#128276;</span>' +
        '<div>' +
          '<b>Stay in the loop</b>' +
          '<p>Get notified about new properties, replies to your messages, and admin updates — even when the app is closed.</p>' +
        '</div>' +
      '</div>' +
      '<div class="pa-notif-actions">' +
        '<button type="button" class="pa-notif-skip">Not now</button>' +
        '<button type="button" class="pa-notif-allow">Enable</button>' +
      '</div>';
    document.body.appendChild(card);

    card.querySelector('.pa-notif-skip').addEventListener('click', function () {
      writeNum(STORE_PROMPT_DISMISSED, Date.now());
      removeCard(card);
    });
    card.querySelector('.pa-notif-allow').addEventListener('click', function () {
      Notification.requestPermission().then(function (perm) {
        removeCard(card);
        if (perm === 'granted') {
          /* Send a tiny welcome notification so the user sees it works. */
          showLocalNotification({
            title: 'Prime Addis',
            body: 'Notifications are on. We\'ll let you know about important updates.',
            tag: 'pa-welcome'
          });
        } else {
          writeNum(STORE_PROMPT_DISMISSED, Date.now());
        }
      }).catch(function () { removeCard(card); });
    });
  }

  function maybeAskPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return; // can't re-ask
    if (recentlyDismissedPrompt()) return;
    /* Only ask inside the installed app — asking on a normal web visit
       feels intrusive and tanks the grant rate. */
    if (!isStandalone()) return;
    /* Wait a moment so the prompt doesn't compete with first paint. */
    setTimeout(showPermissionCard, 1800);
  }

  /* ----- Showing notifications ----- */

  function showLocalNotification(payload) {
    if (Notification.permission !== 'granted') return;
    /* Prefer the SW path because it works when the tab is in the
       background. Falls back to direct Notification() if no SW. */
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(function (reg) {
        if (reg && reg.active) {
          reg.active.postMessage({ type: 'SHOW_NOTIFICATION', payload: payload });
        } else {
          try { new Notification(payload.title, payload); } catch (e) {}
        }
      }).catch(function () {
        try { new Notification(payload.title, payload); } catch (e) {}
      });
    } else {
      try { new Notification(payload.title, payload); } catch (e) {}
    }
  }

  /* ----- Admin polling ----- */

  function loadFiredKeys() {
    var arr = readJSON(STORE_FIRED_KEYS, []);
    return Array.isArray(arr) ? arr : [];
  }
  function rememberFiredKey(key) {
    var arr = loadFiredKeys();
    arr.push(key);
    if (arr.length > FIRED_KEY_LIMIT) arr = arr.slice(-FIRED_KEY_LIMIT);
    writeJSON(STORE_FIRED_KEYS, arr);
  }
  function alreadyFired(key) {
    return loadFiredKeys().indexOf(key) !== -1;
  }

  var pollTimer = null;
  var pollingStarted = false;

  function pollOnce() {
    var since = readNum(STORE_LAST_SEEN) || (Date.now() - 60 * 60 * 1000);
    var url = '/api/admin/notifications?since=' + encodeURIComponent(String(since));
    fetch(url, { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) {
          stopPolling();
          return null;
        }
        if (!r.ok) return null;
        return r.json();
      })
      .then(function (data) {
        if (!data) return;
        var anyFired = false;
        (data.visits || []).forEach(function (v) {
          var key = 'visit:' + v.id;
          if (alreadyFired(key)) return;
          rememberFiredKey(key);
          anyFired = true;
          showLocalNotification({
            title: 'New visit request',
            body: (v.name || 'Someone') + ' requested a property visit' +
                  (v.visit_date ? ' on ' + v.visit_date : '.'),
            tag: key,
            url: '/admin?section=visit-requests'
          });
        });
        (data.inquiries || []).forEach(function (q) {
          var key = 'inq:' + q.id;
          if (alreadyFired(key)) return;
          rememberFiredKey(key);
          anyFired = true;
          showLocalNotification({
            title: 'New message',
            body: (q.name || 'A visitor') + ': ' + (q.subject || 'sent a new inquiry.'),
            tag: key,
            url: '/admin?section=inquiries'
          });
        });
        (data.subscribers || []).forEach(function (s) {
          var key = 'sub:' + s.id;
          if (alreadyFired(key)) return;
          rememberFiredKey(key);
          anyFired = true;
          showLocalNotification({
            title: 'New subscriber',
            body: (s.email || 'Someone') + ' subscribed to your updates.',
            tag: key,
            url: '/admin?section=subscribers'
          });
        });
        writeNum(STORE_LAST_SEEN, data.now || Date.now());
      })
      .catch(function () { /* ignore network blips */ });
  }

  function startPolling() {
    if (pollingStarted) return;
    pollingStarted = true;
    /* Seed last-seen so we don't bombard the admin with every old item
       the first time polling starts. */
    if (!readNum(STORE_LAST_SEEN)) writeNum(STORE_LAST_SEEN, Date.now());
    pollOnce();
    pollTimer = setInterval(function () {
      if (document.visibilityState === 'hidden') return;
      pollOnce();
    }, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    pollingStarted = false;
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  function checkAdminAndStart() {
    if (Notification.permission !== 'granted') return;
    fetch('/api/user', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (user) {
        if (user && user.isAdmin) startPolling();
      })
      .catch(function () {});
  }

  /* ----- Boot ----- */

  function init() {
    maybeAskPermission();
    /* Re-check on tab focus so a freshly-installed SW or new login state
       doesn't keep the admin out of the loop. */
    if (Notification.permission === 'granted') {
      checkAdminAndStart();
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && Notification.permission === 'granted' && !pollingStarted) {
        checkAdminAndStart();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
