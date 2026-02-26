/**
 * CitasPage.jsx — Panel principal del barbero.
 * Tiene dos pestañas: Citas y Bloqueos.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
    ClipboardList, CalendarOff,
    CheckCircle, XCircle, CheckSquare,
    Phone, MapPin, FileText, Scissors,
    LogOut,
} from 'lucide-react';
import { getCitas, cambiarEstadoCita } from '../../services/citasService';
import { useAuth } from '../../context/AuthContext';
import BloqueosPanel from '../../components/barbero/BloqueosPanel';

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
    const [pesta, setPesta] = useState('citas'); // 'citas' | 'bloqueos'

    const handleLogout = () => {
        logout();
        navigate('/barbero/login');
    };

    return (
        <div style={{ minHeight: '100dvh', paddingBottom: '40px' }}>
            {/* ── Header ─────────────────────────────────── */}
            <header style={{
                borderBottom: '1px solid var(--border)',
                padding: '14px 0',
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
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <LogOut size={15} /> Salir
                    </button>
                </div>
            </header>

            <div className="container--wide">
                {/* ── Pestañas de navegación ─────────────────── */}
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '28px',
                    background: 'var(--bg-elevated)',
                    padding: '4px',
                    borderRadius: 'var(--radius-md)',
                    width: 'fit-content',
                }}>
                    {[
                        { id: 'citas', icon: <ClipboardList size={15} />, label: 'Citas' },
                        { id: 'bloqueos', icon: <CalendarOff size={15} />, label: 'Bloqueos' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setPesta(tab.id)}
                            style={{
                                padding: '8px 18px',
                                borderRadius: 'calc(var(--radius-md) - 2px)',
                                border: 'none',
                                background: pesta === tab.id ? 'var(--accent)' : 'transparent',
                                color: pesta === tab.id ? '#0a0a0a' : 'var(--text-secondary)',
                                fontWeight: pesta === tab.id ? 600 : 400,
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Contenido de la pestaña activa ──────────── */}
                <div className="fade-in" key={pesta}>
                    {pesta === 'citas' && <PanelCitas />}
                    {pesta === 'bloqueos' && <BloqueosPanel />}
                </div>
            </div>
        </div>
    );
}

/** Panel de listado y gestión de citas */
function PanelCitas() {
    const [citas, setCitas] = useState([]);
    const [filtroEstado, setFiltroEstado] = useState('PENDIENTE');
    const [loading, setLoading] = useState(true);
    const [accionando, setAccionando] = useState(null);

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

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
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
    );
}

function TarjetaCita({ cita, onConfirmar, onRechazar, onCompletar, cargando }) {
    const fecha = dayjs(cita.fecha).format('ddd D [de] MMMM');
    const badgeClass = `badge badge--${cita.estado.toLowerCase()}`;

    return (
        <div className="card" style={{ opacity: cargando ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                    <h3 style={{ marginBottom: '2px' }}>{cita.cliente_nombre}</h3>
                    <span className="text-sm text-muted" style={{ textTransform: 'capitalize' }}>
                        {fecha} · {cita.hora_inicio}
                    </span>
                </div>
                <span className={badgeClass}>{cita.estado_display}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <FilaDato icon={<Scissors size={13} />} label="Servicio">
                    {cita.servicio_nombre} — <strong style={{ color: 'var(--accent)' }}>${cita.servicio_precio?.toLocaleString()}</strong>
                </FilaDato>
                <FilaDato icon={<MapPin size={13} />} label="Dirección">
                    {cita.cliente_direccion}
                </FilaDato>
                <FilaDato icon={<Phone size={13} />} label="Teléfono">
                    <a href={`tel:${cita.cliente_telefono}`} style={{ color: 'var(--accent)' }}>
                        {cita.cliente_telefono}
                    </a>
                </FilaDato>
                {cita.notas && (
                    <FilaDato icon={<FileText size={13} />} label="Notas">
                        {cita.notas}
                    </FilaDato>
                )}
            </div>

            {cita.estado === 'PENDIENTE' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn--primary btn--sm" onClick={onConfirmar} disabled={cargando} style={{ flex: 1 }}>
                        <CheckCircle size={15} /> Confirmar
                    </button>
                    <button className="btn btn--danger btn--sm" onClick={onRechazar} disabled={cargando} style={{ flex: 1 }}>
                        <XCircle size={15} /> Rechazar
                    </button>
                </div>
            )}
            {cita.estado === 'CONFIRMADA' && (
                <button className="btn btn--secondary btn--sm" onClick={onCompletar} disabled={cargando}>
                    <CheckSquare size={15} /> Marcar como completada
                </button>
            )}
        </div>
    );
}

function FilaDato({ icon, label, children }) {
    return (
        <span className="text-sm" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }}>{icon}</span>
            <span>
                <span style={{ color: 'var(--text-muted)' }}>{label}: </span>
                {children}
            </span>
        </span>
    );
}
