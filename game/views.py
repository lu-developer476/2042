import json

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from .models import LeaderboardEntry

DEFAULT_PLAYER_NAME = 'Piloto Anónimo'
MAX_PLAYER_NAME_LENGTH = 30
MAX_SCORE = 999_999
MAX_WAVES_CLEARED = 8
MAX_ENEMIES_DESTROYED = 1_000


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
            'player_name', 'score', 'waves_cleared', 'enemies_destroyed', 'created_at'
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
    except ValueError as exc:
        return JsonResponse({'error': str(exc)}, status=400)

    entry = LeaderboardEntry.objects.create(
        player_name=player_name or DEFAULT_PLAYER_NAME,
        score=score,
        waves_cleared=waves_cleared,
        enemies_destroyed=enemies_destroyed,
    )

    return JsonResponse(
        {
            'message': 'Puntaje guardado correctamente.',
            'entry': {
                'player_name': entry.player_name,
                'score': entry.score,
                'waves_cleared': entry.waves_cleared,
                'enemies_destroyed': entry.enemies_destroyed,
            },
        },
        status=201,
    )
