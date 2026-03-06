from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import RegistroBarberiaSerializer, BarberiaSerializer
from django.db import transaction


class RegistroBarberiaView(generics.CreateAPIView):
    """
    POST /api/auth/registro-barberia/
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

        return Response({
            'mensaje': '¡Bienvenido a Jimbar! Tu barbería fue creada con éxito.',
            'datos': resultado
        }, status=status.HTTP_201_CREATED)


class BarberiaPerfilView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/mi-barberia/  → lee el perfil del tenant del usuario logueado
    PATCH /api/mi-barberia/ → edita nombre, descripcion, logo, etc.
    Solo accesible para BARBERIA_ADMIN o SUPERADMIN.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BarberiaSerializer
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        user = self.request.user
        # Obtener la barbería del perfil del usuario
        if hasattr(user, 'perfil') and user.perfil.barberia:
            return user.perfil.barberia
        # Fallback para superadmin sin perfil
        from .models import Barberia
        return Barberia.objects.first()
