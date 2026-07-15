# 2042: Tower Defense

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.2-092E20?logo=django&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Canvas-F7DF1E?logo=javascript&logoColor=111)
![HTML5](https://img.shields.io/badge/HTML5-Templates-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Responsive-1572B6?logo=css3&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Render-4169E1?logo=postgresql&logoColor=white)
![Gunicorn](https://img.shields.io/badge/Gunicorn-23.0-499848?logo=gunicorn&logoColor=white)
![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=111)

Juego web futurista de defensa de torres desarrollado con **Python + Django + JavaScript Canvas**. El proyecto está en estado funcional: permite jugar partidas completas en navegador, persistir puntajes en base de datos, consultar el ranking y desplegarse en Render con PostgreSQL, Gunicorn y WhiteNoise.

## Estado actual del proyecto

- **Aplicación Django lista para producción** con configuración por variables de entorno, `DEBUG=false`, seguridad HTTPS en producción y soporte para `RENDER_EXTERNAL_HOSTNAME`.
- **Juego playable en frontend** usando Canvas y JavaScript vanilla: el backend sirve vistas, estáticos, APIs y persistencia; la simulación visual corre en el navegador.
- **Ranking persistente** con modelo `LeaderboardEntry`, página de ranking y endpoints JSON para consultar/guardar puntajes.
- **Deploy preparado para Render** mediante `render.yaml`, `build.sh`, `runtime.txt`, Gunicorn, WhiteNoise y base PostgreSQL administrada por Render.
- **Desarrollo local simple** con SQLite por defecto si no se define `DATABASE_URL`.

## Características jugables

- 3 escenarios seleccionables: **Muelles de Neón**, **Desierto Ígneo** y **Ruinas Aurora**.
- Rutas múltiples por escenario, nodos fijos de construcción y props visuales dibujados en Canvas.
- 4 torres jugables:
  - **Pulse Tower**: cobertura estable.
  - **Sniper Tower**: alto daño y largo alcance.
  - **Shock Tower**: control de masas con ralentización.
  - **Burst Tower**: ráfagas de 5 disparos.
- 5 niveles de mejora por torre, con costos y estadísticas progresivas.
- 8 oleadas con enemigos tipo scout, crawler, tank, ghost y boss final **Overseer**.
- Habilidades tácticas:
  - **EMP global**.
  - **Reparar core**.
  - **Overclock de torre seleccionada**.
- Velocidad x2, pausa/reanudación, reinicio, combo táctico, vista previa de amenazas y feedback sonoro con Web Audio API.
- Preferencias de idioma **ES/EN** y tema **oscuro/claro** persistidas en `localStorage`.

## Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Backend | Python 3.12, Django 5.2 |
| Frontend | HTML, CSS responsive, JavaScript vanilla, Canvas API, Web Audio API |
| Persistencia | SQLite en local, PostgreSQL en Render vía `dj-database-url` y `psycopg` |
| Estáticos | Django staticfiles + WhiteNoise con manifiesto comprimido |
| Producción | Gunicorn, Render Web Service, Render PostgreSQL |
| Configuración | Variables de entorno, `render.yaml`, `build.sh`, `runtime.txt` |

## Estructura principal

```text
.
├── config/                 # Settings, URLs, ASGI/WSGI y favicon
├── game/                   # App Django del juego
│   ├── static/game/        # CSS y JavaScript del juego
│   ├── templates/game/     # Templates Django
│   ├── models.py           # Ranking persistente
│   ├── views.py            # Vistas y endpoints API
│   └── urls.py             # Rutas de la app
├── build.sh                # Build command para Render
├── manage.py
├── render.yaml             # Infra declarativa de Render
├── requirements.txt
└── runtime.txt             # Versión de Python para Render
```

## Desarrollo local

```bash
python -m venv .venv
source .venv/bin/activate  # Linux / macOS
# .venv\Scripts\activate   # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

La aplicación queda disponible en <http://127.0.0.1:8000/>.

> Nota: el proyecto usa SQLite local por defecto. Solo necesitás configurar `DATABASE_URL` si querés usar otra base.

## Variables de entorno

### Producción

- `SECRET_KEY`: clave secreta de Django.
- `DEBUG=false`: desactiva modo debug y activa cookies seguras/HSTS.
- `DATABASE_URL`: connection string de PostgreSQL.
- `ALLOWED_HOSTS`: hosts permitidos, por ejemplo `.onrender.com`.
- `CSRF_TRUSTED_ORIGINS`: orígenes extra separados por coma, si aplica.
- `WEB_CONCURRENCY=2`: cantidad de workers para Gunicorn en Render.

### Local

No es obligatorio crear un `.env` para correr el proyecto con SQLite. Si necesitás variables locales, exportalas en tu shell o usá el método de carga de entorno que prefieras.

## Base de datos y ranking

El ranking guarda:

- nombre del piloto;
- score;
- oleadas superadas;
- enemigos destruidos;
- fecha de creación.

Rutas relacionadas:

- `/leaderboard/`: ranking completo.
- `/api/leaderboard/`: últimos mejores puntajes en JSON.
- `/api/save-score/`: endpoint POST para guardar una partida.

## Deploy en Render

El repositorio ya incluye `render.yaml` con un Web Service y una base PostgreSQL free tier.

### Build Command

```bash
./build.sh
```

El build instala dependencias, recolecta archivos estáticos y ejecuta migraciones.

### Start Command

```bash
gunicorn config.wsgi:application
```

### Root Directory

Dejalo vacío si este proyecto está en la raíz del repositorio.

## Admin Django

Para crear un usuario administrador:

```bash
python manage.py createsuperuser
```

Luego entrá en `/admin/`.

## Checks útiles

```bash
python manage.py check
python manage.py test
python manage.py migrate
```

## Nota de arquitectura

El juego corre visualmente en el navegador con JavaScript y Canvas. Django se encarga de renderizar páginas, exponer APIs, servir estáticos y persistir el ranking. Esa separación mantiene el backend simple y evita convertirlo en un motor gráfico innecesario.

## Calidad y CI

El repositorio incluye un workflow de GitHub Actions en `.github/workflows/quality.yml` que instala dependencias, ejecuta `python manage.py check`, valida migraciones, corre tests y prueba `collectstatic`.

Herramientas recomendadas para crecer el pipeline:

- `ruff` para lint y formato de Python.
- `djlint` para templates Django.
- `prettier` o `eslint` si se suma tooling Node para JavaScript/CSS.

## Configuración rápida

Copiá `.env.example` a `.env` y ajustá secretos, hosts permitidos, orígenes CSRF y `DATABASE_URL` según tu entorno.

## Troubleshooting

### `collectstatic` falla

- Verificá que `STATIC_ROOT` apunte a un directorio escribible.
- En Render, confirmá que el build command ejecute `python manage.py collectstatic --noinput` después de instalar dependencias.

### Errores de PostgreSQL

- Revisá que `DATABASE_URL` exista y use el formato esperado por `dj-database-url`.
- Confirmá conectividad, usuario, contraseña y nombre de base.
- Corré `python manage.py migrate` después de cambiar de base.

### Problemas con `ALLOWED_HOSTS`

- Agregá el dominio público de deploy a `DJANGO_ALLOWED_HOSTS`.
- En local usá `127.0.0.1,localhost`.

### Problemas con CSRF

- Agregá el origen completo con esquema a `CSRF_TRUSTED_ORIGINS`, por ejemplo `https://tu-app.onrender.com`.
- Si cambia el dominio de Render, actualizá esta variable.

## Balanceo de juego

- Torres: ajustá costo, daño, rango, cooldown y mejoras en `game/static/game/js/towers.js`.
- Enemigos y oleadas: modificá vida, velocidad, recompensa, resistencias y plan de oleadas en `game/static/game/js/waves.js`.
- Escenarios: editá rutas, nodos, paletas y modificadores en `game/static/game/js/scenarios.js` y `game/static/game/js/modes.js`.
- Dificultades: balanceá HP inicial, créditos, multiplicadores de enemigos y score en `game/static/game/js/modes.js`.

## Capturas o GIF

Para documentar cambios visuales, agregá capturas o GIFs en `docs/` y enlazalos desde esta sección.

## Contribuir

1. Creá una rama desde `main`.
2. Instalá dependencias con `pip install -r requirements.txt`.
3. Corré `python manage.py check`, `python manage.py makemigrations --check --dry-run` y `python manage.py test`.
4. Describí cambios de gameplay, accesibilidad y migraciones en el PR.
