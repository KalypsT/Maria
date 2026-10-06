import { AUDIO_EXTENSIONS } from '../../config/audio';
import { LANDING_SOUND, STEP_SOUND, isSfxSlot, type SfxSlot } from '../../config/sfx';
import { TILE_SIZE } from '../../config/display';
import { FeelEvent } from '../player/playerFeel';
import { PlayerState } from '../player/playerState';

/**
 * Fichiers de bruitages trouvés (chemin → adresse) rangés par emplacement (D-126) : `slot.ext`
 * ou `slot-N.ext` pour une variante. Si une variante a plusieurs formats, le premier de
 * `AUDIO_EXTENSIONS` l'emporte. Les variantes sont rangées par nom ; les fichiers au nom inconnu
 * sont signalés.
 */
export function sfxFileMap(files: Readonly<Record<string, string>>): {
  slots: Map<SfxSlot, string[]>;
  unknown: string[];
} {
  const variants = new Map<string, { slot: SfxSlot; url: string; rank: number }>();
  const unknown: string[] = [];
  for (const [path, url] of Object.entries(files)) {
    const name = path.slice(path.lastIndexOf('/') + 1);
    const dot = name.lastIndexOf('.');
    const base = name.slice(0, dot);
    const rank = AUDIO_EXTENSIONS.indexOf(
      name.slice(dot + 1).toLowerCase() as (typeof AUDIO_EXTENSIONS)[number],
    );
    const numbered = /^(.+)-(\d+)$/.exec(base);
    const slot = isSfxSlot(base)
      ? base
      : numbered?.[1] && isSfxSlot(numbered[1])
        ? numbered[1]
        : null;
    if (dot <= 0 || rank < 0 || !slot) {
      unknown.push(name);
      continue;
    }
    const known = variants.get(base);
    if (!known || rank < known.rank) {
      variants.set(base, { slot, url, rank });
    }
  }
  const slots = new Map<SfxSlot, string[]>();
  for (const base of [...variants.keys()].sort()) {
    const variant = variants.get(base);
    if (variant) {
      slots.set(variant.slot, [...(slots.get(variant.slot) ?? []), variant.url]);
    }
  }
  return { slots, unknown };
}

/**
 * Variante à jouer parmi `count`, tirée avec `random` (0 ≤ random < 1), jamais deux fois de suite
 * la même que `last` (−1 : aucune).
 */
export function pickVariant(count: number, last: number, random: number): number {
  if (count <= 1) {
    return 0;
  }
  if (last < 0 || last >= count) {
    return Math.min(count - 1, Math.floor(random * count));
  }
  const pick = Math.min(count - 2, Math.floor(random * (count - 1)));
  return pick >= last ? pick + 1 : pick;
}

/** Bruitages du mouvement demandés au dernier pas (masque de bits). */
export const SfxCue = { None: 0, Step: 1, Jump: 2, Land: 4, LandBig: 8 } as const;

/**
 * Bruitages du mouvement de Céleste (D-126), purs : un pas chaque fois qu'un pied se pose pendant la
 * course (la foulée de la marionnette, `CelestePoser.runPhase` : un pied en avant au plus loin à
 * π/2, l'autre à 3π/2), le décollage, la réception selon la hauteur de la chute. Avancé au pas fixe
 * après les sensations et la pose. Aucune allocation.
 */
export class SfxDirector {
  /** Bruitages du dernier pas (`SfxCue`). */
  cues = 0;
  /** Volume du dernier pas (0–1), selon la vitesse. */
  stepVolume = 1;
  private lastFoot = 0;
  private running = false;

  /**
   * `speedRatio` : vitesse horizontale en part de la vitesse de course maximale ; `feelEvents` :
   * événements de `PlayerFeel` ; `fallHeight` : hauteur de la dernière chute (px).
   */
  step(
    state: PlayerState,
    runPhase: number,
    speedRatio: number,
    feelEvents: number,
    fallHeight: number,
  ): void {
    let cues = SfxCue.None;
    if (state === PlayerState.Run) {
      const foot = Math.floor((runPhase - Math.PI / 2) / Math.PI);
      if (!this.running) {
        this.running = true;
        this.lastFoot = foot;
      } else if (foot > this.lastFoot) {
        this.lastFoot = foot;
        cues |= SfxCue.Step;
        const ratio = Math.min(1, Math.max(0, speedRatio));
        this.stepVolume = STEP_SOUND.minVolume + (1 - STEP_SOUND.minVolume) * ratio;
      }
    } else {
      this.running = false;
    }
    if ((feelEvents & FeelEvent.Takeoff) !== 0) {
      cues |= SfxCue.Jump;
    }
    if ((feelEvents & FeelEvent.Land) !== 0) {
      // Le pied qui se pose, toujours ; et le corps qui retombe, selon la hauteur de la chute.
      cues |= SfxCue.Step;
      this.stepVolume = 1;
      const tiles = fallHeight / TILE_SIZE;
      if (tiles >= LANDING_SOUND.bigFallTiles) {
        cues |= SfxCue.LandBig;
      } else if (tiles >= LANDING_SOUND.quietFallTiles) {
        cues |= SfxCue.Land;
      }
    }
    this.cues = cues;
  }

  reset(): void {
    this.cues = SfxCue.None;
    this.running = false;
  }
}
