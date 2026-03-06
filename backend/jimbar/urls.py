from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView as DefaultTokenObtainPairView
from citas.serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(DefaultTokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

urlpatterns = [
    # Panel de administración de Django
    path('admin/', admin.site.urls),

    # ── Autenticación JWT ──────────────────────────────────────
    # POST /api/auth/token/         → login, devuelve access + refresh token
    # POST /api/auth/token/refresh/ → renueva el access token
    path('api/auth/token/', CustomTokenObtainPairView.as_view(), name='token-obtain'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # ── API principal ──────────────────────────────────────────
    path('api/', include('citas.urls')),
    path('api/<slug:slug>/', include('citas.urls')),
]
