/**
 * EVA-SL Service Worker
 * Provides offline support, background sync, and installability
 * Strategy: Cache-first for static assets, Network-first for API calls
 */

const CACHE_NAME = "eva-sl-v1.0.0";
const STATIC_CACHE = "eva-sl-static-v1.0.0";
const API_CACHE = "eva-sl-api-v1.0.0";

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/translate",
  "/asl-gallery",
  "/character",
  "/research",
  "/dashboard",
  "/manifest.json",
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  console.log("[EVA-SL SW] Installing...");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("[EVA-SL SW] Pre-cache failed for some URLs:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log("[EVA-SL SW] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => {
            console.log("[EVA-SL SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch Strategy ───────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith("http")) return;

  // API calls: Network-first, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Dataset JSON files: Cache-first (large files, rarely change)
  if (url.pathname.startsWith("/manus-storage/") && url.pathname.endsWith(".json")) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Static assets (JS, CSS, images): Cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/) ||
    url.pathname.startsWith("/manus-storage/")
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // HTML pages: Network-first, fallback to cache, then offline page
  event.respondWith(networkFirstStrategy(request, STATIC_CACHE));
});

// ─── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline — resource not cached", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Offline fallback for navigation requests
    if (request.mode === "navigate") {
      const offlinePage = await caches.match("/");
      if (offlinePage) return offlinePage;
    }

    return new Response(
      JSON.stringify({ error: "You are offline. Please reconnect to use EVA-SL." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ─── Background Sync ──────────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-translations") {
    console.log("[EVA-SL SW] Background sync: translations");
  }
});

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "EVA-SL", {
      body: data.body ?? "New update from EVA-SL",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      data: { url: data.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url ?? "/")
  );
});

console.log("[EVA-SL SW] Service Worker loaded — EVA-SL PWA v1.0.0");
