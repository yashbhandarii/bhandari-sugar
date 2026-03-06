/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'bhandari-sugar-v3';
const STATIC_ASSETS = [
    '/',
    '/index.html',
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
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch: Strategy for API and Assets
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-http requests (chrome-extension, etc.)
    if (!request.url.startsWith('http')) return;

    // Skip non-GET requests entirely (POST, DELETE, PATCH etc. must not be cached)
    if (request.method !== 'GET') return;

    // API Requests: Network First — never serve stale API data from cache
    if (url.pathname.includes('/api/')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Only cache successful GET API responses
                    if (response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, clonedResponse);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // JS/CSS bundles: Always fetch from network (never serve cached JS)
    if (url.pathname.startsWith('/static/')) {
        event.respondWith(fetch(request));
        return;
    }

    // Static Assets (images, icons): Cache First, then Network
    event.respondWith(
        caches.match(request).then(response => {
            return response || fetch(request).then(fetchRes => {
                return caches.open(CACHE_NAME).then(cache => {
                    if (fetchRes.status === 200) {
                        cache.put(request, fetchRes.clone());
                    }
                    return fetchRes;
                });
            });
        })
    );
});
