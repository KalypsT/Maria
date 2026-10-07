import { describe, expect, it } from 'vitest';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { EntityType } from '../src/core/level/LevelData';
import { isStrangeRoom, mapPage } from '../src/core/world/zone';
import {
  analysis,
  byDifficulty,
  level,
  exitSurface,
  node,
  reachable,
  roomDifficulty,
  surfaceAt,
  where,
  zone,
  roomOf,
  zoneGraph,
  type Node,
} from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

const TIMEOUT = ANALYSIS_TIMEOUT_MS;
/** La maison est la première zone : chaque passage nécessaire de la maison réelle reste facile (D-16). */
const MIN_WINDOW_MS = DIFFICULTY_MIN_WINDOW_MS.easy;
const easy = byDifficulty('easy');

const home = () => node(zone.start, analysis(zone.start, false).start);

/** Surface où est posé le premier objet d'un type (capacité D-26, trouvaille D-27). */
function entityNode(type: EntityType, only?: string): Node {
  for (const [room, data] of zone.rooms) {
    const skip = isStrangeRoom(data) || (only !== undefined && room !== only);
    const entity = skip ? undefined : data.entities.find((e) => e.type === type);
    if (entity) {
      return node(room, surfaceAt(room, entity.col, entity.row));
    }
  }
  throw new Error(`aucun objet ${type} dans la maison`);
}
const pickup = () => entityNode(EntityType.Ability);

/** Endroits prévus pour l'escalade (D-26) : où l'on se tient une fois hissée. */
const CLIMB_SPOTS: readonly [string, string, number, number][] = [
  ['dessus de l’armoire', 'bedroom', 3, 8],
  ['trappe à linge', 'hall', 61, 7],
  ['dessus de la bibliothèque', 'living', 50, 8],
  ['dessus des placards hauts', 'kitchen', 45, 8],
  ['grenier', 'attic', 53, 19],
  // La cage de l'escalier (D-132) : placard au-dessus de la porte, étagère, palier du grenier.
  ['placard de la cage', 'staircase', 2, 13],
  ['palier du grenier', 'staircase', 2, 5],
  // La porte du grenier dans la chambre (D-132) : on en redescend, on n'y monte qu'en grimpant.
  ['étagère sous la porte du grenier', 'bedroom', 42, 7],
];

describe.each([false, true])('maison (D-25), escalade %s', (climb) => {
  it(
    'toutes les salles sont atteignables depuis le lit (grenier et monde étrange en grimpant)',
    { timeout: TIMEOUT },
    () => {
      // Le jardin (D-46) reste fermé tant que Céleste n'a pas grandi : voir garden.test.ts ; le
      // quartier (D-60, D-61), derrière le portillon du jardin : voir street.test.ts ; l'école et
      // son monde étrange (D-64) : voir school.test.ts ; la gare (D-66, D-68) : voir station.test.ts
      // et stationStrange.test.ts ; le train et la gare de la mer (D-85 à D-90) : voir train*.test.ts ;
      // le dernier niveau (D-141) : voir finaleBed.test.ts.
      const seen = reachable(zoneGraph(climb, roomDifficulty), home());
      const rooms = new Set([...seen].map((n) => n.split('#')[0]));
      const missing = [...zone.rooms.keys()].filter(
        (room) =>
          !rooms.has(room) &&
          !room.startsWith('garden-') &&
          !room.startsWith('school') &&
          mapPage(zone, room) !== 'street' &&
          mapPage(zone, room) !== 'station' &&
          !room.startsWith('station-') &&
          !room.startsWith('train-') &&
          !room.startsWith('sea-') &&
          !room.startsWith('nanny-') &&
          !room.startsWith('finale-'),
      );
      expect(missing).toEqual(climb ? [] : ['attic', 'living-strange', 'shadows']);
      expect([...seen].filter((n) => roomOf(n).startsWith('garden-'))).toEqual([]);
    },
  );

  it(
    'ne coince jamais Céleste : la chambre reste atteignable facilement',
    { timeout: TIMEOUT },
    () => {
      // Tout ce qu'on peut atteindre, même par un saut raté ou risqué, doit ramener à la chambre
      // par des passages de la difficulté de chaque salle (faciles dans la maison réelle, moyens au
      // plus dans le monde étrange, dont la fin ramène à la chambre).
      const safe = zoneGraph(climb, roomDifficulty);
      const stuck = [...reachable(zoneGraph(climb, null), home())].filter(
        (n) => !reachable(safe, n).has(home()),
      );
      expect(where(stuck, climb), 'surfaces sans retour possible').toEqual([]);
    },
  );
});

describe('grimper aux rebords dans la maison (D-26)', () => {
  it('l’objet de capacité est atteignable sans grimper', { timeout: TIMEOUT }, () => {
    expect(reachable(zoneGraph(false, easy), home()).has(pickup())).toBe(true);
  });

  it('sans grimper, les endroits prévus restent hors d’atteinte', { timeout: TIMEOUT }, () => {
    const seen = reachable(zoneGraph(false, null), home());
    const open = CLIMB_SPOTS.filter(([, room, col, row]) =>
      seen.has(node(room, surfaceAt(room, col, row))),
    );
    expect(open.map(([name]) => name)).toEqual([]);
  });

  it('en grimpant, ils sont atteignables facilement', { timeout: TIMEOUT }, () => {
    const seen = reachable(zoneGraph(true, easy), pickup());
    for (const [name, room, col, row] of CLIMB_SPOTS) {
      expect(surfaceAt(room, col, row), name).toBeGreaterThanOrEqual(0);
      expect(seen.has(node(room, surfaceAt(room, col, row))), name).toBe(true);
    }
  });

  it('la trappe à linge ferme la boucle : de la buanderie au couloir', { timeout: TIMEOUT }, () => {
    const seen = reachable(zoneGraph(true, easy), pickup());
    expect(seen.has(node('hall', exitSurface('hall', 3)))).toBe(true);
    // Dans la buanderie même : du sol (porte de la cuisine) jusqu'à la trappe, en grimpant.
    const laundry = new Map<Node, Set<Node>>();
    for (const move of analysis('laundry', true).moves) {
      if (move.windowMs >= MIN_WINDOW_MS) {
        const from = node('laundry', move.from);
        laundry.set(from, (laundry.get(from) ?? new Set()).add(node('laundry', move.to)));
      }
    }
    const up = reachable(laundry, node('laundry', exitSurface('laundry', 2)));
    expect(up.has(node('laundry', exitSurface('laundry', 1)))).toBe(true);
  });

  it('le premier secret est un passage de difficulté moyenne (D-27)', { timeout: TIMEOUT }, () => {
    const secret = entityNode(EntityType.Secret, 'attic');
    expect(reachable(zoneGraph(false, null), home()).has(secret), 'sans grimper').toBe(false);
    expect(reachable(zoneGraph(true, easy), home()).has(secret), 'trop facile').toBe(false);
    const medium = zoneGraph(true, byDifficulty('medium'));
    expect(reachable(medium, home()).has(secret), 'trop difficile').toBe(true);
  });

  it(
    'le grenier ramène à la chambre par derrière l’armoire (raccourci)',
    { timeout: TIMEOUT },
    () => {
      const attic = node('attic', exitSurface('attic', 1));
      // Seulement le grenier et la chambre : sortie derrière l'armoire, puis on descend.
      const inside = (n: Node) => /^(attic|bedroom)#/.test(n);
      const graph = new Map<Node, Set<Node>>();
      for (const [from, next] of zoneGraph(true, easy)) {
        if (inside(from)) {
          graph.set(from, new Set([...next].filter(inside)));
        }
      }
      expect(reachable(graph, attic).has(home())).toBe(true);
    },
  );
});

describe('la maison tient debout (D-132)', () => {
  it(
    'l’escalier descend jusqu’au sol : de l’étage au salon et retour, facilement, sans grimper',
    { timeout: TIMEOUT },
    () => {
      const inside = new Map<Node, Set<Node>>();
      for (const move of analysis('staircase', false).moves) {
        if (move.windowMs >= MIN_WINDOW_MS) {
          const from = node('staircase', move.from);
          inside.set(from, (inside.get(from) ?? new Set()).add(node('staircase', move.to)));
        }
      }
      const top = node('staircase', exitSurface('staircase', 1));
      const bottom = node('staircase', exitSurface('staircase', 2));
      expect(reachable(inside, top).has(bottom), 'descente').toBe(true);
      expect(reachable(inside, bottom).has(top), 'montée').toBe(true);
    },
  );

  it('les portes d’un même étage s’ouvrent au ras du sol des deux côtés', () => {
    // Pas de porte au-dessus d'un plan de travail (l'ancienne porte de la buanderie) : seules la
    // trappe à linge et le grenier, qui changent d'étage, s'ouvrent en hauteur.
    // Les deux rangées du bas sont le sol : le bas de la porte est juste au-dessus.
    for (const [room, exit] of [
      ['bedroom', 1],
      ['hall', 1],
      ['hall', 2],
      ['living', 1],
      ['living', 2],
      ['kitchen', 1],
      ['kitchen', 2],
      ['laundry', 2],
      ['staircase', 2],
    ] as const) {
      const data = level(room);
      const e = data.exits.find((x) => x.id === exit);
      expect(e?.rowMax, `${room}:${String(exit)}`).toBe(data.height - 3);
    }
  });
});

describe('rez-de-chaussée retravaillé (D-39)', () => {
  const medium = byDifficulty('medium');

  it(
    'route haute du salon : en grimpant (facile), jusqu’en haut de la bibliothèque',
    { timeout: TIMEOUT },
    () => {
      const cabinet = node('living', surfaceAt('living', 4, 13));
      const rod = node('living', surfaceAt('living', 28, 4));
      const top = node('living', surfaceAt('living', 50, 8));
      expect(reachable(zoneGraph(false, null), home()).has(cabinet), 'sans grimper').toBe(false);
      const seen = reachable(zoneGraph(true, easy), home());
      expect(seen.has(cabinet), 'meuble mural').toBe(true);
      expect(
        reachable(zoneGraph(true, easy), rod).has(top),
        'de la tringle à la bibliothèque',
      ).toBe(true);
    },
  );

  it.each([
    ['salon', 'living'],
    ['cuisine', 'kitchen'],
  ])('trouvaille du %s : en grimpant, au plus moyenne', { timeout: TIMEOUT }, (_name, room) => {
    const secret = entityNode(EntityType.Secret, room);
    expect(reachable(zoneGraph(false, null), home()).has(secret), 'sans grimper').toBe(false);
    expect(reachable(zoneGraph(true, medium), home()).has(secret), 'trop difficile').toBe(true);
  });
});

describe('Céleste a grandi (D-43)', () => {
  const medium = byDifficulty('medium');

  it(
    'la maison reste aussi praticable : rien d’atteignable en phase 1 ne se ferme en phase 2',
    { timeout: TIMEOUT },
    () => {
      const before = reachable(zoneGraph(true, roomDifficulty, 1), home());
      const after = reachable(zoneGraph(true, roomDifficulty, 2), home());
      const real = (n: Node) => {
        const room = n.split('#')[0] ?? '';
        const data = zone.rooms.get(room);
        return data !== undefined && !isStrangeRoom(data);
      };
      const closed = [...before].filter((n) => real(n) && !after.has(n));
      expect(where(closed, true)).toEqual([]);
    },
  );

  it(
    'la trouvaille du couloir attend qu’elle grandisse : hors d’atteinte avant, moyenne après',
    { timeout: TIMEOUT },
    () => {
      const secret = entityNode(EntityType.Secret, 'hall');
      const hard = byDifficulty('hard');
      expect(reachable(zoneGraph(true, null, 1), home()).has(secret), 'phase 1').toBe(false);
      expect(reachable(zoneGraph(true, hard, 2), home()).has(secret), 'phase 2').toBe(true);
      expect(reachable(zoneGraph(true, medium, 2), home()).has(secret), 'trop difficile').toBe(
        true,
      );
    },
  );
});

describe('saut mural dans la maison (D-44, D-46)', () => {
  it(
    'n’ouvre que le dessus de l’armoire à linge de la buanderie, facilement',
    { timeout: TIMEOUT },
    () => {
      const house = (n: Node) => {
        const data = zone.rooms.get(roomOf(n));
        return data !== undefined && !isStrangeRoom(data) && !roomOf(n).startsWith('garden-');
      };
      const cabinet = node('laundry', surfaceAt('laundry', 40, 4));
      for (const difficulty of ['easy', 'medium'] as const) {
        const rule = byDifficulty(difficulty);
        const before = reachable(zoneGraph(true, rule, 2), home());
        const after = reachable(zoneGraph(true, rule, 2, true), home());
        const opened = [...after].filter((n) => house(n) && !before.has(n));
        const closed = [...before].filter((n) => house(n) && !after.has(n));
        expect(opened, `${difficulty} : ouverts`).toEqual([cabinet]);
        expect(where(closed, true), `${difficulty} : fermés`).toEqual([]);
      }
    },
  );
});
