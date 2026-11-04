// Swap Stop offline helper. Keeps a copy of the app so it still opens where there's no signal.
// The page itself: try the network first (so updates always arrive), fall back to the saved copy.
// Libraries and icons: use the saved copy (they never change at a pinned version).
// Database calls, photos and map pictures are never stored here.
const CACHE = "swapstop-v1";
const SHELL = ["./", "./manifest.json", "./icon-192.png", "./apple-touch-icon.png",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put("./", copy)); return r; })
      .catch(() => caches.match("./")));
    return;
  }
  if (SHELL.some(u => url.href === new URL(u, self.location).href)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
  }
});
