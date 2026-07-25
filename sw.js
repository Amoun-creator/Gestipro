// GestiPro Service Worker - PWA avec mise à jour automatique
const APP_VERSION = '1.0.0';
const CACHE_NAME = 'gestipro-v' + APP_VERSION;

// Fichiers à mettre en cache pour fonctionnement hors-ligne
const CACHE_FILES = [
  './indexgestipro.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Installation : mise en cache initiale
self.addEventListener('install', event => {
  console.log('[SW] Install version:', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_FILES).catch(err => {
        console.warn('[SW] Cache partiel:', err);
      });
    })
  );
  // Force activation immédiate sans attendre la fermeture des onglets
  self.skipWaiting();
});

// Activation : supprime les anciens caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate version:', APP_VERSION);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[SW] Suppression ancien cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch : Network First (toujours essayer le réseau, fallback sur cache)
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET et externes
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Succès réseau : mettre à jour le cache
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Pas de réseau : utiliser le cache
        return caches.match(event.request).then(cached => {
          return cached || new Response('Hors-ligne - GestiPro', {
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});

// Message pour forcer la mise à jour
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'GET_VERSION') {
    event.ports[0].postMessage({ version: APP_VERSION });
  }
});
