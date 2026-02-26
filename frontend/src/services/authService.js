/**
 * authService.js — Login y logout del barbero.
 */
import api from './api';

export const login = async (username, password) => {
    const { data } = await api.post('/auth/token/', { username, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);

    // El rol real lo decide el backend al iniciar sesión
    const actualRole = data.is_barbero ? 'barbero' : 'cliente';
    localStorage.setItem('role', actualRole);
    return { ...data, role: actualRole };
};

export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
};
export const getRole = () => localStorage.getItem('role');

export const isAuthenticated = () => !!localStorage.getItem('access_token');
