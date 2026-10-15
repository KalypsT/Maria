import { describe, expect, it } from 'vitest';
import { DEFAULT_CONTROL_SETTINGS, TOUCH_METRICS } from '../src/config/controls';
import { computeTouchLayout, type Insets } from '../src/core/input/touchLayout';

const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
const NOTCH: Insets = { top: 0, right: 44, bottom: 21, left: 47 };
const SCREENS = [
  { name: 'petit 16:9', w: 640, h: 360 },
  { name: 'iPhone paysage', w: 844, h: 390 },
  { name: 'très large', w: 932, h: 360 },
  { name: 'court (barre du navigateur)', w: 700, h: 300 },
];

describe('computeTouchLayout', () => {
  for (const scale of [0.7, 1, 1.5]) {
    for (const insets of [NO_INSETS, NOTCH]) {
      for (const { name, w, h } of SCREENS) {
        it(`garde les boutons dans l’écran et les zones sûres : ${name}, échelle ${scale}, ${
          insets === NOTCH ? 'encoche' : 'sans encoche'
        }`, () => {
          // Avec les boutons Capacité (D-84) et Basculer (D-107) : la disposition la plus chargée.
          const layout = computeTouchLayout(
            w,
            h,
            insets,
            { ...DEFAULT_CONTROL_SETTINGS, buttonScale: scale },
            true,
            true,
          );
          for (const b of layout.buttons) {
            expect(b.x - b.r, b.action).toBeGreaterThanOrEqual(insets.left);
            expect(b.x + b.r, b.action).toBeLessThanOrEqual(w - insets.right);
            expect(b.y - b.r, b.action).toBeGreaterThanOrEqual(insets.top);
            expect(b.y + b.r, b.action).toBeLessThanOrEqual(h - insets.bottom);
          }
        });
      }
    }
  }

  it('ne fait se chevaucher aucun bouton', () => {
    for (const { w, h } of SCREENS) {
      for (const scale of [0.7, 1, 1.5]) {
        const { buttons } = computeTouchLayout(
          w,
          h,
          NOTCH,
          { ...DEFAULT_CONTROL_SETTINGS, buttonScale: scale },
          true,
          true,
        );
        for (const a of buttons) {
          for (const b of buttons) {
            if (a !== b) {
              expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(a.r + b.r);
            }
          }
        }
      }
    }
  });

  it('n’affiche le bouton Capacité qu’une fois la glissade obtenue (D-84)', () => {
    const without = computeTouchLayout(844, 390, NO_INSETS, DEFAULT_CONTROL_SETTINGS);
    const withIt = computeTouchLayout(844, 390, NO_INSETS, DEFAULT_CONTROL_SETTINGS, true);
    expect(without.buttons.some((b) => b.action === 'Ability')).toBe(false);
    const ability = withIt.buttons.find((b) => b.action === 'Ability');
    const jump = withIt.buttons.find((b) => b.action === 'Jump');
    if (!ability || !jump) {
      throw new Error('boutons manquants');
    }
    // À gauche de Saut, à sa hauteur : glisser puis sauter, le pouce roule vers la droite (D-183).
    expect(ability.x).toBeLessThan(jump.x);
    expect(Math.abs(ability.y - jump.y)).toBeLessThan(jump.r / 2);
  });

  it('n’affiche le bouton Basculer qu’une fois la bascule obtenue, en haut à gauche de Saut (D-183)', () => {
    const without = computeTouchLayout(844, 390, NO_INSETS, DEFAULT_CONTROL_SETTINGS, true);
    const withIt = computeTouchLayout(844, 390, NO_INSETS, DEFAULT_CONTROL_SETTINGS, true, true);
    expect(without.buttons.some((b) => b.action === 'Shift')).toBe(false);
    const find = (action: string) => {
      const b = withIt.buttons.find((candidate) => candidate.action === action);
      if (!b) {
        throw new Error(`bouton ${action} absent`);
      }
      return b;
    };
    const [shift, jump, attack, ability] = ['Shift', 'Jump', 'Attack', 'Ability'].map(find);
    if (!shift || !jump || !attack || !ability) {
      throw new Error('boutons manquants');
    }
    // Entre Glisser et Action, au-dessus de Saut et à sa gauche : le pouce y roule depuis Saut.
    expect(shift.x).toBeLessThan(jump.x);
    expect(shift.y).toBeLessThan(jump.y);
    expect(shift.x).toBeGreaterThan(ability.x);
    expect(shift.x).toBeLessThan(attack.x);
    expect(Math.hypot(shift.x - jump.x, shift.y - jump.y)).toBeLessThan(
      jump.r + shift.r + TOUCH_METRICS.buttonGap * 1.5,
    );
  });

  it('l’éventail : Saut le plus grand et le plus bas, Action au-dessus, le sac en haut à gauche (D-183)', () => {
    const { buttons } = computeTouchLayout(
      844,
      390,
      NO_INSETS,
      DEFAULT_CONTROL_SETTINGS,
      true,
      true,
    );
    const jump = buttons.find((b) => b.action === 'Jump');
    const attack = buttons.find((b) => b.action === 'Attack');
    const bag = buttons.find((b) => b.action === 'Map');
    if (!jump || !attack || !bag) {
      throw new Error('boutons manquants');
    }
    expect(jump.x).toBeGreaterThan(844 / 2);
    expect(attack.y).toBeLessThan(jump.y); // Action est au-dessus de Saut
    expect(attack.x).toBeGreaterThan(jump.x); // un peu à droite
    for (const b of buttons) {
      expect(jump.r).toBeGreaterThanOrEqual(b.r);
      // Le coin bas droit reste libre : Saut est le plus bas, Action le plus à droite.
      expect(b.y + b.r).toBeLessThanOrEqual(jump.y + jump.r + 0.001);
      expect(b.x + b.r).toBeLessThanOrEqual(attack.x + attack.r + 0.001);
    }
    expect(390 - (jump.y + jump.r)).toBeCloseTo(TOUCH_METRICS.jumpBottomMargin);
    expect(bag.x).toBeLessThan(844 / 2);
    expect(bag.y).toBeLessThan(390 / 2);
  });

  it('éloigne les boutons du bord droit (marge d’au moins rightMargin)', () => {
    for (const insets of [NO_INSETS, NOTCH]) {
      const { buttons } = computeTouchLayout(844, 390, insets, DEFAULT_CONTROL_SETTINGS);
      for (const b of buttons.filter((candidate) => candidate.action !== 'Map')) {
        expect(844 - insets.right - (b.x + b.r)).toBeGreaterThanOrEqual(TOUCH_METRICS.rightMargin);
      }
    }
  });

  it('n’affiche pas les boutons désactivés (Capacité, Interaction, Pause : dans le sac, D-159)', () => {
    const { buttons } = computeTouchLayout(844, 390, NO_INSETS, DEFAULT_CONTROL_SETTINGS);
    expect(buttons.map((b) => b.action).sort()).toEqual(['Attack', 'Jump', 'Map']);
  });

  it('agrandit les boutons avec l’échelle', () => {
    const small = computeTouchLayout(844, 390, NO_INSETS, {
      ...DEFAULT_CONTROL_SETTINGS,
      buttonScale: 0.7,
    });
    const big = computeTouchLayout(844, 390, NO_INSETS, {
      ...DEFAULT_CONTROL_SETTINGS,
      buttonScale: 1.5,
    });
    expect(big.buttons[0]?.r).toBeGreaterThan(small.buttons[0]?.r ?? Infinity);
    expect(big.joystickRadius).toBeGreaterThan(small.joystickRadius);
  });

  it('le joystick fantôme attend dans sa zone, en entier dans l’écran (D-182)', () => {
    for (const { w, h } of SCREENS) {
      for (const insets of [NO_INSETS, NOTCH]) {
        const layout = computeTouchLayout(w, h, insets, DEFAULT_CONTROL_SETTINGS, true, true);
        const { x, y } = layout.joystickRest;
        const r = layout.joystickRadius;
        const zone = layout.joystickZone;
        expect(x - r).toBeGreaterThanOrEqual(zone.left);
        expect(x + r).toBeLessThanOrEqual(zone.right);
        expect(y - r).toBeGreaterThanOrEqual(zone.top);
        expect(y + r).toBeLessThanOrEqual(h - insets.bottom);
      }
    }
  });

  it('garde une zone de joystick à gauche, hors bande de sécurité iOS, sans recouvrir les boutons', () => {
    for (const { w, h } of SCREENS) {
      const layout = computeTouchLayout(
        w,
        h,
        NOTCH,
        { ...DEFAULT_CONTROL_SETTINGS, buttonScale: 1.5 },
        false,
        true,
      );
      const zone = layout.joystickZone;
      expect(zone.left).toBeGreaterThanOrEqual(NOTCH.left + TOUCH_METRICS.edgeGuard);
      expect(zone.right).toBeLessThan(w / 2);
      expect(zone.bottom).toBe(h);
      expect(zone.right).toBeGreaterThan(zone.left);
      for (const b of layout.buttons) {
        if (b.action === 'Pause' || b.action === 'Map') {
          // Petites icônes en haut à gauche : au-dessus de la zone du joystick.
          expect(b.y + b.r).toBeLessThan(zone.top);
        } else {
          expect(b.x - b.r).toBeGreaterThan(zone.right);
        }
      }
    }
  });
});
