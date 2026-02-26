/**
 * PasoConfirmacion.jsx — Paso 4: Resumen de la cita creada.
 */
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { Check } from 'lucide-react';

dayjs.locale('es');

export default function PasoConfirmacion({ seleccion, onNuevaCita }) {
    const { servicio, fecha, slot, datos } = seleccion;

    const fechaFormateada = dayjs(fecha).format('dddd D [de] MMMM [de] YYYY');

    return (
        <div style={{ textAlign: 'center' }}>
            {/* Ícono de éxito */}
            <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(76, 175, 125, 0.15)',
                border: '1px solid var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)',
                margin: '0 auto 24px',
            }}>
                <Check size={36} />
            </div>

            <h1 style={{ marginBottom: '8px', color: 'var(--success)' }}>
                ¡Solicitud enviada!
            </h1>
            <p style={{ marginBottom: '32px' }}>
                Recibirás una confirmación en{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{datos.correo}</strong>.
                Si el barbero no responde en 15 minutos, tu cita se confirma automáticamente.
            </p>

            {/* Resumen */}
            <div className="card" style={{ textAlign: 'left', marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: 'var(--accent)' }}>
                    Resumen de tu cita
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <FilaResumen label="Servicio" value={servicio.nombre} />
                    <FilaResumen label="Precio" value={servicio.precio_formateado} />
                    <hr className="divider" style={{ margin: '4px 0' }} />
                    <FilaResumen label="Fecha" value={fechaFormateada} capitalize />
                    <FilaResumen label="Hora" value={`${slot.hora_inicio} – ${slot.hora_fin}`} />
                    <hr className="divider" style={{ margin: '4px 0' }} />
                    <FilaResumen label="Nombre" value={datos.nombre} />
                    <FilaResumen label="Teléfono" value={datos.telefono} />
                    <FilaResumen label="Correo" value={datos.correo} />
                    <FilaResumen label="Dirección" value={datos.direccion} />
                    {datos.notas && <FilaResumen label="Notas" value={datos.notas} />}
                </div>
            </div>

            <div className="alert alert--info" style={{ marginBottom: '24px', textAlign: 'left' }}>
                <strong>¿Necesitas cancelar?</strong> Puedes hacerlo desde la app con más de
                2 horas de anticipación. Con menos de 2 horas, contacta directamente al barbero.
            </div>

            <button className="btn btn--secondary" onClick={onNuevaCita}>
                Agendar otra cita
            </button>
        </div>
    );
}

function FilaResumen({ label, value, capitalize }) {
    return (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                width: '70px',
                flexShrink: 0,
                paddingTop: '1px',
            }}>
                {label}
            </span>
            <span style={{
                fontSize: '0.9375rem',
                color: 'var(--text-primary)',
                fontWeight: 500,
                textTransform: capitalize ? 'capitalize' : 'none',
            }}>
                {value}
            </span>
        </div>
    );
}
