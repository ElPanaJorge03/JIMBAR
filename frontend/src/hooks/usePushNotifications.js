/**
 * usePushNotifications.js
 * Hook para solicitar permiso de notificaciones push y suscribir al usuario.
 * Guarda la suscripción en el backend de Jimbar.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
    const [permiso, setPermiso] = useState(() => {
        if ('Notification' in window) return Notification.permission;
        return 'unsupported';
    });
    const [suscrito, setSuscrito] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(false);

    const compatible = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

    // Verificar si ya hay suscripción activa al montar
    useEffect(() => {
        if (!compatible) return;
        navigator.serviceWorker.ready.then(async (reg) => {
            const sub = await reg.pushManager.getSubscription();
            setSuscrito(!!sub);
        }).catch(() => { });
    }, [compatible]);

    const suscribir = useCallback(async () => {
        setError(null);
        setExito(false);

        if (!compatible) {
            setError('Tu navegador no soporta notificaciones push.');
            return;
        }
        if (!VAPID_PUBLIC_KEY) {
            setError('La clave VAPID no está configurada. Contacta al administrador.');
            return;
        }

        setCargando(true);
        try {
            // 1. Pedir permiso
            const resultado = await Notification.requestPermission();
            setPermiso(resultado);
            if (resultado === 'denied') {
                setError('Permiso denegado. Actívalo en la configuración de tu navegador.');
                return;
            }
            if (resultado !== 'granted') return;

            // 2. Obtener SW listo
            const reg = await navigator.serviceWorker.ready;

            // 3. Suscribirse al push
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            // 4. Enviar la suscripción al backend
            await api.post('/push/suscribir/', subscription.toJSON());
            setSuscrito(true);
            setExito(true);
            setTimeout(() => setExito(false), 3000);
        } catch (err) {
            console.error('Error suscribiendo a push:', err);
            setError('No se pudo activar las notificaciones. Inténtalo de nuevo.');
        } finally {
            setCargando(false);
        }
    }, [compatible]);

    const desuscribir = useCallback(async () => {
        setError(null);
        if (!compatible) return;
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
            setError('No se pudo desactivar las notificaciones.');
        } finally {
            setCargando(false);
        }
    }, [compatible]);

    return { permiso, suscrito, cargando, error, exito, compatible, suscribir, desuscribir };
}
