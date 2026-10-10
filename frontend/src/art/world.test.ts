import { describe, expect, it } from 'vitest';
import { C, CHARS, PALETTE, RAMPS } from './palette';
import { type PixelCanvas, rect } from './raster';
import {
  CENTER_DOOR, CENTER_SIZE, HOUSE_DOOR, HOUSE_SIZE, TILE_COUNT, TILE_SIZE, Tile, drawAllTiles, drawCenter, drawExclaim,
  drawHouse, drawTile,
} from './world';
import {
  BASE_ROLES, CHARACTERS, CHARACTER_IDS, CHAR_H, CHAR_W, DIRECTIONS, characterSheet, drawCharacterFrame,
  drawCharacterFrames, recolor,
} from './worldCharacters';
import { WORLD_TEXTURES, characterKey, walkAnimKey } from './worldTextures';

const onlyPalette = (c: PixelCanvas) => c.px.every((v) => v >= -1 && v < PALETTE.length);
const samePixels = (a: PixelCanvas, b: PixelCanvas) => a.px.every((v, i) => v === b.px[i]);
const opaque = (c: PixelCanvas, x0: number, y0: number, w: number, h: number) => {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (c.get(x, y) < 0) return false;
  return true;
};
const colorsIn = (c: PixelCanvas) => new Set([...c.px].filter((v) => v >= 0));
const mirrorOf = (c: PixelCanvas) => {
  const out: number[] = [];
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) out.push(c.get(c.width - 1 - x, y));
  return out;
};

describe('world tiles', () => {
  const tiles = drawAllTiles();

  it('has one 16x16 frame per Tile, in enum order', () => {
    expect(TILE_SIZE).toBe(16);
    expect(tiles).toHaveLength(TILE_COUNT);
    expect(TILE_COUNT).toBe(Object.values(Tile).filter((v) => typeof v === 'number').length);
    expect(Tile.GRASS).toBe(0);
    expect(Tile.TALL_GRASS_FRONT).toBe(11);
    tiles.forEach((t, i) => {
      expect(t.width).toBe(TILE_SIZE);
      expect(t.height).toBe(TILE_SIZE);
      expect(onlyPalette(t)).toBe(true);
      expect(samePixels(t, drawTile(i as Tile))).toBe(true);
    });
  });

  it('draws every ground tile opaque (only the grass overlay has holes)', () => {
    tiles.forEach((t, i) => {
      if (i === Tile.TALL_GRASS_FRONT) return;
      expect(opaque(t, 0, 0, TILE_SIZE, TILE_SIZE), `tile ${Tile[i]}`).toBe(true);
    });
  });

  it('keeps every tile visually different from the others', () => {
    for (let i = 0; i < tiles.length; i++)
      for (let j = i + 1; j < tiles.length; j++) expect(samePixels(tiles[i], tiles[j]), `${Tile[i]} vs ${Tile[j]}`).toBe(false);
  });

  it('paints water only with the blue ramp and a ripple', () => {
    const water = tiles[Tile.WATER];
    const allowed = new Set<number>(RAMPS.water.tones);
    expect([...colorsIn(water)].every((v) => allowed.has(v))).toBe(true);
    expect(colorsIn(water).size).toBeGreaterThanOrEqual(2);
    expect([...water.px].filter((v) => v === C.cyan).length).toBeGreaterThanOrEqual(8);
  });

  it('makes tall grass much darker and denser than plain grass', () => {
    const dark = (t: PixelCanvas) => [...t.px].filter((v) => v === C.pine || v === C.deepTeal || v === C.forest).length;
    expect(dark(tiles[Tile.TALL_GRASS])).toBeGreaterThan(dark(tiles[Tile.GRASS]) * 4);
    const differing = tiles[Tile.TALL_GRASS].px.filter((v, i) => v !== tiles[Tile.GRASS].px[i]).length;
    expect(differing).toBeGreaterThan(TILE_SIZE * TILE_SIZE * 0.6);
  });

  it('keeps the front blades only on the lower half, matching the tall grass pixels', () => {
    const front = tiles[Tile.TALL_GRASS_FRONT];
    const half = TILE_SIZE / 2;
    for (let y = 0; y < half; y++) for (let x = 0; x < TILE_SIZE; x++) expect(front.get(x, y)).toBe(-1);
    let solid = 0;
    for (let y = half; y < TILE_SIZE; y++)
      for (let x = 0; x < TILE_SIZE; x++) {
        const v = front.get(x, y);
        if (v < 0) continue;
        solid++;
        expect(v).toBe(tiles[Tile.TALL_GRASS].get(x, y));
      }
    expect(solid).toBeGreaterThan(half * TILE_SIZE * 0.55);
    // O capim da frente cobre os pes: as duas ultimas linhas ficam totalmente fechadas.
    expect(opaque(front, 0, TILE_SIZE - 3, TILE_SIZE, 3)).toBe(true);
  });

  it('tiles grass, path, sand and water seamlessly (no outline on the borders)', () => {
    const outlineish = new Set<number>([C.black, C.night, C.umber, C.deepTeal]);
    for (const id of [Tile.GRASS, Tile.PATH, Tile.SAND, Tile.WATER]) {
      expect([...colorsIn(tiles[id])].some((v) => outlineish.has(v)), Tile[id]).toBe(false);
    }
  });

  it('draws the standing props on the grass background', () => {
    const grass = tiles[Tile.GRASS];
    for (const id of [Tile.TREE, Tile.FLOWERS, Tile.FENCE, Tile.SIGN, Tile.ROCK]) {
      // O canto superior esquerdo e o gramado, para o prop nao "furar" o chao ao lado.
      expect(tiles[id].get(0, 0), Tile[id]).toBe(grass.get(0, 0));
      expect(colorsIn(tiles[id]).has(C.green), Tile[id]).toBe(true);
    }
  });

  it('gives the fence rails and the bridge planks a wooden palette', () => {
    const wood = new Set<number>([C.khaki, C.brown, C.darkBrown, C.umber, C.tan]);
    for (const id of [Tile.FENCE, Tile.BRIDGE, Tile.SIGN]) {
      const count = [...tiles[id].px].filter((v) => wood.has(v)).length;
      expect(count, Tile[id]).toBeGreaterThan(40);
    }
    // A ponte: tabuas no meio e agua nas bordas de cima e de baixo, para emendar com o rio.
    const bridge = tiles[Tile.BRIDGE];
    expect(RAMPS.water.tones).toContain(bridge.get(8, 0));
    expect(RAMPS.water.tones).toContain(bridge.get(8, TILE_SIZE - 1));
    expect(wood.has(bridge.get(8, 8))).toBe(true);
  });
});

describe('buildings', () => {
  const center = drawCenter();
  const house = drawHouse();

  it('draws the Centro Clonemon 80x64 with the door at tile (2,3)', () => {
    expect(center.width).toBe(CENTER_SIZE.width);
    expect(center.height).toBe(CENTER_SIZE.height);
    expect(onlyPalette(center)).toBe(true);
    const x = CENTER_DOOR.col * TILE_SIZE;
    const y = CENTER_DOOR.row * TILE_SIZE;
    expect(opaque(center, x, y, TILE_SIZE, TILE_SIZE)).toBe(true);
    // Vidro da porta no meio do ladrilho.
    expect(RAMPS.water.tones).toContain(center.get(x + 4, y + 10));
    expect(RAMPS.water.tones).toContain(center.get(x + 11, y + 10));
  });

  it('draws the house 64x48 with the door at tile (1,2)', () => {
    expect(house.width).toBe(HOUSE_SIZE.width);
    expect(house.height).toBe(HOUSE_SIZE.height);
    expect(onlyPalette(house)).toBe(true);
    const x = HOUSE_DOOR.col * TILE_SIZE;
    const y = HOUSE_DOOR.row * TILE_SIZE;
    expect(opaque(house, x, y, TILE_SIZE, TILE_SIZE)).toBe(true);
    expect(house.get(x + 7, y + 12)).toBe(C.brown);
  });

  it.each([['center', center], ['house', house]] as const)('%s sits flush on the bottom edge and has a red/blue roof', (name, b) => {
    // A base do predio encosta na ultima linha, para ele "pisar" no ladrilho de baixo.
    let bottom = 0;
    for (let x = 0; x < b.width; x++) if (b.get(x, b.height - 1) >= 0) bottom++;
    expect(bottom, name).toBeGreaterThan(b.width * 0.7);
    // Cantos de cima transparentes: o telhado nao e um retangulo.
    expect(b.get(0, 0), name).toBe(-1);
    expect(b.get(b.width - 1, 0), name).toBe(-1);
  });

  it('uses a red roof on the center and a blue one on the house', () => {
    expect(colorsIn(center).has(C.red)).toBe(true);
    expect(colorsIn(house).has(C.blue)).toBe(true);
    expect(colorsIn(house).has(C.red)).toBe(true); // flores e chamine
  });

  it('draws a 16x16 exclamation bubble with a red mark on a white balloon', () => {
    const bubble = drawExclaim();
    expect(bubble.width).toBe(16);
    expect(bubble.height).toBe(16);
    expect(onlyPalette(bubble)).toBe(true);
    const used = colorsIn(bubble);
    expect(used.has(C.white)).toBe(true);
    expect(used.has(C.red)).toBe(true);
    expect(bubble.get(0, 0)).toBe(-1);
    expect(rect(0, 0, 16, 16)(3, 3)).toBe(true);
  });
});

describe('characters', () => {
  it('lists the four ids and the texture contract', () => {
    expect(CHARACTER_IDS).toEqual(['player', 'caio', 'bia', 'zeca']);
    expect(characterKey('bia')).toBe('char-bia');
    expect(walkAnimKey('zeca', 'left')).toBe('char-zeca-walk-left');
    expect(WORLD_TEXTURES).toEqual({ tiles: 'world-tiles', center: 'world-center', house: 'world-house', exclaim: 'world-exclaim' });
  });

  describe.each(CHARACTER_IDS)('%s', (id) => {
    const frames = drawCharacterFrames(id);

    it('has 12 frames of 16x24 in row-major order (down, left, right, up) x (stand, A, B)', () => {
      expect(frames).toHaveLength(12);
      DIRECTIONS.forEach((dir, row) =>
        ([0, 1, 2] as const).forEach((step) => {
          const f = frames[row * 3 + step];
          expect(f.width).toBe(CHAR_W);
          expect(f.height).toBe(CHAR_H);
          expect(samePixels(f, drawCharacterFrame(id, dir, step))).toBe(true);
        }));
    });

    it('uses only palette colors and keeps the feet on the last row', () => {
      for (const f of frames) {
        expect(onlyPalette(f)).toBe(true);
        const b = f.bounds()!;
        expect(b.y1).toBe(CHAR_H - 1);
        expect(b.y0).toBeLessThanOrEqual(2);
        expect(b.x0).toBeGreaterThanOrEqual(0);
        expect([...f.px].filter((v) => v >= 0).length).toBeGreaterThan(150);
      }
    });

    it('looks different facing each direction', () => {
      const stand = DIRECTIONS.map((_, row) => frames[row * 3]);
      for (let i = 0; i < stand.length; i++)
        for (let j = i + 1; j < stand.length; j++) expect(samePixels(stand[i], stand[j]), `${DIRECTIONS[i]} vs ${DIRECTIONS[j]}`).toBe(false);
    });

    it('mirrors left into right', () => {
      for (const step of [0, 1, 2]) expect([...frames[2 * 3 + step].px]).toEqual(mirrorOf(frames[1 * 3 + step]));
    });

    it('animates the walk: both steps differ from standing and from each other', () => {
      DIRECTIONS.forEach((dir, row) => {
        const [stand, a, b] = [frames[row * 3], frames[row * 3 + 1], frames[row * 3 + 2]];
        expect(samePixels(stand, a), `${dir} stand vs A`).toBe(false);
        expect(samePixels(stand, b), `${dir} stand vs B`).toBe(false);
        expect(samePixels(a, b), `${dir} A vs B`).toBe(false);
      });
    });

    it('packs the sheet as 3 columns x 4 rows', () => {
      const sheet = characterSheet(id);
      expect(sheet.width).toBe(CHAR_W * 3);
      expect(sheet.height).toBe(CHAR_H * 4);
      // Quadro 7 (linha 2, coluna 1): o passo A para a direita.
      const f = frames[7].rgba();
      for (let y = 0; y < CHAR_H; y++) {
        const row = sheet.rgba.subarray(((2 * CHAR_H + y) * sheet.width + CHAR_W) * 4, ((2 * CHAR_H + y) * sheet.width + 2 * CHAR_W) * 4);
        expect([...row]).toEqual([...f.subarray(y * CHAR_W * 4, (y + 1) * CHAR_W * 4)]);
      }
    });

    it('has well-formed hand-drawn grids', () => {
      const spec = CHARACTERS[id];
      const known = (ch: string) => ch === '.' || ch in (spec.roles as Record<string, string>) || ch in BASE_ROLES || ch in CHARS;
      for (const view of ['down', 'left', 'up'] as const) {
        expect(spec.head[view], `${view} head rows`).toHaveLength(12);
        for (const row of spec.head[view]) expect(row).toHaveLength(CHAR_W);
        for (const row of spec.torso?.[view] ?? []) expect(row).toHaveLength(CHAR_W);
        expect(spec.torso?.[view] ?? Array(6)).toHaveLength(6);
        for (const o of spec.extras?.[view] ?? []) {
          for (const row of o.grid) {
            expect(o.x + row.length).toBeLessThanOrEqual(CHAR_W);
            expect([...row].every(known)).toBe(true);
          }
        }
        for (const row of [...spec.head[view], ...(spec.torso?.[view] ?? [])]) expect([...row].every(known), row).toBe(true);
      }
    });
  });

  it('gives every character a recognisable palette of its own', () => {
    const stand = CHARACTER_IDS.map((id) => drawCharacterFrame(id, 'down', 0));
    for (let i = 0; i < stand.length; i++)
      for (let j = i + 1; j < stand.length; j++) {
        const differing = stand[i].px.filter((v, k) => v !== stand[j].px[k]).length;
        expect(differing, `${CHARACTER_IDS[i]} vs ${CHARACTER_IDS[j]}`).toBeGreaterThan(80);
      }
  });

  it('recolors roles and passes plain palette characters through', () => {
    expect(recolor(['OH.o'], { H: 'd' })).toEqual(['ud.o']);
  });
});
