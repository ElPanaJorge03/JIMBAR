from django.db import models
from django.contrib.auth.models import User
from barberias.models import Barberia

class TenantManager(models.Manager):
    def for_tenant(self, barberia):
        return self.get_queryset().filter(barberia=barberia)


class Servicio(models.Model):
    """
    Catálogo de servicios del barbero.
    El barbero puede gestionar esto desde el admin de Django.
    """
    nombre = models.CharField(max_length=100)
    precio = models.IntegerField(help_text="Precio en pesos colombianos")
    duracion_minutos = models.IntegerField(help_text="Duración del servicio en minutos")
    icono = models.CharField(max_length=50, blank=True, help_text="Nombre del icono Lucide (ej: scissors, user, star)")
    activo = models.BooleanField(default=True, help_text="Si está en False, no aparece al cliente")
    barberia = models.ForeignKey(Barberia, on_delete=models.CASCADE, null=True, related_name='servicios')

    objects = TenantManager()

    class Meta:
        verbose_name = "Servicio"
        verbose_name_plural = "Servicios"
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} — ${self.precio:,} ({self.duracion_minutos} min)"


class BloqueoDia(models.Model):
    """
    El barbero puede bloquear un día completo (vacaciones, imprevistos, etc.)
    """
    fecha = models.DateField()
    motivo = models.CharField(max_length=200, blank=True, help_text="Opcional: razón del bloqueo")
    creado_en = models.DateTimeField(auto_now_add=True)
    barberia = models.ForeignKey(Barberia, on_delete=models.CASCADE, null=True, related_name='bloqueos')

    objects = TenantManager()

    class Meta:
        verbose_name = "Bloqueo de día"
        verbose_name_plural = "Bloqueos de días"
        ordering = ['fecha']
        constraints = [
            models.UniqueConstraint(
                fields=['fecha', 'barberia'],
                name='unique_bloqueo_por_barberia'
            )
        ]

    def __str__(self):
        return f"Bloqueado: {self.fecha} — {self.motivo or 'Sin motivo especificado'}"


class Cita(models.Model):
    """
    Cita agendada por un cliente.

    La cita guarda los datos del cliente directamente (nombre, teléfono, etc.)
    para soportar tanto clientes registrados como no registrados.
    Si el cliente tiene cuenta, se vincula con 'usuario' (opcional).
    """

    class Estado(models.TextChoices):
        PENDIENTE  = 'PENDIENTE',  'Pendiente'
        CONFIRMADA = 'CONFIRMADA', 'Confirmada'
        RECHAZADA  = 'RECHAZADA',  'Rechazada'
        CANCELADA  = 'CANCELADA',  'Cancelada'
        COMPLETADA = 'COMPLETADA', 'Completada'

    # Vínculo opcional con usuario registrado
    usuario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='citas',
        help_text="Si el cliente tiene cuenta, se vincula aquí. Opcional."
    )

    # Datos del cliente (siempre se guardan, con o sin cuenta)
    cliente_nombre    = models.CharField(max_length=150)
    cliente_telefono  = models.CharField(max_length=20)
    cliente_correo    = models.EmailField()
    cliente_direccion = models.TextField(help_text="Dirección donde el barbero va a atender")

    # Servicios y horario
    servicios   = models.ManyToManyField(Servicio, related_name='citas')
    fecha       = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin    = models.TimeField(null=True, blank=True)  # Calculado después en views o serializers

    barberia = models.ForeignKey(Barberia, on_delete=models.CASCADE, null=True, related_name='citas_lista')
    objects = TenantManager()

    # Estado de la cita
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDIENTE
    )

    # Campos de auditoría
    creada_en        = models.DateTimeField(auto_now_add=True)
    actualizada_en   = models.DateTimeField(auto_now=True)

    # Notas adicionales del cliente (opcional)
    notas = models.TextField(blank=True, help_text="Indicaciones especiales del cliente")

    class Meta:
        verbose_name = "Cita"
        verbose_name_plural = "Citas"
        ordering = ['fecha', 'hora_inicio']
        # Evita citas duplicadas en el mismo horario
        constraints = [
            models.UniqueConstraint(
                fields=['fecha', 'hora_inicio', 'barberia'],
                condition=~models.Q(estado__in=['RECHAZADA', 'CANCELADA']),
                name='unique_cita_activa_por_horario'
            )
        ]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.cliente_nombre} "
            f"el {self.fecha} a las {self.hora_inicio.strftime('%H:%M')} "
            f"[{self.get_estado_display()}]"
        )
