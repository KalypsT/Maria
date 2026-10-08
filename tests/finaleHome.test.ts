import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../src/config/display';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { StoryFlag as F } from '../src/config/story';
import { EntityType, Tile, tileAt } from '../src/core/level/LevelData';
import { checkCondition, type StoryStep } from '../src/core/story/story';
import { StoryDirector } from '../src/core/story/StoryDirector';
import { isMappedRoom, isStrangeRoom, returnLantern } from '../src/core/world/zone';
import { BIG_START, FINALE_CRADLE, HOME_START } from '../src/levels/finale/story';
import { HOUSE_STORY } from '../src/levels/house/story';
import { MILESTONES } from '../src/levels/milestones';
import { NIGHT, SKY } from './finaleFlags';
import { seaAnalysis, standOn } from './tideGraph';
import { level } from './zoneGraph';

/**
 * Le dernier niveau, PR 5 (D-143) : la chambre grande (la vraie chambre deux fois plus grande),
 * la vraie chambre la nuit, Maria retrouvée. Céleste en phase 3 avec toutes ses capacités (comme
 * les autres salles du monde de Maria).
 */
const BIG = 'finale-big';
const big = level(BIG);
const bedroom = level('bedroom');
/** La veilleuse de l'étagère haute (l'arrivée) et celle du tapis. */
const SHELF_LAMP = { col: 82, row: 15 };
const RUG_LAMP = { col: 41, row: 39 };
/** Devant la porte de la chambre grande. */
const DOOR = { col: 85, row: 39 };

const BIG_FLAGS = [...SKY, F.FinaleBig];
const HOME = [...BIG_FLAGS, F.FinaleHome];
const FOUND = [...HOME, F.FinaleFound];
const TOGETHER = [...FOUND, F.FinaleTogether];

function need<V>(value: V | null | undefined, what: string): V {
  if (value === null || value === undefined) {
    throw new Error(`${what} absent`);
  }
  return value;
}
const trigger = (id: string) =>
  need(
    HOUSE_STORY.triggers.find((t) => t.id === id),
    id,
  );
const flagsOf = (steps: readonly StoryStep[]) =>
  steps.flatMap((s) => (s.do === 'flag' ? [s.id] : []));

function director(flags: readonly string[]): StoryDirector {
  const story = new StoryDirector(HOUSE_STORY, { play: () => undefined } as never);
  story.setFlags(flags);
  return story;
}

/** Les objets de mise en scène de la chambre, montrés à ce moment. */
function shown(flags: readonly string[]): string[] {
  const set = new Set(flags);
  return HOUSE_STORY.props
    .filter((p) => p.room === 'bedroom' && checkCondition(set, p.when))
    .map((p) => p.kind);
}

/** Les déclencheurs Agir d'une salle qui font avancer l'histoire (pas les objets à regarder). */
function actions(room: string, flags: readonly string[]): string[] {
  const set = new Set(flags);
  return HOUSE_STORY.triggers
    .filter(
      (t) => t.room === room && t.on === 'interact' && !t.repeat && checkCondition(set, t.when),
    )
    .map((t) => t.id);
}

/** Surfaces atteintes dans la chambre grande, aux fenêtres `minWindow` ou plus. */
function reach(from: number, minWindow: number): Set<number> {
  const a = seaAnalysis(big);
  const seen = new Set([from]);
  const queue = [from];
  for (let s = queue.shift(); s !== undefined; s = queue.shift()) {
    for (const m of a.moves) {
      if (m.from === s && m.windowMs >= minWindow && !seen.has(m.to)) {
        seen.add(m.to);
        queue.push(m.to);
      }
    }
  }
  return seen;
}

describe('la chambre grande (D-143)', () => {
  it('la vraie chambre, deux fois plus grande : chaque tuile devient un carré de quatre', () => {
    expect(big.width).toBe(2 * bedroom.width);
    expect(big.height).toBe(2 * bedroom.height);
    const exits = new Set(
      bedroom.exits.flatMap((e) =>
        Array.from(
          { length: e.rowMax - e.rowMin + 1 },
          (_, i) => `${String(e.col)},${String(e.rowMin + i)}`,
        ),
      ),
    );
    for (let row = 0; row < bedroom.height; row++) {
      for (let col = 0; col < bedroom.width; col++) {
        if (exits.has(`${String(col)},${String(row)}`)) {
          continue;
        }
        const tile = tileAt(bedroom, col, row);
        const material = bedroom.materials[row * bedroom.width + col];
        for (const [dc, dr] of [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ] as const) {
          const c = 2 * col + dc;
          const r = 2 * row + dr;
          // Une étagère traversable reste fine : la moitié du bas est vide.
          const expected = tile === Tile.OneWay && dr === 1 ? Tile.Empty : tile;
          expect(tileAt(big, c, r), `${String(c)},${String(r)}`).toBe(expected);
          if (expected !== Tile.Empty) {
            expect(big.materials[r * big.width + c], `${String(c)},${String(r)}`).toBe(material);
          }
        }
      }
    }
  });

  it('un monde étrange qui s’efface : hors carte, presque vrai, la musique de la maison ; plus de couches ; facile', () => {
    expect(isStrangeRoom(big)).toBe(true);
    expect(isMappedRoom(big)).toBe(false);
    expect(big.meta.palette).toBe('nightlight-soft');
    expect(big.meta.music).toBe('house');
    expect(big.meta.difficulty).toBe('easy');
    expect(big.layers).toBeNull();
    expect(big.erase).toBeNull();
    expect(big.exits).toHaveLength(0);
    expect(big.entities.every((e) => e.type === EntityType.Checkpoint)).toBe(true);
    expect(big.entities.map((e) => ({ col: e.col, row: e.row }))).toEqual(
      expect.arrayContaining([SHELF_LAMP, RUG_LAMP]),
    );
    expect(big.entities).toHaveLength(2);
    const dangers = [Tile.Hazard, Tile.Thorns, Tile.Water] as number[];
    expect(Array.from(big.tiles).some((t) => dangers.includes(t))).toBe(false);
  });

  it('on y arrive par la petite porte du grenier du ciel de la chambre, sur l’étagère haute', () => {
    const door = trigger('finale-big');
    expect(door.room).toBe('finale-sky');
    expect(door.on).toBe('interact');
    expect(flagsOf(door.steps)).toEqual([F.FinaleBig]);
    expect(door.steps).toContainEqual(
      expect.objectContaining({ do: 'room', room: BIG, ...BIG_START, returnPoint: true }),
    );
    expect(checkCondition(new Set(SKY), door.when)).toBe(true);
    expect(checkCondition(new Set(BIG_FLAGS), door.when)).toBe(false);
    expect(checkCondition(new Set(BIG_FLAGS), trigger('finale-big-again').when)).toBe(true);
    const lamp = need(returnLantern(big, BIG_START.col, BIG_START.row), 'veilleuse');
    expect({ col: lamp.col, row: lamp.row }).toEqual(SHELF_LAMP);
  });

  it('on redescend facilement jusqu’à la porte ; jamais coincée', () => {
    const start = standOn(big, BIG_START);
    const door = standOn(big, DOOR);
    expect(door).toBeGreaterThanOrEqual(0);
    expect(reach(start, DIFFICULTY_MIN_WINDOW_MS.easy).has(door)).toBe(true);
    for (const s of reach(start, 0)) {
      expect(reach(s, DIFFICULTY_MIN_WINDOW_MS.easy).has(door), `surface ${String(s)}`).toBe(true);
    }
    // Le berceau, sous le mobile, sur le coffre à jouets : là où il est dans la vraie chambre.
    const cradle = need(
      big.decor.find((d) => d.kind === 'bigcradle'),
      'berceau',
    );
    expect(tileAt(big, cradle.col, cradle.row + cradle.height)).toBe(Tile.Solid);
    expect(Math.floor((cradle.col + cradle.width / 2) / 2)).toBe(FINALE_CRADLE.col);
  });
});

describe('la vraie chambre, la nuit : Maria retrouvée (D-143)', () => {
  it('par la porte de la chambre grande, la vraie chambre : Céleste entre par sa porte', () => {
    const home = trigger('finale-home');
    expect(home.room).toBe(BIG);
    expect(flagsOf(home.steps)).toEqual([F.FinaleHome]);
    expect(home.steps).toContainEqual(
      expect.objectContaining({ do: 'room', room: 'bedroom', ...HOME_START, returnPoint: true }),
    );
    const area = need(home.area, 'zone');
    expect(DOOR.col).toBeGreaterThanOrEqual(area.col);
    expect(DOOR.col).toBeLessThan(area.col + area.w);
    expect(checkCondition(new Set(HOME), trigger('finale-home-again').when)).toBe(true);
    expect(MILESTONES.map((m) => ('trigger' in m ? m.trigger : ''))).toEqual(
      expect.arrayContaining(['finale-big', 'finale-home', 'finale-found']),
    );
  });

  it('Maria dort dans son berceau ; une seule Maria, toujours, et jamais avant le retour', () => {
    const marias = (flags: readonly string[]) => shown(flags).filter((k) => k.includes('maria'));
    expect(marias(NIGHT)).toEqual([]);
    expect(marias(BIG_FLAGS)).toEqual([]);
    expect(marias(HOME)).toEqual(['cradle-maria']);
    // Dans les bras de Céleste (le temps du câlin) : le berceau vide, aucune autre Maria.
    expect(marias(FOUND)).toEqual([]);
    expect(marias(TOGETHER)).toEqual(['maria-sit']);
    for (const flags of [NIGHT, HOME, FOUND, TOGETHER]) {
      expect(shown(flags).filter((k) => k.startsWith('cradle'))).toHaveLength(1);
    }
    // Plus de vacillement : Maria est là.
    const near = (flags: readonly string[]) =>
      director(flags).omen(
        'bedroom',
        (FINALE_CRADLE.col + 0.5) * TILE_SIZE,
        FINALE_CRADLE.row * TILE_SIZE,
      );
    expect(near(NIGHT)).toBeGreaterThan(0.8);
    expect(near(HOME)).toBe(0);
  });

  it('Agir sur le berceau : dans le noir, dans ses bras ; le cœur ; le cercle se referme', () => {
    expect(actions('bedroom', HOME)).toEqual(['finale-found']);
    const found = trigger('finale-found');
    expect(flagsOf(found.steps)).toEqual([F.FinaleFound, F.FinaleTogether]);
    const at = (pred: (s: StoryStep) => boolean) => found.steps.findIndex(pred);
    const hold = at((s) => s.do === 'pose' && s.pose === 'hold');
    const heart = at((s) => s.do === 'thought' && s.icon === 'heart');
    const circle = at((s) => s.do === 'fadeOut' && s.shape === 'iris');
    expect(hold).toBeGreaterThan(at((s) => s.do === 'fadeOut'));
    expect(heart).toBeGreaterThan(hold);
    expect(circle).toBeGreaterThan(heart);
    // Après le cercle : sur son lit, assise, Maria à côté d'elle.
    expect(found.steps.slice(circle)).toContainEqual({ do: 'pose', pose: 'sit' });
    // La chambre reste fermée : la nuit, puis Céleste pense à dormir. Le matin viendra (PR 6).
    expect(director(HOME).lockIcon('bedroom', 1)).toBe('cradle');
    expect(director(TOGETHER).lockIcon('bedroom', 1)).toBe('bed');
    expect(actions('bedroom', TOGETHER)).toEqual([]);
    const later = trigger('finale-morning-later');
    expect(later.repeat).toBe(true);
    expect(checkCondition(new Set(TOGETHER), later.when)).toBe(true);
  });
});
