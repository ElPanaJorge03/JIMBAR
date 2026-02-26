/**
 * LoginPage.jsx — Pantalla de login del barbero.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(form.username, form.password, 'barbero');
            navigate('/barbero/citas', { replace: true });
        } catch {
            setError('Usuario o contraseña incorrectos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
        }}>
            <div style={{ width: '100%', maxWidth: '380px' }}>
                {/* Volver */}
                <button
                    className="btn btn--ghost"
                    onClick={() => navigate('/')}
                    style={{ marginBottom: '24px', paddingLeft: 0 }}
                >
                    ← Volver
                </button>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ color: 'var(--accent)', letterSpacing: '-0.5px', marginBottom: '6px' }}>
                        JIMBAR
                    </h1>
                    <p>Panel del barbero</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Usuario</label>
                            <input
                                className="form-input"
                                type="text"
                                value={form.username}
                                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                                placeholder="jimbar"
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Contraseña</label>
                            <input
                                className="form-input"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        {error && <div className="alert alert--error">{error}</div>}

                        <button type="submit" className="btn btn--primary" disabled={loading}>
                            {loading ? (
                                <><div className="spinner" style={{ width: 18, height: 18 }} /> Entrando...</>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                            <a href="/recuperar-password" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none' }}>
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
