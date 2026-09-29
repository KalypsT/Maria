/**
 * Animation de Céleste en « papier découpé » (D-29) : réglages visuels seulement, jamais la
 * physique. Allure validée : sobre avec un peu de vie. PROVISOIRE : à régler sur téléphone.
 */
export interface PuppetParams {
  /** Distance parcourue pour un cycle complet de pas (px) : les pieds ne glissent pas. */
  strideLengthPx: number;
  /** Amplitude des jambes en course (degrés). */
  legSwingDeg: number;
  /** Amplitude des bras en course (degrés), en opposition aux jambes. */
  armSwingDeg: number;
  /** Rebond du corps à chaque pas (px). */
  runBobPx: number;
  /** Période de la respiration à l'arrêt (ms) et son amplitude (px). */
  breathMs: number;
  breathPx: number;
  /** Constante de temps du passage d'une pose à l'autre (ms). */
  blendMs: number;
  /** Couettes : fréquence du ressort (Hz), amortissement (1 = sans rebond), inclinaison max (degrés). */
  pigtailHz: number;
  pigtailDamping: number;
  pigtailMaxDeg: number;
  /** Suspendue : balancement des jambes (degrés) et sa période (ms). */
  hangSwingDeg: number;
  hangSwingMs: number;
}

export const DEFAULT_PUPPET: Readonly<PuppetParams> = {
  strideLengthPx: 30,
  legSwingDeg: 30,
  armSwingDeg: 22,
  runBobPx: 0.8,
  breathMs: 2600,
  breathPx: 0.4,
  blendMs: 60,
  pigtailHz: 3.5,
  pigtailDamping: 0.35,
  pigtailMaxDeg: 40,
  hangSwingDeg: 6,
  hangSwingMs: 1800,
};

export const PUPPET_PARAM_RANGES: Readonly<
  Record<keyof PuppetParams, { min: number; max: number; step: number }>
> = {
  strideLengthPx: { min: 10, max: 80, step: 1 },
  legSwingDeg: { min: 0, max: 60, step: 1 },
  armSwingDeg: { min: 0, max: 60, step: 1 },
  runBobPx: { min: 0, max: 3, step: 0.1 },
  breathMs: { min: 800, max: 6000, step: 100 },
  breathPx: { min: 0, max: 1.5, step: 0.1 },
  blendMs: { min: 0, max: 300, step: 10 },
  pigtailHz: { min: 0.5, max: 10, step: 0.5 },
  pigtailDamping: { min: 0.05, max: 1.5, step: 0.05 },
  pigtailMaxDeg: { min: 0, max: 90, step: 1 },
  hangSwingDeg: { min: 0, max: 20, step: 1 },
  hangSwingMs: { min: 400, max: 5000, step: 100 },
};
