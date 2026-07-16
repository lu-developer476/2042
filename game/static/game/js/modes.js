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


export const gameModes = {
  tutorial: { key: 'tutorial', name: 'Tutorial', description: 'Aprendé a construir, usar ítems y defender el Core en 3 oleadas guiadas.' },
  campaign: { key: 'campaign', name: 'Campaña', description: 'Una travesía narrativa por los cinco escenarios; cada sector suma sus propias etapas.' },
  free: { key: 'free', name: 'Libre', description: 'La simulación clásica para jugar a tu manera, con 25 oleadas y modo infinito opcional.' },
};

export const campaignStageCounts = [2, 3, 3, 4, 5];
export const campaignStory = [
  'La señal del Overseer emerge entre los contenedores. Asegurá los Muelles de Neón.',
  'El rastro térmico cruza el Desierto Ígneo: el convoy enemigo acelera.',
  'Las Ruinas Aurora revelan un antiguo relé. Evitá que el enemigo lo corrompa.',
  'La transmisión asciende al Bastión Orbital. La defensa ya está en alerta máxima.',
  'El pulso final invade el Dosel Bioforja. Protegé el Core y cortá la mutación.',
];

export const itemTypes = {
  credits: { name: 'Cápsula de créditos', color: '#ffc869', icon: '¢', player: 'Otorga 65 créditos.', enemy: 'Entrega 25 créditos extra al enemigo.' },
  repair: { name: 'Nano-reparador', color: '#6cff95', icon: '+', player: 'Repara 3 HP del Core.', enemy: 'Restaura 35 HP al enemigo.' },
  overcharge: { name: 'Celda de sobrecarga', color: '#6df2ff', icon: '⚡', player: 'Las torres disparan más rápido durante 7 segundos.', enemy: 'Aumenta su velocidad durante 5 segundos.' },
  shield: { name: 'Escudo prismático', color: '#d8a7ff', icon: '◈', player: 'Da un escudo de 4 HP al Core.', enemy: 'Otorga 40 puntos de escudo.' },
};
