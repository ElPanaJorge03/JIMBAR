/* ============================================================
   sw.js — Service Worker de Jimbar
   Maneja:
   - Caché de assets (offline básico)
   - Notificaciones Push entrantes
   ============================================================ */

const CACHE_NAME = 'jimbar-v1';

// ── Instalación ────────────────────────────────────────────
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// ── Push: recibir notificación ──────────────────────────────
self.addEventListener('push', (event) => {
    let data = { title: 'Jimbar', body: 'Tienes una nueva notificación', icon: '/favicon.svg' };
    try {
        data = event.data.json();
    } catch { /* si no viene JSON, usar defaults */ }

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
