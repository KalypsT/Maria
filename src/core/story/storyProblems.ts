import { TILE_SIZE } from '../../config/display';
import { isAbility } from '../../config/abilities';
import { isMemory } from '../../config/memories';
import { EntityType, Tile, tileAt, type LevelData } from '../level/LevelData';
import type { Zone } from '../world/zone';
import { propBox } from './PropStage';
import {
  CHARACTER_KINDS,
  WALL_PROP_KINDS,
  WINDOW_PROP_KINDS,
  type FlagCondition,
  type StoryData,
  type TileArea,
} from './story';

/** Tuile libre (Céleste y tient debout, deux tuiles de haut) au-dessus d'un sol. */
function standable(level: LevelData, col: number, row: number): boolean {
  const below = tileAt(level, col, row + 1);
  return (
    tileAt(level, col, row) === Tile.Empty &&
    tileAt(level, col, row - 1) === Tile.Empty &&
    (below === Tile.Solid || below === Tile.OneWay)
  );
}

function conditionFlags(when: FlagCondition): string[] {
  return [...(when.all ?? []), ...(when.none ?? [])];
}

/**
 * Cohérence des données de l'histoire avec la zone (vérifiée par les tests, liste vide si tout va
 * bien) :
 * - salles et positions existantes ;
 * - chaque déclencheur se désactive lui-même (il note une étape que sa condition exclut) ;
 * - Céleste n'est déplacée ou ne change de salle que dans le noir (entre un fondu au noir et le
 *   retour de l'image), debout sur un sol ;
 * - les étapes des conditions sont notées par un déclencheur ;
 * - les objets reposent sur une surface.
 */
export function storyProblems(story: StoryData, zone: Zone): string[] {
  const problems: string[] = [];
  const set = new Set<string>();
  for (const t of story.triggers) {
    for (const step of t.steps) {
      if (step.do === 'flag') {
        set.add(step.id);
      }
    }
  }
  const inRoom = (room: string, area: TileArea, what: string) => {
    const level = zone.rooms.get(room);
    if (!level) {
      problems.push(`${what} : salle ${room} inconnue`);
      return;
    }
    if (
      area.col < 0 ||
      area.row < 0 ||
      area.col + area.w > level.width ||
      area.row + area.h > level.height
    ) {
      problems.push(`${what} : hors de la salle ${room}`);
    }
  };
  const knownFlags = (when: FlagCondition, what: string) => {
    for (const flag of conditionFlags(when)) {
      if (!set.has(flag)) {
        problems.push(`${what} : étape ${flag} jamais notée`);
      }
    }
  };
  const ids = new Set<string>();
  for (const t of story.triggers) {
    const what = `déclencheur ${t.id}`;
    if (ids.has(t.id)) {
      problems.push(`${what} : identifiant en double`);
    }
    ids.add(t.id);
    if (t.area) {
      inRoom(t.room, t.area, what);
    } else if (t.on !== 'leave') {
      problems.push(`${what} : sans zone`);
    }
    if (t.on === 'leave' && t.steps.some((step) => step.do !== 'flag' && step.do !== 'thought')) {
      problems.push(`${what} : en quittant la salle, seulement des étapes instantanées`);
    }
    if (t.on === 'interact' && !t.mark) {
      problems.push(`${what} : sans repère (étincelle)`);
    }
    knownFlags(t.when, what);
    // Un script qui emmène Céleste dans une autre salle ne peut pas se rejouer tout de suite : il
    // peut rester disponible (entrée dans le monde étrange, rejouée après un échec).
    const selfDisabling = t.steps.some(
      (step) =>
        (step.do === 'flag' && (t.when.none ?? []).includes(step.id)) ||
        (step.do === 'room' && step.room !== t.room),
    );
    if (t.repeat) {
      const harmless = t.steps.every(
        (step) => step.do === 'thought' || step.do === 'wait' || step.do === 'memory',
      );
      if (t.on !== 'interact' || !harmless) {
        problems.push(`${what} : rejouable seulement avec Agir, sans effet sur l'histoire`);
      }
    } else if (!selfDisabling) {
      problems.push(`${what} : ne se désactive pas (rejoué sans fin)`);
    }
    let dark = false;
    let room = t.room;
    for (const step of t.steps) {
      if (step.do === 'memory' && !isMemory(step.id)) {
        problems.push(`${what} : souvenir inconnu ${step.id}`);
      } else if (step.do === 'ability' && !isAbility(step.id)) {
        problems.push(`${what} : capacité inconnue ${step.id}`);
      } else if (step.do === 'sparkle') {
        inRoom(room, step.area, what);
      } else if (step.do === 'thought' && step.by !== undefined) {
        const by = step.by;
        if (!story.props.some((p) => p.id === by && p.room === room)) {
          problems.push(`${what} : bulle d'un personnage absent de ${room} (${by})`);
        }
      } else if (step.do === 'fadeOut') {
        dark = true;
      } else if (step.do === 'fadeIn') {
        dark = false;
      } else if (step.do === 'place' || step.do === 'room') {
        if (!dark) {
          problems.push(`${what} : Céleste déplacée sous les yeux du joueur`);
        }
        if (step.do === 'room') {
          room = step.room;
          if (t.on === 'leave') {
            problems.push(`${what} : changement de salle en quittant la salle`);
          }
          const level = zone.rooms.get(room);
          if (
            step.returnPoint &&
            level &&
            !level.entities.some((e) => e.type === EntityType.Checkpoint)
          ) {
            problems.push(`${what} : point de retour sans veilleuse dans ${room}`);
          }
        }
        inRoom(room, { col: step.col, row: step.row, w: 1, h: 1 }, what);
        const level = zone.rooms.get(room);
        if (level && !standable(level, step.col, step.row)) {
          problems.push(`${what} : Céleste placée dans le vide ou dans un meuble`);
        }
      }
    }
    if (dark) {
      problems.push(`${what} : se termine dans le noir`);
    }
  }
  for (const prop of story.props) {
    const what = `objet ${prop.id}`;
    inRoom(prop.room, { col: prop.col, row: prop.row, w: 1, h: 1 }, what);
    knownFlags(prop.when, what);
    if (prop.instant && prop.kind.includes('maria')) {
      problems.push(`${what} : Maria ne disparaît jamais à l'écran`);
    }
    const level = zone.rooms.get(prop.room);
    if (level) {
      const box = propBox(prop);
      const below = tileAt(level, prop.col, prop.row + 1);
      if (tileAt(level, prop.col, prop.row) !== Tile.Empty) {
        problems.push(`${what} : dans un meuble ou un mur`);
      } else if (
        below !== Tile.Solid &&
        below !== Tile.OneWay &&
        !WINDOW_PROP_KINDS.has(prop.kind)
      ) {
        problems.push(`${what} : ne repose sur rien`);
      }
      if (
        box.height > 2 * TILE_SIZE &&
        !CHARACTER_KINDS.has(prop.kind) &&
        !WALL_PROP_KINDS.has(prop.kind) &&
        !WINDOW_PROP_KINDS.has(prop.kind)
      ) {
        problems.push(`${what} : trop grand`);
      }
    }
  }
  for (const rule of story.times) {
    knownFlags(rule.when, 'moment de la journée');
  }
  for (const omen of story.omens) {
    const what = `présage ${omen.room}`;
    knownFlags(omen.when, what);
    inRoom(omen.room, { col: omen.col, row: omen.row, w: 1, h: 1 }, what);
    if (omen.radius <= 0) {
      problems.push(`${what} : rayon nul`);
    }
  }
  for (const [what, rules] of [
    ['salle qui roule', story.moving ?? []],
    ['lumières éteintes', story.dim ?? []],
  ] as const) {
    for (const rule of rules) {
      knownFlags(rule.when, `${what} ${rule.room}`);
      if (!zone.rooms.has(rule.room)) {
        problems.push(`${what} : salle ${rule.room} inconnue`);
      }
    }
  }
  for (const lock of story.lockedRooms) {
    knownFlags(lock.when, `porte fermée ${lock.room}`);
    const speaker = lock.speaker;
    if (
      speaker !== undefined &&
      !story.props.some((p) => p.id === speaker && p.room === lock.room)
    ) {
      problems.push(`porte fermée ${lock.room} : personnage ${speaker} absent`);
    }
    const room = zone.rooms.get(lock.room);
    if (!room) {
      problems.push(`porte fermée : salle ${lock.room} inconnue`);
    } else if (
      lock.exit !== undefined &&
      !room.exits.some((e) => e.id === lock.exit) &&
      !room.doors.some((d) => d.id === lock.exit)
    ) {
      problems.push(`porte fermée ${lock.room} : sortie ${String(lock.exit)} absente`);
    }
  }
  return problems;
}
