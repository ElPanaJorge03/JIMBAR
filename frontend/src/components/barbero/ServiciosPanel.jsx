/**
 * ServiciosPanel.jsx — Gestión de servicios de la barbería.
 * El barbero puede crear, editar, activar/desactivar y eliminar servicios.
 */
import { useState, useEffect, useCallback } from 'react';
import {
    Scissors, User, Star, Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight,
} from 'lucide-react';
import {
    getServiciosBarbero, crearServicio, actualizarServicio, eliminarServicio,
} from '../../services/citasService';

// Iconos predefinidos que el barbero puede elegir
const ICONOS = [
    { valor: 'scissors', label: 'Tijeras (Corte)', Icon: Scissors },
    { valor: 'user', label: 'Barba / Cejas', Icon: User },
    { valor: 'star', label: 'Especial', Icon: Star },
];

const IconoDe = (icono) => {
    const found = ICONOS.find(i => i.valor === icono?.toLowerCase());
    return found ? found.Icon : Scissors;
};

const FORM_VACIO = { nombre: '', precio: '', duracion_minutos: '', icono: 'scissors' };

export default function ServiciosPanel() {
    const [servicios, setServicios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editando, setEditando] = useState(null); // id del servicio editando, o 'nuevo'
    const [form, setForm] = useState(FORM_VACIO);
    const [guardando, setGuardando] = useState(false);
    const [eliminando, setEliminando] = useState(null);

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getServiciosBarbero();
            setServicios(data);
        } catch {
            setError('No se pudieron cargar los servicios.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const abrirNuevo = () => {
        setForm(FORM_VACIO);
        setEditando('nuevo');
    };

    const abrirEditar = (s) => {
        setForm({
            nombre: s.nombre,
            precio: String(s.precio),
            duracion_minutos: String(s.duracion_minutos),
            icono: s.icono || 'scissors',
        });
        setEditando(s.id);
    };

    const cancelar = () => {
        setEditando(null);
        setForm(FORM_VACIO);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const guardar = async (e) => {
        e.preventDefault();
        if (!form.nombre.trim() || !form.precio || !form.duracion_minutos) {
            setError('Por favor completa todos los campos.');
            return;
        }
        setGuardando(true);
        setError('');
        try {
            const datos = {
                nombre: form.nombre.trim(),
                precio: parseInt(form.precio, 10),
                duracion_minutos: parseInt(form.duracion_minutos, 10),
                icono: form.icono,
            };
            if (editando === 'nuevo') {
                await crearServicio(datos);
            } else {
                await actualizarServicio(editando, datos);
            }
            setEditando(null);
            setForm(FORM_VACIO);
            await cargar();
        } catch (err) {
            const data = err.response?.data;
            const msg = data
                ? typeof data === 'string' ? data : Object.values(data).flat().join(' ')
                : 'Error guardando. Intenta de nuevo.';
            setError(msg);
        } finally {
            setGuardando(false);
        }
    };

    const toggleActivo = async (s) => {
        try {
            await actualizarServicio(s.id, { activo: !s.activo });
            await cargar();
        } catch {
            setError('No se pudo cambiar el estado del servicio.');
        }
    };

    const eliminar = async (id) => {
        setEliminando(id);
        try {
            await eliminarServicio(id);
            await cargar();
        } catch {
            setError('No se pudo eliminar el servicio. Puede que tenga reservas activas.');
        } finally {
            setEliminando(null);
        }
    };

    if (loading) return (
        <div className="loading-center"><div className="spinner" /></div>
    );

    return (
        <div>
            {/* Encabezado del panel */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ marginBottom: '4px' }}>Mis Servicios</h2>
                    <p className="text-sm text-muted">Añade y gestiona los servicios que ofreces.</p>
                </div>
                {editando !== 'nuevo' && (
                    <button
                        className="btn btn--primary btn--sm"
                        onClick={abrirNuevo}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Plus size={15} /> Nuevo servicio
                    </button>
                )}
            </div>

            {error && (
                <div className="alert alert--error" style={{ marginBottom: '16px' }}>
                    {error}
                    <button
                        onClick={() => setError('')}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '8px' }}
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Formulario de nuevo/editar servicio */}
            {editando !== null && (
                <form onSubmit={guardar} className="card" style={{ marginBottom: '20px', borderColor: 'var(--accent)' }}>
                    <h3 style={{ marginBottom: '16px', color: 'var(--accent)' }}>
                        {editando === 'nuevo' ? '✦ Nuevo servicio' : '✎ Editar servicio'}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Nombre del servicio *</label>
                            <input
                                className="form-input"
                                name="nombre"
                                value={form.nombre}
                                onChange={handleChange}
                                placeholder="Ej: Corte de cabello"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Precio (COP) *</label>
                            <input
                                className="form-input"
                                name="precio"
                                type="number"
                                min="0"
                                value={form.precio}
                                onChange={handleChange}
                                placeholder="15000"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Duración (min) *</label>
                            <input
                                className="form-input"
                                name="duracion_minutos"
                                type="number"
                                min="5"
                                step="5"
                                value={form.duracion_minutos}
                                onChange={handleChange}
                                placeholder="30"
                                required
                            />
                        </div>
                    </div>

                    {/* Selección de icono */}
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label className="form-label">Icono</label>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {ICONOS.map(({ valor, label, Icon }) => (
                                <button
                                    key={valor}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, icono: valor }))}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 16px', borderRadius: 'var(--radius-md)',
                                        border: `2px solid ${form.icono === valor ? 'var(--accent)' : 'var(--border)'}`,
                                        background: form.icono === valor ? 'rgba(var(--accent-rgb), 0.1)' : 'var(--bg-elevated)',
                                        color: form.icono === valor ? 'var(--accent)' : 'var(--text-secondary)',
                                        cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Icon size={16} />
                                    {label}
                                    {form.icono === valor && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="submit"
                            className="btn btn--primary btn--sm"
                            disabled={guardando}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            {guardando ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />}
                            Guardar
                        </button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={cancelar}>
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Lista de servicios */}
            {servicios.length === 0 && editando === null ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <Scissors size={40} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                    <p className="text-muted">Aún no tienes servicios.</p>
                    <p className="text-sm text-muted" style={{ marginBottom: '24px' }}>
                        Añade un servicio para que los clientes puedan agendarse.
                    </p>
                    <button className="btn btn--primary" onClick={abrirNuevo} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={16} /> Añadir primer servicio
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {servicios.map(s => {
                        const IconComp = IconoDe(s.icono);
                        const esEditando = editando === s.id;
                        return (
                            <div
                                key={s.id}
                                className="card"
                                style={{
                                    opacity: s.activo ? 1 : 0.55,
                                    borderColor: esEditando ? 'var(--accent)' : undefined,
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    {/* Info del servicio */}
                                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: '12px',
                                            background: s.activo ? 'var(--accent)' : '#222',
                                            color: s.activo ? '#0a0a0a' : 'var(--text-muted)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <IconComp size={22} />
                                        </div>
                                        <div>
                                            <h3 style={{ marginBottom: '2px', opacity: s.activo ? 1 : 0.7 }}>
                                                {s.nombre}
                                                {!s.activo && (
                                                    <span style={{
                                                        fontSize: '0.7rem', marginLeft: '8px',
                                                        background: '#333', color: 'var(--text-muted)',
                                                        padding: '2px 6px', borderRadius: '4px',
                                                    }}>
                                                        Inactivo
                                                    </span>
                                                )}
                                            </h3>
                                            <span className="text-sm text-muted">
                                                {s.duracion_minutos} min ·{' '}
                                                <strong style={{ color: 'var(--accent)' }}>{s.precio_formateado}</strong>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                                        {/* Toggle activar/desactivar */}
                                        <button
                                            onClick={() => toggleActivo(s)}
                                            title={s.activo ? 'Desactivar' : 'Activar'}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                                                color: s.activo ? 'var(--accent)' : 'var(--text-muted)',
                                                display: 'flex', alignItems: 'center',
                                            }}
                                        >
                                            {s.activo ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                        </button>
                                        {/* Editar */}
                                        <button
                                            onClick={() => abrirEditar(s)}
                                            title="Editar"
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                                                color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
                                            }}
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        {/* Eliminar */}
                                        <button
                                            onClick={() => eliminar(s.id)}
                                            disabled={eliminando === s.id}
                                            title="Eliminar"
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                                                color: 'var(--error)', display: 'flex', alignItems: 'center',
                                            }}
                                        >
                                            {eliminando === s.id
                                                ? <div className="spinner" style={{ width: 14, height: 14 }} />
                                                : <Trash2 size={16} />
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
