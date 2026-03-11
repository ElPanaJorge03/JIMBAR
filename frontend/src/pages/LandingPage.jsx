/**
 * LandingPage.jsx — Landing Page Oficial de Jimbar SaaS.
 */
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef } from 'react';
import {
    CalendarCheck, Link2, MapPin, ShieldCheck, Bell,
    Download, Scissors, ArrowRight, Check, Star,
    Smartphone, Clock, Users, ChevronRight,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

/* ── Componente de número animado ─────────────────────────── */
function AnimatedNumber({ value, suffix = '' }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let start = 0;
        const end = parseInt(value);
        const duration = 1800;
        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * end) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        };
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { requestAnimationFrame(step); observer.disconnect(); }
        }, { threshold: 0.3 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [value, suffix]);
    return <span ref={ref}>0{suffix}</span>;
}

export default function LandingPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const slugFromUrl = searchParams.get('slug');
    const { authenticated, role } = useAuth();
    const { canInstall, triggerInstall } = usePWAInstall();

    if (authenticated) {
        if (['BARBERIA_ADMIN', 'SUPERADMIN', 'BARBERO', 'barbero'].includes(role)) {
            return <Navigate to="/barbero/citas" replace />;
        } else {
            return <Navigate to="/cliente/citas" replace />;
        }
    }

    const features = [
        {
            icon: <Link2 size={22} />,
            title: 'Tu propio enlace',
            desc: 'Comparte jimbar.app/tu-barberia en redes y WhatsApp. Tu marca, tu página.',
        },
        {
            icon: <CalendarCheck size={22} />,
            title: 'Reservas automáticas',
            desc: 'Tus clientes ven horarios libres y reservan solos. Cero WhatsApp de ida y vuelta.',
        },
        {
            icon: <MapPin size={22} />,
            title: 'Dirección obligatoria',
            desc: 'A domicilio sin perderte. El cliente escribe su ubicación al reservar.',
        },
        {
            icon: <ShieldCheck size={22} />,
            title: 'Anti-spam inteligente',
            desc: 'Bloqueo automático de reservas falsas. Tu agenda siempre limpia.',
        },
        {
            icon: <Bell size={22} />,
            title: 'Notificaciones push',
            desc: 'Te avisa al instante de cada reserva nueva, cambio o cancelación.',
        },
        {
            icon: <Smartphone size={22} />,
            title: 'App instalable',
            desc: 'Funciona como app nativa en el celular. Sin tienda, sin descargas grandes.',
        },
    ];

    const steps = [
        { num: '01', title: 'Registra tu barbería', desc: 'Nombre, horarios y servicios. En 2 minutos estás listo.' },
        { num: '02', title: 'Comparte tu enlace', desc: 'Ponlo en tu bio de Instagram, WhatsApp o donde quieras.' },
        { num: '03', title: 'Recibe reservas', desc: 'Los clientes agendan solos. Tú solo confirmas o trabajas.' },
    ];

    return (
        <div className="lp">

            {/* ── NAV ──────────────────────────────────────── */}
            <nav className="lp-nav">
                <div className="lp-nav__inner">
                    <div className="lp-nav__brand">
                        <Scissors size={20} strokeWidth={2.5} />
                        <span>JIMBAR</span>
                    </div>
                    <div className="lp-nav__actions">
                        <button className="lp-nav__link" onClick={() => navigate('/login')}>
                            Iniciar sesión
                        </button>
                        <button className="lp-btn lp-btn--sm" onClick={() => navigate('/registro-barberia')}>
                            Registrarme
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── HERO ─────────────────────────────────────── */}
            <section className="lp-hero">
                <div className="lp-hero__glow" />
                <div className="lp-hero__content">
                    <div className="lp-hero__badge">
                        <span className="lp-pulse" />
                        15 días gratis — sin tarjeta
                    </div>

                    <h1 className="lp-hero__title">
                        Deja de perder clientes<br />
                        <span className="lp-gradient-text">por el desorden.</span>
                    </h1>

                    <p className="lp-hero__subtitle">
                        Jimbar le da a tu barbería su propia página de reservas.
                        Tus clientes agendan solos, tú solo cortas.
                    </p>

                    <div className="lp-hero__ctas">
                        {slugFromUrl && (
                            <button
                                className="lp-btn lp-btn--accent"
                                onClick={() => navigate(`/${slugFromUrl}/agendar`)}
                            >
                                Reservar ahora <ArrowRight size={18} />
                            </button>
                        )}
                        <button
                            className="lp-btn lp-btn--primary"
                            onClick={() => navigate('/registro-barberia')}
                        >
                            Empezar gratis <ArrowRight size={18} />
                        </button>
                        <button
                            className="lp-btn lp-btn--ghost"
                            onClick={() => navigate('/login')}
                        >
                            Ya tengo cuenta
                        </button>
                    </div>

                    {canInstall && (
                        <button className="lp-install-btn" onClick={triggerInstall}>
                            <Download size={16} /> Instalar app
                        </button>
                    )}
                </div>

                {/* Mockup del teléfono */}
                <div className="lp-hero__mockup">
                    <div className="lp-phone">
                        <div className="lp-phone__notch" />
                        <div className="lp-phone__screen">
                            <div className="lp-phone__header">
                                <Scissors size={14} style={{ color: 'var(--accent)' }} />
                                <span>Tu Barbería</span>
                            </div>
                            <div className="lp-phone__card">
                                <div style={{ fontSize: '0.65rem', color: '#888', marginBottom: '6px' }}>Próxima reserva</div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>Corte + Barba</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '4px' }}>Hoy, 3:00 PM</div>
                            </div>
                            <div className="lp-phone__slots">
                                {['10:00', '10:30', '11:00', '11:30'].map(h => (
                                    <div key={h} className={`lp-phone__slot ${h === '10:30' ? 'lp-phone__slot--active' : ''}`}>
                                        {h}
                                    </div>
                                ))}
                            </div>
                            <div className="lp-phone__btn">Confirmar reserva</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SOCIAL PROOF (números) ───────────────────── */}
            <section className="lp-proof">
                <div className="lp-proof__inner">
                    {[
                        { value: '50', suffix: '+', label: 'Barberos activos' },
                        { value: '2000', suffix: '+', label: 'Reservas creadas' },
                        { value: '4', suffix: '.9', label: 'Satisfacción' },
                    ].map((stat, i) => (
                        <div key={i} className="lp-proof__stat">
                            <div className="lp-proof__number">
                                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                            </div>
                            <div className="lp-proof__label">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES ─────────────────────────────────── */}
            <section className="lp-features">
                <div className="lp-section-header">
                    <span className="lp-section-tag">Funcionalidades</span>
                    <h2 className="lp-section-title">Todo lo que necesitas,<br />nada que te sobre.</h2>
                </div>
                <div className="lp-features__grid">
                    {features.map((f, i) => (
                        <div key={i} className="lp-feature-card">
                            <div className="lp-feature-card__icon">{f.icon}</div>
                            <h3 className="lp-feature-card__title">{f.title}</h3>
                            <p className="lp-feature-card__desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CÓMO FUNCIONA ────────────────────────────── */}
            <section className="lp-steps">
                <div className="lp-section-header">
                    <span className="lp-section-tag">Cómo funciona</span>
                    <h2 className="lp-section-title">Activo en 3 pasos.</h2>
                </div>
                <div className="lp-steps__list">
                    {steps.map((s, i) => (
                        <div key={i} className="lp-step">
                            <div className="lp-step__num">{s.num}</div>
                            <div className="lp-step__content">
                                <h3 className="lp-step__title">{s.title}</h3>
                                <p className="lp-step__desc">{s.desc}</p>
                            </div>
                            {i < steps.length - 1 && <div className="lp-step__line" />}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── TESTIMONIOS ──────────────────────────────── */}
            <section className="lp-testimonials">
                <div className="lp-section-header">
                    <span className="lp-section-tag">Testimonios</span>
                    <h2 className="lp-section-title">Lo que dicen los barberos.</h2>
                </div>
                <div className="lp-testimonials__grid">
                    {[
                        {
                            name: 'Carlos M.',
                            role: 'Barbero a domicilio',
                            text: 'Antes perdía 1 hora al día solo contestando mensajes de WhatsApp para agendar. Ahora los clientes reservan solos.',
                            stars: 5,
                        },
                        {
                            name: 'Diego R.',
                            role: 'Dueño de barbería',
                            text: 'El enlace personalizado me da una imagen mucho más profesional. Lo puse en mi Instagram y las reservas se duplicaron.',
                            stars: 5,
                        },
                        {
                            name: 'Andrés L.',
                            role: 'Barbero independiente',
                            text: 'La notificación push es brutal. Me llega al celular al instante cuando alguien reserva. No se me escapa ninguna cita.',
                            stars: 5,
                        },
                    ].map((t, i) => (
                        <div key={i} className="lp-testimonial">
                            <div className="lp-testimonial__stars">
                                {Array.from({ length: t.stars }).map((_, j) => (
                                    <Star key={j} size={14} fill="var(--accent)" color="var(--accent)" />
                                ))}
                            </div>
                            <p className="lp-testimonial__text">"{t.text}"</p>
                            <div className="lp-testimonial__author">
                                <div className="lp-testimonial__avatar">{t.name[0]}</div>
                                <div>
                                    <div className="lp-testimonial__name">{t.name}</div>
                                    <div className="lp-testimonial__role">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA FINAL ────────────────────────────────── */}
            <section className="lp-cta-final">
                <div className="lp-cta-final__glow" />
                <h2 className="lp-cta-final__title">
                    ¿Listo para profesionalizar<br />tu barbería?
                </h2>
                <p className="lp-cta-final__subtitle">
                    Empieza gratis. Sin tarjeta de crédito. Configúralo en 2 minutos.
                </p>
                <button
                    className="lp-btn lp-btn--primary lp-btn--lg"
                    onClick={() => navigate('/registro-barberia')}
                >
                    Crear mi barbería gratis <ArrowRight size={20} />
                </button>
            </section>

            {/* ── FOOTER ───────────────────────────────────── */}
            <footer className="lp-footer">
                <div className="lp-footer__inner">
                    <div className="lp-footer__brand">
                        <Scissors size={18} />
                        <span>JIMBAR</span>
                    </div>
                    <p className="lp-footer__copy">
                        © {new Date().getFullYear()} Jimbar Software. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
