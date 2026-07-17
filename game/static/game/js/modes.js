import { wavePlan } from './waves.js';

export const difficulties = {
  easy: { key: 'easy', name: 'Fácil', hp: 26, credits: 420, enemyHp: 0.82, enemySpeed: 0.9, reward: 1.15, score: 0.85, stageHp: 0.08, stageSpeed: 0.012, reinforcements: 0.35 },
  normal: { key: 'normal', name: 'Normal', hp: 20, credits: 300, enemyHp: 1, enemySpeed: 1, reward: 1, score: 1, stageHp: 0.12, stageSpeed: 0.018, reinforcements: 0.65 },
  hard: { key: 'hard', name: 'Difícil', hp: 16, credits: 250, enemyHp: 1.22, enemySpeed: 1.08, reward: 0.9, score: 1.25, stageHp: 0.16, stageSpeed: 0.024, reinforcements: 1 },
  extreme: { key: 'extreme', name: 'Extremo', hp: 14, credits: 230, enemyHp: 1.38, enemySpeed: 1.14, reward: 0.86, score: 1.42, stageHp: 0.2, stageSpeed: 0.03, reinforcements: 1.35 },
  nightmare: { key: 'nightmare', name: 'Pesadilla', hp: 12, credits: 220, enemyHp: 1.5, enemySpeed: 1.18, reward: 0.82, score: 1.6, stageHp: 0.24, stageSpeed: 0.036, reinforcements: 1.7 },
};

const STAGE_WAVE_SIZE = 5;

export function getStageScaling(waveNumber, difficultyKey = 'normal') {
  const difficulty = difficulties[difficultyKey] || difficulties.normal;
  const stage = Math.max(0, Math.floor(Math.max(waveNumber - 1, 0) / STAGE_WAVE_SIZE));
  return {
    stage,
    hp: 1 + stage * difficulty.stageHp,
    speed: 1 + stage * difficulty.stageSpeed,
    damage: 1 + Math.floor(stage / 2) * 0.15,
    reward: 1 + stage * 0.04,
    score: 1 + stage * 0.08,
    reinforcements: Math.floor(stage * difficulty.reinforcements),
  };
}

// Keeps the authored opening waves while adding deterministic reinforcements as each stage advances.
export function createProceduralWave(waveNumber, difficultyKey = 'normal') {
  const safeWaveNumber = Math.max(1, waveNumber);
  const scaling = getStageScaling(safeWaveNumber, difficultyKey);
  const wave = [...wavePlan[(safeWaveNumber - 1) % wavePlan.length]];
  const poolsByStage = [
    ['scout', 'crawler'],
    ['crawler', 'ghost', 'aegis'],
    ['ghost', 'tank', 'saboteur'],
    ['tank', 'aegis', 'saboteur', 'boss'],
  ];
  const pool = poolsByStage[Math.min(scaling.stage, poolsByStage.length - 1)];

  for (let index = 0; index < scaling.reinforcements; index += 1) {
    wave.push(pool[(safeWaveNumber + index + scaling.stage) % pool.length]);
  }
  if (scaling.stage >= 3 && safeWaveNumber % 5 === 0 && !wave.includes('boss')) wave.push('boss');
  return wave;
}

export const scenarioModifiers = {
  'neon-docks': { name: 'Logística eficiente', creditsPerWave: 20, description: '+20c al limpiar oleada.' },
  'ember-wastes': { name: 'Calor extremo', enemySpeed: 1.06, description: 'Enemigos 6% más rápidos.' },
  'aurora-ruins': { name: 'Ecos de energía', towerRange: 1.05, description: 'Torres con 5% más rango.' },
  'orbital-bastion': { name: 'Suministro orbital', creditsPerWave: 10, towerRange: 1.03, description: '+10c y +3% de rango al limpiar oleada.' },
  'bioforge-canopy': { name: 'Mutación acelerada', enemySpeed: 1.03, creditsPerWave: 15, description: 'Enemigos 3% más rápidos, +15c por oleada.' },
};

export function createEndlessWave(waveNumber, difficultyKey = 'normal') {
  const wave = createProceduralWave(waveNumber, difficultyKey);
  const difficulty = difficulties[difficultyKey] || difficulties.normal;
  const extraEnemies = Math.min(10, Math.floor(waveNumber * (0.25 + difficulty.reinforcements * 0.08)));
  const pool = ['crawler', 'ghost', 'tank', 'aegis', 'saboteur'];
  for (let index = 0; index < extraEnemies; index += 1) {
    wave.push(pool[(waveNumber + index) % pool.length]);
  }
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
