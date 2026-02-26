import os
from dotenv import load_dotenv
import smtplib

load_dotenv()

user = os.getenv('EMAIL_HOST_USER', '').strip('"').strip("'")
password = os.getenv('EMAIL_HOST_PASSWORD', '').strip('"').strip("'")

print(f"Probando conexion SMTP (TLS puerto 587) con usuario: {user}")

try:
    server = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
    server.set_debuglevel(1)
    
    # Saludo inicial
    server.ehlo()
    print("Iniciando TLS...")
    server.starttls()
    server.ehlo()
    
    print("Intentando login...")
    server.login(user, password)
    print("¡EXTIO! Las credenciales son correctas y Gmail permitio entrar.")
    server.quit()

except Exception as e:
    print(f"\nERROR de conexion o login: {e}")

