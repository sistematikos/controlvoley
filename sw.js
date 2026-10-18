const CACHE_NAME = 'control-voley-v2';
const ASSETS = [
    './',
    './index.html',
    './index_menu.html',
    './index_atletas.html',
    './index_ficha.html',
    './manifest.json',
    './img/banner.png',
    './img/icon-192.png',
    './img/icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap',
    'https://cdn.tailwindcss.com'
];

// Instalación del Service Worker
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Estrategia Fetch: Red primero, respaldo en caché si no hay internet (evitando interferir con API de Supabase)
self.addEventListener('fetch', (e) => {
    // Si la petición es hacia Supabase o APIs externas, dejar que la maneje el navegador directamente
    if (e.request.url.includes('supabase.co')) {
        return;
    }

    e.respondWith(
        fetch(e.request).catch(() => {
            return caches.match(e.request);
        })
    );
});
