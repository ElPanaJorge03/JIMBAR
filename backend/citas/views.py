import threading
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import datetime, timedelta, time
from django.db.models import Q
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.shortcuts import get_object_or_404
from barberias.models import Barberia
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
    """Ejecuta una función en un thread separado para no bloquear el request.
    Necesario aquí porque si falla el email o hace timeout, no crashea la API."""
    t = threading.Thread(target=fn, args=args, daemon=True)
    t.start()


class TenantMixin:
    """
    Resuelve el tenant (Barberia) de estas formas, en orden:
    1. Si hay 'slug' en la URL → usa ese.
    2. Si el usuario está autenticado y tiene PerfilUsuario.barberia → usa esa.
    3. Fallback: primera barbería (compatibilidad fase 1).
    """
    def get_barberia(self):
        slug = self.kwargs.get('slug')
        if slug:
            return get_object_or_404(Barberia, slug=slug)

        # Intentar resolver desde el usuario autenticado
        user = getattr(self, 'request', None) and self.request.user
        if user and user.is_authenticated and not user.is_anonymous:
            from barberias.models import PerfilUsuario
            try:
                perfil = user.perfil
                if perfil.barberia:
                    return perfil.barberia
            except Exception:
                pass

        return Barberia.objects.first()

    def get_queryset(self):
        qs = super().get_queryset()
        if hasattr(qs, 'for_tenant'):
            return qs.for_tenant(self.get_barberia())
        return qs


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


class CambiarPasswordView(APIView):
    """
    POST /api/auth/cambiar-password/
    Permite al barbero o cliente cambiar su contraseña actual.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({'error': 'Debes proveer la contraseña actual y la nueva.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({'error': 'La contraseña actual es incorrecta.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'mensaje': 'Contraseña actualizada con éxito.'})


class SolicitarRestaurarPasswordView(APIView):
    """
    POST /api/auth/recuperar-password/
    Genera un token y envía un correo con el link de restauración.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Debes proporcionar tu correo.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Replicamos exito para no revelar si el correo existe o no
            return Response({'mensaje': 'Si el correo existe, te enviaremos el enlace de recuperación.'})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        origen_url = request.META.get('HTTP_ORIGIN', '')
        if origen_url:
            reset_url = f"{origen_url}/restaurar-password/{uid}/{token}"
            _en_background(
                __import__('citas.emails').emails.enviar_correo_recuperar_password,
                user.email,
                user.first_name or user.username,
                reset_url
            )
        
        return Response({'mensaje': 'Si el correo existe, te enviaremos el enlace de recuperación.'})


class RestaurarPasswordView(APIView):
    """
    POST /api/auth/reset-password/
    Recepta el uid, token y la nueva contraseña para aplicarla.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not uidb64 or not token or not new_password:
            return Response({'error': 'Faltan datos.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Enlace inválido o expirado.'}, status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({'mensaje': 'Contraseña restablecida correctamente.'})
        else:
            return Response({'error': 'Enlace inválido o expirado.'}, status=status.HTTP_400_BAD_REQUEST)

# ============================================================
# VISTAS PÚBLICAS (sin autenticación)
# ============================================================

class BarberiaInfoView(TenantMixin, APIView):
    """
    GET /api/<slug>/info/
    Devuelve la información pública de la barbería para su Portal Público.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        barberia = self.get_barberia()

        def _url(field):
            if not field:
                return None
            try:
                url = str(field.url) if hasattr(field, 'url') else str(field)
                return url.replace('http://', 'https://', 1) if url.startswith('http://') else url
            except Exception:
                return None

        return Response({
            'nombre': barberia.nombre,
            'slug': barberia.slug,
            'descripcion': barberia.descripcion,
            'logo': _url(barberia.logo),
            'imagen_portada': _url(barberia.imagen_portada),
            'telefono': barberia.telefono,
            'direccion': barberia.direccion,
        })



class ServicioListView(TenantMixin, generics.ListAPIView):
    """
    GET /api/servicios/ o /api/<slug>/servicios/
    Lista todos los servicios activos. Cualquiera puede verlos.
    """
    permission_classes = [AllowAny]
    serializer_class = ServicioSerializer
    
    def get_queryset(self):
        return Servicio.objects.for_tenant(self.get_barberia()).filter(activo=True)


class DisponibilidadView(TenantMixin, APIView):
    """
    GET /api/disponibilidad/?fecha=YYYY-MM-DD&servicio_id=1
    Devuelve los slots de tiempo disponibles para una fecha y servicio dados.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        fecha_str = request.query_params.get('fecha')
        servicios_ids_str = request.query_params.get('servicios_ids')

        if not fecha_str or not servicios_ids_str:
            return Response(
                {'error': 'Debes enviar los parámetros: fecha (YYYY-MM-DD) y servicios_ids (comma-separated)'},
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
            servicios_ids = [int(sid) for sid in servicios_ids_str.split(',')]
            servicios = Servicio.objects.for_tenant(self.get_barberia()).filter(id__in=servicios_ids, activo=True)
            if not servicios.exists() or len(servicios) != len(servicios_ids):
                return Response({'error': 'Alguno de los servicios no existe o no está activo'}, status=status.HTTP_404_NOT_FOUND)
            duracion_total_minutos = sum(s.duracion_minutos for s in servicios)
        except ValueError:
            return Response({'error': 'Formato de servicios_ids inválido'}, status=status.HTTP_400_BAD_REQUEST)

        if BloqueoDia.objects.for_tenant(self.get_barberia()).filter(fecha=fecha).exists():
            return Response({'disponible': False, 'slots': [], 'motivo': 'Día bloqueado'})

        hoy = timezone.localdate()
        if fecha < hoy:
            return Response({'disponible': False, 'slots': [], 'motivo': 'Fecha pasada'})

        barberia = self.get_barberia()
        dia_semana = fecha.weekday()
        
        if dia_semana <= 4:  # Lunes a Viernes
            hora_apertura = barberia.hora_apertura_semana
            hora_cierre = barberia.hora_cierre_semana
        else:  # Sábado o Domingo
            if not barberia.abre_fines_de_semana:
                return Response({'disponible': False, 'slots': [], 'motivo': 'Cerrado fines de semana'})
            hora_apertura = barberia.hora_apertura_finde
            hora_cierre = barberia.hora_cierre_finde

        citas_activas = Cita.objects.for_tenant(self.get_barberia()).filter(
            fecha=fecha,
            estado__in=['PENDIENTE', 'CONFIRMADA', 'COMPLETADA']
        ).values('hora_inicio', 'hora_fin')

        slots_disponibles = []
        cursor = datetime.combine(fecha, hora_apertura)
        limite = datetime.combine(fecha, hora_cierre)
        duracion = timedelta(minutes=duracion_total_minutos)

        while (cursor + duracion) <= limite:
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
            'servicios': [s.nombre for s in servicios],
            'duracion_minutos': duracion_total_minutos,
            'slots': slots_disponibles,
        })


class CitaCreateView(TenantMixin, generics.CreateAPIView):
    """
    POST /api/citas/ o /api/<slug>/citas/
    Cualquier persona puede crear una cita.
    Después notifica al barbero por email (en background, no bloquea).
    """
    permission_classes = [AllowAny]
    serializer_class = CitaCreateSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['barberia'] = self.get_barberia()
        return context

    def perform_create(self, serializer):
        barberia = self.get_barberia()
        cita = serializer.save(barberia=barberia)

        if self.request.user.is_authenticated:
            cita.usuario = self.request.user
            cita.save()

        # Notificar al barbero por email (background)
        origen_url = self.request.META.get('HTTP_ORIGIN', '')
        _en_background(enviar_correo_nueva_cita, cita.id, origen_url)

        # Notificar al barbero por PUSH
        try:
            from push.notify import notify_barberos_de_barberia
            servicios_str = ', '.join(s.nombre for s in cita.servicios.all())
            notify_barberos_de_barberia(
                barberia,
                titulo="Nueva cita agendada",
                cuerpo=f"{cita.cliente_nombre} — {servicios_str} — {cita.fecha.strftime('%d/%m')} {cita.hora_inicio.strftime('%H:%M')}",
                url="/barbero/citas"
            )
        except Exception as e:
            import logging; logging.getLogger(__name__).error(f"Push al barbero falló: {e}")

        # Programar recordatorio 1.5h antes para barbero y cliente
        try:
            from citas.tasks import enviar_recordatorio_push
            from datetime import datetime, timedelta
            from django.utils import timezone as tz
            hora_cita_dt = tz.make_aware(datetime.combine(cita.fecha, cita.hora_inicio))
            recordatorio_en = hora_cita_dt - timedelta(minutes=90)
            if recordatorio_en > tz.now():
                enviar_recordatorio_push.apply_async(args=[cita.id], eta=recordatorio_en)
        except Exception as e:
            import logging; logging.getLogger(__name__).error(f"Programar recordatorio falló: {e}")


class CitaClienteListView(generics.ListAPIView):
    """
    GET /api/cliente/citas/
    El cliente ve su propio historial de citas en todas las barberias.
    No necesita TenantMixin: el cliente puede tener citas en distintas barberias.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CitaSerializer

    def get_queryset(self):
        user = self.request.user
        # Buscar en todas las barberias por usuario o correo
        return Cita.objects.filter(
            Q(usuario=user) | Q(cliente_correo=user.email) | Q(cliente_correo=user.username)
        ).prefetch_related('servicios').order_by('-fecha', '-hora_inicio')

class VincularBarberiaView(APIView):
    """
    POST /api/cliente/vincular/
    Permite a un cliente registrado (y logueado) vincularse a una barbería ingresando el enlace (slug).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        slug_input = request.data.get('barberia_slug', '')

        if not slug_input:
            return Response({'error': 'Debes proporcionar un enlace o nombre de barbería.'}, status=status.HTTP_400_BAD_REQUEST)

        clean_slug = slug_input.strip().strip('/').split('/')[-1]

        try:
            barberia = Barberia.objects.get(slug=clean_slug)
        except Barberia.DoesNotExist:
            return Response({'error': 'Barbería no encontrada. Verifica el enlace.'}, status=status.HTTP_404_NOT_FOUND)

        # Vincular al cliente
        from barberias.models import PerfilUsuario
        perfil, created = PerfilUsuario.objects.get_or_create(user=user, defaults={'role': PerfilUsuario.Rol.CLIENTE})
        perfil.barberia = barberia
        perfil.save()

        return Response({
            'mensaje': f'Vinculado exitosamente a {barberia.nombre}.',
            'barberia_slug': barberia.slug,
            'barberia_nombre': barberia.nombre
        })


class CitaCancelarView(TenantMixin, APIView):
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
            cita = Cita.objects.for_tenant(self.get_barberia()).get(id=pk, cliente_correo=correo)
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

        # Push al barbero: el cliente canceló
        try:
            from push.notify import notify_barberos_de_barberia
            notify_barberos_de_barberia(
                cita.barberia,
                titulo="Cita cancelada",
                cuerpo=f"{cita.cliente_nombre} canceló su cita del {cita.fecha.strftime('%d/%m')} a las {cita.hora_inicio.strftime('%H:%M')}",
                url="/barbero/citas"
            )
        except Exception as e:
            import logging; logging.getLogger(__name__).error(f"Push cancelación falló: {e}")

        # Push al cliente (si tiene cuenta)
        try:
            if cita.usuario_id:
                from push.notify import notify_usuario
                notify_usuario(
                    cita.usuario,
                    titulo="Cita cancelada",
                    cuerpo="Tu cita ha sido cancelada correctamente.",
                    url="/cliente/citas"
                )
        except Exception:
            pass

        return Response({'mensaje': 'Cita cancelada exitosamente.'})


# ============================================================
# VISTAS DEL BARBERO (requieren autenticación JWT)
# ============================================================

class CitaListView(TenantMixin, generics.ListAPIView):
    """
    GET /api/barbero/citas/
    Lista todas las citas. Filtros opcionales: ?estado=PENDIENTE &fecha=YYYY-MM-DD
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CitaSerializer

    def get_queryset(self):
        queryset = Cita.objects.for_tenant(self.get_barberia()).prefetch_related('servicios').all()
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
        fecha = self.request.query_params.get('fecha')
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        return queryset


class CitaDetailView(TenantMixin, generics.RetrieveAPIView):
    """GET /api/barbero/citas/{id}/"""
    permission_classes = [IsAuthenticated]
    serializer_class = CitaSerializer
    
    def get_queryset(self):
        return Cita.objects.for_tenant(self.get_barberia()).prefetch_related('servicios').all()


class CitaEstadoView(TenantMixin, APIView):
    """
    PATCH /api/barbero/citas/{id}/estado/
    El barbero confirma, rechaza o marca como completada una cita.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            cita = Cita.objects.for_tenant(self.get_barberia()).get(id=pk)
        except Cita.DoesNotExist:
            return Response({'error': 'Cita no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CitaEstadoSerializer(cita, data=request.data, partial=True)
        if serializer.is_valid():
            nuevo_estado = serializer.validated_data['estado']
            cita.estado = nuevo_estado
            cita.save()

            _en_background(enviar_correo_estado_cita, cita.id, nuevo_estado)

            # Notificar al cliente por PUSH (si tiene cuenta)
            if cita.usuario_id and nuevo_estado in ['CONFIRMADA', 'RECHAZADA']:
                try:
                    from push.notify import notify_usuario
                    servicios_str = ', '.join(s.nombre for s in cita.servicios.all())
                    if nuevo_estado == 'CONFIRMADA':
                        titulo = "Cita confirmada"
                        cuerpo = f"Tu cita para {servicios_str} el {cita.fecha.strftime('%d/%m')} a las {cita.hora_inicio.strftime('%H:%M')} ha sido confirmada."
                    else:
                        titulo = "Cita no disponible"
                        cuerpo = f"Lamentamos informarte que tu cita para {servicios_str} no pudo ser agendada."
                    
                    notify_usuario(cita.usuario, titulo=titulo, cuerpo=cuerpo, url="/cliente/citas")
                except Exception as e:
                    import logging; logging.getLogger(__name__).error(f"Push cambio de estado falló: {e}")

            return Response(CitaSerializer(cita).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BloqueoDiaListCreateView(TenantMixin, generics.ListCreateAPIView):
    """GET + POST /api/barbero/bloqueos/"""
    permission_classes = [IsAuthenticated]
    serializer_class = BloqueoDiaSerializer
    
    def get_queryset(self):
        return BloqueoDia.objects.for_tenant(self.get_barberia()).all()
        
    def perform_create(self, serializer):
        serializer.save(barberia=self.get_barberia())


class BloqueoDiaDeleteView(TenantMixin, generics.DestroyAPIView):
    """DELETE /api/barbero/bloqueos/{id}/"""
    permission_classes = [IsAuthenticated]
    serializer_class = BloqueoDiaSerializer
    
    def get_queryset(self):
        return BloqueoDia.objects.for_tenant(self.get_barberia()).all()


class ServicioListCreateView(TenantMixin, generics.ListCreateAPIView):
    """GET + POST /api/<slug>/barbero/servicios/"""
    permission_classes = [IsAuthenticated]
    serializer_class = ServicioSerializer

    def get_queryset(self):
        return Servicio.objects.for_tenant(self.get_barberia()).all().order_by('nombre')

    def perform_create(self, serializer):
        serializer.save(barberia=self.get_barberia())


class ServicioDetailView(TenantMixin, generics.RetrieveUpdateDestroyAPIView):
    """GET + PATCH + DELETE /api/<slug>/barbero/servicios/<pk>/"""
    permission_classes = [IsAuthenticated]
    serializer_class = ServicioSerializer

    def get_queryset(self):
        return Servicio.objects.for_tenant(self.get_barberia()).all()
