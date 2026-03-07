# Jimbar — Tu barbería online

Aplicación web para gestión de reservas de barbería: presencial, a domicilio o ambos.

## Estructura del proyecto

```
JIMBAR/
├── backend/    ← Django + DRF + PostgreSQL
└── frontend/   ← React + Vite
```

## Cómo correr en desarrollo local

### Backend
```bash
cd backend
.\venv\Scripts\activate       # Windows
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm run dev
```

## URLs locales

| Servicio | URL |
|---|---|
| App (cliente) | http://localhost:5173 |
| Panel barbero | http://localhost:5173/barbero/citas |
| API | http://127.0.0.1:8000/api/ |
| Admin Django | http://127.0.0.1:8000/admin/ |

## Credenciales de desarrollo

- Admin Django: `jimbar` / `admin1234`
- PostgreSQL: `jimbar_db` / usuario `postgres`

## Stack

- **Frontend**: React + Vite + React Router + Axios
- **Backend**: Django 5 + Django REST Framework + JWT
- **BD**: PostgreSQL 18
- **Emails**: Gmail SMTP
- **Despliegue**: Railway
