"""
Script para cargar los servicios iniciales de Jimbar en la base de datos.
Ejecutar una sola vez: python seed_servicios.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jimbar.settings')
django.setup()

from citas.models import Servicio

servicios = [
    {'nombre': 'Corte de cabello',                      'precio': 10000, 'duracion_minutos': 45},
    {'nombre': 'Barba',                                  'precio': 5000,  'duracion_minutos': 15},
    {'nombre': 'Cejas',                                  'precio': 3000,  'duracion_minutos': 10},
    {'nombre': 'Corte + Barba',                          'precio': 15000, 'duracion_minutos': 60},
    {'nombre': 'Servicio completo (Corte+Barba+Cejas)',  'precio': 18000, 'duracion_minutos': 70},
]

for s in servicios:
    try:
        obj, created = Servicio.objects.get_or_create(nombre=s['nombre'], defaults=s)
        estado = 'Creado' if created else 'Ya existe'
        print(f"{estado}: {obj}")
    except Exception as e:
        print(f"Omitiendo {s['nombre']} ya que existen varios o hay un error: {e}")

print("\nServicios en la base de datos:")
for s in Servicio.objects.all():
    print(f"  [{s.id}] {s.nombre} — ${s.precio:,} ({s.duracion_minutos} min)")
