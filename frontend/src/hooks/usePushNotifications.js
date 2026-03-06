/**
 * usePushNotifications.js
 * Hook para solicitar permiso de notificaciones push y suscribir al usuario.
 * Guarda la suscripción en el backend de Jimbar.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Clave pública VAPID (se genera una vez y se fija aquí)
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
    const [permiso, setPermiso] = useState(Notification.permission);
    const [suscrito, setSuscrito] = useState(false);
    const [cargando, setCargando] = useState(false);

    // Verificar si ya hay suscripción activa al montar
    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        navigator.serviceWorker.ready.then(async (reg) => {
            const sub = await reg.pushManager.getSubscription();
            setSuscrito(!!sub);
        });
    }, []);

    const suscribir = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            alert('Tu navegador no soporta notificaciones push.');
            return;
        }
        if (!VAPID_PUBLIC_KEY) {
            console.warn('VITE_VAPID_PUBLIC_KEY no configurado.');
            return;
        }

        setCargando(true);
        try {
            // 1. Pedir permiso
            const resultado = await Notification.requestPermission();
            setPermiso(resultado);
            if (resultado !== 'granted') {
                setCargando(false);
                return;
            }

            // 2. Registrar Service Worker si no está
            const reg = await navigator.serviceWorker.ready;

            // 3. Suscribirse al push
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            // 4. Enviar la suscripción al backend
            await api.post('/push/suscribir/', subscription.toJSON());
            setSuscrito(true);
        } catch (err) {
            console.error('Error suscribiendo a push:', err);
        } finally {
            setCargando(false);
        }
    }, []);

    const desuscribir = useCallback(async () => {
        if (!('serviceWorker' in navigator)) return;
        setCargando(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await sub.unsubscribe();
                await api.post('/push/desuscribir/', { endpoint: sub.endpoint });
            }
            setSuscrito(false);
        } catch (err) {
            console.error('Error desuscribiendo:', err);
        } finally {
            setCargando(false);
        }
    }, []);

    return { permiso, suscrito, cargando, suscribir, desuscribir };
}
