import { soundEngine } from './audio.js';
import { scenarios } from './scenarios.js';
import { towerTypes } from './towers.js';
import { enemyTypes, wavePlan } from './waves.js';
import { state } from './state.js';
import { saveScore, refreshLeaderboard } from './api.js';
import { difficulties, scenarioModifiers, createEndlessWave } from './modes.js';

const canvas = document.getElementById('battlefield');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('start-game');
const nextWaveButton = document.getElementById('next-wave');
const pauseButton = document.getElementById('pause-game');
const restartButton = document.getElementById('restart-game');
const overlayMessage = document.getElementById('overlay-message');
const towerShop = document.getElementById('tower-shop');
const selectedTowerPanel = document.getElementById('selected-tower-panel');
const nodeCommandPopover = document.getElementById('node-command-popover');
const nodeCommandClose = document.getElementById('node-command-close');
const nodeCommandKicker = document.getElementById('node-command-kicker');
const nodeCommandTitle = document.getElementById('node-command-title');
const nodeCommandHelp = document.getElementById('node-command-help');
const playerNameInput = document.getElementById('player-name');
const speedButton = document.getElementById('speed-toggle');
const empButton = document.getElementById('emp-ability');
const repairButton = document.getElementById('repair-ability');
const overclockButton = document.getElementById('overclock-ability');
const wavePreview = document.getElementById('wave-preview');
const comboValue = document.getElementById('combo-value');
const speedValue = document.getElementById('speed-value');
const scenarioValue = document.getElementById('scenario-value');
const scenarioPicker = document.getElementById('scenario-picker');
const difficultyPicker = document.getElementById('difficulty-picker');
const scenarioSelect = document.getElementById('scenario-select');
const difficultySelect = document.getElementById('difficulty-select');
const endlessModeInput = document.getElementById('endless-mode');
const playDialog = document.getElementById('play-dialog');
const defenseStatusValue = document.getElementById('defense-status-value');
const defenseStatusPanelValue = document.getElementById('defense-status-panel-value');
const accessibleStatus = document.getElementById('accessible-status');
const muteAudioButton = document.getElementById('mute-audio');
const volumeControl = document.getElementById('volume-control');
const reducedMotionInput = document.getElementById('reduced-motion');

const hud = {
  hp: document.getElementById('hp-value'),
  hpDetail: document.getElementById('hp-detail-value'),
  credits: document.getElementById('credits-value'),
  creditsDetail: document.getElementById('credits-detail-value'),
  wave: document.getElementById('wave-value'),
  waveDetail: document.getElementById('wave-detail-value'),
  kills: document.getElementById('kills-value'),
  score: document.getElementById('score-value'),
};

function initInfoDialogs() {
  document.querySelectorAll('[data-dialog-target]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      soundEngine.play('ui');
      const dialog = document.getElementById(trigger.dataset.dialogTarget);
      if (!dialog) return;
      window.I18N_2042?.openDialog?.(dialog);
    });
  });

  document.querySelectorAll('.info-dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('[data-dialog-close]')) {
        window.I18N_2042?.closeDialog?.(dialog);
      }
    });
  });

  document.querySelectorAll('.play-popover').forEach((popover) => {
    popover.addEventListener('toggle', () => {
      if (!popover.open) return;
      document.querySelectorAll('.play-popover[open]').forEach((openPopover) => {
        if (openPopover !== popover) openPopover.open = false;
      });
    });
  });

  playDialog?.addEventListener('click', (event) => {
    const openPopover = playDialog.querySelector('.play-popover[open]');
    if (!openPopover) return;
    const isPanelClick = event.target.closest('.play-popover-panel');
    const isTriggerClick = event.target.closest('.play-popover-trigger');
    if (!isPanelClick && !isTriggerClick) openPopover.open = false;
  });

  playDialog?.addEventListener('close', () => {
    playDialog.querySelectorAll('.play-popover[open]').forEach((popover) => {
      popover.open = false;
    });
  });
}

initInfoDialogs();

function getActiveScenario() {
  return scenarios[state.scenarioIndex || 0];
}

function getDifficulty() {
  return difficulties[state.difficulty] || difficulties.normal;
}

function getScenarioModifier() {
  return scenarioModifiers[getActiveScenario().key] || {};
}

function deepCloneNodes() {
  return getActiveScenario().nodes.map((node) => ({ ...node, occupied: null }));
}

let nodes = [];
let activeCommandNode = null;

class Enemy {
  constructor(typeKey, routeIndex = 0) {
    const type = enemyTypes[typeKey];
    this.typeKey = typeKey;
    this.name = type.name;
    const difficulty = getDifficulty();
    const modifier = getScenarioModifier();
    const endlessScale = state.currentWaveIndex >= wavePlan.length ? 1 + ((state.currentWaveIndex - wavePlan.length + 1) * 0.12) : 1;
    this.maxHp = Math.round(type.hp * difficulty.enemyHp * endlessScale);
    this.hp = this.maxHp;
    this.baseSpeed = type.speed * difficulty.enemySpeed * (modifier.enemySpeed || 1);
    this.speed = this.baseSpeed;
    this.reward = Math.round(type.reward * difficulty.reward);
    this.damage = type.damage;
    this.color = type.color;
    this.scoreValue = type.score;
    this.evadeChance = type.evadeChance || 0;
    this.resistances = type.resistances || {};
    this.vulnerabilities = type.vulnerabilities || {};
    this.radius = typeKey === 'boss' ? 20 : 12;
    this.routeIndex = routeIndex;
    this.path = getActiveScenario().routes[routeIndex];
    this.pathIndex = 0;
    this.x = this.path[0].x;
    this.y = this.path[0].y;
    this.rotation = 0;
    this.slowTimer = 0;
  }

  update(dt) {
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.speed = this.baseSpeed;
    }

    const next = this.path[this.pathIndex + 1];
    if (!next) {
      state.hp -= this.damage;
      soundEngine.play('hit');
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
    this.rotation = Math.atan2(dy, dx);
    this.x += (dx / distance) * Math.min(step, distance);
    this.y += (dy / distance) * Math.min(step, distance);
    return true;
  }

  draw() {
    drawEnemyShape(this);

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(this.x - 18, this.y - 24, 36, 5);
    ctx.fillStyle = '#6cff95';
    ctx.fillRect(this.x - 18, this.y - 24, 36 * (this.hp / this.maxHp), 5);
    ctx.restore();
  }
}

class Tower {
  constructor(typeKey, node) {
    this.id = getUniqueId();
    this.typeKey = typeKey;
    this.type = towerTypes[typeKey];
    this.nodeId = node.id;
    this.x = node.x;
    this.y = node.y;
    this.level = 1;
    this.cooldownRemaining = 0;
    this.pendingShots = [];
    this.overclockTimer = 0;
    this.applyUpgradeStats();
  }

  applyUpgradeStats() {
    const stats = this.type.upgrades[this.level - 1];
    Object.assign(this, stats);
    this.range = Math.round(this.range * (getScenarioModifier().towerRange || 1));
  }

  get upgradeCost() {
    return this.level < 5 ? this.type.upgradeCosts[this.level - 1] : null;
  }

  update(dt) {
    if (this.overclockTimer > 0) this.overclockTimer -= dt;
    const fireRateBoost = this.overclockTimer > 0 ? 1.75 : 1;
    if (this.cooldownRemaining > 0) this.cooldownRemaining -= dt * fireRateBoost;

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
    state.towersUpgraded += 1;
    announce(`${this.type.name} mejorada a nivel ${this.level}.`);
    updateHud();
    renderSelectedTower();
    updateAbilityButtons();
    return true;
  }

  draw() {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = this.type.color;
    ctx.arc(this.x, this.y, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#08121e';
    ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
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


function drawEnemyShape(enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(enemy.rotation);
  ctx.shadowColor = enemy.color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = enemy.color;
  ctx.strokeStyle = 'rgba(255,255,255,0.72)';
  ctx.lineWidth = 2;

  if (enemy.typeKey === 'scout') {
    ctx.beginPath();
    ctx.moveTo(enemy.radius + 7, 0);
    ctx.lineTo(-enemy.radius, -enemy.radius * 0.75);
    ctx.lineTo(-enemy.radius * 0.55, 0);
    ctx.lineTo(-enemy.radius, enemy.radius * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemy.typeKey === 'crawler') {
    ctx.fillRect(-enemy.radius, -enemy.radius * 0.7, enemy.radius * 2, enemy.radius * 1.4);
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-enemy.radius * 0.6, i * 7);
      ctx.lineTo(-enemy.radius * 1.45, i * 11);
      ctx.moveTo(enemy.radius * 0.6, i * 7);
      ctx.lineTo(enemy.radius * 1.45, i * 11);
      ctx.stroke();
    }
  } else if (enemy.typeKey === 'tank') {
    ctx.beginPath();
    ctx.roundRect(-enemy.radius * 1.25, -enemy.radius, enemy.radius * 2.5, enemy.radius * 2, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#241308';
    ctx.fillRect(-enemy.radius * 0.25, -enemy.radius * 1.25, enemy.radius * 1.35, enemy.radius * 0.45);
  } else if (enemy.typeKey === 'ghost') {
    ctx.globalAlpha = state.reducedMotion ? 0.9 : 0.78 + Math.sin(performance.now() / 120) * 0.15;
    ctx.beginPath();
    ctx.ellipse(0, 0, enemy.radius * 1.35, enemy.radius * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(enemy.radius * 0.4, -3, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  } else if (enemy.typeKey === 'boss') {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6;
      const r = i % 2 ? enemy.radius * 0.9 : enemy.radius * 1.45;
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#08040a';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
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
      const attackType = this.isShock ? 'slow' : (this.critChance ? 'burst' : 'pulse');
      appliedDamage *= this.target.vulnerabilities?.[attackType] || 1;
      appliedDamage *= this.target.resistances?.[attackType] || 1;
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
        const slowResistance = this.target.resistances?.slow || 1;
        this.target.speed = this.target.baseSpeed * (1 - ((this.slow || 0.2) * slowResistance));
        this.target.slowTimer = 0.7 * slowResistance;
      }
      if (this.target.hp <= 0) {
        destroyEnemy(this.target);
      }
      return false;
    }

    const step = this.speed * dt;
    this.rotation = Math.atan2(dy, dx);
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
  const projectile = new Projectile(tower.x, tower.y, target, damage, isShock, critChance);
  projectile.slow = tower.slow || 0;
  state.projectiles.push(projectile);
}

function getUniqueId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `tower-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function announce(message) {
  if (accessibleStatus) accessibleStatus.textContent = message;
}

function createFloatingText(x, y, text, color = '#ffffff') {
  if (state.reducedMotion) return;
  state.floatingTexts.push({ x, y, text, color, alpha: 1, life: 0.8 });
}

function destroyEnemy(enemy) {
  soundEngine.play('kill');
  state.enemies = state.enemies.filter((entry) => entry !== enemy);
  state.credits += enemy.reward;
  state.kills += 1;
  state.combo = Math.min(state.combo + 0.08, 2.5);
  state.comboTimer = 4;
  state.score += Math.round(enemy.scoreValue * state.combo * getDifficulty().score);
  createFloatingText(enemy.x, enemy.y - 28, `+${enemy.reward}c`, '#6cff95');
  updateHud();
  updateAbilityButtons();
  updateWavePreview();
}


function resetState() {
  state.started = false;
  state.paused = false;
  state.gameOver = false;
  state.hasSavedScore = false;
  const difficulty = getDifficulty();
  state.hp = difficulty.hp;
  state.maxHp = difficulty.hp;
  state.credits = difficulty.credits;
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
  state.speedMultiplier = 1;
  state.combo = 1;
  state.comboTimer = 0;
  state.startedAt = null;
  state.towersBuilt = 0;
  state.towersUpgraded = 0;
  state.abilitiesUsed = 0;
  state.gameSeed = '';
  nodes = deepCloneNodes();
  closeNodeCommand();
  overlayMessage.classList.remove('hidden');
  overlayMessage.innerHTML = '2042 // Simulación lista<br><small>Elegí un nombre y arrancá.</small>';
  nextWaveButton.disabled = true;
  pauseButton.disabled = true;
  pauseButton.textContent = 'Pausar';
  renderShop();
  renderSelectedTower();
  renderScenarioPicker();
  renderDifficultyPicker();
  updateHud();
}

function startGame() {
  soundEngine.play('start');
  state.started = true;
  state.playerName = playerNameInput.value.trim() || 'Piloto Anónimo';
  state.startedAt = Date.now();
  state.gameSeed = `${getActiveScenario().key}-${state.difficulty}-${state.startedAt.toString(36)}`;
  state.scenarioName = getActiveScenario().name;
  overlayMessage.classList.add('hidden');
  nextWaveButton.disabled = false;
  pauseButton.disabled = false;
  startButton.disabled = true;
  if (playDialog?.open) playDialog.close();
  renderScenarioPicker();
  renderDifficultyPicker();
  announce(`Partida iniciada en ${state.scenarioName}, dificultad ${state.difficulty}.`);
  updateHud();
}

function getDefenseStatusText() {
  return state.started && !state.paused && !state.gameOver ? 'Activa' : 'Inactiva';
}

function updateDefenseStatus() {
  const defenseStatusText = getDefenseStatusText();
  [defenseStatusValue, defenseStatusPanelValue].forEach((element) => {
    if (element) element.textContent = defenseStatusText;
  });
}

function updateHud() {
  const hpText = Math.max(state.hp, 0);
  const creditsText = state.credits;
  const waveText = state.endlessMode && state.currentWaveIndex + 1 > state.totalWaves
    ? `${Math.max(state.currentWaveIndex + (state.waveInProgress ? 1 : 0), 0)} / ∞`
    : `${Math.max(state.currentWaveIndex + (state.waveInProgress ? 1 : 0), 0)} / ${state.totalWaves}`;
  hud.hp.textContent = hpText;
  hud.hpDetail.textContent = hpText;
  hud.credits.textContent = creditsText;
  hud.creditsDetail.textContent = creditsText;
  hud.wave.textContent = waveText;
  hud.waveDetail.textContent = waveText;
  hud.kills.textContent = state.kills;
  hud.score.textContent = state.score;
  comboValue.textContent = `x${state.combo.toFixed(2)}`;
  speedValue.textContent = `${state.speedMultiplier}x`;
  scenarioValue.textContent = getActiveScenario().name;
  updateDefenseStatus();
  updateAbilityButtons();
}


function syncSetupSelects() {
  if (scenarioSelect) {
    scenarioSelect.value = String(state.scenarioIndex || 0);
    scenarioSelect.disabled = state.started;
  }
  if (difficultySelect) {
    difficultySelect.value = state.difficulty;
    difficultySelect.disabled = state.started;
  }
}

function renderScenarioPicker() {
  if (!scenarioPicker) { syncSetupSelects(); return; }
  scenarioPicker.innerHTML = '';
  scenarios.forEach((scenario, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `scenario-chip ${state.scenarioIndex === index ? 'active' : ''}`;
    button.textContent = scenario.name;
    button.disabled = state.started;
    button.addEventListener('click', () => {
      if (state.started) return;
      state.scenarioIndex = index;
      nodes = deepCloneNodes();
      renderScenarioPicker();
      updateHud();
    });
    scenarioPicker.appendChild(button);
  });
  syncSetupSelects();
}
function renderDifficultyPicker() {
  if (!difficultyPicker) { syncSetupSelects(); return; }
  difficultyPicker.innerHTML = '';
  Object.values(difficulties).forEach((difficulty) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `scenario-chip ${state.difficulty === difficulty.key ? 'active' : ''}`;
    button.textContent = difficulty.name;
    button.disabled = state.started;
    button.addEventListener('click', () => {
      if (state.started) return;
      state.difficulty = difficulty.key;
      resetState();
    });
    difficultyPicker.appendChild(button);
  });
  syncSetupSelects();
}

function renderShop() {
  if (!towerShop) return;
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
    button.disabled = !!activeCommandNode?.occupied;
    button.addEventListener('click', () => {
      if (activeCommandNode && !activeCommandNode.occupied) {
        buildTowerAtNode(activeCommandNode, towerType.key);
        return;
      }
      state.selectedTowerType = towerType.key;
      state.selectedTowerId = null;
      renderShop();
      renderSelectedTower();
    });
    towerShop.appendChild(button);
  });
}

function renderSelectedTower() {
  if (!selectedTowerPanel) return;
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

function updateWavePreview() {
  const nextWaveNumber = state.currentWaveIndex + 2;
  const next = wavePlan[state.currentWaveIndex + 1] || (state.endlessMode ? createEndlessWave(nextWaveNumber) : null);
  wavePreview.textContent = next ? next.map((type) => enemyTypes[type].name).join(' · ') : 'FINAL';
}

function updateAbilityButtons() {
  empButton.disabled = !state.started || state.gameOver || state.credits < 160 || !state.enemies.length;
  repairButton.disabled = !state.started || state.gameOver || state.credits < 120 || state.hp >= state.maxHp;
  overclockButton.disabled = !state.started || state.gameOver || state.credits < 90 || !state.selectedTowerId;
}

function spawnWave() {
  if (!state.started || state.waveInProgress || (!state.endlessMode && state.currentWaveIndex + 1 >= wavePlan.length) || state.gameOver) return;
  soundEngine.play('wave');
  state.currentWaveIndex += 1;
  const queue = [...(wavePlan[state.currentWaveIndex] || createEndlessWave(state.currentWaveIndex + 1))];
  state.pendingSpawn = { queue, timer: 0.6, routeCursor: 0 };
  state.waveInProgress = true;
  nextWaveButton.disabled = true;
  updateHud();
  updateWavePreview();
  overlayMessage.classList.add('hidden');
}

function updateSpawns(dt) {
  if (!state.pendingSpawn) return;
  state.pendingSpawn.timer -= dt;
  if (state.pendingSpawn.timer <= 0 && state.pendingSpawn.queue.length) {
    const enemyType = state.pendingSpawn.queue.shift();
    const scenario = getActiveScenario();
    const routeIndex = state.pendingSpawn.routeCursor % scenario.routes.length;
    state.pendingSpawn.routeCursor += 1;
    state.enemies.push(new Enemy(enemyType, routeIndex));
    state.pendingSpawn.timer = enemyType === 'boss' ? 1.25 : 0.85;
  }
  if (!state.pendingSpawn.queue.length && !state.enemies.length) {
    state.pendingSpawn = null;
    state.waveInProgress = false;
    if (!state.endlessMode && state.currentWaveIndex + 1 >= wavePlan.length) {
      finishGame(true);
    } else {
      const scenarioBonus = getScenarioModifier().creditsPerWave || 0;
      state.credits += 80 + state.currentWaveIndex * 15 + scenarioBonus;
      state.score += 100;
      createFloatingText(820, 60, `BONUS +${80 + state.currentWaveIndex * 15 + scenarioBonus}c`, '#6df2ff');
      nextWaveButton.disabled = false;
      updateHud();
      updateWavePreview();
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
  updateDefenseStatus();
  announce(`${victory ? 'Victoria' : 'Derrota'}. Score final ${state.score}.`);

  soundEngine.play(victory ? 'start' : 'end');
  const title = victory ? 'SECTOR ASEGURADO' : 'CORE COLAPSADO';
  const subtitle = victory
    ? `Sobreviviste a las ${state.totalWaves} oleadas.`
    : `Llegaste hasta la oleada ${Math.max(state.currentWaveIndex + 1, 0)}.`;

  overlayMessage.classList.remove('hidden');
  overlayMessage.innerHTML = `${title}<br><small>${subtitle}<br>Score final: ${state.score}</small>`;

  if (!state.hasSavedScore) {
    saveScore(state, refreshLeaderboard);
    state.hasSavedScore = true;
  }
}

function drawBattlefield() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scenario = getActiveScenario();
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, scenario.palette.sky);
  gradient.addColorStop(1, scenario.palette.ground);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawScenarioProps(scenario);
  drawGrid(scenario);
  drawPaths(scenario);
  drawNodes();
  drawCore();

  state.towers.forEach((tower) => tower.draw());
  state.projectiles.forEach((projectile) => projectile.draw());
  state.enemies.forEach((enemy) => enemy.draw());
  drawFloatingTexts();
}

function drawGrid(scenario) {
  ctx.save();
  ctx.strokeStyle = `${scenario.palette.accent}14`;
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

function drawPaths(scenario) {
  scenario.routes.forEach((route, index) => {
    ctx.save();
    ctx.strokeStyle = index === 0 ? scenario.palette.lane : `${scenario.palette.hazard}33`;
    ctx.lineWidth = index === 0 ? 34 : 28;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(route[0].x, route[0].y);
    for (const point of route.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();

    ctx.setLineDash([16, 16]);
    ctx.lineDashOffset = state.reducedMotion ? 0 : -performance.now() / (80 + index * 18);
    ctx.strokeStyle = index === 0 ? scenario.palette.accent : scenario.palette.hazard;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(route[0].x, route[0].y);
    for (const point of route.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.restore();
  });
}

function drawScenarioProps(scenario) {
  scenario.props.forEach((prop) => {
    ctx.save();
    ctx.shadowColor = scenario.palette.accent;
    ctx.shadowBlur = 14;
    if (prop.type === 'dock') {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.strokeStyle = `${scenario.palette.accent}88`;
      ctx.lineWidth = 2;
      ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
      ctx.strokeRect(prop.x, prop.y, prop.w, prop.h);
      for (let i = 12; i < prop.w; i += 24) {
        ctx.beginPath();
        ctx.moveTo(prop.x + i, prop.y);
        ctx.lineTo(prop.x + i - 18, prop.y + prop.h);
        ctx.stroke();
      }
    } else if (prop.type === 'antenna') {
      ctx.strokeStyle = scenario.palette.accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(prop.x, prop.y);
      ctx.lineTo(prop.x, prop.y + prop.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(prop.x, prop.y, 18, 0, Math.PI * 2);
      ctx.stroke();
    } else if (prop.type === 'reactor') {
      ctx.fillStyle = `${scenario.palette.hazard}44`;
      ctx.strokeStyle = scenario.palette.hazard;
      ctx.beginPath();
      ctx.arc(prop.x, prop.y, prop.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (prop.type === 'crystal') {
      ctx.fillStyle = `${scenario.palette.accent}55`;
      ctx.beginPath();
      ctx.moveTo(prop.x, prop.y - prop.r);
      ctx.lineTo(prop.x + prop.r * 0.7, prop.y);
      ctx.lineTo(prop.x, prop.y + prop.r);
      ctx.lineTo(prop.x - prop.r * 0.7, prop.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  });
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
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
  } else if (state.combo > 1) {
    state.combo = Math.max(1, state.combo - dt * 0.35);
  }

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
  updateGame(dt * state.speedMultiplier);
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

function positionNodeCommand(node) {
  if (!nodeCommandPopover) return;
  const left = (node.x / canvas.width) * 100;
  const top = (node.y / canvas.height) * 100;
  nodeCommandPopover.style.left = `${left}%`;
  nodeCommandPopover.style.top = `${top}%`;
}

function closeNodeCommand() {
  activeCommandNode = null;
  nodeCommandPopover?.classList.add('hidden');
}

function openNodeCommand(node) {
  activeCommandNode = node;
  const tower = node.occupied ? state.towers.find((entry) => entry.id === node.occupied) : null;
  if (tower) {
    state.selectedTowerId = tower.id;
    state.selectedTowerType = null;
    nodeCommandKicker.textContent = 'Ver';
    nodeCommandTitle.textContent = 'Torre seleccionada';
    nodeCommandHelp.textContent = 'Mejorá la torre u overclockeala desde acciones cuando corresponda.';
    towerShop.classList.add('hidden');
    selectedTowerPanel.classList.remove('hidden');
  } else {
    state.selectedTowerId = null;
    nodeCommandKicker.textContent = 'Gestionar';
    nodeCommandTitle.textContent = 'Construir torre';
    nodeCommandHelp.textContent = 'Elegí una torre para construirla en este nodo.';
    towerShop.classList.remove('hidden');
    selectedTowerPanel.classList.add('hidden');
  }
  renderShop();
  renderSelectedTower();
  updateAbilityButtons();
  positionNodeCommand(node);
  nodeCommandPopover?.classList.remove('hidden');
}

function buildTowerAtNode(node, towerTypeKey) {
  if (!node || node.occupied) return;
  const towerType = towerTypes[towerTypeKey];
  if (state.credits < towerType.cost) {
    soundEngine.play('fail');
    createFloatingText(node.x - 15, node.y - 34, 'SIN CRÉDITOS', '#ff7ca7');
    return;
  }

  state.credits -= towerType.cost;
  const tower = new Tower(towerTypeKey, node);
  node.occupied = tower.id;
  soundEngine.play('build');
  state.towers.push(tower);
  state.towersBuilt += 1;
  announce(`${tower.type.name} construida. Créditos restantes: ${state.credits}.`);
  state.selectedTowerId = tower.id;
  state.selectedTowerType = null;
  updateHud();
  openNodeCommand(node);
}

function handleCanvasClick(event) {
  if (!state.started || state.gameOver) return;
  const { x, y } = getCanvasCoordinates(event);
  const node = nodes.find((entry) => Math.hypot(entry.x - x, entry.y - y) <= 30);
  if (node) {
    openNodeCommand(node);
    return;
  }
  closeNodeCommand();
}

startButton.addEventListener('click', startGame);
nextWaveButton.addEventListener('click', spawnWave);
speedButton.addEventListener('click', () => {
  soundEngine.play('ui');
  state.speedMultiplier = state.speedMultiplier === 1 ? 2 : 1;
  speedButton.textContent = state.speedMultiplier === 1 ? 'Velocidad x2' : 'Velocidad x1';
  updateHud();
});
empButton.addEventListener('click', () => {
  if (empButton.disabled) return;
  soundEngine.play('ability');
  state.credits -= 160;
  state.abilitiesUsed += 1;
  announce('EMP global activado.');
  state.enemies.forEach((enemy) => { enemy.hp -= 45; enemy.speed = enemy.baseSpeed * 0.45; enemy.slowTimer = 2.5; });
  [...state.enemies].filter((enemy) => enemy.hp <= 0).forEach(destroyEnemy);
  createFloatingText(430, 80, 'EMP', '#6df2ff');
  updateHud();
});
repairButton.addEventListener('click', () => {
  if (repairButton.disabled) return;
  soundEngine.play('ability');
  state.credits -= 120;
  state.abilitiesUsed += 1;
  announce('Reparación del core activada.');
  state.hp = Math.min(state.maxHp, state.hp + 5);
  createFloatingText(865, 420, '+5 CORE', '#6cff95');
  updateHud();
});
overclockButton.addEventListener('click', () => {
  if (overclockButton.disabled) return;
  const tower = state.towers.find((entry) => entry.id === state.selectedTowerId);
  if (!tower) return;
  soundEngine.play('ability');
  state.credits -= 90;
  state.abilitiesUsed += 1;
  announce('Overclock de torre activado.');
  tower.overclockTimer = 8;
  createFloatingText(tower.x - 22, tower.y - 45, 'OVERCLOCK', '#ffc869');
  updateHud();
});
pauseButton.addEventListener('click', () => {
  if (!state.started || state.gameOver) return;
  soundEngine.play('ui');
  state.paused = !state.paused;
  const dict = window.I18N_2042?.translations[document.documentElement.lang] || window.I18N_2042?.translations.es;
  pauseButton.textContent = state.paused ? dict.resume : dict.pause;
  updateDefenseStatus();
  if (state.paused) {
    overlayMessage.classList.remove('hidden');
    overlayMessage.innerHTML = 'SIMULACIÓN EN PAUSA';
  } else {
    overlayMessage.classList.add('hidden');
  }
});
restartButton.addEventListener('click', () => {
  soundEngine.play('ui');
  startButton.disabled = false;
  resetState();
});
scenarioSelect?.addEventListener('change', () => {
  if (state.started) return;
  const scenarioIndex = Number(scenarioSelect.value);
  if (!Number.isInteger(scenarioIndex) || !scenarios[scenarioIndex]) return;
  state.scenarioIndex = scenarioIndex;
  nodes = deepCloneNodes();
  renderScenarioPicker();
  updateHud();
});
difficultySelect?.addEventListener('change', () => {
  if (state.started) return;
  if (!difficulties[difficultySelect.value]) return;
  state.difficulty = difficultySelect.value;
  resetState();
});
endlessModeInput?.addEventListener('change', () => {
  if (state.started) return;
  state.endlessMode = endlessModeInput.checked;
  updateHud();
  updateWavePreview();
});
muteAudioButton?.addEventListener('click', () => {
  soundEngine.setMuted(soundEngine.enabled);
  muteAudioButton.textContent = soundEngine.enabled ? 'Silenciar audio' : 'Activar audio';
});
volumeControl?.addEventListener('input', () => soundEngine.setVolume(volumeControl.value));
reducedMotionInput?.addEventListener('change', () => {
  state.reducedMotion = reducedMotionInput.checked;
  localStorage.setItem('2042-reduced-motion', String(state.reducedMotion));
  if (document.documentElement) document.documentElement.dataset.reducedMotion = String(state.reducedMotion);
});
document.addEventListener('keydown', (event) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
  if (event.key === ' ') { event.preventDefault(); pauseButton.click(); }
  if (event.key.toLowerCase() === 'n') nextWaveButton.click();
  if (event.key.toLowerCase() === 'm') muteAudioButton?.click();
  if (event.key.toLowerCase() === 'r') restartButton.click();
  const towerIndex = Number(event.key) - 1;
  const tower = Object.values(towerTypes)[towerIndex];
  if (tower) { state.selectedTowerType = tower.key; state.selectedTowerId = null; renderShop(); renderSelectedTower(); announce(`${tower.name} seleccionada.`); }
});
if (volumeControl) volumeControl.value = Math.round(soundEngine.volume * 100);
if (muteAudioButton) muteAudioButton.textContent = soundEngine.enabled ? 'Silenciar audio' : 'Activar audio';
if (reducedMotionInput) reducedMotionInput.checked = state.reducedMotion;
if (document.documentElement) document.documentElement.dataset.reducedMotion = String(state.reducedMotion);
nodeCommandClose?.addEventListener('click', closeNodeCommand);
canvas.addEventListener('click', handleCanvasClick);
window.addEventListener('languagechange', () => { renderShop(); renderSelectedTower(); updateWavePreview(); });

resetState();
updateWavePreview();
refreshLeaderboard();
requestAnimationFrame(animate);
