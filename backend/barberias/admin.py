from django.contrib import admin
from .models import Barberia, Suscripcion, PerfilUsuario

@admin.register(Barberia)
class BarberiaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'slug', 'activo', 'creada_en')
    search_fields = ('nombre', 'slug', 'email')
    list_filter = ('activo',)
    prepopulated_fields = {'slug': ('nombre',)}

@admin.register(Suscripcion)
class SuscripcionAdmin(admin.ModelAdmin):
    list_display = ('barberia', 'estado', 'trial_hasta', 'pagado_hasta')
    list_filter = ('estado',)

@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'barberia')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')
