const CACHE = "network-detective-__VERSION__";
const ASSETS = __ASSETS__;
const urls = ASSETS.map((path) => new URL(path, self.registration.scope).href);
const shell = new URL("index.html", self.registration.scope).href;
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(urls.map((url) => new Request(url, { cache: "reload" }))),
      ),
  );
  // Updated workers wait until the app has saved and explicitly requested an update.
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) => key.startsWith("network-detective-") && key !== CACHE,
          )
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type !== "APPLY_UPDATE") return;
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const inScope = clients.filter((client) =>
        client.url.startsWith(self.registration.scope),
      );
      if (inScope.length > 1) {
        event.source?.postMessage({ type: "UPDATE_BLOCKED" });
        return;
      }
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    !event.request.url.startsWith(self.registration.scope)
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (event.request.mode === "navigate")
        return (await cache.match(shell)) || fetch(event.request);
      const url = new URL(event.request.url);
      url.search = "";
      url.hash = "";
      return (await cache.match(url.href)) || fetch(event.request);
    })(),
  );
});
