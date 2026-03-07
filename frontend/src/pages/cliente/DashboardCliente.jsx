import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';
import api from '../../services/api';
import dayjs from 'dayjs';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { Download, Bell, BellOff, Settings, CheckCircle, Store, X } from 'lucide-react';

export default function DashboardCliente() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const { canInstall, triggerInstall } = usePWAInstall();
    const { permiso, suscrito, cargando: cargandoPush, error: pushError, exito: pushExito, suscribir, desuscribir } = usePushNotifications();
    const barberiaSlugGuardada = localStorage.getItem('barberia_slug') || '';
    const barberiaNombreGuardada = localStorage.getItem('barberia_nombre') || '';

    const [modalConfig, setModalConfig] = useState(false);
    const [vincularSlug, setVincularSlug] = useState('');
    const [vincularLoading, setVincularLoading] = useState(false);
    const [vincularExito, setVincularExito] = useState(false);
    const [vincularError, setVincularError] = useState('');

    useEffect(() => {
        const fetchCitas = async () => {
            try {
                const { data } = await api.get('/cliente/citas/');
                setCitas(data);
            } catch (err) {
                console.error("Error cargando historial de citas:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCitas();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    const handleVincular = async (e) => {
        e.preventDefault();
        setVincularError('');
        setVincularExito(false);
        if (!vincularSlug.trim()) return;
        setVincularLoading(true);
        try {
            const { data } = await api.post('/cliente/vincular/', { barberia_slug: vincularSlug });
            localStorage.setItem('barberia_slug', data.barberia_slug);
            localStorage.setItem('barberia_nombre', data.barberia_nombre);
            setVincularExito(true);
            setVincularSlug('');
            setTimeout(() => setModalConfig(false), 2000);
        } catch (err) {
            setVincularError(err.response?.data?.error || 'Error al vincular. Verifica el enlace y vuelve a intentar.');
        } finally {
            setVincularLoading(false);
        }
    };

    const getEstadoText = (estado) => {
        const map = {
            'PENDIENTE': 'Pendiente',
            'CONFIRMADA': 'Confirmada',
            'RECHAZADA': 'Rechazada',
            'COMPLETADA': 'Completada',
            'CANCELADA': 'Cancelada'
        };
        return map[estado] || estado;
    };

    return (
        <div style={{ minHeight: '100dvh', paddingBottom: '40px' }}>
            <header style={{
                padding: '16px 0',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'rgba(26, 26, 26, 0.8)',
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent)', letterSpacing: '1px' }}>
                            JIMBAR
                        </span>
                    </div>
                    <button onClick={handleLogout} className="btn btn--ghost btn--sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <LogOut size={15} /> Salir
                    </button>
                </div>
            </header>

            <main className="container" style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <h2 style={{ margin: 0 }}>Mis Citas</h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => setModalConfig(true)} className="btn btn--outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
                            <Settings size={16} /> Opciones
                        </button>
                        <Link to={barberiaSlugGuardada ? `/${barberiaSlugGuardada}/agendar` : '/agendar'} className="btn btn--primary" style={{ textDecoration: 'none', padding: '8px 16px' }}>
                            Nueva Cita
                        </Link>
                    </div>
                </div>

                {/* Modal de Configuración / Vincular Barbería */}
                {modalConfig && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100,
                        display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px'
                    }}>
                        <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
                            <button
                                onClick={() => setModalConfig(false)}
                                style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                            <h3 style={{ marginTop: 0, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={20} className="text-accent" /> Mi Cuenta
                            </h3>

                            <div style={{ marginBottom: '24px' }}>
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Store size={15} /> Barbería Vinculada
                                </label>
                                {barberiaNombreGuardada ? (
                                    <div style={{ padding: '12px', background: 'rgba(76, 175, 125, 0.1)', border: '1px solid var(--success)', borderRadius: '8px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CheckCircle size={16} /> Estás vinculado a <strong>{barberiaNombreGuardada}</strong>
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>No tienes ninguna barbería principal en tu cuenta.</p>
                                )}
                            </div>

                            <form onSubmit={handleVincular} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">{'¿Quieres vincularte a ' + (barberiaNombreGuardada ? 'otra ' : 'tu ') + 'barbería?'}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ej: tu-barberia"
                                        value={vincularSlug}
                                        onChange={(e) => setVincularSlug(e.target.value)}
                                    />
                                    <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>Ingresa aquí el enlace que te dio tu barbero y así serás cliente de su local para siempre.</small>
                                </div>
                                {vincularError && <p style={{ color: 'var(--error)', margin: 0, fontSize: '0.85rem' }}>{vincularError}</p>}
                                {vincularExito && <p style={{ color: 'var(--success)', margin: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> ¡Súper! Se ha vinculado tu cuenta.</p>}
                                <button type="submit" className="btn btn--secondary" disabled={vincularLoading || !vincularSlug.trim()}>
                                    {vincularLoading ? 'Vinculando...' : 'Vincular y Guardar'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Acciones PWA / Notificaciones */}
                {(canInstall || permiso !== 'denied') && (
                    <div className="card" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(162,112,53,0.05)', border: '1px solid rgba(162,112,53,0.2)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <h4 style={{ margin: 0, color: 'var(--accent)', fontSize: '0.95rem' }}>Configura tu experiencia</h4>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Instala la app o activa notificaciones para no olvidar tus citas.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {canInstall && (
                                    <button onClick={triggerInstall} className="btn btn--secondary btn--sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Download size={15} /> Instalar App
                                    </button>
                                )}
                                {permiso !== 'denied' && (
                                    <button
                                        onClick={suscrito ? desuscribir : suscribir}
                                        disabled={cargandoPush}
                                        className="btn btn--outline btn--sm"
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: suscrito ? 'rgba(255,255,255,0.1)' : 'var(--accent)' }}
                                    >
                                        {cargandoPush
                                            ? 'Procesando...'
                                            : suscrito
                                                ? <><BellOff size={15} /> Notif. Off</>
                                                : <><Bell size={15} /> Activar Notif.</>}
                                    </button>
                                )}
                            </div>
                        </div>
                        {pushError && <p style={{ margin: 0, fontSize: '0.8rem', color: '#ef4444' }}>{pushError}</p>}
                        {pushExito && <p style={{ margin: 0, fontSize: '0.8rem', color: '#10b981' }}>Notificaciones activadas correctamente.</p>}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div className="spinner" />
                        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Cargando tu historial...</p>
                    </div>
                ) : citas.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💈</div>
                        <h3>Aún no tienes citas</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Parece que no has agendado ningún servicio todavía o ingresaste con un correo diferente.
                        </p>
                        <button onClick={() => setModalConfig(true)} className="btn btn--primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                            Vincular a mi Barbería
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {citas.map(cita => (
                            <div key={cita.id} className="card" style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    padding: '4px 8px',
                                    borderRadius: '100px',
                                    border: '1px solid',
                                    ...getBadgeStyle(cita.estado)
                                }}>
                                    {getEstadoText(cita.estado)}
                                </div>

                                <h3 style={{ marginBottom: '4px', paddingRight: '100px' }}>
                                    {cita.servicio_nombre}
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                    {dayjs(cita.fecha).format('DD/MM/YYYY')} a las {cita.hora_inicio.substring(0, 5)}
                                </p>

                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    {(cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA') && (
                                        <Link
                                            to={`/cancelar/${cita.id}`}
                                            className="btn btn--outline"
                                            style={{ padding: '6px 12px', fontSize: '0.875rem', textDecoration: 'none' }}
                                        >
                                            Opciones / Cancelar
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function getBadgeStyle(estado) {
    switch (estado) {
        case 'CONFIRMADA': return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' };
        case 'RECHAZADA': return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' };
        case 'PENDIENTE': return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' };
        case 'COMPLETADA': return { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)' };
        case 'CANCELADA': return { backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#9ca3af', borderColor: 'rgba(107, 114, 128, 0.2)' };
        default: return { backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#9ca3af', borderColor: 'rgba(107, 114, 128, 0.2)' };
    }
}
