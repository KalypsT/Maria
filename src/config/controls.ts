import type { ButtonAction } from '../core/input/InputAction';

/**
 * Commandes tactiles (décision D-08). Tailles en px CSS. Valeurs PROVISOIRES, à régler sur
 * téléphone ; l'utilisateur peut aussi ajuster taille et opacité dans le menu pause (spec §40).
 */
export const TOUCH_METRICS = {
  /** Marge entre les commandes et le bord bas de l'écran (hors zones sûres). */
  margin: 20,
  /** Marge côté droit, plus large : un pouce trop près du bord appuie à côté (essais sur téléphone). */
  rightMargin: 56,
  jumpRadius: 46,
  attackRadius: 36,
  abilityRadius: 32,
  /** Rayon des petites icônes (Pause, Carte). */
  iconRadius: 22,
  /** Écart entre deux boutons voisins. */
  buttonGap: 16,
  /** Action est dans le coin bas droit ; Saut est placé au-dessus (degrés autour d'Action : 90 = au-dessus). */
  jumpAngleDeg: 100,
  /** Capacité est à gauche de Saut (degrés autour de Saut : 180 = à gauche). */
  abilityAngleDeg: 165,
  /** Bande gauche non tactile : le balayage retour d'iOS ne peut pas être neutralisé (D-03). */
  edgeGuard: 28,
  /** Distance maximale de la base du joystick à son bouton (déplacement du pouce). */
  joystickRadius: 56,
  /** Zone où le joystick peut apparaître : fraction de la largeur, et de la hauteur depuis le haut. */
  joystickZoneWidthFraction: 0.45,
  joystickZoneTopFraction: 0.3,
  /** Tolérance autour d'un bouton pour l'appui (px) : hit areas généreuses (spec §50.7). */
  hitMargin: 14,
} as const;

/** Comportement du joystick flottant. */
export const JOYSTICK = {
  /** Mode analogique : fraction du rayon sous laquelle rien ne bouge. */
  analogDeadZone: 0.15,
  /** Mode numérique : fraction du rayon à dépasser pour activer une direction… */
  digitalEnter: 0.4,
  /** …et sous laquelle elle se relâche (hystérésis : évite le scintillement autour du seuil). */
  digitalExit: 0.25,
  /** La base suit le pouce quand il s'éloigne au-delà du rayon. */
  baseFollowsThumb: true as boolean,
} as const;

/** Boutons affichés. Attaque n'a pas d'effet avant la phase combat (affiché pour l'ergonomie). */
export const TOUCH_BUTTONS_ENABLED: Readonly<Record<ButtonAction, boolean>> = {
  Jump: true,
  Attack: true,
  Ability: false,
  Interact: false,
  Pause: true,
  Map: false,
};

export type JoystickMode = 'digital' | 'analog';

/** Réglages modifiables par le joueur (menu pause). */
export interface ControlSettings {
  /** Multiplicateur de taille des boutons et du joystick. */
  buttonScale: number;
  /** Opacité des commandes au repos (0–1). */
  opacity: number;
  joystickMode: JoystickMode;
}

export const DEFAULT_CONTROL_SETTINGS: Readonly<ControlSettings> = {
  buttonScale: 1,
  opacity: 0.7,
  joystickMode: 'digital',
};

export const CONTROL_SETTING_RANGES = {
  buttonScale: { min: 0.7, max: 1.5, step: 0.05 },
  opacity: { min: 0.2, max: 1, step: 0.05 },
} as const;
