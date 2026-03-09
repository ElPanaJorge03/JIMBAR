/**
 * PasoServicio.jsx — Paso 1: El cliente elige qué servicio quiere.
 */
import { useState, useEffect } from 'react';
import { getServicios } from '../../services/citasService';
import { Scissors, User, Star, ScissorsIcon, Check } from 'lucide-react';

const IconsMap = {
    scissors: Scissors,
    user: User,
    star: Star,
    beard: User,
};

export default function PasoServicio({ slug, seleccion = [], onSiguiente }) {
    const [servicios, setServicios] = useState([]);
    const [seleccionados, setSeleccionados] = useState(seleccion);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        getServicios(slug || 'jimbar') // Fallback para dev local sin tenant
            .then(setServicios)
            .catch(() => setError('El sistema se está encendiendo. Espere un momento e intente actualizar la página.'))
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) return (
        <div className="loading-center">
            <div className="spinner" />
        </div>
    );

    if (error) return <div className="alert alert--error">{error}</div>;

    const toggleSelection = (s) => {
        setSeleccionados(prev => {
            const existe = prev.find(item => item.id === s.id);
            if (existe) {
                return prev.filter(item => item.id !== s.id);
            } else {
                return [...prev, s];
            }
        });
    };

    const totalCalculado = seleccionados.reduce((acc, curr) => acc + curr.precio, 0);

    return (
        <div>
            <h1 style={{ marginBottom: '6px' }}>Elige tus servicios</h1>
            <p style={{ marginBottom: '28px' }}>Selecciona uno o más servicios que deseas agendar.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                {servicios.map((s) => {
                    const isSelected = seleccionados.some(item => item.id === s.id);
                    const IconComponent = IconsMap[s.icono?.toLowerCase()] || ScissorsIcon;

                    return (
                        <div
                            key={s.id}
                            className={`card card--clickable ${isSelected ? 'card--selected' : ''}`}
                            onClick={() => toggleSelection(s)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && toggleSelection(s)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: '10px',
                                        background: isSelected ? 'var(--accent)' : '#111',
                                        color: isSelected ? '#000' : 'var(--text-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <IconComponent size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ marginBottom: '4px', color: 'var(--text-primary)' }}>{s.nombre}</h3>
                                        <span className="text-sm text-muted">{s.duracion_minutos} min</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                                    <span style={{
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                                    }}>
                                        {s.precio_formateado}
                                    </span>
                                </div>
                            </div>

                            {/* Checkbox visual */}
                            <div style={{
                                marginTop: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <div style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: '4px',
                                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                                    background: isSelected ? 'var(--accent)' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    flexShrink: 0,
                                }}>
                                    {isSelected && <Check size={12} color="#000" strokeWidth={3} />}
                                </div>
                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                    {isSelected ? 'Seleccionado' : 'Seleccionar'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px', background: '#111', borderRadius: '12px', marginBottom: '24px'
            }}>
                <span style={{ color: 'var(--text-muted)' }}>Total estimado</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>
                    ${totalCalculado.toLocaleString()}
                </span>
            </div>

            <button
                className="btn btn--primary"
                disabled={seleccionados.length === 0}
                onClick={() => onSiguiente(seleccionados)}
            >
                Continuar →
            </button>
        </div>
    );
}
