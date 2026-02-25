/**
 * AuthContext.jsx
 *
 * Guarda el estado de sesión del barbero y lo hace disponible
 * en toda la app sin pasar props por cada componente.
 *
 * Uso: cualquier componente puede llamar useAuth() para saber
 * si el barbero está logueado y para hacer login/logout.
 */
import { createContext, useContext, useState } from 'react';
import { login as loginService, logout as logoutService, isAuthenticated } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [authenticated, setAuthenticated] = useState(isAuthenticated());

    const login = async (username, password) => {
        await loginService(username, password);
        setAuthenticated(true);
    };

    const logout = () => {
        logoutService();
        setAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ authenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

/** Hook para usar el contexto en cualquier componente */
export function useAuth() {
    return useContext(AuthContext);
}
