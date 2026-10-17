import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../src/config/display';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { StoryFlag as F } from '../src/config/story';
import { EntityType, Tile, tileAt } from '../src/core/level/LevelData';
import { checkCondition, type StoryStep } from '../src/core/story/story';
import { StoryDirector } from '../src/core/story/StoryDirector';
import { isMappedRoom, isStrangeRoom, returnLantern } from '../src/core/world/zone';
import { BIG_CRADLE, BIG_START, FINALE_CRADLE } from '../src/levels/finale/story';
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

const BIG_FLAGS = [...SKY, F.FinaleBig];
/** Les retrouvailles (D-171) : le berceau géant découvert, Maria dans les bras, la vraie chambre. */
const SEEN = [...BIG_FLAGS, F.FinaleCradleSeen];
const FOUND = [...SEEN, F.FinaleFound];
const HOME = [...FOUND, F.FinaleHome];
const TOGETHER = [...HOME, F.FinaleTogether];
/** Après le câlin (D-190) : le matin, Maria à côté d'elle. */
const AWAKE = [...TOGETHER, F.FinaleMorning, F.FinaleAwake];
/** Une partie d'avant D-171 : par la porte de la chambre grande, Maria dans son berceau. */
const OLD_HOME = [...BIG_FLAGS, F.FinaleHome];
/** Debout sur le coffre à jouets, à côté du berceau géant. */
const CRADLE_SIDE = { col: 50, row: 35 };

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

/** Les objets de mise en scène d'une salle (la chambre par défaut), montrés à ce moment. */
function shown(flags: readonly string[], room = 'bedroom'): string[] {
  const set = new Set(flags);
  return HOUSE_STORY.props
    .filter((p) => p.room === room && checkCondition(set, p.when))
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

  it('un monde étrange qui s’efface : hors carte, presque vrai ; plus de couches ; facile', () => {
    expect(isStrangeRoom(big)).toBe(true);
    expect(isMappedRoom(big)).toBe(false);
    expect(big.meta.palette).toBe('nightlight-soft');
    // Le thème des mondes étranges (D-94), en attendant le thème de fin.
    expect(big.meta.music).toBe('strange');
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

  it('on redescend facilement jusqu’au berceau géant ; jamais coincée', () => {
    const start = standOn(big, BIG_START);
    const cradle = standOn(big, CRADLE_SIDE);
    expect(cradle).toBeGreaterThanOrEqual(0);
    expect(reach(start, DIFFICULTY_MIN_WINDOW_MS.easy).has(cradle)).toBe(true);
    for (const s of reach(start, 0)) {
      expect(reach(s, DIFFICULTY_MIN_WINDOW_MS.easy).has(cradle), `surface ${String(s)}`).toBe(
        true,
      );
    }
    // Le berceau, sous le mobile, sur le coffre à jouets : là où il est dans la vraie chambre.
    expect(tileAt(big, BIG_CRADLE.col, BIG_CRADLE.row + 1)).toBe(Tile.Solid);
    expect(Math.floor((BIG_CRADLE.col + 0.5) / 2)).toBe(FINALE_CRADLE.col);
    expect(big.decor.some((d) => d.kind === 'bigcradle')).toBe(false);
  });
});

describe('les retrouvailles (D-171)', () => {
  it('le berceau géant : Céleste regarde dedans, la vue se rapproche ; Maria y dort', () => {
    const look = trigger('finale-big-cradle');
    expect(look.room).toBe(BIG);
    expect(look.on).toBe('interact');
    expect(look.hold).toBeUndefined();
    expect(flagsOf(look.steps)).toEqual([F.FinaleCradleSeen]);
    const area = need(look.area, 'zone');
    expect(CRADLE_SIDE.col).toBeGreaterThanOrEqual(area.col);
    expect(CRADLE_SIDE.col).toBeLessThan(area.col + area.w);
    expect(actions(BIG, BIG_FLAGS)).toEqual(['finale-big-cradle']);
    const at = (pred: (s: StoryStep) => boolean) => look.steps.findIndex(pred);
    // Le jingle de Maria, puis le noir ; Maria se montre dans le noir, la vue se rapproche.
    expect(at((s) => s.do === 'hush')).toBe(0);
    expect(at((s) => s.do === 'flag')).toBeGreaterThan(at((s) => s.do === 'fadeOut'));
    expect(look.steps).toContainEqual(expect.objectContaining({ do: 'look' }));
    const zoom = look.steps.find((s) => s.do === 'look');
    expect(zoom?.do === 'look' ? (zoom.zoom ?? 1) : 1).toBeGreaterThan(1);
    // Troublée, puis elle la reconnaît.
    const question = at((s) => s.do === 'thought' && s.icon === 'question');
    const maria = at((s) => s.do === 'thought' && s.icon === 'maria');
    expect(question).toBeGreaterThan(at((s) => s.do === 'fadeIn'));
    expect(maria).toBeGreaterThan(question);
    // Pas de porte vers la vraie chambre : on ne peut pas passer à côté de Maria.
    expect(HOUSE_STORY.triggers.some((t) => t.id === 'finale-home')).toBe(false);
    expect(MILESTONES.map((m) => ('trigger' in m ? m.trigger : ''))).toEqual(
      expect.arrayContaining(['finale-big', 'finale-big-cradle', 'finale-big-hug']),
    );
  });

  it('une seule Maria, toujours ; jamais avant d’avoir regardé dans le berceau', () => {
    const marias = (flags: readonly string[]) =>
      [...shown(flags), ...shown(flags, BIG)].filter((k) => k.includes('maria'));
    expect(marias(NIGHT)).toEqual([]);
    expect(marias(BIG_FLAGS)).toEqual([]);
    expect(marias(SEEN)).toEqual(['big-cradle-maria']);
    // Dans les bras de Céleste : les deux berceaux vides.
    expect(marias(FOUND)).toEqual([]);
    expect(marias(HOME)).toEqual([]);
    expect(marias(TOGETHER)).toEqual(['maria-sit']);
    for (const flags of [BIG_FLAGS, SEEN, FOUND, HOME, TOGETHER]) {
      expect(shown(flags, BIG).filter((k) => k.startsWith('big-cradle'))).toHaveLength(1);
      expect(shown(flags).filter((k) => k.startsWith('cradle'))).toHaveLength(1);
    }
    // Une partie d'avant D-171 : Maria dort dans le berceau de la vraie chambre.
    expect(marias(OLD_HOME)).toEqual(['cradle-maria']);
    expect(actions('bedroom', OLD_HOME)).toEqual(['finale-found']);
    // Plus de vacillement dans la vraie chambre : Maria est là.
    const near = (flags: readonly string[]) =>
      director(flags).omen(
        'bedroom',
        (FINALE_CRADLE.col + 0.5) * TILE_SIZE,
        FINALE_CRADLE.row * TILE_SIZE,
      );
    expect(near(NIGHT)).toBeGreaterThan(0.8);
    expect(near(HOME)).toBe(0);
    expect(near(OLD_HOME)).toBe(0);
  });

  it('le câlin : Agir maintenu ; dans le noir, dans ses bras ; le cœur ; le cercle ; sa vraie chambre ; le matin', () => {
    const hug = trigger('finale-big-hug');
    expect(hug.room).toBe(BIG);
    expect(hug.hold).toBeGreaterThanOrEqual(1000);
    expect(hug.mark).toBeDefined();
    expect(actions(BIG, SEEN)).toEqual(['finale-big-hug']);
    expect(actions(BIG, FOUND)).toEqual([]);
    // D'une traite jusqu'au matin (D-190).
    expect(flagsOf(hug.steps)).toEqual([
      F.FinaleFound,
      F.FinaleHome,
      F.FinaleMorning,
      F.FinaleTogether,
      F.FinaleAwake,
    ]);
    const at = (pred: (s: StoryStep) => boolean) => hug.steps.findIndex(pred);
    const hold = at((s) => s.do === 'pose' && s.pose === 'hold');
    const heart = at((s) => s.do === 'thought' && s.icon === 'heart');
    const circle = at((s) => s.do === 'fadeOut' && s.shape === 'iris');
    const home = at((s) => s.do === 'room');
    expect(hold).toBeGreaterThan(at((s) => s.do === 'fadeOut'));
    expect(heart).toBeGreaterThan(hold);
    expect(at((s) => s.do === 'haptic')).toBeGreaterThan(hold);
    expect(circle).toBeGreaterThan(heart);
    expect(home).toBeGreaterThan(circle);
    expect(hug.steps[home]).toMatchObject({ room: 'bedroom', returnPoint: true });
    // Un seul cœur : plus de second cœur, ni sur le lit, ni au réveil (D-190).
    expect(hug.steps.filter((s) => s.do === 'thought')).toHaveLength(1);
    // Sur son lit, Maria dans les bras, la nuit, puis le matin ; à côté d'elle dans le noir.
    expect(hug.steps.slice(home)).toContainEqual({ do: 'pose', pose: 'hold-sit' });
    expect(hug.steps.filter((s) => s.do === 'pose').at(-1)).toEqual({ do: 'pose', pose: 'sit' });
    const awake = at((s) => s.do === 'flag' && s.id === F.FinaleAwake);
    expect(hug.steps[awake - 1]?.do).toBe('fadeOut');
    // Puis le tapis : son étincelle, la prochaine chose à faire.
    expect(hug.steps.at(-1)).toMatchObject({ do: 'sparkle', area: trigger('finale-play').area });
    expect(actions('bedroom', AWAKE)).toEqual(['finale-play']);
    // Une partie d'avant D-190 restée sur son lit : la chambre fermée, le lit mène au matin.
    expect(director(TOGETHER).lockIcon('bedroom', 1)).toBe('bed');
    expect(actions('bedroom', TOGETHER)).toEqual(['finale-morning']);
  });

  it('Agir maintenu : le cœur se remplit, se vide lâché ; une simple pression ne suffit pas', () => {
    const hug = trigger('finale-big-hug');
    const story = director(SEEN);
    const box = {
      x: (CRADLE_SIDE.col + 0.5) * TILE_SIZE - 6,
      y: (CRADLE_SIDE.row + 1) * TILE_SIZE - 28,
      width: 12,
      height: 28,
    };
    story.step(BIG, box, true, false);
    expect(story.busy).toBe(false);
    const steps = Math.ceil(((hug.hold ?? 0) / 1000) * 120);
    for (let i = 0; i < steps / 2; i++) {
      story.step(BIG, box, false, true);
    }
    const half = story.holdProgress;
    expect(half).toBeGreaterThan(0.4);
    expect(half).toBeLessThan(0.6);
    story.step(BIG, box, false, false);
    expect(story.holdProgress).toBeLessThan(half);
    expect(story.holdProgress).toBeGreaterThan(0);
    for (let i = 0; i < steps + 2 && !story.busy; i++) {
      story.step(BIG, box, false, true);
    }
    expect(story.busy).toBe(true);
    expect(story.holdProgress).toBe(0);
  });

  it('la musique : le silence devant le berceau, le thème de fin du câlin jusqu’à la fin', () => {
    expect(director(BIG_FLAGS).music()).toBeUndefined();
    expect(director(SEEN).music()).toBeNull();
    expect(director(FOUND).music()).toBe('ending');
    expect(director(TOGETHER).music()).toBe('ending');
    // Le matin aussi (D-190), jusqu'au départ ; après la fin, la maison retrouve sa musique.
    expect(director(AWAKE).music()).toBe('ending');
    expect(director([...AWAKE, F.FinalePlayed, F.FinaleShelved]).music()).toBe('ending');
    expect(
      director([...AWAKE, F.FinalePlayed, F.FinaleShelved, F.FinaleGone]).music(),
    ).toBeUndefined();
  });
});
