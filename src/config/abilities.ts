/**
 * Capacités de mouvement (spec §15, D-26). Liste ouverte (§45) : seule l'escalade existe.
 * L'identifiant est enregistré dans `progression.abilities` et nommé dans les salles
 * (`; @ability:`).
 */
export const Ability = { Climb: 'climb' } as const;
export type Ability = (typeof Ability)[keyof typeof Ability];

/**
 * Indice affiché à l'obtention (PLACEHOLDER : aide de prototype, à revoir avec la narration ;
 * pas de texte explicatif dans le jeu final, pilier 6).
 */
export const ABILITY_HINTS: Readonly<Record<Ability, string>> = {
  climb: 'Sauter vers un rebord trop haut en poussant vers lui : Céleste s’y accroche et se hisse.',
};

/** Durée d'affichage de l'indice (ms). */
export const ABILITY_HINT_MS = 5000;

export function isAbility(id: string): id is Ability {
  return Object.values(Ability).includes(id as Ability);
}
