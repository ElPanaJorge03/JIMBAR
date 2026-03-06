/**
 * MiBarberiaPage.jsx — Panel de configuración del perfil del Tenant.
 * Solo accesible para BARBERIA_ADMIN o SUPERADMIN.
 * GET/PATCH /api/mi-barberia/
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Save, ArrowLeft, ExternalLink } from 'lucide-react';

const BADGE_COLORES = {
    TRIAL: { bg: 'rgba(162,112,53,0.15)', color: '#c89b5a', label: 'Trial' },
    ACTIVO: { bg: 'rgba(76,175,125,0.15)', color: 'var(--success)', label: 'Activo' },
    GRACIA: { bg: 'rgba(255,165,0,0.15)', color: '#ffa726', label: 'Período Gracia' },
    SUSPENDIDO: { bg: 'rgba(239,83,80,0.15)', color: 'var(--danger)', label: 'Suspendido' },
};

export default function MiBarberiaPage() {
    const navigate = useNavigate();
    const [barberia, setBarberia] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState({});

    useEffect(() => {
        api.get('/mi-barberia/')
            .then(({ data }) => {
                setBarberia(data);
                setForm({
                    nombre: data.nombre || '',
                    descripcion: data.descripcion || '',
                    logo: data.logo || '',
                    imagen_portada: data.imagen_portada || '',
                    telefono: data.telefono || '',
                    email: data.email || '',
                    direccion: data.direccion || '',
                });
            })
            .catch(() => setError('No se pudo cargar la información de tu barbería.'))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (success) setSuccess('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const { data } = await api.patch('/mi-barberia/', form);
            setBarberia(data);
            setSuccess('¡Cambios guardados exitosamente!');
        } catch (err) {
            const d = err.response?.data;
            if (d) {
                const msg = Object.values(d).flat().join(' ');
                setError(msg);
            } else {
                setError('Error al guardar. Intenta de nuevo.');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading-center"><div className="spinner" /></div>;
    }

    const badge = BADGE_COLORES[barberia?.suscripcion_estado] || BADGE_COLORES.TRIAL;

    return (
        <div style={{ minHeight: '100dvh', background: '#050505', paddingBottom: '60px' }}>

            {/* Header */}
            <header style={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                padding: '20px 0',
                background: '#0a0a0a',
                position: 'sticky',
                top: 0,
                zIndex: 10,
            }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        className="btn btn--ghost"
                        onClick={() => navigate('/barbero/citas')}
                        style={{ padding: '0 8px' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Mi Barbería</h2>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#777' }}>Configura tu perfil público</p>
                    </div>
                </div>
            </header>

            <div className="container" style={{ paddingTop: '32px', maxWidth: '640px' }}>

                {/* Card de Suscripción */}
                {barberia?.suscripcion_estado && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px 20px',
                        background: badge.bg,
                        border: `1px solid ${badge.color}30`,
                        borderRadius: '12px',
                        marginBottom: '24px',
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
                                Estado de suscripción
                            </div>
                            <div style={{ fontWeight: 600, color: badge.color, fontSize: '1rem' }}>
                                {badge.label}
                                {barberia.suscripcion_estado === 'TRIAL' && barberia.suscripcion_trial_hasta && (
                                    <span style={{ marginLeft: '8px', fontWeight: 400, color: '#aaa', fontSize: '0.85rem' }}>
                                        · vence el {barberia.suscripcion_trial_hasta}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Enlace público */}
                {barberia?.slug && (
                    <a
                        href={`/${barberia.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '14px 20px',
                            background: '#111',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '12px',
                            marginBottom: '24px',
                            textDecoration: 'none',
                            color: 'inherit',
                        }}
                    >
                        <ExternalLink size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '2px' }}>Tu enlace público</div>
                            <div style={{ color: 'var(--accent)', fontWeight: 500, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {window.location.origin}/{barberia.slug}
                            </div>
                        </div>
                    </a>
                )}

                {/* Formulario de Edición */}
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Bloque: Identidad */}
                    <div style={{ padding: '24px', background: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px', fontWeight: 600 }}>
                            Identidad
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Nombre de la Barbería</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    placeholder="Ej: Cortes El Brayan"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descripción</label>
                                <textarea
                                    className="form-input"
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Cuéntales a tus clientes de qué trata tu barbería..."
                                    style={{ resize: 'none', paddingTop: '12px' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bloque: Imágenes */}
                    <div style={{ padding: '24px', background: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px', fontWeight: 600 }}>
                            Imágenes
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">URL del Logo</label>
                                <input
                                    className="form-input"
                                    type="url"
                                    name="logo"
                                    value={form.logo}
                                    onChange={handleChange}
                                    placeholder="https://tuenlace.com/logo.png"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">URL de Imagen de Portada</label>
                                <input
                                    className="form-input"
                                    type="url"
                                    name="imagen_portada"
                                    value={form.imagen_portada}
                                    onChange={handleChange}
                                    placeholder="https://tuenlace.com/portada.jpg"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bloque: Contacto */}
                    <div style={{ padding: '24px', background: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px', fontWeight: 600 }}>
                            Contacto
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Teléfono / WhatsApp</label>
                                <input
                                    className="form-input"
                                    type="tel"
                                    name="telefono"
                                    value={form.telefono}
                                    onChange={handleChange}
                                    placeholder="300 000 0000"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Correo de contacto</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="hola@tubarberia.com"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Zona de cobertura / Dirección</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    name="direccion"
                                    value={form.direccion}
                                    onChange={handleChange}
                                    placeholder="Ej: Soledad, Atlántico"
                                />
                            </div>
                        </div>
                    </div>

                    {error && <div className="alert alert--error">{error}</div>}
                    {success && <div className="alert alert--success">{success}</div>}

                    <button
                        type="submit"
                        className="btn btn--primary"
                        disabled={saving}
                        style={{ minHeight: '52px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {saving ? (
                            <><div className="spinner" style={{ width: 18, height: 18 }} /> Guardando...</>
                        ) : (
                            <><Save size={18} /> Guardar Cambios</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
