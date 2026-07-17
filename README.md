# 2042: Tower Defense

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.2-092E20?logo=django&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Canvas-F7DF1E?logo=javascript&logoColor=111)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Render-4169E1?logo=postgresql&logoColor=white)
![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=111)

Juego web de defensa de torres futurista desarrollado con **Django** y **JavaScript Canvas**. La simulación se ejecuta en el navegador; Django renderiza las páginas, expone la API de puntajes y persiste el ranking.

## Características

- Cinco escenarios con rutas, nodos de construcción y modificadores propios: **Muelles de Neón**, **Desierto Ígneo**, **Ruinas Aurora**, **Bastión Orbital** y **Dosel Bioforja**.
- Cinco dificultades: Fácil, Normal, Difícil, Extremo y Pesadilla; y tres modos de juego: Tutorial, Campaña y Libre.
- Seis torres con cinco niveles de estadísticas: Pulse Tower, Sniper Tower, Shock Tower, Twin Raptor, Missile Silo y Burst Tower.
- 25 oleadas procedimentales en el modo Libre, modo infinito opcional y campaña distribuida en etapas por escenario. Cada etapa ajusta composición, refuerzos, vida, velocidad, daño, recompensas y puntaje según la dificultad elegida.
- Siete tipos de enemigo, incluidos unidades con escudo, sabotaje de torres y el jefe Overseer.
- Objetos tácticos, habilidades, pausa, velocidad x2, selector de idioma ES/EN, tema oscuro/claro y efectos de sonido con Web Audio API.
- Ranking persistente con datos de escenario, dificultad, duración, torres y habilidades usadas.

## Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Backend | Python 3.12, Django 5.2.6 |
| Frontend | HTML, CSS responsive, JavaScript vanilla, Canvas API, Web Audio API |
| Persistencia | SQLite en local; PostgreSQL mediante `dj-database-url` y `psycopg` en Render |
| Estáticos | Django staticfiles y WhiteNoise con manifiesto comprimido |
| Producción | Gunicorn, Render Web Service y Render PostgreSQL |

## Estructura del proyecto

```text
.
├── config/                     # Configuración Django, URLs, middleware y favicons
├── game/
│   ├── migrations/             # Migraciones del ranking
│   ├── static/game/
│   │   ├── css/                # Estilos de la interfaz
│   │   └── js/                 # Motor Canvas, oleadas, torres, modos y API
│   ├── templates/game/         # Página de juego y ranking
│   ├── models.py               # Modelo LeaderboardEntry
│   └── views.py                # Vistas y endpoints JSON
├── build.sh                    # Comando de build para Render
├── render.yaml                 # Infraestructura de Render
├── requirements.txt
└── runtime.txt
```

## Desarrollo local

### Requisitos

- Python 3.12 o superior.
- `pip` y un entorno virtual recomendados.

### Inicio rápido

```bash
python -m venv .venv
source .venv/bin/activate  # Linux / macOS
# .venv\Scripts\activate   # Windows
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Abrí <http://127.0.0.1:8000/> para jugar. El ranking se puede consultar en <http://127.0.0.1:8000/leaderboard/>.

SQLite es la base predeterminada en local, por lo que no hace falta definir variables de entorno para comenzar.

## API de ranking

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/leaderboard/` | Devuelve los 20 mejores puntajes en JSON. |
| `POST` | `/api/save-score/` | Guarda una partida y devuelve la entrada creada. |

El `POST` requiere JSON y protección CSRF de Django. Los campos numéricos aceptados son `score`, `waves_cleared`, `enemies_destroyed`, `duration_seconds`, `towers_built`, `towers_upgraded` y `abilities_used`; todos deben ser enteros no negativos. También se pueden enviar `player_name`, `scenario`, `difficulty` y `game_seed`.

Ejemplo de cuerpo de solicitud:

```json
{
  "player_name": "Ada",
  "score": 1234,
  "waves_cleared": 12,
  "enemies_destroyed": 86,
  "scenario": "Muelles de Neón",
  "difficulty": "normal",
  "duration_seconds": 540,
  "towers_built": 9,
  "towers_upgraded": 14,
  "abilities_used": 4,
  "game_seed": "example-seed"
}
```

La página inicial entrega la cookie CSRF necesaria para el cliente web. Para una integración externa, obtené esa cookie y enviá su valor en el encabezado `X-CSRFToken` junto con `Content-Type: application/json`.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `SECRET_KEY` | Obligatoria para producción; no se permite la clave de desarrollo con `DEBUG=false`. |
| `DEBUG` | `true` en local por defecto; configurala como `false` en producción. |
| `DATABASE_URL` | URL de PostgreSQL u otra base compatible; si falta, se usa SQLite. |
| `ALLOWED_HOSTS` | Lista de hosts separados por comas. |
| `CSRF_TRUSTED_ORIGINS` | Orígenes adicionales separados por comas e incluyendo el esquema. |
| `RENDER_EXTERNAL_HOSTNAME` | Render la provee y se incorpora automáticamente a hosts y CSRF. |
| `WEB_CONCURRENCY` | Cantidad de workers para Gunicorn. |

> Cuando `DEBUG=false`, Django activa redirección HTTPS, cookies seguras y HSTS. Definí siempre un `SECRET_KEY` de producción.

## Deploy en Render

El repositorio incluye `render.yaml` para crear un Web Service y una base PostgreSQL. Render ejecuta:

```bash
./build.sh
```

El script instala dependencias, ejecuta `collectstatic` y aplica las migraciones. El servicio se inicia con:

```bash
gunicorn config.wsgi:application
```

Dejá vacío **Root Directory** si el repositorio se despliega desde su raíz. La configuración declarativa ya define `DEBUG=false`, genera `SECRET_KEY`, conecta `DATABASE_URL`, configura `ALLOWED_HOSTS=.onrender.com` y establece dos workers.

## Administración

Creá un usuario administrador con:

```bash
python manage.py createsuperuser
```

Después ingresá a `/admin/`.

## Verificación

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
python manage.py collectstatic --noinput
```

El workflow `.github/workflows/quality.yml` ejecuta estas verificaciones en GitHub Actions con Python 3.13.

## Ajuste de gameplay

- **Torres:** `game/static/game/js/towers.js`.
- **Enemigos y oleadas:** `game/static/game/js/waves.js`.
- **Escenarios y rutas:** `game/static/game/js/scenarios.js`.
- **Dificultades, modos y objetos:** `game/static/game/js/modes.js`.

## Contribuir

1. Creá una rama desde `main`.
2. Instalá las dependencias y ejecutá todas las verificaciones de la sección anterior.
3. Incluí migraciones cuando cambie el modelo de datos.
4. Describí en el PR los cambios de gameplay, accesibilidad, API o despliegue.
