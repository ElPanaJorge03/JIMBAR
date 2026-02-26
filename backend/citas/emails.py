"""
emails.py — Funciones de envío de correo para Jimbar.

Se llaman desde las views en un thread background.
Si el email falla (credenciales no configuradas, etc.),
el error queda en el log pero NO rompe la respuesta al cliente.
"""
import logging
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
import json
import urllib.request

logger = logging.getLogger(__name__)

def _generar_html(titulo, contenido_html):
    """Envuelve el contenido del correo en una plantilla HTML profesional estilo Jimbar."""
    return f"""
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #111111; padding: 30px 10px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 10px; border: 1px solid #333333;">
          <h1 style="color: #c9a75d; text-align: center; margin-top: 0;font-size: 28px; letter-spacing: 2px;">JIMBAR</h1>
          <h2 style="color: #ffffff; font-weight: normal; margin-bottom: 25px; border-bottom: 1px solid #333; padding-bottom: 10px;">{titulo}</h2>
          <div style="line-height: 1.6; color: #cccccc; font-size: 16px;">
            {contenido_html}
          </div>
          <hr style="border: none; border-top: 1px solid #333333; margin: 30px 0 20px 0;" />
          <p style="text-align: center; color: #666666; font-size: 12px; margin: 0;">© Jimbar Barbería Automática</p>
        </div>
      </body>
    </html>
    """

def _get_cita(cita_id):
    from .models import Cita
    try:
        return Cita.objects.select_related('servicio').get(id=cita_id)
    except Cita.DoesNotExist:
        logger.warning(f"Email: cita {cita_id} no encontrada.")
        return None

def enviar_correo_recuperar_password(email, nombre, url_reset):
    """Envía un enlace de recuperación de contraseña."""
    asunto = "[Jimbar] Recupera tu contraseña"
    mensaje = (
        f"Hola {nombre},\n\n"
        f"Hemos recibido una solicitud para restablecer tu contraseña.\n"
        f"Haz clic en el siguiente enlace para crear una nueva contraseña:\n\n"
        f"{url_reset}\n\n"
        f"Si no solicitaste este cambio, ignora este correo.\n\n"
        f"¡Gracias!"
    )
    
    btn_html = f"""
    <div style="text-align: center; margin-top: 25px; margin-bottom: 25px;">
        <a href="{url_reset}" style="background-color: #c9a75d; color: #111; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Restablecer Contraseña</a>
    </div>
    """
    
    html_mensaje = _generar_html(
        "Recuperación de Contraseña",
        mensaje.replace('\n', '<br>').replace(f"{url_reset}<br><br>", btn_html)
    )
    
    _enviar(asunto=asunto, mensaje=mensaje, destinatarios=[email], html_mensaje=html_mensaje)


def enviar_correo_nueva_cita(cita_id, origen_url=None):
    """Notifica al barbero cuando llega una nueva solicitud, y también al cliente enseñándole a cancelar."""
    cita = _get_cita(cita_id)
    if not cita:
        return

    # === AL BARBERO ===
    mensaje_barbero = (
        f"Nueva solicitud de cita:\n\n"
        f"Cliente: {cita.cliente_nombre}\n"
        f"Teléfono: {cita.cliente_telefono}\n"
        f"Servicio: {cita.servicio.nombre}\n"
        f"Fecha: {cita.fecha.strftime('%d/%m/%Y')}\n"
        f"Hora: {cita.hora_inicio.strftime('%H:%M')}\n"
        f"Dirección: {cita.cliente_direccion}\n"
        f"Notas: {cita.notas or 'Ninguna'}\n\n"
        f"Tienes {settings.AUTO_CONFIRM_MINUTES} minutos para confirmar."
    )
    html_barbero = _generar_html(
        "Nueva Cita Solicitada",
        mensaje_barbero.replace('\n', '<br>')
    )
    _enviar(
        asunto=f"[Jimbar] Nueva cita — {cita.cliente_nombre}",
        mensaje=mensaje_barbero,
        destinatarios=[settings.BARBER_EMAIL],
        html_mensaje=html_barbero
    )

    # === AL CLIENTE ===
    mensaje_cliente = (
        f"Hola {cita.cliente_nombre},\n\n"
        f"Hemos recibido tu solicitud de cita para el servicio de '{cita.servicio.nombre}'.\n\n"
        f"Detalles:\n"
        f"Fecha: {cita.fecha.strftime('%d/%m/%Y')}\n"
        f"Hora: {cita.hora_inicio.strftime('%H:%M')}\n\n"
        f"El barbero revisará tu solicitud y te confirmará por este mismo medio en breve.\n\n"
    )
    
    html_cliente = mensaje_cliente.replace('\n', '<br>')
    
    if origen_url:
        mensaje_cliente += f"Ingresa aquí en cualquier momento para cancelar:\n{origen_url}/cancelar/{cita_id}\n\n"
        btn_cancelar = f"""
        <div style="text-align: center; margin-top: 25px;">
            <a href="{origen_url}/cancelar/{cita_id}" style="background-color: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; border: 1px solid #444;">Modificar o Cancelar Cita</a>
        </div>
        <br>
        """
        html_cliente += btn_cancelar
        
    mensaje_cliente += "¡Gracias por preferir Jimbar!"
    html_cliente += "¡Gracias por preferir Jimbar!"

    _enviar(
        asunto=f"[Jimbar] Solicitud de cita en revisión ⏳",
        mensaje=mensaje_cliente,
        destinatarios=[cita.cliente_correo],
        html_mensaje=_generar_html("Solicitud en Revisión", html_cliente)
    )

def enviar_correo_estado_cita(cita_id, nuevo_estado):
    """Notifica al cliente cuando el barbero cambia el estado de su cita."""
    cita = _get_cita(cita_id)
    if not cita:
        return

    titulo_html = ""
    if nuevo_estado == 'CONFIRMADA':
        asunto = "[Jimbar] Tu cita fue confirmada ✅"
        titulo_html = "Cita Confirmada"
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
        titulo_html = "Cita no confirmada"
        mensaje = (
            f"Hola {cita.cliente_nombre},\n\n"
            f"Lamentablemente tu cita del {cita.fecha.strftime('%d/%m/%Y')} "
            f"a las {cita.hora_inicio.strftime('%H:%M')} no pudo ser atendida.\n\n"
            f"Puedes agendar una nueva cita en otro horario disponible."
        )
    elif nuevo_estado == 'COMPLETADA':
        asunto = "[Jimbar] ¡Gracias por tu visita! 💇‍♂️"
        titulo_html = "Servicio Completado"
        mensaje = (
            f"Hola {cita.cliente_nombre},\n\n"
            f"Tu cita ha sido marcada como completada. Esperamos "
            f"que te haya encantado el servicio de '{cita.servicio.nombre}'.\n\n"
            f"¡Vuelve pronto a Jimbar!"
        )
    else:
        return

    _enviar(
        asunto=asunto, 
        mensaje=mensaje, 
        destinatarios=[cita.cliente_correo],
        html_mensaje=_generar_html(titulo_html, mensaje.replace('\n', '<br>'))
    )


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
        html_mensaje=_generar_html("Cita Cancelada", mensaje.replace('\n', '<br>'))
    )

def _enviar(asunto, mensaje, destinatarios, html_mensaje=None):
    """Función base de envío. Captura cualquier error sin romper el flujo."""
    # 1. Intento por Google Apps Script (Nuestra opción maestra)
    apps_script_url = getattr(settings, 'GOOGLE_APPS_SCRIPT_URL', None)
    if apps_script_url:
        for dest in destinatarios:
            try:
                payload = {
                    "to": dest,
                    "subject": asunto,
                    "body": mensaje,
                    "htmlBody": html_mensaje if html_mensaje else mensaje
                }
                req = urllib.request.Request(
                    apps_script_url, 
                    data=json.dumps(payload).encode('utf-8'), 
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req) as response:
                    logger.info(f"Email enviado vía Google Apps Script a {dest}: {response.status}")
            except Exception as e:
                logger.error(f"Error enviando vía Apps Script a {dest}: {e}")
        return

    # 2. Intento por Brevo
    brevo_key = getattr(settings, 'BREVO_API_KEY', None)
    if brevo_key:
        try:
            url = "https://api.brevo.com/v3/smtp/email"
            payload = {
                "sender": {
                    "email": settings.DEFAULT_FROM_EMAIL,
                    "name": "Jimbar"
                },
                "to": [{"email": dest} for dest in destinatarios],
                "subject": asunto,
                "textContent": mensaje
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={
                "api-key": brevo_key,
                "accept": "application/json",
                "content-type": "application/json"
            })
            with urllib.request.urlopen(req) as response:
                logger.info(f"Email HTTP enviado vía Brevo: {asunto} → {destinatarios} Status: {response.status}")
        except Exception as e:
            logger.error(f"Error enviando email vía Brevo API: {e}")
        return
            
    # 3. Fallback al SMTP clásico (Bloqueado en Railway Free)
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
