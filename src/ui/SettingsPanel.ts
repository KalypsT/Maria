import {
  CONTROL_SETTING_RANGES,
  DEFAULT_CONTROL_SETTINGS,
  type ControlSettings,
  type JoystickMode,
} from '../config/controls';
import type { DisplaySettings, RenderMode } from '../config/display';
import type { AudioSettings } from '../config/audio';

export interface SettingsPanelOptions {
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
  /** Fermer le sac (reprendre le jeu), après le choix d'un parcours d'essai. */
  onResume: () => void;
  onSettingsChange: (settings: ControlSettings) => void;
  /**
   * Un curseur des commandes tactiles est tenu (vrai) ou lâché : le sac s'efface pour montrer les
   * commandes pendant le réglage.
   */
  onPreview: (active: boolean) => void;
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
 * Les réglages du sac (D-159, l'ancien menu pause, D-59) : aide, son, commandes tactiles,
 * sauvegarde, retour à l'accueil, mode debug (discret dans le jeu, D-182), sur deux colonnes. Les réglages d'essai ne sont que
 * dans le build de debug.
 */
export class SettingsPanel {
  readonly element: HTMLElement;
  private readonly refreshers: (() => void)[] = [];
  private settings: ControlSettings;

  constructor(private readonly options: SettingsPanelOptions) {
    this.settings = { ...options.settings };
    this.element = document.createElement('div');
    this.element.className = 'settings';
    const left = element('div', this.element, 'settings-column');
    const right = element('div', this.element, 'settings-column');
    element('h3', left, undefined, 'Aide');
    this.addChoice(left, 'Aide discrète', 'hint');
    this.addAudio(left);
    if (options.debugTools) {
      this.addRenderChoice(left);
    }

    const panel = right;
    if (options.showTouchSettings) {
      element('h3', panel, undefined, 'Commandes tactiles');
      this.addSlider(panel, 'Taille des boutons', 'buttonScale', (v) => `${Math.round(v * 100)} %`);
      this.addSlider(panel, 'Opacité', 'opacity', (v) => `${Math.round(v * 100)} %`);
      if (options.debugTools) {
        this.addModeChoice(panel);
      }
      if (options.canVibrate) {
        this.addChoice(panel, 'Vibrations', 'vibration');
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
    const saveRow = element('div', panel, 'settings-buttons');
    element('button', saveRow, undefined, 'Code de sauvegarde').addEventListener(
      'click',
      options.onExportSave,
    );
    element('button', saveRow, undefined, 'Importer un code').addEventListener(
      'click',
      options.onImportSave,
    );
    if (options.debugTools && options.levels.length > 1) {
      this.addLevelChoice(panel);
    }
    if (options.debugTools) {
      element('h3', panel, undefined, 'Mode debug');
      const debug = element('button', panel, undefined, 'Quitter le mode debug');
      debug.addEventListener('click', () => {
        debug.disabled = true;
        options.onSwitchDebug();
      });
    }
    // Retour à l'accueil, en bas des réglages (choix de l'utilisateur, D-159).
    this.addQuit(panel);
    if (!options.debugTools) {
      this.addDiscreetDebug(panel);
    }
  }

  /**
   * Dans le jeu (D-182) : le passage au mode debug reste possible, mais discret, tout en bas, en
   * petit, et confirmé par un second toucher (on n'y va pas par erreur).
   */
  private addDiscreetDebug(parent: HTMLElement): void {
    const debug = element('button', parent, 'settings-discreet', 'mode debug');
    let confirming = false;
    debug.addEventListener('click', () => {
      if (!confirming) {
        confirming = true;
        debug.textContent = 'ouvrir le mode debug ? toucher encore';
        return;
      }
      debug.disabled = true;
      this.options.onSwitchDebug();
    });
    this.refreshers.push(() => {
      confirming = false;
      debug.textContent = 'mode debug';
    });
  }

  /** Remet chaque réglage à jour (à l'ouverture du sac). */
  refresh(): void {
    this.refreshers.forEach((refresh) => {
      refresh();
    });
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
    const row = element('label', parent, 'settings-row');
    element('span', row, undefined, label);
    const slider = element('input', row);
    const value = element('span', row, 'settings-value');
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
    slider.addEventListener('pointerdown', () => {
      this.options.onPreview(true);
    });
    for (const end of ['pointerup', 'pointercancel', 'change'] as const) {
      slider.addEventListener(end, () => {
        this.options.onPreview(false);
      });
    }
    refresh();
    this.refreshers.push(refresh);
  }

  /** Un réglage oui ou non : les vibrations (D-128), le fil discret (D-129). */
  private addChoice(parent: HTMLElement, label: string, key: 'vibration' | 'hint'): void {
    const row = element('div', parent, 'settings-row');
    element('span', row, undefined, label);
    const group = element('div', row, 'settings-choice');
    const choices: readonly [boolean, string][] = [
      [true, 'Oui'],
      [false, 'Non'],
    ];
    const buttons = choices.map(([on, text]) => {
      const button = element('button', group, undefined, text);
      button.addEventListener('click', () => {
        this.settings[key] = on;
        this.commit();
        refresh();
      });
      return { on, button };
    });
    const refresh = () => {
      for (const { on, button } of buttons) {
        button.classList.toggle('selected', on === this.settings[key]);
      }
    };
    refresh();
    this.refreshers.push(refresh);
  }

  private addModeChoice(parent: HTMLElement): void {
    const row = element('div', parent, 'settings-row');
    element('span', row, undefined, 'Joystick');
    const group = element('div', row, 'settings-choice');
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
    const row = element('label', parent, 'settings-row');
    element('span', row, undefined, 'Volume');
    const slider = element('input', row);
    const value = element('span', row, 'settings-value');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.05';
    const sfxRow = element('label', parent, 'settings-row');
    element('span', sfxRow, undefined, 'Bruitages');
    const sfxSlider = element('input', sfxRow);
    const sfxValue = element('span', sfxRow, 'settings-value');
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
    const row = element('div', parent, 'settings-row');
    element('span', row, undefined, 'Résolution');
    const group = element('div', row, 'settings-choice');
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
    const quit = element('button', parent, 'settings-quit', "Retour à l'accueil");
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
    const group = element('div', parent, 'settings-buttons');
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
