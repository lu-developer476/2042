export async function saveScore(state, refreshLeaderboardFn = refreshLeaderboard) {
  try {
    await fetch(window.GAME_CONFIG.saveScoreUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': window.GAME_CONFIG.csrfToken,
      },
      body: JSON.stringify({
        player_name: state.playerName,
        score: state.score,
        waves_cleared: Math.max(state.currentWaveIndex + (state.gameOver && state.hp > 0 ? 1 : 0), 0),
        enemies_destroyed: state.kills,
        scenario: state.scenarioName,
        duration_seconds: state.startedAt ? Math.round((Date.now() - state.startedAt) / 1000) : 0,
        difficulty: state.difficulty,
        towers_built: state.towersBuilt,
        towers_upgraded: state.towersUpgraded,
        abilities_used: state.abilitiesUsed,
        game_seed: state.gameSeed,
      }),
    });
    await refreshLeaderboardFn();
  } catch (error) {
    console.error('No se pudo guardar el score', error);
  }
}

export async function refreshLeaderboard() {
  const leaderboardList = document.getElementById('leaderboard-list');
  try {
    const response = await fetch(window.GAME_CONFIG.leaderboardApiUrl);
    const data = await response.json();
    leaderboardList.innerHTML = '';
    data.results.slice(0, 10).forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = 'leaderboard-row';
      row.innerHTML = `<span>${index + 1}. ${entry.player_name}<small>${entry.scenario || 'Escenario'} · ${entry.difficulty || 'normal'} · ${entry.duration_seconds || 0}s</small></span><strong>${entry.score}</strong>`;
      leaderboardList.appendChild(row);
    });
    if (!data.results.length) {
      leaderboardList.innerHTML = '<p class="microcopy">Todavía no hay registros.</p>';
    }
  } catch (error) {
    console.error('No se pudo actualizar el ranking', error);
  }
}
