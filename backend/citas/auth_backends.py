import logging
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
from django.db.models import Q

security_logger = logging.getLogger('security')

class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get('username')
        try:
            user = User.objects.get(Q(username__iexact=username) | Q(email__iexact=username))
        except User.DoesNotExist:
            ip = request.META.get('REMOTE_ADDR', 'unknown') if request else 'unknown'
            security_logger.warning(f"Login fallido (usuario no existe): {username} desde {ip}")
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user

        ip = request.META.get('REMOTE_ADDR', 'unknown') if request else 'unknown'
        security_logger.warning(f"Login fallido (contraseña incorrecta): {username} desde {ip}")
        return None
