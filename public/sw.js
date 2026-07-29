const CACHE_NAME = "jobtrack-shell-v1";
const APP_SHELL = ["/", "/index.html"];

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;

    // Network-first for navigations, so the shell never goes stale while online —
    // only fall back to the cached shell if the network request fails outright.
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    return res;
                })
                .catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html")))
        );
        return;
    }

    // Cache-first for hashed build assets — their filenames change per build, so a
    // cached copy is always the exact version that was requested, never stale.
    if (request.url.includes("/assets/")) {
        event.respondWith(
            caches.match(request).then(
                (cached) =>
                    cached ||
                    fetch(request).then((res) => {
                        const copy = res.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                        return res;
                    })
            )
        );
    }
});
