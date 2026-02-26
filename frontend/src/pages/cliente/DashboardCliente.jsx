import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';
import api from '../../services/api';
import dayjs from 'dayjs';

export default function DashboardCliente() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(true);

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2>Mis Citas</h2>
                    <Link to="/agendar" className="btn btn--primary" style={{ textDecoration: 'none', padding: '8px 16px' }}>
                        Nueva Cita
                    </Link>
                </div>

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
                        <Link to="/agendar" className="btn btn--primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                            Agendar ahora
                        </Link>
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
