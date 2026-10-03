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
  /** Bouton Capacité affiché : une capacité à bouton est obtenue (la glissade, D-84). */
  showAbility = false,
  /** Bouton Basculer affiché : la bascule est obtenue (D-107). */
  showShift = false,
): TouchLayout {
  const m = TOUCH_METRICS;
  const margin = m.margin;
  // Fenêtre très basse (barre du navigateur) : la pile Saut/Action est réduite pour tenir.
  const stackHeight =
    m.attackRadius +
    Math.sin((m.jumpAngleDeg * Math.PI) / 180) * (m.attackRadius + m.jumpRadius + m.buttonGap) +
    m.jumpRadius;
  const available = height - insets.top - insets.bottom - margin * 2;
  const scale =
    settings.buttonScale * Math.min(1, available / (stackHeight * settings.buttonScale));
  const gap = m.buttonGap * scale;
  const jumpR = m.jumpRadius * scale;
  const attackR = m.attackRadius * scale;
  const abilityR = m.abilityRadius * scale;
  const shiftR = m.shiftRadius * scale;
  const iconR = m.iconRadius * scale;
  const buttons: TouchButtonLayout[] = [];

  // Action dans le coin bas droit, Saut au-dessus (légèrement à gauche) : le pouce qui dérive
  // vers le bas ou le bord n'atteint pas Saut par erreur, et inversement.
  const rightEdge = width - insets.right - m.rightMargin;
  const attackX = rightEdge - attackR;
  const attackY = height - insets.bottom - margin - attackR;
  const [jumpX, jumpY] = polar(attackX, attackY, attackR + jumpR + gap, m.jumpAngleDeg);
  const enabled = TOUCH_BUTTONS_ENABLED;

  if (enabled.Jump) {
    buttons.push({ action: 'Jump', x: jumpX, y: jumpY, r: jumpR });
  }
  if (enabled.Attack) {
    buttons.push({ action: 'Attack', x: attackX, y: attackY, r: attackR });
  }
  if (enabled.Ability || showAbility) {
    const [x, y] = polar(jumpX, jumpY, jumpR + abilityR + gap, m.abilityAngleDeg);
    buttons.push({ action: 'Ability', x, y, r: abilityR });
  }
  if (enabled.Shift || showShift) {
    // Sur la rangée du bas, à gauche d'Action : le pouce y glisse depuis Saut sans le toucher.
    const [x, y] = polar(attackX, attackY, attackR + shiftR + gap, m.shiftAngleDeg);
    buttons.push({ action: 'Shift', x, y, r: shiftR });
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
