const CACHE_NAME = "mongol-travel-v3";

const STATIC_FILES = [
    "/public/index.html",
    "/public/login.html",
    "/public/plantrip.html",

    "/public/css/style.css",
    "/public/css/plantrip.css",
    "/public/css/login.css",

    "/public/js/script.js",
    "/public/js/plantrip.js",
    "/public/js/login.js",

    "/public/images/mongolia (1).png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            for (const file of STATIC_FILES) {
                try {
                    await cache.add(file);
                } catch (err) {
                    console.warn("Cache хийж чадсангүй:", file, err);
                }
            }
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
    const url = event.request.url;

    if (
        url.includes("tile.openstreetmap.org") ||
        url.includes("opentopomap.org") ||
        url.includes("arcgisonline.com")
    ) {
        event.respondWith(
            caches.open("map-tiles").then(async (cache) => {
                const cached = await cache.match(event.request);
                if (cached) return cached;

                try {
                    const response = await fetch(event.request);
                    cache.put(event.request, response.clone());
                    return response;
                } catch (err) {
                    return new Response("", { status: 408 });
                }
            })
        );
        return;
    }

    event.respondWith(
    caches.match(event.request).then(async (cached) => {
        if (cached) return cached;

        try {
            return await fetch(event.request);
        } catch (error) {
            if (event.request.mode === "navigate") {
                return caches.match("./index.html");
            }

            return new Response("Offline", {
                status: 503,
                statusText: "Offline"
            });
        }
    })
);
});