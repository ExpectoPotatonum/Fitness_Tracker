const CACHE_NAME = 'training-camp-v4';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Cache-first for the app shell, network for everything else (fonts, Supabase, Chart.js, CDN)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only intercept requests going to our own origin
  if (url.origin === location.origin) {
    const isShell = ASSETS.some((a) => {
      // Safely handle the root path
      if (a === './') {
        return url.pathname === '/' || url.pathname === '/index.html';
      }
      const suffix = a.replace('./', '');
      return suffix !== '' && url.pathname.endsWith(suffix);
    });

    if (isShell) {
      event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
      );
      // Return early so we don't fall through
      return; 
    }
  }
});