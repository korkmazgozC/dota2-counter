// Service worker: network-first app & data (works offline from cache), cache-first hero/item images.
const VERSION = 'v2';
const SHELL = `shell-${VERSION}`;
const DATA = 'data';
const IMAGES = 'images';

const SHELL_FILES = [
  './', 'index.html', 'css/app.css', 'js/app.js', 'js/i18n.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    await c.addAll(SHELL_FILES);
    const d = await caches.open(DATA);
    await Promise.all(['data/heroes.json', 'data/matchups-all.json', 'data/matchups.json'].map((u) => d.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keep = [SHELL, DATA, IMAGES];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req, { cache: 'no-cache' });
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) || Response.error();
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
    return res;
  } catch {
    return Response.error();
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('steamstatic.com')) { e.respondWith(cacheFirst(req, IMAGES)); return; }
  if (url.origin !== location.origin) return;
  if (url.pathname.includes('/data/')) { e.respondWith(networkFirst(req, DATA)); return; }
  // App files are tiny: always try the network so updates show up on the next launch; fall back offline.
  e.respondWith(networkFirst(req, SHELL).then(async (r) => (r.type === 'error' && req.mode === 'navigate' ? (await caches.match('index.html')) || r : r)));
});
