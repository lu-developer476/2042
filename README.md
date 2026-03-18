# 2042: Tower Defense

Juego web futurista hecho con **Python + Django + JavaScript** listo para desplegar en **Render**.

## Qué incluye

- Mapa táctico con ruta fija
- 4 torres jugables
- **Burst Tower de 5 ráfagas**
- **5 mejoras por torre**
- 8 oleadas con boss final
- Ranking persistido en base de datos
- Static files servidos con WhiteNoise
- Configuración preparada para Render con `gunicorn`

## Stack

- Backend: Django
- Frontend: HTML + CSS + JavaScript Canvas
- Producción: Gunicorn + WhiteNoise
- Base de datos: PostgreSQL en Render / SQLite local

## Desarrollo local

```bash
python -m venv .venv
source .venv/bin/activate  # Linux / macOS
# .venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

## Variables de entorno

### Producción

- `SECRET_KEY`
- `DEBUG=false`
- `DATABASE_URL`
- `ALLOWED_HOSTS=.onrender.com`
- `WEB_CONCURRENCY=2`

### Local

Ver `.env.example`.

## Deploy en Render

### Build Command

```bash
./build.sh
```

### Start Command

```bash
gunicorn config.wsgi:application
```

### Root Directory

Dejalo vacío si este proyecto está en la raíz del repo.

## Admin Django

Si querés entrar al admin:

```bash
python manage.py createsuperuser
```

## Nota importante

El juego corre visualmente en el navegador con JavaScript. Django maneja vistas, persistencia y ranking. Exactamente como corresponde. Nada de pedirle al backend que haga de motor gráfico porque no estamos filmando ciencia ficción barata.
