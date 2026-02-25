import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas del cliente
import AgendarPage from './pages/AgendarPage';

// Páginas del barbero
import LoginPage from './pages/barbero/LoginPage';
import CitasPage from './pages/barbero/CitasPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta raíz → flujo de agendamiento */}
          <Route path="/" element={<AgendarPage />} />

          {/* Barbero */}
          <Route path="/barbero/login" element={<LoginPage />} />
          <Route
            path="/barbero/citas"
            element={
              <ProtectedRoute>
                <CitasPage />
              </ProtectedRoute>
            }
          />

          {/* Cualquier ruta desconocida → inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
