from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Panel de administración de Django
    path('admin/', admin.site.urls),

    # ── Autenticación JWT ──────────────────────────────────────
    # POST /api/auth/token/         → login, devuelve access + refresh token
    # POST /api/auth/token/refresh/ → renueva el access token
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token-obtain'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # ── API principal ──────────────────────────────────────────
    path('api/', include('citas.urls')),
]
