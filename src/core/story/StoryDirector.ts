import { TILE_SIZE } from '../../config/display';
import type { MusicTrack } from '../../config/audio';
import type { HapticMoment } from '../../config/haptics';
import type { FlashbackId } from '../../config/memories';
import type { PlayableMemoryId } from '../../config/playableMemories';
import { PHYSICS_STEP_HZ, msToSteps } from '../../config/movement';
import { STORY_WALK_MAX_MS } from '../../config/story';
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
  /** Céleste se tourne, sans se déplacer (D-190). */
  face?(facing: 1 | -1): void;
  /** La lumière du couloir dans la sortie `exit` : la porte s'ouvre, ou se ferme (D-190). */
  door?(exit: number, open: boolean, ms: number): void;
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
  /** La console (D-166) : Céleste s'assoit, l'écran de la console s'ouvre. */
  console?(): void;
  /**
   * Regard (D-122) : la vue va vers cette tuile ; null : elle revient sur Céleste. `zoom` (D-171) :
   * elle se rapproche aussi (1 : sans rapprochement).
   */
  look?(col: number | null, row: number | null, zoom: number): void;
  /** Une vibration (D-171). */
  haptic?(moment: HapticMoment): void;
  /** Céleste est sortie de la salle (D-144) : invisible jusqu'au prochain changement de salle. */
  gone?(): void;
  /** Un très léger signe du monde étrange pendant `ms` (D-144). */
  glimmer?(ms: number): void;
  /** La fin du jeu (D-145) : « Continuer » reprendra dans `room` ; l'écran de fin, puis l'accueil. */
  end?(room: string): void;
}

/** Agir lâché (D-171) : le cœur se vide deux fois moins vite qu'il ne se remplit. */
const HOLD_DRAIN = 0.5;

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
  /**
   * Agir maintenu sur un déclencheur `hold` (D-171) : de 0 à 1, il part à 1. Dans une étape
   * `await` maintenue (D-190), il reste à 1 tant qu'on tient.
   */
  holdProgress = 0;
  /** Un souvenir jouable est en cours (D-89) : le script attend `endPlay`. */
  playing = false;
  /** Céleste marche dans un script (étape `walk`, D-190) : -1 ou 1 ; 0 sinon. */
  walkX = 0;
  /** Hitbox de Céleste au dernier pas (l'étape `walk`). */
  private box: Box | null = null;
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

  /**
   * La musique voulue par l'histoire (D-171) : la piste de la première règle vraie, `null` pour le
   * silence ; `undefined` : celle de la salle.
   */
  music(): MusicTrack | null | undefined {
    for (const rule of this.data.music ?? []) {
      if (this.check(rule.when)) {
        return rule.track;
      }
    }
    return undefined;
  }

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

  /** L'étape `await` en cours (D-190) : le script attend Agir ; sinon null. */
  get awaiting(): Extract<StoryStep, { do: 'await' }> | null {
    const step = this.running?.steps[this.stepIndex];
    return step?.do === 'await' ? step : null;
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
    this.walkX = 0;
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
   * `interact`), puis un déclencheur de contact. `grounded` : Céleste a les pieds au sol (un
   * contact qui suspend les commandes l'attend, D-189).
   */
  step(room: string, box: Box, interact: boolean, held = false, grounded = true): void {
    const left = this.lastRoom !== null && this.lastRoom !== room ? this.lastRoom : null;
    this.lastRoom = room;
    this.box = box;
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
      this.advance(interact, held);
      return;
    }
    const before = this.interactable;
    this.interactable = -1;
    for (let i = 0; i < triggers.length; i++) {
      const t = triggers[i];
      if (t?.on === 'interact' && t.room === room && this.ready(t, box)) {
        this.interactable = i;
        break;
      }
    }
    const available = triggers[this.interactable];
    if (available?.hold !== undefined) {
      // Agir maintenu (D-171) : le cœur se remplit tant qu'il est tenu, se vide doucement sinon.
      const total = Math.max(1, msToSteps(available.hold, this.stepHz));
      const progress = this.interactable === before ? this.holdProgress : 0;
      this.holdProgress = held
        ? Math.min(1, progress + 1 / total)
        : Math.max(0, progress - HOLD_DRAIN / total);
      if (this.holdProgress >= 1) {
        this.holdProgress = 0;
        this.start(available);
        return;
      }
    } else {
      this.holdProgress = 0;
      if (interact && available) {
        this.start(available);
        return;
      }
    }
    for (const t of triggers) {
      if (
        t.on === 'touch' &&
        t.room === room &&
        (grounded || !t.lock || t.airborne === true) &&
        this.ready(t, box)
      ) {
        this.start(t);
        return;
      }
    }
  }

  /** Lance un script hors des déclencheurs de l'histoire (le voyage rapide, D-163). */
  run(trigger: StoryTrigger): void {
    this.start(trigger);
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
    this.walkX = 0;
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
        case 'await':
          this.holdProgress = 0;
          return;
        case 'walk':
          this.stepTotal = msToSteps(STORY_WALK_MAX_MS, this.stepHz);
          this.walkX = step.facing;
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
      case 'face':
        this.host.face?.(step.facing);
        break;
      case 'door':
        this.host.door?.(step.exit, step.open, step.ms);
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
      case 'console':
        this.host.console?.();
        break;
      case 'look':
        this.host.look?.(step.col ?? null, step.row ?? null, step.zoom ?? 1);
        break;
      case 'haptic':
        this.host.haptic?.(step.moment);
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

  /** Avance l'étape bloquante courante d'un pas (Agir appuyé, maintenu : l'étape `await`). */
  private advance(interact = false, held = false): void {
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
    if (step.do === 'await') {
      if (step.mode === 'press') {
        if (interact) {
          this.next();
        }
        return;
      }
      // Maintenu (D-190) : le cœur se remplit, reste plein tant qu'on tient ; lâché plein, le
      // script reprend ; lâché avant, il se vide doucement (comme D-171).
      const total = Math.max(1, msToSteps(step.ms ?? 0, this.stepHz));
      if (held) {
        this.holdProgress = Math.min(1, this.holdProgress + 1 / total);
      } else if (this.holdProgress >= 1) {
        this.holdProgress = 0;
        this.next();
      } else {
        this.holdProgress = Math.max(0, this.holdProgress - HOLD_DRAIN / total);
      }
      return;
    }
    this.stepElapsed++;
    if (step.do === 'walk') {
      // Arrivée quand le milieu de sa hitbox passe la colonne, ou au bout du temps permis.
      const box = this.box;
      const x = box ? (box.x + box.width / 2) / TILE_SIZE : step.col + 0.5;
      if ((x - (step.col + 0.5)) * step.facing >= 0 || this.stepElapsed >= this.stepTotal) {
        this.walkX = 0;
        this.next();
      }
      return;
    }
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
