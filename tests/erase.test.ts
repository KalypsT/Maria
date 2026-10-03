import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { TILE_SIZE as T } from '../src/config/display';
import { EraseEvent, EraseState } from '../src/core/boss/Erase';
import { LayerMask, Tile, tileAt } from '../src/core/level/LevelData';
import {
  bandsGone,
  eraseDissolved,
  eraseFactor,
  erasedLevel,
  initialMasks,
  isWave,
  wavePatterns,
} from '../src/core/level/erase';
import { atLayer } from '../src/core/level/layers';
import { parseAsciiLevel } from '../src/core/level/parseAsciiLevel';

/** Une petite salle écrite à la main (lignes de 12 tuiles). */
function room(directives: string[]): string {
  return [
    ...directives.map((d) => `; @${d}`),
    '############',
    '#..........#',
    '#..===.....#',
    '#......===.#',
    '#..........#',
    '#.P.==.....#',
    '############',
  ].join('\n');
}

const HZ = 120;

describe('l’effacement : des groupes qui changent de couche (D-111)', () => {
  const level = parseAsciiLevel(
    'erase',
    room([
      'erase: a present 3 2 3 1',
      'erase: b memory 7 3 3 1',
      'erase: c both 4 5 2 1',
      'erase-step: a,b',
    ]),
  );
  const erase = level.erase;
  if (!erase) {
    throw new Error('effacement absent');
  }

  it('se lit : groupes, couches de départ, vagues et bandes', () => {
    expect(erase.groups.map((g) => [g.id, g.initial])).toEqual([
      ['a', LayerMask.Present],
      ['b', LayerMask.Memory],
      ['c', LayerMask.Both],
    ]);
    expect(isWave(erase, 'a')).toBe(true);
    expect(isWave(erase, 'c')).toBe(false);
  });

  it('chaque motif est une variante statique : les couches de chaque groupe', () => {
    const start = erasedLevel(level, initialMasks(erase));
    expect(tileAt(start, 3, 2)).toBe(Tile.OneWay);
    expect(tileAt(atLayer(start, 'memory'), 3, 2)).toBe(Tile.Empty);
    expect(tileAt(atLayer(start, 'memory'), 7, 3)).toBe(Tile.OneWay);
    const [first, second] = wavePatterns(erase);
    expect(Array.from(first ?? [])).toEqual([1, 2, 3]);
    expect(Array.from(second ?? [])).toEqual([2, 1, 3]);
    const swapped = erasedLevel(level, second ?? []);
    expect(tileAt(swapped, 3, 2)).toBe(Tile.Empty);
    expect(tileAt(atLayer(swapped, 'memory'), 3, 2)).toBe(Tile.OneWay);
    expect(tileAt(swapped, 7, 3)).toBe(Tile.OneWay);
    // Les bandes quittent le présent, restent dans le souvenir.
    const gone = erasedLevel(level, bandsGone(erase));
    expect(tileAt(gone, 4, 5)).toBe(Tile.Empty);
    expect(tileAt(atLayer(gone, 'memory'), 4, 5)).toBe(Tile.OneWay);
    // En cache, même identifiant.
    expect(erasedLevel(level, second ?? [])).toBe(swapped);
    expect(swapped.id).toBe(level.id);
  });

  it('les vagues : annoncées, puis appliquées ; en boucle', () => {
    const state = new EraseState(erase, DEFAULT_COMBAT, HZ);
    const host = { canApply: () => true };
    let announced = -1;
    let changed = -1;
    for (let s = 0; s < HZ * 12 && changed < 0; s++) {
      const events = state.step(null, host);
      if (events & EraseEvent.Announced && announced < 0) {
        announced = s;
      }
      if (events & EraseEvent.Changed) {
        changed = s;
      }
    }
    expect(announced).toBeGreaterThan(0);
    expect(changed - announced).toBeGreaterThanOrEqual(
      Math.round((DEFAULT_COMBAT.eraseWarnMs / 1000) * HZ) - 1,
    );
    expect(Array.from(state.masks)).toEqual([2, 1, 3]);
    // La bande ne bouge pas sans poursuite.
    expect(state.masks[2]).toBe(LayerMask.Both);
  });

  it('une apparition sur Céleste attend qu’elle soit partie', () => {
    const state = new EraseState(erase, DEFAULT_COMBAT, HZ);
    let free = false;
    const host = { canApply: (group: number) => group !== 1 || free };
    for (let s = 0; s < HZ * 8; s++) {
      state.step(null, host);
    }
    expect(state.masks[0]).toBe(LayerMask.Memory);
    expect(state.masks[1]).toBe(LayerMask.Memory);
    expect(state.announce(1)).toBe(1);
    free = true;
    state.step(null, host);
    expect(state.masks[1]).toBe(LayerMask.Present);
  });

  it('les bandes : l’effacement qui monte les fait quitter le présent', () => {
    const state = new EraseState(erase, DEFAULT_COMBAT, HZ);
    const host = { canApply: () => true };
    // Loin dessous : rien.
    state.step(40 * T, host);
    expect(state.target[2]).toBe(-1);
    // Assez près : annoncée, puis partie du présent.
    for (let s = 0; s < HZ * 2; s++) {
      state.step((6 + DEFAULT_COMBAT.eraseLeadTiles) * T, host);
    }
    expect(state.masks[2]).toBe(LayerMask.Memory);
    state.reset();
    expect(state.masks[2]).toBe(LayerMask.Both);
  });

  it('l’histoire accélère les vagues, puis les dissout (D-117)', () => {
    const fast = parseAsciiLevel(
      'fast',
      room([
        'erase: a present 3 2 3 1',
        'erase: b memory 7 3 3 1',
        'erase-step: a,b',
        'erase-speed: s.one 1.25',
        'erase-speed: s.two 1.5',
        'erase-until: s.end',
      ]),
    );
    const data = fast.erase;
    if (!data) {
      throw new Error('effacement absent');
    }
    expect(eraseFactor(data, new Set())).toBe(1);
    expect(eraseFactor(data, new Set(['s.one']))).toBe(1.25);
    expect(eraseFactor(data, new Set(['s.one', 's.two']))).toBe(1.5);
    expect(eraseDissolved(data, new Set(['s.two']))).toBe(false);
    expect(eraseDissolved(data, new Set(['s.end']))).toBe(true);
    // Plus vite : la vague suivante arrive plus tôt ; le recul éteint les annonces en cours.
    const until = (factor: number) => {
      const state = new EraseState(data, DEFAULT_COMBAT, HZ);
      state.recoil(factor);
      for (let s = 1; s < HZ * 12; s++) {
        if (state.step(null, { canApply: () => true }) & EraseEvent.Announced) {
          return s;
        }
      }
      return -1;
    };
    expect(until(1.5)).toBeLessThan(until(1));
    expect(() => parseAsciiLevel('bad', room(['erase: a both 3 2 3 1', 'erase-until: x']))).toThrow(
      /@erase-step/,
    );
  });

  it('erreurs explicites', () => {
    const bad = (d: string[]) => () => parseAsciiLevel('bad', room(d));
    expect(bad(['erase: a past 3 2 3 1'])).toThrow(/@erase attend/);
    expect(bad(['erase: a present 3 2 3 1', 'erase: b memory 4 2 3 1'])).toThrow(/chevauchent/);
    expect(bad(['erase: a present 3 2 3 1', 'erase-step: z'])).toThrow(/inconnu/);
    expect(bad(['erase: a both 3 2 3 1', 'erase-step: a'])).toThrow(/une seule couche/);
    expect(bad(['erase: a present 2 6 1 1'])).toThrow(/le départ/);
    expect(bad(['erase: a present 3 2 3 1', 'shift: memory 4 2 1 1'])).toThrow(/@shift/);
  });
});
