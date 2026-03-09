import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Subdominio → slug: si entran por ej. jorge.tudominio.com/ se redirige a /jorge (landing del barbero).
// En el dominio principal (ej. jimbar.vercel.app) definir VITE_RESERVED_SUBDOMAINS=jimbar para no redirigir la raíz.
if (typeof window !== 'undefined' && window.location.pathname === '/') {
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  const reserved = ['www', 'app', 'api', 'admin', 'mail'].concat(
    (import.meta.env.VITE_RESERVED_SUBDOMAINS || '').split(',').map((s) => s.trim()).filter(Boolean)
  )
  if (parts.length >= 3) {
    const sub = parts[0].toLowerCase()
    if (!reserved.includes(sub)) {
      window.location.replace('/' + encodeURIComponent(sub))
    }
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registrar Service Worker para PWA + Push Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}
