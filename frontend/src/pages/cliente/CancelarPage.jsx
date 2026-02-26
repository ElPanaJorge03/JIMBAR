import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function CancelarPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [correo, setCorreo] = useState('');
    const [estado, setEstado] = useState('idle'); // idle | loading | success | error
    const [mensaje, setMensaje] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEstado('loading');
        setMensaje('');

        try {
            await api.post(`/citas/${id}/cancelar/`, { correo });
            setEstado('success');
            setMensaje('Tu cita ha sido cancelada exitosamente.');
        } catch (err) {
            setEstado('error');
            const data = err.response?.data;
            if (data?.error) {
                setMensaje(data.error);
            } else {
                setMensaje('No se pudo cancelar la cita. Verifica el correo e intenta de nuevo.');
            }
        }
    };

    return (
        <div style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
        }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>
                <button
                    className="btn btn--ghost"
                    onClick={() => navigate('/')}
                    style={{ marginBottom: '24px', paddingLeft: 0 }}
                >
                    ← Volver
                </button>

                <div className="card">
                    <h2 style={{ marginBottom: '16px' }}>Cancelar Cita</h2>

                    {estado === 'success' ? (
                        <div style={{ textAlign: 'center' }}>
                            <div className="alert alert--success" style={{ marginBottom: '24px' }}>
                                {mensaje}
                            </div>
                            <button className="btn btn--primary" onClick={() => navigate('/')}>
                                Volver al inicio
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Para cancelar esta cita (ID: {id}), por favor ingresa el correo electrónico con el que la agendaste.
                            </p>

                            <div className="form-group">
                                <label className="form-label">Correo electrónico</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                    placeholder="tu@correo.com"
                                    required
                                />
                            </div>

                            {estado === 'error' && (
                                <div className="alert alert--error">{mensaje}</div>
                            )}

                            <button type="submit" className="btn btn--primary" disabled={estado === 'loading'}>
                                {estado === 'loading' ? 'Cancelando...' : 'Confirmar Cancelación'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
