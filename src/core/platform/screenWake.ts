/**
 * Faut-il garder l'écran allumé (D-186) ? Oui tant que l'appli est visible et qu'on a touché l'écran
 * (ou une touche) depuis moins de `idleMs`.
 */
export function wantsScreenAwake(
  now: number,
  lastInputAt: number,
  visible: boolean,
  idleMs: number,
): boolean {
  return visible && now - lastInputAt < idleMs;
}
