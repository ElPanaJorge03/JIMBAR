import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas públicas
import LandingPage from './pages/LandingPage';
import AgendarPage from './pages/AgendarPage';
import CancelarPage from './pages/cliente/CancelarPage';
import ClienteLoginPage from './pages/cliente/ClienteLoginPage';
import RegistroPage from './pages/cliente/RegistroPage';
import DashboardCliente from './pages/cliente/DashboardCliente';
import RecuperarPasswordPage from './pages/auth/RecuperarPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

import TenantLandingPage from './pages/tenant/TenantLandingPage';

// Páginas del barbero
import LoginPage from './pages/barbero/LoginPage';
import CitasPage from './pages/barbero/CitasPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Público ─────────────────────────────── */}
          {/* Página de inicio del SaaS (Jimbar Software) */}
          <Route path="/" element={<LandingPage />} />

          {/* ── Barberías (Tenant Público) ──────────────────── */}
          <Route path="/:slug" element={<TenantLandingPage />} />
          <Route path="/:slug/agendar" element={<AgendarPage />} />
          <Route path="/:slug/cancelar/:id" element={<CancelarPage />} />

          {/* ── Cuentas y Auth Centrales ────────────────────── */}
          <Route path="/login" element={<ClienteLoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />

          <Route path="/recuperar-password" element={<RecuperarPasswordPage />} />
          <Route path="/restaurar-password/:uid/:token" element={<ResetPasswordPage />} />

          <Route
            path="/cliente/citas"
            element={
              <ProtectedRoute allowedRoles={['CLIENTE', 'cliente']}>
                <DashboardCliente />
              </ProtectedRoute>
            }
          />

          {/* ── Barbero ─────────────────────────────── */}
          <Route path="/barbero/login" element={<LoginPage />} />
          <Route
            path="/barbero/citas"
            element={
              <ProtectedRoute allowedRoles={['SUPERADMIN', 'BARBERIA_ADMIN', 'BARBERO', 'barbero']}>
                <CitasPage />
              </ProtectedRoute>
            }
          />

          {/* Ruta desconocida → inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
