import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Subdominio → slug: si entran por ej. jorge.tudominio.com/ se redirige a /jorge (landing del barbero).
// No aplica en dominios de hosting (vercel.app, netlify.app, etc.) ni en localhost.
if (typeof window !== 'undefined' && window.location.pathname === '/') {
  const hostname = window.location.hostname
  const parts = hostname.split('.')

  // Solo aplicar lógica de subdominio en dominios personalizados (ej: jorge.jimbar.app)
  // Ignorar dominios de hosting como *.vercel.app, *.netlify.app, *.railway.app y localhost
  const hostingDomains = ['vercel.app', 'netlify.app', 'railway.app', 'localhost', '127.0.0.1']
  const isHostingDomain = hostingDomains.some(d => hostname.endsWith(d)) || !hostname.includes('.')

  if (!isHostingDomain && parts.length >= 3) {
    const sub = parts[0].toLowerCase()
    const reserved = ['www', 'app', 'api', 'admin', 'mail'].concat(
      (import.meta.env.VITE_RESERVED_SUBDOMAINS || '').split(',').map((s) => s.trim()).filter(Boolean)
    )
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
