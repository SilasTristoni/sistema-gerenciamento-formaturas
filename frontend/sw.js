const CACHE_NAME = 'gestaoform-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // IGNORA requisições para a API e extensões do Chrome/Live Server
  if (event.request.url.includes('/api/') || !event.request.url.startsWith('http')) {
      return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});