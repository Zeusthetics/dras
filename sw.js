// DRAS Service Worker — v1.0
// Caches the app shell so DRAS loads offline and instantly on repeat visits.
// Data (drawings, users) always fetches fresh from the network.

var CACHE     = 'dras-v1';
var APP_SHELL = [
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=DM+Mono:wght@400;500&display=swap'
];

// Install — cache app shell
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(APP_SHELL);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate — clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — cache-first for app shell, network-first for API calls
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Always go network for Apps Script API calls (never cache data)
  if (url.includes('script.google.com')) {
    return; // let browser handle normally
  }

  // Cache-first for app shell assets
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(resp) {
        // Cache successful GET responses for app shell files
        if (resp && resp.status === 200 && e.request.method === 'GET') {
          var respClone = resp.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, respClone);
          });
        }
        return resp;
      }).catch(function() {
        // Offline fallback — return cached index.html for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
