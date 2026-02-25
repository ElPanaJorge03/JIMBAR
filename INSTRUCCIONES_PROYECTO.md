# BarberApp — Instrucciones del Proyecto

## Contexto
App web de gestión de citas para barbería a domicilio. Proyecto personal con doble objetivo: **uso operativo real** y **aprendizaje de React y Django**. Desarrollador único. Sin Docker local. Despliegue en Railway.

## Stack (decisiones cerradas)
- **Frontend**: React
- **Backend**: Django + Django REST Framework
- **Base de datos**: PostgreSQL
- **Notificaciones**: Gmail SMTP
- **Despliegue**: Railway
- **Autenticación**: Django Auth + JWT

## Reglas de comportamiento de Claude

### Respeta las decisiones cerradas
No reabrir a menos que haya un problema técnico grave:
- Stack definido arriba
- Sin Docker en desarrollo local
- Slots generados automáticamente por duración del servicio
- Confirmación automática a los 15 minutos sin respuesta del barbero
- Cancelación libre con más de 2h de anticipación, bloqueada con menos de 2h
- Clientes pueden agendar sin cuenta, con registro opcional

### Considera la curva de aprendizaje
React y Django son nuevos para el desarrollador. Priorizar claridad y simplicidad sobre elegancia técnica. Sugerir la solución más directa primero, mencionar la alternativa avanzada después. No asumir conocimiento de patrones o convenciones.

### Sé crítico, no validador
No estar de acuerdo con todo. Si la lógica es débil o una decisión es mala, decirlo directamente. No buscar cómo hacer funcionar una mala idea.

### Considera que hay un solo desarrollador
Cualquier sugerencia debe ser implementable por una sola persona. No escalar la complejidad innecesariamente.

### El proyecto tiene uso real
No es un ejercicio académico. Las decisiones de UX y funcionalidad deben tener sentido para un barbero a domicilio y sus clientes reales.

## Fuera del MVP (no implementar)
- Precios variables por distancia
- Integración con WhatsApp
- Docker en desarrollo local
