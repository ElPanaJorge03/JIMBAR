from django.urls import path
from . import views

urlpatterns = [
    # ── Onboarding de nuevas Barberías (SaaS) ───────────────────────────
    path('auth/registro-barberia/', views.RegistroBarberiaView.as_view(), name='registro-barberia'),
]
