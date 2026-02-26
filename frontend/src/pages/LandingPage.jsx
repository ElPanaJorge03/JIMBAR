/**
 * LandingPage.jsx — Página de inicio de Jimbar.
 *
 * Lo primero que ve cualquier visitante. Muestra:
 * - Branding y propuesta de valor
 * - Servicios y horarios
 * - 3 CTAs: Agendar sin cuenta / Iniciar sesión / Registrarse
 */
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scissors, Fingerprint, Sparkles, User, Star } from 'lucide-react';


const SERVICIOS = [
    { nombre: 'Corte de cabello', precio: '$10.000', duracion: '45 min', icono: <Scissors size={18} /> },
    { nombre: 'Barba', precio: '$5.000', duracion: '15 min', icono: <Fingerprint size={18} /> },
    { nombre: 'Cejas', precio: '$3.000', duracion: '10 min', icono: <Sparkles size={18} /> },
    { nombre: 'Corte + Barba', precio: '$15.000', duracion: '60 min', icono: <User size={18} /> },
    { nombre: 'Completo', precio: '$18.000', duracion: '70 min', icono: <Star size={18} /> },
];

export default function LandingPage() {
    const navigate = useNavigate();
    const { authenticated, role } = useAuth();

    // Si ya hay sesión activa, redirigir al dashboard respectivo
    if (authenticated) {
        if (role === 'barbero') {
            return <Navigate to="/barbero/citas" replace />;
        } else {
            return <Navigate to="/agendar" replace />;
        }
    }

    return (
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

            {/* ── HERO ─────────────────────────────────────── */}
            <section style={{
                padding: '60px 24px 48px',
                textAlign: 'center',
                background: 'linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)',
                borderBottom: '1px solid var(--border)',
            }}>
                {/* Logo */}
                <div style={{ marginBottom: '16px' }}>
                    <span style={{
                        display: 'inline-block',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        letterSpacing: '3px',
                        color: 'var(--accent)',
                        textTransform: 'uppercase',
                        marginBottom: '12px',
                    }}>
                        Barbería a domicilio · Barranquilla
                    </span>
                    <h1 style={{
                        fontSize: 'clamp(3rem, 10vw, 5rem)',
                        fontWeight: 700,
                        letterSpacing: '-2px',
                        color: 'var(--text-primary)',
                        lineHeight: 1,
                        margin: 0,
                    }}>
                        JIM<span style={{ color: 'var(--accent)' }}>BAR</span>
                    </h1>
                </div>

                <p style={{
                    fontSize: '1.125rem',
                    color: 'var(--text-secondary)',
                    maxWidth: '320px',
                    margin: '0 auto 40px',
                    lineHeight: 1.6,
                }}>
                    Tu barbero llega donde estás. Agenda tu cita en minutos, sin filas ni esperas.
                </p>

                {/* CTAs principales */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    maxWidth: '320px',
                    margin: '0 auto',
                }}>
                    <button
                        className="btn btn--primary"
                        onClick={() => navigate('/agendar')}
                        style={{ fontSize: '1rem', minHeight: '52px' }}
                    >
                        Agendar cita ahora
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button
                            className="btn btn--secondary"
                            onClick={() => navigate('/login')}
                            style={{ minHeight: '44px', fontSize: '0.9rem' }}
                        >
                            Iniciar sesión
                        </button>
                        <button
                            className="btn btn--secondary"
                            onClick={() => navigate('/registro')}
                            style={{ minHeight: '44px', fontSize: '0.9rem' }}
                        >
                            Registrarse
                        </button>
                    </div>
                </div>
            </section>

            {/* ── CÓMO FUNCIONA ────────────────────────────── */}
            <section style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                    <h2 style={{ marginBottom: '8px' }}>¿Cómo funciona?</h2>
                    <p style={{ marginBottom: '36px' }}>
                        En 3 pasos tienes tu cita lista.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { num: '1', titulo: 'Elige tu servicio', desc: 'Corte, barba, cejas o combinaciones.' },
                            { num: '2', titulo: 'Selecciona fecha y hora', desc: 'Ve la disponibilidad real en tiempo real.' },
                            { num: '3', titulo: 'Ingresa tu dirección', desc: 'El barbero va hasta donde estás.' },
                        ].map((paso) => (
                            <div key={paso.num} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '16px',
                                textAlign: 'left',
                                padding: '16px',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                            }}>
                                <span style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: 'var(--accent-muted)',
                                    border: '1px solid var(--accent)',
                                    color: 'var(--accent)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    flexShrink: 0,
                                    fontSize: '0.875rem',
                                }}>
                                    {paso.num}
                                </span>
                                <div>
                                    <h4 style={{ marginBottom: '2px', color: 'var(--text-primary)' }}>{paso.titulo}</h4>
                                    <p style={{ fontSize: '0.875rem', margin: 0 }}>{paso.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SERVICIOS ────────────────────────────────── */}
            <section style={{
                padding: '0 24px 48px',
                borderTop: '1px solid var(--border)',
                paddingTop: '48px',
            }}>
                <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                    <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>Servicios</h2>
                    <p style={{ textAlign: 'center', marginBottom: '28px', lineHeight: 1.8 }}>
                        <span style={{ display: 'block' }}>Lun – Vie · 7:00 AM – 12:00 PM <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(última cita 11:00 AM)</span></span>
                        <span style={{ display: 'block' }}>Sáb, Dom y festivos · 7:00 AM – 12:00 AM <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(última cita 10:00 PM)</span></span>
                    </p>



                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {SERVICIOS.map((s) => (
                            <div key={s.nombre} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '14px 16px',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.25rem' }}>{s.icono}</span>
                                    <div>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                                            {s.nombre}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.duracion}</div>
                                    </div>
                                </div>
                                <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '1rem' }}>
                                    {s.precio}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button
                        className="btn btn--primary"
                        onClick={() => navigate('/agendar')}
                        style={{ marginTop: '28px' }}
                    >
                        Agendar ahora →
                    </button>
                </div>
            </section>

            {/* ── FOOTER ───────────────────────────────────── */}
            <footer style={{
                marginTop: 'auto',
                padding: '24px',
                borderTop: '1px solid var(--border)',
                textAlign: 'center',
            }}>
                <p className="text-xs text-muted">© 2025 Jimbar · Barbería a domicilio</p>
                <button
                    className="btn btn--ghost"
                    onClick={() => navigate('/barbero/login')}
                    style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}
                >
                    Acceso barbero
                </button>
            </footer>
        </div>
    );
}
