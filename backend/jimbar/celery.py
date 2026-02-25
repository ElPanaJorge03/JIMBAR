"""
Configuración de Celery para el proyecto Jimbar.
Celery maneja las tareas en segundo plano, como:
- Confirmar automáticamente una cita si el barbero no responde en 15 minutos
- Enviar recordatorios de citas
"""
import os
from celery import Celery

# Le dice a Celery cuál es el archivo de configuración de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jimbar.settings')

app = Celery('jimbar')

# Lee la configuración de Celery desde el settings.py (las que empiezan con CELERY_)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Detecta automáticamente los archivos tasks.py en todas las apps
app.autodiscover_tasks()
