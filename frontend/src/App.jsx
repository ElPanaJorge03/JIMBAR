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

// Páginas de gestión de la barbería
import RegistroBarberiaPage from './pages/barberia/RegistroBarberiaPage';
import MiBarberiaPage from './pages/barberia/MiBarberiaPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Inicio del SaaS ──────────────────────────── */}
          <Route path="/" element={<LandingPage />} />

          {/* ── Cuentas y Auth Centrales (ESTÁTICAS PRIMERO) ── */}
          <Route path="/login" element={<ClienteLoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/registro-barberia" element={<RegistroBarberiaPage />} />
          <Route path="/recuperar-password" element={<RecuperarPasswordPage />} />
          <Route path="/restaurar-password/:uid/:token" element={<ResetPasswordPage />} />

          {/* ── Barbero ──────────────────────────────────── */}
          <Route path="/barbero/login" element={<LoginPage />} />
          <Route
            path="/barbero/citas"
            element={
              <ProtectedRoute allowedRoles={['SUPERADMIN', 'BARBERIA_ADMIN', 'BARBERO', 'barbero']}>
                <CitasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mi-barberia"
            element={
              <ProtectedRoute allowedRoles={['SUPERADMIN', 'BARBERIA_ADMIN']}>
                <MiBarberiaPage />
              </ProtectedRoute>
            }
          />

          {/* ── Dashboard Cliente ────────────────────────── */}
          <Route
            path="/cliente/citas"
            element={
              <ProtectedRoute allowedRoles={['CLIENTE', 'cliente']}>
                <DashboardCliente />
              </ProtectedRoute>
            }
          />

          {/* ── Barberías (Tenant Público) ── DEBEN IR AL FINAL (ruta dinámica) */}
          <Route path="/:slug" element={<TenantLandingPage />} />
          <Route path="/:slug/agendar" element={<AgendarPage />} />
          <Route path="/:slug/cancelar/:id" element={<CancelarPage />} />

          {/* Ruta desconocida → inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
