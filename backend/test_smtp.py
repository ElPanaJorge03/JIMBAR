import os
from dotenv import load_dotenv
import smtplib
from email.message import EmailMessage

load_dotenv()

user = os.getenv('EMAIL_HOST_USER', '').strip('"').strip("'")
password = os.getenv('EMAIL_HOST_PASSWORD', '').strip('"').strip("'")
barber = os.getenv('BARBER_EMAIL', '').strip('"').strip("'")

print(f"Probando conexion SMTP con usuario: {user}")
print(f"Hacia destinatario: {barber}")

try:
    print("Conectando a smtp.gmail.com:587...")
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.set_debuglevel(1)
    server.starttls()
    print("Autenticando...")
    server.login(user, password)
    print("Autenticacion EXITOSA!")
    
    msg = EmailMessage()
    msg.set_content("Este es un correo de prueba directo desde el servidor SMTP.")
    msg['Subject'] = "[Jimbar] Prueba de diagnostico SMTP"
    msg['From'] = user
    msg['To'] = barber
    
    print("Enviando mensaje...")
    server.send_message(msg)
    print("Mensaje enviado con extio!")
    server.quit()

except Exception as e:
    print(f"ERROR ENVIANDO CORREO: {e}")
