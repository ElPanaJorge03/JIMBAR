/**
 * citasService.js — Todas las llamadas relacionadas con citas, servicios y disponibilidad.
 */
import api from './api';

// ── Público ──────────────────────────────────────────────────

/** Obtiene la lista de servicios activos */
export const getServicios = () =>
    api.get('/servicios/').then((r) => r.data);

/** Obtiene los slots disponibles para una fecha y servicio */
export const getDisponibilidad = (fecha, servicioId) =>
    api.get('/disponibilidad/', { params: { fecha, servicio_id: servicioId } }).then((r) => r.data);

/** Crea una nueva cita */
export const crearCita = (datos) =>
    api.post('/citas/', datos).then((r) => r.data);

/** Cancela una cita (el cliente la identifica con su correo) */
export const cancelarCita = (citaId, correo) =>
    api.post(`/citas/${citaId}/cancelar/`, { correo }).then((r) => r.data);

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
