/**
 * PasoServicio.jsx — Paso 1: El cliente elige qué servicio quiere.
 */
import { useState, useEffect } from 'react';
import { getServicios } from '../../services/citasService';

export default function PasoServicio({ slug, onSiguiente }) {
    const [servicios, setServicios] = useState([]);
    const [seleccionado, setSeleccionado] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        getServicios(slug || 'jimbar') // Fallback para dev local sin tenant
            .then(setServicios)
            .catch(() => setError('No se pudieron cargar los servicios. Intenta de nuevo.'))
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) return (
        <div className="loading-center">
            <div className="spinner" />
        </div>
    );

    if (error) return <div className="alert alert--error">{error}</div>;

    return (
        <div>
            <h1 style={{ marginBottom: '6px' }}>Elige tu servicio</h1>
            <p style={{ marginBottom: '28px' }}>Selecciona el servicio que deseas agendar.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                {servicios.map((s) => (
                    <div
                        key={s.id}
                        className={`card card--clickable ${seleccionado?.id === s.id ? 'card--selected' : ''}`}
                        onClick={() => setSeleccionado(s)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSeleccionado(s)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ marginBottom: '4px', color: 'var(--text-primary)' }}>{s.nombre}</h3>
                                <span className="text-sm text-muted">{s.duracion_minutos} min</span>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                                <span style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    color: seleccionado?.id === s.id ? 'var(--accent)' : 'var(--text-primary)',
                                }}>
                                    {s.precio_formateado}
                                </span>
                            </div>
                        </div>

                        {/* Radio visual */}
                        <div style={{
                            marginTop: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}>
                            <div style={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                border: `2px solid ${seleccionado?.id === s.id ? 'var(--accent)' : 'var(--border)'}`,
                                background: seleccionado?.id === s.id ? 'var(--accent)' : 'transparent',
                                transition: 'all 0.2s ease',
                                flexShrink: 0,
                            }} />
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                {seleccionado?.id === s.id ? 'Seleccionado' : 'Seleccionar'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <button
                className="btn btn--primary"
                disabled={!seleccionado}
                onClick={() => onSiguiente(seleccionado)}
            >
                Continuar →
            </button>
        </div>
    );
}
