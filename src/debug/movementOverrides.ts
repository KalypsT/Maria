import { MOVEMENT_PARAM_RANGES, type MovementParams } from '../config/movement';

/**
 * Valide des réglages lus depuis le stockage ou un import : seules les clés connues, numériques et
 * finies sont gardées, bornées aux plages de réglage.
 */
export function sanitizeMovementOverrides(raw: unknown): Partial<MovementParams> {
  const result: Partial<MovementParams> = {};
  if (typeof raw !== 'object' || raw === null) {
    return result;
  }
  const source = raw as Record<string, unknown>;
  for (const key of Object.keys(MOVEMENT_PARAM_RANGES) as (keyof MovementParams)[]) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      const range = MOVEMENT_PARAM_RANGES[key];
      result[key] = Math.min(range.max, Math.max(range.min, value));
    }
  }
  return result;
}

/** JSON des paramètres, prêt à être reporté dans `src/config/movement.ts`. */
export function movementToJson(params: Readonly<MovementParams>): string {
  const ordered: Record<string, number> = {};
  for (const key of Object.keys(MOVEMENT_PARAM_RANGES) as (keyof MovementParams)[]) {
    ordered[key] = params[key];
  }
  return JSON.stringify(ordered, null, 2);
}
