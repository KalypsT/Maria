import { PROP_SIZE } from '../../config/story';
import { TILE_SIZE } from '../../config/display';
import type { Box } from '../physics/gridCollision';
import { boxesOverlap, checkCondition, type StoryProp } from './story';

/** Rectangle (px) d'un objet de mise en scène : posé au centre du bas de sa tuile. */
export function propBox(prop: StoryProp): Box {
  const size = PROP_SIZE[prop.kind];
  return {
    x: (prop.col + 0.5) * TILE_SIZE - size.w / 2,
    y: (prop.row + 1) * TILE_SIZE - size.h,
    width: size.w,
    height: size.h,
  };
}

/**
 * Pilier 5 (Maria n'est jamais montrée en train de se déplacer) : un objet de mise en scène
 * n'apparaît ou ne disparaît que hors de la vue, ou dans le noir complet d'un fondu.
 */
export function canChangeProp(box: Box, view: Box, veil: number): boolean {
  return veil >= 1 || !boxesOverlap(box, view);
}

/**
 * Objets de mise en scène de la salle courante (§33) : chacun est montré quand sa condition est
 * vraie, mais le changement attend que `canChangeProp` l'autorise. Aucune allocation dans `update`.
 */
export class PropStage {
  props: StoryProp[] = [];
  boxes: Box[] = [];
  shown: boolean[] = [];

  /** Nouvelle salle : état immédiat (l'écran est noir pendant un changement de salle). */
  load(all: readonly StoryProp[], room: string, flags: ReadonlySet<string>): void {
    this.props = all.filter((p) => p.room === room);
    this.boxes = this.props.map(propBox);
    this.shown = this.props.map((p) => checkCondition(flags, p.when));
  }

  /** Applique les changements permis ; vrai si un objet a changé. */
  update(flags: ReadonlySet<string>, view: Box, veil: number): boolean {
    let changed = false;
    const props = this.props;
    for (let i = 0; i < props.length; i++) {
      const prop = props[i];
      const box = this.boxes[i];
      if (!prop || !box) {
        continue;
      }
      const wanted = checkCondition(flags, prop.when);
      if (wanted !== this.shown[i] && canChangeProp(box, view, veil)) {
        this.shown[i] = wanted;
        changed = true;
      }
    }
    return changed;
  }
}
