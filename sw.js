/* Offline-Cache: App-Dateien sofort, Texterkennung (CDN) bei erster Nutzung */
const VERSION = "insta-kpi-v4";
const SHELL = ["./", "index.html", "style.css", "kpis.js", "ocr.js", "bestand.js", "report.js", "app.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== VERSION + "-cdn").map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Eigene Dateien: erst Netz (für Updates), sonst Cache
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
    return;
  }
  // Texterkennung vom CDN: Cache zuerst
  if (/cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|tessdata/.test(url.host + url.pathname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(VERSION + "-cdn").then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
