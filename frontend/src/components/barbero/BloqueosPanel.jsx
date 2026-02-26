/**
 * BloqueosPanel.jsx — Sección para bloquear y desbloquear días.
 * El barbero puede bloquear un día completo (vacaciones, compromisos, etc.)
 * y los clientes no verán ese día como disponible al intentar agendar.
 */
import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { Ban, CalendarX } from 'lucide-react';
import { getBloqueos, bloquearDia, desbloquearDia } from '../../services/citasService';

dayjs.locale('es');

export default function BloqueosPanel() {
    const [bloqueos, setBloqueos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ fecha: '', motivo: '' });
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    const hoy = dayjs().format('YYYY-MM-DD');

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getBloqueos();
            // Ordenar por fecha ascendente y mostrar solo los futuros + hoy
            const futuros = data
                .filter(b => b.fecha >= hoy)
                .sort((a, b) => a.fecha.localeCompare(b.fecha));
            setBloqueos(futuros);
        } finally {
            setLoading(false);
        }
    }, [hoy]);

    useEffect(() => { cargar(); }, [cargar]);

    const handleBloquear = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.fecha) {
            setError('Selecciona una fecha para bloquear.');
            return;
        }

        if (form.fecha < hoy) {
            setError('No puedes bloquear una fecha pasada.');
            return;
        }

        setGuardando(true);
        try {
            await bloquearDia(form.fecha, form.motivo);
            setForm({ fecha: '', motivo: '' });
            await cargar();
        } catch (err) {
            const data = err.response?.data;
            if (data?.fecha) {
                setError('Ese día ya está bloqueado.');
            } else {
                setError('Error al bloquear el día. Intenta de nuevo.');
            }
        } finally {
            setGuardando(false);
        }
    };

    const handleDesbloquear = async (id, fecha) => {
        if (!confirm(`¿Desbloquear el ${dayjs(fecha).format('dddd D [de] MMMM')}?`)) return;
        try {
            await desbloquearDia(id);
            await cargar();
        } catch {
            alert('Error al desbloquear el día.');
        }
    };

    return (
        <div>
            {/* ── Formulario para bloquear ─────────────────── */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '4px' }}>Bloquear un día</h3>
                <p className="text-sm" style={{ marginBottom: '20px' }}>
                    Los clientes no podrán agendar en días bloqueados.
                </p>

                <form onSubmit={handleBloquear} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="form-group">
                        <label className="form-label">Fecha a bloquear</label>
                        <input
                            type="date"
                            className="form-input"
                            value={form.fecha}
                            min={hoy}
                            onChange={(e) => setForm(p => ({ ...p, fecha: e.target.value }))}
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Motivo <span style={{ color: 'var(--text-muted)' }}>(opcional)</span></label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.motivo}
                            onChange={(e) => setForm(p => ({ ...p, motivo: e.target.value }))}
                            placeholder="Vacaciones, cita médica, etc."
                            maxLength={200}
                        />
                    </div>

                    {error && <div className="alert alert--error">{error}</div>}

                    <button
                        type="submit"
                        className="btn btn--danger"
                        disabled={guardando || !form.fecha}
                        style={{ width: 'auto', alignSelf: 'flex-start', minWidth: '160px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        {guardando
                            ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Bloqueando...</>
                            : <><Ban size={15} /> Bloquear día</>
                        }
                    </button>
                </form>
            </div>

            {/* ── Lista de días bloqueados ─────────────────── */}
            <div>
                <h3 style={{ marginBottom: '16px' }}>
                    Días bloqueados
                    {bloqueos.length > 0 && (
                        <span style={{
                            marginLeft: '10px',
                            fontSize: '0.8rem',
                            fontWeight: 400,
                            color: 'var(--text-muted)',
                        }}>
                            ({bloqueos.length})
                        </span>
                    )}
                </h3>

                {loading ? (
                    <div className="loading-center"><div className="spinner" /></div>
                ) : bloqueos.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 24px',
                        border: '1px dashed var(--border)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>
                            No hay días bloqueados próximamente.
                        </p>
                        <p className="text-sm text-muted">
                            Usa el formulario de arriba para bloquear días que no puedas atender.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {bloqueos.map((b) => {
                            const fecha = dayjs(b.fecha);
                            const esHoy = b.fecha === hoy;
                            return (
                                <div key={b.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px',
                                    padding: '14px 16px',
                                    background: 'var(--bg-surface)',
                                    border: `1px solid ${esHoy ? 'var(--warning)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-md)',
                                }}>
                                    <div>
                                        <div style={{
                                            fontWeight: 500,
                                            color: 'var(--text-primary)',
                                            fontSize: '0.9375rem',
                                            textTransform: 'capitalize',
                                        }}>
                                            {fecha.format('dddd D [de] MMMM [de] YYYY')}
                                            {esHoy && (
                                                <span style={{
                                                    marginLeft: '8px',
                                                    fontSize: '0.7rem',
                                                    background: 'rgba(224,168,76,0.15)',
                                                    color: 'var(--warning)',
                                                    padding: '2px 6px',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontWeight: 500,
                                                }}>Hoy</span>
                                            )}
                                        </div>
                                        {b.motivo && (
                                            <div className="text-sm text-muted" style={{ marginTop: '2px' }}>
                                                {b.motivo}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleDesbloquear(b.id, b.fecha)}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: 'var(--text-muted)',
                                            padding: '6px 12px',
                                            fontSize: '0.8125rem',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.2s ease',
                                            flexShrink: 0,
                                        }}
                                        onMouseEnter={e => {
                                            e.target.style.borderColor = 'var(--error)';
                                            e.target.style.color = 'var(--error)';
                                        }}
                                        onMouseLeave={e => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.color = 'var(--text-muted)';
                                        }}
                                    >
                                        Desbloquear
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
