"""
Management command para migrar usuarios legacy (is_staff) al nuevo sistema de roles SaaS.
Crea PerfilUsuario y vincula con la Barberia correspondiente.

Uso:
    python manage.py setup_jimbar_admin <email>

Ejemplo:
    python manage.py setup_jimbar_admin jimbarapp@gmail.com
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from barberias.models import Barberia, PerfilUsuario


class Command(BaseCommand):
    help = 'Migra un usuario legacy (is_staff) al rol BARBERIA_ADMIN del SaaS.'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Correo del usuario a migrar')
        parser.add_argument(
            '--barberia',
            type=str,
            default=None,
            help='Slug de la barbería a vincular (ej: jimbar). Si no se especifica, usa la primera.'
        )

    def handle(self, *args, **options):
        email = options['email']
        barberia_slug = options.get('barberia')

        # 1. Buscar usuario
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise CommandError(f'No se encontró ningún usuario con el correo: {email}')

        # 2. Buscar barbería
        if barberia_slug:
            try:
                barberia = Barberia.objects.get(slug=barberia_slug)
            except Barberia.DoesNotExist:
                raise CommandError(f'No se encontró ninguna barbería con el slug: {barberia_slug}')
        else:
            barberia = Barberia.objects.first()
            if not barberia:
                raise CommandError('No hay barberías registradas en la base de datos. Crea una primero desde el Admin.')

        # 3. Verificar si ya tiene perfil
        if hasattr(user, 'perfil'):
            perfil = user.perfil
            perfil.role = PerfilUsuario.Rol.BARBERIA_ADMIN
            perfil.barberia = barberia
            perfil.save()
            self.stdout.write(self.style.WARNING(
                f'PerfilUsuario ya existía. Actualizado:'
            ))
        else:
            # 4. Crear perfil nuevo
            perfil = PerfilUsuario.objects.create(
                user=user,
                role=PerfilUsuario.Rol.BARBERIA_ADMIN,
                barberia=barberia
            )
            self.stdout.write(self.style.SUCCESS(
                f'PerfilUsuario creado:'
            ))

        self.stdout.write(f'  Usuario : {user.email}')
        self.stdout.write(f'  Rol     : {perfil.role}')
        self.stdout.write(f'  Barbería: {barberia.nombre} (/{barberia.slug})')
        self.stdout.write(self.style.SUCCESS('\n✅ Usuario listo para iniciar sesión en /barbero/login'))
