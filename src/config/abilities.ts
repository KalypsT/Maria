/**
 * Capacités de mouvement (spec §15, D-26, D-44). Liste ouverte (§45) : escalade et saut mural.
 * L'identifiant est enregistré dans `progression.abilities` et nommé dans les salles
 * (`; @ability:`).
 */
export const Ability = { Climb: 'climb', WallJump: 'wall-jump' } as const;
export type Ability = (typeof Ability)[keyof typeof Ability];

/**
 * Indice affiché à l'obtention (PLACEHOLDER : aide de prototype, à revoir avec la narration ;
 * pas de texte explicatif dans le jeu final, pilier 6).
 */
export const ABILITY_HINTS: Readonly<Record<Ability, string>> = {
  climb: 'Sauter vers un rebord trop haut en poussant vers lui : Céleste s’y accroche et se hisse.',
  'wall-jump':
    'En l’air, pousser vers un mur : Céleste glisse contre lui. Sauter : elle rebondit de l’autre côté.',
};

/** Durée d'affichage de l'indice (ms). */
export const ABILITY_HINT_MS = 5000;

export function isAbility(id: string): id is Ability {
  return Object.values(Ability).includes(id as Ability);
}
