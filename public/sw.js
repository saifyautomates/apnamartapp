/* Grocery Commerce Platform — service worker.
 * Strategy:
 * - App shell (/, /offline, manifest, icons, placeholder) precached on install.
 * - Navigations: network-first, falling back to the cached shell, then /offline.
 * - Next.js static chunks (/_next/static/): cache-first (content-hashed, immutable).
 * - Product images (/uploads/, /placeholder.svg): stale-while-revalidate.
 * - API calls: network-only (never serve stale prices, stock or order state).
 * Updates: a waiting worker notifies the page; the page prompts the user and only
 * then sends SKIP_WAITING — never a silent swap under a running session.
 */
const VERSION = "gcp-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const IMAGE_CACHE = `${VERSION}-images`;

const SHELL = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/placeholder.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)).then(() => {
      // Do not skipWaiting here: the page decides when to activate the update.
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== SHELL_CACHE && k !== STATIC_CACHE && k !== IMAGE_CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isApi(url) {
  return url.pathname.startsWith("/api/");
}

function isStatic(url) {
  return url.pathname.startsWith("/_next/static/");
}

function isImage(request, url) {
  return (
    request.destination === "image" ||
    url.pathname.startsWith("/uploads/") ||
    url.pathname === "/placeholder.svg" ||
    url.pathname.startsWith("/icons/")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isApi(url)) return; // network-only: prices, stock, orders must never be stale.

  // Navigations: network-first, shell cache, then offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(SHELL_CACHE);
          cache.put("/", fresh.clone()).catch(() => undefined);
          return fresh;
        } catch {
          const cached = await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
          const offline = await caches.match("/offline");
          if (offline) return offline;
          return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
        }
      })(),
    );
    return;
  }

  if (isStatic(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        cache.put(request, fresh.clone()).catch(() => undefined);
        return fresh;
      })(),
    );
    return;
  }

  if (isImage(request, url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(IMAGE_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((fresh) => {
            cache.put(request, fresh.clone()).catch(() => undefined);
            return fresh;
          })
          .catch(() => cached);
        return cached ?? (await network) ?? new Response("", { status: 504 });
      })(),
    );
  }
});
