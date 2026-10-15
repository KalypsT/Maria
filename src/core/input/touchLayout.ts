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
  /**
   * Où le joystick fantôme attend le premier déplacement (D-182) : en bas à gauche de sa zone, là
   * où le pouce se pose naturellement.
   */
  readonly joystickRest: { readonly x: number; readonly y: number };
  /**
   * Largeur couverte par les boutons de droite depuis le bord droit (px CSS) : la caméra peut
   * dépasser la salle d'autant à droite, pour que Céleste ne passe pas dessous (D-183).
   */
  readonly rightReach: number;
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
  const attackAngle = (m.attackAngleDeg * Math.PI) / 180;
  // Fenêtre très basse (barre du navigateur) : l'éventail est réduit pour tenir (d'Action en haut
  // à Saut en bas).
  const stackHeight =
    m.jumpRadius +
    Math.sin(attackAngle) * (m.jumpRadius + m.attackRadius + m.buttonGap) +
    m.attackRadius;
  const available = height - insets.top - insets.bottom - margin - m.jumpBottomMargin;
  const scale =
    settings.buttonScale * Math.min(1, available / (stackHeight * settings.buttonScale));
  const gap = m.buttonGap * scale;
  const jumpR = m.jumpRadius * scale;
  const attackR = m.attackRadius * scale;
  const abilityR = m.abilityRadius * scale;
  const shiftR = m.shiftRadius * scale;
  const iconR = m.iconRadius * scale;
  const buttons: TouchButtonLayout[] = [];

  // L'éventail (D-183) : Saut là où le pouce se pose, les autres autour de lui. Action, le plus à
  // droite, garde sa marge au bord ; Saut, le plus bas, la sienne : le coin bas droit reste libre.
  const rightEdge = width - insets.right - m.rightMargin;
  const jumpX = rightEdge - attackR - Math.cos(attackAngle) * (jumpR + attackR + gap);
  const jumpY = height - insets.bottom - m.jumpBottomMargin - jumpR;
  const enabled = TOUCH_BUTTONS_ENABLED;

  if (enabled.Jump) {
    buttons.push({ action: 'Jump', x: jumpX, y: jumpY, r: jumpR });
  }
  if (enabled.Attack) {
    const [x, y] = polar(jumpX, jumpY, jumpR + attackR + gap, m.attackAngleDeg);
    buttons.push({ action: 'Attack', x, y, r: attackR });
  }
  if (enabled.Ability || showAbility) {
    const [x, y] = polar(jumpX, jumpY, jumpR + abilityR + gap, m.abilityAngleDeg);
    buttons.push({ action: 'Ability', x, y, r: abilityR });
  }
  if (enabled.Shift || showShift) {
    const [x, y] = polar(jumpX, jumpY, jumpR + shiftR + gap, m.shiftAngleDeg);
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
  const joystickRadius = m.joystickRadius * scale;
  const joystickRest = {
    x: zoneLeft + margin + joystickRadius,
    y: height - insets.bottom - margin - joystickRadius,
  };
  let leftmost = width;
  for (const b of buttons) {
    if (b.action !== 'Map' && b.action !== 'Pause') {
      leftmost = Math.min(leftmost, b.x - b.r);
    }
  }
  return { buttons, joystickZone, joystickRadius, joystickRest, rightReach: width - leftmost };
}
