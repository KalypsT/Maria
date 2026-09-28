import { TOUCH_BUTTONS_ENABLED, TOUCH_METRICS, type ControlSettings } from '../../config/controls';
import type { ButtonAction } from './InputAction';

/** Marges des zones sûres (encoche, barre d'accueil), en px CSS. */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TouchButtonLayout {
  readonly action: ButtonAction;
  /** Centre et rayon, px CSS. */
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

export interface Rect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export interface TouchLayout {
  readonly buttons: readonly TouchButtonLayout[];
  /** Zone où un doigt fait apparaître le joystick. */
  readonly joystickZone: Rect;
  readonly joystickRadius: number;
}

function polar(cx: number, cy: number, distance: number, angleDeg: number): [number, number] {
  const angle = (angleDeg * Math.PI) / 180;
  return [cx + distance * Math.cos(angle), cy - distance * Math.sin(angle)];
}

/**
 * Calcule la disposition des commandes pour une fenêtre donnée. Fonction pure : testée sans DOM,
 * recalculée au redimensionnement, à la rotation ou quand les réglages changent.
 */
export function computeTouchLayout(
  width: number,
  height: number,
  insets: Insets,
  settings: Readonly<ControlSettings>,
): TouchLayout {
  const m = TOUCH_METRICS;
  const scale = settings.buttonScale;
  const margin = m.margin;
  const gap = m.buttonGap * scale;
  const jumpR = m.jumpRadius * scale;
  const attackR = m.attackRadius * scale;
  const abilityR = m.abilityRadius * scale;
  const iconR = m.iconRadius * scale;
  const buttons: TouchButtonLayout[] = [];

  const jumpX = width - insets.right - margin - jumpR;
  const jumpY = height - insets.bottom - margin - jumpR;
  const enabled = TOUCH_BUTTONS_ENABLED;

  if (enabled.Jump) {
    buttons.push({ action: 'Jump', x: jumpX, y: jumpY, r: jumpR });
  }
  if (enabled.Attack) {
    const [x, y] = polar(jumpX, jumpY, jumpR + attackR + gap, m.attackAngleDeg);
    buttons.push({ action: 'Attack', x, y, r: attackR });
  }
  if (enabled.Ability) {
    const [x, y] = polar(jumpX, jumpY, jumpR + abilityR + gap, m.abilityAngleDeg);
    buttons.push({ action: 'Ability', x, y, r: abilityR });
  }

  // Petites icônes en haut à gauche (le haut à droite est libre pour l'interface de debug).
  let iconX = insets.left + m.edgeGuard + iconR + margin / 2;
  const iconY = insets.top + margin / 2 + iconR;
  for (const action of ['Pause', 'Map'] as const) {
    if (enabled[action]) {
      buttons.push({ action, x: iconX, y: iconY, r: iconR });
      iconX += iconR * 2 + gap;
    }
  }

  const zoneLeft = insets.left + m.edgeGuard;
  const joystickZone: Rect = {
    left: zoneLeft,
    top: height * m.joystickZoneTopFraction,
    right: Math.max(zoneLeft, width * m.joystickZoneWidthFraction),
    bottom: height,
  };
  return { buttons, joystickZone, joystickRadius: m.joystickRadius * scale };
}
