import type { Song } from './sequencer';

/** Compassos de 16 passos (semicolcheias em 4/4). */

/** Baixo sincopado 3+3+2: fundamental e quinta. */
const bounce = (root: string, fifth: string) => `${root} - - ${root} - - ${fifth} - ${root} - - ${root} - - ${fifth} -`;
/** Acorde quebrado em colcheias: 1 3 5 3 1 3 5 3. */
const broken = (a: string, b: string, c: string) => `${a} - ${b} - ${c} - ${b} - ${a} - ${b} - ${c} - ${b} -`;
/** Oitavas em colcheias, o baixo "galopando" da batalha. */
const octaves = (low: string, high: string) => `${low} - ${high} - `.repeat(4).trim();

const BEAT = 'k . h . s . h . k . h . s . h .';

/** Tema do titulo e dos menus: Do maior, tranquilo. */
export const TITLE_THEME: Song = {
  bpm: 116,
  stepsPerBeat: 4,
  loop: true,
  voices: {
    pulse1: [
      'E5 - - - G5 - - - C6 - - - - - B5 -',
      'A5 - - - E5 - - - C5 - - - - - . .',
      'F5 - G5 - A5 - - - C6 - - - A5 - - -',
      'G5 - - - - - - - . . D5 - E5 - F5 -',
      'E5 - - - G5 - - - C6 - - - E6 - D6 -',
      'C6 - - - A5 - - - E5 - - - - - . .',
      'F5 - A5 - C6 - - - D6 - B5 - G5 - - -',
      'C6 - - - - - - - . . G5 - F5 - D5 -',
    ],
    pulse2: [
      broken('C4', 'E4', 'G4'),
      broken('A3', 'C4', 'E4'),
      broken('F3', 'A3', 'C4'),
      broken('G3', 'B3', 'D4'),
      broken('C4', 'E4', 'G4'),
      broken('A3', 'C4', 'E4'),
      'F3 - A3 - C4 - A3 - G3 - B3 - D4 - B3 -',
      broken('C4', 'E4', 'G4'),
    ],
    triangle: [
      bounce('C3', 'G2'),
      bounce('A2', 'E2'),
      bounce('F2', 'C3'),
      bounce('G2', 'D3'),
      bounce('C3', 'G2'),
      bounce('A2', 'E2'),
      'F2 - - F2 - - C3 - G2 - - G2 - - D3 -',
      bounce('C3', 'G2'),
    ],
    noise: [BEAT, BEAT, BEAT, BEAT, BEAT, BEAT, BEAT, 'k . h . s . h . k . s . s . s s'],
  },
};

const DRIVE = 'k . h k s . h . k . h k s . h .';

/** Tema de batalha: La menor, mais rapido, baixo em oitavas. */
export const BATTLE_THEME: Song = {
  bpm: 150,
  stepsPerBeat: 4,
  loop: true,
  urgent: true,
  voices: {
    pulse1: [
      'A5 - - - E5 - A5 - C6 - B5 - A5 - E5 -',
      'F5 - - - A5 - - - C6 - - - A5 - F5 -',
      'G5 - - - B5 - - - D6 - - - B5 - G5 -',
      'G#5 - - - - - - - B5 - - - E6 - - -',
      'A5 - C6 - E6 - - - D6 - C6 - B5 - A5 -',
      'C6 - - - A5 - - - F5 - - - A5 - C6 -',
      'D6 - - - C6 - - - A5 - - - F5 - A5 -',
      'G#5 - - - - - - - E5 - G#5 - B5 - D6 -',
    ],
    pulse2: [
      broken('A4', 'C5', 'E5'),
      broken('F4', 'A4', 'C5'),
      broken('G4', 'B4', 'D5'),
      broken('E4', 'G#4', 'B4'),
      broken('A4', 'C5', 'E5'),
      broken('F4', 'A4', 'C5'),
      broken('D4', 'F4', 'A4'),
      broken('E4', 'G#4', 'B4'),
    ],
    triangle: [
      octaves('A2', 'A3'),
      octaves('F2', 'F3'),
      octaves('G2', 'G3'),
      octaves('E2', 'E3'),
      octaves('A2', 'A3'),
      octaves('F2', 'F3'),
      octaves('D2', 'D3'),
      octaves('E2', 'E3'),
    ],
    noise: [DRIVE, DRIVE, DRIVE, DRIVE, DRIVE, DRIVE, DRIVE, 'k . h k s . h . s . s s s . s s'],
  },
};

/** Fanfarra curta de vitoria. */
export const VICTORY_JINGLE: Song = {
  bpm: 132,
  stepsPerBeat: 4,
  loop: false,
  voices: {
    pulse1: ['C5 - E5 - G5 - C6 - - - G5 - C6 - E6 -', 'D6 - B5 - G5 - B5 - C6 - - - - - - -'],
    pulse2: ['E4 - G4 - C5 - E5 - - - E5 - G5 - G5 -', 'B5 - G5 - D5 - G5 - E5 - - - - - - -'],
    triangle: ['C3 - - - G2 - - - C3 - - - E3 - - -', 'G2 - - - - - - - C3 - - - - - - -'],
    noise: ['k . . . s . . . k . . . s . s s', 'k . . . s . . . k . . . . . . .'],
  },
};

/** Descida triste em La menor quando o time inteiro desmaia. */
export const DEFEAT_JINGLE: Song = {
  bpm: 112,
  stepsPerBeat: 4,
  loop: false,
  voices: {
    pulse1: ['E5 - - - D5 - - - C5 - - - B4 - - -', 'C5 - B4 - A4 - - - G#4 - - - A4 - - -'],
    pulse2: ['C5 - - - B4 - - - A4 - - - G#4 - - -', 'A4 - G#4 - E4 - - - E4 - - - E4 - - -'],
    triangle: ['A2 - - - G2 - - - F2 - - - E2 - - -', 'A2 - - - - - - - E2 - - - A2 - - -'],
  },
};

export type Track = 'title' | 'battle';
export type JingleName = 'victory' | 'defeat';

export const TRACKS: Readonly<Record<Track, Song>> = { title: TITLE_THEME, battle: BATTLE_THEME };
export const JINGLES: Readonly<Record<JingleName, Song>> = { victory: VICTORY_JINGLE, defeat: DEFEAT_JINGLE };
