"""
push/views.py — Endpoints para suscribir/desuscribir dispositivos.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import PushSubscription


class SuscribirView(APIView):
    """
    POST /api/push/suscribir/
    Guarda la suscripción push del usuario autenticado.
    También puede usarse sin autenticación (cliente no registrado),
    pero en ese caso no se guardan notificaciones personalizadas.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        endpoint = data.get('endpoint')
        keys = data.get('keys', {})
        p256dh = keys.get('p256dh')
        auth = keys.get('auth')

        if not endpoint or not p256dh or not auth:
            return Response({'error': 'Datos de suscripción incompletos.'}, status=400)

        usuario = request.user if request.user.is_authenticated else None

        obj, created = PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={'p256dh': p256dh, 'auth': auth, 'usuario': usuario}
        )
        return Response({'ok': True, 'created': created}, status=201 if created else 200)


class DesuscribirView(APIView):
    """POST /api/push/desuscribir/ — Elimina la suscripción por endpoint."""
    permission_classes = [AllowAny]

    def post(self, request):
        endpoint = request.data.get('endpoint')
        if not endpoint:
            return Response({'error': 'Falta el endpoint.'}, status=400)
        deleted, _ = PushSubscription.objects.filter(endpoint=endpoint).delete()
        return Response({'ok': True, 'deleted': deleted > 0})
