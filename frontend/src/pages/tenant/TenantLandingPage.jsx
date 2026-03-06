import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getBarberiaInfo } from '../../services/citasService';
import { Scissors, Fingerprint, Sparkles, User, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TenantLandingPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { authenticated, role } = useAuth();

    const [barberia, setBarberia] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        getBarberiaInfo(slug)
            .then(data => {
                setBarberia(data);
                setLoading(false);
                document.title = `${data.nombre} | Reservas`;
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [slug]);

    if (loading) {
        return (
            <div className="loading-center">
                <div className="spinner" />
            </div>
        );
    }

    if (error || !barberia) {
        return <Navigate to="/" replace />;
    }

    return (
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

            {/* ── HERO ─────────────────────────────────────── */}
            <section style={{
                padding: '60px 24px 48px',
                textAlign: 'center',
                background: barberia.imagen_portada
                    ? `linear-gradient(180deg, rgba(15,15,15,0.9) 0%, rgba(10,10,10,1) 100%), url(${barberia.imagen_portada})`
                    : 'linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
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
                        Reservas de Barbería
                    </span>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                        fontWeight: 700,
                        letterSpacing: '-2px',
                        color: 'var(--text-primary)',
                        lineHeight: 1,
                        margin: 0,
                    }}>
                        {barberia.nombre.toUpperCase()}
                    </h1>
                </div>

                <p style={{
                    fontSize: '1.125rem',
                    color: 'var(--text-secondary)',
                    maxWidth: '400px',
                    margin: '0 auto 40px',
                    lineHeight: 1.6,
                }}>
                    {barberia.descripcion || "Tu barbero llega donde estás. Agenda tu cita en minutos, sin filas ni esperas."}
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
                        onClick={() => navigate(`/${slug}/agendar`)}
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
                            Mis Citas
                        </button>
                    </div>
                </div>
            </section>

            {/* ── CÓMO FUNCIONA ────────────────────────────── */}
            <section style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                    <h2 style={{ marginBottom: '8px' }}>¿Cómo funciona?</h2>
                    <p style={{ marginBottom: '36px' }}>En 3 sencillos pasos.</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { num: '1', titulo: 'Elige tu servicio', desc: 'Selecciona lo que necesitas.' },
                            { num: '2', titulo: 'Selecciona fecha y hora', desc: 'Ve nuestra disponibilidad.' },
                            { num: '3', titulo: 'Ingresa tu ubicación', desc: 'Llegamos hasta tu puerta.' },
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

            {/* FOOTER */}
            <footer style={{
                marginTop: 'auto',
                padding: '32px 24px',
                textAlign: 'center',
                background: 'var(--bg-surface)',
                borderTop: '1px solid var(--border)',
            }}>
                <div style={{ opacity: 0.6, fontSize: '0.875rem' }}>
                    <p style={{ marginBottom: '4px' }}>
                        <strong>{barberia.nombre}</strong> — Reservas de Barbería
                    </p>
                    <p style={{ margin: 0 }}>Gestión impulsada por <strong>Jimbar App</strong></p>
                </div>
            </footer>
        </div>
    );
}
