/**
 * AgendarPage.jsx — Flujo completo de agendamiento para el cliente.
 *
 * Pasos:
 *  1. Seleccionar servicio
 *  2. Seleccionar fecha y hora disponible
 *  3. Ingresar datos personales
 *  4. Confirmación
 */
import { useState } from 'react';
import PasoServicio from '../components/agendar/PasoServicio';
import PasoFechaHora from '../components/agendar/PasoFechaHora';
import PasoDatos from '../components/agendar/PasoDatos';
import PasoConfirmacion from '../components/agendar/PasoConfirmacion';

const PASOS = ['Servicio', 'Fecha y hora', 'Tus datos', 'Confirmación'];

import { Check } from 'lucide-react';

export default function AgendarPage() {
    const [paso, setPaso] = useState(0);
    const [seleccion, setSeleccion] = useState({
        servicio: null,     // { id, nombre, precio, duracion_minutos }
        fecha: null,        // string 'YYYY-MM-DD'
        slot: null,         // { hora_inicio, hora_fin }
        datos: null,        // { nombre, telefono, correo, direccion, notas }
        citaCreada: null,   // respuesta del backend al confirmar
    });

    const siguiente = (datos) => {
        setSeleccion((prev) => ({ ...prev, ...datos }));
        setPaso((p) => p + 1);
    };

    const anterior = () => setPaso((p) => p - 1);

    return (
        <div style={{ minHeight: '100dvh', paddingBottom: '40px' }}>
            {/* Encabezado */}
            <header style={{
                borderBottom: '1px solid var(--border)',
                padding: '20px 0',
                marginBottom: '32px',
            }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: 'var(--accent)',
                            letterSpacing: '-0.5px',
                        }}>
                            JIMBAR
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            · Barbería a domicilio
                        </span>
                    </div>
                </div>
            </header>

            <div className="container">
                {/* Indicador de pasos */}
                {paso < 3 && (
                    <div style={{ marginBottom: '32px' }}>
                        <IndicadorPasos pasoActual={paso} pasos={PASOS} />
                    </div>
                )}

                {/* Contenido del paso actual */}
                <div className="fade-in" key={paso}>
                    {paso === 0 && (
                        <PasoServicio
                            onSiguiente={(servicio) => siguiente({ servicio })}
                        />
                    )}
                    {paso === 1 && (
                        <PasoFechaHora
                            servicio={seleccion.servicio}
                            onSiguiente={(fecha, slot) => siguiente({ fecha, slot })}
                            onAnterior={anterior}
                        />
                    )}
                    {paso === 2 && (
                        <PasoDatos
                            seleccion={seleccion}
                            onSiguiente={(datos, citaCreada) => siguiente({ datos, citaCreada })}
                            onAnterior={anterior}
                        />
                    )}
                    {paso === 3 && (
                        <PasoConfirmacion
                            seleccion={seleccion}
                            onNuevaCita={() => {
                                setSeleccion({ servicio: null, fecha: null, slot: null, datos: null, citaCreada: null });
                                setPaso(0);
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

/** Muestra en qué paso va el usuario */
function IndicadorPasos({ pasoActual, pasos }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {pasos.slice(0, 3).map((nombre, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: i < 2 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: i < pasoActual ? 'var(--accent)' : i === pasoActual ? 'var(--accent)' : 'var(--bg-elevated)',
                            color: i <= pasoActual ? '#0a0a0a' : 'var(--text-muted)',
                            border: i > pasoActual ? '1px solid var(--border)' : 'none',
                            transition: 'all 0.3s ease',
                        }}>
                            {i < pasoActual ? <Check size={14} /> : i + 1}
                        </div>
                        <span style={{
                            fontSize: '0.8rem',
                            color: i === pasoActual ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontWeight: i === pasoActual ? 500 : 400,
                            display: window.innerWidth < 400 ? 'none' : 'block',
                        }}>
                            {nombre}
                        </span>
                    </div>
                    {i < 2 && (
                        <div style={{
                            flex: 1,
                            height: 1,
                            background: i < pasoActual ? 'var(--accent)' : 'var(--border)',
                            transition: 'background 0.3s ease',
                        }} />
                    )}
                </div>
            ))}
        </div>
    );
}
