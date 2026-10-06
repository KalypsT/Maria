import {
  CONTROL_SETTING_RANGES,
  DEFAULT_CONTROL_SETTINGS,
  type ControlSettings,
  type JoystickMode,
} from '../config/controls';
import type { DisplaySettings, RenderMode } from '../config/display';
import type { AudioSettings } from '../config/audio';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';

export interface PauseMenuOptions {
  settings: ControlSettings;
  display: DisplaySettings;
  onDisplayChange: (settings: DisplaySettings) => void;
  /** Son (D-57) : appliqué aussitôt ; `persist` quand le réglage est terminé (curseur lâché). */
  audio: AudioSettings;
  onAudioChange: (settings: AudioSettings, persist: boolean) => void;
  /** Afficher les réglages tactiles (inutile sans commandes tactiles). */
  showTouchSettings: boolean;
  /** Le navigateur sait vibrer (Android) : le réglage des vibrations est proposé (D-128). */
  canVibrate: boolean;
  onResume: () => void;
  /** Ouvrir la carte (§24) ; absent : pas de bouton. */
  onOpenMap?: () => void;
  onSettingsChange: (settings: ControlSettings) => void;
  /** Code de sauvegarde (D-22) : afficher pour copier, ou importer. */
  onExportSave: () => void;
  onImportSave: () => void;
  /** Retour à l'écran d'accueil (après confirmation). */
  onQuitToTitle: () => void;
  /**
   * Outils de réglage (build de debug, D-59) : résolution, mode du joystick et parcours d'essai
   * n'apparaissent qu'avec eux.
   */
  debugTools: boolean;
  /** Passer au mode debug, ou le quitter (autre adresse, même sauvegarde). */
  onSwitchDebug: () => void;
  /** Parcours d'essai proposés (build de debug seulement). */
  levels: readonly { id: string; name: string }[];
  currentLevelId: () => string;
  onLevelChange: (id: string) => void;
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

/**
 * Menu pause en DOM (D-59, allégé) : reprendre, carte, accueil, son, commandes tactiles,
 * sauvegarde, mode debug. Les réglages d'essai ne sont que dans le build de debug.
 */
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
    const topRow = element('div', panel, 'pause-levels');
    const openMap = options.onOpenMap;
    if (openMap) {
      element('button', topRow, undefined, 'Carte').addEventListener('click', openMap);
    }
    this.addQuit(topRow);
    this.addAudio(panel);

    if (options.showTouchSettings) {
      element('h3', panel, undefined, 'Commandes tactiles');
      this.addSlider(panel, 'Taille des boutons', 'buttonScale', (v) => `${Math.round(v * 100)} %`);
      this.addSlider(panel, 'Opacité', 'opacity', (v) => `${Math.round(v * 100)} %`);
      if (options.debugTools) {
        this.addModeChoice(panel);
      }
      if (options.canVibrate) {
        this.addVibrationChoice(panel);
      }
      const reset = element('button', panel, undefined, 'Réinitialiser les commandes');
      reset.addEventListener('click', () => {
        this.settings = { ...DEFAULT_CONTROL_SETTINGS };
        this.commit();
        this.refreshers.forEach((refresh) => {
          refresh();
        });
      });
    }
    element('h3', panel, undefined, 'Sauvegarde');
    const saveRow = element('div', panel, 'pause-levels');
    element('button', saveRow, undefined, 'Code de sauvegarde').addEventListener(
      'click',
      options.onExportSave,
    );
    element('button', saveRow, undefined, 'Importer un code').addEventListener(
      'click',
      options.onImportSave,
    );
    if (options.debugTools) {
      this.addRenderChoice(panel);
      if (options.levels.length > 1) {
        this.addLevelChoice(panel);
      }
    }
    element('h3', panel, undefined, 'Mode debug');
    const debug = element(
      'button',
      panel,
      undefined,
      options.debugTools ? 'Quitter le mode debug' : 'Passer en mode debug',
    );
    debug.addEventListener('click', () => {
      debug.disabled = true;
      options.onSwitchDebug();
    });
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  open(): void {
    this.root.hidden = false;
    this.refreshers.forEach((refresh) => {
      refresh();
    });
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

  /** Vibrations (D-128) : oui ou non. */
  private addVibrationChoice(parent: HTMLElement): void {
    const row = element('div', parent, 'pause-row');
    element('span', row, undefined, 'Vibrations');
    const group = element('div', row, 'pause-choice');
    const choices: readonly [boolean, string][] = [
      [true, 'Oui'],
      [false, 'Non'],
    ];
    const buttons = choices.map(([on, text]) => {
      const button = element('button', group, undefined, text);
      button.addEventListener('click', () => {
        this.settings.vibration = on;
        this.commit();
        refresh();
      });
      return { on, button };
    });
    const refresh = () => {
      for (const { on, button } of buttons) {
        button.classList.toggle('selected', on === this.settings.vibration);
      }
    };
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

  /** Son (D-57) : volume général, volume des bruitages (D-126) et coupure. */
  private addAudio(parent: HTMLElement): void {
    element('h3', parent, undefined, 'Son');
    const audio = { ...this.options.audio };
    const row = element('label', parent, 'pause-row');
    element('span', row, undefined, 'Volume');
    const value = element('span', row, 'pause-value');
    const slider = element('input', row);
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.05';
    const sfxRow = element('label', parent, 'pause-row');
    element('span', sfxRow, undefined, 'Bruitages');
    const sfxValue = element('span', sfxRow, 'pause-value');
    const sfxSlider = element('input', sfxRow);
    sfxSlider.type = 'range';
    sfxSlider.min = '0';
    sfxSlider.max = '1';
    sfxSlider.step = '0.05';
    const mute = element('button', parent);
    const refresh = () => {
      slider.value = String(audio.volume);
      value.textContent = `${String(Math.round(audio.volume * 100))} %`;
      sfxSlider.value = String(audio.sfxVolume);
      sfxValue.textContent = `${String(Math.round(audio.sfxVolume * 100))} %`;
      mute.textContent = audio.muted ? 'Remettre le son' : 'Couper le son';
      mute.classList.toggle('selected', audio.muted);
    };
    slider.addEventListener('input', () => {
      audio.volume = Number(slider.value);
      // Monter le volume remet le son.
      audio.muted = false;
      refresh();
      this.options.onAudioChange({ ...audio }, false);
    });
    slider.addEventListener('change', () => {
      this.options.onAudioChange({ ...audio }, true);
    });
    sfxSlider.addEventListener('input', () => {
      audio.sfxVolume = Number(sfxSlider.value);
      refresh();
      this.options.onAudioChange({ ...audio }, false);
    });
    sfxSlider.addEventListener('change', () => {
      this.options.onAudioChange({ ...audio }, true);
    });
    mute.addEventListener('click', () => {
      audio.muted = !audio.muted;
      refresh();
      this.options.onAudioChange({ ...audio }, true);
    });
    refresh();
  }

  /** Résolution de rendu (D-18) : logique (par défaut) ou écran (déplacements plus fins). */
  private addRenderChoice(parent: HTMLElement): void {
    element('h3', parent, undefined, 'Affichage');
    const row = element('div', parent, 'pause-row');
    element('span', row, undefined, 'Résolution');
    const group = element('div', row, 'pause-choice');
    let current = this.options.display.renderMode;
    const choices: readonly [RenderMode, string][] = [
      ['logical', 'Logique'],
      ['screen', 'Écran'],
    ];
    const buttons = choices.map(([mode, text]) => {
      const button = element('button', group, undefined, text);
      button.addEventListener('click', () => {
        current = mode;
        this.options.onDisplayChange({ renderMode: mode });
        refresh();
      });
      return { mode, button };
    });
    const refresh = () => {
      for (const { mode, button } of buttons) {
        button.classList.toggle('selected', mode === current);
      }
    };
    refresh();
  }

  /**
   * Retour à l'accueil, confirmé par un second appui (comme « Nouvelle partie ») : la partie est
   * déjà sauvegardée à chaque lanterne et chaque événement, on la reprend à la dernière lanterne.
   */
  private addQuit(parent: HTMLElement): void {
    const quit = element('button', parent, 'pause-quit', "Retour à l'accueil");
    let confirming = false;
    quit.addEventListener('click', () => {
      if (!confirming) {
        confirming = true;
        quit.textContent = 'Quitter ? Tu reprendras à la dernière lanterne';
        return;
      }
      quit.disabled = true;
      this.options.onQuitToTitle();
    });
    this.refreshers.push(() => {
      confirming = false;
      quit.textContent = "Retour à l'accueil";
    });
  }

  /** Parcours d'essai : en choisir un y replace Céleste et reprend le jeu. */
  private addLevelChoice(parent: HTMLElement): void {
    element('h3', parent, undefined, "Parcours d'essai");
    const group = element('div', parent, 'pause-levels');
    const buttons = this.options.levels.map(({ id, name }) => {
      const button = element('button', group, undefined, name);
      button.addEventListener('click', () => {
        this.options.onLevelChange(id);
        this.options.onResume();
      });
      return { id, button };
    });
    const refresh = () => {
      const current = this.options.currentLevelId();
      for (const { id, button } of buttons) {
        button.classList.toggle('selected', id === current);
      }
    };
    refresh();
    this.refreshers.push(refresh);
  }
}
