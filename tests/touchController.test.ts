import { describe, expect, it } from 'vitest';
import { DEFAULT_CONTROL_SETTINGS, TOUCH_METRICS } from '../src/config/controls';
import { BUTTON_BIT, type RawInput } from '../src/core/input/InputAction';
import { TouchController } from '../src/core/input/TouchController';
import { computeTouchLayout } from '../src/core/input/touchLayout';

const W = 844;
const H = 390;
const layout = computeTouchLayout(
  W,
  H,
  { top: 0, right: 0, bottom: 0, left: 0 },
  DEFAULT_CONTROL_SETTINGS,
);
const button = (action: string) => {
  const b = layout.buttons.find((candidate) => candidate.action === action);
  if (!b) {
    throw new Error(`bouton ${action} absent`);
  }
  return b;
};
const jump = button('Jump');
const attack = button('Attack');
const pause = button('Pause');
const zone = layout.joystickZone;
const zoneX = (zone.left + zone.right) / 2;
const zoneY = (zone.top + zone.bottom) / 2;

function readInput(controller: TouchController): RawInput {
  const raw: RawInput = { moveX: 0, moveY: 0, held: 0 };
  controller.read(raw);
  return raw;
}

function make(): TouchController {
  return new TouchController(layout, DEFAULT_CONTROL_SETTINGS);
}

describe('TouchController : rôles des doigts', () => {
  it('un doigt sur Saut maintient Saut jusqu’au relâchement', () => {
    const c = make();
    expect(c.pointerDown(1, jump.x, jump.y)).toBe(true);
    expect(readInput(c).held).toBe(BUTTON_BIT.Jump);
    c.pointerUp(1);
    expect(readInput(c).held).toBe(0);
  });

  it('un doigt dans la zone gauche crée le joystick sous le pouce', () => {
    const c = make();
    c.pointerDown(1, zoneX, zoneY);
    expect(c.joystick.active).toBe(true);
    expect(c.joystick.baseX).toBe(zoneX);
    c.pointerMove(1, zoneX + layout.joystickRadius, zoneY);
    expect(readInput(c).moveX).toBe(1);
    c.pointerMove(1, zoneX - layout.joystickRadius, zoneY);
    expect(readInput(c).moveX).toBe(-1);
    c.pointerUp(1);
    expect(readInput(c).moveX).toBe(0);
    expect(c.joystick.active).toBe(false);
  });

  it('ignore un doigt posé ailleurs (au centre, ou dans la bande de sécurité iOS)', () => {
    const c = make();
    expect(c.pointerDown(1, W / 2, H / 2)).toBe(false);
    expect(c.pointerDown(2, TOUCH_METRICS.edgeGuard - 5, zoneY)).toBe(false);
    expect(c.activeCount).toBe(0);
  });

  it('accepte un appui légèrement à côté d’un bouton (marge généreuse)', () => {
    const c = make();
    expect(c.pointerDown(1, jump.x - jump.r - TOUCH_METRICS.hitMargin + 1, jump.y)).toBe(true);
    expect(c.pointerDown(2, attack.x, attack.y - attack.r - TOUCH_METRICS.hitMargin - 2)).toBe(
      false,
    );
  });

  it('un seul joystick à la fois : un second doigt dans la zone est ignoré', () => {
    const c = make();
    c.pointerDown(1, zoneX, zoneY);
    expect(c.pointerDown(2, zoneX + 10, zoneY + 10)).toBe(false);
    c.pointerMove(2, zoneX + 200, zoneY);
    expect(readInput(c).moveX).toBe(0);
  });

  it('garde le joystick quand le doigt sort de la zone', () => {
    const c = make();
    c.pointerDown(1, zoneX, zoneY);
    c.pointerMove(1, W - 5, 5);
    expect(c.joystick.active).toBe(true);
    c.pointerUp(1);
    expect(c.joystick.active).toBe(false);
  });

  it('ignore les identifiants de doigt inconnus ou déjà pris', () => {
    const c = make();
    c.pointerMove(9, 10, 10);
    c.pointerUp(9);
    expect(c.pointerDown(1, jump.x, jump.y)).toBe(true);
    expect(c.pointerDown(1, attack.x, attack.y)).toBe(false);
  });
});

describe('TouchController : combinaisons (spec §12.3)', () => {
  it('déplacement + saut', () => {
    const c = make();
    c.pointerDown(1, zoneX, zoneY);
    c.pointerMove(1, zoneX + layout.joystickRadius, zoneY);
    c.pointerDown(2, jump.x, jump.y);
    const raw = readInput(c);
    expect(raw.moveX).toBe(1);
    expect(raw.held).toBe(BUTTON_BIT.Jump);
  });

  it('déplacement + attaque', () => {
    const c = make();
    c.pointerDown(1, zoneX, zoneY);
    c.pointerMove(1, zoneX - layout.joystickRadius, zoneY);
    c.pointerDown(2, attack.x, attack.y);
    const raw = readInput(c);
    expect(raw.moveX).toBe(-1);
    expect(raw.held).toBe(BUTTON_BIT.Attack);
  });

  it('saut + attaque, avec deux pouces sur la droite', () => {
    const c = make();
    c.pointerDown(1, jump.x, jump.y);
    c.pointerDown(2, attack.x, attack.y);
    expect(readInput(c).held).toBe(BUTTON_BIT.Jump | BUTTON_BIT.Attack);
    c.pointerUp(1);
    expect(readInput(c).held).toBe(BUTTON_BIT.Attack);
  });

  it('déplacement + saut + attaque + pause : quatre doigts simultanés', () => {
    const c = make();
    c.pointerDown(1, zoneX, zoneY);
    c.pointerMove(1, zoneX + layout.joystickRadius, zoneY);
    c.pointerDown(2, jump.x, jump.y);
    c.pointerDown(3, attack.x, attack.y);
    c.pointerDown(4, pause.x, pause.y);
    expect(c.activeCount).toBe(4);
    const raw = readInput(c);
    expect(raw.moveX).toBe(1);
    expect(raw.held).toBe(BUTTON_BIT.Jump | BUTTON_BIT.Attack | BUTTON_BIT.Pause);
  });

  it('le bas du joystick + Saut : traversée d’une plateforme', () => {
    const c = make();
    c.pointerDown(1, zoneX, zoneY);
    c.pointerMove(1, zoneX, zoneY + layout.joystickRadius);
    c.pointerDown(2, jump.x, jump.y);
    const raw = readInput(c);
    expect(raw.moveY).toBe(1);
    expect(raw.held).toBe(BUTTON_BIT.Jump);
  });

  it('relâcher un doigt n’affecte pas les autres (aucune perte lors de mouvements simultanés)', () => {
    const c = make();
    c.pointerDown(1, zoneX, zoneY);
    c.pointerMove(1, zoneX + layout.joystickRadius, zoneY);
    c.pointerDown(2, jump.x, jump.y);
    c.pointerDown(3, attack.x, attack.y);
    c.pointerUp(3);
    const raw = readInput(c);
    expect(raw.moveX).toBe(1);
    expect(raw.held).toBe(BUTTON_BIT.Jump);
  });
});

describe('TouchController : glissements et annulations', () => {
  it('un pouce glisse de Saut à Attaque sans se relever', () => {
    const c = make();
    c.pointerDown(1, jump.x, jump.y);
    c.pointerMove(1, attack.x, attack.y);
    expect(readInput(c).held).toBe(BUTTON_BIT.Attack);
    c.pointerMove(1, jump.x, jump.y);
    expect(readInput(c).held).toBe(BUTTON_BIT.Jump);
  });

  it('relâche le bouton quand le doigt s’éloigne trop', () => {
    const c = make();
    c.pointerDown(1, jump.x, jump.y);
    c.pointerMove(1, W / 2, H / 2);
    expect(readInput(c).held).toBe(0);
    c.pointerMove(1, jump.x, jump.y);
    expect(readInput(c).held).toBe(BUTTON_BIT.Jump);
  });

  it('pointercancel libère bouton et joystick', () => {
    const c = make();
    c.pointerDown(1, zoneX, zoneY);
    c.pointerMove(1, zoneX + layout.joystickRadius, zoneY);
    c.pointerDown(2, jump.x, jump.y);
    c.pointerUp(1);
    c.pointerUp(2);
    const raw = readInput(c);
    expect(raw).toEqual({ moveX: 0, moveY: 0, held: 0 });
    expect(c.activeCount).toBe(0);
  });

  it('releaseAll libère tout (perte de focus, pause, rotation)', () => {
    const c = make();
    c.pointerDown(1, zoneX, zoneY);
    c.pointerMove(1, zoneX + layout.joystickRadius, zoneY);
    c.pointerDown(2, jump.x, jump.y);
    c.releaseAll();
    expect(readInput(c)).toEqual({ moveX: 0, moveY: 0, held: 0 });
    expect(c.activeCount).toBe(0);
    expect(c.pointerDown(3, jump.x, jump.y)).toBe(true);
  });

  it('supporte 10 doigts, puis ignore le suivant sans erreur', () => {
    const c = make();
    for (let id = 1; id <= 10; id++) {
      expect(c.pointerDown(id, jump.x, jump.y)).toBe(true);
    }
    expect(c.pointerDown(11, jump.x, jump.y)).toBe(false);
  });

  it('applique un nouveau layout et le mode analogique', () => {
    const c = make();
    const analog = { ...DEFAULT_CONTROL_SETTINGS, joystickMode: 'analog' as const };
    c.setLayout(computeTouchLayout(W, H, { top: 0, right: 0, bottom: 0, left: 0 }, analog), analog);
    c.pointerDown(1, zoneX, zoneY);
    c.pointerMove(1, zoneX + layout.joystickRadius * 0.575, zoneY);
    const x = readInput(c).moveX;
    expect(x).toBeGreaterThan(0.2);
    expect(x).toBeLessThan(0.9);
  });
});
