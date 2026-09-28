import { CAMERA_PARAM_RANGES, type CameraParams } from '../config/camera';
import { MOVEMENT_PARAM_RANGES, type MovementParams } from '../config/movement';

type ParamRanges<T> = Readonly<Record<keyof T, { min: number; max: number }>>;

/**
 * Valide des réglages lus depuis le stockage ou un import : seules les clés connues, numériques et
 * finies sont gardées, bornées aux plages de réglage.
 */
export function sanitizeOverrides<T extends object>(
  raw: unknown,
  ranges: ParamRanges<T>,
): Partial<T> {
  const result: Partial<Record<keyof T, number>> = {};
  if (typeof raw !== 'object' || raw === null) {
    return result as Partial<T>;
  }
  const source = raw as Record<string, unknown>;
  for (const key of Object.keys(ranges) as (keyof T & string)[]) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      const range = ranges[key];
      result[key] = Math.min(range.max, Math.max(range.min, value));
    }
  }
  return result as Partial<T>;
}

/** Paramètres dans l'ordre des plages de réglage, prêts à être reportés dans `src/config/`. */
export function orderedParams<T extends object>(
  params: Readonly<T>,
  ranges: ParamRanges<T>,
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of Object.keys(ranges) as (keyof T & string)[]) {
    ordered[key] = params[key];
  }
  return ordered;
}

export function sanitizeMovementOverrides(raw: unknown): Partial<MovementParams> {
  return sanitizeOverrides<MovementParams>(raw, MOVEMENT_PARAM_RANGES);
}

export function sanitizeCameraOverrides(raw: unknown): Partial<CameraParams> {
  return sanitizeOverrides<CameraParams>(raw, CAMERA_PARAM_RANGES);
}

/** JSON des paramètres de mouvement, prêt à être reporté dans `src/config/movement.ts`. */
export function movementToJson(params: Readonly<MovementParams>): string {
  return JSON.stringify(orderedParams(params, MOVEMENT_PARAM_RANGES), null, 2);
}

/** JSON des paramètres de caméra, prêt à être reporté dans `src/config/camera.ts`. */
export function cameraToJson(params: Readonly<CameraParams>): string {
  return JSON.stringify(orderedParams(params, CAMERA_PARAM_RANGES), null, 2);
}
