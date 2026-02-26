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

# Directorio raíz del proyecto (donde está manage.py)
BASE_DIR = Path(__file__).resolve().parent.parent

# ============================================================
# SEGURIDAD
# ============================================================
SECRET_KEY = os.getenv('SECRET_KEY', 'clave-insegura-solo-para-desarrollo')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')
CSRF_TRUSTED_ORIGINS = os.getenv('CSRF_TRUSTED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')
CSRF_TRUSTED_ORIGINS.append('https://jimbar-production.up.railway.app')


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

    # Apps del proyecto
    'citas',
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
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
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
# CORS — Permite peticiones desde React (localhost:5173 = Vite o frontend en Vercel)
# ============================================================
CORS_ALLOW_ALL_ORIGINS = True # Para simplificar el despliegue de frontend luego
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]


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
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
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
    },
}
