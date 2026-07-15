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
];
