/**
 * MiBarberiaPage.jsx — Panel de configuración del perfil del Tenant.
 * Solo accesible para BARBERIA_ADMIN o SUPERADMIN.
 * GET/PATCH /api/mi-barberia/
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Save, ArrowLeft, ExternalLink, Upload } from 'lucide-react';

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
                    logo: null,
                    imagen_portada: null,
                    telefono: data.telefono || '',
                    email: data.email || '',
                    direccion: data.direccion || '',
                    hora_apertura_semana: data.hora_apertura_semana || '09:00:00',
                    hora_cierre_semana: data.hora_cierre_semana || '19:00:00',
                    abre_fines_de_semana: data.abre_fines_de_semana ?? true,
                    hora_apertura_finde: data.hora_apertura_finde || '10:00:00',
                    hora_cierre_finde: data.hora_cierre_finde || '14:00:00',
                });
            })
            .catch(() => setError('No se pudo cargar la información de tu barbería.'))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        const { name, value, files, type, checked } = e.target;
        if (type === 'file' && files) {
            setForm(prev => ({ ...prev, [name]: files[0] }));
        } else if (type === 'checkbox') {
            setForm(prev => ({ ...prev, [name]: checked }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
        if (success) setSuccess('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        Object.keys(form).forEach(key => {
            const val = form[key];
            if (val !== null && val !== undefined) {
                // Solo enviar si es un File nuevo
                if (val instanceof File) {
                    formData.append(key, val);
                } else if (typeof val === 'boolean') {
                    formData.append(key, val);
                } else if (!['logo', 'imagen_portada'].includes(key)) {
                    // texto normal (no URLs de imagen vacias)
                    formData.append(key, val);
                }
            }
        });

        try {
            const { data } = await api.patch('/mi-barberia/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setBarberia(data);
            setSuccess('¡Cambios guardados exitosamente!');
        } catch (err) {
            const d = err.response?.data;
            if (err.response?.status === 500 || (typeof d === 'string' && d.includes('<!DOCTYPE html>'))) {
                setError('Error del servidor (500). Verifica la configuración de Cloudinary o intenta más tarde.');
            } else if (d && typeof d === 'object') {
                const msg = Object.values(d).flat().join(' ');
                setError(msg || 'Error al guardar. Verifica los datos.');
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
                            Imágenes (Automático en Cloudinary)
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Logo de la Barbería</label>
                                {barberia?.logo_url && (
                                    <div style={{ marginBottom: 10 }}>
                                        <img src={barberia.logo_url} alt="Logo" style={{ width: 100, borderRadius: 8, border: '1px solid #333', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <label style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                    background: 'var(--bg-surface)', border: '1px dashed var(--border)',
                                    padding: '12px 20px', borderRadius: '8px',
                                    color: 'var(--text-secondary)', transition: 'all 0.2s'
                                }}>
                                    <Upload size={18} />
                                    <span>{form.logo instanceof File ? form.logo.name : "Subir nuevo logo..."}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        name="logo"
                                        onChange={handleChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Imagen de Portada</label>
                                {barberia?.imagen_portada_url && (
                                    <div style={{ marginBottom: 10 }}>
                                        <img src={barberia.imagen_portada_url} alt="Portada" style={{ width: '100%', maxWidth: 280, borderRadius: 8, border: '1px solid #333', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <label style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                    background: 'var(--bg-surface)', border: '1px dashed var(--border)',
                                    padding: '12px 20px', borderRadius: '8px',
                                    color: 'var(--text-secondary)', transition: 'all 0.2s'
                                }}>
                                    <Upload size={18} />
                                    <span>{form.imagen_portada instanceof File ? form.imagen_portada.name : "Subir nueva portada..."}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        name="imagen_portada"
                                        onChange={handleChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Bloque: Horarios */}
                    <div style={{ padding: '24px', background: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px', fontWeight: 600 }}>
                            Horarios de Atención
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Hora Apertura (Lunes a Viernes)</label>
                                    <input className="form-input" type="time" name="hora_apertura_semana" value={form.hora_apertura_semana || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Hora Cierre (Lunes a Viernes)</label>
                                    <input className="form-input" type="time" name="hora_cierre_semana" value={form.hora_cierre_semana || ''} onChange={handleChange} />
                                </div>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                <input type="checkbox" name="abre_fines_de_semana" checked={form.abre_fines_de_semana || false} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
                                <strong>¿Abres Fines de Semana? (Sábados y Domingos)</strong>
                            </label>

                            {form.abre_fines_de_semana && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px', paddingLeft: '28px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Hora Apertura (Finde)</label>
                                        <input className="form-input" type="time" name="hora_apertura_finde" value={form.hora_apertura_finde || ''} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Hora Cierre (Finde)</label>
                                        <input className="form-input" type="time" name="hora_cierre_finde" value={form.hora_cierre_finde || ''} onChange={handleChange} />
                                    </div>
                                </div>
                            )}
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
