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
          const layout = computeTouchLayout(w, h, insets, {
            ...DEFAULT_CONTROL_SETTINGS,
            buttonScale: scale,
          });
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
        const { buttons } = computeTouchLayout(w, h, NOTCH, {
          ...DEFAULT_CONTROL_SETTINGS,
          buttonScale: scale,
        });
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

  it('place Action dans le coin bas droit, Saut au-dessus, Pause en haut à gauche', () => {
    const { buttons } = computeTouchLayout(844, 390, NO_INSETS, DEFAULT_CONTROL_SETTINGS);
    const jump = buttons.find((b) => b.action === 'Jump');
    const attack = buttons.find((b) => b.action === 'Attack');
    const pause = buttons.find((b) => b.action === 'Pause');
    if (!jump || !attack || !pause) {
      throw new Error('boutons manquants');
    }
    expect(jump.x).toBeGreaterThan(844 / 2);
    expect(attack.y).toBeGreaterThan(jump.y); // Action est sous Saut
    expect(jump.r).toBeGreaterThan(attack.r);
    expect(pause.x).toBeLessThan(844 / 2);
    expect(pause.y).toBeLessThan(390 / 2);
  });

  it('éloigne les boutons du bord droit (marge d’au moins rightMargin)', () => {
    for (const insets of [NO_INSETS, NOTCH]) {
      const { buttons } = computeTouchLayout(844, 390, insets, DEFAULT_CONTROL_SETTINGS);
      for (const b of buttons.filter((candidate) => candidate.action !== 'Pause')) {
        expect(844 - insets.right - (b.x + b.r)).toBeGreaterThanOrEqual(TOUCH_METRICS.rightMargin);
      }
    }
  });

  it('n’affiche pas les boutons désactivés (Capacité, Interaction)', () => {
    const { buttons } = computeTouchLayout(844, 390, NO_INSETS, DEFAULT_CONTROL_SETTINGS);
    expect(buttons.map((b) => b.action).sort()).toEqual(['Attack', 'Jump', 'Map', 'Pause']);
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

  it('garde une zone de joystick à gauche, hors bande de sécurité iOS, sans recouvrir les boutons', () => {
    for (const { w, h } of SCREENS) {
      const layout = computeTouchLayout(w, h, NOTCH, {
        ...DEFAULT_CONTROL_SETTINGS,
        buttonScale: 1.5,
      });
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
