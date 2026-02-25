/**
 * PasoFechaHora.jsx — Paso 2: El cliente elige fecha y slot de hora disponible.
 *
 * Primero muestra un selector de fecha (calendario simple).
 * Cuando elige una fecha, consulta la API de disponibilidad y muestra los slots.
 */
import { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { getDisponibilidad } from '../../services/citasService';

dayjs.locale('es');

export default function PasoFechaHora({ servicio, onSiguiente, onAnterior }) {
    const [fecha, setFecha] = useState('');
    const [slots, setSlots] = useState([]);
    const [slotSeleccionado, setSlotSeleccionado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mensajeDia, setMensajeDia] = useState('');

    // Fecha mínima: hoy
    const hoy = dayjs().format('YYYY-MM-DD');

    const handleFechaChange = async (e) => {
        const nuevaFecha = e.target.value;
        setFecha(nuevaFecha);
        setSlotSeleccionado(null);
        setSlots([]);
        setError('');
        setMensajeDia('');

        if (!nuevaFecha) return;

        setLoading(true);
        try {
            const data = await getDisponibilidad(nuevaFecha, servicio.id);

            if (!data.disponible) {
                setMensajeDia(data.motivo || 'No hay disponibilidad para ese día.');
            } else if (data.slots.length === 0) {
                setMensajeDia('No quedan horarios para ese día. Prueba con otra fecha.');
            } else {
                setSlots(data.slots);
            }
        } catch {
            setError('Error consultando disponibilidad. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const fechaFormateada = fecha
        ? dayjs(fecha).format('dddd, D [de] MMMM')
        : '';

    return (
        <div>
            <h1 style={{ marginBottom: '6px' }}>Elige fecha y hora</h1>
            <p style={{ marginBottom: '4px' }}>
                Servicio: <strong style={{ color: 'var(--text-primary)' }}>{servicio.nombre}</strong>
            </p>
            <p style={{ marginBottom: '28px' }}>
                Duración: <strong style={{ color: 'var(--text-primary)' }}>{servicio.duracion_minutos} min</strong>
            </p>

            {/* Selector de fecha */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Selecciona una fecha</label>
                <input
                    type="date"
                    className="form-input"
                    value={fecha}
                    min={hoy}
                    onChange={handleFechaChange}
                    style={{ colorScheme: 'dark' }}
                />
                {fechaFormateada && (
                    <span className="text-sm text-muted" style={{ textTransform: 'capitalize' }}>
                        {fechaFormateada}
                    </span>
                )}
            </div>

            {/* Estado de carga */}
            {loading && (
                <div className="loading-center" style={{ padding: '24px' }}>
                    <div className="spinner" />
                </div>
            )}

            {/* Mensaje si el día no tiene slots */}
            {!loading && mensajeDia && (
                <div className="alert alert--info" style={{ marginBottom: '24px' }}>
                    {mensajeDia}
                </div>
            )}

            {/* Error técnico */}
            {error && <div className="alert alert--error" style={{ marginBottom: '24px' }}>{error}</div>}

            {/* Grid de slots disponibles */}
            {!loading && slots.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                    <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>
                        Horarios disponibles
                    </label>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '10px',
                    }}>
                        {slots.map((slot) => (
                            <button
                                key={slot.hora_inicio}
                                onClick={() => setSlotSeleccionado(slot)}
                                style={{
                                    background: slotSeleccionado?.hora_inicio === slot.hora_inicio
                                        ? 'var(--accent)'
                                        : 'var(--bg-elevated)',
                                    color: slotSeleccionado?.hora_inicio === slot.hora_inicio
                                        ? '#0a0a0a'
                                        : 'var(--text-primary)',
                                    border: `1px solid ${slotSeleccionado?.hora_inicio === slot.hora_inicio ? 'var(--accent)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    padding: '10px 6px',
                                    fontSize: '0.9375rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'center',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {slot.hora_inicio}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Navegación */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                    className="btn btn--primary"
                    disabled={!slotSeleccionado}
                    onClick={() => onSiguiente(fecha, slotSeleccionado)}
                >
                    Continuar →
                </button>
                <button className="btn btn--secondary" onClick={onAnterior}>
                    ← Volver
                </button>
            </div>
        </div>
    );
}
