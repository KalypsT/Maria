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
   * Poursuite (boss, D-67, D-70, D-87), verticale ou horizontale. Au départ et après une
   * réapparition, il attend `chaseStartDelayMs` puis avance à vitesse constante (celle de la salle ×
   * `chaseSpeedScale`).
   */
  chaseStartDelayMs: number;
  /** Facteur sur la vitesse d'avance (réglage en direct). */
  chaseSpeedScale: number;
  /**
   * Rattrapage doux (D-70) : au-delà de `chaseCatchUpGapTiles` derrière Céleste, il
   * accélère de `chaseCatchUpRate` tuiles/s par tuile de retard en plus, sans dépasser
   * `chaseCatchUpMaxSpeed` tuiles/s. Jamais de saut.
   */
  chaseCatchUpGapTiles: number;
  chaseCatchUpRate: number;
  chaseCatchUpMaxSpeed: number;
  /** À la réapparition, il repart à cette distance derrière Céleste (sous ses pieds, ou dans son dos ; tuiles). */
  chaseRestartGapTiles: number;
  /** Contact : Céleste rebondit vers le haut (px/s), il s'arrête (ms) sans reculer (D-120). */
  chaseContactBounceY: number;
  chaseContactPauseMs: number;
  /**
   * Contact d'une poursuite horizontale (D-87) : Céleste est poussée en avant, dans le sens de la
   * fuite (px/s), et un peu vers le haut (px/s), au lieu du rebond vertical.
   */
  chaseContactPushX: number;
  chaseContactHopY: number;
  /**
   * Poursuite horizontale (D-87) : attente au départ (ms) et écart dans le dos de Céleste (tuiles),
   * plus courts qu'à la verticale : Céleste court vite et les tronçons entre lanternes sont courts.
   */
  chaseSideStartDelayMs: number;
  chaseSideRestartGapTiles: number;
  /** Croc-en-jambe (passage qui le fait trébucher) : il s'arrête ce temps-là (ms). */
  chaseTripPauseMs: number;
  /**
   * Le rythme de la vague (D-103), une poursuite à l'allure de vague (`; @chase-look: wave`) : elle
   * déferle pendant `surgeMs` (à la vitesse de la salle), puis reste sur place pendant `backwashMs`
   * (le reflux, sans recul, D-120) ; et ainsi de suite. Le reflux laisse le temps de monter une
   * cheminée. Ni le rattrapage doux ni le contact ne jouent pendant le reflux.
   */
  surgeMs: number;
  backwashMs: number;
  /**
   * L'effacement (D-111) : une plateforme qui va quitter une couche blanchit pendant `eraseWarnMs`,
   * puis s'efface. Les vagues se suivent toutes les `eraseWaveMs` (divisé par `eraseSpeedScale`,
   * que le boss augmente quand il accélère). Une bande quitte le présent quand l'effacement qui monte
   * arrive à `eraseLeadTiles` tuiles sous elle.
   */
  eraseWarnMs: number;
  eraseWaveMs: number;
  eraseSpeedScale: number;
  eraseLeadTiles: number;
  /**
   * Tunnels sur le toit du train (D-86), danger simple : un tunnel arrive toutes les
   * `tunnelPeriodMs`, annoncé pendant `tunnelWarnMs` (sa bouche approche, l'image s'assombrit),
   * puis le train est dedans pendant `tunnelPassMs`. Debout sur le toit, Céleste est repoussée vers
   * l'arrière et la peur monte ; couchée (glissade) ou à l'abri entre deux voitures, rien.
   */
  tunnelPeriodMs: number;
  tunnelWarnMs: number;
  tunnelPassMs: number;
  /** Poussée du tunnel : vers l'arrière (px/s) et vers le bas (px/s). */
  tunnelPushX: number;
  tunnelPushY: number;
  /**
   * Les vagues sur les rochers (D-99), à marée haute seulement : toutes les `wavePeriodMs`, annoncées
   * pendant `waveWarnMs` (la mer se retire, l'écume monte), puis le paquet de mer balaie pendant
   * `wavePassMs` tout ce qui a les pieds sous la ligne des vagues (`; @waves: ligne sens`) : Céleste
   * est repoussée vers la terre et un peu soulevée, la peur monte (une fois par vague). Plus haut,
   * rien.
   */
  wavePeriodMs: number;
  waveWarnMs: number;
  wavePassMs: number;
  /** Poussée de la vague : vers la terre (px/s) et vers le haut (px/s). */
  wavePushX: number;
  wavePushY: number;
  /**
   * Les chaises volantes de la fête (D-101), `; @sweep:` : elles tournent haut, descendent pendant
   * `sweepWarnMs`, puis balaient leur zone pendant `sweepPassMs` (toutes les `sweepPeriodMs`) :
   * Céleste qui y est (debout) est renversée en arrière, la peur monte, une fois par passage.
   * Couchée (glissade), elle passe dessous.
   */
  sweepPeriodMs: number;
  sweepWarnMs: number;
  sweepPassMs: number;
  /** Poussée des chaises : vers l'arrière (px/s) et vers le haut (px/s). */
  sweepPushX: number;
  sweepPushY: number;
  /**
   * Valises qui tombent des filets dans les virages (D-86) : toutes les `luggagePeriodMs`, la
   * valise tremble sur son filet pendant `luggageWarnMs`, puis tombe (gravité `luggageGravity`),
   * reste un instant au sol (`luggageLieMs`) et disparaît. Touchée en tombant : recul, la peur monte.
   */
  luggagePeriodMs: number;
  luggageWarnMs: number;
  luggageGravity: number;
  luggageLieMs: number;
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
  chaseContactPauseMs: 1200,
  chaseContactPushX: 220,
  chaseContactHopY: 240,
  chaseSideStartDelayMs: 1200,
  chaseSideRestartGapTiles: 6,
  chaseTripPauseMs: 2500,
  surgeMs: 2000,
  backwashMs: 1500,
  eraseWarnMs: 1200,
  eraseWaveMs: 4000,
  eraseSpeedScale: 1,
  eraseLeadTiles: 5,
  tunnelPeriodMs: 10000,
  tunnelWarnMs: 2600,
  tunnelPassMs: 2400,
  tunnelPushX: 220,
  tunnelPushY: 60,
  wavePeriodMs: 7000,
  waveWarnMs: 2200,
  wavePassMs: 1100,
  wavePushX: 140,
  wavePushY: 160,
  sweepPeriodMs: 4200,
  sweepWarnMs: 1000,
  sweepPassMs: 1500,
  sweepPushX: 170,
  sweepPushY: 120,
  luggagePeriodMs: 6500,
  luggageWarnMs: 1400,
  luggageGravity: 1100,
  luggageLieMs: 700,
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
  chaseContactPauseMs: { min: 0, max: 5000, step: 100 },
  chaseContactPushX: { min: 0, max: 500, step: 10 },
  chaseContactHopY: { min: 0, max: 600, step: 10 },
  chaseSideStartDelayMs: { min: 0, max: 6000, step: 100 },
  chaseSideRestartGapTiles: { min: 2, max: 30, step: 1 },
  chaseTripPauseMs: { min: 0, max: 8000, step: 100 },
  surgeMs: { min: 500, max: 8000, step: 100 },
  backwashMs: { min: 0, max: 5000, step: 100 },
  eraseWarnMs: { min: 200, max: 4000, step: 50 },
  eraseWaveMs: { min: 1000, max: 12000, step: 100 },
  eraseSpeedScale: { min: 0.3, max: 3, step: 0.05 },
  eraseLeadTiles: { min: 0, max: 20, step: 0.5 },
  tunnelPeriodMs: { min: 3000, max: 30000, step: 500 },
  tunnelWarnMs: { min: 500, max: 6000, step: 100 },
  tunnelPassMs: { min: 300, max: 6000, step: 100 },
  tunnelPushX: { min: 0, max: 600, step: 10 },
  tunnelPushY: { min: 0, max: 400, step: 10 },
  wavePeriodMs: { min: 3000, max: 30000, step: 500 },
  waveWarnMs: { min: 500, max: 6000, step: 100 },
  wavePassMs: { min: 300, max: 6000, step: 100 },
  wavePushX: { min: 0, max: 600, step: 10 },
  wavePushY: { min: 0, max: 600, step: 10 },
  sweepPeriodMs: { min: 1500, max: 20000, step: 100 },
  sweepWarnMs: { min: 200, max: 4000, step: 100 },
  sweepPassMs: { min: 200, max: 6000, step: 100 },
  sweepPushX: { min: 0, max: 600, step: 10 },
  sweepPushY: { min: 0, max: 600, step: 10 },
  luggagePeriodMs: { min: 2000, max: 20000, step: 250 },
  luggageWarnMs: { min: 200, max: 4000, step: 100 },
  luggageGravity: { min: 300, max: 3000, step: 50 },
  luggageLieMs: { min: 0, max: 3000, step: 100 },
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

/**
 * Tunnels (D-86) : au-dessus de la ligne du toit (`; @tunnel: ligne`), moins cette marge, tout est
 * balayé. Debout (28 px), la tête dépasse ; couchée (12 px), non ; entre deux voitures, plus bas,
 * non plus.
 */
export const TUNNEL_CLEAR_PX = 18;

/** Moment d'un danger à cycle (tunnel), comme les trains : calme, annonce, passage. */
export function cyclePhase(ms: number, period: number, warn: number, pass: number): TrainPhase {
  const span = Math.max(period, warn + pass + 1);
  const t = ((ms % span) + span) % span;
  const calm = span - warn - pass;
  return t < calm ? TrainPhase.Calm : t < calm + warn ? TrainPhase.Warning : TrainPhase.Passing;
}

/** Avancement de l'annonce (0 → 1) d'un danger à cycle, ou -1 hors de l'annonce. */
export function cycleWarnProgress(ms: number, period: number, warn: number, pass: number): number {
  const span = Math.max(period, warn + pass + 1);
  const t = ((ms % span) + span) % span;
  const start = span - warn - pass;
  return t < start || t >= start + warn ? -1 : (t - start) / warn;
}

/** Taille d'une valise qui tombe (px). */
export const LUGGAGE_BOX = { width: 14, height: 10 } as const;

/** Moment d'une valise (D-86) : sur son filet, qui tremble, qui tombe, au sol, partie. */
export const LuggagePhase = { Rack: 0, Shake: 1, Fall: 2, Lie: 3 } as const;
export type LuggagePhase = (typeof LuggagePhase)[keyof typeof LuggagePhase];

/**
 * Valise `index` d'une salle, `ms` après le chargement : sa phase et la distance déjà tombée (px),
 * pour une chute de `dropPx`. Les valises d'une salle sont décalées dans le cycle.
 */
export function luggageState(
  ms: number,
  index: number,
  count: number,
  dropPx: number,
  p: Readonly<CombatParams>,
  out: { phase: LuggagePhase; fallen: number },
): void {
  const fallMs = Math.sqrt((2 * Math.max(0, dropPx)) / p.luggageGravity) * 1000;
  const span = Math.max(p.luggagePeriodMs, p.luggageWarnMs + fallMs + p.luggageLieMs + 1);
  const offset = (index * span) / Math.max(1, count);
  const t = (((ms + offset) % span) + span) % span;
  const calm = span - p.luggageWarnMs - fallMs - p.luggageLieMs;
  out.fallen = 0;
  if (t < calm) {
    out.phase = LuggagePhase.Rack;
  } else if (t < calm + p.luggageWarnMs) {
    out.phase = LuggagePhase.Shake;
  } else if (t < calm + p.luggageWarnMs + fallMs) {
    const s = (t - calm - p.luggageWarnMs) / 1000;
    out.phase = LuggagePhase.Fall;
    out.fallen = Math.min(dropPx, 0.5 * p.luggageGravity * s * s);
  } else {
    out.phase = LuggagePhase.Lie;
    out.fallen = dropPx;
  }
}
