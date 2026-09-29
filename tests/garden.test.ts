import { describe, expect, it } from 'vitest';
import { EntityType } from '../src/core/level/LevelData';
import { isGardenRoom } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import {
  analysis,
  byDifficulty,
  exitSurface,
  level,
  node,
  reachable,
  roomDifficulty,
  roomOf,
  surfaceAt,
  where,
  zone,
  zoneGraph,
  type Node,
} from './zoneGraph';

const TIMEOUT = 180_000;
const home = () => node(zone.start, analysis(zone.start, false).start);
const easy = byDifficulty('easy');
const medium = byDifficulty('medium');
const hard = byDifficulty('hard');

/** Surface d'un objet (premier de son type) dans une salle. */
function entityNode(room: string, type: EntityType): Node {
  const entity = level(room).entities.find((e) => e.type === type);
  if (!entity) {
    throw new Error(`aucun ${type} dans ${room}`);
  }
  return node(room, surfaceAt(room, entity.col, entity.row));
}
const wallJumpItem = () => entityNode('garden-treehouse', EntityType.Ability);
const gardenRooms = () =>
  [...zone.rooms].filter(([, data]) => isGardenRoom(data)).map(([id]) => id);

describe('le jardin (D-46)', () => {
  it('ses salles sont dehors, sur la carte ; la cabane est dedans', () => {
    expect(gardenRooms()).toEqual([
      'garden-terrace',
      'garden-vegetables',
      'garden-tree',
      'garden-alley',
    ]);
    for (const id of [...gardenRooms(), 'garden-treehouse']) {
      expect(zone.map[id], id).toBeDefined();
    }
    expect(level('garden-treehouse').meta.ability).toBe('wall-jump');
  });

  it(
    'la porte de derrière reste fermée tant que Céleste n’a pas grandi',
    { timeout: TIMEOUT },
    () => {
      const before = reachable(zoneGraph(true, null, 1), home());
      expect([...before].filter((n) => roomOf(n).startsWith('garden-'))).toEqual([]);
      const lock = HOUSE_STORY.lockedRooms.find((l) => l.room === 'laundry');
      expect(lock?.exit).toBe(3);
      expect(lock?.icon).toBe('handle');
      const after = reachable(zoneGraph(true, easy, 2), home());
      expect(after.has(node('garden-terrace', exitSurface('garden-terrace', 1)))).toBe(true);
    },
  );

  it(
    'chemin jusqu’au saut mural : en grimpant, moyen exactement (plus dur que la maison)',
    { timeout: TIMEOUT },
    () => {
      expect(reachable(zoneGraph(true, roomDifficulty, 2), home()).has(wallJumpItem())).toBe(true);
      expect(reachable(zoneGraph(true, easy, 2), home()).has(wallJumpItem()), 'trop facile').toBe(
        false,
      );
    },
  );

  it(
    'le vieux mur et l’allée ne s’atteignent qu’avec le saut mural, puis moyennement',
    { timeout: TIMEOUT },
    () => {
      const wallTop = node('garden-tree', exitSurface('garden-tree', 3));
      const alley = node('garden-alley', exitSurface('garden-alley', 1));
      const without = reachable(zoneGraph(true, null, 2), home());
      expect(without.has(wallTop), 'vieux mur sans saut mural').toBe(false);
      expect(without.has(alley), 'allée sans saut mural').toBe(false);
      const withJump = reachable(zoneGraph(true, medium, 2, true), wallJumpItem());
      expect(withJump.has(wallTop)).toBe(true);
      expect(withJump.has(alley)).toBe(true);
    },
  );

  it(
    'l’allée boucle le jardin : du haut du vieux mur à la terrasse, puis à la maison',
    { timeout: TIMEOUT },
    () => {
      const wallTop = node('garden-tree', exitSurface('garden-tree', 3));
      const graph = zoneGraph(true, medium, 2, true);
      const seen = reachable(graph, wallTop);
      expect(seen.has(node('garden-terrace', exitSurface('garden-terrace', 3)))).toBe(true);
      expect(seen.has(home())).toBe(true);
    },
  );

  it.each([false, true])(
    'ne coince jamais Céleste (saut mural %s) : la chambre reste atteignable',
    { timeout: TIMEOUT },
    (wallJump) => {
      const safe = zoneGraph(true, roomDifficulty, 2, wallJump);
      const stuck = [...reachable(zoneGraph(true, null, 2, wallJump), home())].filter(
        (n) => !reachable(safe, n).has(home()),
      );
      expect(where(stuck, true), 'surfaces sans retour possible').toEqual([]);
    },
  );

  it('trouvaille du potager : en haut des tuteurs, au plus moyenne', { timeout: TIMEOUT }, () => {
    const secret = entityNode('garden-vegetables', EntityType.Secret);
    expect(reachable(zoneGraph(true, easy, 2), home()).has(secret), 'trop facile').toBe(false);
    expect(reachable(zoneGraph(true, medium, 2), home()).has(secret), 'trop difficile').toBe(true);
  });

  it(
    'trouvaille de la cabane : seulement avec le saut mural, par la petite cheminée',
    { timeout: TIMEOUT },
    () => {
      const secret = entityNode('garden-treehouse', EntityType.Secret);
      expect(reachable(zoneGraph(true, hard, 2), home()).has(secret)).toBe(false);
      expect(reachable(zoneGraph(true, easy, 2, true), wallJumpItem()).has(secret)).toBe(true);
    },
  );

  it('pas d’araignée ni de jouet dans les salles des parents (D-39)', () => {
    for (const prop of HOUSE_STORY.props.filter((p) => p.kind.endsWith('-garden'))) {
      const enemies = level(prop.room).entities.filter(
        (e) => e.type === EntityType.Spider || e.type === EntityType.Patroller,
      );
      expect(enemies, prop.room).toEqual([]);
    }
  });

  it('le trou de la haie se voit depuis le sol du grand arbre (pour plus tard)', () => {
    const hole = level('garden-tree').decor.find((d) => d.kind === 'hedgehole');
    expect(hole).toBeDefined();
    const trigger = HOUSE_STORY.triggers.find((t) => t.id === 'garden-hedge');
    expect(trigger?.room).toBe('garden-tree');
  });
});
