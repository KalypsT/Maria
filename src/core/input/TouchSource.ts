import type { ControlSettings } from '../../config/controls';
import { BUTTON_BIT, type ButtonAction, type InputSource, type RawInput } from './InputAction';
import { TouchController } from './TouchController';
import { computeTouchLayout, type Insets, type TouchLayout } from './touchLayout';

const LABELS: Readonly<Record<ButtonAction, string>> = {
  Jump: 'Saut',
  Attack: 'Action',
  Ability: 'Cap.',
  Interact: 'Agir',
  Pause: 'II',
  Map: 'Carte',
};

/** Attribut posé sur l'interface par-dessus le jeu : ses touches ne sont pas des commandes. */
export const UI_OVERLAY_ATTRIBUTE = 'data-ui-overlay';

/**
 * Commandes tactiles (décision D-08) : joystick flottant à gauche, boutons à droite, en DOM (net à
 * toute densité d'écran, indépendant du canvas). La logique est dans `TouchController` ; cette
 * classe branche les événements pointeur, mesure les zones sûres et dessine.
 */
export class TouchSource implements InputSource {
  readonly controller: TouchController;
  private settings: ControlSettings;
  private layout: TouchLayout;
  private readonly root: HTMLElement;
  private readonly safeProbe: HTMLElement;
  private readonly joystickBase: HTMLElement;
  private readonly joystickKnob: HTMLElement;
  private readonly buttonElements = new Map<ButtonAction, HTMLElement>();
  private shownMask = 0;
  private shownJoystick = false;
  private shownKnobX = Number.NaN;
  private shownKnobY = Number.NaN;
  private shownBaseX = Number.NaN;
  private shownBaseY = Number.NaN;

  constructor(parent: HTMLElement, settings: Readonly<ControlSettings>) {
    this.settings = { ...settings };
    this.root = document.createElement('div');
    this.root.id = 'touch-controls';
    this.safeProbe = document.createElement('div');
    this.safeProbe.id = 'touch-safe-probe';
    this.joystickBase = document.createElement('div');
    this.joystickBase.className = 'touch-joystick-base';
    this.joystickKnob = document.createElement('div');
    this.joystickKnob.className = 'touch-joystick-knob';
    this.root.append(this.safeProbe, this.joystickBase, this.joystickKnob);
    parent.appendChild(this.root);
    this.layout = this.computeLayout();
    this.controller = new TouchController(this.layout, this.settings);
    this.applyLayout();
  }

  /** Vrai sur un appareil tactile. */
  static isTouchDevice(): boolean {
    return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  }

  get activeCount(): number {
    return this.controller.activeCount;
  }

  setSettings(settings: Readonly<ControlSettings>): void {
    this.settings = { ...settings };
    this.relayout();
  }

  /** Relâche toutes les commandes (pause, perte de focus, rotation…). */
  releaseAll(): void {
    this.controller.releaseAll();
  }

  attach(target: Window): () => void {
    const onDown = (event: PointerEvent) => {
      const el = event.target;
      if (el instanceof Element && el.closest(`[${UI_OVERLAY_ATTRIBUTE}]`)) {
        return; // Interface par-dessus le jeu (menu, debug…) : pas une commande.
      }
      if (this.controller.pointerDown(event.pointerId, event.clientX, event.clientY)) {
        event.preventDefault();
      }
    };
    const onMove = (event: PointerEvent) => {
      this.controller.pointerMove(event.pointerId, event.clientX, event.clientY);
    };
    const onUp = (event: PointerEvent) => {
      this.controller.pointerUp(event.pointerId);
    };
    const onRelease = () => {
      this.controller.releaseAll();
    };
    const onVisibility = () => {
      if (document.hidden) {
        this.controller.releaseAll();
      }
    };
    const onResize = () => {
      this.controller.releaseAll();
      this.relayout();
    };
    const onContextMenu = (event: Event) => {
      event.preventDefault(); // Appui long sur Android : pas de menu contextuel.
    };
    target.addEventListener('pointerdown', onDown, { passive: false });
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
    target.addEventListener('blur', onRelease);
    target.addEventListener('resize', onResize);
    target.addEventListener('orientationchange', onResize);
    target.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      target.removeEventListener('pointerdown', onDown);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      target.removeEventListener('blur', onRelease);
      target.removeEventListener('resize', onResize);
      target.removeEventListener('orientationchange', onResize);
      target.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('visibilitychange', onVisibility);
      this.root.remove();
    };
  }

  read(into: RawInput): void {
    this.controller.read(into);
    this.render();
  }

  private relayout(): void {
    this.layout = this.computeLayout();
    this.controller.setLayout(this.layout, this.settings);
    this.applyLayout();
  }

  private computeLayout(): TouchLayout {
    return computeTouchLayout(
      window.innerWidth,
      window.innerHeight,
      this.measureInsets(),
      this.settings,
    );
  }

  /** Zones sûres résolues par le navigateur (`env()` ne se lit pas directement en JavaScript). */
  private measureInsets(): Insets {
    const style = getComputedStyle(this.safeProbe);
    const px = (value: string) => Number.parseFloat(value) || 0;
    return {
      top: px(style.paddingTop),
      right: px(style.paddingRight),
      bottom: px(style.paddingBottom),
      left: px(style.paddingLeft),
    };
  }

  private applyLayout(): void {
    this.root.style.setProperty('--touch-opacity', String(this.settings.opacity));
    const seen = new Set<ButtonAction>();
    for (const b of this.layout.buttons) {
      seen.add(b.action);
      let element = this.buttonElements.get(b.action);
      if (!element) {
        element = document.createElement('div');
        element.className = `touch-button touch-${b.action.toLowerCase()}`;
        element.textContent = LABELS[b.action];
        this.root.appendChild(element);
        this.buttonElements.set(b.action, element);
      }
      element.style.width = `${b.r * 2}px`;
      element.style.height = `${b.r * 2}px`;
      element.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px)`;
    }
    for (const [action, element] of this.buttonElements) {
      if (!seen.has(action)) {
        element.remove();
        this.buttonElements.delete(action);
      }
    }
    const size = this.layout.joystickRadius * 2;
    this.joystickBase.style.width = this.joystickBase.style.height = `${size}px`;
    const knob = this.layout.joystickRadius * 0.85;
    this.joystickKnob.style.width = this.joystickKnob.style.height = `${knob}px`;
    this.shownMask = -1; // force la mise à jour des états au prochain rendu
    this.shownBaseX = Number.NaN;
    this.shownKnobX = Number.NaN;
  }

  /** Met à jour le DOM seulement quand quelque chose change (pas d'écriture inutile par image). */
  private render(): void {
    const mask = this.controller.heldMask;
    if (mask !== this.shownMask) {
      this.shownMask = mask;
      for (const [action, element] of this.buttonElements) {
        element.classList.toggle('active', (mask & BUTTON_BIT[action]) !== 0);
      }
    }
    const stick = this.controller.joystick;
    if (stick.active !== this.shownJoystick) {
      this.shownJoystick = stick.active;
      this.joystickBase.classList.toggle('visible', stick.active);
      this.joystickKnob.classList.toggle('visible', stick.active);
    }
    if (stick.active) {
      if (stick.baseX !== this.shownBaseX || stick.baseY !== this.shownBaseY) {
        this.shownBaseX = stick.baseX;
        this.shownBaseY = stick.baseY;
        const r = this.layout.joystickRadius;
        this.joystickBase.style.transform = `translate(${stick.baseX - r}px, ${stick.baseY - r}px)`;
      }
      if (stick.knobX !== this.shownKnobX || stick.knobY !== this.shownKnobY) {
        this.shownKnobX = stick.knobX;
        this.shownKnobY = stick.knobY;
        const half = this.layout.joystickRadius * 0.425;
        this.joystickKnob.style.transform = `translate(${stick.knobX - half}px, ${stick.knobY - half}px)`;
      }
    }
  }
}
