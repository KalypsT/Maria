import { describe, expect, it } from 'vitest';
import { TILE_SIZE as T } from '../src/config/display';
import { zoneShells } from '../src/core/world/shells';
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
    // Voisines de la chambre : couloir (porte) et grenier (sa petite porte haute, D-132).
    expect(byId.get('hall')?.visited).toBe(false);
    expect(byId.get('attic')?.visited).toBe(false);
    expect(byId.has('kitchen')).toBe(false);
    expect(model.links).toHaveLength(2);
    // Chambre ↔ couloir et chambre ↔ grenier (au-dessus du couloir) : côte à côte.
    expect(model.links.filter((link) => link.direct)).toHaveLength(2);
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

  it('seules les veilleuses allumées et les coquilles trouvées apparaissent', () => {
    const visited = ['bedroom', 'hall', 'staircase', 'attic'];
    const none = buildMapModel(zone, progress({ visited }));
    expect(none.rooms.flatMap((room) => room.lamps)).toEqual([]);
    expect(none.rooms.flatMap((room) => room.shells)).toEqual([]);
    expect(none.rooms.flatMap((room) => room.seenShells)).toEqual([]);
    const some = buildMapModel(
      zone,
      progress({
        visited,
        activatedCheckpoints: ['bedroom:bedroom-toybox', 'attic:attic-trunk'],
        checkpoint: { levelId: 'attic', checkpointId: 'attic-trunk' },
        collectibles: ['attic-ridge'],
      }),
    );
    const bedroom = some.rooms.find((room) => room.id === 'bedroom');
    const attic = some.rooms.find((room) => room.id === 'attic');
    expect(bedroom?.lamps.map((lamp) => lamp.current)).toEqual([false]);
    expect(attic?.lamps.map((lamp) => lamp.current)).toEqual([true]);
    expect(attic?.shells).toHaveLength(1);
  });

  it('les coquilles (D-148) : vues en pointillés, et le compte du lieu', () => {
    const visited = ['bedroom', 'hall', 'staircase', 'attic', 'kitchen'];
    const page = zoneShells(zone).filter((s) => s.place === 'house');
    const fresh = buildMapModel(zone, progress({ visited }));
    expect(fresh.shells).toEqual({ found: 0, total: page.length });
    const model = buildMapModel(
      zone,
      progress({
        visited,
        collectibles: ['attic-ridge'],
        // Une coquille vue puis prise n'est plus en pointillés ; une vue dans une salle pas
        // encore visitée n'apparaît pas.
        seenCollectibles: ['attic-ridge', 'kitchen-cupboards', 'laundry-wardrobe'],
      }),
    );
    expect(model.shells).toEqual({ found: 1, total: page.length });
    const room = (id: string) => model.rooms.find((r) => r.id === id);
    expect(room('attic')?.shells).toHaveLength(1);
    expect(room('attic')?.seenShells).toEqual([]);
    expect(room('kitchen')?.seenShells).toHaveLength(1);
    expect(model.rooms.flatMap((r) => r.seenShells)).toHaveLength(1);
    // Une autre page : ses propres coquilles.
    const street = buildMapModel(zone, progress({ visited: ['street'] }), 'street');
    expect(street.shells.total).toBe(zoneShells(zone).filter((s) => s.place === 'street').length);
  });

  it('une salle découverte depuis la dernière ouverture est « fraîche »', () => {
    const model = buildMapModel(
      zone,
      progress({ visited: ['bedroom', 'hall'], seen: new Set(['bedroom']) }),
    );
    expect(model.rooms.filter((room) => room.fresh).map((room) => room.id)).toEqual(['hall']);
  });

  it('les cubes de la tour d’Eden trouvés (D-122) : dans leur salle visitée, de leur couleur', () => {
    const model = buildMapModel(zone, {
      ...progress(),
      cubes: [
        { room: 'bedroom', col: 4, row: 6, color: '#ec8fab' },
        { room: 'kitchen', col: 4, row: 6, color: '#f0c654' },
      ],
    });
    const bedroom = model.rooms.find((room) => room.id === 'bedroom');
    expect(bedroom?.cubes.map((c) => c.color)).toEqual(['#ec8fab']);
    // Une salle jamais visitée ne montre rien.
    expect(model.rooms.flatMap((room) => (room.id === 'bedroom' ? [] : room.cubes))).toEqual([]);
    expect(buildMapModel(zone, progress()).rooms.every((room) => room.cubes.length === 0)).toBe(
      true,
    );
  });
});
