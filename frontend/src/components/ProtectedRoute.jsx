/**
 * ProtectedRoute.jsx
 *
 * Envuelve rutas que solo el barbero autenticado puede ver.
 * Si el usuario no está logueado, lo redirige al login.
 *
 * Uso:
 *   <Route path="/barbero/citas" element={<ProtectedRoute><CitasPage /></ProtectedRoute>} />
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { authenticated } = useAuth();

    if (!authenticated) {
        return <Navigate to="/barbero/login" replace />;
    }

    return children;
}
