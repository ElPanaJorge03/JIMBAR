import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

export default function ResetPasswordPage() {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMensaje('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            setLoading(false);
            return;
        }

        try {
            const { data } = await api.post('/auth/reset-password/', { uid, token, new_password: password });
            setMensaje(data.mensaje || 'Contraseña restablecida con éxito.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Enlace inválido o expirado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '16px' }}>Nueva Contraseña</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Ingresa tu nueva contraseña para acceder a la plataforma.
                </p>

                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}
                {mensaje && (
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>
                        {mensaje} Redirigiendo al inicio de sesión...
                    </div>
                )}

                {!mensaje && (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Nueva contraseña</label>
                            <input
                                id="password"
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="confirm">Confirmar contraseña</label>
                            <input
                                id="confirm"
                                type="password"
                                className="form-input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn--primary" style={{ marginTop: '8px' }} disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
