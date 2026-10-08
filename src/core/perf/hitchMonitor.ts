import { HITCH } from '../../config/perf';

/** Cause probable d'une saccade : le travail de l'image précédente qui l'explique. */
export const HitchCause = {
  /** Dessin des blocs d'habillage (D-28, D-60). */
  Art: 'décor',
  /** Chargement d'une salle. */
  Room: 'salle',
  /** Le reste de la mise à jour (simulation, vues). */
  Game: 'jeu',
  /** Rien de mesuré ne l'explique : rendu, ramasse-miettes, navigateur. */
  Render: 'rendu',
} as const;
export type HitchCause = (typeof HitchCause)[keyof typeof HitchCause];

/** Travail d'une image (ms), mesuré dans le build de debug. */
export interface FrameWork {
  /** Mise à jour de la scène entière (décor et salle compris). */
  updateMs: number;
  /** Dessin des blocs d'habillage. */
  artMs: number;
  /** Chargement d'une salle. */
  roomMs: number;
  /** Le jeu a avancé (faux : pause, carte, choix d'un disque). */
  active: boolean;
  /** L'écran était noir à la fin de l'image (fondu) : une saccade qui suit ne se voit pas. */
  veiled: boolean;
}

export interface Hitch {
  /** Écart entre les deux images (ms). */
  readonly ms: number;
  readonly cause: HitchCause;
  readonly room: string;
  /** Position de Céleste (px). */
  readonly x: number;
  readonly y: number;
}

/** Cause d'un écart de `deltaMs` après une image qui a fait ce travail (ms). */
export function hitchCause(
  deltaMs: number,
  updateMs: number,
  artMs: number,
  roomMs: number,
): HitchCause {
  const share = HITCH.causeShare * deltaMs;
  if (roomMs >= artMs && roomMs > share) {
    return HitchCause.Room;
  }
  if (artMs > share) {
    return HitchCause.Art;
  }
  if (updateMs > share) {
    return HitchCause.Game;
  }
  return HitchCause.Render;
}

/**
 * Compteur de saccades (outil de debug, D-124), pur : à chaque image, l'écart depuis la précédente
 * est attribué au travail de celle-ci. Les écarts qui suivent une pause ou une interruption sont
 * ignorés ; ceux qui suivent un écran noir sont comptés à part (invisibles). Aucune allocation sauf
 * quand une saccade est retenue.
 */
export class HitchMonitor {
  /** Saccades visibles. */
  count = 0;
  /** Dont grosses saccades. */
  big = 0;
  /** Saccades dans le noir d'un fondu, invisibles. */
  masked = 0;
  /** La plus longue saccade visible. */
  worst: Hitch | null = null;
  /** Saccades visibles récentes, la plus récente en tête. */
  readonly recent: Hitch[] = [];
  private prevUpdateMs = 0;
  private prevArtMs = 0;
  private prevRoomMs = 0;
  private prevActive = false;
  private prevVeiled = false;

  /**
   * Une image : l'écart `deltaMs` depuis la précédente est jugé d'après le travail de celle-ci, puis
   * le travail `work` de cette image est retenu pour la suivante. Retourne la saccade retenue.
   */
  frame(
    deltaMs: number,
    work: Readonly<FrameWork>,
    room: string,
    x: number,
    y: number,
  ): Hitch | null {
    let hitch: Hitch | null = null;
    if (this.prevActive && deltaMs >= HITCH.hitchMs && deltaMs < HITCH.resumeMs) {
      if (this.prevVeiled) {
        this.masked++;
      } else {
        hitch = {
          ms: deltaMs,
          cause: hitchCause(deltaMs, this.prevUpdateMs, this.prevArtMs, this.prevRoomMs),
          room,
          x,
          y,
        };
        this.count++;
        if (deltaMs >= HITCH.bigHitchMs) {
          this.big++;
        }
        if (!this.worst || deltaMs > this.worst.ms) {
          this.worst = hitch;
        }
        this.recent.unshift(hitch);
        if (this.recent.length > HITCH.recentCount) {
          this.recent.pop();
        }
      }
    }
    this.prevUpdateMs = work.updateMs;
    this.prevArtMs = work.artMs;
    this.prevRoomMs = work.roomMs;
    this.prevActive = work.active;
    this.prevVeiled = work.veiled;
    return hitch;
  }

  /** Remet les compteurs à zéro (le travail de la dernière image reste retenu). */
  reset(): void {
    this.count = 0;
    this.big = 0;
    this.masked = 0;
    this.worst = null;
    this.recent.length = 0;
  }
}
