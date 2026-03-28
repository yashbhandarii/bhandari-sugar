/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'bhandari-sugar-v5';
const STATIC_ASSETS = [
    '/manifest.json',
    '/logo.png',
    '/favicon.ico',
];

// Install: Cache static assets (not JS bundles - they change often)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Pre-caching static assets');
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.warn('[SW] Pre-cache failed for some assets:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate: Cleanup old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                    return Promise.resolve();
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch: Strategy for API and assets
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-http requests (chrome-extension, etc.)
    if (!request.url.startsWith('http')) return;

    // Skip non-GET requests entirely (POST, DELETE, PATCH etc. must not be cached)
    if (request.method !== 'GET') return;

    // API Requests: network only to avoid stale invoice/report data
    if (url.pathname.includes('/api/')) {
        event.respondWith(
            fetch(request).catch(() => new Response(JSON.stringify({ error: 'Offline' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }))
        );
        return;
    }

    // HTML navigations: network first so new deploys do not keep stale chunk references
    if (request.mode === 'navigate' || request.destination === 'document') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.status === 200) {
                        const cloned1 = response.clone();
                        const cloned2 = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, cloned1);
                            cache.put('/index.html', cloned2);
                        });
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(request).then(cached =>
                        cached || caches.match('/index.html') || new Response('Offline', { status: 503 })
                    )
                )
        );
        return;
    }

    // JS/CSS bundles: Always fetch from network (never serve cached JS)
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(
            fetch(request).catch(() =>
                caches.match(request).then(cached =>
                    cached || new Response('Offline', { status: 503 })
                )
            )
        );
        return;
    }

    // Static Assets (images, icons): Cache first, then network
    event.respondWith(
        caches.match(request).then(response => {
            if (response) return response;
            return fetch(request).then(fetchRes => {
                if (fetchRes.status === 200) {
                    const cloned = fetchRes.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, cloned);
                    });
                }
                return fetchRes;
            }).catch(() => new Response('Offline', { status: 503 }));
        })
    );
});
