/**
 * CitasPage.jsx — Panel principal del barbero.
 * Lista las citas con filtros por estado, y permite confirmar/rechazar.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { getCitas, cambiarEstadoCita, bloquearDia, getBloqueos, desbloquearDia } from '../../services/citasService';
import { useAuth } from '../../context/AuthContext';

dayjs.locale('es');

const ESTADOS = [
    { valor: '', label: 'Todas' },
    { valor: 'PENDIENTE', label: 'Pendientes' },
    { valor: 'CONFIRMADA', label: 'Confirmadas' },
    { valor: 'RECHAZADA', label: 'Rechazadas' },
    { valor: 'CANCELADA', label: 'Canceladas' },
    { valor: 'COMPLETADA', label: 'Completadas' },
];

export default function CitasPage() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [citas, setCitas] = useState([]);
    const [filtroEstado, setFiltroEstado] = useState('PENDIENTE');
    const [loading, setLoading] = useState(true);
    const [accionando, setAccionando] = useState(null); // id de cita en proceso

    const cargarCitas = useCallback(async () => {
        setLoading(true);
        try {
            const filtros = filtroEstado ? { estado: filtroEstado } : {};
            const data = await getCitas(filtros);
            setCitas(data);
        } finally {
            setLoading(false);
        }
    }, [filtroEstado]);

    useEffect(() => { cargarCitas(); }, [cargarCitas]);

    const cambiarEstado = async (citaId, nuevoEstado) => {
        setAccionando(citaId);
        try {
            await cambiarEstadoCita(citaId, nuevoEstado);
            await cargarCitas();
        } catch {
            alert('Error al cambiar el estado. Intenta de nuevo.');
        } finally {
            setAccionando(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/barbero/login');
    };

    return (
        <div style={{ minHeight: '100dvh', paddingBottom: '40px' }}>
            {/* Header */}
            <header style={{
                borderBottom: '1px solid var(--border)',
                padding: '16px 0',
                marginBottom: '24px',
                position: 'sticky',
                top: 0,
                background: 'var(--bg-base)',
                zIndex: 10,
            }}>
                <div className="container--wide" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>
                        JIMBAR
                    </span>
                    <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
                        Salir
                    </button>
                </div>
            </header>

            <div className="container--wide">
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ marginBottom: '4px' }}>Citas</h1>
                    <p>Gestiona las solicitudes de tus clientes.</p>
                </div>

                {/* Filtros por estado */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '4px',
                    marginBottom: '24px',
                }}>
                    {ESTADOS.map((e) => (
                        <button
                            key={e.valor}
                            onClick={() => setFiltroEstado(e.valor)}
                            style={{
                                padding: '6px 16px',
                                borderRadius: 'var(--radius-full)',
                                border: `1px solid ${filtroEstado === e.valor ? 'var(--accent)' : 'var(--border)'}`,
                                background: filtroEstado === e.valor ? 'var(--accent-muted)' : 'transparent',
                                color: filtroEstado === e.valor ? 'var(--accent)' : 'var(--text-secondary)',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {e.label}
                        </button>
                    ))}
                </div>

                {/* Lista de citas */}
                {loading ? (
                    <div className="loading-center"><div className="spinner" /></div>
                ) : citas.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No hay citas en este estado.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {citas.map((cita) => (
                            <TarjetaCita
                                key={cita.id}
                                cita={cita}
                                onConfirmar={() => cambiarEstado(cita.id, 'CONFIRMADA')}
                                onRechazar={() => cambiarEstado(cita.id, 'RECHAZADA')}
                                onCompletar={() => cambiarEstado(cita.id, 'COMPLETADA')}
                                cargando={accionando === cita.id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function TarjetaCita({ cita, onConfirmar, onRechazar, onCompletar, cargando }) {
    const fecha = dayjs(cita.fecha).format('ddd D [de] MMMM');
    const badgeClass = `badge badge--${cita.estado.toLowerCase()}`;

    return (
        <div className="card" style={{ opacity: cargando ? 0.6 : 1 }}>
            {/* Encabezado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                    <h3 style={{ marginBottom: '2px' }}>{cita.cliente_nombre}</h3>
                    <span className="text-sm text-muted" style={{ textTransform: 'capitalize' }}>
                        {fecha} · {cita.hora_inicio}
                    </span>
                </div>
                <span className={badgeClass}>{cita.estado_display}</span>
            </div>

            {/* Detalle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                <span className="text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Servicio: </span>
                    {cita.servicio_nombre} — <strong style={{ color: 'var(--accent)' }}>${cita.servicio_precio?.toLocaleString()}</strong>
                </span>
                <span className="text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Dirección: </span>
                    {cita.cliente_direccion}
                </span>
                <span className="text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Teléfono: </span>
                    <a href={`tel:${cita.cliente_telefono}`}>{cita.cliente_telefono}</a>
                </span>
                {cita.notas && (
                    <span className="text-sm">
                        <span style={{ color: 'var(--text-muted)' }}>Notas: </span>
                        {cita.notas}
                    </span>
                )}
            </div>

            {/* Acciones según estado */}
            {cita.estado === 'PENDIENTE' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="btn btn--primary btn--sm"
                        onClick={onConfirmar}
                        disabled={cargando}
                        style={{ flex: 1 }}
                    >
                        ✓ Confirmar
                    </button>
                    <button
                        className="btn btn--danger btn--sm"
                        onClick={onRechazar}
                        disabled={cargando}
                        style={{ flex: 1 }}
                    >
                        ✕ Rechazar
                    </button>
                </div>
            )}
            {cita.estado === 'CONFIRMADA' && (
                <button
                    className="btn btn--secondary btn--sm"
                    onClick={onCompletar}
                    disabled={cargando}
                >
                    Marcar como completada
                </button>
            )}
        </div>
    );
}
