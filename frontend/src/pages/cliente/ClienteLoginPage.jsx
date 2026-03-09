/**
 * ClienteLoginPage.jsx — Login para clientes registrados.
 * Distinto al login del barbero (/barbero/login).
 * El cliente usa su correo como usuario.
 */
import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ClienteLoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [searchParams] = useSearchParams();
    const nextUrl = searchParams.get('next') || null;
    const b = searchParams.get('b') || ''; // slug de la barbería (viene desde la landing del barbero)

    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(form.email.toLowerCase(), form.password);

            if (['BARBERIA_ADMIN', 'SUPERADMIN', 'BARBERO', 'barbero'].includes(data.role)) {
                navigate('/barbero/citas', { replace: true });
            } else if (nextUrl) {
                // Si vino de una ruta protegida, volver allá
                navigate(nextUrl, { replace: true });
            } else {
                navigate('/cliente/citas', { replace: true });
            }
        } catch {
            setError('Correo o contraseña incorrectos.');
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

                {/* Volver: a la landing del barbero si hay slug, si no atrás en historial o next */}
                <button
                    className="btn btn--ghost"
                    onClick={() => {
                        if (b) navigate(`/${b}`, { replace: true });
                        else if (nextUrl) navigate(nextUrl, { replace: true });
                        else navigate(-1);
                    }}
                    style={{ marginBottom: '24px', paddingLeft: 0 }}
                >
                    ← Volver
                </button>

                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ marginBottom: '6px' }}>Iniciar sesión</h1>
                    <p>Ingresa con tu correo y contraseña.</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Correo electrónico (o usuario)</label>
                            <input
                                className="form-input"
                                type="text"
                                value={form.email}
                                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                placeholder="tu@correo.com"
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
                            {loading
                                ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Entrando...</>
                                : 'Entrar'
                            }
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                            <Link to="/recuperar-password" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none' }}>
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem' }}>
                    ¿No tienes cuenta?{' '}
                    <Link to={b ? `/registro?b=${b}` : '/registro'} style={{ color: 'var(--accent)' }}>Regístrate</Link>
                </p>

                <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.875rem' }}>
                    ¿Prefieres no registrarte?{' '}
                    <Link to={b ? `/${b}/agendar` : '/'} style={{ color: 'var(--text-secondary)' }}>Agendar sin cuenta</Link>
                </p>
            </div>
        </div>
    );
}
