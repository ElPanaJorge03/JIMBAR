/**
 * CitasPage.jsx — Panel principal del barbero.
 * Tiene tres pestañas: Citas, Bloqueos y Servicios.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
    ClipboardList, CalendarOff,
    CheckCircle, XCircle, CheckSquare,
    Phone, MapPin, FileText, Scissors,
    LogOut, Settings, Bell, BellOff, Download,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { getCitas, cambiarEstadoCita } from '../../services/citasService';
import { useAuth } from '../../context/AuthContext';
import BloqueosPanel from '../../components/barbero/BloqueosPanel';
import ServiciosPanel from '../../components/barbero/ServiciosPanel';

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
    const { logout, role } = useAuth();
    const navigate = useNavigate();
    const [pesta, setPesta] = useState('citas'); // 'citas' | 'bloqueos'
    const { canInstall, triggerInstall } = usePWAInstall();
    const { permiso, suscrito, cargando: cargandoPush, suscribir, desuscribir } = usePushNotifications();

    const esAdmin = ['BARBERIA_ADMIN', 'SUPERADMIN'].includes(role);

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {esAdmin && (
                            <button
                                className="btn btn--ghost btn--sm"
                                onClick={() => navigate('/mi-barberia')}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                title="Configurar mi barbería"
                            >
                                <Settings size={15} /> Mi Barbería
                            </button>
                        )}
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={handleLogout}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <LogOut size={15} /> Salir
                        </button>
                    </div>
                </div>
            </header>

            <div className="container--wide">
                {/* Banner de Notificaciones / PWA */}
                {(canInstall || (!suscrito && permiso !== 'denied')) && (
                    <div style={{
                        background: 'rgba(162,112,53,0.1)',
                        border: '1px solid rgba(162,112,53,0.3)',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                        flexWrap: 'wrap'
                    }}>
                        <div>
                            <strong style={{ color: 'var(--accent)', fontSize: '0.95rem', display: 'block' }}>🚀 ¡No pierdas ni una cita!</strong>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Activa las notificaciones push para recibir alertas al instante.</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {canInstall && (
                                <button onClick={triggerInstall} className="btn btn--sm btn--secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Download size={14} /> Instalar App
                                </button>
                            )}
                            {!suscrito && permiso !== 'denied' && (
                                <button
                                    onClick={suscribir}
                                    disabled={cargandoPush}
                                    className="btn btn--sm btn--primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <Bell size={14} /> Activar Notificaciones
                                </button>
                            )}
                            {suscrito && (
                                <button
                                    onClick={desuscribir}
                                    disabled={cargandoPush}
                                    className="btn btn--sm btn--ghost"
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', opacity: 0.6 }}
                                >
                                    <BellOff size={12} /> Desactivar
                                </button>
                            )}
                        </div>
                    </div>
                )}
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
                        { id: 'servicios', icon: <Scissors size={15} />, label: 'Servicios' },
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
                    {pesta === 'servicios' && <ServiciosPanel />}
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
                    {cita.servicios?.map(s => s.nombre).join(', ')} —{' '}
                    <strong style={{ color: 'var(--accent)' }}>
                        ${cita.servicios?.reduce((acc, curr) => acc + curr.precio, 0).toLocaleString()}
                    </strong>
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
