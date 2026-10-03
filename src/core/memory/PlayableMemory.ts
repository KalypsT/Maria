import { TILE_SIZE } from '../../config/display';
import { msToSteps } from '../../config/movement';
import {
  PLAYABLE_MEMORY_TIMING,
  type MemoryAction,
  type PlayableMemoryData,
} from '../../config/playableMemories';
import type { Box } from '../physics/gridCollision';
import { areaOverlaps } from '../story/story';

/** Événements du dernier pas (masque de bits). */
export const MemoryEvent = {
  None: 0,
  /** Une action commence (`lastAction`) : le geste, le scintillement. */
  Gesture: 1,
  /** Toutes les actions sont faites : le cœur. */
  Heart: 2,
  /** Dans le noir : Céleste n'est plus là, la salle reste seule. */
  Alone: 4,
  /** Le souvenir est fini (dans le noir) : on revient au jeu. */
  Done: 8,
} as const;

/** Moments du souvenir. */
const Phase = {
  Intro: 0,
  Play: 1,
  Gesture: 2,
  Heart: 3,
  FadeOut: 4,
  Alone: 5,
  End: 6,
  Blink: 7,
} as const;
type Phase = (typeof Phase)[keyof typeof Phase];

type Timing = typeof PLAYABLE_MEMORY_TIMING;

/**
 * Souvenir jouable (D-89), pur et indépendant de Phaser : les actions se font dans l'ordre, avec
 * Agir, dans leur zone ; pendant un geste, Céleste ne bouge pas. Après la dernière : un cœur, un
 * fondu, la salle seule un instant, puis le noir et la fin. Ses étapes (`flags`) ne sont jamais
 * sauvegardées : on le rejoue autant qu'on veut. Aucune allocation dans `step`.
 */
export class PlayableMemory {
  /** Étapes du souvenir (objets qui changent). */
  readonly flags = new Set<string>();
  /** Voile noir (0 → 1). */
  veil = 1;
  /** Céleste est là (elle disparaît à la fin : la salle reste seule). */
  celesteVisible = true;
  /** Céleste tient la tasse. */
  carrying = false;
  /** Action suivante à faire (indice), `actions.length` quand tout est fait. */
  next = 0;
  /** Action à portée maintenant (-1 : aucune, ou pas le moment). */
  interactable = -1;
  /** Dernière action commencée (geste en cours). */
  lastAction = -1;
  /** Événements du dernier pas (`MemoryEvent`). */
  events = 0;
  private phase: Phase = Phase.Intro;
  private elapsed = 0;
  /** L'étape qui viendra au noir du clignement en cours (D-118). */
  private pending: string | null = null;
  /** La salle seule a déjà été montrée (deux fondus : avant, puis la fin). */
  private aloneShown = false;
  private readonly steps: Readonly<Record<keyof Timing, number>>;

  constructor(
    readonly data: PlayableMemoryData,
    stepHz: number,
    timing: Readonly<Timing> = PLAYABLE_MEMORY_TIMING,
  ) {
    this.steps = {
      introMs: msToSteps(timing.introMs, stepHz),
      gestureMs: msToSteps(timing.gestureMs, stepHz),
      heartMs: msToSteps(timing.heartMs, stepHz),
      fadeMs: msToSteps(timing.fadeMs, stepHz),
      aloneMs: msToSteps(timing.aloneMs, stepHz),
      blinkMs: msToSteps(timing.blinkMs, stepHz),
    };
  }

  /** Commandes de Céleste suspendues (fondus, geste, fin). */
  get locked(): boolean {
    return this.phase !== Phase.Play;
  }

  get done(): boolean {
    return this.phase === Phase.End;
  }

  /** L'action à faire (son étincelle), null quand tout est fait. */
  get current(): MemoryAction | null {
    return this.data.actions[this.next] ?? null;
  }

  /** Un pas : `box` la hitbox de Céleste, `interact` Agir pressé à ce pas. */
  step(box: Box, interact: boolean): number {
    this.events = 0;
    this.elapsed++;
    const s = this.steps;
    switch (this.phase) {
      case Phase.Intro:
        this.veil = 1 - this.progress(s.introMs);
        if (this.elapsed >= s.introMs) {
          this.enter(Phase.Play);
        }
        break;
      case Phase.Play: {
        const action = this.current;
        this.interactable = action && areaOverlaps(action.area, box, TILE_SIZE) ? this.next : -1;
        if (action && this.interactable >= 0 && interact) {
          this.lastAction = this.next;
          this.carrying = action.carry;
          if (action.sets !== undefined && action.blink) {
            this.pending = action.sets;
          } else if (action.sets !== undefined) {
            this.flags.add(action.sets);
          }
          this.next++;
          this.interactable = -1;
          this.events |= MemoryEvent.Gesture;
          this.enter(Phase.Gesture);
        }
        break;
      }
      case Phase.Gesture:
        if (this.elapsed >= s.gestureMs) {
          if (this.pending !== null) {
            this.enter(Phase.Blink);
          } else {
            this.afterAction();
          }
        }
        break;
      case Phase.Blink: {
        // Un clignement (D-118) : le noir monte, l'étape vient au noir, puis il redescend.
        const half = Math.max(1, Math.floor(s.blinkMs / 2));
        if (this.elapsed === half && this.pending !== null) {
          this.flags.add(this.pending);
          this.pending = null;
        }
        this.veil =
          this.elapsed <= half
            ? this.progress(half)
            : 1 - Math.min(1, (this.elapsed - half) / Math.max(1, s.blinkMs - half));
        if (this.elapsed >= s.blinkMs) {
          this.veil = 0;
          this.afterAction();
        }
        break;
      }
      case Phase.Heart:
        if (this.elapsed >= s.heartMs) {
          this.enter(Phase.FadeOut);
        }
        break;
      case Phase.FadeOut:
        // Deux fondus au noir : avant la salle seule (Céleste encore là), puis à la fin.
        this.veil = this.progress(s.fadeMs);
        if (this.elapsed >= s.fadeMs) {
          if (!this.aloneShown) {
            this.aloneShown = true;
            // La salle seule ; ou Céleste seule, quelqu'un n'est plus là (D-118).
            const alone = this.data.alone;
            this.celesteVisible = alone?.keepCeleste ?? false;
            if (alone?.sets !== undefined) {
              this.flags.add(alone.sets);
            }
            this.events |= MemoryEvent.Alone;
            this.enter(Phase.Alone);
          } else {
            this.events |= MemoryEvent.Done;
            this.enter(Phase.End);
          }
        }
        break;
      case Phase.Alone:
        // La petite cuisine revient, seule, et reste un instant.
        this.veil = 1 - this.progress(s.fadeMs);
        if (this.elapsed >= s.fadeMs + s.aloneMs) {
          this.enter(Phase.FadeOut);
        }
        break;
      case Phase.End:
        this.veil = 1;
        break;
    }
    return this.events;
  }

  /** Une action finie : la suivante, ou le cœur après la dernière. */
  private afterAction(): void {
    if (this.next < this.data.actions.length) {
      this.enter(Phase.Play);
    } else {
      this.events |= MemoryEvent.Heart;
      this.enter(Phase.Heart);
    }
  }

  private progress(total: number): number {
    return total <= 0 ? 1 : Math.min(1, this.elapsed / total);
  }

  private enter(phase: Phase): void {
    this.phase = phase;
    this.elapsed = 0;
  }
}
