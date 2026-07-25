const CACHE_NAME = 'gestipro-v1.0.0';
const BASE = '/Gestipro/';
const FILES = [
  BASE + 'indexgestipro.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(FILES).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method!=='GET') return;
  e.respondWith(
    fetch(e.request).then(r=>{
      if(r&&r.status===200){
        caches.open(CACHE_NAME).then(c=>c.put(e.request,r.clone()));
      }
      return r;
    }).catch(()=>caches.match(e.request))
  );
});

self.addEventListener('message', e => {
  if(e.data==='SKIP_WAITING') self.skipWaiting();
});
