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
      row.innerHTML = `<span>${index + 1}. ${entry.player_name}</span><strong>${entry.score}</strong>`;
      leaderboardList.appendChild(row);
    });
    if (!data.results.length) {
      leaderboardList.innerHTML = '<p class="microcopy">Todavía no hay registros.</p>';
    }
  } catch (error) {
    console.error('No se pudo actualizar el ranking', error);
  }
}
