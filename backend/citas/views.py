import threading
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import datetime, timedelta, time
from .models import Servicio, Cita, BloqueoDia
from .serializers import (
    ServicioSerializer,
    CitaCreateSerializer,
    CitaSerializer,
    CitaEstadoSerializer,
    BloqueoDiaSerializer,
    RegistroClienteSerializer,
)
from .emails import (
    enviar_correo_nueva_cita,
    enviar_correo_estado_cita,
    enviar_correo_cancelacion_cliente,
)


def _en_background(fn, *args):
    """Ejecuta una función en un thread separado para no bloquear el request."""
    t = threading.Thread(target=fn, args=args, daemon=True)
    t.start()


class RegistroClienteView(generics.CreateAPIView):
    """
    POST /api/auth/registro/
    Crea una cuenta de cliente. Devuelve el usuario creado (sin contraseña).
    """
    permission_classes = [AllowAny]
    serializer_class = RegistroClienteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'mensaje': 'Cuenta creada exitosamente.', 'correo': user.email},
            status=status.HTTP_201_CREATED
        )

# ============================================================
# VISTAS PÚBLICAS (sin autenticación)
# ============================================================


class ServicioListView(generics.ListAPIView):
    """
    GET /api/servicios/
    Lista todos los servicios activos. Cualquiera puede verlos.
    """
    permission_classes = [AllowAny]
    serializer_class = ServicioSerializer
    queryset = Servicio.objects.filter(activo=True)


class DisponibilidadView(APIView):
    """
    GET /api/disponibilidad/?fecha=YYYY-MM-DD&servicio_id=1
    Devuelve los slots de tiempo disponibles para una fecha y servicio dados.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        fecha_str = request.query_params.get('fecha')
        servicio_id = request.query_params.get('servicio_id')

        if not fecha_str or not servicio_id:
            return Response(
                {'error': 'Debes enviar los parámetros: fecha (YYYY-MM-DD) y servicio_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Usa YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            servicio = Servicio.objects.get(id=servicio_id, activo=True)
        except Servicio.DoesNotExist:
            return Response({'error': 'Servicio no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if BloqueoDia.objects.filter(fecha=fecha).exists():
            return Response({'disponible': False, 'slots': [], 'motivo': 'Día bloqueado'})

        hoy = timezone.localdate()
        if fecha < hoy:
            return Response({'disponible': False, 'slots': [], 'motivo': 'Fecha pasada'})

        dia_semana = fecha.weekday()
        hora_apertura = time(7, 0)
        # L-V: última cita a las 11:00, cierre 12:00
        # Sáb, Dom: última cita a las 22:00, cierre a medianoche
        ultima_hora_inicio = time(11, 0) if dia_semana <= 4 else time(22, 0)

        citas_activas = Cita.objects.filter(
            fecha=fecha,
            estado__in=['PENDIENTE', 'CONFIRMADA', 'COMPLETADA']
        ).values('hora_inicio', 'hora_fin')

        slots_disponibles = []
        cursor = datetime.combine(fecha, hora_apertura)
        limite = datetime.combine(fecha, ultima_hora_inicio)
        duracion = timedelta(minutes=servicio.duracion_minutos)

        while cursor <= limite:
            slot_inicio = cursor.time()
            slot_fin = (cursor + duracion).time()

            ocupado = any(
                not (slot_fin <= c['hora_inicio'] or slot_inicio >= c['hora_fin'])
                for c in citas_activas
            )

            if not ocupado:
                slots_disponibles.append({
                    'hora_inicio': slot_inicio.strftime('%H:%M'),
                    'hora_fin': slot_fin.strftime('%H:%M'),
                })

            cursor += timedelta(minutes=15)

        return Response({
            'disponible': True,
            'fecha': fecha_str,
            'servicio': servicio.nombre,
            'duracion_minutos': servicio.duracion_minutos,
            'slots': slots_disponibles,
        })


class CitaCreateView(generics.CreateAPIView):
    """
    POST /api/citas/
    Cualquier persona puede crear una cita.
    Después notifica al barbero por email (en background, no bloquea).
    """
    permission_classes = [AllowAny]
    serializer_class = CitaCreateSerializer

    def perform_create(self, serializer):
        cita = serializer.save()

        if self.request.user.is_authenticated:
            cita.usuario = self.request.user
            cita.save()

        # Notificar al barbero en background (si falla el email, la cita ya se guardó)
        _en_background(enviar_correo_nueva_cita, cita.id)


class CitaCancelarView(APIView):
    """
    POST /api/citas/{id}/cancelar/
    El cliente cancela su cita con más de 2 horas de anticipación.
    Se identifica con su correo (no necesita cuenta).
    """
    permission_classes = [AllowAny]

    def post(self, request, pk):
        correo = request.data.get('correo')
        if not correo:
            return Response(
                {'error': 'Debes proporcionar tu correo para cancelar la cita.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            cita = Cita.objects.get(id=pk, cliente_correo=correo)
        except Cita.DoesNotExist:
            return Response(
                {'error': 'Cita no encontrada. Verifica el ID y correo.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if cita.estado not in ['PENDIENTE', 'CONFIRMADA']:
            return Response(
                {'error': f'No puedes cancelar una cita en estado {cita.get_estado_display()}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ahora = timezone.localtime(timezone.now())
        hora_cita = datetime.combine(cita.fecha, cita.hora_inicio)
        hora_cita_aware = timezone.make_aware(hora_cita)
        diferencia = hora_cita_aware - ahora

        if diferencia.total_seconds() < 2 * 3600:
            return Response(
                {'error': (
                    'No puedes cancelar con menos de 2 horas de anticipación. '
                    'Contacta directamente al barbero.'
                )},
                status=status.HTTP_400_BAD_REQUEST
            )

        cita.estado = 'CANCELADA'
        cita.save()

        _en_background(enviar_correo_cancelacion_cliente, cita.id)

        return Response({'mensaje': 'Cita cancelada exitosamente.'})


# ============================================================
# VISTAS DEL BARBERO (requieren autenticación JWT)
# ============================================================

class CitaListView(generics.ListAPIView):
    """
    GET /api/barbero/citas/
    Lista todas las citas. Filtros opcionales: ?estado=PENDIENTE &fecha=YYYY-MM-DD
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CitaSerializer

    def get_queryset(self):
        queryset = Cita.objects.select_related('servicio').all()
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
        fecha = self.request.query_params.get('fecha')
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        return queryset


class CitaDetailView(generics.RetrieveAPIView):
    """GET /api/barbero/citas/{id}/"""
    permission_classes = [IsAuthenticated]
    serializer_class = CitaSerializer
    queryset = Cita.objects.select_related('servicio').all()


class CitaEstadoView(APIView):
    """
    PATCH /api/barbero/citas/{id}/estado/
    El barbero confirma, rechaza o marca como completada una cita.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            cita = Cita.objects.get(id=pk)
        except Cita.DoesNotExist:
            return Response({'error': 'Cita no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CitaEstadoSerializer(cita, data=request.data, partial=True)
        if serializer.is_valid():
            nuevo_estado = serializer.validated_data['estado']
            cita.estado = nuevo_estado
            cita.save()

            _en_background(enviar_correo_estado_cita, cita.id, nuevo_estado)

            return Response(CitaSerializer(cita).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BloqueoDiaListCreateView(generics.ListCreateAPIView):
    """GET + POST /api/barbero/bloqueos/"""
    permission_classes = [IsAuthenticated]
    serializer_class = BloqueoDiaSerializer
    queryset = BloqueoDia.objects.all()


class BloqueoDiaDeleteView(generics.DestroyAPIView):
    """DELETE /api/barbero/bloqueos/{id}/"""
    permission_classes = [IsAuthenticated]
    serializer_class = BloqueoDiaSerializer
    queryset = BloqueoDia.objects.all()
