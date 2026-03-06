from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Barberia(models.Model):
    """
    Representa a un tenant del SaaS. Cada barbería tiene su propio espacio de datos.
    """
    nombre = models.CharField(max_length=150)
    slug = models.SlugField(max_length=150, unique=True, help_text="URL de la barbería: jimbar.vercel.app/slug")
    descripcion = models.TextField(blank=True)
    logo = models.URLField(blank=True, help_text="URL del logo")
    imagen_portada = models.URLField(blank=True, help_text="URL de imagen destacada")
    telefono = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    direccion = models.CharField(max_length=255, blank=True)
    
    activo = models.BooleanField(default=True)
    creada_en = models.DateTimeField(auto_now_add=True)
    actualizada_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Barbería"
        verbose_name_plural = "Barberías"
        ordering = ['-creada_en']

    def __str__(self):
        return f"{self.nombre} ({self.slug})"


class Suscripcion(models.Model):
    """
    Maneja el estado de la suscripción del tenant (Barbería).
    """
    class Estado(models.TextChoices):
        TRIAL = 'TRIAL', 'Prueba (15 días)'
        ACTIVO = 'ACTIVO', 'Pagada y al día'
        GRACIA = 'GRACIA', 'Pago vencido (3 días de gracia)'
        SUSPENDIDO = 'SUSPENDIDO', 'Bloqueada por falta de pago'

    barberia = models.OneToOneField(Barberia, on_delete=models.CASCADE, related_name='suscripcion')
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.TRIAL)
    trial_hasta = models.DateTimeField(null=True, blank=True)
    pagado_hasta = models.DateTimeField(null=True, blank=True)
    creada_en = models.DateTimeField(auto_now_add=True)
    actualizada_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Suscripción"
        verbose_name_plural = "Suscripciones"

    def __str__(self):
        return f"Suscripción de {self.barberia.nombre} - {self.get_estado_display()}"


class PerfilUsuario(models.Model):
    """
    Extiende el modelo User de Django para manejar roles y pertenencia a tenants.
    """
    class Rol(models.TextChoices):
        SUPERADMIN = 'SUPERADMIN', 'Dueño del SaaS'
        BARBERIA_ADMIN = 'BARBERIA_ADMIN', 'Administrador de la barbería'
        BARBERO = 'BARBERO', 'Empleado de la barbería'
        CLIENTE = 'CLIENTE', 'Cliente final'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    role = models.CharField(max_length=20, choices=Rol.choices, default=Rol.CLIENTE)
    barberia = models.ForeignKey(Barberia, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios')

    class Meta:
        verbose_name = "Perfil de Usuario"
        verbose_name_plural = "Perfiles de Usuarios"

    def __str__(self):
        pertenencia = f" | {self.barberia.nombre}" if self.barberia else ""
        return f"{self.user.username} - {self.get_role_display()}{pertenencia}"
