/**
 * PasoDatos.jsx — Paso 3: El cliente ingresa sus datos personales.
 * Luego envía la solicitud al backend y pasa al paso de confirmación.
 */
import { useState } from 'react';
import { crearCita } from '../../services/citasService';

export default function PasoDatos({ slug, seleccion, onSiguiente, onAnterior }) {
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

        // Validación básica en frontend
        if (!form.nombre.trim() || !form.telefono.trim() || !form.correo.trim() || !form.direccion.trim()) {
            setError('Por favor completa todos los campos obligatorios.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                servicio: seleccion.servicio.id,
                fecha: seleccion.fecha,
                hora_inicio: seleccion.slot.hora_inicio,
                cliente_nombre: form.nombre.trim(),
                cliente_telefono: form.telefono.trim(),
                cliente_correo: form.correo.trim(),
                cliente_direccion: form.direccion.trim(),
                notas: form.notas.trim(),
            };

            const citaCreada = await crearCita(slug || 'jimbar', payload);
            onSiguiente(form, citaCreada);
        } catch (err) {
            // El backend devuelve errores de validación en err.response.data
            const data = err.response?.data;
            if (data) {
                // Puede ser un objeto con campos, o un string
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
                El barbero llegará a la dirección que indiques.
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
                            'Confirmar cita →'
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
