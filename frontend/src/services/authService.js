/**
 * authService.js — Login y logout del barbero.
 */
import api from './api';

export const login = async (username, password) => {
    const { data } = await api.post('/auth/token/', { username, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);

    // Guardamos la info del tenant para usarla luego en la vista del administrador
    if (data.barberia_slug) localStorage.setItem('barberia_slug', data.barberia_slug);
    if (data.barberia_nombre) localStorage.setItem('barberia_nombre', data.barberia_nombre);

    // El rol real lo decide el backend
    const actualRole = data.role || (data.is_barbero ? 'barbero' : 'cliente');
    localStorage.setItem('role', actualRole);
    return { ...data, role: actualRole };
};

export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    localStorage.removeItem('barberia_slug');
    localStorage.removeItem('barberia_nombre');
};
export const getRole = () => localStorage.getItem('role');

export const isAuthenticated = () => !!localStorage.getItem('access_token');
