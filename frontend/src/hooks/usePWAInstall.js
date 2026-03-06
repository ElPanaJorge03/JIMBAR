/**
 * usePWAInstall.js
 * Hook para capturar el evento beforeinstallprompt del navegador
 * y exponerlo de forma controlada para mostrar un botón de "Instalar app".
 */
import { useState, useEffect } from 'react';

export function usePWAInstall() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Si ya está instalada como PWA, no mostrar el botón
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        const handler = (e) => {
            e.preventDefault(); // Evita que el navegador muestre el prompt automático
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Detectar si el usuario la instala desde otro lugar
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setInstallPrompt(null);
        });

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const triggerInstall = async () => {
        if (!installPrompt) return;
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstalled(true);
            setInstallPrompt(null);
        }
    };

    return {
        canInstall: !!installPrompt && !isInstalled,
        isInstalled,
        triggerInstall,
    };
}
