export const enemyTypes = {
  scout: { name: 'Drone Scout', hp: 28, speed: 80, reward: 16, damage: 1, color: '#6df2ff', score: 18 },
  crawler: { name: 'Crawler Unit', hp: 62, speed: 48, reward: 24, damage: 1, color: '#8cff7e', score: 28, resistances: { pulse: 0.88 } },
  tank: { name: 'Tank Mech', hp: 150, speed: 28, reward: 45, damage: 2, color: '#ffbf69', score: 65, resistances: { pulse: 0.72, slow: 0.65 } },
  ghost: { name: 'Ghost Signal', hp: 90, speed: 68, reward: 36, damage: 1, color: '#d8a7ff', score: 48, evadeChance: 0.18, resistances: { slow: 0.5 }, vulnerabilities: { pulse: 1.1 } },
  boss: { name: 'Overseer', hp: 520, speed: 24, reward: 140, damage: 5, color: '#ff5e8e', score: 220, resistances: { pulse: 0.8, slow: 0.55 }, vulnerabilities: { burst: 1.15 } },
};

export const wavePlan = [
  ['scout', 'scout', 'scout', 'crawler'],
  ['scout', 'scout', 'crawler', 'crawler', 'ghost'],
  ['scout', 'ghost', 'crawler', 'crawler', 'tank'],
  ['ghost', 'ghost', 'crawler', 'tank', 'tank'],
  ['scout', 'scout', 'ghost', 'ghost', 'tank', 'tank'],
  ['crawler', 'crawler', 'tank', 'ghost', 'tank', 'ghost'],
  ['ghost', 'ghost', 'tank', 'tank', 'tank'],
  ['boss', 'ghost', 'tank'],
];
