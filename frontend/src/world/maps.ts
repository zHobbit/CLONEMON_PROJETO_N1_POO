import type { Facing, WorldPosition } from '../api/types';

/** Tipo de chao de cada ladrilho; a cena traduz para os quadros da arte. */
export type Terrain =
  | 'grass'
  | 'tallGrass'
  | 'path'
  | 'water'
  | 'tree'
  | 'flowers'
  | 'fence'
  | 'sign'
  | 'rock'
  | 'sand'
  | 'bridge'
  /** Area ocupada por uma construcao (a imagem dela cobre o chao). */
  | 'building';

/** Um caractere por ladrilho, para desenhar o mapa como texto. */
export const LEGEND: Readonly<Record<string, Terrain>> = {
  '.': 'grass',
  '"': 'tallGrass',
  _: 'path',
  '~': 'water',
  T: 'tree',
  '*': 'flowers',
  '+': 'fence',
  S: 'sign',
  R: 'rock',
  ':': 'sand',
  '=': 'bridge',
  '#': 'building',
};

export type NpcId = 'caio' | 'bia' | 'zeca';

/** Treinador parado no mapa: desafia quem entrar na linha de visao dele. */
export interface NpcDef {
  id: NpcId;
  name: string;
  x: number;
  y: number;
  facing: Facing;
  /** Quantos ladrilhos a frente ele enxerga. */
  sight: number;
  /** Falas antes da batalha e depois de perder. */
  before: readonly string[];
  after: readonly string[];
}

export type BuildingKind = 'center' | 'house';

/** Tamanho em ladrilhos e porta (relativa ao canto) de cada construcao, como na arte. */
export const BUILDING_SHAPE: Readonly<Record<BuildingKind, { w: number; h: number; door: { x: number; y: number } }>> = {
  center: { w: 5, h: 4, door: { x: 2, y: 3 } },
  house: { w: 4, h: 3, door: { x: 1, y: 2 } },
};

export interface BuildingDef {
  kind: BuildingKind;
  /** Canto superior esquerdo, em ladrilhos. */
  x: number;
  y: number;
}

export interface SignDef {
  x: number;
  y: number;
  text: readonly string[];
}

export interface WorldMap {
  width: number;
  height: number;
  /** terrain[y][x] */
  terrain: Terrain[][];
  spawn: WorldPosition;
  npcs: readonly NpcDef[];
  buildings: readonly BuildingDef[];
  signs: readonly SignDef[];
}

export interface Point {
  x: number;
  y: number;
}

export function parseRows(rows: readonly string[]): Terrain[][] {
  return rows.map((row, y) =>
    [...row].map((ch, x) => {
      const t = LEGEND[ch];
      if (!t) throw new Error(`Caractere desconhecido '${ch}' em (${x},${y})`);
      return t;
    }),
  );
}

/** Porta da construcao, em coordenadas do mapa. */
export function doorOf(b: BuildingDef): Point {
  const shape = BUILDING_SHAPE[b.kind];
  return { x: b.x + shape.door.x, y: b.y + shape.door.y };
}

/**
 * Vila Capim (sul) e a Rota 1 (norte). Colunas 19-20: a estrada que liga as duas.
 * Cada linha tem 40 caracteres; veja LEGEND.
 */
const ROWS = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 0
  'TTTTTTTTTTTTTTTTTTTT+TTTTTTTTTTTTTTTTTTT', // 1  portao da Rota 2
  'TT**..""""..TTTTTTTT_TTTTT..""""""..TTTT', // 2  ZECA no fim do corredor
  'TT*...""""..TTTTTTTT_TTTTT..""""""...TTT', // 3
  'TT....""""..TTTTTTTT_TTTTT.R.""""..R.TTT', // 4
  'TT..........TTTTTTTT_STTTT...........TTT', // 5
  'TT..*..............__..........R......TT', // 6
  'TT....:::::::::::::__:::::..""""""""..TT', // 7  BIA olhando para a ponte
  'TT....~~~~~~~~~~~~~==~~~~~:.""""""""..TT', // 8  lago com ponte
  'TT.R..~~~~~~~~~~~~~==~~~~~:.""""""R"..TT', // 9
  'TT....~~~~~~~~~~~~~==~~~~~:.."""""""..TT', // 10
  'TT*...~~~~~~~~~~~~~==~~~~~:...........TT', // 11
  'TT....:::::::::::S:__:::::............TT', // 12
  'TT.................__..........R......TT', // 13
  'TT."""""""""T......__.""""""""""......TT', // 14 CAIO vigia a estrada
  'TT."""""""""TT.....__.""""""""""..RR..TT', // 15
  'TT."""""""""T......__.""""""""""......TT', // 16
  'TT."""""""""....*..__.""""""""""...*..TT', // 17
  'TT................S__.................TT', // 18
  'TT+++++++++++++++++__+++++++++++++++++TT', // 19 cerca da vila
  'TT...*.......*.....__.....*.....T.....TT', // 20
  'TT....#####........__...####..####....TT', // 21 centro e casas
  'TT....#####..*.....__...####..####..T.TT', // 22
  'TT....#####........__...####..####....TT', // 23
  'TT....#####S.....S.__...._....._......TT', // 24
  'TT..._______________________________..TT', // 25 rua principal
  'TT..*.*.............*.....*.*.........TT', // 26
  'TT.*...........*........TT.......*....TT', // 27
  'TT....................................TT', // 28
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 29
];

const terrain = parseRows(ROWS);

export const ROUTE_1: WorldMap = {
  width: terrain[0].length,
  height: terrain.length,
  terrain,
  // Na porta de casa.
  spawn: { x: 25, y: 24, facing: 'DOWN' },
  buildings: [
    { kind: 'center', x: 6, y: 21 },
    { kind: 'house', x: 24, y: 21 },
    { kind: 'house', x: 30, y: 21 },
  ],
  signs: [
    { x: 11, y: 24, text: ['CENTRO CLONEMON', 'Curamos seus CLONEMONS de graca!'] },
    { x: 17, y: 24, text: ['VILA CAPIM', 'Onde toda jornada comeca.'] },
    { x: 18, y: 18, text: ['ROTA 1', 'Cuidado: CLONEMONS selvagens no capim alto!'] },
    { x: 17, y: 12, text: ['LAGO RASO', 'Proibido nadar. Use a ponte!'] },
    { x: 21, y: 5, text: ['ROTA 2', 'Fechada para obras. Volte outro dia!'] },
  ],
  npcs: [
    {
      id: 'caio',
      name: 'CAIO',
      x: 16,
      y: 14,
      facing: 'RIGHT',
      sight: 4,
      before: ['Ei, voce! Ninguem passa pela ROTA 1 sem lutar comigo!'],
      after: ['Voce e bom mesmo...', 'Vou treinar mais no capim alto.'],
    },
    {
      id: 'bia',
      name: 'BIA',
      x: 23,
      y: 7,
      facing: 'LEFT',
      sight: 4,
      before: ['Meus CLONEMONS adoram a beira do lago.', 'Vamos ver se os seus aguentam!'],
      after: ['Perdi, mas meus CLONEMONS se divertiram.', 'O lago fica lindo daqui, ne?'],
    },
    {
      id: 'zeca',
      name: 'ZECA',
      x: 20,
      y: 2,
      facing: 'DOWN',
      sight: 3,
      before: ['Eu sou o ZECA, o mais forte da ROTA 1!', 'Quer chegar a ROTA 2? Entao me venca!'],
      after: ['Voce me venceu de verdade.', 'A ROTA 2 ainda esta em obras... volte outro dia!'],
    },
  ],
};
