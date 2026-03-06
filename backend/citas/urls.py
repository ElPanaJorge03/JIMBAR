from django.urls import path
from . import views

urlpatterns = [
    # ── Auth cliente ───────────────────────────────────────────
    path('auth/registro/', views.RegistroClienteView.as_view(), name='registro-cliente'),
    
    # ── Auth y contraseña ──────────────────────────────────────
    path('auth/cambiar-password/', views.CambiarPasswordView.as_view(), name='cambiar-password'),
    path('auth/recuperar-password/', views.SolicitarRestaurarPasswordView.as_view(), name='recuperar-password'),
    path('auth/reset-password/', views.RestaurarPasswordView.as_view(), name='reset-password'),

    # ── Área del Cliente Autenticado ───────────────────────────
    path('cliente/citas/', views.CitaClienteListView.as_view(), name='cliente-cita-list'),


    # ── Públicas ──────────────────────────────────────────────
    # Info de la barberia
    path('info/', views.BarberiaInfoView.as_view(), name='barberia-info'),

    # Lista de servicios disponibles
    path('servicios/', views.ServicioListView.as_view(), name='servicio-list'),

    # Slots disponibles: /api/disponibilidad/?fecha=2025-03-15&servicio_id=1
    path('disponibilidad/', views.DisponibilidadView.as_view(), name='disponibilidad'),

    # Crear una nueva cita (cualquier cliente, con o sin cuenta)
    path('citas/', views.CitaCreateView.as_view(), name='cita-create'),

    # Cancelar una cita (cliente la identifica con su correo)
    path('citas/<int:pk>/cancelar/', views.CitaCancelarView.as_view(), name='cita-cancelar'),

    # ── Barbero (requieren JWT) ────────────────────────────────
    # Ver todas las citas con filtros opcionales
    path('barbero/citas/', views.CitaListView.as_view(), name='barbero-cita-list'),

    # Ver detalle de una cita
    path('barbero/citas/<int:pk>/', views.CitaDetailView.as_view(), name='barbero-cita-detail'),

    # Cambiar estado de una cita (confirmar / rechazar / completar)
    path('barbero/citas/<int:pk>/estado/', views.CitaEstadoView.as_view(), name='barbero-cita-estado'),

    # Gestionar días bloqueados
    path('barbero/bloqueos/', views.BloqueoDiaListCreateView.as_view(), name='barbero-bloqueo-list'),
    path('barbero/bloqueos/<int:pk>/', views.BloqueoDiaDeleteView.as_view(), name='barbero-bloqueo-delete'),
]
