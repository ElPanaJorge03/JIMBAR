"""
Configuración de Django para el proyecto Jimbar.

Documentación: https://docs.djangoproject.com/en/5.0/topics/settings/
"""

from pathlib import Path
from datetime import timedelta
import os
import dj_database_url
from dotenv import load_dotenv

# Carga las variables del archivo .env
load_dotenv()

# Limpiar CLOUDINARY_URL por si el usuario lo pegó en Railway o .env con espacios o comillas
if 'CLOUDINARY_URL' in os.environ:
    val = os.environ['CLOUDINARY_URL'].strip(' \t\n\r"\'')
    if val.startswith('CLOUDINARY_URL='):
        val = val.replace('CLOUDINARY_URL=', '', 1)
    os.environ['CLOUDINARY_URL'] = val

# Directorio raíz del proyecto (donde está manage.py)
BASE_DIR = Path(__file__).resolve().parent.parent

# ============================================================
# SEGURIDAD
# ============================================================
SECRET_KEY = os.getenv('SECRET_KEY', 'clave-insegura-solo-para-desarrollo')
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
CSRF_TRUSTED_ORIGINS = os.getenv('CSRF_TRUSTED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')
CSRF_TRUSTED_ORIGINS.append('https://jimbar-production.up.railway.app')
CSRF_TRUSTED_ORIGINS.append('https://jimbar.vercel.app')


# ============================================================
# APLICACIONES INSTALADAS
# ============================================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Librerías externas
    'rest_framework',               # Django REST Framework
    'rest_framework_simplejwt',     # Autenticación JWT
    'corsheaders',                  # Permite peticiones desde React
    'django_celery_beat',           # Tareas programadas (confirmación automática)
    'django_celery_results',         # Guarda resultados de tareas en la BD
    # Cloudinary para imágenes
    'cloudinary_storage',
    'cloudinary',

    # Apps del proyecto
    'citas',
    'barberias',
    'push',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Sirve archivos estáticos en prod
    'corsheaders.middleware.CorsMiddleware',  # Debe ir antes de CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'jimbar.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'jimbar.wsgi.application'


# ============================================================
# BASE DE DATOS — PostgreSQL
# ============================================================
# Usamos dj_database_url para poder parsear la URL que nos da Railway
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL', f"postgres://{os.getenv('DB_USER', 'postgres')}:{os.getenv('DB_PASSWORD', '')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'jimbar_db')}"),
        conn_max_age=600,
        conn_health_checks=True,
    )
}


# ============================================================
# VALIDACIÓN DE CONTRASEÑAS
# ============================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

AUTHENTICATION_BACKENDS = [
    'citas.auth_backends.EmailOrUsernameModelBackend',
    'django.contrib.auth.backends.ModelBackend',
]


# ============================================================
# INTERNACIONALIZACIÓN
# ============================================================
LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True


# ============================================================
# ARCHIVOS ESTÁTICOS
# ============================================================
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ============================================================
# DJANGO REST FRAMEWORK
# ============================================================
REST_FRAMEWORK = {
    # Por defecto las APIs requieren autenticación JWT
    # Las vistas públicas (agendar cita) lo sobreescriben con AllowAny
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'booking': '20/hour',
        'auth': '10/hour',
    },
}


# ============================================================
# JWT — Configuración de tokens
# ============================================================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),   # Token de acceso: 8 horas
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),   # Token de refresco: 7 días
    'ROTATE_REFRESH_TOKENS': True,
}


# ============================================================
# CORS — Solo orígenes confiables
# ============================================================
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://jimbar.vercel.app',
]
# Agregar orígenes extra desde variable de entorno (para preview deploys, etc)
_extra_cors = os.getenv('CORS_EXTRA_ORIGINS', '')
if _extra_cors:
    CORS_ALLOWED_ORIGINS += [o.strip() for o in _extra_cors.split(',') if o.strip()]

CORS_ALLOW_CREDENTIALS = True


# ============================================================
# EMAIL — Gmail SMTP
# ============================================================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '').strip('"').strip("'")
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '').strip('"').strip("'")
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# Correo del barbero (recibe notificaciones de nuevas citas y cancelaciones)
BARBER_EMAIL = os.getenv('BARBER_EMAIL', EMAIL_HOST_USER).strip('"').strip("'")

# API Keys para proveedores de correo por HTTP (Bypass Railway Port 587 Block)
BREVO_API_KEY = os.getenv('BREVO_API_KEY', '').strip('"').strip("'")
GOOGLE_APPS_SCRIPT_URL = os.getenv('GOOGLE_APPS_SCRIPT_URL', '').strip('"').strip("'")


# ============================================================
# CONFIRMACIÓN AUTOMÁTICA — Timer en minutos
# ============================================================
# Cuántos minutos esperar antes de confirmar una cita automáticamente.
# Celery se configura en producción (Railway). En desarrollo local,
# la confirmación automática se dispara con un management command o
# se puede probar manualmente desde el admin.
AUTO_CONFIRM_MINUTES = 15

# ============================================================
# LOGGING (Fundamental para ver errores en Railway)
# ============================================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'citas.emails': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'security': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

# ============================================================
# SEGURIDAD HTTPS / HEADERS (Solo en producción)
# ============================================================
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000          # 1 año
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_SECURE = True
    CSRF_COOKIE_HTTPONLY = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True

# ============================================================
# ARCHIVOS ESTÁTICOS Y MEDIA / CLOUDINARY
# ============================================================
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

if os.getenv('CLOUDINARY_URL'):
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
# ============================================================
# VAPID (Push Notifications)
# ============================================================
VAPID_PUBLIC_KEY  = os.getenv('VAPID_PUBLIC_KEY', '')
VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY', '')
