/* Prime Addis service worker
   Goals:
   - Keep public pages usable when the visitor briefly loses connection
   - Never serve stale dynamic data (DB calls, auth, AI responses)
   - Never interfere with admin pages — those are always live, no caching
   - Quietly self-update without disrupting users mid-action
*/
var SW_VERSION = 'pa-sw-v6';
var SHELL_CACHE = 'pa-shell-' + SW_VERSION;
var ASSET_CACHE = 'pa-assets-' + SW_VERSION;
var IMG_CACHE   = 'pa-images-' + SW_VERSION;

/* Pre-cache the bare minimum to make a fast offline experience.
   Anything that fails to fetch during install is skipped, never blocking. */
var SHELL_URLS = [
  '/',
  '/manifest.json',
  '/assets/prime-addis-favicon.png',
  '/assets/prime-addis-logo.png',
  '/assets/pwa-icon-192.png',
  '/assets/pwa-icon-512.png'
];

/* Offline fallback page returned when navigation fails AND the cached
   shell is also unavailable. Built inline so it has zero extra requests. */
var OFFLINE_HTML =
  '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Offline | Prime Addis</title>' +
  '<style>html,body{margin:0;height:100%;font-family:-apple-system,Segoe UI,Roboto,sans-serif;' +
  'background:linear-gradient(135deg,#1B2A4A,#2A3F6F);color:#fff;display:flex;' +
  'align-items:center;justify-content:center;text-align:center;padding:24px}' +
  '.card{max-width:380px}h1{font-size:22px;margin:0 0 8px}p{opacity:.85;line-height:1.5;margin:0 0 18px}' +
  'button{background:#fff;color:#1B2A4A;border:0;border-radius:999px;padding:11px 22px;' +
  'font-weight:600;font-size:15px;cursor:pointer}button:hover{transform:translateY(-1px)}</style>' +
  '</head><body><div class="card">' +
  '<h1>You are offline</h1>' +
  '<p>Prime Addis can\'t reach the internet right now. Please check your connection and try again.</p>' +
  '<button onclick="location.reload()">Try again</button>' +
  '</div></body></html>';

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      return Promise.all(SHELL_URLS.map(function (u) {
        return cache.add(new Request(u, { cache: 'reload' })).catch(function () { /* ignore */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (n) {
        if (n !== SHELL_CACHE && n !== ASSET_CACHE && n !== IMG_CACHE) return caches.delete(n);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  /* Allow the page to ask the SW to show a notification on its behalf.
     This lets browsers display the notification even when the tab is in
     the background or the device screen is off (where Notification()
     called directly from a page can be silently dropped). */
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    var d = event.data.payload || {};
    self.registration.showNotification(d.title || 'Prime Addis', {
      body: d.body || '',
      icon: d.icon || '/assets/pwa-icon-192.png',
      badge: d.badge || '/assets/pwa-icon-192.png',
      tag: d.tag || 'prime-addis',
      renotify: !!d.renotify,
      data: { url: d.url || '/' }
    }).catch(function () {});
  }
});

/* Focus an existing tab on click, or open a new one at the right URL. */
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        try {
          var u = new URL(c.url);
          if (u.origin === self.location.origin) {
            return c.focus().then(function () {
              return c.navigate ? c.navigate(targetUrl).catch(function () {}) : null;
            });
          }
        } catch (e) {}
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

/* --- Path classification ---------------------------------------------- */

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') ||
         url.pathname.startsWith('/auth/') ||
         url.pathname.startsWith('/login') ||
         url.pathname.startsWith('/logout') ||
         url.pathname.startsWith('/uploads/');
}
/* Admin pages must never be cached — they show user-specific data and
   change frequently. Any navigation under /admin always hits the network. */
function isAdminPath(url) {
  return url.pathname === '/admin' || url.pathname.startsWith('/admin/');
}
function isImage(req) {
  return req.destination === 'image';
}
function isStaticAsset(url) {
  return url.pathname.startsWith('/assets/') || url.pathname === '/manifest.json';
}

/* Network-first for HTML pages: always try fresh, fall back to cache. */
function networkFirstHTML(event) {
  return fetch(event.request).then(function (resp) {
    /* Only cache successful, full responses. Never cache redirects, errors,
       or partial content — those would break SPA hydration on next load. */
    if (resp && resp.status === 200 && resp.type === 'basic') {
      var copy = resp.clone();
      caches.open(SHELL_CACHE).then(function (c) { c.put('/', copy).catch(function () {}); });
    }
    return resp;
  }).catch(function () {
    return caches.match(event.request).then(function (cached) {
      return cached ||
             caches.match('/').then(function (root) {
               return root || new Response(OFFLINE_HTML, {
                 headers: { 'Content-Type': 'text/html; charset=utf-8' }
               });
             });
    });
  });
}

/* Stale-while-revalidate for /assets/* (JS/CSS/icons): instant load, refreshed
   in the background. Only successful 200 responses get cached. */
function staleWhileRevalidate(event, cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(event.request).then(function (cached) {
      var fetcher = fetch(event.request).then(function (resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          cache.put(event.request, resp.clone()).catch(function () {});
        }
        return resp;
      }).catch(function () { return cached; });
      return cached || fetcher;
    });
  });
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;          // skip cross-origin
  if (isApiRequest(url)) return;                            // never cache API/auth/uploads
  if (isAdminPath(url)) return;                             // admin always live
  if (req.headers.get('range')) return;                     // skip range requests (audio/video)

  if (req.mode === 'navigate' || (req.destination === 'document')) {
    event.respondWith(networkFirstHTML(event));
    return;
  }
  if (isImage(req)) {
    event.respondWith(staleWhileRevalidate(event, IMG_CACHE));
    return;
  }
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(event, ASSET_CACHE));
    return;
  }
});
