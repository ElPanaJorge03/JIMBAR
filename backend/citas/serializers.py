from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Servicio, Cita, BloqueoDia
from barberias.models import Barberia


class ServicioSerializer(serializers.ModelSerializer):
    """
    Serializer de solo lectura para mostrar los servicios disponibles al cliente.
    """
    precio_formateado = serializers.SerializerMethodField()

    class Meta:
        model = Servicio
        fields = ['id', 'nombre', 'precio', 'precio_formateado', 'duracion_minutos', 'icono', 'activo']

    def get_precio_formateado(self, obj):
        return f"${obj.precio:,}"


class CitaCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para que un cliente (registrado o no) cree una reserva.
    Solo recibe los campos necesarios. El estado siempre arranca en PENDIENTE.
    La dirección es obligatoria solo si la barbería atiende a domicilio o ambos.
    """
    cliente_direccion = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Cita
        fields = [
            'servicios',
            'fecha',
            'hora_inicio',
            'cliente_nombre',
            'cliente_telefono',
            'cliente_correo',
            'cliente_direccion',
            'notas',
        ]

    def validate_cliente_nombre(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Por favor, ingresa un nombre válido más largo.")
        return value

    def validate_cliente_telefono(self, value):
        if len(value.strip()) < 7:
            raise serializers.ValidationError("Por favor, ingresa un número de teléfono válido.")
        return value

    def validate_cliente_direccion(self, value):
        if not value or not value.strip():
            return value
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Por favor, ingresa una dirección válida más detallada.")
        return value

    def validate(self, data):
        fecha = data.get('fecha')
        hora_inicio = data.get('hora_inicio')
        servicios = data.get('servicios')
        correo = data.get('cliente_correo')
        direccion = (data.get('cliente_direccion') or '').strip()

        barberia = self.context.get('barberia')
        if not barberia:
            barberia = Barberia.objects.first()

        # 0. Dirección obligatoria solo si la barbería atiende a domicilio o ambos
        estilo = getattr(barberia, 'estilo_trabajo', None) or 'AMBOS'
        if estilo in ('DOMICILIO', 'AMBOS') and not direccion:
            raise serializers.ValidationError({
                'cliente_direccion': 'Por favor, ingresa la dirección donde deseas recibir el servicio.'
            })
        if estilo == 'PRESENCIAL':
            data['cliente_direccion'] = ''  # No se usa

        # 1. No se puede agendar en el pasado
        ahora = timezone.localtime(timezone.now())
        if fecha < ahora.date():
            raise serializers.ValidationError("No puedes agendar una cita en el pasado.")
            
        # Anti-spam: Máximo 3 citas por día por cliente
        citas_cliente_hoy = Cita.objects.for_tenant(barberia).filter(
            fecha=fecha,
            cliente_correo=correo,
            estado__in=['PENDIENTE', 'CONFIRMADA']
        ).count()
        
        if citas_cliente_hoy >= 3:
            raise serializers.ValidationError({"cliente_correo": "Has alcanzado el límite máximo de 3 citas por día."})

        # 2. Verificar si el día está bloqueado
        if BloqueoDia.objects.for_tenant(barberia).filter(fecha=fecha).exists():
            raise serializers.ValidationError(
                "El barbero no está disponible ese día."
            )

        # 3. Validar horario según día de la semana
        #    0=Lunes ... 4=Viernes, 5=Sábado, 6=Domingo
        dia_semana = fecha.weekday()
        from datetime import time, datetime, timedelta

        hora_apertura = time(7, 0)

        if dia_semana <= 4:  # Lunes a Viernes
            ultima_hora_permitida = time(11, 0)   # última cita 11:00, cierre 12:00
        else:  # Sábado y Domingo
            ultima_hora_permitida = time(22, 0)   # última cita 22:00, cierre medianoche

        if hora_inicio < hora_apertura:
            raise serializers.ValidationError("El horario de atención empieza a las 7:00 AM.")

        if hora_inicio > ultima_hora_permitida:
            raise serializers.ValidationError(
                f"La última hora disponible ese día es {ultima_hora_permitida.strftime('%H:%M')} AM."
            )

        # 4. Verificar que el slot no esté ocupado
        #    Calculamos la hora_fin de la nueva cita sumando la duración de todos los servicios
        duracion_total = sum(s.duracion_minutos for s in servicios) if servicios else 0
        from datetime import datetime, timedelta
        inicio_dt = datetime.combine(fecha, hora_inicio)
        fin_dt = inicio_dt + timedelta(minutes=duracion_total)
        hora_fin = fin_dt.time()

        citas_ese_dia = Cita.objects.for_tenant(barberia).filter(
            fecha=fecha,
            estado__in=['PENDIENTE', 'CONFIRMADA', 'COMPLETADA']
        )

        for cita in citas_ese_dia:
            # Hay conflicto si los rangos se solapan
            if not (hora_fin <= cita.hora_inicio or hora_inicio >= cita.hora_fin):
                raise serializers.ValidationError(
                    f"Ese horario ya está ocupado. "
                    f"Prueba con otro horario disponible."
                )

        return data

    def create(self, validated_data):
        servicios_data = validated_data.pop('servicios', [])
        cita = Cita.objects.create(**validated_data)
        cita.servicios.set(servicios_data)
        
        duracion_total = sum(s.duracion_minutos for s in servicios_data)
        from datetime import datetime, timedelta
        inicio = datetime.combine(cita.fecha, cita.hora_inicio)
        fin = inicio + timedelta(minutes=duracion_total)
        cita.hora_fin = fin.time()
        cita.save()
        return cita


class CitaSerializer(serializers.ModelSerializer):
    """
    Serializer completo para que el barbero vea todos los detalles de una cita.
    """
    servicios = ServicioSerializer(many=True, read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Cita
        fields = [
            'id',
            'cliente_nombre',
            'cliente_telefono',
            'cliente_correo',
            'cliente_direccion',
            'servicios',
            'fecha',
            'hora_inicio',
            'hora_fin',
            'estado',
            'estado_display',
            'notas',
            'creada_en',
            'actualizada_en',
        ]
        read_only_fields = ['hora_fin', 'creada_en', 'actualizada_en', 'estado']


class CitaEstadoSerializer(serializers.ModelSerializer):
    """
    Serializer para que el barbero cambie solo el estado de una cita.
    Ejemplo: PENDIENTE → CONFIRMADA o RECHAZADA.
    """
    class Meta:
        model = Cita
        fields = ['estado']

    def validate_estado(self, value):
        # El barbero solo puede hacer estas transiciones
        estados_validos = ['CONFIRMADA', 'RECHAZADA', 'COMPLETADA']
        if value not in estados_validos:
            raise serializers.ValidationError(
                f"Estado inválido. Opciones permitidas: {', '.join(estados_validos)}"
            )
        return value


class BloqueoDiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloqueoDia
        fields = ['id', 'fecha', 'motivo']


class RegistroClienteSerializer(serializers.ModelSerializer):
    """
    Serializer para que un cliente cree su cuenta.
    Guarda nombre, correo y contraseña (con hash seguro).
    """
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, label='Confirmar contraseña')
    barberia_slug = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['first_name', 'email', 'password', 'password2', 'barberia_slug']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe una cuenta con ese correo.")
        return value.lower()

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Las contraseñas no coinciden.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        barberia_slug = validated_data.pop('barberia_slug', None)
        
        # Usamos el correo como username (único y familiar para el cliente)
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            password=validated_data['password'],
        )
        
        # Vincular a barbería si se proporciona el slug
        barberia_obj = None
        if barberia_slug:
            # Por si el usuario pega la URL completa (ej: jimbar.app/mi-barberia)
            clean_slug = barberia_slug.strip().strip('/').split('/')[-1]
            try:
                barberia_obj = Barberia.objects.get(slug=clean_slug)
            except Barberia.DoesNotExist:
                pass

        # Crear PerfilUsuario con rol CLIENTE
        from barberias.models import PerfilUsuario
        PerfilUsuario.objects.create(
            user=user,
            role=PerfilUsuario.Rol.CLIENTE,
            barberia=barberia_obj
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        user = self.user
        role = 'CLIENTE' # Defecto fallback
        barberia_slug = None
        barberia_nombre = None
        
        if user.is_superuser:
            # Los superusers de Django SIEMPRE son SUPERADMIN del SaaS,
            # independientemente de si tienen PerfilUsuario o no.
            role = 'SUPERADMIN'
            if hasattr(user, 'perfil') and user.perfil.barberia:
                barberia_slug = user.perfil.barberia.slug
                barberia_nombre = user.perfil.barberia.nombre
        elif hasattr(user, 'perfil'):
            role = user.perfil.role
            if user.perfil.barberia:
                barberia_slug = user.perfil.barberia.slug
                barberia_nombre = user.perfil.barberia.nombre
        elif user.is_staff:
            # Staff sin PerfilUsuario → retrocompatibilidad
            role = 'BARBERIA_ADMIN'
            from barberias.models import Barberia
            b = Barberia.objects.first()
            if b:
                barberia_slug = b.slug
                barberia_nombre = b.nombre

        
        # Añadir payload expuesto
        data['role'] = role
        data['barberia_slug'] = barberia_slug
        data['barberia_nombre'] = barberia_nombre
        
        # Opcional pero recomendado para retrocompatibilidad con frontend viejo
        data['is_barbero'] = role in ['SUPERADMIN', 'BARBERIA_ADMIN', 'BARBERO']
        
        return data
