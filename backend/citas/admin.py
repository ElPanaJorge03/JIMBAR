from django.contrib import admin
from .models import Servicio, Cita, BloqueoDia


@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'precio_formateado', 'duracion_minutos', 'activo')
    list_editable = ('activo',)
    list_filter = ('activo',)

    def precio_formateado(self, obj):
        return f"${obj.precio:,}"
    precio_formateado.short_description = "Precio"


@admin.register(BloqueoDia)
class BloqueoDiaAdmin(admin.ModelAdmin):
    list_display = ('fecha', 'motivo', 'creado_en')
    ordering = ('fecha',)


@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = (
        'cliente_nombre', 'fecha',
        'hora_inicio', 'hora_fin', 'estado', 'creada_en'
    )
    list_filter = ('estado', 'fecha', 'servicios')
    search_fields = ('cliente_nombre', 'cliente_correo', 'cliente_telefono')
    ordering = ('-fecha', '-hora_inicio')
    readonly_fields = ('hora_fin', 'creada_en', 'actualizada_en')

    # Acciones rápidas desde el admin
    actions = ['confirmar_citas', 'rechazar_citas', 'marcar_completadas']

    def confirmar_citas(self, request, queryset):
        queryset.filter(estado='PENDIENTE').update(estado='CONFIRMADA')
        self.message_user(request, "Citas confirmadas.")
    confirmar_citas.short_description = "✅ Confirmar citas seleccionadas"

    def rechazar_citas(self, request, queryset):
        queryset.filter(estado='PENDIENTE').update(estado='RECHAZADA')
        self.message_user(request, "Citas rechazadas.")
    rechazar_citas.short_description = "❌ Rechazar citas seleccionadas"

    def marcar_completadas(self, request, queryset):
        queryset.filter(estado='CONFIRMADA').update(estado='COMPLETADA')
        self.message_user(request, "Citas marcadas como completadas.")
    marcar_completadas.short_description = "✔ Marcar como completadas"
