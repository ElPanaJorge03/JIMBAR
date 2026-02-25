from rest_framework import serializers
from django.utils import timezone
from .models import Servicio, Cita, BloqueoDia


class ServicioSerializer(serializers.ModelSerializer):
    """
    Serializer de solo lectura para mostrar los servicios disponibles al cliente.
    """
    precio_formateado = serializers.SerializerMethodField()

    class Meta:
        model = Servicio
        fields = ['id', 'nombre', 'precio', 'precio_formateado', 'duracion_minutos']

    def get_precio_formateado(self, obj):
        return f"${obj.precio:,}"


class CitaCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para que un cliente (registrado o no) cree una cita.
    Solo recibe los campos necesarios. El estado siempre arranca en PENDIENTE.
    """
    class Meta:
        model = Cita
        fields = [
            'servicio',
            'fecha',
            'hora_inicio',
            'cliente_nombre',
            'cliente_telefono',
            'cliente_correo',
            'cliente_direccion',
            'notas',
        ]

    def validate(self, data):
        fecha = data.get('fecha')
        hora_inicio = data.get('hora_inicio')
        servicio = data.get('servicio')

        # 1. No se puede agendar en el pasado
        ahora = timezone.localtime(timezone.now())
        if fecha < ahora.date():
            raise serializers.ValidationError("No puedes agendar una cita en el pasado.")

        # 2. Verificar si el día está bloqueado
        if BloqueoDia.objects.filter(fecha=fecha).exists():
            raise serializers.ValidationError(
                "El barbero no está disponible ese día."
            )

        # 3. Validar horario según día de la semana
        #    0=Lunes ... 4=Viernes, 5=Sábado, 6=Domingo
        dia_semana = fecha.weekday()
        from datetime import time, datetime, timedelta

        hora_apertura = time(7, 0)

        if dia_semana <= 4:  # Lunes a Viernes
            ultima_hora_permitida = time(11, 0)
        else:  # Sábado y Domingo
            ultima_hora_permitida = time(10, 0)

        if hora_inicio < hora_apertura:
            raise serializers.ValidationError("El horario de atención empieza a las 7:00 AM.")

        if hora_inicio > ultima_hora_permitida:
            raise serializers.ValidationError(
                f"La última hora disponible ese día es {ultima_hora_permitida.strftime('%H:%M')} AM."
            )

        # 4. Verificar que el slot no esté ocupado
        #    Una cita ocupa el rango [hora_inicio, hora_fin)
        #    Calculamos la hora_fin de la nueva cita
        inicio_dt = datetime.combine(fecha, hora_inicio)
        fin_dt = inicio_dt + timedelta(minutes=servicio.duracion_minutos)
        hora_fin = fin_dt.time()

        citas_ese_dia = Cita.objects.filter(
            fecha=fecha,
            estado__in=['PENDIENTE', 'CONFIRMADA']
        )

        for cita in citas_ese_dia:
            # Hay conflicto si los rangos se solapan
            if not (hora_fin <= cita.hora_inicio or hora_inicio >= cita.hora_fin):
                raise serializers.ValidationError(
                    f"Ese horario ya está ocupado. "
                    f"Prueba con otro horario disponible."
                )

        return data


class CitaSerializer(serializers.ModelSerializer):
    """
    Serializer completo para que el barbero vea todos los detalles de una cita.
    """
    servicio_nombre = serializers.CharField(source='servicio.nombre', read_only=True)
    servicio_precio = serializers.IntegerField(source='servicio.precio', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Cita
        fields = [
            'id',
            'cliente_nombre',
            'cliente_telefono',
            'cliente_correo',
            'cliente_direccion',
            'servicio',
            'servicio_nombre',
            'servicio_precio',
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
