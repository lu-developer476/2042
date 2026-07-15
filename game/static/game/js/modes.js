export const difficulties = {
  easy: { key: 'easy', name: 'Fácil', hp: 26, credits: 420, enemyHp: 0.82, enemySpeed: 0.9, reward: 1.15, score: 0.85 },
  normal: { key: 'normal', name: 'Normal', hp: 20, credits: 300, enemyHp: 1, enemySpeed: 1, reward: 1, score: 1 },
  hard: { key: 'hard', name: 'Difícil', hp: 16, credits: 250, enemyHp: 1.22, enemySpeed: 1.08, reward: 0.9, score: 1.25 },
  nightmare: { key: 'nightmare', name: 'Pesadilla', hp: 12, credits: 220, enemyHp: 1.5, enemySpeed: 1.18, reward: 0.82, score: 1.6 },
};

export const scenarioModifiers = {
  'neon-docks': { name: 'Logística eficiente', creditsPerWave: 20, description: '+20c al limpiar oleada.' },
  'ember-wastes': { name: 'Calor extremo', enemySpeed: 1.06, description: 'Enemigos 6% más rápidos.' },
  'aurora-ruins': { name: 'Ecos de energía', towerRange: 1.05, description: 'Torres con 5% más rango.' },
  'orbital-bastion': { name: 'Suministro orbital', creditsPerWave: 10, towerRange: 1.03, description: '+10c y +3% de rango al limpiar oleada.' },
  'bioforge-canopy': { name: 'Mutación acelerada', enemySpeed: 1.03, creditsPerWave: 15, description: 'Enemigos 3% más rápidos, +15c por oleada.' },
};

export function createEndlessWave(waveNumber) {
  const pool = ['scout', 'crawler', 'ghost', 'tank'];
  const length = Math.min(5 + Math.floor(waveNumber * 0.8), 18);
  const wave = Array.from({ length }, (_, index) => pool[(index + waveNumber) % pool.length]);
  if (waveNumber % 3 === 0) wave.push('boss');
  return wave;
}
