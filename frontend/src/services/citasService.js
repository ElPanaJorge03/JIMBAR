/**
 * citasService.js — Todas las llamadas relacionadas con citas, servicios y disponibilidad.
 */
import api from './api';

// ── Público ──────────────────────────────────────────────────

/** Info pública del tenant/barbería */
export const getBarberiaInfo = (slug) =>
    api.get(`/${slug}/info/`).then((r) => r.data);

/** Obtiene la lista de servicios activos de una barbería */
export const getServicios = (slug) =>
    api.get(`/${slug}/servicios/`).then((r) => r.data);

/** Obtiene los slots disponibles para una fecha y servicios seleccionados */
export const getDisponibilidad = (slug, fecha, serviciosIds) =>
    api.get(`/${slug}/disponibilidad/`, { params: { fecha, servicios_ids: serviciosIds.join(',') } }).then((r) => r.data);

/** Crea una nueva cita para una barbería específica */
export const crearCita = (slug, datos) =>
    api.post(`/${slug}/citas/`, datos).then((r) => r.data);

/** Cancela una cita (el cliente la identifica con su correo y slug de barberia) */
export const cancelarCita = (slug, citaId, correo) =>
    api.post(`/${slug}/citas/${citaId}/cancelar/`, { correo }).then((r) => r.data);

// ── Barbero (requiere JWT) ────────────────────────────────────

/** Lista todas las citas. Acepta filtros opcionales: { estado, fecha } */
export const getCitas = (filtros = {}) =>
    api.get('/barbero/citas/', { params: filtros }).then((r) => r.data);

/** Obtiene el detalle de una cita específica */
export const getCita = (id) =>
    api.get(`/barbero/citas/${id}/`).then((r) => r.data);

/** Cambia el estado de una cita (CONFIRMADA, RECHAZADA, COMPLETADA) */
export const cambiarEstadoCita = (id, estado) =>
    api.patch(`/barbero/citas/${id}/estado/`, { estado }).then((r) => r.data);

/** Lista los días bloqueados */
export const getBloqueos = () =>
    api.get('/barbero/bloqueos/').then((r) => r.data);

/** Bloquea un día */
export const bloquearDia = (fecha, motivo = '') =>
    api.post('/barbero/bloqueos/', { fecha, motivo }).then((r) => r.data);

/** Desbloquea un día */
export const desbloquearDia = (id) =>
    api.delete(`/barbero/bloqueos/${id}/`);

// ── Servicios (CRUD para el barbero) ─────────────────────────

/** Lista todos los servicios incluyendo inactivos */
export const getServiciosBarbero = () =>
    api.get('/barbero/servicios/').then((r) => r.data);

/** Crea un nuevo servicio */
export const crearServicio = (datos) =>
    api.post('/barbero/servicios/', datos).then((r) => r.data);

/** Actualiza un servicio existente */
export const actualizarServicio = (id, datos) =>
    api.patch(`/barbero/servicios/${id}/`, datos).then((r) => r.data);

/** Elimina un servicio */
export const eliminarServicio = (id) =>
    api.delete(`/barbero/servicios/${id}/`);
