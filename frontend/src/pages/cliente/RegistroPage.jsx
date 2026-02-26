/**
 * RegistroPage.jsx — Registro de nuevos clientes.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import api from '../../services/api';

export default function RegistroPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        first_name: '',
        email: '',
        password: '',
        password2: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState(false);

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.password2) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/registro/', form);
            setExito(true);
        } catch (err) {
            const data = err.response?.data;
            if (data) {
                const msg = typeof data === 'string'
                    ? data
                    : Object.values(data).flat().join(' ');
                setError(msg);
            } else {
                setError('Error al crear la cuenta. Intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (exito) {
        return (
            <div style={{
                minHeight: '100dvh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
            }}>
                <div style={{ maxWidth: '380px', width: '100%', textAlign: 'center' }}>
                    <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: 'rgba(76,175,125,0.15)',
                        border: '1px solid var(--success)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--success)',
                        margin: '0 auto 20px',
                    }}>
                        <Check size={32} />
                    </div>
                    <h2 style={{ marginBottom: '8px', color: 'var(--success)' }}>¡Cuenta creada!</h2>
                    <p style={{ marginBottom: '28px' }}>
                        Ya puedes iniciar sesión y agendar tus citas.
                    </p>
                    <button className="btn btn--primary" onClick={() => navigate('/login')}>
                        Iniciar sesión
                    </button>
                </div>
            </div>
        );
    }

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

                <button
                    className="btn btn--ghost"
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: '24px', paddingLeft: 0 }}
                >
                    ← Volver
                </button>

                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ marginBottom: '6px' }}>Crear cuenta</h1>
                    <p>
                        Opcional — también puedes{' '}
                        <Link to="/agendar" style={{ color: 'var(--accent)' }}>agendar sin cuenta</Link>.
                    </p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Tu nombre</label>
                            <input
                                className="form-input"
                                type="text"
                                name="first_name"
                                value={form.first_name}
                                onChange={handleChange}
                                placeholder="Juan"
                                autoComplete="given-name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Correo electrónico</label>
                            <input
                                className="form-input"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="tu@correo.com"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Contraseña</label>
                            <input
                                className="form-input"
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Mínimo 6 caracteres"
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirmar contraseña</label>
                            <input
                                className="form-input"
                                type="password"
                                name="password2"
                                value={form.password2}
                                onChange={handleChange}
                                placeholder="Repite tu contraseña"
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        {error && <div className="alert alert--error">{error}</div>}

                        <button type="submit" className="btn btn--primary" disabled={loading}>
                            {loading
                                ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Creando cuenta...</>
                                : 'Crear cuenta'
                            }
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem' }}>
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" style={{ color: 'var(--accent)' }}>Inicia sesión</Link>
                </p>
            </div>
        </div>
    );
}
