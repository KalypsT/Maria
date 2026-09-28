/**
 * Abstraction d'entrée (spec §31) : le gameplay ne lit que des actions, jamais le clavier ou le
 * tactile. `Move` est un axe ; les autres actions sont des boutons, codés en masque de bits pour
 * éviter toute allocation par image.
 */
export const InputAction = {
  Move: 'Move',
  Jump: 'Jump',
  Attack: 'Attack',
  Ability: 'Ability',
  Interact: 'Interact',
  Pause: 'Pause',
  Map: 'Map',
} as const;
export type InputAction = (typeof InputAction)[keyof typeof InputAction];

export type ButtonAction = Exclude<InputAction, 'Move'>;

export const BUTTON_BIT: Readonly<Record<ButtonAction, number>> = {
  Jump: 1 << 0,
  Attack: 1 << 1,
  Ability: 1 << 2,
  Interact: 1 << 3,
  Pause: 1 << 4,
  Map: 1 << 5,
};

/** Ce qu'une source d'entrée écrit à chaque lecture. Les sources se cumulent. */
export interface RawInput {
  /** Axe horizontal, -1 (gauche) à 1 (droite). */
  moveX: number;
  /** Axe vertical, -1 (haut) à 1 (bas). */
  moveY: number;
  /** Boutons maintenus (masque de `BUTTON_BIT`). */
  held: number;
}

export interface InputSource {
  /** Ajoute l'état courant de la source à `into` (sans le réinitialiser). */
  read(into: RawInput): void;
}
