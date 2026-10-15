import { CRASH_GUARD } from '../../config/perf';

/**
 * Le jeu est-il figé après une erreur (D-182) ? Vrai quand l'appli est visible et qu'aucune image
 * n'a été rendue depuis l'erreur, pendant au moins `stallMs`. Pur et testé.
 */
export function looksFrozen(
  now: number,
  errorAt: number,
  lastFrameAt: number,
  hidden: boolean,
  stallMs: number = CRASH_GUARD.stallMs,
): boolean {
  return !hidden && lastFrameAt <= errorAt && now - errorAt >= stallMs;
}

/** Le détail d'une erreur, sur une ligne courte (affiché en petit sous le message). */
export function errorDetail(
  reason: unknown,
  maxChars: number = CRASH_GUARD.detailMaxChars,
): string {
  let text: string;
  if (reason instanceof Error) {
    text = `${reason.name}: ${reason.message}`;
  } else if (typeof reason === 'string') {
    text = reason;
  } else {
    try {
      // `undefined` (une fonction, `undefined` lui-même) malgré le type déclaré.
      const json = JSON.stringify(reason) as string | undefined;
      text = json ?? String(reason);
    } catch {
      text = String(reason);
    }
  }
  const line = text.replace(/\s+/g, ' ').trim();
  return line.length > maxChars ? `${line.slice(0, maxChars - 1)}…` : line;
}
