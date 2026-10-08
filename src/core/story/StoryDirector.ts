import { TILE_SIZE } from '../../config/display';
import type { FlashbackId } from '../../config/memories';
import type { PlayableMemoryId } from '../../config/playableMemories';
import { PHYSICS_STEP_HZ, msToSteps } from '../../config/movement';
import type { Box } from '../physics/gridCollision';
import {
  areaOverlaps,
  checkCondition,
  type FlagCondition,
  type ScriptPose,
  type StoryData,
  type FadeShape,
  type StoryStep,
  type StoryTrigger,
  type TileArea,
  type ThoughtIcon,
  type TimeOfDay,
} from './story';

/** Ce que les scripts demandent à la scène (sauvegarde, Céleste, bulles). */
export interface StoryHost {
  /** Étape vécue : à sauvegarder aussitôt. */
  flagSet(id: string): void;
  /** Étape réversible retirée (la marée, D-95) : à sauvegarder aussitôt. */
  flagCleared?(id: string): void;
  place(col: number, row: number, facing: 1 | -1): void;
  /** Céleste passe dans la salle `room` (dans le noir) ; le script continue. */
  room(room: string, col: number, row: number, facing: 1 | -1, returnPoint: boolean): void;
  pose(pose: ScriptPose): void;
  /** Bulle au-dessus de Céleste, ou du personnage `by` (objet de mise en scène). */
  think(icon: ThoughtIcon, ms: number, by?: string): void;
  /** Scintillements étranges dans une zone (tuiles) de la salle courante. */
  sparkle(area: TileArea, ms: number): void;
  shake(ms: number, strength: number): void;
  /** Souvenir trouvé (D-38). */
  memory(id: string): void;
  /** Silence de Maria (D-57). */
  hush(ms: number): void;
  /** Capacité apprise (D-85). */
  ability(id: string): void;
  /** Souvenir jouable (D-89) : la scène le joue, puis appelle `endPlay`. */
  play(id: PlayableMemoryId): void;
  /** Le tourne-disque (D-121) : le choix des disques, ou une bulle s'il n'y en a aucun. */
  records?(): void;
  /** Regard (D-122) : la vue va vers cette tuile ; null : elle revient sur Céleste. */
  look?(col: number | null, row: number | null): void;
  /** Céleste est sortie de la salle (D-144) : invisible jusqu'au prochain changement de salle. */
  gone?(): void;
  /** Un très léger signe du monde étrange pendant `ms` (D-144). */
  glimmer?(ms: number): void;
  /** La fin du jeu (D-145) : « Continuer » reprendra dans `room` ; l'écran de fin, puis l'accueil. */
  end?(room: string): void;
}

/**
 * Metteur en scène (§33, D-31) : étapes vécues, déclencheurs et scripts, voile des fondus. Un pas
 * par pas de simulation ; aucune allocation dans `step`.
 */
export class StoryDirector {
  readonly flags = new Set<string>();
  /** Voile noir des fondus (0 → 1). */
  veil = 0;
  /** Forme du voile : uniforme, ou en cercle autour de Céleste (D-35). */
  veilShape: FadeShape = 'plain';
  /** Court souvenir affiché (D-68), null sinon ; `flashbackProgress` de 0 à 1. */
  flashback: FlashbackId | null = null;
  flashbackProgress = 0;
  /** Déclencheur Agir disponible là où se tient Céleste (-1 : aucun). */
  interactable = -1;
  /** Un souvenir jouable est en cours (D-89) : le script attend `endPlay`. */
  playing = false;
  private running: StoryTrigger | null = null;
  private stepIndex = 0;
  private stepElapsed = 0;
  private stepTotal = 0;
  private veilFrom = 0;
  /** Salle du pas précédent (déclencheurs `leave`) ; null avant le premier pas. */
  private lastRoom: string | null = null;

  constructor(
    readonly data: StoryData,
    private readonly host: StoryHost,
    private readonly stepHz: number = PHYSICS_STEP_HZ,
  ) {}

  /** Remplace les étapes vécues (chargement de la sauvegarde, outil de debug) ; script arrêté. */
  setFlags(flags: Iterable<string>): void {
    this.flags.clear();
    for (const flag of flags) {
      this.flags.add(flag);
    }
    this.cancel();
  }

  check(when: FlagCondition): boolean {
    return checkCondition(this.flags, when);
  }

  /** Un script est en cours. */
  get busy(): boolean {
    return this.running !== null;
  }

  /** Commandes de Céleste suspendues (script bloquant en cours). */
  get locked(): boolean {
    return this.running?.lock ?? false;
  }

  /** Identifiant du script en cours (debug), sinon null. */
  get runningId(): string | null {
    return this.running?.id ?? null;
  }

  timeOfDay(): TimeOfDay {
    for (const rule of this.data.times) {
      if (this.check(rule.when)) {
        return rule.time;
      }
    }
    return 'evening';
  }

  /**
   * Sortie fermée (ce n'est pas le moment de sortir, ou la porte ne s'ouvre pas encore). Sans
   * `exit`, vrai si toutes les sorties de la salle sont fermées.
   */
  exitsLocked(room: string, exit?: number): boolean {
    return this.lockOf(room, exit) !== null;
  }

  /** Personnage qui rappelle que la sortie est fermée (null : Céleste elle-même). */
  lockSpeaker(room: string, exit?: number): string | null {
    return this.lockOf(room, exit)?.speaker ?? null;
  }

  /** Porte fermée qu'on ne montre pas comme une porte (D-90). */
  doorHidden(room: string, door: number): boolean {
    return this.lockOf(room, door)?.hidden === true;
  }

  /** Bulle d'une sortie fermée. */
  lockIcon(room: string, exit?: number): ThoughtIcon {
    return this.lockOf(room, exit)?.icon ?? 'bed';
  }

  private lockOf(room: string, exit?: number): StoryData['lockedRooms'][number] | null {
    for (const lock of this.data.lockedRooms) {
      if (
        lock.room === room &&
        (lock.exit === undefined || lock.exit === exit) &&
        this.check(lock.when)
      ) {
        return lock;
      }
    }
    return null;
  }

  /** Salle qui roule en ce moment (le train en route, D-85). */
  moving(room: string): boolean {
    for (const rule of this.data.moving ?? []) {
      if (rule.room === room && this.check(rule.when)) {
        return true;
      }
    }
    return false;
  }

  /** Lumières éteintes dans la salle (la nuit dans le train, D-85). */
  dim(room: string): boolean {
    for (const rule of this.data.dim ?? []) {
      if (rule.room === room && this.check(rule.when)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Présage (D-35, D-40) : étrangeté de 0 à 1 selon la distance de Céleste (x, y en px, le centre
   * de sa hitbox) au point visé.
   */
  omen(room: string, x: number, y: number): number {
    for (const omen of this.data.omens) {
      if (omen.room === room && this.check(omen.when)) {
        const dx = x / TILE_SIZE - (omen.col + 0.5);
        const dy = y / TILE_SIZE - (omen.row + 0.5);
        return Math.min(1, Math.max(0, 1 - Math.hypot(dx, dy) / omen.radius));
      }
    }
    return 0;
  }

  /** Arrête le script en cours et lève le voile (changement de salle, réapparition). */
  cancel(): void {
    this.running = null;
    this.veil = 0;
    this.veilShape = 'plain';
    this.interactable = -1;
    this.flashback = null;
    this.playing = false;
  }

  /** Fin du souvenir jouable (D-89) : le script reprend au pas suivant. */
  endPlay(): void {
    this.playing = false;
  }

  /**
   * Un pas : avance le script en cours ; sinon, cherche le déclencheur Agir à portée (lancé si
   * `interact`), puis un déclencheur de contact.
   */
  step(room: string, box: Box, interact: boolean): void {
    const left = this.lastRoom !== null && this.lastRoom !== room ? this.lastRoom : null;
    this.lastRoom = room;
    const triggers = this.data.triggers;
    if (left !== null) {
      // Salle quittée : ses déclencheurs `leave` (instantanés, ils ne bloquent rien).
      for (const t of triggers) {
        if (t.on === 'leave' && t.room === left && this.check(t.when)) {
          for (const step of t.steps) {
            this.apply(step);
          }
        }
      }
    }
    if (this.running) {
      this.advance();
      return;
    }
    this.interactable = -1;
    for (let i = 0; i < triggers.length; i++) {
      const t = triggers[i];
      if (t?.on === 'interact' && t.room === room && this.ready(t, box)) {
        this.interactable = i;
        break;
      }
    }
    const available = triggers[this.interactable];
    if (interact && available) {
      this.start(available);
      return;
    }
    for (const t of triggers) {
      if (t.on === 'touch' && t.room === room && this.ready(t, box)) {
        this.start(t);
        return;
      }
    }
  }

  private ready(trigger: StoryTrigger, box: Box): boolean {
    const area = trigger.area;
    return area !== undefined && areaOverlaps(area, box, TILE_SIZE) && this.check(trigger.when);
  }

  private start(trigger: StoryTrigger): void {
    this.running = trigger;
    this.interactable = -1;
    this.stepIndex = -1;
    this.next();
    this.advance();
  }

  /** Passe à l'étape suivante ; les étapes instantanées s'enchaînent aussitôt. */
  private next(): void {
    const trigger = this.running;
    if (!trigger) {
      return;
    }
    for (;;) {
      this.stepIndex++;
      const step = trigger.steps[this.stepIndex];
      if (!step) {
        this.running = null;
        return;
      }
      this.stepElapsed = 0;
      switch (step.do) {
        case 'fadeOut':
        case 'fadeIn':
          this.veilShape = step.shape ?? 'plain';
          this.stepTotal = msToSteps(step.ms, this.stepHz);
          this.veilFrom = this.veil;
          return;
        case 'wait':
          this.stepTotal = msToSteps(step.ms, this.stepHz);
          this.veilFrom = this.veil;
          return;
        case 'flashback':
          this.stepTotal = msToSteps(step.ms, this.stepHz);
          this.flashback = step.id;
          this.flashbackProgress = 0;
          return;
        case 'play':
          this.playing = true;
          this.host.play(step.id);
          return;
        default:
          this.apply(step);
      }
    }
  }

  /** Étape instantanée (les étapes bloquantes sont ignorées ici). */
  private apply(step: StoryStep): void {
    switch (step.do) {
      case 'flag':
        if (!this.flags.has(step.id)) {
          this.flags.add(step.id);
          this.host.flagSet(step.id);
        }
        break;
      case 'toggle':
        if (this.flags.delete(step.id)) {
          this.host.flagCleared?.(step.id);
        } else {
          this.flags.add(step.id);
          this.host.flagSet(step.id);
        }
        break;
      case 'thought':
        this.host.think(step.icon, step.ms, step.by);
        break;
      case 'place':
        this.host.place(step.col, step.row, step.facing);
        break;
      case 'room':
        this.host.room(step.room, step.col, step.row, step.facing, step.returnPoint ?? false);
        break;
      case 'pose':
        this.host.pose(step.pose);
        break;
      case 'sparkle':
        this.host.sparkle(step.area, step.ms);
        break;
      case 'shake':
        this.host.shake(step.ms, step.strength);
        break;
      case 'memory':
        this.host.memory(step.id);
        break;
      case 'hush':
        this.host.hush(step.ms);
        break;
      case 'ability':
        this.host.ability(step.id);
        break;
      case 'records':
        this.host.records?.();
        break;
      case 'look':
        this.host.look?.(step.col ?? null, step.row ?? null);
        break;
      case 'gone':
        this.host.gone?.();
        break;
      case 'glimmer':
        this.host.glimmer?.(step.ms);
        break;
      case 'end':
        this.host.end?.(step.room);
        break;
      default:
        break;
    }
  }

  /** Avance l'étape bloquante courante d'un pas. */
  private advance(): void {
    const trigger = this.running;
    const step = trigger?.steps[this.stepIndex];
    if (!step) {
      this.running = null;
      return;
    }
    if (step.do === 'play') {
      if (!this.playing) {
        this.next();
      }
      return;
    }
    this.stepElapsed++;
    const k = this.stepTotal <= 0 ? 1 : Math.min(1, this.stepElapsed / this.stepTotal);
    if (step.do === 'fadeOut') {
      this.veil = this.veilFrom + (1 - this.veilFrom) * k;
    } else if (step.do === 'fadeIn') {
      this.veil = this.veilFrom * (1 - k);
    } else if (step.do === 'flashback') {
      this.flashbackProgress = k;
      if (k >= 1) {
        this.flashback = null;
      }
    }
    if (k >= 1) {
      this.next();
    }
  }
}
