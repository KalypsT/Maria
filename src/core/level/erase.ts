import { TILE_SIZE as T } from '../../config/display';
import {
  EntityType,
  LayerMask,
  Tile,
  type EraseGroup,
  type LevelData,
  type LevelErase,
  type TileRect,
} from './LevelData';
import { atLayer, rawOf, rezoned } from './layers';

/**
 * L'effacement (D-111), pur : des groupes de tuiles qui changent de couche pendant le jeu. Chaque
 * état (les couches de chaque groupe, un « motif ») est une variante statique de la salle, analysable
 * comme une autre (D-96, D-107) : rien ne bouge, des tuiles quittent une couche ou y entrent.
 */

function overlaps(a: TileRect, b: TileRect): boolean {
  return (
    a.col < b.col + b.width &&
    b.col < a.col + a.width &&
    a.row < b.row + b.height &&
    b.row < a.row + a.height
  );
}

function inRect(r: TileRect, col: number, row: number): boolean {
  return col >= r.col && col < r.col + r.width && row >= r.row && row < r.row + r.height;
}

const MASKS: Readonly<Record<string, LayerMask>> = {
  present: LayerMask.Present,
  memory: LayerMask.Memory,
  both: LayerMask.Both,
  none: LayerMask.None,
};

/**
 * Couches d'un mot de `; @erase:` (présent, souvenir, les deux ; aucune : une étoile éteinte de la
 * berceuse, D-140).
 */
export function maskOf(word: string): LayerMask | null {
  return MASKS[word] ?? null;
}

/** Ce que le parseur lit : les zones des groupes (dans l'ordre), et les étapes des vagues. */
export interface EraseSpec {
  readonly rects: readonly {
    readonly id: string;
    readonly mask: LayerMask;
    readonly rect: TileRect;
  }[];
  readonly steps: readonly (readonly string[])[];
  readonly speeds?: readonly { readonly flag: string; readonly scale: number }[];
  readonly until?: string;
  readonly look?: 'stars';
}

/**
 * La couche suivante d'une vague : présent ↔ souvenir (l'effacement, D-111), allumée (les deux
 * couches) ↔ éteinte (aucune) pour les étoiles de la berceuse (D-140).
 */
export function toggledMask(mask: number): LayerMask {
  if (mask === LayerMask.Present) {
    return LayerMask.Memory;
  }
  if (mask === LayerMask.Memory) {
    return LayerMask.Present;
  }
  return mask === LayerMask.Both ? LayerMask.None : LayerMask.Both;
}

/** Groupes et étapes d'une salle qui vient d'être lue ; erreurs explicites. */
export function buildErase(id: string, width: number, height: number, spec: EraseSpec): LevelErase {
  const groups = new Map<string, { rects: TileRect[]; initial: LayerMask }>();
  const room: TileRect = { col: 0, row: 0, width, height };
  const all: TileRect[] = [];
  for (const { id: group, mask, rect } of spec.rects) {
    const inside =
      rect.width >= 1 &&
      rect.height >= 1 &&
      rect.col + rect.width <= room.width &&
      rect.row + rect.height <= room.height;
    if (!inside) {
      throw new Error(`Niveau ${id} : @erase ${group} hors de la salle`);
    }
    if (all.some((r) => overlaps(r, rect))) {
      throw new Error(`Niveau ${id} : les zones de @erase se chevauchent (${group})`);
    }
    all.push(rect);
    const known = groups.get(group);
    if (known && known.initial !== mask) {
      throw new Error(`Niveau ${id} : @erase ${group} a deux couches de départ`);
    }
    if (known) {
      known.rects.push(rect);
    } else {
      groups.set(group, { rects: [rect], initial: mask });
    }
  }
  const stars = spec.look === 'stars';
  for (const step of spec.steps) {
    for (const group of step) {
      const known = groups.get(group);
      if (!known) {
        throw new Error(`Niveau ${id} : @erase-step ${group} inconnu`);
      }
      const single = known.initial === LayerMask.Present || known.initial === LayerMask.Memory;
      if (!stars && !single) {
        throw new Error(`Niveau ${id} : une vague (${group}) est dans une seule couche au départ`);
      }
    }
  }
  for (const [group, g] of groups) {
    if (stars) {
      // La berceuse (D-140) : chaque étoile est une vague, allumée ou éteinte dans les deux couches.
      if (g.initial !== LayerMask.Both && g.initial !== LayerMask.None) {
        throw new Error(
          `Niveau ${id} : une étoile (${group}) est both (allumée) ou none (éteinte)`,
        );
      }
      if (!spec.steps.some((step) => step.includes(group))) {
        throw new Error(`Niveau ${id} : l'étoile ${group} n'est dans aucune @erase-step`);
      }
    } else if (g.initial === LayerMask.None) {
      throw new Error(`Niveau ${id} : @erase ${group} none ne va qu'avec @erase-look: stars`);
    }
  }
  if ((spec.speeds?.length || spec.until) && spec.steps.length === 0) {
    throw new Error(`Niveau ${id} : @erase-speed et @erase-until vont avec des @erase-step`);
  }
  return {
    groups: [...groups].map(([group, g]) => ({ id: group, rects: g.rects, initial: g.initial })),
    steps: spec.steps,
    ...(spec.speeds?.length ? { speeds: spec.speeds } : {}),
    ...(spec.until ? { until: spec.until } : {}),
    ...(stars ? { look: 'stars' as const } : {}),
  };
}

/** Le facteur de vitesse des vagues avec ces étapes d'histoire (D-117) : 1 sans accélération. */
export function eraseFactor(erase: LevelErase, flags: ReadonlySet<string>): number {
  let factor = 1;
  for (const s of erase.speeds ?? []) {
    if (flags.has(s.flag)) {
      factor = Math.max(factor, s.scale);
    }
  }
  return factor;
}

/** L'effacement est dissous (D-117) : plus aucune vague. */
export function eraseDissolved(erase: LevelErase, flags: ReadonlySet<string>): boolean {
  return erase.until !== undefined && flags.has(erase.until);
}

/** Le groupe est une vague (cité par une étape) ; sinon, une bande de la poursuite. */
export function isWave(erase: LevelErase, group: string): boolean {
  return erase.steps.some((step) => step.includes(group));
}

/**
 * Vérifie une salle à effacement : les zones des groupes ne chevauchent pas les zones `; @shift:`,
 * et aucune lanterne, objet, départ, arrivée, porte ou sortie (ni leur sol) n'y est.
 */
export function checkErase(level: LevelData): void {
  const erase = level.erase;
  if (!erase) {
    return;
  }
  if (level.tide) {
    throw new Error(`Niveau ${level.id} : @erase et @tide ne vont pas ensemble`);
  }
  const zones = [...(level.layers?.present ?? []), ...(level.layers?.memory ?? [])];
  const rects = erase.groups.flatMap((g) => g.rects);
  for (const r of rects) {
    if (zones.some((z) => overlaps(z, r))) {
      throw new Error(
        `Niveau ${level.id} : @erase ${String(r.col)} ${String(r.row)} chevauche une zone @shift`,
      );
    }
  }
  const inGroup = (col: number, row: number) => rects.some((r) => inRect(r, col, row));
  const both = (what: string, col: number, row: number, ground: boolean) => {
    if (inGroup(col, row) || (ground && inGroup(col, row + 1))) {
      throw new Error(
        `Niveau ${level.id} : ${what} sur une zone de l'effacement (${String(col)} ${String(row)})`,
      );
    }
  };
  for (const e of level.entities) {
    if (e.type !== EntityType.Shell) {
      both(e.type, e.col, e.row, e.type === EntityType.Checkpoint || e.type === EntityType.Ability);
    }
  }
  both('le départ', level.spawn.col, level.spawn.row, true);
  if (level.goal) {
    both("l'arrivée", level.goal.col, level.goal.row, false);
  }
  for (const d of level.doors) {
    both(`la porte ${String(d.id)}`, d.col, d.row, true);
  }
}

/** Couches de départ de chaque groupe (dans l'ordre de `erase.groups`). */
export function initialMasks(erase: LevelErase): Uint8Array {
  return Uint8Array.from(erase.groups, (g) => g.initial);
}

/** Clé d'un motif (pour les caches). */
export function patternKey(masks: ArrayLike<number>): string {
  return Array.from(masks).join('');
}

const patterns = new WeakMap<LevelData, Map<string, LevelData>>();
/** La salle telle que lue, sans motif appliqué (ses zones `; @shift:` seulement), par variante. */
const roots = new WeakMap<LevelData, LevelData>();

/**
 * La salle sans motif de l'effacement (ses zones `; @shift:` seulement, tous ses groupes dans les
 * tuiles) : d'elle partent tous les motifs. Une salle sans effacement est sa propre racine.
 */
export function eraseRoot(level: LevelData): LevelData {
  const present = atLayer(level, 'present');
  return roots.get(present) ?? roots.get(level) ?? present;
}

/**
 * La salle (du présent) dans un motif de l'effacement : chaque groupe dans ses couches (aucune :
 * effacé partout). Même identifiant ; en cache. Les variantes de couche s'obtiennent par `atLayer`.
 */
export function erasedLevel(from: LevelData, masks: ArrayLike<number>): LevelData {
  const erase = from.erase;
  if (!erase) {
    return from;
  }
  const level = eraseRoot(from);
  const key = patternKey(masks);
  let cache = patterns.get(level);
  if (!cache) {
    cache = new Map();
    patterns.set(level, cache);
  }
  const known = cache.get(key);
  if (known) {
    return known;
  }
  const raw = rawOf(level);
  const rawTiles = raw.tiles.slice();
  const rawMaterials = raw.materials.slice();
  const present = [...(level.layers?.present ?? [])];
  const memory = [...(level.layers?.memory ?? [])];
  erase.groups.forEach((g: EraseGroup, i) => {
    const mask = masks[i] ?? g.initial;
    if (mask === LayerMask.Present) {
      present.push(...g.rects);
    } else if (mask === LayerMask.Memory) {
      memory.push(...g.rects);
    } else if (mask === LayerMask.None) {
      for (const r of g.rects) {
        for (let row = r.row; row < r.row + r.height; row++) {
          for (let col = r.col; col < r.col + r.width; col++) {
            rawTiles[row * level.width + col] = Tile.Empty;
            rawMaterials[row * level.width + col] = 0;
          }
        }
      }
    }
  });
  // Les entités ne sont jamais dans un groupe (vérifié) : rien d'autre à retirer.
  const result = rezoned(level, { present, memory, rawTiles, rawMaterials });
  cache.set(key, result);
  patterns.set(result, cache);
  roots.set(result, level);
  return result;
}

/** Bas d'un groupe (px) : la ligne sous sa zone la plus basse. */
export function groupBottom(group: EraseGroup): number {
  return Math.max(...group.rects.map((r) => (r.row + r.height) * T));
}

/**
 * Les motifs successifs des vagues (D-111), à partir du départ : après chaque étape, les groupes
 * cités passent d'une couche à l'autre (ou s'allument, s'éteignent : la berceuse, D-140) ; les
 * étapes en boucle, jusqu'à revenir au départ. Le dernier motif mène au premier.
 */
export function wavePatterns(erase: LevelErase): Uint8Array[] {
  const out: Uint8Array[] = [initialMasks(erase)];
  const seen = new Set([patternKey(out[0] ?? [])]);
  // Les étapes en boucle, jusqu'à retrouver un motif déjà vu (le cycle est complet).
  for (let k = 0; erase.steps.length > 0; k++) {
    const step = erase.steps[k % erase.steps.length] ?? [];
    const next = Uint8Array.from(out[out.length - 1] ?? []);
    for (const group of step) {
      const i = erase.groups.findIndex((g) => g.id === group);
      next[i] = toggledMask(next[i] ?? LayerMask.None);
    }
    const key = patternKey(next);
    if (seen.has(key) && k % erase.steps.length === erase.steps.length - 1) {
      break;
    }
    seen.add(key);
    out.push(next);
  }
  return out;
}

/** Le motif où toutes les bandes ont quitté le présent (la fin de la fuite, D-111). */
export function bandsGone(erase: LevelErase): Uint8Array {
  return Uint8Array.from(erase.groups, (g) =>
    isWave(erase, g.id) ? g.initial : g.initial & ~LayerMask.Present,
  );
}
