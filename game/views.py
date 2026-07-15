import json

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from .models import LeaderboardEntry

DEFAULT_PLAYER_NAME = 'Piloto Anónimo'
MAX_PLAYER_NAME_LENGTH = 30
MAX_SCORE = 999_999
MAX_WAVES_CLEARED = 999
MAX_ENEMIES_DESTROYED = 1_000
MAX_DURATION_SECONDS = 24 * 60 * 60
MAX_TOWERS_BUILT = 200
MAX_TOWERS_UPGRADED = 800
MAX_ABILITIES_USED = 500
MAX_REPLAY_TEXT_LENGTH = 64


def _clean_replay_text(value, default='', max_length=MAX_REPLAY_TEXT_LENGTH):
    return str(value or default).strip()[:max_length]


def _parse_non_negative_int(payload, field_name, max_value):
    raw_value = payload.get(field_name, 0)
    try:
        value = int(raw_value)
    except (TypeError, ValueError):
        raise ValueError(f'El campo {field_name} debe ser un número entero.')

    if value < 0:
        raise ValueError(f'El campo {field_name} no puede ser negativo.')
    if value > max_value:
        raise ValueError(f'El campo {field_name} no puede superar {max_value}.')
    return value


@ensure_csrf_cookie
def home(request):
    top_entries = LeaderboardEntry.objects.all()[:10]
    return render(request, 'game/home.html', {'top_entries': top_entries})


@require_GET
def leaderboard(request):
    top_entries = LeaderboardEntry.objects.all()[:50]
    return render(request, 'game/leaderboard.html', {'top_entries': top_entries})


@require_GET
def leaderboard_api(request):
    data = list(
        LeaderboardEntry.objects.values(
            'id', 'player_name', 'score', 'waves_cleared', 'enemies_destroyed', 'scenario',
            'duration_seconds', 'difficulty', 'towers_built', 'towers_upgraded', 'abilities_used',
            'game_seed', 'created_at'
        )[:20]
    )
    return JsonResponse({'results': data})


@require_POST
def save_score(request):
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except UnicodeDecodeError:
        return JsonResponse({'error': 'El cuerpo de la solicitud debe usar UTF-8.'}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido.'}, status=400)

    if not isinstance(payload, dict):
        return JsonResponse({'error': 'El JSON debe ser un objeto.'}, status=400)

    player_name = (payload.get('player_name') or DEFAULT_PLAYER_NAME).strip()[
        :MAX_PLAYER_NAME_LENGTH
    ]

    try:
        score = _parse_non_negative_int(payload, 'score', MAX_SCORE)
        waves_cleared = _parse_non_negative_int(payload, 'waves_cleared', MAX_WAVES_CLEARED)
        enemies_destroyed = _parse_non_negative_int(
            payload, 'enemies_destroyed', MAX_ENEMIES_DESTROYED
        )
        duration_seconds = _parse_non_negative_int(payload, 'duration_seconds', MAX_DURATION_SECONDS)
        towers_built = _parse_non_negative_int(payload, 'towers_built', MAX_TOWERS_BUILT)
        towers_upgraded = _parse_non_negative_int(payload, 'towers_upgraded', MAX_TOWERS_UPGRADED)
        abilities_used = _parse_non_negative_int(payload, 'abilities_used', MAX_ABILITIES_USED)
    except ValueError as exc:
        return JsonResponse({'error': str(exc)}, status=400)

    entry = LeaderboardEntry.objects.create(
        player_name=player_name or DEFAULT_PLAYER_NAME,
        score=score,
        waves_cleared=waves_cleared,
        enemies_destroyed=enemies_destroyed,
        scenario=_clean_replay_text(payload.get('scenario')),
        duration_seconds=duration_seconds,
        difficulty=_clean_replay_text(payload.get('difficulty'), default='normal', max_length=30),
        towers_built=towers_built,
        towers_upgraded=towers_upgraded,
        abilities_used=abilities_used,
        game_seed=_clean_replay_text(payload.get('game_seed')),
    )

    return JsonResponse(
        {
            'message': 'Puntaje guardado correctamente.',
            'entry': {
                'player_name': entry.player_name,
                'score': entry.score,
                'waves_cleared': entry.waves_cleared,
                'enemies_destroyed': entry.enemies_destroyed,
                'scenario': entry.scenario,
                'duration_seconds': entry.duration_seconds,
                'difficulty': entry.difficulty,
                'towers_built': entry.towers_built,
                'towers_upgraded': entry.towers_upgraded,
                'abilities_used': entry.abilities_used,
                'game_seed': entry.game_seed,
            },
        },
        status=201,
    )
