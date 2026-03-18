const canvas = document.getElementById('battlefield');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('start-game');
const nextWaveButton = document.getElementById('next-wave');
const pauseButton = document.getElementById('pause-game');
const restartButton = document.getElementById('restart-game');
const overlayMessage = document.getElementById('overlay-message');
const towerShop = document.getElementById('tower-shop');
const selectedTowerPanel = document.getElementById('selected-tower-panel');
const playerNameInput = document.getElementById('player-name');

const hud = {
  hp: document.getElementById('hp-value'),
  credits: document.getElementById('credits-value'),
  wave: document.getElementById('wave-value'),
  kills: document.getElementById('kills-value'),
  score: document.getElementById('score-value'),
};

const pathPoints = [
  { x: 0, y: 90 },
  { x: 190, y: 90 },
  { x: 190, y: 190 },
  { x: 460, y: 190 },
  { x: 460, y: 340 },
  { x: 780, y: 340 },
  { x: 780, y: 470 },
  { x: 960, y: 470 },
];

const buildNodes = [
  { id: 1, x: 135, y: 205, occupied: null },
  { id: 2, x: 290, y: 110, occupied: null },
  { id: 3, x: 340, y: 295, occupied: null },
  { id: 4, x: 520, y: 110, occupied: null },
  { id: 5, x: 610, y: 260, occupied: null },
  { id: 6, x: 710, y: 420, occupied: null },
  { id: 7, x: 870, y: 300, occupied: null },
];

const towerTypes = {
  pulse: {
    key: 'pulse',
    name: 'Pulse Tower',
    cost: 110,
    color: '#6df2ff',
    radius: 62,
    description: 'Torre estable para cubrir cualquier sector sin volverse la prima donna del mapa.',
    upgrades: [
      { damage: 14, range: 150, cooldown: 0.85 },
      { damage: 18, range: 160, cooldown: 0.82 },
      { damage: 23, range: 168, cooldown: 0.75 },
      { damage: 28, range: 176, cooldown: 0.7 },
      { damage: 34, range: 185, cooldown: 0.64 },
    ],
    upgradeCosts: [150, 220, 320, 470],
  },
  sniper: {
    key: 'sniper',
    name: 'Sniper Tower',
    cost: 160,
    color: '#8c78ff',
    radius: 62,
    description: 'Daño alto y alcance criminal. Dispara lento, pero cuando pega, pega con odio.',
    upgrades: [
      { damage: 38, range: 250, cooldown: 1.5 },
      { damage: 46, range: 270, cooldown: 1.42 },
      { damage: 55, range: 290, cooldown: 1.34 },
      { damage: 66, range: 305, cooldown: 1.26 },
      { damage: 80, range: 320, cooldown: 1.18 },
    ],
    upgradeCosts: [220, 310, 430, 610],
  },
  shock: {
    key: 'shock',
    name: 'Shock Tower',
    cost: 140,
    color: '#ffd166',
    radius: 62,
    description: 'Control de masas. Daño decente y slow que arruina cualquier sprint enemigo.',
    upgrades: [
      { damage: 9, range: 145, cooldown: 0.95, slow: 0.2 },
      { damage: 11, range: 155, cooldown: 0.9, slow: 0.25 },
      { damage: 13, range: 165, cooldown: 0.85, slow: 0.3 },
      { damage: 15, range: 175, cooldown: 0.8, slow: 0.34 },
      { damage: 18, range: 185, cooldown: 0.75, slow: 0.38 },
    ],
    upgradeCosts: [180, 260, 360, 500],
  },
  burst: {
    key: 'burst',
    name: 'Burst Tower',
    cost: 130,
    color: '#ff5e8e',
    radius: 62,
    description: 'Cadencia corta y sucia. Cada ataque lanza una ráfaga de 5 disparos.',
    upgrades: [
      { damage: 4, range: 130, cooldown: 1.55, burstShots: 5, shotDelay: 0.08 },
      { damage: 5, range: 138, cooldown: 1.45, burstShots: 5, shotDelay: 0.075 },
      { damage: 6, range: 146, cooldown: 1.34, burstShots: 5, shotDelay: 0.07 },
      { damage: 7, range: 154, cooldown: 1.24, burstShots: 5, shotDelay: 0.065 },
      { damage: 8, range: 162, cooldown: 1.12, burstShots: 5, shotDelay: 0.06, critChance: 0.18 },
    ],
    upgradeCosts: [170, 240, 340, 490],
  },
};

const enemyTypes = {
  scout: { name: 'Drone Scout', hp: 28, speed: 80, reward: 16, damage: 1, color: '#6df2ff', score: 18 },
  crawler: { name: 'Crawler Unit', hp: 62, speed: 48, reward: 24, damage: 1, color: '#8cff7e', score: 28 },
  tank: { name: 'Tank Mech', hp: 150, speed: 28, reward: 45, damage: 2, color: '#ffbf69', score: 65 },
  ghost: { name: 'Ghost Signal', hp: 90, speed: 68, reward: 36, damage: 1, color: '#d8a7ff', score: 48, evadeChance: 0.18 },
  boss: { name: 'Overseer', hp: 520, speed: 24, reward: 140, damage: 5, color: '#ff5e8e', score: 220 },
};

const wavePlan = [
  ['scout', 'scout', 'scout', 'crawler'],
  ['scout', 'scout', 'crawler', 'crawler', 'ghost'],
  ['scout', 'ghost', 'crawler', 'crawler', 'tank'],
  ['ghost', 'ghost', 'crawler', 'tank', 'tank'],
  ['scout', 'scout', 'ghost', 'ghost', 'tank', 'tank'],
  ['crawler', 'crawler', 'tank', 'ghost', 'tank', 'ghost'],
  ['ghost', 'ghost', 'tank', 'tank', 'tank'],
  ['boss', 'ghost', 'tank'],
];

const state = {
  started: false,
  paused: false,
  gameOver: false,
  hasSavedScore: false,
  hp: 20,
  credits: 300,
  currentWaveIndex: -1,
  totalWaves: wavePlan.length,
  kills: 0,
  score: 0,
  selectedTowerType: null,
  selectedTowerId: null,
  towers: [],
  enemies: [],
  projectiles: [],
  floatingTexts: [],
  pendingSpawn: null,
  waveInProgress: false,
  playerName: 'Piloto Anónimo',
  lastFrame: 0,
};

function deepCloneNodes() {
  return buildNodes.map((node) => ({ ...node, occupied: null }));
}

let nodes = deepCloneNodes();

class Enemy {
  constructor(typeKey) {
    const type = enemyTypes[typeKey];
    this.typeKey = typeKey;
    this.name = type.name;
    this.maxHp = type.hp;
    this.hp = type.hp;
    this.baseSpeed = type.speed;
    this.speed = type.speed;
    this.reward = type.reward;
    this.damage = type.damage;
    this.color = type.color;
    this.scoreValue = type.score;
    this.evadeChance = type.evadeChance || 0;
    this.radius = typeKey === 'boss' ? 20 : 12;
    this.pathIndex = 0;
    this.x = pathPoints[0].x;
    this.y = pathPoints[0].y;
    this.slowTimer = 0;
  }

  update(dt) {
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.speed = this.baseSpeed;
    }

    const next = pathPoints[this.pathIndex + 1];
    if (!next) {
      state.hp -= this.damage;
      createFloatingText(this.x - 6, this.y - 20, `-${this.damage} CORE`, '#ff7ca7');
      return false;
    }

    const dx = next.x - this.x;
    const dy = next.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) {
      this.pathIndex += 1;
      return true;
    }

    const step = this.speed * dt;
    this.x += (dx / distance) * Math.min(step, distance);
    this.y += (dy / distance) * Math.min(step, distance);
    return true;
  }

  draw() {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(this.x - 18, this.y - 24, 36, 5);
    ctx.fillStyle = '#6cff95';
    ctx.fillRect(this.x - 18, this.y - 24, 36 * (this.hp / this.maxHp), 5);
    ctx.restore();
  }
}

class Tower {
  constructor(typeKey, node) {
    this.id = crypto.randomUUID();
    this.typeKey = typeKey;
    this.type = towerTypes[typeKey];
    this.nodeId = node.id;
    this.x = node.x;
    this.y = node.y;
    this.level = 1;
    this.cooldownRemaining = 0;
    this.pendingShots = [];
    this.applyUpgradeStats();
  }

  applyUpgradeStats() {
    const stats = this.type.upgrades[this.level - 1];
    Object.assign(this, stats);
  }

  get upgradeCost() {
    return this.level < 5 ? this.type.upgradeCosts[this.level - 1] : null;
  }

  update(dt) {
    if (this.cooldownRemaining > 0) this.cooldownRemaining -= dt;

    if (this.pendingShots.length) {
      for (let i = this.pendingShots.length - 1; i >= 0; i -= 1) {
        this.pendingShots[i].timer -= dt;
        if (this.pendingShots[i].timer <= 0) {
          const enemy = this.pendingShots[i].enemy;
          if (enemy && state.enemies.includes(enemy)) {
            fireProjectile(this, enemy, this.damage, this.typeKey === 'shock');
          }
          this.pendingShots.splice(i, 1);
        }
      }
    }

    if (this.cooldownRemaining > 0) return;
    const target = this.acquireTarget();
    if (!target) return;

    if (this.typeKey === 'burst') {
      for (let i = 0; i < this.burstShots; i += 1) {
        this.pendingShots.push({ enemy: target, timer: i * this.shotDelay });
      }
    } else {
      fireProjectile(this, target, this.damage, this.typeKey === 'shock');
    }

    this.cooldownRemaining = this.cooldown;
  }

  acquireTarget() {
    let best = null;
    let furthest = -1;
    for (const enemy of state.enemies) {
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist <= this.range) {
        if (enemy.pathIndex > furthest) {
          furthest = enemy.pathIndex;
          best = enemy;
        }
      }
    }
    return best;
  }

  upgrade() {
    if (this.level >= 5 || state.credits < this.upgradeCost) return false;
    state.credits -= this.upgradeCost;
    this.level += 1;
    this.applyUpgradeStats();
    updateHud();
    renderSelectedTower();
    return true;
  }

  draw() {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = this.type.color;
    ctx.arc(this.x, this.y, this.type.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#08121e';
    ctx.arc(this.x, this.y, this.type.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    if (this.id === state.selectedTowerId) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(109,242,255,0.35)';
      ctx.lineWidth = 2;
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#edf5ff';
    ctx.font = '12px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(`Lv.${this.level}`, this.x, this.y + 4);
    ctx.restore();
  }
}

class Projectile {
  constructor(fromX, fromY, target, damage, isShock, critChance = 0) {
    this.x = fromX;
    this.y = fromY;
    this.target = target;
    this.damage = damage;
    this.speed = 480;
    this.radius = isShock ? 4 : 3;
    this.color = isShock ? '#ffd166' : '#ffffff';
    this.isShock = isShock;
    this.critChance = critChance;
  }

  update(dt) {
    if (!this.target || !state.enemies.includes(this.target)) return false;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < this.target.radius + 2) {
      let appliedDamage = this.damage;
      if (Math.random() < (this.target.evadeChance || 0)) {
        createFloatingText(this.target.x, this.target.y - 18, 'MISS', '#d8a7ff');
        return false;
      }
      if (Math.random() < this.critChance) {
        appliedDamage *= 2;
        createFloatingText(this.target.x, this.target.y - 24, 'CRIT', '#ffc869');
      }
      this.target.hp -= appliedDamage;
      createFloatingText(this.target.x, this.target.y - 12, `-${appliedDamage}`, this.isShock ? '#ffd166' : '#ffffff');
      if (this.isShock) {
        this.target.speed = this.target.baseSpeed * (1 - 0.2);
        this.target.slowTimer = 0.7;
      }
      if (this.target.hp <= 0) {
        destroyEnemy(this.target);
      }
      return false;
    }

    const step = this.speed * dt;
    this.x += (dx / distance) * Math.min(step, distance);
    this.y += (dy / distance) * Math.min(step, distance);
    return true;
  }

  draw() {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function fireProjectile(tower, target, damage, isShock = false) {
  const critChance = tower.typeKey === 'burst' && tower.level === 5 ? tower.critChance || 0 : 0;
  state.projectiles.push(new Projectile(tower.x, tower.y, target, damage, isShock, critChance));
}

function createFloatingText(x, y, text, color = '#ffffff') {
  state.floatingTexts.push({ x, y, text, color, alpha: 1, life: 0.8 });
}

function destroyEnemy(enemy) {
  state.enemies = state.enemies.filter((entry) => entry !== enemy);
  state.credits += enemy.reward;
  state.kills += 1;
  state.score += enemy.scoreValue;
  createFloatingText(enemy.x, enemy.y - 28, `+${enemy.reward}c`, '#6cff95');
  updateHud();
}

function resetState() {
  state.started = false;
  state.paused = false;
  state.gameOver = false;
  state.hasSavedScore = false;
  state.hp = 20;
  state.credits = 300;
  state.currentWaveIndex = -1;
  state.kills = 0;
  state.score = 0;
  state.selectedTowerType = null;
  state.selectedTowerId = null;
  state.towers = [];
  state.enemies = [];
  state.projectiles = [];
  state.floatingTexts = [];
  state.pendingSpawn = null;
  state.waveInProgress = false;
  nodes = deepCloneNodes();
  overlayMessage.classList.remove('hidden');
  overlayMessage.innerHTML = '2042 // Simulación lista<br><small>Elegí un nombre y arrancá.</small>';
  nextWaveButton.disabled = true;
  pauseButton.disabled = true;
  pauseButton.textContent = 'Pausar';
  renderShop();
  renderSelectedTower();
  updateHud();
}

function startGame() {
  state.started = true;
  state.playerName = playerNameInput.value.trim() || 'Piloto Anónimo';
  overlayMessage.classList.add('hidden');
  nextWaveButton.disabled = false;
  pauseButton.disabled = false;
  startButton.disabled = true;
}

function updateHud() {
  hud.hp.textContent = Math.max(state.hp, 0);
  hud.credits.textContent = state.credits;
  hud.wave.textContent = `${Math.max(state.currentWaveIndex + (state.waveInProgress ? 1 : 0), 0)} / ${state.totalWaves}`;
  hud.kills.textContent = state.kills;
  hud.score.textContent = state.score;
}

function renderShop() {
  towerShop.innerHTML = '';
  Object.values(towerTypes).forEach((towerType) => {
    const button = document.createElement('button');
    button.className = `tower-card ${state.selectedTowerType === towerType.key ? 'active' : ''}`;
    button.innerHTML = `
      <h3>${towerType.name} · ${towerType.cost}c</h3>
      <p>${towerType.description}</p>
      <ul>
        <li>Mejoras: 5 niveles</li>
        <li>Costo inicial: ${towerType.cost}</li>
      </ul>
    `;
    button.addEventListener('click', () => {
      state.selectedTowerType = towerType.key;
      state.selectedTowerId = null;
      renderShop();
      renderSelectedTower();
    });
    towerShop.appendChild(button);
  });
}

function renderSelectedTower() {
  const tower = state.towers.find((entry) => entry.id === state.selectedTowerId);
  if (!tower) {
    selectedTowerPanel.innerHTML = '<p class="microcopy">Seleccioná una torre construida para inspeccionarla o mejorarla.</p>';
    return;
  }

  const nextLevel = tower.level < 5 ? tower.level + 1 : null;
  const nextUpgrade = nextLevel ? tower.type.upgrades[nextLevel - 1] : null;

  selectedTowerPanel.innerHTML = `
    <div class="stat-list">
      <div><strong>${tower.type.name}</strong> · Nivel ${tower.level}/5</div>
      <div>Daño: <strong>${tower.damage}</strong></div>
      <div>Rango: <strong>${tower.range}</strong></div>
      <div>Cooldown: <strong>${tower.cooldown.toFixed(2)}s</strong></div>
      ${tower.typeKey === 'burst' ? `<div>Ráfaga: <strong>${tower.burstShots} tiros</strong></div>` : ''}
      ${tower.typeKey === 'shock' ? `<div>Slow: <strong>${Math.round((tower.slow || 0) * 100)}%</strong></div>` : ''}
      <div>
        Próxima mejora:
        <strong>${nextUpgrade ? `Nivel ${nextLevel} por ${tower.upgradeCost}c` : 'MAX'}</strong>
      </div>
    </div>
  `;

  if (nextUpgrade) {
    const upgradeButton = document.createElement('button');
    upgradeButton.className = 'button primary small';
    upgradeButton.textContent = `Mejorar (${tower.upgradeCost}c)`;
    upgradeButton.disabled = state.credits < tower.upgradeCost;
    upgradeButton.addEventListener('click', () => tower.upgrade());
    selectedTowerPanel.appendChild(upgradeButton);
  }
}

function spawnWave() {
  if (!state.started || state.waveInProgress || state.currentWaveIndex + 1 >= wavePlan.length || state.gameOver) return;
  state.currentWaveIndex += 1;
  const queue = [...wavePlan[state.currentWaveIndex]];
  state.pendingSpawn = { queue, timer: 0.6 };
  state.waveInProgress = true;
  nextWaveButton.disabled = true;
  updateHud();
  overlayMessage.classList.add('hidden');
}

function updateSpawns(dt) {
  if (!state.pendingSpawn) return;
  state.pendingSpawn.timer -= dt;
  if (state.pendingSpawn.timer <= 0 && state.pendingSpawn.queue.length) {
    const enemyType = state.pendingSpawn.queue.shift();
    state.enemies.push(new Enemy(enemyType));
    state.pendingSpawn.timer = enemyType === 'boss' ? 1.25 : 0.85;
  }
  if (!state.pendingSpawn.queue.length && !state.enemies.length) {
    state.pendingSpawn = null;
    state.waveInProgress = false;
    if (state.currentWaveIndex + 1 >= wavePlan.length) {
      finishGame(true);
    } else {
      state.credits += 80 + state.currentWaveIndex * 15;
      state.score += 100;
      createFloatingText(820, 60, `BONUS +${80 + state.currentWaveIndex * 15}c`, '#6df2ff');
      nextWaveButton.disabled = false;
      updateHud();
    }
  }
}

function finishGame(victory) {
  state.gameOver = true;
  state.waveInProgress = false;
  state.pendingSpawn = null;
  nextWaveButton.disabled = true;
  pauseButton.disabled = true;
  startButton.disabled = false;

  const title = victory ? 'SECTOR ASEGURADO' : 'CORE COLAPSADO';
  const subtitle = victory
    ? `Sobreviviste a las ${state.totalWaves} oleadas.`
    : `Llegaste hasta la oleada ${Math.max(state.currentWaveIndex + 1, 0)}.`;

  overlayMessage.classList.remove('hidden');
  overlayMessage.innerHTML = `${title}<br><small>${subtitle}<br>Score final: ${state.score}</small>`;

  if (!state.hasSavedScore) {
    saveScore();
    state.hasSavedScore = true;
  }
}

async function saveScore() {
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
    await refreshLeaderboard();
  } catch (error) {
    console.error('No se pudo guardar el score', error);
  }
}

async function refreshLeaderboard() {
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

function drawBattlefield() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#08111f');
  gradient.addColorStop(1, '#04070d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawPath();
  drawNodes();
  drawCore();

  state.towers.forEach((tower) => tower.draw());
  state.projectiles.forEach((projectile) => projectile.draw());
  state.enemies.forEach((enemy) => enemy.draw());
  drawFloatingTexts();
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(109, 242, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPath() {
  ctx.save();
  ctx.strokeStyle = 'rgba(117, 195, 255, 0.28)';
  ctx.lineWidth = 34;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (const point of pathPoints.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(109, 242, 255, 0.75)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (const point of pathPoints.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawNodes() {
  nodes.forEach((node) => {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = node.occupied ? 'rgba(109, 242, 255, 0.14)' : 'rgba(255,255,255,0.04)';
    ctx.strokeStyle = node.occupied ? 'rgba(109, 242, 255, 0.45)' : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.arc(node.x, node.y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}

function drawCore() {
  ctx.save();
  ctx.translate(900, 470);
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255, 94, 142, 0.18)';
  ctx.arc(0, 0, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.strokeStyle = '#ff5e8e';
  ctx.lineWidth = 4;
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#edf5ff';
  ctx.font = '12px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('CORE', 0, 5);
  ctx.restore();
}

function drawFloatingTexts() {
  state.floatingTexts.forEach((item) => {
    ctx.save();
    ctx.globalAlpha = item.alpha;
    ctx.fillStyle = item.color;
    ctx.font = 'bold 14px Orbitron';
    ctx.fillText(item.text, item.x, item.y);
    ctx.restore();
  });
}

function updateFloatingTexts(dt) {
  for (let i = state.floatingTexts.length - 1; i >= 0; i -= 1) {
    const item = state.floatingTexts[i];
    item.life -= dt;
    item.alpha = Math.max(item.life / 0.8, 0);
    item.y -= 20 * dt;
    if (item.life <= 0) state.floatingTexts.splice(i, 1);
  }
}

function updateGame(dt) {
  if (!state.started || state.paused || state.gameOver) return;

  updateSpawns(dt);
  state.towers.forEach((tower) => tower.update(dt));
  state.projectiles = state.projectiles.filter((projectile) => projectile.update(dt));
  state.enemies = state.enemies.filter((enemy) => enemy.update(dt));
  updateFloatingTexts(dt);

  if (state.hp <= 0 && !state.gameOver) {
    finishGame(false);
  }
  if (!state.waveInProgress && !state.pendingSpawn && state.currentWaveIndex >= 0) {
    updateHud();
  }
}

function animate(timestamp) {
  if (!state.lastFrame) state.lastFrame = timestamp;
  const dt = Math.min((timestamp - state.lastFrame) / 1000, 0.033);
  state.lastFrame = timestamp;
  updateGame(dt);
  drawBattlefield();
  requestAnimationFrame(animate);
}

function getCanvasCoordinates(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function handleCanvasClick(event) {
  if (!state.started || state.gameOver) return;
  const { x, y } = getCanvasCoordinates(event);

  const clickedTower = state.towers.find((tower) => Math.hypot(tower.x - x, tower.y - y) <= tower.type.radius);
  if (clickedTower) {
    state.selectedTowerId = clickedTower.id;
    state.selectedTowerType = null;
    renderShop();
    renderSelectedTower();
    return;
  }

  const node = nodes.find((entry) => Math.hypot(entry.x - x, entry.y - y) <= 28);
  if (!node || node.occupied || !state.selectedTowerType) return;

  const towerType = towerTypes[state.selectedTowerType];
  if (state.credits < towerType.cost) {
    createFloatingText(node.x - 15, node.y - 34, 'SIN CRÉDITOS', '#ff7ca7');
    return;
  }

  state.credits -= towerType.cost;
  const tower = new Tower(state.selectedTowerType, node);
  node.occupied = tower.id;
  state.towers.push(tower);
  state.selectedTowerId = tower.id;
  updateHud();
  renderSelectedTower();
}

startButton.addEventListener('click', startGame);
nextWaveButton.addEventListener('click', spawnWave);
pauseButton.addEventListener('click', () => {
  if (!state.started || state.gameOver) return;
  state.paused = !state.paused;
  pauseButton.textContent = state.paused ? 'Reanudar' : 'Pausar';
  if (state.paused) {
    overlayMessage.classList.remove('hidden');
    overlayMessage.innerHTML = 'SIMULACIÓN EN PAUSA';
  } else {
    overlayMessage.classList.add('hidden');
  }
});
restartButton.addEventListener('click', () => {
  startButton.disabled = false;
  resetState();
});
canvas.addEventListener('click', handleCanvasClick);

resetState();
refreshLeaderboard();
requestAnimationFrame(animate);
