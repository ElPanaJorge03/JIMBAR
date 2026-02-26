/**
 * authService.js — Login y logout del barbero.
 */
import api from './api';

export const login = async (username, password, role = 'barbero') => {
    const { data } = await api.post('/auth/token/', { username, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('role', role);
    return data;
};

export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
};
export const getRole = () => localStorage.getItem('role');

export const isAuthenticated = () => !!localStorage.getItem('access_token');
