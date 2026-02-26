import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas públicas
import LandingPage from './pages/LandingPage';
import AgendarPage from './pages/AgendarPage';
import ClienteLoginPage from './pages/cliente/ClienteLoginPage';
import RegistroPage from './pages/cliente/RegistroPage';

// Páginas del barbero
import LoginPage from './pages/barbero/LoginPage';
import CitasPage from './pages/barbero/CitasPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Público ─────────────────────────────── */}
          {/* Página de inicio con info del negocio */}
          <Route path="/" element={<LandingPage />} />

          {/* Flujo de agendamiento (con o sin cuenta) */}
          <Route path="/agendar" element={<AgendarPage />} />

          {/* Cuenta de cliente */}
          <Route path="/login" element={<ClienteLoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />

          {/* ── Barbero ─────────────────────────────── */}
          <Route path="/barbero/login" element={<LoginPage />} />
          <Route
            path="/barbero/citas"
            element={
              <ProtectedRoute>
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
