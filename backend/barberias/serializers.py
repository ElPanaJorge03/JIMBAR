from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils.text import slugify
from .models import Barberia, Suscripcion, PerfilUsuario
from django.db import transaction

class RegistroBarberiaSerializer(serializers.Serializer):
    """
    Serializer para el onboarding de una nueva Barbería (Tenant).
    Crea el User, PerfilUsuario, Barberia y Suscripcion en TRIAL de 15 días.
    """
    # Datos de usuario (Admin de la barbería)
    admin_nombre = serializers.CharField(max_length=150)
    admin_email = serializers.EmailField()
    admin_password = serializers.CharField(write_only=True, min_length=6)
    
    # Datos de la barbería (Tenant)
    barberia_nombre = serializers.CharField(max_length=150)
    barberia_slug = serializers.SlugField(max_length=150, required=False)
    barberia_estilo_trabajo = serializers.ChoiceField(
        choices=['PRESENCIAL', 'DOMICILIO', 'AMBOS'],
        default='AMBOS',
        required=False,
        help_text="Estilo de trabajo: PRESENCIAL (solo en local), DOMICILIO (solo a domicilio), AMBOS."
    )

    def validate_admin_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo ya está registrado.")
        return value.lower()
        
    def validate_barberia_slug(self, value):
        if Barberia.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Ese nombre de enlace (slug) ya está en uso. Intenta otro.")
        return value

    def create(self, validated_data):
        with transaction.atomic():
            # 1. Crear usuario Django
            user = User.objects.create_user(
                username=validated_data['admin_email'],
                email=validated_data['admin_email'],
                first_name=validated_data['admin_nombre'],
                password=validated_data['admin_password'],
            )

            # 2. Determinar slug (generar de barberia_nombre si no se provee)
            slug = validated_data.get('barberia_slug')
            if not slug:
                slug = slugify(validated_data['barberia_nombre'])
                # Manejar colisiones básicas en auto-generación
                original_slug = slug
                counter = 1
                while Barberia.objects.filter(slug=slug).exists():
                    slug = f"{original_slug}-{counter}"
                    counter += 1

            # 3. Crear Barbería
            estilo = (validated_data.get('barberia_estilo_trabajo') or 'AMBOS').upper()
            barberia = Barberia.objects.create(
                nombre=validated_data['barberia_nombre'],
                slug=slug,
                email=validated_data['admin_email'],
                estilo_trabajo=estilo,
            )

            # 4. Crear PerfilUsuario ligado al admin y la barbería
            PerfilUsuario.objects.create(
                user=user,
                role=PerfilUsuario.Rol.BARBERIA_ADMIN,
                barberia=barberia
            )

            # 5. Crear Suscripción (automáticamente entra en TRIAL por default)
            from datetime import timedelta
            from django.utils import timezone
            
            # 15 días de prueba a partir de ahora, hora local
            trial_hasta = timezone.localtime(timezone.now()) + timedelta(days=15)
            Suscripcion.objects.create(
                barberia=barberia,
                estado=Suscripcion.Estado.TRIAL,
                trial_hasta=trial_hasta
            )

            return {
                'barberia_slug': barberia.slug,
                'barberia_nombre': barberia.nombre,
                'admin_email': user.email
            }


class BarberiaSerializer(serializers.ModelSerializer):
    """
    Serializer para que el BARBERIA_ADMIN vea y edite
    el perfil público de su propia barbería.
    """
    suscripcion_estado = serializers.SerializerMethodField()
    suscripcion_trial_hasta = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()
    imagen_portada_url = serializers.SerializerMethodField()

    class Meta:
        model = Barberia
        fields = [
            'id', 'nombre', 'slug', 'descripcion', 'estilo_trabajo',
            'logo', 'logo_url', 'imagen_portada', 'imagen_portada_url',
            'telefono', 'email', 'direccion',
            'activo', 'creada_en',
            'hora_apertura_semana', 'hora_cierre_semana',
            'abre_fines_de_semana', 'hora_apertura_finde', 'hora_cierre_finde',
            'suscripcion_estado', 'suscripcion_trial_hasta',
        ]
        read_only_fields = ['id', 'slug', 'activo', 'creada_en', 'suscripcion_estado', 'suscripcion_trial_hasta', 'logo_url', 'imagen_portada_url']

    def _cloudinary_url(self, field_value):
        """Convierte un CloudinaryResource o string a URL https completa."""
        if not field_value:
            return None
        try:
            # CloudinaryField almacena el public_id; build_url() da la URL completa
            url = str(field_value.url) if hasattr(field_value, 'url') else str(field_value)
            # Asegurar https
            if url.startswith('http://'):
                url = url.replace('http://', 'https://', 1)
            return url
        except Exception:
            return None

    def get_logo_url(self, obj):
        return self._cloudinary_url(obj.logo)

    def get_imagen_portada_url(self, obj):
        return self._cloudinary_url(obj.imagen_portada)

    def get_suscripcion_estado(self, obj):
        try:
            return obj.suscripcion.estado
        except Exception:
            return None

    def get_suscripcion_trial_hasta(self, obj):
        try:
            t = obj.suscripcion.trial_hasta
            return t.strftime('%d de %B de %Y') if t else None
        except Exception:
            return None
