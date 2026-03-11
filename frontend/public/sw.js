/* ============================================================
   sw.js — Service Worker de Jimbar
   Maneja:
   - Caché de assets (offline básico)
   - Notificaciones Push entrantes
   ============================================================ */

const CACHE_NAME = 'jimbar-v3';

// ── Instalación ─────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Limpiar TODAS las cachés antiguas al activar nueva versión
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
            )
        ).then(() => self.clients.claim())
    );
});

// Requerido por algunos navegadores para la suscripción push
self.addEventListener('fetch', () => { });

// ── Push: recibir notificación ──────────────────────────────
self.addEventListener('push', (event) => {
    let data = { title: 'Jimbar', body: 'Tienes una nueva notificación', icon: '/favicon.svg' };
    try {
        const parsed = event.data.json();
        // Validar que los campos esperados existen y son strings
        if (typeof parsed.title === 'string' && typeof parsed.body === 'string') {
            data = parsed;
        }
    } catch { /* si no viene JSON válido, usar defaults */ }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/favicon.svg',
            badge: '/favicon.svg',
            data: { url: data.url || '/' },
            vibrate: [200, 100, 200],
        })
    );
});

// ── Click en notificación: abrir/enfocar la app ─────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            // Si ya hay una ventana abierta, enfocarla
            const existing = clients.find((c) => c.url.includes(self.location.origin));
            if (existing) {
                existing.focus();
                existing.navigate(targetUrl);
            } else {
                self.clients.openWindow(targetUrl);
            }
        })
    );
});
