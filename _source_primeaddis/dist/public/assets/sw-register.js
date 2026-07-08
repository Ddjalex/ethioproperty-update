/* Register the Prime Addis service worker.
   Loaded as a regular <script> so it runs early but never blocks rendering.

   Behaviour notes:
   - Skipped on /admin so the dashboard always talks straight to the server
     and never gets a cached shell with old credentials.
   - No automatic page reload on update — that would interrupt visitors
     mid-form, mid-login, or mid-checkout. The new worker takes over on
     the next natural navigation instead.
   - One-time cleanup: any old worker registered under a different scope or
     a previous version is fully unregistered before we re-register the
     current one, ensuring no stale handlers linger.
*/
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' &&
      location.hostname !== '127.0.0.1') {
    return;
  }

  /* Never run the SW on the admin dashboard. If one is somehow active here
     (e.g. installed before this guard existed), tear it down completely. */
  if (location.pathname === '/admin' || location.pathname.indexOf('/admin/') === 0) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) { r.unregister().catch(function () {}); });
    }).catch(function () {});
    return;
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (reg) {
      /* When a new SW is installed but waiting, just tell it to skip waiting.
         It will take control on the next navigation — no forced reload. */
      reg.addEventListener('updatefound', function () {
        var sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', function () {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            sw.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    }).catch(function (err) {
      console.warn('[sw] registration failed:', err && err.message);
    });
  });
})();
