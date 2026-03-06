/**
 * ProtectedRoute.jsx
 *
 * Envuelve rutas que solo el barbero autenticado puede ver.
 * Si el usuario no está logueado, lo redirige al login.
 *
 * Uso:
 *   <Route path="/barbero/citas" element={<ProtectedRoute><CitasPage /></ProtectedRoute>} />
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { authenticated, role } = useAuth();
    const location = useLocation();

    if (!authenticated) {
        // Guarda la URL actual para poder volver después del login
        return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        // Logueado pero sin permiso para esta ruta
        return <Navigate to="/" replace />;
    }

    return children;
}
