export const scenarios = [
  {
    key: 'neon-docks',
    name: 'Muelles de Neón',
    palette: { sky: '#08111f', ground: '#04070d', lane: 'rgba(117, 195, 255, 0.26)', accent: '#6df2ff', hazard: '#ff5e8e' },
    routes: [
      [
        { x: 0, y: 90 }, { x: 190, y: 90 }, { x: 190, y: 190 }, { x: 460, y: 190 },
        { x: 460, y: 340 }, { x: 780, y: 340 }, { x: 780, y: 470 }, { x: 960, y: 470 },
      ],
      [
        { x: 0, y: 255 }, { x: 150, y: 255 }, { x: 150, y: 410 }, { x: 390, y: 410 },
        { x: 390, y: 285 }, { x: 650, y: 285 }, { x: 650, y: 470 }, { x: 960, y: 470 },
      ],
    ],
    nodes: [
      { id: 1, x: 135, y: 205, occupied: null }, { id: 2, x: 290, y: 110, occupied: null },
      { id: 3, x: 340, y: 295, occupied: null }, { id: 4, x: 520, y: 110, occupied: null },
      { id: 5, x: 610, y: 260, occupied: null }, { id: 6, x: 710, y: 420, occupied: null },
      { id: 7, x: 870, y: 300, occupied: null }, { id: 8, x: 265, y: 450, occupied: null },
    ],
    props: [
      { type: 'dock', x: 40, y: 360, w: 110, h: 52 }, { type: 'antenna', x: 840, y: 105, h: 84 },
      { type: 'reactor', x: 585, y: 455, r: 26 },
    ],
  },
  {
    key: 'ember-wastes',
    name: 'Desierto Ígneo',
    palette: { sky: '#21100a', ground: '#080504', lane: 'rgba(255, 191, 105, 0.28)', accent: '#ffc869', hazard: '#ff7a45' },
    routes: [
      [
        { x: 0, y: 405 }, { x: 205, y: 405 }, { x: 205, y: 250 }, { x: 405, y: 250 },
        { x: 405, y: 118 }, { x: 715, y: 118 }, { x: 715, y: 470 }, { x: 960, y: 470 },
      ],
      [
        { x: 0, y: 145 }, { x: 245, y: 145 }, { x: 245, y: 335 }, { x: 540, y: 335 },
        { x: 540, y: 215 }, { x: 820, y: 215 }, { x: 820, y: 470 }, { x: 960, y: 470 },
      ],
      [
        { x: 0, y: 515 }, { x: 330, y: 515 }, { x: 330, y: 382 }, { x: 645, y: 382 },
        { x: 645, y: 300 }, { x: 835, y: 300 }, { x: 835, y: 470 }, { x: 960, y: 470 },
      ],
    ],
    nodes: [
      { id: 1, x: 125, y: 320, occupied: null }, { id: 2, x: 300, y: 205, occupied: null },
      { id: 3, x: 365, y: 455, occupied: null }, { id: 4, x: 520, y: 125, occupied: null },
      { id: 5, x: 585, y: 430, occupied: null }, { id: 6, x: 760, y: 330, occupied: null },
      { id: 7, x: 880, y: 155, occupied: null }, { id: 8, x: 665, y: 205, occupied: null },
    ],
    props: [
      { type: 'crystal', x: 95, y: 95, r: 30 }, { type: 'crystal', x: 475, y: 475, r: 24 },
      { type: 'antenna', x: 900, y: 360, h: 70 },
    ],
  },
  {
    key: 'aurora-ruins',
    name: 'Ruinas Aurora',
    palette: { sky: '#071626', ground: '#050812', lane: 'rgba(140, 120, 255, 0.3)', accent: '#a9fffb', hazard: '#8c78ff' },
    routes: [
      [
        { x: 0, y: 275 }, { x: 155, y: 275 }, { x: 155, y: 115 }, { x: 410, y: 115 },
        { x: 410, y: 275 }, { x: 690, y: 275 }, { x: 690, y: 470 }, { x: 960, y: 470 },
      ],
      [
        { x: 0, y: 70 }, { x: 280, y: 70 }, { x: 280, y: 215 }, { x: 540, y: 215 },
        { x: 540, y: 390 }, { x: 785, y: 390 }, { x: 785, y: 470 }, { x: 960, y: 470 },
      ],
    ],
    nodes: [
      { id: 1, x: 95, y: 170, occupied: null }, { id: 2, x: 265, y: 335, occupied: null },
      { id: 3, x: 350, y: 160, occupied: null }, { id: 4, x: 500, y: 330, occupied: null },
      { id: 5, x: 605, y: 125, occupied: null }, { id: 6, x: 725, y: 320, occupied: null },
      { id: 7, x: 850, y: 410, occupied: null }, { id: 8, x: 805, y: 205, occupied: null },
    ],
    props: [
      { type: 'reactor', x: 80, y: 455, r: 30 }, { type: 'dock', x: 430, y: 430, w: 135, h: 42 },
      { type: 'crystal', x: 875, y: 95, r: 28 },
    ],
  },

  {
    key: 'orbital-bastion',
    name: 'Bastión Orbital',
    palette: { sky: '#10142b', ground: '#050711', lane: 'rgba(126, 231, 135, 0.25)', accent: '#7ee787', hazard: '#ff9f1c' },
    routes: [
      [
        { x: 0, y: 115 }, { x: 175, y: 115 }, { x: 175, y: 305 }, { x: 350, y: 305 },
        { x: 350, y: 170 }, { x: 610, y: 170 }, { x: 610, y: 410 }, { x: 960, y: 410 },
      ],
      [
        { x: 0, y: 465 }, { x: 235, y: 465 }, { x: 235, y: 350 }, { x: 515, y: 350 },
        { x: 515, y: 245 }, { x: 785, y: 245 }, { x: 785, y: 470 }, { x: 960, y: 470 },
      ],
    ],
    nodes: [
      { id: 1, x: 105, y: 220, occupied: null }, { id: 2, x: 285, y: 125, occupied: null },
      { id: 3, x: 330, y: 390, occupied: null }, { id: 4, x: 475, y: 120, occupied: null },
      { id: 5, x: 575, y: 300, occupied: null }, { id: 6, x: 700, y: 405, occupied: null },
      { id: 7, x: 865, y: 330, occupied: null }, { id: 8, x: 740, y: 145, occupied: null },
    ],
    props: [
      { type: 'antenna', x: 70, y: 370, h: 82 }, { type: 'reactor', x: 885, y: 115, r: 28 },
      { type: 'dock', x: 410, y: 450, w: 128, h: 44 },
    ],
  },
  {
    key: 'bioforge-canopy',
    name: 'Dosel Bioforja',
    palette: { sky: '#092116', ground: '#030906', lane: 'rgba(108, 255, 149, 0.24)', accent: '#6cff95', hazard: '#d8a7ff' },
    routes: [
      [
        { x: 0, y: 325 }, { x: 130, y: 325 }, { x: 130, y: 155 }, { x: 360, y: 155 },
        { x: 360, y: 430 }, { x: 640, y: 430 }, { x: 640, y: 470 }, { x: 960, y: 470 },
      ],
      [
        { x: 0, y: 85 }, { x: 220, y: 85 }, { x: 220, y: 245 }, { x: 470, y: 245 },
        { x: 470, y: 105 }, { x: 760, y: 105 }, { x: 760, y: 470 }, { x: 960, y: 470 },
      ],
      [
        { x: 0, y: 520 }, { x: 300, y: 520 }, { x: 300, y: 375 }, { x: 535, y: 375 },
        { x: 535, y: 285 }, { x: 825, y: 285 }, { x: 825, y: 470 }, { x: 960, y: 470 },
      ],
    ],
    nodes: [
      { id: 1, x: 85, y: 210, occupied: null }, { id: 2, x: 265, y: 170, occupied: null },
      { id: 3, x: 315, y: 455, occupied: null }, { id: 4, x: 445, y: 340, occupied: null },
      { id: 5, x: 565, y: 135, occupied: null }, { id: 6, x: 690, y: 330, occupied: null },
      { id: 7, x: 835, y: 200, occupied: null }, { id: 8, x: 870, y: 390, occupied: null },
    ],
    props: [
      { type: 'crystal', x: 115, y: 440, r: 28 }, { type: 'reactor', x: 520, y: 65, r: 24 },
      { type: 'dock', x: 700, y: 45, w: 120, h: 38 },
    ],
  },
];

export const STAGE_SIZE = 5;
export const TOTAL_STAGES = 5;

const STAGE_ROUTE_GROWTH = 126;
const DETOUR_WIDTH_GROWTH = 118;
const BASE_ROUTE_EXTENSION_STEPS = 1;
const STAGE_WORLD_WIDTH_GROWTH = 220;
const BASE_WORLD_WIDTH = 960;
const WORLD_HEIGHT = 540;

function clonePoint(point) {
  return { ...point };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function insertStageDetour(route, stageStep, routeIndex = 0) {
  const extended = route.map(clonePoint);
  const insertionIndex = clamp(extended.length - 2 - ((stageStep + routeIndex) % 3), 1, extended.length - 2);
  const anchor = extended[insertionIndex];
  const next = extended[insertionIndex + 1] || anchor;
  const verticalDirection = anchor.y >= extended[insertionIndex - 1].y ? 1 : -1;
  const alternateDirection = (stageStep + routeIndex) % 2 === 0 ? verticalDirection : -verticalDirection;
  const worldWidth = BASE_WORLD_WIDTH + STAGE_WORLD_WIDTH_GROWTH * stageStep;
  const y = clamp(anchor.y + alternateDirection * Math.min(92 + STAGE_ROUTE_GROWTH * stageStep + routeIndex * 24, 292), 45, WORLD_HEIGHT - 5);
  const x = clamp(Math.max(anchor.x, next.x) + 126 + DETOUR_WIDTH_GROWTH * stageStep + routeIndex * 42, 120, worldWidth - 48);

  extended.splice(insertionIndex + 1, 0, { x: anchor.x, y }, { x, y }, { x, y: next.y });
  return extended;
}

function extendRoute(route, stageIndex, routeIndex = 0) {
  let extended = route.map(clonePoint);
  for (let stageStep = 1; stageStep <= stageIndex; stageStep += 1) extended = insertStageDetour(extended, stageStep, routeIndex);
  const coreX = BASE_WORLD_WIDTH + STAGE_WORLD_WIDTH_GROWTH * Math.max(stageIndex - BASE_ROUTE_EXTENSION_STEPS, 0);
  const lastPoint = extended[extended.length - 1];
  return [...extended.slice(0, -1), { ...lastPoint, x: coreX }];
}

function createLeftRoute(route, stageIndex, routeIndex) {
  const shifted = route.map((point, index) => index === 0
    ? { x: point.x, y: clamp(point.y + ((stageIndex + routeIndex) % 2 === 0 ? -1 : 1) * (36 + stageIndex * 10), 55, 525) }
    : clonePoint(point));
  return extendRoute(shifted, stageIndex + routeIndex + 1, routeIndex + 1);
}

function createVerticalIngressRoute(stageIndex, ingressIndex, fromTop) {
  const coreX = BASE_WORLD_WIDTH + STAGE_WORLD_WIDTH_GROWTH * stageIndex;
  const entryX = 210 + ((stageIndex * 137 + ingressIndex * 173) % Math.max(260, coreX - 480));
  const laneY = fromTop ? 110 + (ingressIndex % 2) * 56 : WORLD_HEIGHT - 110 - (ingressIndex % 2) * 56;
  const mergeX = Math.max(entryX + 150, coreX - 310 - ingressIndex * 42);
  const turnY = fromTop ? 300 + (ingressIndex % 2) * 52 : 245 - (ingressIndex % 2) * 48;
  return [
    { x: entryX, y: fromTop ? 0 : WORLD_HEIGHT },
    { x: entryX, y: laneY },
    { x: mergeX, y: laneY },
    { x: mergeX, y: turnY },
    { x: coreX - 110, y: 470 },
    { x: coreX, y: 470 },
  ];
}

function stageRoutes(routes, stageIndex) {
  const extensionSteps = stageIndex + BASE_ROUTE_EXTENSION_STEPS;
  const extendedRoutes = routes.map((route, routeIndex) => extendRoute(route, extensionSteps, routeIndex));
  if (stageIndex === 0) return extendedRoutes;

  // Every new stage opens vertical attack vectors: first from above, then below,
  // and finally both sides receive additional procedural branches.
  const ingressCount = Math.min(stageIndex + 1, TOTAL_STAGES);
  for (let ingressIndex = 0; ingressIndex < ingressCount; ingressIndex += 1) {
    const fromTop = ingressIndex % 2 === 0;
    extendedRoutes.push(createVerticalIngressRoute(stageIndex, ingressIndex, fromTop));
  }
  if (stageIndex >= 3) extendedRoutes.push(createVerticalIngressRoute(stageIndex, ingressCount, false));

  return extendedRoutes;
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy || 1;
  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
  return Math.hypot(point.x - (start.x + dx * t), point.y - (start.y + dy * t));
}

function isNearRoute(point, routes) {
  return routes.some((route) => route.slice(1).some((end, index) => distanceToSegment(point, route[index], end) < 42));
}

function stageNodes(nodes, routes, stageIndex, worldWidth) {
  const cloned = nodes.map((node) => ({ ...node, occupied: null }));
  let nextId = Math.max(...cloned.map((node) => node.id)) + 1;
  const candidates = [];

  routes.slice(nodes.length > 0 ? 0 : 0).forEach((route, routeIndex) => {
    if (routeIndex < 2 && stageIndex === 0) return;
    route.slice(1, -1).forEach((point, pointIndex) => {
      if ((pointIndex + routeIndex) % 2 !== 0) return;
      const previous = route[pointIndex];
      const horizontal = Math.abs(point.x - previous.x) >= Math.abs(point.y - previous.y);
      const offset = 58 + ((routeIndex + pointIndex + stageIndex) % 2) * 18;
      candidates.push({
        x: clamp(point.x + (horizontal ? 0 : (routeIndex % 2 ? -offset : offset)), 48, worldWidth - 48),
        y: clamp(point.y + (horizontal ? (routeIndex % 2 ? -offset : offset) : 0), 48, WORLD_HEIGHT - 48),
      });
    });
  });

  // The vertical ingress sectors receive dedicated build sites on both sides of
  // their lane, so players can answer a top or bottom breach immediately.
  routes.filter((route) => route[0].y === 0 || route[0].y === WORLD_HEIGHT).forEach((route, index) => {
    const fromTop = route[0].y === 0;
    const laneY = route[1].y;
    const side = index % 2 === 0 ? 1 : -1;
    candidates.push(
      { x: clamp(route[0].x + side * 76, 48, worldWidth - 48), y: (route[0].y + laneY) / 2 },
      { x: (route[1].x + route[2].x) / 2, y: clamp(laneY + (fromTop ? 70 : -70), 48, WORLD_HEIGHT - 48) },
      { x: clamp(route[2].x + side * 70, 48, worldWidth - 48), y: (route[2].y + route[3].y) / 2 },
    );
  });

  const additionsNeeded = 3 + stageIndex * 2;
  // Deterministic reserve pads keep expanding sectors buildable even where a
  // route's bends consume the closest positions.
  for (let attempt = 0; attempt < additionsNeeded * 12; attempt += 1) {
    candidates.push({
      x: 58 + ((stageIndex * 149 + attempt * 127) % Math.max(1, worldWidth - 116)),
      y: 54 + ((stageIndex * 73 + attempt * 89) % (WORLD_HEIGHT - 108)),
    });
  }
  for (const candidate of candidates) {
    if (cloned.length >= nodes.length + additionsNeeded) break;
    if (isNearRoute(candidate, routes) || cloned.some((node) => Math.hypot(node.x - candidate.x, node.y - candidate.y) < 68)) continue;
    cloned.push({ id: nextId, ...candidate, occupied: null });
    nextId += 1;
  }
  return cloned;
}

export function getStageForWave(waveIndex) {
  return Math.min(TOTAL_STAGES, Math.max(1, Math.floor(Math.max(waveIndex, 0) / STAGE_SIZE) + 1));
}

export function getScenarioLayout(scenario, waveIndex = 0, difficultyKey = 'normal') {
  const stageIndex = getStageForWave(waveIndex) - 1;
  const routes = stageRoutes(scenario.routes, stageIndex);
  const furthestPoint = Math.max(...routes.flat().map((point) => point.x));
  const worldWidth = Math.max(BASE_WORLD_WIDTH + STAGE_WORLD_WIDTH_GROWTH * stageIndex, furthestPoint + 40);
  return {
    ...scenario,
    stageIndex,
    worldWidth,
    routes,
    nodes: stageNodes(scenario.nodes, routes, stageIndex, worldWidth),
  };
}
