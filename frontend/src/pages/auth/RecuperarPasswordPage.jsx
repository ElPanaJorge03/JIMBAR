import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function RecuperarPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMensaje('');

        try {
            const { data } = await api.post('/auth/recuperar-password/', { email });
            setMensaje(data.mensaje || 'Revisa tu correo para continuar con la recuperación.');
        } catch (err) {
            setError(err.response?.data?.error || 'Hubo un error. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '16px' }}>Recuperar Contraseña</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
                </p>

                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}
                {mensaje && (
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>
                        {mensaje}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Correo electrónico</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="tu@correo.com"
                        />
                    </div>

                    <button type="submit" className="btn btn--primary" style={{ marginTop: '8px' }} disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar enlace'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <button className="btn btn--ghost" onClick={() => navigate(-1)}>
                        Volver al inicio
                    </button>
                </div>
            </div>
        </div>
    );
}
