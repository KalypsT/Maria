/**
 * Paramètres du combat minimal (décision D-20, spec §17). PROVISOIRES : à régler sur téléphone avec
 * l'overlay de debug ; ils ne doivent jamais faire dominer le combat sur le mouvement (§50.4).
 */
export interface CombatParams {
  /** Pression d'attaque mémorisée si elle arrive pendant la récupération ou la recharge (ms). */
  attackBufferMs: number;
  /** Préparation avant que le coup ne touche (ms). */
  attackStartupMs: number;
  /** Durée pendant laquelle le coup touche (ms). */
  attackActiveMs: number;
  /** Fin du geste, sans toucher (ms). */
  attackRecoveryMs: number;
  /** Délai supplémentaire avant un nouveau coup (ms). */
  attackCooldownMs: number;
  /** Portée du coup devant la hitbox de Céleste (px). */
  attackReachPx: number;
  /** Hauteur de la zone de frappe (px). */
  attackHeightPx: number;
  /** Décalage vertical de la zone de frappe depuis le haut de la hitbox de Céleste (px). */
  attackOffsetYPx: number;
  /** Arrêt sur image quand un coup porte (ms, 0 = aucun). */
  hitstopMs: number;
  /** Recul de Céleste touchée : vitesse horizontale (px/s, à l'opposé de l'ennemi). */
  hurtKnockbackX: number;
  /** Recul de Céleste touchée : vitesse verticale vers le haut (px/s). */
  hurtKnockbackY: number;
  /** Rebond vers le haut sur un danger qui pique (px/s), pour sortir d'une fosse (D-51). */
  stingBounceY: number;
  /** Délai avant qu'un danger qui pique pique de nouveau (ms), plus court que l'invulnérabilité. */
  stingCooldownMs: number;
  /** Perte de contrôle après avoir été touchée (ms). */
  hurtControlMs: number;
  /** Invulnérabilité après avoir été touchée (ms). */
  invulnerabilityMs: number;
  /** Vitesse de marche du patrouilleur (px/s). */
  patrollerSpeed: number;
  /** Coups nécessaires pour disperser un patrouilleur (D-20 : 2). */
  patrollerHits: number;
  /** Étourdissement du patrouilleur touché : inoffensif pendant ce temps (ms). */
  patrollerStunMs: number;
  /** Recul du patrouilleur touché (px/s). */
  patrollerKnockback: number;
  /** Freinage du patrouilleur repoussé (px/s²). */
  patrollerFriction: number;
  /** Gravité et vitesse de chute du patrouilleur (px/s², px/s). */
  patrollerGravity: number;
  patrollerMaxFall: number;
  /** Araignée (D-46) : descente sous son point d'attache (tuiles). */
  spiderDropTiles: number;
  /** Araignée : durée d'une descente et d'une remontée complètes (ms). */
  spiderPeriodMs: number;
  /** Escargot (D-49) : vitesse le long de son mur (px/s). */
  snailSpeed: number;
  /** Clignotement blanc d'un ennemi touché (ms). */
  hitFlashMs: number;
  /** Tremblement de caméra à l'impact (px, 0 = désactivé : §37, pas de mouvement parasite). */
  screenShakePx: number;
  /**
   * Trains de la gare (D-66), danger simple : un train passe toutes les `trainPeriodMs`, annoncé
   * par le feu pendant `trainWarnMs`, puis passe pendant `trainPassMs`. Son souffle repousse
   * Céleste si elle est sur la voie (pas de contact avec le train lui-même).
   */
  trainPeriodMs: number;
  trainWarnMs: number;
  trainPassMs: number;
  /** Souffle du train : vitesse horizontale (sens du train) et vers le haut (px/s). */
  trainGustX: number;
  trainGustY: number;
  /**
   * Poursuite verticale (boss, D-67, D-70). Au départ et après une réapparition, il attend
   * `chaseStartDelayMs` puis monte à vitesse constante (celle de la salle × `chaseSpeedScale`).
   */
  chaseStartDelayMs: number;
  /** Facteur sur la vitesse de montée (réglage en direct). */
  chaseSpeedScale: number;
  /**
   * Rattrapage doux (D-70) : au-delà de `chaseCatchUpGapTiles` sous les pieds de Céleste, il
   * accélère de `chaseCatchUpRate` tuiles/s par tuile de retard en plus, sans dépasser
   * `chaseCatchUpMaxSpeed` tuiles/s. Jamais de saut.
   */
  chaseCatchUpGapTiles: number;
  chaseCatchUpRate: number;
  chaseCatchUpMaxSpeed: number;
  /** À la réapparition, il repart à cette distance sous les pieds de Céleste (tuiles). */
  chaseRestartGapTiles: number;
  /** Contact : Céleste rebondit vers le haut (px/s), il recule (tuiles) et s'arrête (ms). */
  chaseContactBounceY: number;
  chaseContactRecoilTiles: number;
  chaseContactPauseMs: number;
  /** Croc-en-jambe (passage qui le fait trébucher) : il s'arrête ce temps-là (ms). */
  chaseTripPauseMs: number;
}

export const DEFAULT_COMBAT: Readonly<CombatParams> = {
  attackBufferMs: 100,
  attackStartupMs: 40,
  attackActiveMs: 100,
  attackRecoveryMs: 120,
  attackCooldownMs: 60,
  attackReachPx: 18,
  attackHeightPx: 16,
  attackOffsetYPx: 2,
  hitstopMs: 50,
  hurtKnockbackX: 150,
  hurtKnockbackY: 200,
  stingBounceY: 360,
  stingCooldownMs: 500,
  hurtControlMs: 200,
  invulnerabilityMs: 1000,
  patrollerSpeed: 32,
  patrollerHits: 2,
  patrollerStunMs: 1000,
  patrollerKnockback: 140,
  patrollerFriction: 700,
  patrollerGravity: 1400,
  patrollerMaxFall: 380,
  spiderDropTiles: 3,
  spiderPeriodMs: 3800,
  snailSpeed: 20,
  hitFlashMs: 100,
  screenShakePx: 0,
  trainPeriodMs: 9000,
  trainWarnMs: 2000,
  trainPassMs: 1600,
  trainGustX: 260,
  trainGustY: 300,
  chaseStartDelayMs: 2500,
  chaseSpeedScale: 1,
  chaseCatchUpGapTiles: 12,
  chaseCatchUpRate: 0.4,
  chaseCatchUpMaxSpeed: 6,
  chaseRestartGapTiles: 9,
  chaseContactBounceY: 420,
  chaseContactRecoilTiles: 3,
  chaseContactPauseMs: 1200,
  chaseTripPauseMs: 2500,
};

export const COMBAT_PARAM_RANGES: Readonly<
  Record<keyof CombatParams, { min: number; max: number; step: number }>
> = {
  attackBufferMs: { min: 0, max: 250, step: 5 },
  attackStartupMs: { min: 0, max: 200, step: 5 },
  attackActiveMs: { min: 10, max: 300, step: 5 },
  attackRecoveryMs: { min: 0, max: 400, step: 5 },
  attackCooldownMs: { min: 0, max: 400, step: 5 },
  attackReachPx: { min: 4, max: 48, step: 1 },
  attackHeightPx: { min: 4, max: 40, step: 1 },
  attackOffsetYPx: { min: -16, max: 20, step: 1 },
  hitstopMs: { min: 0, max: 150, step: 5 },
  hurtKnockbackX: { min: 0, max: 400, step: 10 },
  hurtKnockbackY: { min: 0, max: 400, step: 10 },
  stingBounceY: { min: 100, max: 600, step: 10 },
  stingCooldownMs: { min: 100, max: 2000, step: 50 },
  hurtControlMs: { min: 0, max: 600, step: 10 },
  invulnerabilityMs: { min: 0, max: 3000, step: 50 },
  patrollerSpeed: { min: 0, max: 120, step: 2 },
  patrollerHits: { min: 1, max: 5, step: 1 },
  patrollerStunMs: { min: 100, max: 3000, step: 50 },
  patrollerKnockback: { min: 0, max: 400, step: 10 },
  patrollerFriction: { min: 50, max: 3000, step: 50 },
  patrollerGravity: { min: 200, max: 3000, step: 50 },
  patrollerMaxFall: { min: 100, max: 900, step: 10 },
  spiderDropTiles: { min: 0.5, max: 10, step: 0.5 },
  spiderPeriodMs: { min: 600, max: 8000, step: 100 },
  snailSpeed: { min: 2, max: 120, step: 1 },
  hitFlashMs: { min: 0, max: 400, step: 10 },
  screenShakePx: { min: 0, max: 6, step: 0.5 },
  trainPeriodMs: { min: 3000, max: 30000, step: 500 },
  trainWarnMs: { min: 300, max: 5000, step: 100 },
  trainPassMs: { min: 300, max: 4000, step: 100 },
  trainGustX: { min: 0, max: 600, step: 10 },
  trainGustY: { min: 0, max: 600, step: 10 },
  chaseStartDelayMs: { min: 0, max: 6000, step: 100 },
  chaseSpeedScale: { min: 0, max: 3, step: 0.05 },
  chaseCatchUpGapTiles: { min: 4, max: 30, step: 1 },
  chaseCatchUpRate: { min: 0, max: 3, step: 0.05 },
  chaseCatchUpMaxSpeed: { min: 1, max: 15, step: 0.5 },
  chaseRestartGapTiles: { min: 2, max: 30, step: 1 },
  chaseContactBounceY: { min: 100, max: 800, step: 10 },
  chaseContactRecoilTiles: { min: 0, max: 10, step: 0.5 },
  chaseContactPauseMs: { min: 0, max: 5000, step: 100 },
  chaseTripPauseMs: { min: 0, max: 8000, step: 100 },
};

/** Hauteur balayée par le souffle d'un train au-dessus de ses rails (tuiles, D-66). */
export const TRAIN_GUST_TILES = 3;
/** Longueur d'un train (px) : trois voitures de 9 tuiles. */
export const TRAIN_LENGTH_PX = 27 * 16;
/** Le souffle précède le train de cette distance (px). */
export const TRAIN_GUST_AHEAD_PX = 24;

/**
 * Bord gauche du train (px) quand il a parcouru `progress` (0 → 1) de son passage, d'un bout à
 * l'autre d'une salle de `roomWidthPx`, dans le sens `dir`.
 */
export function trainLeft(progress: number, roomWidthPx: number, dir: number): number {
  const span = roomWidthPx + TRAIN_LENGTH_PX;
  return dir > 0 ? -TRAIN_LENGTH_PX + progress * span : roomWidthPx - progress * span;
}

/** Moment du passage d'un train (D-66). */
export const TrainPhase = { Calm: 0, Warning: 1, Passing: 2 } as const;
export type TrainPhase = (typeof TrainPhase)[keyof typeof TrainPhase];

/**
 * Moment du cycle d'un train, `ms` après le chargement de la salle (ou la réapparition), décalé de
 * `offsetMs` (plusieurs voies ne passent pas ensemble). Le cycle commence par le calme.
 */
export function trainPhase(ms: number, offsetMs: number, p: Readonly<CombatParams>): TrainPhase {
  const period = Math.max(p.trainPeriodMs, p.trainWarnMs + p.trainPassMs + 1);
  const t = (((ms + offsetMs) % period) + period) % period;
  const calm = period - p.trainWarnMs - p.trainPassMs;
  return t < calm
    ? TrainPhase.Calm
    : t < calm + p.trainWarnMs
      ? TrainPhase.Warning
      : TrainPhase.Passing;
}

/** Avancement du train qui passe (0 → 1), ou -1 s'il ne passe pas. */
export function trainProgress(ms: number, offsetMs: number, p: Readonly<CombatParams>): number {
  const period = Math.max(p.trainPeriodMs, p.trainWarnMs + p.trainPassMs + 1);
  const t = (((ms + offsetMs) % period) + period) % period;
  const start = period - p.trainPassMs;
  return t < start ? -1 : (t - start) / p.trainPassMs;
}

/** Hitbox du patrouilleur (px, PROVISOIRE, placeholder géométrique). */
export const PATROLLER_HITBOX = { width: 14, height: 12 } as const;
/** Hitbox de l'araignée (px, PROVISOIRE). */
export const SPIDER_HITBOX = { width: 12, height: 10 } as const;
/** Hitbox de l'escargot, collé à son mur (px, PROVISOIRE). */
export const SNAIL_HITBOX = { width: 10, height: 12 } as const;
