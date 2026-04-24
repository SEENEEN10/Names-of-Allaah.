/* ─────────────────────────────────────────────────────────────
   بأسمائه نحيا — Service Worker
   Strategy:
     • Precache the shell (index, reader, font) on install.
     • Cache-first for everything else with background refresh
       (stale-while-revalidate), so repeat visits are instant
       and the site works offline.
   Bump CACHE_VERSION to force a full refresh for all visitors.
   ──────────────────────────────────────────────────────────── */
const CACHE_VERSION = 'asma-v1-2026-04-24';
const SHELL = [
  './',
  'index.html',
  'reader.html',
  'assets/uthmanic-hafs.otf',
  'chapters/part1-full.html',
  'chapters/part2-full.html',
  'chapters/part3-full.html',
  'chapters/part4-full.html',
  'chapters/part5-full.html',
  'chapters/part6-full.html',
  'chapters/part7-full.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      // addAll fails if any request fails — use individual add()s
      // so a single missing resource doesn't abort the whole install.
      Promise.all(SHELL.map(url =>
        cache.add(new Request(url, { cache: 'reload' })).catch(() => {})
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Only handle same-origin requests — let Google Fonts etc. go through normally
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_VERSION).then(cache =>
      cache.match(req).then(cached => {
        const network = fetch(req).then(res => {
          // Only cache good responses
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached); // offline → fall back to cache
        // Cache-first for speed; refresh in background
        return cached || network;
      })
    )
  );
});
