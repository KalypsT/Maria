import { PLAYER_HITBOX, type MovementParams } from './movement';
import { StoryFlag } from './story';

/**
 * Croissance de Céleste (spec §7, §16, D-43). Physique commune (pilier 7) : une phase ne change que
 * la hitbox, quelques paramètres de mouvement (en facteurs, pour que les réglages en direct du
 * debug restent valables) et l'allure de la marionnette. La phase se déduit des drapeaux de
 * l'histoire (déjà sauvegardés : aucune migration).
 *
 * PROVISOIRE : valeurs à régler sur téléphone (§45). Contraintes vérifiées par les tests : hauteur
 * < 2 tuiles (tous les couloirs de 2 restent praticables), chaque salle reste praticable.
 */
export interface GrowthPhase {
  /** Numéro de la phase (1 : petite enfance). */
  readonly id: number;
  /** Drapeau d'histoire qui ouvre la phase (null : phase de départ). */
  readonly flag: string | null;
  /** Hitbox (px) : largeur < 1 tuile, hauteur < 2 tuiles. */
  readonly hitbox: { readonly width: number; readonly height: number };
  /** Facteurs appliqués aux paramètres de mouvement. */
  readonly movementScale: Readonly<Partial<Record<keyof MovementParams, number>>>;
  /** Marionnette : allongement du corps (torse, jambes, bras) ; la tête ne grandit pas. */
  readonly bodyScale: number;
  /** Allongement des couettes (même coiffure, un peu plus longue). */
  readonly hairScale: number;
  /** Tenue (PLACEHOLDER d'après les illustrations de l'utilisateur, D-41, D-43). */
  readonly outfit: CelesteOutfit;
}

export type CelesteOutfit = 'pyjama' | 'dress';

const FIRST_PHASE: GrowthPhase = {
  id: 1,
  flag: null,
  hitbox: PLAYER_HITBOX,
  movementScale: {},
  bodyScale: 1,
  hairScale: 1,
  outfit: 'pyjama',
};

export const GROWTH_PHASES: readonly GrowthPhase[] = [
  FIRST_PHASE,
  {
    // Quelques mois plus tard : un peu plus grande, un saut un peu plus haut. Assez pour se
    // hisser sur un rebord de 6 tuiles (hors de portée en phase 1), pas plus.
    id: 2,
    flag: StoryFlag.Grown,
    hitbox: { width: 12, height: 26 },
    movementScale: { jumpHeightTiles: 1.2, maxRunSpeed: 1.03 },
    bodyScale: 1.25,
    hairScale: 1.3,
    outfit: 'dress',
  },
];

/** Phase atteinte d'après les drapeaux de l'histoire (la plus avancée dont le drapeau est posé). */
export function growthPhase(flags: ReadonlySet<string>): GrowthPhase {
  let phase = FIRST_PHASE;
  for (const candidate of GROWTH_PHASES) {
    if (candidate.flag === null || flags.has(candidate.flag)) {
      phase = candidate;
    }
  }
  return phase;
}

/** Paramètres de mouvement d'une phase, d'après les paramètres de base (réglés en direct). */
export function phaseMovement(
  base: Readonly<MovementParams>,
  phase: GrowthPhase,
  out: MovementParams = { ...base },
): MovementParams {
  Object.assign(out, base);
  for (const key of Object.keys(phase.movementScale) as (keyof MovementParams)[]) {
    out[key] = base[key] * (phase.movementScale[key] ?? 1);
  }
  return out;
}
