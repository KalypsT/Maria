import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { buildMapModel, mapProblems, type MapProgress } from '../src/core/world/mapModel';
import { buildZone, isStrangeRoom, mapPage } from '../src/core/world/zone';
import { HOUSE } from '../src/levels/house/zone';

const zone = buildZone(HOUSE);

function progress(changes: Partial<MapProgress> = {}): MapProgress {
  return {
    visited: ['bedroom'],
    seen: new Set(),
    activatedCheckpoints: [],
    checkpoint: { levelId: 'bedroom', checkpointId: null },
    collectibles: [],
    celeste: null,
    ...changes,
  };
}

describe('carte dessinée par Céleste (§24)', () => {
  it('la maison a une boîte par salle, sans chevauchement', () => {
    expect(mapProblems(zone)).toEqual([]);
    // Un mur droit mène à un mur gauche : sur la carte, la salle d'arrivée est à droite.
    for (const [a, b] of zone.links) {
      const [left, right] =
        zone.rooms.get(a.room)?.exits.find((e) => e.id === a.exit)?.side === 'right'
          ? [a, b]
          : [b, a];
      const far = new Set(['hall:3', 'attic:2']);
      // Une porte de façade (D-61) mène au lieu dessiné au-dessus de la rue, pas à côté.
      if ([a, b].some((ref) => zone.rooms.get(ref.room)?.doors.some((d) => d.id === ref.exit))) {
        continue;
      }
      // Le monde étrange n'est pas sur la carte (D-34).
      // Le monde étrange n'est pas sur la carte (D-34) ; le quartier est sur une autre page (D-60).
      if (
        far.has(`${left.room}:${String(left.exit)}`) ||
        !zone.map[left.room] ||
        mapPage(zone, left.room) !== mapPage(zone, right.room)
      ) {
        continue;
      }
      const leftBox = zone.map[left.room];
      const rightBox = zone.map[right.room];
      expect(rightBox && leftBox && rightBox.x > leftBox.x, `${left.room} → ${right.room}`).toBe(
        true,
      );
    }
    for (const [id, level] of zone.rooms) {
      if (!isStrangeRoom(level)) {
        expect(level.meta.icon, id).toBeDefined();
      }
    }
  });

  it('le monde étrange n’apparaît jamais ; Céleste n’y est pas dessinée (D-34)', () => {
    const model = buildMapModel(zone, {
      ...progress(),
      visited: [...progress().visited, 'living-strange', 'shadows'],
      celeste: { room: 'shadows', x: 100, y: 100 },
    });
    expect(model.rooms.map((room) => room.id)).not.toContain('shadows');
    expect(model.rooms.map((room) => room.id)).not.toContain('living-strange');
    expect(model.celeste).toBeNull();
  });

  it('salles visitées dessinées, voisines devinées, les autres cachées', () => {
    const model = buildMapModel(zone, progress());
    const byId = new Map(model.rooms.map((room) => [room.id, room]));
    expect(byId.get('bedroom')?.visited).toBe(true);
    // Voisines de la chambre : couloir (porte) et grenier (derrière l'armoire).
    expect(byId.get('hall')?.visited).toBe(false);
    expect(byId.get('attic')?.visited).toBe(false);
    expect(byId.has('kitchen')).toBe(false);
    expect(model.links).toHaveLength(2);
    // Chambre ↔ couloir côte à côte ; chambre ↔ grenier : passage lointain (pointillés).
    expect(model.links.filter((link) => link.direct)).toHaveLength(1);
  });

  it('Céleste est placée là où elle est dans sa salle', () => {
    const level = zone.rooms.get('bedroom');
    const box = zone.map.bedroom;
    if (!level || !box) {
      throw new Error('chambre absente');
    }
    const model = buildMapModel(
      zone,
      progress({ celeste: { room: 'bedroom', x: level.width * T, y: level.height * T } }),
    );
    expect(model.celeste).toEqual({ x: box.x + box.w, y: box.y + box.h });
    expect(
      buildMapModel(zone, progress({ celeste: { room: 'kitchen', x: 0, y: 0 } })).celeste,
    ).toBeNull();
  });

  it('seules les veilleuses allumées et les trouvailles ramassées apparaissent', () => {
    const visited = ['bedroom', 'hall', 'staircase', 'attic'];
    const none = buildMapModel(zone, progress({ visited }));
    expect(none.rooms.flatMap((room) => room.lamps)).toEqual([]);
    expect(none.rooms.flatMap((room) => room.stars)).toEqual([]);
    const some = buildMapModel(
      zone,
      progress({
        visited,
        activatedCheckpoints: ['bedroom:c20-19', 'attic:c4-19'],
        checkpoint: { levelId: 'attic', checkpointId: 'c4-19' },
        collectibles: ['attic:s49-5'],
      }),
    );
    const bedroom = some.rooms.find((room) => room.id === 'bedroom');
    const attic = some.rooms.find((room) => room.id === 'attic');
    expect(bedroom?.lamps.map((lamp) => lamp.current)).toEqual([false]);
    expect(attic?.lamps.map((lamp) => lamp.current)).toEqual([true]);
    expect(attic?.stars).toHaveLength(1);
  });

  it('une salle découverte depuis la dernière ouverture est « fraîche »', () => {
    const model = buildMapModel(
      zone,
      progress({ visited: ['bedroom', 'hall'], seen: new Set(['bedroom']) }),
    );
    expect(model.rooms.filter((room) => room.fresh).map((room) => room.id)).toEqual(['hall']);
  });
});
