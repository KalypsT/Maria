import { TILE_SIZE } from '../../config/display';
import { Tile, tileAt } from '../level/LevelData';
import type { Zone } from '../world/zone';
import { propBox } from './PropStage';
import type { FlagCondition, StoryData, TileArea } from './story';

function conditionFlags(when: FlagCondition): string[] {
  return [...(when.all ?? []), ...(when.none ?? [])];
}

/**
 * Cohérence des données de l'histoire avec la zone (vérifiée par les tests, liste vide si tout va
 * bien) :
 * - salles et positions existantes ;
 * - chaque déclencheur se désactive lui-même (il note une étape que sa condition exclut) ;
 * - Céleste n'est déplacée que dans le noir (entre un fondu au noir et le retour de l'image) ;
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
    const selfDisabling = t.steps.some(
      (step) => step.do === 'flag' && (t.when.none ?? []).includes(step.id),
    );
    if (!selfDisabling) {
      problems.push(`${what} : ne se désactive pas (rejoué sans fin)`);
    }
    let dark = false;
    for (const step of t.steps) {
      if (step.do === 'fadeOut') {
        dark = true;
      } else if (step.do === 'fadeIn') {
        dark = false;
      } else if (step.do === 'place') {
        if (!dark) {
          problems.push(`${what} : Céleste déplacée sous les yeux du joueur`);
        }
        inRoom(t.room, { col: step.col, row: step.row, w: 1, h: 1 }, what);
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
      } else if (below !== Tile.Solid && below !== Tile.OneWay) {
        problems.push(`${what} : ne repose sur rien`);
      }
      if (box.height > 2 * TILE_SIZE) {
        problems.push(`${what} : trop grand`);
      }
    }
  }
  for (const rule of story.times) {
    knownFlags(rule.when, 'moment de la journée');
  }
  for (const rule of story.strangeRooms) {
    knownFlags(rule.when, `monde étrange ${rule.room}`);
    if (!zone.rooms.has(rule.room)) {
      problems.push(`monde étrange : salle ${rule.room} inconnue`);
    }
  }
  for (const lock of story.lockedRooms) {
    knownFlags(lock.when, `porte fermée ${lock.room}`);
    if (!zone.rooms.has(lock.room)) {
      problems.push(`porte fermée : salle ${lock.room} inconnue`);
    }
  }
  return problems;
}
