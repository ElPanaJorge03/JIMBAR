import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jimbar.settings")
django.setup()

from barberias.models import Barberia
from barberias.serializers import BarberiaSerializer
from django.core.files.uploadedfile import SimpleUploadedFile

b = Barberia.objects.first()
if not b:
    print("No hay barberia")
else:
    print("Probando update serializer con string:")
    s = BarberiaSerializer(instance=b, data={"nombre": "Test", "email": "test@test.com"}, partial=True)
    if s.is_valid():
        try:
            s.save()
            print("Guardado exitoso")
        except Exception as e:
            import traceback
            traceback.print_exc()

    print("Probando Cloudinary upload (solo si CLOUDINARY_URL está configurado):")
    # Para probar un archivo (tendremos un error si Cloudinary falla)
    file_data = SimpleUploadedFile("test.png", b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR", content_type="image/png")
    s2 = BarberiaSerializer(instance=b, data={"logo": file_data}, partial=True)
    if s2.is_valid():
        try:
            s2.save()
            print("Upload cloudinary guardado exitoso")
        except Exception as e:
            import traceback
            traceback.print_exc()
    else:
        print("Errores de validacion:", s2.errors)
