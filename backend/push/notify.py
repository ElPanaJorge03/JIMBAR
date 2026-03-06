"""
push/notify.py — Función central para enviar notificaciones push.
"""
import json
import logging
from django.conf import settings
from .models import PushSubscription

logger = logging.getLogger(__name__)


def _send_one(sub: PushSubscription, payload: dict):
    """Envía una notificación push a una suscripción específica."""
    try:
        from pywebpush import webpush, WebPushException
        webpush(
            subscription_info={
                "endpoint": sub.endpoint,
                "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
            },
            data=json.dumps(payload),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{settings.DEFAULT_FROM_EMAIL}"},
        )
    except Exception as e:
        logger.error(f"Push falló para endpoint {sub.endpoint[:40]}: {e}")
        # Si el endpoint ya no existe (410 Gone), eliminarlo
        if hasattr(e, 'response') and e.response and e.response.status_code in (404, 410):
            sub.delete()
            logger.info("Suscripción eliminada por endpoint inválido.")


def notify_usuario(usuario, titulo, cuerpo, url="/"):
    """Envía push a TODOS los dispositivos de un usuario registrado."""
    subs = PushSubscription.objects.filter(usuario=usuario)
    payload = {"title": titulo, "body": cuerpo, "url": url, "icon": "/favicon.svg"}
    for sub in subs:
        _send_one(sub, payload)


def notify_barberos_de_barberia(barberia, titulo, cuerpo, url="/"):
    """Envía push a todos los usuarios BARBERIA_ADMIN de una barbería."""
    from barberias.models import PerfilUsuario
    admins = PerfilUsuario.objects.filter(
        barberia=barberia, role__in=['BARBERIA_ADMIN', 'SUPERADMIN']
    ).select_related('user')
    for perfil in admins:
        notify_usuario(perfil.user, titulo, cuerpo, url)
