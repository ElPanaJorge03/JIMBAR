/**
 * api.js — Cliente HTTP configurado para hablar con el backend Django.
 *
 * Usamos axios porque simplifica el manejo de errores y headers
 * respecto a fetch nativo. Cada request incluye el token JWT
 * automáticamente si el usuario está logueado.
 */
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
    headers: { 'Content-Type': 'application/json' },
});

// Interceptor: adjunta el token JWT a cada request si existe
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor: si el token expiró (401), intenta renovarlo
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            const refresh = localStorage.getItem('refresh_token');

            if (refresh) {
                try {
                    const { data } = await axios.post(
                        `${original.baseURL || 'http://127.0.0.1:8000/api'}/auth/token/refresh/`,
                        { refresh }
                    );
                    localStorage.setItem('access_token', data.access);
                    original.headers.Authorization = `Bearer ${data.access}`;
                    return api(original);
                } catch {
                    // El refresh también falló: sesión expirada
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/barbero/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
