"""
Tareas en segundo plano con Celery.

La principal: confirmar automáticamente una cita si el barbero
no la responde en 15 minutos (PENDIENTE → CONFIRMADA).
"""
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task
def enviar_recordatorio_push(cita_id):
    """
    Se ejecuta 1.5h antes de la cita.
    Envía notificación push al barbero y al cliente (si está registrado).
    """
    from .models import Cita
    try:
        cita = Cita.objects.prefetch_related('servicios').select_related('usuario', 'barberia').get(id=cita_id)
    except Cita.DoesNotExist:
        return

    if cita.estado in ['CANCELADA', 'RECHAZADA']:
        return  # No recordar citas que ya no van

    servicios_str = ', '.join(s.nombre for s in cita.servicios.all())
    hora_str = cita.hora_inicio.strftime('%H:%M')
    fecha_str = cita.fecha.strftime('%d/%m')

    # Push al barbero
    try:
        from push.notify import notify_barberos_de_barberia
        notify_barberos_de_barberia(
            cita.barberia,
            titulo="Recordatorio de cita",
            cuerpo=f"{cita.cliente_nombre} — {servicios_str} a las {hora_str}",
            url="/barbero/citas"
        )
    except Exception as e:
        logger.error(f"Recordatorio push al barbero falló: {e}")

    # Push al cliente (si tiene cuenta y suscripción)
    try:
        if cita.usuario_id:
            from push.notify import notify_usuario
            notify_usuario(
                cita.usuario,
                titulo=f"Recordatorio — {fecha_str} a las {hora_str}",
                cuerpo=f"Tu cita de {servicios_str} es en 1 hora y media.",
                url="/cliente/citas"
            )
    except Exception as e:
        logger.error(f"Recordatorio push al cliente falló: {e}")


@shared_task
def confirmar_cita_automaticamente(cita_id):
    """
    Se llama 15 minutos después de crear una cita.
    Si la cita sigue en PENDIENTE, la confirma automáticamente
    y notifica al cliente por correo.
    """
    # Importamos aquí adentro para evitar problemas de importación circular
    from .models import Cita

    try:
        cita = Cita.objects.get(id=cita_id)
    except Cita.DoesNotExist:
        logger.warning(f"confirmar_cita_automaticamente: Cita {cita_id} no encontrada.")
        return

    if cita.estado != 'PENDIENTE':
        # El barbero ya respondió (confirmó o rechazó). No hacer nada.
        logger.info(f"Cita {cita_id} ya fue respondida ({cita.estado}). No se confirma automáticamente.")
        return

    # Confirmar automáticamente
    cita.estado = 'CONFIRMADA'
    cita.save()
    logger.info(f"Cita {cita_id} confirmada automáticamente por timeout.")

    # Notificar al cliente
    _enviar_correo_confirmacion(cita, automatica=True)

    # Notificar al cliente por PUSH (si tiene cuenta)
    if cita.usuario_id:
        try:
            from push.notify import notify_usuario
            servicios_str = ', '.join(s.nombre for s in cita.servicios.all())
            notify_usuario(
                cita.usuario,
                titulo="Cita confirmada",
                cuerpo=f"Tu cita para {servicios_str} el {cita.fecha.strftime('%d/%m')} ha sido confirmada.",
                url="/cliente/citas"
            )
        except Exception as e:
            logger.error(f"Push de confirmación automática falló: {e}")


@shared_task
def enviar_correo_nueva_cita(cita_id):
    """
    Notifica al barbero cuando llega una nueva solicitud de cita.
    """
    from .models import Cita
    try:
        cita = Cita.objects.get(id=cita_id)
    except Cita.DoesNotExist:
        return

    mensaje = (
        f"Nueva solicitud de cita:\n\n"
        f"Cliente: {cita.cliente_nombre}\n"
        f"Teléfono: {cita.cliente_telefono}\n"
        f"Servicio(s): {', '.join(s.nombre for s in cita.servicios.all())}\n"
        f"Fecha: {cita.fecha.strftime('%d/%m/%Y')}\n"
        f"Hora: {cita.hora_inicio.strftime('%H:%M')}\n"
        f"Dirección: {cita.cliente_direccion}\n"
        f"Notas: {cita.notas or 'Ninguna'}\n\n"
        f"Tienes 15 minutos para responder antes de que se confirme automáticamente."
    )

    try:
        send_mail(
            subject=f"[Jimbar] Nueva cita — {cita.cliente_nombre}",
            message=mensaje,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.BARBER_EMAIL],
            fail_silently=True,
        )
    except Exception as e:
        logger.error(f"Error enviando correo al barbero: {e}")


@shared_task
def enviar_correo_estado_cita(cita_id, nuevo_estado):
    """
    Notifica al cliente cuando el barbero cambia el estado de su cita.
    """
    from .models import Cita
    try:
        cita = Cita.objects.get(id=cita_id)
    except Cita.DoesNotExist:
        return

    if nuevo_estado == 'CONFIRMADA':
        asunto = f"[Jimbar] Tu cita fue confirmada ✅"
        mensaje = (
            f"Hola {cita.cliente_nombre},\n\n"
            f"Tu cita ha sido confirmada:\n\n"
            f"Servicio(s): {', '.join(s.nombre for s in cita.servicios.all())}\n"
            f"Fecha: {cita.fecha.strftime('%d/%m/%Y')}\n"
            f"Hora: {cita.hora_inicio.strftime('%H:%M')}\n"
            f"Dirección: {cita.cliente_direccion}\n\n"
            f"¡Hasta pronto!"
        )
    elif nuevo_estado == 'RECHAZADA':
        asunto = f"[Jimbar] Tu cita no pudo confirmarse"
        mensaje = (
            f"Hola {cita.cliente_nombre},\n\n"
            f"Lamentablemente tu cita del {cita.fecha.strftime('%d/%m/%Y')} "
            f"a las {cita.hora_inicio.strftime('%H:%M')} no pudo ser atendida.\n\n"
            f"Puedes agendar una nueva cita en otro horario disponible."
        )
    else:
        return  # Para otros estados no enviamos correo al cliente

    try:
        send_mail(
            subject=asunto,
            message=mensaje,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[cita.cliente_correo],
            fail_silently=True,
        )
    except Exception as e:
        logger.error(f"Error enviando correo al cliente: {e}")


@shared_task
def enviar_correo_cancelacion_cliente(cita_id):
    """
    Notifica al barbero cuando un cliente cancela su cita.
    """
    from .models import Cita
    try:
        cita = Cita.objects.get(id=cita_id)
    except Cita.DoesNotExist:
        return

    mensaje = (
        f"El cliente {cita.cliente_nombre} canceló su cita:\n\n"
        f"Servicio(s): {', '.join(s.nombre for s in cita.servicios.all())}\n"
        f"Fecha: {cita.fecha.strftime('%d/%m/%Y')}\n"
        f"Hora: {cita.hora_inicio.strftime('%H:%M')}\n"
        f"Teléfono: {cita.cliente_telefono}\n"
    )

    try:
        send_mail(
            subject=f"[Jimbar] Cita cancelada — {cita.cliente_nombre}",
            message=mensaje,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.BARBER_EMAIL],
            fail_silently=True,
        )
    except Exception as e:
        logger.error(f"Error enviando correo de cancelación al barbero: {e}")


def _enviar_correo_confirmacion(cita, automatica=False):
    """Función auxiliar para enviar el correo de confirmación al cliente."""
    nota_auto = " (confirmada automáticamente)" if automatica else ""
    mensaje = (
        f"Hola {cita.cliente_nombre},\n\n"
        f"Tu cita ha sido confirmada{nota_auto}:\n\n"
        f"Servicio(s): {', '.join(s.nombre for s in cita.servicios.all())}\n"
        f"Fecha: {cita.fecha.strftime('%d/%m/%Y')}\n"
        f"Hora: {cita.hora_inicio.strftime('%H:%M')}\n"
        f"Dirección: {cita.cliente_direccion}\n\n"
        f"¡Hasta pronto!"
    )
    try:
        send_mail(
            subject="[Jimbar] Tu cita fue confirmada ✅",
            message=mensaje,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[cita.cliente_correo],
            fail_silently=True,
        )
    except Exception as e:
        logger.error(f"Error enviando correo de confirmación automática: {e}")
