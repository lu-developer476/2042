import { soundEngine } from './audio.js';
import { scenarios, getScenarioLayout, getStageForWave, STAGE_SIZE, TOTAL_STAGES } from './scenarios.js';
import { towerTypes } from './towers.js';
import { enemyTypes, wavePlan } from './waves.js';
import { state } from './state.js';
import { saveScore, refreshLeaderboard } from './api.js';
import { difficulties, scenarioModifiers, createEndlessWave, createProceduralWave, getStageScaling, gameModes, campaignStageCounts, campaignStory, itemTypes } from './modes.js';

const canvas = document.getElementById('battlefield');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('start-game');
const nextWaveButton = document.getElementById('next-wave');
const pauseButton = document.getElementById('pause-game');
const restartButton = document.getElementById('restart-game');
const saveStageButton = document.getElementById('save-stage');
const endRunButton = document.getElementById('end-run');
const resumeProgressButton = document.getElementById('resume-progress');
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
const interceptorButton = document.getElementById('interceptor-ability');
const wavePreview = document.getElementById('wave-preview');
const comboValue = document.getElementById('combo-value');
const speedValue = document.getElementById('speed-value');
const scenarioValue = document.getElementById('scenario-value');
const scenarioPicker = document.getElementById('scenario-picker');
const difficultyPicker = document.getElementById('difficulty-picker');
const scenarioSelect = document.getElementById('scenario-select');
const difficultySelect = document.getElementById('difficulty-select');
const endlessModeInput = document.getElementById('endless-mode');
const gameModeSelect = document.getElementById('game-mode');
const playDialog = document.getElementById('play-dialog');
const defenseStatusValue = document.getElementById('defense-status-value');
const defenseStatusPanelValue = document.getElementById('defense-status-panel-value');
const accessibleStatus = document.getElementById('accessible-status');
const muteAudioButton = document.getElementById('mute-audio');
const volumeControl = document.getElementById('volume-control');
const musicMixSelect = document.getElementById('music-mix');
const musicToggleButton = document.getElementById('music-toggle');
const musicVolumeControl = document.getElementById('music-volume');
const reducedMotionInput = document.getElementById('reduced-motion');
const PROGRESS_STORAGE_KEY = '2042-stage-progress';
const PATH_BODY_WIDTH = 24;
const ALT_PATH_BODY_WIDTH = 20;
const PATH_CENTER_WIDTH = 3;
const TOWER_NODE_RADIUS = 22;
const CORE_OUTER_RADIUS = 36;
const CORE_INNER_RADIUS = 23;
const WORLD_HEIGHT = 540;


function getViewport(scenario = getActiveScenario()) {
  const scale = Math.min(canvas.width / (scenario.worldWidth || canvas.width), canvas.height / WORLD_HEIGHT);
  return {
    scale,
    x: (canvas.width - (scenario.worldWidth || canvas.width) * scale) / 2,
    y: (canvas.height - WORLD_HEIGHT * scale) / 2,
  };
}

function withWorldViewport(scenario, draw) {
  const viewport = getViewport(scenario);
  ctx.save();
  ctx.translate(viewport.x, viewport.y);
  ctx.scale(viewport.scale, viewport.scale);
  draw();
  ctx.restore();
}

function getCorePosition(scenario = getActiveScenario()) {
  const routeEnds = scenario.routes.map((route) => route[route.length - 1]);
  const x = Math.max(...routeEnds.map((point) => point.x)) - 60;
  const y = routeEnds.reduce((sum, point) => sum + point.y, 0) / routeEnds.length;
  return { x, y };
}

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

function getCampaignScenarioIndex() {
  if (state.gameMode !== 'campaign') return state.scenarioIndex || 0;
  let remaining = state.campaignStage;
  for (let offset = 0; offset < scenarios.length; offset += 1) {
    const index = (state.campaignStartScenario + offset) % scenarios.length;
    if (remaining < campaignStageCounts[index]) return index;
    remaining -= campaignStageCounts[index];
  }
  return state.campaignStartScenario;
}

function getBaseScenario() {
  return scenarios[getCampaignScenarioIndex()];
}

function getModeWaveLimit() {
  if (state.gameMode === 'tutorial') return 3;
  if (state.gameMode === 'campaign') return campaignStageCounts.reduce((sum, count) => sum + count, 0);
  return wavePlan.length;
}

function getModeStageLabel() {
  if (state.gameMode === 'campaign') return `Etapa ${state.campaignStage + 1}/${state.totalStages}`;
  if (state.gameMode === 'tutorial') return `Lección ${Math.min(state.currentWaveIndex + 1, 3)}/3`;
  return `Etapa ${getActiveStage()}/${TOTAL_STAGES}`;
}

function getActiveStage() {
  return getStageForWave(Math.max(state.currentWaveIndex + 1, 0));
}

function getActiveScenario() {
  return getScenarioLayout(getBaseScenario(), Math.max(state.currentWaveIndex + 1, 0), state.difficulty);
}

function getDifficulty() {
  return difficulties[state.difficulty] || difficulties.normal;
}

function getScenarioModifier() {
  return scenarioModifiers[getBaseScenario().key] || {};
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
    const waveNumber = state.currentWaveIndex + 1;
    const stageScaling = getStageScaling(waveNumber, state.difficulty);
    this.maxHp = Math.round(type.hp * difficulty.enemyHp * stageScaling.hp);
    this.hp = this.maxHp;
    this.maxShield = Math.round((type.shield || 0) * difficulty.enemyHp * stageScaling.hp);
    this.shield = this.maxShield;
    this.baseSpeed = type.speed * difficulty.enemySpeed * stageScaling.speed * (modifier.enemySpeed || 1);
    this.speed = this.baseSpeed;
    this.reward = Math.round(type.reward * difficulty.reward * stageScaling.reward);
    this.damage = Math.max(1, Math.round(type.damage * stageScaling.damage));
    this.color = type.color;
    this.scoreValue = Math.round(type.score * stageScaling.score);
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
    this.immobilizeTimer = 0;
    this.towerAttackDamage = type.towerAttackDamage || 0;
    this.towerAttackRange = type.towerAttackRange || 0;
    this.towerAttackCooldown = type.towerAttackCooldown || 1;
    this.towerAttackTimer = 0;
    this.itemSpeedTimer = 0;
  }

  update(dt) {
    if (this.immobilizeTimer > 0) {
      this.immobilizeTimer -= dt;
      this.speed = 0;
      if (this.immobilizeTimer <= 0) this.speed = this.baseSpeed;
      return true;
    }

    this.updateTowerAttack(dt);
    if (this.itemSpeedTimer > 0) { this.itemSpeedTimer -= dt; if (this.itemSpeedTimer <= 0) this.speed = this.baseSpeed; }
    collectItemForEnemy(this);
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.speed = this.baseSpeed;
    }
    const next = this.path[this.pathIndex + 1];
    if (!next) {
      const absorbed = Math.min(state.coreShield || 0, this.damage);
      state.coreShield = Math.max(0, (state.coreShield || 0) - absorbed);
      state.hp -= this.damage - absorbed;
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


  updateTowerAttack(dt) {
    if (!this.towerAttackDamage || !state.towers.length) return;
    if (this.towerAttackTimer > 0) this.towerAttackTimer -= dt;
    let target = null;
    let nearest = Infinity;
    for (const tower of state.towers) {
      const distance = Math.hypot(tower.x - this.x, tower.y - this.y);
      if (distance <= this.towerAttackRange && distance < nearest) {
        nearest = distance;
        target = tower;
      }
    }
    if (!target) return;
    this.rotation = Math.atan2(target.y - this.y, target.x - this.x);
    if (this.towerAttackTimer <= 0) {
      state.enemyProjectiles.push(new EnemyProjectile(this.x, this.y, target, this.towerAttackDamage, this.color));
      this.towerAttackTimer = this.towerAttackCooldown;
    }
  }

  draw() {
    drawEnemyShape(this);

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(this.x - 18, this.y - 24, 36, 5);
    ctx.fillStyle = '#6cff95';
    ctx.fillRect(this.x - 18, this.y - 24, 36 * (this.hp / this.maxHp), 5);
    if (this.maxShield > 0) {
      ctx.fillStyle = 'rgba(126,247,200,0.22)';
      ctx.fillRect(this.x - 18, this.y - 31, 36, 4);
      ctx.fillStyle = '#7ef7c8';
      ctx.fillRect(this.x - 18, this.y - 31, 36 * (this.shield / this.maxShield), 4);
    }
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
    this.maxHp = 90;
    this.hp = this.maxHp;
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

    if (this.burstShots) {
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
    soundEngine.play('upgrade');
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
    if (this.hp < this.maxHp) {
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(this.x - 20, this.y + 29, 40, 4);
      ctx.fillStyle = '#6cff95';
      ctx.fillRect(this.x - 20, this.y + 29, 40 * (this.hp / this.maxHp), 4);
    }
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
  } else if (enemy.typeKey === 'aegis') {
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#7ef7c8';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 1.7, -0.75, 0.75);
    ctx.stroke();
  } else if (enemy.typeKey === 'saboteur') {
    ctx.beginPath();
    ctx.moveTo(enemy.radius + 4, 0);
    ctx.lineTo(-enemy.radius * 0.8, -enemy.radius);
    ctx.lineTo(-enemy.radius * 0.35, 0);
    ctx.lineTo(-enemy.radius * 0.8, enemy.radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-enemy.radius * 0.2, -enemy.radius * 1.45, enemy.radius * 1.35, 4);
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
  constructor(fromX, fromY, target, damage, isShock, critChance = 0, attackType = 'pulse', blastRadius = 0) {
    this.x = fromX;
    this.y = fromY;
    this.target = target;
    this.damage = damage;
    this.speed = 480;
    this.radius = isShock ? 4 : 3;
    this.color = isShock ? '#ffd166' : '#ffffff';
    this.isShock = isShock;
    this.critChance = critChance;
    this.attackType = attackType;
    this.blastRadius = blastRadius;
    if (attackType === 'missile') {
      this.speed = 340;
      this.radius = 6;
      this.color = '#ff8f3d';
    }
  }

  update(dt) {
    if (!this.target || !state.enemies.includes(this.target)) return false;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < this.target.radius + 2) {
      let appliedDamage = this.damage;
      const attackType = this.isShock ? 'slow' : this.attackType;
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
      appliedDamage = Math.round(appliedDamage);
      if (this.target.shield > 0) {
        const shieldDamage = Math.min(this.target.shield, appliedDamage);
        this.target.shield -= shieldDamage;
        appliedDamage -= shieldDamage;
      }
      this.target.hp -= appliedDamage;
      createFloatingText(this.target.x, this.target.y - 12, `-${appliedDamage}`, this.isShock ? '#ffd166' : '#ffffff');
      if (this.isShock) {
        const slowResistance = this.target.resistances?.slow || 1;
        this.target.speed = this.target.baseSpeed * (1 - ((this.slow || 0.2) * slowResistance));
        this.target.slowTimer = 0.7 * slowResistance;
      }
      if (this.blastRadius > 0) applyBlastDamage(this.target, this.damage * 0.45, this.blastRadius, attackType);
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

class EnemyProjectile {
  constructor(fromX, fromY, target, damage, color) {
    this.x = fromX;
    this.y = fromY;
    this.target = target;
    this.damage = damage;
    this.color = color;
    this.speed = 290;
  }

  update(dt) {
    if (!this.target || !state.towers.includes(this.target)) return false;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 12) {
      this.target.hp -= this.damage;
      createFloatingText(this.target.x - 16, this.target.y - 34, `-${this.damage} TORRE`, '#ff7ca7');
      soundEngine.play('hit');
      if (this.target.hp <= 0) destroyTower(this.target, 'DESTRUIDA');
      return false;
    }
    const step = this.speed * dt;
    this.x += (dx / distance) * Math.min(step, distance);
    this.y += (dy / distance) * Math.min(step, distance);
    return true;
  }

  draw() {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class CoreInterceptor {
  constructor(routeIndex) {
    const route = getActiveScenario().routes[routeIndex];
    this.path = route;
    this.routeIndex = routeIndex;
    this.pathIndex = route.length - 1;
    this.x = route[this.pathIndex].x;
    this.y = route[this.pathIndex].y;
    this.speed = 124;
    this.damage = 20;
    this.range = 86;
    this.cooldown = 0;
    this.rotation = Math.PI;
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
    const target = state.enemies.reduce((closest, enemy) => {
      const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      return distance <= this.range && (!closest || distance < closest.distance) ? { enemy, distance } : closest;
    }, null);
    if (target && this.cooldown <= 0) {
      this.rotation = Math.atan2(target.enemy.y - this.y, target.enemy.x - this.x);
      fireInterceptorProjectile(this, target.enemy);
      this.cooldown = 0.65;
    }
    const next = this.path[this.pathIndex - 1];
    if (!next) return false;
    const dx = next.x - this.x;
    const dy = next.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) this.pathIndex -= 1;
    else {
      const step = this.speed * dt;
      this.rotation = Math.atan2(dy, dx);
      this.x += (dx / distance) * Math.min(step, distance);
      this.y += (dy / distance) * Math.min(step, distance);
    }
    return true;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#6df2ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(11, 0); ctx.lineTo(-8, -6); ctx.lineTo(-4, 0); ctx.lineTo(-8, 6); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function fireProjectile(tower, target, damage, isShock = false) {
  const critChance = tower.typeKey === 'burst' && tower.level === 5 ? tower.critChance || 0 : 0;
  const attackType = tower.typeKey === 'missile' ? 'missile' : (tower.burstShots ? 'burst' : 'pulse');
  soundEngine.play(isShock ? 'zap' : 'shoot');
  const projectile = new Projectile(tower.x, tower.y, target, damage, isShock, critChance, attackType, tower.blastRadius || 0);
  projectile.slow = tower.slow || 0;
  state.projectiles.push(projectile);
}

function fireInterceptorProjectile(interceptor, target) {
  soundEngine.play('shoot');
  const projectile = new Projectile(interceptor.x, interceptor.y, target, interceptor.damage, false, 0, 'pulse');
  projectile.color = '#6df2ff';
  state.projectiles.push(projectile);
}


function applyBlastDamage(primaryTarget, damage, radius, attackType) {
  for (const enemy of [...state.enemies]) {
    if (enemy === primaryTarget) continue;
    if (Math.hypot(enemy.x - primaryTarget.x, enemy.y - primaryTarget.y) > radius) continue;
    let appliedDamage = Math.round(damage * (enemy.vulnerabilities?.[attackType] || 1) * (enemy.resistances?.[attackType] || 1));
    if (enemy.shield > 0) {
      const shieldDamage = Math.min(enemy.shield, appliedDamage);
      enemy.shield -= shieldDamage;
      appliedDamage -= shieldDamage;
    }
    enemy.hp -= appliedDamage;
    createFloatingText(enemy.x, enemy.y - 14, `-${appliedDamage}`, '#ff8f3d');
    if (enemy.hp <= 0) destroyEnemy(enemy);
  }
}

function destroyTower(tower, label = 'TORRE CAÍDA') {
  state.towers = state.towers.filter((entry) => entry.id !== tower.id);
  const node = nodes.find((entry) => entry.occupied === tower.id);
  if (node) node.occupied = null;
  if (state.selectedTowerId === tower.id) state.selectedTowerId = null;
  createFloatingText(tower.x - 28, tower.y - 48, label, '#ff7ca7');
  renderSelectedTower();
  renderShop();
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
  state.enemyProjectiles = [];
  state.interceptors = [];
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
  state.campaignStage = 0;
  state.totalStages = state.gameMode === 'campaign' ? campaignStageCounts.reduce((sum, count) => sum + count, 0) : (state.gameMode === 'tutorial' ? 3 : TOTAL_STAGES);
  state.items = [];
  state.coreShield = 0;
  state.playerOverchargeTimer = 0;
  nodes = deepCloneNodes();
  closeNodeCommand();
  overlayMessage.classList.remove('hidden');
  overlayMessage.innerHTML = '2042 // Simulación lista<br><small>Elegí un nombre y arrancá.</small>';
  nextWaveButton.disabled = true;
  pauseButton.disabled = true;
  saveStageButton.disabled = true;
  endRunButton.disabled = true;
  pauseButton.textContent = 'Pausar';
  renderShop();
  renderSelectedTower();
  renderScenarioPicker();
  renderDifficultyPicker();
  updateHud();
  updateProgressButtons();
}

function startGame() {
  soundEngine.play('start');
  soundEngine.startAmbience();
  soundEngine.startMusic();
  state.started = true;
  state.playerName = playerNameInput.value.trim() || 'Piloto Anónimo';
  state.startedAt = Date.now();
  state.campaignStartScenario = state.scenarioIndex || 0;
  state.totalStages = state.gameMode === 'campaign' ? campaignStageCounts.reduce((sum, count) => sum + count, 0) : (state.gameMode === 'tutorial' ? 3 : TOTAL_STAGES);
  state.gameSeed = `${getBaseScenario().key}-${state.difficulty}-${state.startedAt.toString(36)}`;
  state.scenarioName = getBaseScenario().name;
  overlayMessage.classList.add('hidden');
  nextWaveButton.disabled = false;
  pauseButton.disabled = false;
  saveStageButton.disabled = true;
  endRunButton.disabled = false;
  startButton.disabled = true;
  if (playDialog?.open) playDialog.close();
  renderScenarioPicker();
  renderDifficultyPicker();
  announce(`${gameModes[state.gameMode].name} iniciada en ${state.scenarioName}, dificultad ${state.difficulty}. ${state.gameMode === 'campaign' ? campaignStory[getCampaignScenarioIndex()] : ''}`);
  if (state.gameMode === 'campaign') showCampaignBriefing();
  if (state.gameMode === 'tutorial') {
    overlayMessage.classList.remove('hidden');
    overlayMessage.innerHTML = 'TUTORIAL // DEFENDÉ EL CORE<br><small>1. Hacé clic en un nodo y construí torres. 2. Iniciá la oleada. 3. Recogé los ítems antes que los enemigos.</small>';
  }
  updateHud();
  updateProgressButtons();
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
  const waveText = state.endlessMode && state.gameMode === 'free' && state.currentWaveIndex + 1 > state.totalWaves
    ? `${Math.max(state.currentWaveIndex + (state.waveInProgress ? 1 : 0), 0)} / ∞`
    : `${Math.max(state.currentWaveIndex + (state.waveInProgress ? 1 : 0), 0)} / ${getModeWaveLimit()}`;
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
  scenarioValue.textContent = `${getBaseScenario().name} · ${getModeStageLabel()}`;
  updateDefenseStatus();
  updateAbilityButtons();
}


function syncSetupSelects() {
  if (scenarioSelect) {
    scenarioSelect.value = String(state.scenarioIndex || 0);
    scenarioSelect.disabled = state.started;
  }
  if (gameModeSelect) { gameModeSelect.value = state.gameMode; gameModeSelect.disabled = state.started; }
  if (endlessModeInput) { endlessModeInput.checked = state.endlessMode; endlessModeInput.disabled = state.started || state.gameMode !== 'free'; }
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

function renderTowerList(container, { mode = 'build' } = {}) {
  if (!container) return;
  container.innerHTML = '';
  Object.values(towerTypes).forEach((towerType) => {
    const button = document.createElement('button');
    button.className = `tower-card ${state.selectedTowerType === towerType.key ? 'active' : ''}`;
    button.innerHTML = `
      <h3>${towerType.name} · ${towerType.cost}c</h3>
      <p>${towerType.description}</p>
      <ul>
        <li>Mejoras: 5 niveles</li>
        <li>Costo: ${towerType.cost}c</li>
      </ul>
    `;

    if (mode === 'replace') {
      const selectedTower = state.towers.find((entry) => entry.id === state.selectedTowerId);
      button.disabled = !activeCommandNode?.occupied || selectedTower?.typeKey === towerType.key || state.credits < towerType.cost;
      button.setAttribute('aria-label', `Reemplazar por ${towerType.name} por ${towerType.cost} créditos`);
      button.addEventListener('click', () => replaceTowerAtNode(activeCommandNode, towerType.key));
    } else {
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
    }
    container.appendChild(button);
  });
}

function renderShop() {
  renderTowerList(towerShop, { mode: 'build' });
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
      ${tower.burstShots ? `<div>Ráfaga: <strong>${tower.burstShots} tiros</strong></div>` : ''}
      ${tower.blastRadius ? `<div>Explosión: <strong>${tower.blastRadius}px</strong></div>` : ''}
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

  if (activeCommandNode?.occupied === tower.id) {
    const replaceTitle = document.createElement('p');
    replaceTitle.className = 'microcopy replace-tower-copy';
    replaceTitle.innerHTML = '<strong>Reemplazar torre:</strong> elegí otra del listado. Se cobra el costo completo de la nueva torre y la anterior se pierde.';
    selectedTowerPanel.appendChild(replaceTitle);

    const replaceList = document.createElement('div');
    replaceList.className = 'tower-shop replace-tower-list';
    selectedTowerPanel.appendChild(replaceList);
    renderTowerList(replaceList, { mode: 'replace' });
  }
}

function updateWavePreview() {
  const nextWaveNumber = state.currentWaveIndex + 2;
  const next = (state.currentWaveIndex + 1 < getModeWaveLimit() ? createProceduralWave(nextWaveNumber, state.difficulty) : null) || (state.gameMode === 'free' && state.endlessMode ? createEndlessWave(nextWaveNumber, state.difficulty) : null);
  wavePreview.textContent = next ? next.map((type) => enemyTypes[type].name).join(' · ') : 'FINAL';
}

function updateAbilityButtons() {
  empButton.disabled = !state.started || state.gameOver || state.credits < 160 || !state.enemies.length;
  repairButton.disabled = !state.started || state.gameOver || state.credits < 120 || state.hp >= state.maxHp;
  overclockButton.disabled = !state.started || state.gameOver || state.credits < 90 || !state.selectedTowerId;
  interceptorButton.disabled = !state.started || state.gameOver || state.credits < 110 || !state.enemies.length;
}


function serializeProgress() {
  return {
    version: 1,
    playerName: state.playerName,
    scenarioIndex: state.scenarioIndex,
    difficulty: state.difficulty,
    endlessMode: state.endlessMode,
    currentWaveIndex: state.currentWaveIndex,
    hp: state.hp,
    maxHp: state.maxHp,
    credits: state.credits,
    kills: state.kills,
    score: state.score,
    towersBuilt: state.towersBuilt,
    towersUpgraded: state.towersUpgraded,
    abilitiesUsed: state.abilitiesUsed,
    startedAt: state.startedAt,
    gameSeed: state.gameSeed,
  };
}

function hasSavedProgress() {
  return Boolean(localStorage.getItem(PROGRESS_STORAGE_KEY));
}

function updateProgressButtons() {
  const atCheckpoint = state.started && !state.gameOver && !state.waveInProgress && !state.pendingSpawn && state.currentWaveIndex >= 0 && (state.currentWaveIndex + 1) % STAGE_SIZE === 0;
  if (saveStageButton) saveStageButton.disabled = !atCheckpoint;
  if (endRunButton) endRunButton.disabled = !state.started || state.gameOver;
  if (resumeProgressButton) resumeProgressButton.disabled = state.started || !hasSavedProgress();
}

function saveStageProgress() {
  if (saveStageButton?.disabled) return false;
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(serializeProgress()));
  announce(`Progreso guardado en etapa ${getActiveStage()}.`);
  overlayMessage.classList.remove('hidden');
  overlayMessage.innerHTML = `PROGRESO GUARDADO<br><small>Podés continuar ahora o retomar desde esta etapa luego.</small>`;
  updateProgressButtons();
  return true;
}

function prepareNextStage() {
  state.towers = [];
  state.enemies = [];
  state.projectiles = [];
  state.floatingTexts = [];
  state.selectedTowerId = null;
  state.selectedTowerType = null;
  nodes = deepCloneNodes();
  closeNodeCommand();
  renderShop();
  renderSelectedTower();
}

function completeStage() {
  const completedStage = getStageForWave(state.currentWaveIndex);
  if (completedStage >= TOTAL_STAGES) {
    finishGame(true);
    return;
  }
  prepareNextStage();
  nextWaveButton.disabled = false;
  overlayMessage.classList.remove('hidden');
  overlayMessage.innerHTML = `ETAPA ${completedStage} COMPLETADA<br><small>Continuá a la etapa ${completedStage + 1}, guardá el progreso o finalizá la partida.</small>`;
  announce(`Etapa ${completedStage} completada. Nuevas rutas y emplazamientos disponibles.`);
  updateHud();
  updateWavePreview();
  updateProgressButtons();
}

function resumeSavedProgress() {
  const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
  if (!raw || state.started) return;
  let saved;
  try { saved = JSON.parse(raw); } catch { return; }
  resetState();
  Object.assign(state, {
    scenarioIndex: saved.scenarioIndex ?? 0,
    difficulty: saved.difficulty || 'normal',
    endlessMode: Boolean(saved.endlessMode),
    currentWaveIndex: saved.currentWaveIndex ?? -1,
    hp: saved.hp,
    maxHp: saved.maxHp,
    credits: saved.credits,
    kills: saved.kills || 0,
    score: saved.score || 0,
    towersBuilt: saved.towersBuilt || 0,
    towersUpgraded: saved.towersUpgraded || 0,
    abilitiesUsed: saved.abilitiesUsed || 0,
    playerName: saved.playerName || 'Piloto Anónimo',
    startedAt: saved.startedAt || Date.now(),
    gameSeed: saved.gameSeed || '',
    started: true,
    gameOver: false,
  });
  playerNameInput.value = state.playerName;
  nodes = deepCloneNodes();
  overlayMessage.classList.remove('hidden');
  overlayMessage.innerHTML = `PROGRESO RESTAURADO<br><small>Etapa ${getStageForWave(state.currentWaveIndex + 1)}/${TOTAL_STAGES}. Iniciá la siguiente oleada.</small>`;
  nextWaveButton.disabled = false;
  pauseButton.disabled = false;
  startButton.disabled = true;
  soundEngine.startAmbience();
  soundEngine.startMusic();
  renderScenarioPicker();
  renderDifficultyPicker();
  updateHud();
  updateWavePreview();
  updateProgressButtons();
}

function spawnWave() {
  if (!state.started || state.waveInProgress || (!(state.gameMode === 'free' && state.endlessMode) && state.currentWaveIndex + 1 >= getModeWaveLimit()) || state.gameOver) return;
  soundEngine.play('wave');
  state.currentWaveIndex += 1;
  const queue = [...(state.currentWaveIndex < getModeWaveLimit()
    ? createProceduralWave(state.currentWaveIndex + 1, state.difficulty)
    : createEndlessWave(state.currentWaveIndex + 1, state.difficulty))];
  spawnBattleItem();
  state.pendingSpawn = { queue, timer: 0.6, routeCursor: 0 };
  state.waveInProgress = true;
  nextWaveButton.disabled = true;
  updateProgressButtons();
  updateHud();
  updateWavePreview();
  overlayMessage.classList.add('hidden');
}

function updateSpawns(dt) {
  if (!state.pendingSpawn) return;
  state.pendingSpawn.timer -= dt;
  if (state.pendingSpawn.timer <= 0 && state.pendingSpawn.queue.length) {
    const enemyType = state.pendingSpawn.queue.shift();
    soundEngine.play('spawn');
    const scenario = getActiveScenario();
    const routeIndex = state.pendingSpawn.routeCursor % scenario.routes.length;
    state.pendingSpawn.routeCursor += 1;
    state.enemies.push(new Enemy(enemyType, routeIndex));
    state.pendingSpawn.timer = enemyType === 'boss' ? 1.25 : 0.85;
  }
  if (!state.pendingSpawn.queue.length && !state.enemies.length) {
    state.pendingSpawn = null;
    state.waveInProgress = false;
    if (!(state.gameMode === 'free' && state.endlessMode) && state.currentWaveIndex + 1 >= getModeWaveLimit()) {
      finishGame(true);
    } else {
      const scenarioBonus = getScenarioModifier().creditsPerWave || 0;
      state.credits += 80 + state.currentWaveIndex * 15 + scenarioBonus;
      state.score += 100;
      if (state.gameMode === 'campaign') {
        state.campaignStage += 1;
        completeCampaignStage();
        return;
      }
      if (state.gameMode === 'tutorial') {
        overlayMessage.classList.remove('hidden'); overlayMessage.innerHTML = `LECCIÓN ${state.currentWaveIndex + 1} COMPLETADA<br><small>${['Construí torres en nodos vacíos.', 'Recogé ítems con un clic antes que el enemigo.', 'Combiná torres y habilidades para defender el Core.'][state.currentWaveIndex] || ''}</small>`;
      }
      if (state.gameMode === 'free' && (state.currentWaveIndex + 1) % STAGE_SIZE === 0) {
        completeStage();
        return;
      }
      createFloatingText(820, 60, `BONUS +${80 + state.currentWaveIndex * 15 + scenarioBonus}c`, '#6df2ff');
      nextWaveButton.disabled = false;
      updateHud();
      updateProgressButtons();
      updateWavePreview();
    }
  }
}

function spawnBattleItem() {
  const scenario = getActiveScenario();
  const route = scenario.routes[Math.floor(Math.random() * scenario.routes.length)];
  const point = route[Math.min(route.length - 2, 2 + Math.floor(Math.random() * Math.max(1, route.length - 3)))];
  const keys = Object.keys(itemTypes);
  state.items.push({ key: keys[Math.floor(Math.random() * keys.length)], x: point.x + 24, y: point.y - 26, radius: 16 });
  if (state.items.length > 3) state.items.shift();
}

function applyItem(item, recipient) {
  const type = itemTypes[item.key];
  if (recipient === 'player') {
    if (item.key === 'credits') state.credits += 65;
    if (item.key === 'repair') state.hp = Math.min(state.maxHp, state.hp + 3);
    if (item.key === 'overcharge') state.playerOverchargeTimer = 7;
    if (item.key === 'shield') state.coreShield = (state.coreShield || 0) + 4;
    createFloatingText(item.x - 20, item.y - 22, type.icon, type.color);
    announce(`${type.name}: ${type.player}`);
  } else {
    if (item.key === 'credits') recipient.reward += 25;
    if (item.key === 'repair') recipient.hp = Math.min(recipient.maxHp, recipient.hp + 35);
    if (item.key === 'overcharge') { recipient.speed = recipient.baseSpeed * 1.35; recipient.itemSpeedTimer = 5; }
    if (item.key === 'shield') recipient.shield += 40;
    createFloatingText(item.x - 20, item.y - 22, 'ENEMIGO', '#ff7ca7');
  }
  soundEngine.play('ability');
  updateHud();
}

function collectItemForEnemy(enemy) {
  const item = state.items.find((entry) => Math.hypot(entry.x - enemy.x, entry.y - enemy.y) <= enemy.radius + entry.radius);
  if (!item) return;
  state.items = state.items.filter((entry) => entry !== item);
  applyItem(item, enemy);
}

function collectItemAt(x, y) {
  if (!state.started || state.gameOver) return false;
  const item = state.items.find((entry) => Math.hypot(entry.x - x, entry.y - y) <= entry.radius + 10);
  if (!item) return false;
  state.items = state.items.filter((entry) => entry !== item);
  applyItem(item, 'player');
  return true;
}

function drawItems() {
  state.items.forEach((item) => {
    const type = itemTypes[item.key];
    ctx.save(); ctx.shadowColor = type.color; ctx.shadowBlur = 16;
    ctx.fillStyle = `${type.color}44`; ctx.strokeStyle = type.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = type.color; ctx.font = 'bold 17px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(type.icon, item.x, item.y + 1); ctx.restore();
  });
}

function showCampaignBriefing() {
  overlayMessage.classList.remove('hidden');
  overlayMessage.innerHTML = `CAMPAÑA // ${getBaseScenario().name}<br><small>${campaignStory[getCampaignScenarioIndex()]}</small>`;
}

function completeCampaignStage() {
  if (state.campaignStage >= state.totalStages) { finishGame(true); return; }
  const previous = getCampaignScenarioIndex();
  prepareNextStage();
  const next = getCampaignScenarioIndex();
  nextWaveButton.disabled = false;
  overlayMessage.classList.remove('hidden');
  overlayMessage.innerHTML = `ETAPA ${state.campaignStage}/${state.totalStages} COMPLETADA<br><small>${previous !== next ? campaignStory[next] : 'La resistencia continúa: reforzá tus defensas.'}</small>`;
  announce(`Campaña: ${getModeStageLabel()} en ${getBaseScenario().name}.`);
  updateHud(); updateWavePreview(); updateProgressButtons();
}

function finishGame(victory) {
  state.gameOver = true;
  soundEngine.stopAmbience();
  soundEngine.stopMusic();
  state.waveInProgress = false;
  state.pendingSpawn = null;
  nextWaveButton.disabled = true;
  pauseButton.disabled = true;
  saveStageButton.disabled = true;
  endRunButton.disabled = true;
  startButton.disabled = false;
  updateDefenseStatus();
  updateProgressButtons();
  announce(`${victory ? 'Victoria' : 'Derrota'}. Score final ${state.score}.`);

  soundEngine.play(victory ? 'start' : 'end');
  const title = victory ? 'SECTOR ASEGURADO' : 'CORE COLAPSADO';
  const subtitle = victory
    ? `Completaste ${gameModes[state.gameMode].name}: ${getModeWaveLimit()} oleadas y ${state.totalStages} etapas.`
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

  withWorldViewport(scenario, () => {
    drawScenarioProps(scenario);
    drawGrid(scenario);
    drawPaths(scenario);
    drawNodes();
    drawCore(scenario);
    drawItems();

    state.towers.forEach((tower) => tower.draw());
    state.projectiles.forEach((projectile) => projectile.draw());
    state.enemyProjectiles.forEach((projectile) => projectile.draw());
    state.interceptors.forEach((interceptor) => interceptor.draw());
    state.enemies.forEach((enemy) => enemy.draw());
    drawFloatingTexts();
  });
}

function drawGrid(scenario) {
  ctx.save();
  ctx.strokeStyle = `${scenario.palette.accent}14`;
  ctx.lineWidth = 1;
  const worldWidth = scenario.worldWidth || canvas.width;
  for (let x = 0; x <= worldWidth; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= WORLD_HEIGHT; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(worldWidth, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPaths(scenario) {
  scenario.routes.forEach((route, index) => {
    ctx.save();
    ctx.strokeStyle = index === 0 ? scenario.palette.lane : `${scenario.palette.hazard}33`;
    ctx.lineWidth = index === 0 ? PATH_BODY_WIDTH : ALT_PATH_BODY_WIDTH;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(route[0].x, route[0].y);
    for (const point of route.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();

    ctx.setLineDash([16, 16]);
    ctx.lineDashOffset = state.reducedMotion ? 0 : -performance.now() / (80 + index * 18);
    ctx.strokeStyle = index === 0 ? scenario.palette.accent : scenario.palette.hazard;
    ctx.lineWidth = PATH_CENTER_WIDTH;
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
    ctx.arc(node.x, node.y, TOWER_NODE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}

function drawCore(scenario) {
  const core = getCorePosition(scenario);
  ctx.save();
  ctx.translate(core.x, core.y);
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255, 94, 142, 0.18)';
  ctx.arc(0, 0, CORE_OUTER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = '#ffffff';
  ctx.arc(0, 0, CORE_INNER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#08121e';
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
  if (state.playerOverchargeTimer > 0) state.playerOverchargeTimer -= dt;
  state.towers.forEach((tower) => tower.update(dt * (state.playerOverchargeTimer > 0 ? 1.45 : 1)));
  state.projectiles = state.projectiles.filter((projectile) => projectile.update(dt));
  state.enemyProjectiles = state.enemyProjectiles.filter((projectile) => projectile.update(dt));
  state.interceptors = state.interceptors.filter((interceptor) => interceptor.update(dt));
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
  const viewport = getViewport();
  const canvasX = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const canvasY = ((event.clientY - rect.top) / rect.height) * canvas.height;
  return {
    x: (canvasX - viewport.x) / viewport.scale,
    y: (canvasY - viewport.y) / viewport.scale,
  };
}

function positionNodeCommand() {
  if (!nodeCommandPopover) return;
  nodeCommandPopover.removeAttribute('style');
}

function closeNodeCommand() {
  activeCommandNode = null;
  window.I18N_2042?.closeDialog?.(nodeCommandPopover);
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
  window.I18N_2042?.openDialog?.(nodeCommandPopover);
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

function replaceTowerAtNode(node, towerTypeKey) {
  if (!node?.occupied) return;
  const previousTower = state.towers.find((entry) => entry.id === node.occupied);
  const towerType = towerTypes[towerTypeKey];
  if (!previousTower || !towerType || previousTower.typeKey === towerTypeKey) return;
  if (state.credits < towerType.cost) {
    soundEngine.play('fail');
    createFloatingText(node.x - 15, node.y - 34, 'SIN CRÉDITOS', '#ff7ca7');
    return;
  }

  state.credits -= towerType.cost;
  state.towers = state.towers.filter((entry) => entry.id !== previousTower.id);
  const tower = new Tower(towerTypeKey, node);
  node.occupied = tower.id;
  state.towers.push(tower);
  state.selectedTowerId = tower.id;
  state.selectedTowerType = null;
  soundEngine.play('build');
  announce(`${previousTower.type.name} reemplazada por ${tower.type.name}. Créditos restantes: ${state.credits}.`);
  createFloatingText(node.x - 30, node.y - 45, 'REEMPLAZO', '#6df2ff');
  updateHud();
  openNodeCommand(node);
}

function handleCanvasClick(event) {
  if (!state.started || state.gameOver) return;
  const { x, y } = getCanvasCoordinates(event);
  if (collectItemAt(x, y)) return;
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
  state.enemies.forEach((enemy) => { enemy.hp -= 45; enemy.immobilizeTimer = 3; });
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
interceptorButton.addEventListener('click', () => {
  if (interceptorButton.disabled) return;
  soundEngine.play('ability');
  state.credits -= 110;
  state.abilitiesUsed += 1;
  const routeCount = getActiveScenario().routes.length;
  for (let index = 0; index < 3; index += 1) {
    state.interceptors.push(new CoreInterceptor(index % routeCount));
  }
  const core = getCorePosition();
  createFloatingText(core.x - 42, core.y - 48, 'INTERCEPTORES', '#6df2ff');
  announce('El Core desplegó tres interceptores por las rutas enemigas.');
  updateHud();
  updateAbilityButtons();
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
saveStageButton?.addEventListener('click', saveStageProgress);
resumeProgressButton?.addEventListener('click', resumeSavedProgress);
endRunButton?.addEventListener('click', () => {
  if (!state.started || state.gameOver) return;
  if (!saveStageButton?.disabled) saveStageProgress();
  finishGame(false);
});

restartButton.addEventListener('click', () => {
  soundEngine.play('ui');
  soundEngine.stopAmbience();
  soundEngine.stopMusic();
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
gameModeSelect?.addEventListener('change', () => {
  if (state.started || !gameModes[gameModeSelect.value]) return;
  state.gameMode = gameModeSelect.value;
  state.endlessMode = false;
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
musicMixSelect?.addEventListener('change', () => soundEngine.setMusicMix(musicMixSelect.value));
musicToggleButton?.addEventListener('click', () => {
  soundEngine.setMusicEnabled(!soundEngine.musicEnabled);
  musicToggleButton.textContent = soundEngine.musicEnabled ? 'Pausar música' : 'Activar música';
  musicToggleButton.setAttribute('aria-pressed', String(soundEngine.musicEnabled));
});
musicVolumeControl?.addEventListener('input', () => soundEngine.setMusicVolume(musicVolumeControl.value));
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
if (musicMixSelect) musicMixSelect.value = soundEngine.musicMix;
if (musicVolumeControl) musicVolumeControl.value = Math.round(soundEngine.musicVolume * 100);
if (musicToggleButton) {
  musicToggleButton.textContent = soundEngine.musicEnabled ? 'Pausar música' : 'Activar música';
  musicToggleButton.setAttribute('aria-pressed', String(soundEngine.musicEnabled));
}
if (reducedMotionInput) reducedMotionInput.checked = state.reducedMotion;
updateProgressButtons();
if (document.documentElement) document.documentElement.dataset.reducedMotion = String(state.reducedMotion);
nodeCommandClose?.addEventListener('click', closeNodeCommand);
nodeCommandPopover?.addEventListener('close', () => {
  activeCommandNode = null;
});
canvas.addEventListener('click', handleCanvasClick);
window.addEventListener('languagechange', () => { renderShop(); renderSelectedTower(); updateWavePreview(); });

resetState();
updateWavePreview();
refreshLeaderboard();
requestAnimationFrame(animate);
