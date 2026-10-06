import { AUDIO_EXTENSIONS } from '../../config/audio';
import { TrainPhase } from '../../config/combat';
import { LANDING_SOUND, STEP_SOUND, VOICE_EVERY, isSfxSlot, type SfxSlot } from '../../config/sfx';
import { TILE_SIZE } from '../../config/display';
import { JumpKind } from '../player/PlayerPhysics';
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
export const SfxCue = {
  None: 0,
  Step: 1,
  Jump: 2,
  Land: 4,
  LandBig: 8,
  WallJump: 16,
  LedgeGrab: 32,
  LedgeClimb: 64,
  UmbrellaOpen: 128,
  UmbrellaClose: 256,
  HookCatch: 512,
  Slide: 1024,
  VoiceHop: 2048,
  VoiceEffort: 4096,
} as const;

/** Ce que les bruitages observent de Céleste : `PlayerPhysics` convient tel quel. */
export interface SfxSubject {
  readonly state: PlayerState;
  readonly jumpKind: JumpKind;
  /** Parapluie ouvert (D-62). */
  readonly glideOpen: boolean;
}

/**
 * Bruitages du mouvement de Céleste (D-126, D-127), purs : un pas chaque fois qu'un pied se pose
 * pendant la course (la foulée de la marionnette, `CelestePoser.runPhase` : un pied en avant au
 * plus loin à π/2, l'autre à 3π/2) ; les sauts (depuis le sol, coyote compris, mural, depuis un
 * câble) ; la réception selon la hauteur de la chute ; le rebord, le parapluie, le crochet, la
 * glissade ; les boucles (contre un mur, le long d'un câble) ; la voix, rarement. Avancé au pas
 * fixe après la physique, les sensations et la pose. Aucune allocation.
 */
export class SfxDirector {
  /** Bruitages du dernier pas (`SfxCue`). */
  cues = 0;
  /** Volume du dernier pas (0–1), selon la vitesse. */
  stepVolume = 1;
  /** Boucles en cours : contre un mur, le long d'un câble. */
  wallSliding = false;
  cableSliding = false;
  private lastFoot = 0;
  private running = false;
  private lastState: PlayerState = PlayerState.Idle;
  private wasGliding = false;
  private jumps = 0;
  private efforts = 0;

  /**
   * `speedRatio` : vitesse horizontale en part de la vitesse de course maximale ; `feelEvents` :
   * événements de `PlayerFeel` ; `fallHeight` : hauteur de la dernière chute (px).
   */
  step(
    subject: SfxSubject,
    runPhase: number,
    speedRatio: number,
    feelEvents: number,
    fallHeight: number,
  ): void {
    let cues = SfxCue.None;
    const state = subject.state;
    const entered = state !== this.lastState;
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
    switch (subject.jumpKind) {
      case JumpKind.Ground:
        cues |= SfxCue.Jump;
        this.jumps++;
        if (this.jumps % VOICE_EVERY.hop === 0) {
          cues |= SfxCue.VoiceHop;
        }
        break;
      case JumpKind.Cable:
        cues |= SfxCue.Jump;
        break;
      case JumpKind.Wall:
        cues |= SfxCue.WallJump | this.effort();
        break;
      default:
        break;
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
    if (entered) {
      if (state === PlayerState.Hang) {
        cues |= SfxCue.LedgeGrab;
      } else if (state === PlayerState.Climb) {
        cues |= SfxCue.LedgeClimb | this.effort();
      } else if (state === PlayerState.Cable) {
        cues |= SfxCue.HookCatch;
      } else if (state === PlayerState.Slide) {
        cues |= SfxCue.Slide;
      }
    }
    // Le parapluie : ouvert ; refermé, sauf quand le crochet attrape un câble (son propre son).
    if (subject.glideOpen !== this.wasGliding) {
      if (subject.glideOpen) {
        cues |= SfxCue.UmbrellaOpen;
      } else if (state !== PlayerState.Cable) {
        cues |= SfxCue.UmbrellaClose;
      }
      this.wasGliding = subject.glideOpen;
    }
    this.wallSliding = state === PlayerState.WallSlide;
    this.cableSliding = state === PlayerState.Cable;
    this.lastState = state;
    this.cues = cues;
  }

  /** Remise au repos (changement de salle, réapparition) : ni son ni boucle. */
  reset(subject: SfxSubject): void {
    this.cues = SfxCue.None;
    this.running = false;
    this.wallSliding = false;
    this.cableSliding = false;
    this.lastState = subject.state;
    this.wasGliding = subject.glideOpen;
  }

  /** L'effort de Céleste, une fois sur `VOICE_EVERY.effort`. */
  private effort(): number {
    this.efforts++;
    return this.efforts % VOICE_EVERY.effort === 0 ? SfxCue.VoiceEffort : SfxCue.None;
  }
}

/** Moment d'un danger à cycle : son annonce et son passage (trains, tunnel, vague). */
export const PhaseCue = { None: 0, Warn: 1, Pass: 2 } as const;
export type PhaseCue = (typeof PhaseCue)[keyof typeof PhaseCue];

/**
 * Suit le moment d'un danger à cycle (`TrainPhase` : calme, annonce, passage) et dit quand
 * l'annonce et le passage commencent. Le premier moment observé ne fait aucun son.
 */
export class PhaseWatch {
  private last = -1;

  step(phase: TrainPhase): PhaseCue {
    const last = this.last;
    this.last = phase;
    if (last < 0 || phase === last) {
      return PhaseCue.None;
    }
    if (phase === TrainPhase.Warning) {
      return PhaseCue.Warn;
    }
    return phase === TrainPhase.Passing ? PhaseCue.Pass : PhaseCue.None;
  }

  reset(): void {
    this.last = -1;
  }
}
