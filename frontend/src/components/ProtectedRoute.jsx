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

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { authenticated, role } = useAuth();

    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        // Logueado pero sin permiso para esta ruta
        return <Navigate to="/" replace />;
    }

    return children;
}
