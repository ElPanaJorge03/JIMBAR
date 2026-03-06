"""
push/models.py — Almacena las suscripciones push de cada usuario.
"""
from django.db import models
from django.contrib.auth.models import User


class PushSubscription(models.Model):
    """
    Guarda la suscripción Web Push de un usuario.
    Un usuario puede tener varias (móvil, PC, tablet...).
    """
    usuario = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True,
        related_name='push_subscriptions',
        help_text="Null = cliente no registrado (solo barbero-admin)"
    )
    # Identificador único del endpoint del navegador/dispositivo
    endpoint = models.TextField(unique=True)
    p256dh   = models.TextField()   # Clave pública del cliente
    auth     = models.TextField()   # Auth secret

    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Suscripción Push"
        verbose_name_plural = "Suscripciones Push"

    def __str__(self):
        name = self.usuario.username if self.usuario else "anónimo"
        return f"Push [{name}] — {self.endpoint[:40]}..."
