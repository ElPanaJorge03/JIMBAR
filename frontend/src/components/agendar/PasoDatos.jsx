/**
 * PasoDatos.jsx — Paso 3: El cliente ingresa sus datos personales.
 * Si la barbería atiende a domicilio o ambos, se pide dirección; si es solo presencial, no.
 */
import { useState } from 'react';
import { crearCita } from '../../services/citasService';

export default function PasoDatos({ slug, seleccion, estiloTrabajo = 'AMBOS', onSiguiente, onAnterior }) {
    const requiereDireccion = estiloTrabajo === 'DOMICILIO' || estiloTrabajo === 'AMBOS';
    const [form, setForm] = useState({
        nombre: '',
        telefono: '',
        correo: '',
        direccion: '',
        notas: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.nombre.trim() || !form.telefono.trim() || !form.correo.trim()) {
            setError('Por favor completa todos los campos obligatorios.');
            return;
        }
        if (requiereDireccion && !form.direccion.trim()) {
            setError('Por favor ingresa la dirección donde deseas recibir el servicio.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                servicios: seleccion.servicios.map(s => s.id),
                fecha: seleccion.fecha,
                hora_inicio: seleccion.slot.hora_inicio,
                cliente_nombre: form.nombre.trim(),
                cliente_telefono: form.telefono.trim(),
                cliente_correo: form.correo.trim(),
                cliente_direccion: requiereDireccion ? form.direccion.trim() : '',
                notas: form.notas.trim(),
            };

            const citaCreada = await crearCita(slug || 'jimbar', payload);
            onSiguiente(form, citaCreada);
        } catch (err) {
            const data = err.response?.data;
            if (data) {
                const msg = typeof data === 'string'
                    ? data
                    : Object.values(data).flat().join(' ');
                setError(msg);
            } else {
                setError('Error al enviar la solicitud. Intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: '6px' }}>Tus datos</h1>
            <p style={{ marginBottom: '28px' }}>
                {requiereDireccion
                    ? 'Indica la dirección donde deseas recibir el servicio.'
                    : 'Completa tus datos para confirmar la reserva.'}
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                    <label className="form-label">Nombre completo *</label>
                    <input
                        className="form-input"
                        type="text"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        placeholder="Tu nombre"
                        autoComplete="name"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Teléfono *</label>
                    <input
                        className="form-input"
                        type="tel"
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                        placeholder="300 000 0000"
                        autoComplete="tel"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Correo electrónico *</label>
                    <input
                        className="form-input"
                        type="email"
                        name="correo"
                        value={form.correo}
                        onChange={handleChange}
                        placeholder="tu@correo.com"
                        autoComplete="email"
                        required
                    />
                    <span className="text-xs text-muted">
                        Recibirás la confirmación aquí.
                    </span>
                </div>

                {requiereDireccion && (
                    <div className="form-group">
                        <label className="form-label">Dirección *</label>
                        <textarea
                            className="form-input"
                            name="direccion"
                            value={form.direccion}
                            onChange={handleChange}
                            placeholder="Calle 10 #5-20, Barrio Centro"
                            rows={2}
                            style={{ resize: 'none', paddingTop: '12px' }}
                            required
                        />
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Notas adicionales</label>
                    <textarea
                        className="form-input"
                        name="notas"
                        value={form.notas}
                        onChange={handleChange}
                        placeholder="Ej: Apartamento 301, timbre no funciona"
                        rows={2}
                        style={{ resize: 'none', paddingTop: '12px' }}
                    />
                </div>

                {error && <div className="alert alert--error">{error}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                    <button
                        type="submit"
                        className="btn btn--primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="spinner" style={{ width: 18, height: 18 }} />
                                Enviando...
                            </>
                        ) : (
                            'Confirmar reserva →'
                        )}
                    </button>
                    <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={onAnterior}
                        disabled={loading}
                    >
                        ← Volver
                    </button>
                </div>
            </form>
        </div>
    );
}
