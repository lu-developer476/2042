import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import LeaderboardEntry


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
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido.'}, status=400)

    player_name = (payload.get('player_name') or 'Piloto Anónimo').strip()[:30]
    score = int(payload.get('score', 0))
    waves_cleared = int(payload.get('waves_cleared', 0))
    enemies_destroyed = int(payload.get('enemies_destroyed', 0))

    if score < 0 or waves_cleared < 0 or enemies_destroyed < 0:
        return JsonResponse({'error': 'Los valores no pueden ser negativos.'}, status=400)

    entry = LeaderboardEntry.objects.create(
        player_name=player_name or 'Piloto Anónimo',
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
