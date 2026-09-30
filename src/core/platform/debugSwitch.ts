/**
 * Adresse de l'autre version (D-59) : le build de debug est publié sous `debug/` (D-12). En dev,
 * les outils sont déjà là : « quitter » ramène à la même adresse.
 */
export function debugSwitchUrl(base: string, debugTools: boolean): string {
  if (!debugTools) {
    return `${base}debug/`;
  }
  return base.endsWith('/debug/') ? base.slice(0, -'debug/'.length) : base;
}
