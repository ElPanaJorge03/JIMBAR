"""
emails.py — Funciones de envío de correo para Jimbar.

Se llaman desde las views en un thread background.
Si el email falla (credenciales no configuradas, etc.),
el error queda en el log pero NO rompe la respuesta al cliente.
"""
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def _get_cita(cita_id):
    from .models import Cita
    try:
        return Cita.objects.select_related('servicio').get(id=cita_id)
    except Cita.DoesNotExist:
        logger.warning(f"Email: cita {cita_id} no encontrada.")
        return None


def enviar_correo_nueva_cita(cita_id):
    """Notifica al barbero cuando llega una nueva solicitud."""
    cita = _get_cita(cita_id)
    if not cita:
        return

    mensaje = (
        f"Nueva solicitud de cita:\n\n"
        f"Cliente: {cita.cliente_nombre}\n"
        f"Teléfono: {cita.cliente_telefono}\n"
        f"Servicio: {cita.servicio.nombre}\n"
        f"Fecha: {cita.fecha.strftime('%d/%m/%Y')}\n"
        f"Hora: {cita.hora_inicio.strftime('%H:%M')}\n"
        f"Dirección: {cita.cliente_direccion}\n"
        f"Notas: {cita.notas or 'Ninguna'}\n\n"
        f"Tienes {settings.AUTO_CONFIRM_MINUTES} minutos para responder "
        f"antes de que se confirme automáticamente."
    )
    _enviar(
        asunto=f"[Jimbar] Nueva cita — {cita.cliente_nombre}",
        mensaje=mensaje,
        destinatarios=[settings.BARBER_EMAIL],
    )

    # Notificar al cliente que su solicitud fue recibida
    mensaje_cliente = (
        f"Hola {cita.cliente_nombre},\n\n"
        f"Hemos recibido tu solicitud de cita para el servicio de '{cita.servicio.nombre}'.\n\n"
        f"Detalles:\n"
        f"Fecha: {cita.fecha.strftime('%d/%m/%Y')}\n"
        f"Hora: {cita.hora_inicio.strftime('%H:%M')}\n\n"
        f"El barbero revisará tu solicitud y te confirmará por este mismo medio en breve.\n\n"
        f"¡Gracias por preferir Jimbar!"
    )
    _enviar(
        asunto=f"[Jimbar] Solicitud de cita en revisión ⏳",
        mensaje=mensaje_cliente,
        destinatarios=[cita.cliente_correo],
    )


def enviar_correo_estado_cita(cita_id, nuevo_estado):
    """Notifica al cliente cuando el barbero cambia el estado de su cita."""
    cita = _get_cita(cita_id)
    if not cita:
        return

    if nuevo_estado == 'CONFIRMADA':
        asunto = "[Jimbar] Tu cita fue confirmada ✅"
        mensaje = (
            f"Hola {cita.cliente_nombre},\n\n"
            f"Tu cita ha sido confirmada:\n\n"
            f"Servicio: {cita.servicio.nombre}\n"
            f"Fecha: {cita.fecha.strftime('%d/%m/%Y')}\n"
            f"Hora: {cita.hora_inicio.strftime('%H:%M')}\n"
            f"Dirección: {cita.cliente_direccion}\n\n"
            f"¡Hasta pronto!"
        )
    elif nuevo_estado == 'RECHAZADA':
        asunto = "[Jimbar] Tu cita no pudo confirmarse"
        mensaje = (
            f"Hola {cita.cliente_nombre},\n\n"
            f"Lamentablemente tu cita del {cita.fecha.strftime('%d/%m/%Y')} "
            f"a las {cita.hora_inicio.strftime('%H:%M')} no pudo ser atendida.\n\n"
            f"Puedes agendar una nueva cita en otro horario disponible."
        )
    elif nuevo_estado == 'COMPLETADA':
        asunto = "[Jimbar] ¡Gracias por tu visita! 💇‍♂️"
        mensaje = (
            f"Hola {cita.cliente_nombre},\n\n"
            f"Tu cita ha sido marcada como completada. Esperamos "
            f"que te haya encantado el servicio de '{cita.servicio.nombre}'.\n\n"
            f"¡Vuelve pronto a Jimbar!"
        )
    else:
        return

    _enviar(asunto=asunto, mensaje=mensaje, destinatarios=[cita.cliente_correo])


def enviar_correo_cancelacion_cliente(cita_id):
    """Notifica al barbero cuando un cliente cancela."""
    cita = _get_cita(cita_id)
    if not cita:
        return

    mensaje = (
        f"El cliente {cita.cliente_nombre} canceló su cita:\n\n"
        f"Servicio: {cita.servicio.nombre}\n"
        f"Fecha: {cita.fecha.strftime('%d/%m/%Y')}\n"
        f"Hora: {cita.hora_inicio.strftime('%H:%M')}\n"
        f"Teléfono: {cita.cliente_telefono}\n"
    )
    _enviar(
        asunto=f"[Jimbar] Cita cancelada — {cita.cliente_nombre}",
        mensaje=mensaje,
        destinatarios=[settings.BARBER_EMAIL],
    )


def _enviar(asunto, mensaje, destinatarios):
    """Función base de envío. Captura cualquier error sin romper el flujo."""
    if not settings.EMAIL_HOST_USER:
        logger.info(f"Email no configurado. Se omite: {asunto}")
        return
    try:
        send_mail(
            subject=asunto,
            message=mensaje,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=destinatarios,
            fail_silently=False,
        )
        logger.info(f"Email enviado: {asunto} → {destinatarios}")
    except Exception as e:
        logger.error(f"Error enviando email '{asunto}': {e}")
