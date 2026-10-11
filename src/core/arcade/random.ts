/**
 * Hasard reproductible de la console (D-166) : même graine, mêmes niveaux, sur tous les appareils
 * (seulement des opérations entières sur 32 bits).
 */

/** Générateur mulberry32 : un nombre dans [0, 1) à chaque appel. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

/** Graine d'un texte (FNV-1a 32 bits) : celle d'un niveau se déduit du jeu et de son numéro. */
export function seedOf(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Valeur entre `from` (t = 0) et `to` (t = 1), t borné. */
export function ramp(range: { readonly from: number; readonly to: number }, t: number): number {
  const k = Math.min(1, Math.max(0, t));
  return range.from + (range.to - range.from) * k;
}
