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

const difficultyRouteOffsets = {
  easy: 0,
  normal: 10,
  hard: 20,
  nightmare: 30,
};

function clonePoint(point) {
  return { ...point };
}

function extendRoute(route, stageIndex, difficultyKey) {
  const offset = difficultyRouteOffsets[difficultyKey] ?? difficultyRouteOffsets.normal;
  const extended = route.map(clonePoint);
  if (stageIndex <= 0) return extended;

  const insertionIndex = Math.max(1, extended.length - 2);
  const anchor = extended[insertionIndex];
  const previous = extended[insertionIndex - 1];
  const verticalDirection = anchor.y > previous.y ? 1 : -1;
  const detourDepth = Math.min(58 + stageIndex * 26 + offset, 150);
  const detourWidth = 54 + stageIndex * 18;
  const y = Math.max(55, Math.min(505, anchor.y + verticalDirection * detourDepth));
  const x = Math.max(120, Math.min(850, anchor.x + detourWidth));
  extended.splice(insertionIndex + 1, 0, { x: anchor.x, y }, { x, y }, { x, y: anchor.y });

  if (stageIndex >= 3) {
    const secondAnchor = extended[Math.max(1, Math.floor(extended.length / 2))];
    const secondY = Math.max(70, Math.min(490, secondAnchor.y - verticalDirection * (70 + offset)));
    extended.splice(Math.max(2, Math.floor(extended.length / 2)) + 1, 0, { x: secondAnchor.x, y: secondY });
  }
  return extended;
}

function stageNodes(nodes, stageIndex, difficultyKey) {
  const offset = (difficultyRouteOffsets[difficultyKey] ?? difficultyRouteOffsets.normal) / 2;
  const cloned = nodes.map((node) => ({ ...node, occupied: null }));
  if (stageIndex >= 1) cloned.push({ id: 9, x: 455 + offset, y: 455 - stageIndex * 12, occupied: null });
  if (stageIndex >= 2) cloned.push({ id: 10, x: 840 - offset, y: 90 + stageIndex * 18, occupied: null });
  if (stageIndex >= 3) cloned.push({ id: 11, x: 210 + stageIndex * 25, y: 285 + offset, occupied: null });
  if (stageIndex >= 4) cloned.push({ id: 12, x: 700 - offset, y: 155 + stageIndex * 15, occupied: null });
  return cloned;
}

export function getStageForWave(waveIndex) {
  return Math.min(TOTAL_STAGES, Math.max(1, Math.floor(Math.max(waveIndex, 0) / STAGE_SIZE) + 1));
}

export function getScenarioLayout(scenario, waveIndex = 0, difficultyKey = 'normal') {
  const stageIndex = getStageForWave(waveIndex) - 1;
  return {
    ...scenario,
    routes: scenario.routes.map((route) => extendRoute(route, stageIndex, difficultyKey)),
    nodes: stageNodes(scenario.nodes, stageIndex, difficultyKey),
  };
}
