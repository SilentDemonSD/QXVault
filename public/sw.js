// Bump CACHE on every release that changes precached files, otherwise
// clients keep serving the previous bundle from Cache Storage indefinitely.
const CACHE = 'qxvault-v2';
const PRECACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/vendor/pqc-kyber/kyber.js',
    '/vendor/pqc-kyber/pqc_kyber_bg.js',
    '/vendor/pqc-kyber/pqc_kyber_bg.wasm',
    '/vendor/eff/words.js',
    '/vendor/qr/qrcode.js',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then((hit) => {
            if (hit) return hit;
            return fetch(event.request).then((response) => {
                if (response.ok && (response.type === 'basic' || response.type === 'opaque')) {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
                }
                return response;
            }).catch(() => {
                if (event.request.mode === 'navigate') return caches.match('/');
                throw event;
            });
        })
    );
});
