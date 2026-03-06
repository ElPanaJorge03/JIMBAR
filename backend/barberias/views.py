from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import RegistroBarberiaSerializer
from django.db import transaction

class RegistroBarberiaView(generics.CreateAPIView):
    """
    POST /api/onboarding/
    Endpoint ultra crítico de negocio. Registra una nueva Barbería,
    crea a su dueño (BARBERIA_ADMIN) y le asigna 15 días de Trial GRATIS.
    """
    permission_classes = [AllowAny]
    serializer_class = RegistroBarberiaSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resultado = serializer.save()

        # TODO: Enviar email de bienvenida al SaaS con las instrucciones.

        return Response({
            'mensaje': '¡Bienvenido a Jimbar! Tu barbería fue creada con éxito.',
            'datos': resultado
        }, status=status.HTTP_201_CREATED)
