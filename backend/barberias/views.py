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
        from rest_framework.exceptions import PermissionDenied
        user = self.request.user

        # Solo roles admin pueden ver/editar el perfil del tenant
        roles_permitidos = ['SUPERADMIN', 'BARBERIA_ADMIN']
        if hasattr(user, 'perfil') and user.perfil.role not in roles_permitidos:
            raise PermissionDenied('No tienes permiso para gestionar una barbería.')
        elif not hasattr(user, 'perfil') and not user.is_staff and not user.is_superuser:
            raise PermissionDenied('No tienes permiso para gestionar una barbería.')

        # Obtener la barbería del perfil del usuario
        if hasattr(user, 'perfil') and user.perfil.barberia:
            return user.perfil.barberia
        # Fallback solo para superadmin Django sin perfil
        from .models import Barberia
        return Barberia.objects.first()

    def perform_update(self, serializer):
        from rest_framework.exceptions import ValidationError
        try:
            serializer.save()
        except Exception as e:
            # Si Cloudinary falla por firma inválida, api_key errónea o caídas
            raise ValidationError({
                'imagen': f'Error al guardar la imagen en la nube. Verifica tus credenciales de Cloudinary. (Detalle: {str(e)})'
            })
