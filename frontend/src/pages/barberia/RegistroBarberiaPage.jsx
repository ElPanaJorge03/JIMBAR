/**
 * RegistroBarberiaPage.jsx — Formulario de onboarding para nuevas barberías.
 * POST /api/auth/registro-barberia/
 * Crea el tenant, el usuario Admin y activa el Trial de 15 días.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { CheckCircle } from 'lucide-react';

export default function RegistroBarberiaPage() {
    const navigate = useNavigate();
    const [paso, setPaso] = useState(1); // 1 = Formulario, 2 = Éxito
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resultado, setResultado] = useState(null);

    const [form, setForm] = useState({
        barberia_nombre: '',
        admin_nombre: '',
        admin_email: '',
        admin_password: '',
        admin_password2: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.admin_password !== form.admin_password2) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (form.admin_password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/registro-barberia/', {
                barberia_nombre: form.barberia_nombre.trim(),
                admin_nombre: form.admin_nombre.trim(),
                admin_email: form.admin_email.toLowerCase().trim(),
                admin_password: form.admin_password,
            });
            setResultado(data.datos);
            setPaso(2);
        } catch (err) {
            const data = err.response?.data;
            if (data) {
                const msg = typeof data === 'string'
                    ? data
                    : Object.entries(data).map(([k, v]) =>
                        Array.isArray(v) ? v.join(' ') : v
                    ).join(' ');
                setError(msg);
            } else {
                setError('Error al registrar. Intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (paso === 2 && resultado) {
        return (
            <div style={{
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: '#050505',
            }}>
                <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>
                    <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                        <CheckCircle size={80} color="var(--accent)" style={{ opacity: 0.9 }} />
                    </div>
                    <h1 style={{ marginBottom: '12px', fontSize: '2rem' }}>¡Todo listo!</h1>
                    <p style={{ color: '#aaa', marginBottom: '32px', lineHeight: 1.6 }}>
                        Tu barbería <strong style={{ color: '#fff' }}>{resultado.barberia_nombre}</strong> fue creada exitosamente.<br />
                        Tienes <span style={{ color: 'var(--accent)', fontWeight: 600 }}>15 días de prueba GRATIS</span>.
                    </p>

                    <div className="card" style={{ textAlign: 'left', marginBottom: '24px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tu enlace público</div>
                            <a
                                href={`/${resultado.barberia_slug}`}
                                style={{ color: 'var(--accent)', fontWeight: 600, wordBreak: 'break-all' }}
                            >
                                {window.location.origin}/{resultado.barberia_slug}
                            </a>
                            <p style={{ fontSize: '0.8rem', color: '#777', marginTop: '4px' }}>
                                Comparte este enlace con tus clientes
                            </p>
                        </div>
                        <hr style={{ borderColor: 'var(--border)', margin: '12px 0' }} />
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Correo de acceso</div>
                            <div style={{ color: '#fff', fontWeight: 500 }}>{resultado.admin_email}</div>
                        </div>
                    </div>

                    <button
                        className="btn btn--primary"
                        onClick={() => navigate('/barbero/login')}
                        style={{ width: '100%', minHeight: '52px', fontSize: '1rem' }}
                    >
                        Ir al Panel →
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
            background: '#050505',
        }}>
            <div style={{ width: '100%', maxWidth: '440px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Link to="/" style={{ display: 'inline-block', marginBottom: '24px', textDecoration: 'none' }}>
                        <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.75rem', letterSpacing: '-1px' }}>JIMBAR</span>
                    </Link>
                    <h2 style={{ marginBottom: '8px', fontSize: '1.6rem' }}>Crea tu Barbería</h2>
                    <p style={{ color: '#888', fontSize: '0.95rem' }}>
                        ¡Gratis por 15 días, sin tarjeta de crédito!
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Bloque 1: Barbería */}
                    <div style={{ padding: '20px', background: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px', fontWeight: 600 }}>
                            Tu Barbería
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nombre de la Barbería *</label>
                            <input
                                className="form-input"
                                type="text"
                                name="barberia_nombre"
                                value={form.barberia_nombre}
                                onChange={handleChange}
                                placeholder="Ej: Cortes El Brayan"
                                required
                                minLength={3}
                            />
                            <span className="text-xs text-muted">Se usará en tu enlace público automáticamente.</span>
                        </div>
                    </div>

                    {/* Bloque 2: Tu cuenta */}
                    <div style={{ padding: '20px', background: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px', fontWeight: 600 }}>
                            Tu Cuenta de Administrador
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div className="form-group">
                                <label className="form-label">Tu nombre *</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    name="admin_nombre"
                                    value={form.admin_nombre}
                                    onChange={handleChange}
                                    placeholder="Ej: Brayan García"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Correo electrónico *</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    name="admin_email"
                                    value={form.admin_email}
                                    onChange={handleChange}
                                    placeholder="tu@correo.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Contraseña *</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    name="admin_password"
                                    value={form.admin_password}
                                    onChange={handleChange}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirmar contraseña *</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    name="admin_password2"
                                    value={form.admin_password2}
                                    onChange={handleChange}
                                    placeholder="Repite tu contraseña"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>
                    </div>

                    {error && <div className="alert alert--error">{error}</div>}

                    <button
                        type="submit"
                        className="btn btn--primary"
                        disabled={loading}
                        style={{ minHeight: '52px', fontSize: '1rem', fontWeight: 600 }}
                    >
                        {loading ? (
                            <><div className="spinner" style={{ width: 18, height: 18 }} /> Creando tu barbería...</>
                        ) : (
                            'Crear mi Barbería GRATIS →'
                        )}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/barbero/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                            Inicia sesión
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
