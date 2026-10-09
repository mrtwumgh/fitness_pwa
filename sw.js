// Service worker: offline cache, update handover, and showing push reminders.
// Bump CACHE whenever you change any file so phones pick up the new version.

const CACHE = "ss-v6";
const FILES = [
  "./",
  "index.html",
  "style.css",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "badge-96.png",
  "js/main.js",
  "js/config.js",
  "js/util.js",
  "js/data.js",
  "js/state.js",
  "js/plan.js",
  "js/timer.js",
  "js/push.js",
  "js/toast.js",
  "js/views/today.js",
  "js/views/plan.js",
  "js/views/settings.js",
];

// Install quietly and wait: the app shows an "update ready" banner and tells us when to take over.
// cache: 'reload' skips the browser's HTTP cache (GitHub Pages allows reuse for 10 minutes),
// so a new version always stores the files as they are on the server right now.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(
          FILES.map((file) => new Request(file, { cache: "reload" })),
        ),
      ),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Serve from cache straight away, refreshing the cached copy in the background.
// The refresh checks with the server ('no-cache') rather than reusing the browser's HTTP cache.
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    !event.request.url.startsWith(self.location.origin)
  )
    return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fresh = fetch(event.request, { cache: "no-cache" })
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || fresh;
    }),
  );
});

// A reminder arrives from the worker.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data && event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Strength Start", {
      body: data.body || "",
      tag: data.tag || "reminder",
      renotify: true,
      icon: "icon-192.png",
      badge: "badge-96.png",
      vibrate: [300, 120, 300],
      data: { url: "./" },
    }),
  );
});

// Tapping a reminder opens (or focuses) the app.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        for (const w of windows) if ("focus" in w) return w.focus();
        return self.clients.openWindow(event.notification.data?.url || "./");
      }),
  );
});
