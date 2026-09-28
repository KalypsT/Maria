import {
  CONTROL_SETTING_RANGES,
  DEFAULT_CONTROL_SETTINGS,
  type ControlSettings,
  type JoystickMode,
} from '../config/controls';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';

export interface PauseMenuOptions {
  settings: ControlSettings;
  /** Afficher les réglages tactiles (inutile sans commandes tactiles). */
  showTouchSettings: boolean;
  onResume: () => void;
  onSettingsChange: (settings: ControlSettings) => void;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  parent: HTMLElement,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  if (text !== undefined) {
    el.textContent = text;
  }
  parent.appendChild(el);
  return el;
}

/** Menu pause en DOM : reprendre et régler les commandes tactiles (spec §40). */
export class PauseMenu {
  private readonly root: HTMLElement;
  private readonly refreshers: (() => void)[] = [];
  private settings: ControlSettings;

  constructor(private readonly options: PauseMenuOptions) {
    this.settings = { ...options.settings };
    this.root = document.createElement('div');
    this.root.id = 'pause-menu';
    this.root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    this.root.hidden = true;
    const panel = element('div', this.root, 'pause-panel');
    const header = element('div', panel, 'pause-header');
    element('h2', header, undefined, 'Pause');
    const resume = element('button', header, 'pause-primary', 'Reprendre');
    resume.addEventListener('click', options.onResume);

    if (options.showTouchSettings) {
      element('h3', panel, undefined, 'Commandes tactiles');
      this.addSlider(panel, 'Taille des boutons', 'buttonScale', (v) => `${Math.round(v * 100)} %`);
      this.addSlider(panel, 'Opacité', 'opacity', (v) => `${Math.round(v * 100)} %`);
      this.addModeChoice(panel);
      const reset = element('button', panel, undefined, 'Réinitialiser les commandes');
      reset.addEventListener('click', () => {
        this.settings = { ...DEFAULT_CONTROL_SETTINGS };
        this.commit();
        this.refreshers.forEach((refresh) => {
          refresh();
        });
      });
    }
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  open(): void {
    this.root.hidden = false;
  }

  close(): void {
    this.root.hidden = true;
  }

  destroy(): void {
    this.root.remove();
  }

  private commit(): void {
    this.options.onSettingsChange({ ...this.settings });
  }

  private addSlider(
    parent: HTMLElement,
    label: string,
    key: 'buttonScale' | 'opacity',
    format: (value: number) => string,
  ): void {
    const range = CONTROL_SETTING_RANGES[key];
    const row = element('label', parent, 'pause-row');
    element('span', row, undefined, label);
    const value = element('span', row, 'pause-value');
    const slider = element('input', row);
    slider.type = 'range';
    slider.min = String(range.min);
    slider.max = String(range.max);
    slider.step = String(range.step);
    const refresh = () => {
      slider.value = String(this.settings[key]);
      value.textContent = format(this.settings[key]);
    };
    slider.addEventListener('input', () => {
      this.settings[key] = Number(slider.value);
      value.textContent = format(this.settings[key]);
      this.commit();
    });
    refresh();
    this.refreshers.push(refresh);
  }

  private addModeChoice(parent: HTMLElement): void {
    const row = element('div', parent, 'pause-row');
    element('span', row, undefined, 'Joystick');
    const group = element('div', row, 'pause-choice');
    const choices: readonly [JoystickMode, string][] = [
      ['digital', 'Numérique'],
      ['analog', 'Analogique'],
    ];
    const buttons = choices.map(([mode, text]) => {
      const button = element('button', group, undefined, text);
      button.addEventListener('click', () => {
        this.settings.joystickMode = mode;
        this.commit();
        refresh();
      });
      return { mode, button };
    });
    const refresh = () => {
      for (const { mode, button } of buttons) {
        button.classList.toggle('selected', mode === this.settings.joystickMode);
      }
    };
    refresh();
    this.refreshers.push(refresh);
  }
}
