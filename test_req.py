import urllib.request
import urllib.parse
import json

data = {
    "servicio": 1,
    "fecha": "2026-03-01",
    "hora_inicio": "08:00:00",
    "cliente_nombre": "Test",
    "cliente_telefono": "123",
    "cliente_correo": "test@test.com",
    "cliente_direccion": "Calle 1"
}
req = urllib.request.Request("http://127.0.0.1:8000/api/citas/")
req.add_header('Content-Type', 'application/json')
try:
    with urllib.request.urlopen(req, data=json.dumps(data).encode('utf-8')) as response:
        print(response.status)
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode('utf-8'))
