import type { CombatParams } from '../../config/combat';
import { TILE_SIZE as T } from '../../config/display';
import { msToSteps } from '../../config/movement';
import { LayerMask, type LevelErase } from '../level/LevelData';
import { groupBottom, initialMasks, isWave, toggledMask } from '../level/erase';

/** Événements du dernier pas de l'effacement (masque de bits). */
export const EraseEvent = { None: 0, Announced: 1, Changed: 2 } as const;

/** Ce que l'effacement demande au jeu : un groupe peut-il prendre ces couches maintenant ? */
export interface EraseHost {
  /**
   * Faux si le groupe apparaîtrait là où se trouve Céleste (dans la couche où elle est) :
   * l'apparition attend qu'elle soit partie. Rien ne bouge, rien n'apparaît sur elle.
   */
  canApply(group: number, mask: number): boolean;
}

/**
 * L'effacement (D-111), pur et sans Phaser : les couches de chaque groupe (`masks`), les annonces
 * en cours et leur cible. La berceuse (D-140) est faite de vagues seulement : des étoiles qui
 * s'allument et s'éteignent, à leur propre rythme (`lullabyBeatMs`, `lullabyWarnMs`). Deux
 * mécanismes :
 * - **les bandes** (salle avec une poursuite vers le haut) : quand l'effacement qui monte (le front
 *   de la poursuite) arrive à `eraseLeadTiles` sous une bande, elle blanchit pendant `eraseWarnMs`,
 *   puis quitte le présent (elle reste dans le souvenir) ;
 * - **les vagues** : toutes les `eraseWaveMs / eraseSpeedScale`, l'étape suivante (en boucle) est
 *   annoncée, puis ses groupes passent d'une couche à l'autre.
 *
 * Une apparition qui tomberait sur Céleste attend (`EraseHost.canApply`). Aucune allocation dans
 * `step`.
 */
export class EraseState {
  /** Couches actuelles de chaque groupe (ordre de `data.groups`). */
  readonly masks: Uint8Array;
  /** Couches visées par l'annonce en cours de chaque groupe (-1 : aucune). */
  readonly target: Int16Array;
  /** Pas restants de l'annonce de chaque groupe (0 : prête à s'appliquer). */
  readonly warn: Int32Array;
  /** Durée totale de l'annonce en cours de chaque groupe (pas), pour l'affichage. */
  readonly warnTotal: Int32Array;
  /** Événements du dernier pas (`EraseEvent`). */
  events = 0;
  /** Changements de motif depuis le chargement : la salle à jour se reconstruit quand il change. */
  version = 0;
  /** Facteur de vitesse des vagues venu de l'histoire (D-117, `eraseFactor`). */
  private factor = 1;
  /** Étape suivante des vagues, et pas avant elle. */
  private nextStep = 0;
  private stepTimer = 0;
  private readonly wave: Uint8Array;
  /** Groupes de chaque étape des vagues (indices). */
  private readonly stepGroups: readonly Int16Array[];
  private readonly bottoms: Float64Array;
  /** Les étoiles de la berceuse (D-140) : leur rythme, pas celui de l'effacement. */
  private readonly stars: boolean;

  constructor(
    readonly data: LevelErase,
    private params: Readonly<CombatParams>,
    private readonly stepHz: number,
  ) {
    const n = data.groups.length;
    this.masks = initialMasks(data);
    this.target = new Int16Array(n).fill(-1);
    this.warn = new Int32Array(n);
    this.warnTotal = new Int32Array(n);
    this.wave = Uint8Array.from(data.groups, (g) => (isWave(data, g.id) ? 1 : 0));
    this.bottoms = Float64Array.from(data.groups, (g) => groupBottom(g));
    this.stepGroups = data.steps.map((step) =>
      Int16Array.from(step, (id) => data.groups.findIndex((g) => g.id === id)),
    );
    this.stars = data.look === 'stars';
    this.reset();
  }

  setParams(params: Readonly<CombatParams>): void {
    this.params = params;
  }

  /**
   * L'effacement recule (D-117) : les annonces en cours s'éteignent, la vague suivante repart d'une
   * période entière, à la nouvelle vitesse (`factor`). Les couches ne changent pas (rien n'apparaît
   * sur Céleste).
   */
  recoil(factor: number): void {
    this.factor = factor;
    this.target.fill(-1);
    this.warn.fill(0);
    this.stepTimer = this.waveSteps();
  }

  /** Retour au départ (chargement de la salle, réapparition). */
  reset(): void {
    this.factor = 1;
    this.masks.set(initialMasks(this.data));
    this.target.fill(-1);
    this.warn.fill(0);
    this.nextStep = 0;
    this.stepTimer = this.waveSteps();
    this.events = 0;
    this.version++;
  }

  private waveSteps(): number {
    const p = this.params;
    if (this.stars) {
      return Math.max(1, msToSteps(p.lullabyBeatMs, this.stepHz));
    }
    const scale = Math.max(0.05, p.eraseSpeedScale * this.factor);
    return Math.max(1, msToSteps(p.eraseWaveMs / scale, this.stepHz));
  }

  /** Annonce du groupe : de 0 (rien) à 1 (il va changer à l'instant). */
  announce(group: number): number {
    const total = this.warnTotal[group] ?? 0;
    if ((this.target[group] ?? -1) < 0 || total <= 0) {
      return 0;
    }
    return 1 - (this.warn[group] ?? 0) / total;
  }

  /**
   * Un pas. `front` : le haut de l'effacement qui monte (px, la poursuite), null sans poursuite.
   */
  step(front: number | null, host: EraseHost): number {
    this.events = 0;
    const p = this.params;
    const warnMs = this.stars ? p.lullabyWarnMs : p.eraseWarnMs;
    const warnSteps = Math.max(1, msToSteps(warnMs, this.stepHz));
    const n = this.masks.length;
    // Les bandes : l'effacement qui monte arrive sous elles.
    if (front !== null) {
      const lead = p.eraseLeadTiles * T;
      for (let i = 0; i < n; i++) {
        const mask = this.masks[i] ?? 0;
        if (
          !this.wave[i] &&
          (mask & LayerMask.Present) !== 0 &&
          (this.target[i] ?? -1) < 0 &&
          front <= (this.bottoms[i] ?? 0) + lead
        ) {
          this.begin(i, mask & ~LayerMask.Present, warnSteps);
        }
      }
    }
    // Les vagues : l'étape suivante, à son heure.
    const steps = this.stepGroups;
    if (steps.length > 0 && --this.stepTimer <= 0) {
      this.stepTimer = this.waveSteps();
      const step = steps[this.nextStep];
      this.nextStep = (this.nextStep + 1) % steps.length;
      for (let k = 0; step && k < step.length; k++) {
        const i = step[k] ?? -1;
        const mask = this.masks[i] ?? 0;
        if (i >= 0 && (this.target[i] ?? -1) < 0) {
          this.begin(i, toggledMask(mask), warnSteps);
        }
      }
    }
    // Les annonces arrivées à leur terme s'appliquent (une apparition sur Céleste attend).
    for (let i = 0; i < n; i++) {
      const target = this.target[i] ?? -1;
      if (target < 0) {
        continue;
      }
      if ((this.warn[i] ?? 0) > 0) {
        this.warn[i] = (this.warn[i] ?? 0) - 1;
        continue;
      }
      if (host.canApply(i, target)) {
        this.masks[i] = target;
        this.target[i] = -1;
        this.events |= EraseEvent.Changed;
        this.version++;
      }
    }
    return this.events;
  }

  private begin(group: number, target: number, warnSteps: number): void {
    this.target[group] = target;
    this.warn[group] = warnSteps;
    this.warnTotal[group] = warnSteps;
    this.events |= EraseEvent.Announced;
  }
}
