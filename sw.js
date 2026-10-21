/* 缓存策略：
   - 页面导航（打开应用）走「网络优先」，保证每次都能拿到最新版本；断网时回退到缓存。
   - 其他静态资源走「缓存优先」。
   每次发新版请把 CACHE 版本号 +1，旧缓存会被自动清理。 */
const CACHE = "eeterms-v4";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  // 页面导航：网络优先
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put("./index.html", copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // 其他资源：缓存优先
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return resp;
    }).catch(() => caches.match("./index.html")))
  );
});
