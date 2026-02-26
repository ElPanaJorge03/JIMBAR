import urllib.request
import json
import ssl

url = "https://script.google.com/macros/s/AKfycbyNvj2yOTKmXW0L27uXMOavdm5MeTNhdRWAdexUHyzCrrrTy-I02Amxehw1md_CA_hQ/exec"

payload = {
    "to": "jorgejimmartinez333@gmail.com",
    "subject": "[Jimbar] Prueba de Estilos HTML",
    "body": "Esto es texto pero no debería verse.",
    "htmlBody": """
    <div style="background-color: #1a1a1a; padding: 20px; color: #fff; text-align: center; font-family: sans-serif;">
        <h1 style="color: #c9a75d;">JIMBAR ESTILOS OK</h1>
        <p>¡El megáfono ya reconoce los colores y botones de diseño!</p>
    </div>
    """
}

# Crear un contexto SSL que no verifique certificados
context = ssl._create_unverified_context()

req = urllib.request.Request(
    url, 
    data=json.dumps(payload).encode('utf-8'), 
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req, context=context) as response:
        print(f"Status: {response.status}")
        print("Mensaje de prueba enviado!")
except Exception as e:
    print(f"Error: {e}")
