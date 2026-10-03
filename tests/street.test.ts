import { describe, expect, it } from 'vitest';
import { phaseMovement } from '../src/config/growth';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { StoryFlag } from '../src/config/story';
import { TILE_SIZE as T } from '../src/config/display';
import { EntityType } from '../src/core/level/LevelData';
import { isStreetRoom, mapPage } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { StoryDirector } from '../src/core/story/StoryDirector';
import {
  analysis,
  byDifficulty,
  exitSurface,
  level,
  node,
  nodeAt,
  phase,
  reachable,
  roomDifficulty,
  roomOf,
  surfaceAt,
  where,
  zone,
  zoneGraph,
  type Node,
} from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const TIMEOUT = ANALYSIS_TIMEOUT_MS;
const F = StoryFlag;
const easy = byDifficulty('easy');
const medium = byDifficulty('medium');
const OPEN = [F.GateOpen];
/** Colonne de la trouvaille sur l'antenne de la supérette (revisite avec le parapluie, D-63). */
/** Le nid du platane, au bout du fil tendu depuis l'école (D-66). */
/** La trouvaille de la cachette sous la palissade (D-91). */
const HOARDING_COL = 195;
const NEST_COL = 20;
const ANTENNA_COL = 133;
/** Arrivée dans la rue par le portillon. */
const arrival = () => node('street', exitSurface('street', 1));
const home = () => node(zone.start, analysis(zone.start, false).start);
const trigger = (id: string) => {
  const t = HOUSE_STORY.triggers.find((candidate) => candidate.id === id);
  if (!t) {
    throw new Error(`déclencheur ${id} absent`);
  }
  return t;
};

describe('la rue (D-60)', () => {
  it('une seule salle en long, dehors, sur sa propre page du cahier', () => {
    const street = level('street');
    expect(isStreetRoom(street)).toBe(true);
    expect(street.width).toBeGreaterThanOrEqual(180);
    expect(mapPage(zone, 'street')).toBe('street');
    expect(mapPage(zone, 'garden-alley')).toBe('house');
    expect(zone.destination('garden-alley', 3)).toEqual({ room: 'street', exit: 1 });
    expect(street.entities.filter((e) => e.type === EntityType.Checkpoint)).toHaveLength(2);
  });

  it(
    'le portillon ferme la rue tant que la chevillette n’est pas tirée',
    { timeout: TIMEOUT },
    () => {
      const closed = reachable(zoneGraph(true, null, 2, true), home());
      expect([...closed].filter((n) => roomOf(n) === 'street')).toEqual([]);
      const open = reachable(zoneGraph(true, medium, 2, true, OPEN), home());
      expect(open.has(arrival())).toBe(true);
      const lock = HOUSE_STORY.lockedRooms.find((l) => l.room === 'garden-alley');
      expect(lock?.exit).toBe(3);
      expect(lock?.when.none).toContain(F.GateOpen);
    },
  );

  it('la chevillette : après le bonnet, trop haute pour être atteinte depuis le sol', () => {
    const cord = trigger('gate-cord');
    expect(cord.when.all).toContain(F.HedgeDone);
    const area = cord.area;
    if (!area) {
      throw new Error('chevillette sans zone');
    }
    // Du fond de la cheminée (le sol du passage), même en sautant le plus haut possible, la tête
    // de Céleste n'atteint pas la zone : il faut le saut mural.
    const grown = phase(2);
    const jump = phaseMovement(DEFAULT_MOVEMENT, grown).jumpHeightTiles * T;
    const floorY = 24 * T;
    const headTop = floorY - grown.hitbox.height - jump;
    expect(headTop).toBeGreaterThan((area.row + area.h) * T);
    expect(surfaceAt('garden-alley', 32, 23)).toBeGreaterThanOrEqual(0);
  });

  it('tirer la chevillette ouvre le portillon ; rien à tirer avant le bonnet', () => {
    const noop = () => undefined;
    const director = (flags: readonly string[]) => {
      const d = new StoryDirector(
        HOUSE_STORY,
        {
          flagSet: noop,
          place: noop,
          room: noop,
          pose: noop,
          think: noop,
          sparkle: noop,
          shake: noop,
          memory: noop,
          hush: noop,
          ability: noop,
          play: noop,
        },
        100,
      );
      d.setFlags(flags);
      return d;
    };
    // Céleste en l'air dans la cheminée, à hauteur de la chevillette (saut mural).
    const inPit = { x: 32 * T, y: 15.5 * T, width: 12, height: 26 };
    const pull = (d: StoryDirector) => {
      d.step('garden-alley', inPit, true);
      for (let i = 0; i < 2000 && d.busy; i++) {
        d.step('garden-alley', inPit, false);
      }
    };
    const before = director([F.Grown]);
    expect(before.exitsLocked('garden-alley', 3)).toBe(true);
    expect(before.lockIcon('garden-alley', 3)).toBe('gate');
    pull(before);
    expect(before.flags.has(F.GateOpen), 'avant le bonnet').toBe(false);
    const after = director([F.Grown, F.HedgeDone]);
    pull(after);
    expect(after.flags.has(F.GateOpen)).toBe(true);
    expect(after.exitsLocked('garden-alley', 3)).toBe(false);
  });

  it('papa montre la ficelle puis le portillon après le bonnet ; ouvert, il reste ouvert', () => {
    const dad = trigger('garden-dad-gate');
    expect(dad.when.all).toContain(F.HedgeDone);
    const icons = dad.steps.flatMap((s) => (s.do === 'thought' ? [s.icon] : []));
    expect(icons.indexOf('cord')).toBeGreaterThanOrEqual(0);
    expect(icons.indexOf('cord')).toBeLessThan(icons.indexOf('gate'));
    const gate = HOUSE_STORY.props.find((p) => p.id === 'gate');
    const open = HOUSE_STORY.props.find((p) => p.id === 'gate-open');
    expect(gate?.when.none).toContain(F.GateOpen);
    expect(open?.when.all).toContain(F.GateOpen);
  });

  it(
    'le trottoir se parcourt facilement jusqu’au bout, et à ses portes (aire de jeux, supérette, école, palissade)',
    { timeout: TIMEOUT },
    () => {
      const seen = reachable(zoneGraph(true, easy, 2, true, OPEN), arrival());
      // Le trottoir s'arrête à la palissade (D-91) : derrière, la cachette où l'on glisse.
      expect(seen.has(nodeAt('street', 185, 27)), 'bout de la rue').toBe(true);
      const door = level('street').doors.find((d) => d.id === 2);
      expect(door && seen.has(nodeAt('street', door.col, door.row)), 'aire de jeux').toBe(true);
      for (const [id, name] of [
        [4, 'supérette'],
        [5, 'école'],
        [6, 'palissade du chantier (la gare, D-66)'],
      ] as const) {
        const d = level('street').doors.find((candidate) => candidate.id === id);
        expect(d && seen.has(nodeAt('street', d.col, d.row)), name).toBe(true);
      }
    },
  );

  it(
    'les trouvailles, sur les toits et l’échafaudage : jamais faciles, au plus moyennes',
    { timeout: TIMEOUT },
    () => {
      // L'antenne de la supérette (D-63) ne s'atteint qu'avec le parapluie : voir site.test.ts ;
      // le nid du platane (D-66), qu'avec le crochet : voir station.test.ts ; la cachette sous la
      // palissade (D-91), qu'en glissant : voir slideRevisits.test.ts.
      const secrets = level('street').entities.filter(
        (e) =>
          e.type === EntityType.Secret &&
          e.col !== ANTENNA_COL &&
          e.col !== NEST_COL &&
          e.col !== HOARDING_COL,
      );
      expect(secrets).toHaveLength(2);
      const byEasy = reachable(zoneGraph(true, easy, 2, true, OPEN), arrival());
      const byMedium = reachable(zoneGraph(true, medium, 2, true, OPEN), arrival());
      for (const s of secrets) {
        const at = nodeAt('street', s.col, s.row);
        expect(byEasy.has(at), `trop facile (${String(s.col)})`).toBe(false);
        expect(byMedium.has(at), `trop difficile (${String(s.col)})`).toBe(true);
      }
    },
  );

  it('ne coince jamais Céleste : la maison reste atteignable', { timeout: TIMEOUT }, () => {
    const safe = zoneGraph(true, roomDifficulty, 2, true, OPEN);
    const all = reachable(zoneGraph(true, null, 2, true, OPEN), arrival());
    const stuck = [...all].filter((n: Node) => !reachable(safe, n).has(home()));
    expect(where(stuck, true), 'surfaces sans retour possible').toEqual([]);
  });
});
