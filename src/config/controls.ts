import type { ButtonAction } from '../core/input/InputAction';

/**
 * Commandes tactiles (décision D-08). Tailles en px CSS. Valeurs PROVISOIRES, à régler sur
 * téléphone ; l'utilisateur peut aussi ajuster taille et opacité dans le menu pause (spec §40).
 */
export const TOUCH_METRICS = {
  /** Marge entre les commandes et le bord bas de l'écran (hors zones sûres) : joystick, sac. */
  margin: 20,
  /**
   * Marge entre le bouton le plus à droite (Action) et le bord droit, plus large : un pouce trop
   * près du bord appuie à côté (essais sur téléphone).
   */
  rightMargin: 66,
  /** Marge entre Saut, le bouton le plus bas, et le bord bas (D-183) : le coin reste libre. */
  jumpBottomMargin: 36,
  /** Saut, le bouton le plus utilisé, est le plus grand (D-183). */
  jumpRadius: 50,
  attackRadius: 36,
  abilityRadius: 36,
  /** Bouton Basculer (D-107). */
  shiftRadius: 34,
  /** Rayon des petites icônes (Pause, Carte). */
  iconRadius: 22,
  /** Écart entre deux boutons voisins. */
  buttonGap: 16,
  /**
   * L'éventail (D-183) : Saut là où le pouce se pose, les autres boutons autour de lui, chacun à un
   * pas du pouce (degrés autour de Saut : 0 = à droite, 90 = au-dessus). Action au-dessus, un peu à
   * droite : Agir sert surtout aux moments calmes.
   */
  attackAngleDeg: 75,
  /** Glisser à gauche, un peu plus bas : glisser puis sauter, le pouce roule vers la droite. */
  abilityAngleDeg: 186,
  /**
   * Basculer en haut à gauche : en plein vol, le pouce roule de Saut à Basculer sans lâcher Saut
   * (le parapluie reste ouvert, voir `TouchController`).
   */
  shiftAngleDeg: 128,
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

/**
 * Boutons affichés. Capacité n'apparaît en plus qu'une fois une capacité à bouton obtenue (la
 * glissade, D-84) : voir `computeTouchLayout`.
 */
export const TOUCH_BUTTONS_ENABLED: Readonly<Record<ButtonAction, boolean>> = {
  Jump: true,
  Attack: true,
  Ability: false,
  Interact: false,
  // Un seul bouton en haut à gauche, le sac (D-159) : il ouvre la carte ; la pause est dedans.
  Pause: false,
  Map: true,
  Shift: false,
};

export type JoystickMode = 'digital' | 'analog';

/** Réglages modifiables par le joueur (menu pause). */
export interface ControlSettings {
  /** Multiplicateur de taille des boutons et du joystick. */
  buttonScale: number;
  /** Opacité des commandes au repos (0–1). */
  opacity: number;
  joystickMode: JoystickMode;
  /** Vibrations (D-128, Android) : quelques moments forts, réglables dans le menu pause. */
  vibration: boolean;
  /** Le fil discret (D-129) : après un long moment sans progrès, une lueur montre où aller. */
  hint: boolean;
}

export const DEFAULT_CONTROL_SETTINGS: Readonly<ControlSettings> = {
  buttonScale: 1,
  opacity: 0.7,
  joystickMode: 'digital',
  vibration: true,
  hint: true,
};

export const CONTROL_SETTING_RANGES = {
  buttonScale: { min: 0.7, max: 1.5, step: 0.05 },
  opacity: { min: 0.2, max: 1, step: 0.05 },
} as const;
