// Service worker: offline cache, update handover, and showing push reminders.
// Bump CACHE whenever you change any file so phones pick up the new version.

const CACHE = 'ss-v9';
// Exercise animations, saved the first time each one is shown so they also work offline.
// Kept across app updates: only change this name to force every animation to download again.
// js/media.js uses this name too.
const MEDIA_CACHE = 'ss-media-v1';
const MEDIA_HOST = 'static.exercisedb.dev';
const FILES = [
  './',
  'index.html',
  'style.css',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'badge-96.png',
  'js/main.js',
  'js/config.js',
  'js/util.js',
  'js/data.js',
  'js/state.js',
  'js/plan.js',
  'js/timer.js',
  'js/push.js',
  'js/toast.js',
  'js/video.js',
  'js/media.js',
  'js/views/today.js',
  'js/views/plan.js',
  'js/views/settings.js',
];

// Install quietly and wait: the app shows an "update ready" banner and tells us when to take over.
// cache: 'reload' skips the browser's HTTP cache (GitHub Pages allows reuse for 10 minutes),
// so a new version always stores the files as they are on the server right now.
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => new Request(file, { cache: 'reload' })))));
});

self.addEventListener('message', event => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== MEDIA_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Exercise animations: use the saved copy if there is one, otherwise download and save it.
  // (They load as opaque responses whose status can't be read; if a saved copy turns out to be broken,
  // js/media.js deletes it so it's fetched again.)
  if (url.hostname === MEDIA_HOST) {
    event.respondWith(caches.open(MEDIA_CACHE).then(async cache => {
      const saved = await cache.match(request);
      if (saved) return saved;
      const response = await fetch(request);
      if (response.ok || response.type === 'opaque') event.waitUntil(cache.put(request, response.clone()));
      return response;
    }));
    return;
  }

  // Anything else from another site (YouTube) goes straight to the network.
  if (url.origin !== self.location.origin) return;

  // Serve from cache straight away, refreshing the cached copy in the background.
  // The refresh checks with the server ('no-cache') rather than reusing the browser's HTTP cache,
  // and only keeps good responses, so a server error never replaces a working file.
  const refresh = fetch(request, { cache: 'no-cache' }).then(response => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
    }
    return response;
  });
  event.waitUntil(refresh.catch(() => {}));   // keep the worker alive until the refresh is done
  event.respondWith(caches.match(request).then(cached => cached || refresh));
});

// A reminder arrives from the worker.
self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data && event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Strength Start', {
      body: data.body || '',
      tag: data.tag || 'reminder',
      renotify: true,
      icon: 'icon-192.png',
      badge: 'badge-96.png',
      vibrate: [300, 120, 300],
      data: { url: './' },
    }),
  );
});

// Tapping a reminder opens (or focuses) the app.
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
      for (const w of windows) if ('focus' in w) return w.focus();
      return self.clients.openWindow(event.notification.data?.url || './');
    }),
  );
});
