ARCHIVO DE CONOCIMIENTO DEL PROYECTO
Jimbar SaaS — Plataforma de Reservas para Barberías
1. Descripción del Proyecto
Jimbar es una plataforma SaaS multi-tenant de gestión de citas para barberías e independientes. Evolución del sistema Jimbar original (app para un solo barbero) hacia una plataforma donde cualquier barbería puede registrarse, configurar su negocio y recibir reservas de sus clientes. Compite directamente con Weybook ofreciendo las funcionalidades esenciales de reserva a menor precio.

2. Modelo de Negocio
Concepto	Detalle
Plan único	$20.000 COP / mes por barbería
Período de prueba	15 días gratis al registrarse, sin tarjeta requerida
Gracia por no pago	3 días hábiles con funciones restringidas antes del bloqueo total
Métodos de cobro	PSE y tarjeta de crédito/débito via Wompi o PayU
URL por barbería	jimbar.vercel.app/nombrebarberia
Mercado objetivo	Barberías e independientes en Colombia

3. Stack Tecnológico
Capa	Tecnología	Nota
Backend	Django REST Framework + Python	Reutilizado y refactorizado del sistema original
Base de Datos	PostgreSQL	Multi-tenant con tenant_id en todas las tablas
Frontend	React	Reutilizado y extendido del sistema original
Autenticación	JWT	Con soporte multi-tenant
Pagos	Wompi o PayU	PSE y tarjeta. Por definir cuál integrar.
Despliegue Backend	Railway	
Despliegue Frontend	Vercel	Plan gratuito con rutas por tenant
Notificaciones	Gmail SMTP	Heredado del sistema original

4. Arquitectura Multi-Tenant
Una sola base de datos PostgreSQL compartida por todos los tenants. Cada tabla relevante tiene un campo tenant_id (FK a la tabla de barberías). El backend garantiza que ninguna consulta devuelve datos de un tenant diferente al usuario autenticado. No se crean tablas dinámicas por barbería.

•	Aislamiento de datos: garantizado por lógica de negocio en el backend, no por estructura de BD.
•	Escalabilidad: agregar un nuevo tenant es insertar un registro, no crear tablas.
•	Migraciones: se aplican una sola vez a toda la BD, no por tenant.

5. Roles del Sistema
Rol	Descripción
SUPERADMIN	Dueño del SaaS (Jorge). Ve todas las barberías, métricas globales, puede suspender o eliminar cuentas.
BARBERIA_ADMIN	Dueño o administrador de una barbería. Configura el negocio, gestiona servicios, horarios y citas.
BARBERO	Empleado de una barbería. Ve sus propias citas asignadas.
CLIENTE	Usuario final que reserva citas en una barbería específica.

6. Módulos del Sistema
6.1 Registro y Onboarding de Barberías
•	Formulario de registro público: nombre del negocio, nombre del admin, correo, contraseña, slug (URL).
•	Al registrarse inicia automáticamente el período de prueba de 15 días.
•	Onboarding guiado: el admin configura logo, imagen del negocio, servicios y horarios antes de activar el perfil público.
•	URL pública de la barbería: jimbar.vercel.app/slug-del-negocio.

6.2 Panel de Administración de Barbería
•	Configuración del perfil: nombre, logo, imagen de portada, descripción, dirección, teléfono.
•	Gestión de servicios: agregar, editar y eliminar servicios con nombre, precio y duración.
•	Gestión de barberos: agregar empleados con sus especialidades y horarios.
•	Gestión de disponibilidad: configurar horarios de atención y bloquear días.
•	Gestión de citas: ver, confirmar, rechazar y completar citas.
•	Vista de suscripción: estado actual, fecha de vencimiento y opción de renovar.

6.3 Portal Público de cada Barbería
•	Página de la barbería con logo, imagen, servicios y barberos disponibles.
•	Formulario de reserva: selección de servicio, barbero, fecha y hora disponible.
•	Clientes pueden registrarse o reservar como invitados con datos básicos.
•	Confirmación de cita por correo.

6.4 Sistema de Suscripción y Cobro
•	Período de prueba: 15 días gratuitos desde el registro.
•	Al vencer la prueba: la barbería debe ingresar método de pago para continuar.
•	Cobro mensual automático de $20.000 COP via Wompi o PayU.
•	Si el pago falla o no se renueva: 3 días hábiles de gracia con funciones restringidas.
•	Al vencer la gracia: bloqueo total del acceso hasta que se regularice el pago.
•	Notificación por correo en cada evento: prueba por vencer, pago exitoso, pago fallido, cuenta suspendida.

6.5 Panel de Superadmin
•	Vista global de todas las barberías registradas.
•	Estado de cada tenant: en prueba, activo, gracia, suspendido.
•	MRR y métricas globales del SaaS.
•	Acciones: suspender, reactivar o eliminar barberías.
•	Historial de pagos por tenant.

7. Estados de Suscripción
Estado	Descripción	Acceso
TRIAL	Período de prueba activo (15 días)	Completo
ACTIVO	Suscripción pagada y al día	Completo
GRACIA	Pago vencido, dentro de los 3 días hábiles	Restringido (solo ver citas y configuración básica)
SUSPENDIDO	Gracia vencida sin pago	Bloqueado — solo ve aviso de pago

8. Diferencias con Jimbar Original
Aspecto	Jimbar Original	Jimbar SaaS
Tenants	Un solo barbero (tú)	Múltiples barberías independientes
Servicios	Hardcodeados	Configurables por cada barbería
Horarios	Fijos	Configurables por cada barbería y barbero
Autenticación	JWT simple	JWT con contexto de tenant
Base de datos	Sin tenant_id	tenant_id en todas las tablas relevantes
Cobro	No existe	PSE y tarjeta via pasarela de pagos
Administración	Solo el barbero	Superadmin + admin por barbería

9. Contexto del Proyecto
•	Evolución del sistema Jimbar existente que ya funciona correctamente.
•	Código bien organizado y preparado para refactorización a multi-tenant.
•	Desarrollador individual con dominio de Django REST Framework, React y PostgreSQL.
•	Competidor principal: Weybook. Diferenciador: precio menor ($20.000 COP vs $50.000-$100.000 COP) con funcionalidades esenciales de reserva.
•	Infraestructura inicial gratuita: Railway + Vercel. Se invierte a medida que el negocio lo exija.
•	Sin Docker en desarrollo local.
