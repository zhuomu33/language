const CACHE = 'daily-page-v7';
const SHELL = ['./', './ui-preview.html', './manifest.webmanifest', './course-progress.js', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './assets/lucide.min.js', './assets/mountains.jpg', './assets/forest.jpg'];
SHELL.push('./app.js', './learning-tools.js', './learning-tools.css', './native-storage.bundle.js');
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('daily-page-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin || new URL(event.request.url).pathname.startsWith('/api/')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') return await cache.match('./ui-preview.html');
      throw error;
    }
  })());
});
