/**
 * LandingPage.jsx — Landing Page Oficial de Jimbar SaaS.
 * Esta página vende el software a otros barberos para que se unan a la plataforma.
 */
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, CalendarCheck, MapPin, ShieldCheck, Link2 } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();
    const { authenticated, role } = useAuth();

    // Si alguien de Jimbar ya está logueado, llevarlo a su dashboard
    if (authenticated) {
        if (['BARBERIA_ADMIN', 'SUPERADMIN', 'BARBERO', 'barbero'].includes(role)) {
            return <Navigate to="/barbero/citas" replace />;
        } else {
            return <Navigate to="/cliente/citas" replace />;
        }
    }

    return (
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#050505' }}>

            {/* ── HERO ─────────────────────────────────────── */}
            <section style={{
                padding: '80px 24px 60px',
                textAlign: 'center',
                background: 'radial-gradient(circle at top, rgba(162,112,53,0.15) 0%, #050505 60%)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
                {/* Logo */}
                <div style={{ marginBottom: '24px' }}>
                    <span style={{
                        display: 'inline-block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        letterSpacing: '3px',
                        color: 'var(--accent)',
                        textTransform: 'uppercase',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: 'rgba(162,112,53,0.1)',
                        border: '1px solid rgba(162,112,53,0.2)',
                        marginBottom: '16px',
                    }}>
                        Jimbar Software
                    </span>
                    <h1 style={{
                        fontSize: 'clamp(3rem, 10vw, 5rem)',
                        fontWeight: 800,
                        letterSpacing: '-2px',
                        color: '#ffffff',
                        lineHeight: 1.1,
                        margin: '0 auto',
                        maxWidth: '800px'
                    }}>
                        El Sistema Definitivo para <span style={{ color: 'var(--accent)' }}>Barberos a Domicilio</span>
                    </h1>
                </div>

                <p style={{
                    fontSize: '1.25rem',
                    color: '#aaaaaa',
                    maxWidth: '500px',
                    margin: '0 auto 48px',
                    lineHeight: 1.6,
                }}>
                    Obtén tu propia página web de agendamiento, organiza tus citas automáticamente y profesionaliza tu negocio. Empieza hoy.
                </p>

                {/* CTAs principales */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    maxWidth: '360px',
                    margin: '0 auto',
                }}>
                    <button
                        className="btn btn--primary"
                        onClick={() => navigate('/registro-barberia')}
                        style={{ fontSize: '1.1rem', minHeight: '56px', fontWeight: 600 }}
                    >
                        Probar 15 días GRATIS
                    </button>
                    <button
                        className="btn btn--secondary"
                        onClick={() => navigate('/login')}
                        style={{ minHeight: '48px', fontSize: '1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                        Ya tengo una cuenta
                    </button>
                </div>
            </section>

            {/* ── BENEFICIOS ────────────────────────────── */}
            <section style={{ padding: '80px 24px', textAlign: 'center', background: '#0a0a0a' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <h2 style={{ marginBottom: '16px', fontSize: '2.5rem', color: '#fff' }}>¿Por qué usar Jimbar?</h2>
                    <p style={{ marginBottom: '48px', color: '#888', fontSize: '1.1rem' }}>
                        Diseñado específicamente para las necesidades de los barberos móviles.
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '24px'
                    }}>
                        {[
                            {
                                id: 1,
                                icono: <Link2 size={32} color="var(--accent)" />,
                                titulo: 'Tu propio enlace',
                                desc: 'Recibe un enlace tipo jimbar.app/tu-nombre y compártelo en tu Instagram o WhatsApp.'
                            },
                            {
                                id: 2,
                                icono: <CalendarCheck size={32} color="var(--accent)" />,
                                titulo: 'Agendamiento automático',
                                desc: 'Los clientes ven tus horarios libres y reservan sin que tengas que chatear horas con ellos.'
                            },
                            {
                                id: 3,
                                icono: <MapPin size={32} color="var(--accent)" />,
                                titulo: 'Organización de zonas',
                                desc: 'Tus clientes deben escribir su dirección obligatoriamente. Llega sin perderte.'
                            },
                            {
                                id: 4,
                                icono: <ShieldCheck size={32} color="var(--accent)" />,
                                titulo: 'Anti-Spam de Citas',
                                desc: 'Protección para evitar que te llenen la agenda temporalmente con citas falsas.'
                            },
                        ].map((beneficio) => (
                            <div key={beneficio.id} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                padding: '32px 24px',
                                background: '#111',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '16px',
                            }}>
                                <div style={{ marginBottom: '20px' }}>
                                    {beneficio.icono}
                                </div>
                                <h3 style={{ marginBottom: '12px', color: '#fff', fontSize: '1.25rem' }}>
                                    {beneficio.titulo}
                                </h3>
                                <p style={{ fontSize: '0.95rem', color: '#aaa', margin: 0, lineHeight: 1.5 }}>
                                    {beneficio.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FOOTER ───────────────────────────────────── */}
            <footer style={{
                marginTop: 'auto',
                padding: '40px 24px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center',
                background: '#050505'
            }}>
                <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.5rem', letterSpacing: '-1px' }}>
                        JIMBAR
                    </span>
                </div>
                <p style={{ color: '#666', fontSize: '0.875rem' }}>
                    © {new Date().getFullYear()} Jimbar Software. Todos los derechos reservados.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '24px' }}>
                    <button className="btn btn--ghost" style={{ color: '#888', fontSize: '0.875rem' }}>Términos</button>
                    <button className="btn btn--ghost" style={{ color: '#888', fontSize: '0.875rem' }}>Privacidad</button>
                </div>
            </footer>
        </div>
    );
}
