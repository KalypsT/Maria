import type { ThoughtIcon } from '../core/story/story';

/**
 * Capacités de mouvement (spec §15, D-26, D-44, D-62, D-65). Liste ouverte (§45) : escalade, saut
 * mural, parapluie, et le crochet qui s'ajoute au parapluie (une extension, pas une capacité de
 * plus : il ne sert qu'en planant).
 * L'identifiant est enregistré dans `progression.abilities` et nommé dans les salles
 * (`; @ability:`).
 */
export const Ability = {
  Climb: 'climb',
  WallJump: 'wall-jump',
  Umbrella: 'umbrella',
  Hook: 'hook',
} as const;
export type Ability = (typeof Ability)[keyof typeof Ability];

/**
 * Indice affiché à l'obtention (PLACEHOLDER : aide de prototype, à revoir avec la narration ;
 * pas de texte explicatif dans le jeu final, pilier 6).
 */
export const ABILITY_HINTS: Readonly<Record<Ability, string>> = {
  climb: 'Sauter vers un rebord trop haut en poussant vers lui : Céleste s’y accroche et se hisse.',
  'wall-jump':
    'En l’air, pousser vers un mur : Céleste glisse contre lui. Sauter : elle rebondit de l’autre côté.',
  umbrella:
    'Garder Saut appuyé : en haut du saut, le parapluie s’ouvre et Céleste plane (ou appuyer encore sur Saut en l’air). Lâcher : il se referme.',
  hook: 'En planant, passer sur un câble : le crochet du parapluie s’y accroche et Céleste glisse. Lâcher Saut : elle lâche. Lâcher et vite rappuyer : elle saute.',
};

/**
 * Bulle d'aide à l'obtention (D-62, demande de l'utilisateur) : un pictogramme au-dessus de
 * Céleste qui montre le geste. Aussi dans la page « Mes capacités » du cahier.
 */
export const ABILITY_HELP_ICONS: Readonly<Partial<Record<Ability, ThoughtIcon>>> = {
  umbrella: 'umbrella',
  hook: 'hook',
};

/** Durée d'affichage de l'indice (ms). */
export const ABILITY_HINT_MS = 5000;

export function isAbility(id: string): id is Ability {
  return Object.values(Ability).includes(id as Ability);
}
