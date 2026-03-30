const CACHE_NAME = "cw-koch-trainer-v2";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon", "/apple-icon"];

const extractAssetUrlsFromHtml = (htmlText) => {
  const urls = new Set();
  const attrRegex = /(?:src|href)=["']([^"']+)["']/g;
  let match;

  while ((match = attrRegex.exec(htmlText)) !== null) {
    const raw = match[1];
    if (!raw) continue;
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("//")) continue;
    if (raw.startsWith("data:")) continue;

    const normalized = raw.startsWith("/") ? raw : `/${raw}`;
    urls.add(normalized);
  }

  return Array.from(urls);
};

const warmupAppAssets = async () => {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(APP_SHELL);

  const homeResponse = await fetch("/", { cache: "no-store" });
  if (!homeResponse.ok) return;

  const html = await homeResponse.text();
  const discoveredAssets = extractAssetUrlsFromHtml(html).filter(
    (assetPath) => assetPath.startsWith("/_next/") || assetPath.startsWith("/icon") || assetPath.startsWith("/apple-icon")
  );

  if (discoveredAssets.length > 0) {
    await cache.addAll(discoveredAssets);
  }
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    warmupAppAssets().then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const isNavigationRequest = event.request.mode === "navigate";

  if (isNavigationRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            caches.open(CACHE_NAME).then((cache) => cache.put("/", networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          if (cachedPage) return cachedPage;
          return caches.match("/");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          const isCacheable =
            networkResponse &&
            networkResponse.status === 200 &&
            (requestUrl.pathname === "/" ||
              requestUrl.pathname.startsWith("/_next/") ||
              requestUrl.pathname.startsWith("/icon") ||
              requestUrl.pathname.startsWith("/apple-icon") ||
              requestUrl.pathname === "/manifest.webmanifest");

          if (isCacheable) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }

          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return undefined;
        });
    })
  );
});
