import Phaser from 'phaser';
import { CAMERA_PARAM_RANGES, DEFAULT_CAMERA, type CameraParams } from '../config/camera';
import {
  DEFAULT_MOVEMENT,
  MOVEMENT_PARAM_RANGES,
  PLAYER_HITBOX,
  type MovementParams,
} from '../config/movement';
import { LEVELS, levelName } from '../levels';
import type { GameScene } from '../scenes/GameScene';
import {
  cameraToJson,
  movementToJson,
  orderedParams,
  sanitizeCameraOverrides,
  sanitizeMovementOverrides,
} from './movementOverrides';

/** Identifiant de l'overlay ; sert aussi de marqueur à `check:no-debug` (décision D-12). */
const OVERLAY_ID = 'maria-debug-overlay';
const STORAGE_KEY = 'maria.debug.movement';
const CAMERA_STORAGE_KEY = 'maria.debug.camera';
const HITBOX_COLOR = 0x5dff8a;
const CAMERA_GUIDE_COLOR = 0xffd166;
/** Rafraîchissement du texte de stats (ms) : inutile de toucher au DOM à chaque image. */
const STATS_REFRESH_MS = 100;

const STYLE = `
#${OVERLAY_ID} { position: fixed; z-index: 20; top: calc(var(--safe-top) + 6px);
  right: calc(var(--safe-right) + 6px); font: 12px/1.3 ui-monospace, monospace; color: #eee;
  display: flex; flex-direction: column; align-items: flex-end; gap: 4px; max-height: calc(100% - 12px); }
#${OVERLAY_ID} button { font: inherit; color: #fff; background: #3b3850; border: 1px solid #6b678a;
  border-radius: 6px; padding: 6px 10px; }
#${OVERLAY_ID} .dbg-bar { display: flex; gap: 4px; align-items: center; }
#${OVERLAY_ID} .dbg-stats { background: rgb(0 0 0 / 60%); padding: 4px 6px; border-radius: 4px;
  white-space: pre; text-align: left; }
#${OVERLAY_ID} .dbg-panel { background: rgb(20 18 30 / 92%); border: 1px solid #6b678a;
  border-radius: 8px; padding: 8px; width: min(300px, 45vw); overflow-y: auto; touch-action: pan-y;
  /* Laisse libre le bas de l'écran (commandes tactiles) pour régler et essayer en même temps. */
  max-height: calc(100vh - var(--safe-top) - var(--safe-bottom) - 190px); }
#${OVERLAY_ID} .dbg-panel[hidden] { display: none; }
#${OVERLAY_ID} .dbg-row { display: grid; grid-template-columns: 1fr auto; gap: 0 6px; margin: 6px 0; }
#${OVERLAY_ID} .dbg-row input[type=range] { grid-column: 1 / 3; width: 100%; height: 28px; }
#${OVERLAY_ID} .dbg-modified { color: #ffb3d6; }
#${OVERLAY_ID} .dbg-actions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
#${OVERLAY_ID} label.dbg-check { display: flex; gap: 6px; align-items: center; margin: 4px 0; }
#${OVERLAY_ID} summary { font-weight: bold; padding: 6px 0; }
#${OVERLAY_ID} details { border-top: 1px solid #6b678a; }
#${OVERLAY_ID} select { font: inherit; width: 100%; padding: 6px; margin: 4px 0; }
`;

function load<T>(key: string, sanitize: (raw: unknown) => Partial<T>): Partial<T> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? sanitize(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

function save(key: string, json: string): void {
  try {
    localStorage.setItem(key, json);
  } catch {
    // Stockage indisponible (navigation privée) : les réglages restent valables pour la session.
  }
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

interface SliderGroup<T> {
  title: string;
  values: T;
  defaults: Readonly<T>;
  ranges: Readonly<Record<keyof T, { min: number; max: number; step: number }>>;
  onChange: () => void;
}

/** Section repliable de curseurs ; retourne la fonction qui les resynchronise avec les valeurs. */
function addSliders<T extends object>(parent: HTMLElement, group: SliderGroup<T>): () => void {
  const details = element('details', parent);
  element('summary', details, undefined, group.title);
  const refreshers: (() => void)[] = [];
  for (const key of Object.keys(group.ranges) as (keyof T & string)[]) {
    const range = group.ranges[key];
    const row = element('div', details, 'dbg-row');
    const name = element('span', row, undefined, key);
    const value = element('span', row);
    const slider = element('input', row);
    slider.type = 'range';
    slider.min = String(range.min);
    slider.max = String(range.max);
    slider.step = String(range.step);
    const values = group.values as Record<string, number>;
    const defaults = group.defaults as Readonly<Record<string, number>>;
    const refresh = () => {
      const current = values[key] ?? 0;
      slider.value = String(current);
      value.textContent = String(current);
      name.classList.toggle('dbg-modified', current !== defaults[key]);
    };
    slider.addEventListener('input', () => {
      values[key] = Number(slider.value);
      group.onChange();
      refresh();
    });
    refresh();
    refreshers.push(refresh);
  }
  return () => {
    refreshers.forEach((refresh) => {
      refresh();
    });
  };
}

function addCheck(
  parent: HTMLElement,
  label: string,
  initial: boolean,
  onChange: (checked: boolean) => void,
): void {
  const row = element('label', parent, 'dbg-check');
  const input = element('input', row);
  input.type = 'checkbox';
  input.checked = initial;
  row.append(label);
  input.addEventListener('change', () => {
    onChange(input.checked);
  });
}

/**
 * Overlay de debug (build de debug et dev uniquement, décision D-12) : réglages de mouvement et de
 * caméra en direct, choix de la salle, hitbox et repères de caméra, mesures, export JSON.
 */
export function installDebugOverlay(scene: GameScene): void {
  // Accès depuis la console ou un script de test (Playwright) : build de debug uniquement.
  (window as unknown as { mariaScene?: GameScene }).mariaScene = scene;
  Object.assign(scene.movement, load(STORAGE_KEY, sanitizeMovementOverrides));
  scene.applyMovement();
  Object.assign(scene.cameraParams, load(CAMERA_STORAGE_KEY, sanitizeCameraOverrides));
  scene.applyCamera();

  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);

  const root = element('div', document.body);
  root.id = OVERLAY_ID;
  root.dataset.uiOverlay = '';
  const bar = element('div', root, 'dbg-bar');
  const stats = element('div', bar, 'dbg-stats');
  const toggle = element('button', bar, undefined, 'DEBUG');
  const panel = element('div', root, 'dbg-panel');
  panel.hidden = true;
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });

  // Salle (téléportation de zone) et options d'affichage.
  const select = element('select', panel);
  for (const source of LEVELS) {
    const option = element('option', select, undefined, levelName(source));
    option.value = source.id;
  }
  select.value = scene.level.id;
  select.addEventListener('change', () => {
    const source = LEVELS.find((level) => level.id === select.value);
    if (source) {
      scene.loadLevel(source);
    }
    select.blur();
  });
  let showHitbox = true;
  let showCamera = false;
  addCheck(panel, 'Hitbox', showHitbox, (checked) => {
    showHitbox = checked;
  });
  addCheck(panel, 'Repères de caméra', showCamera, (checked) => {
    showCamera = checked;
  });

  const refreshMovement = addSliders<MovementParams>(panel, {
    title: 'Mouvement',
    values: scene.movement,
    defaults: DEFAULT_MOVEMENT,
    ranges: MOVEMENT_PARAM_RANGES,
    onChange: () => {
      scene.applyMovement();
      save(STORAGE_KEY, movementToJson(scene.movement));
    },
  });
  const refreshCamera = addSliders<CameraParams>(panel, {
    title: 'Caméra',
    values: scene.cameraParams,
    defaults: DEFAULT_CAMERA,
    ranges: CAMERA_PARAM_RANGES,
    onChange: () => {
      scene.applyCamera();
      save(CAMERA_STORAGE_KEY, cameraToJson(scene.cameraParams));
    },
  });

  // Actions.
  const actions = element('div', panel, 'dbg-actions');
  const exportButton = element('button', actions, undefined, 'Exporter JSON');
  exportButton.addEventListener('click', () => {
    const json = JSON.stringify(
      {
        movement: orderedParams(scene.movement, MOVEMENT_PARAM_RANGES),
        camera: orderedParams(scene.cameraParams, CAMERA_PARAM_RANGES),
      },
      null,
      2,
    );
    void navigator.clipboard.writeText(json).then(
      () => {
        exportButton.textContent = 'Copié !';
      },
      () => {
        exportButton.textContent = 'Téléchargé';
      },
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    link.download = 'maria-settings.json';
    link.click();
    URL.revokeObjectURL(link.href);
    window.setTimeout(() => {
      exportButton.textContent = 'Exporter JSON';
    }, 1500);
  });
  element('button', actions, undefined, 'Valeurs par défaut').addEventListener('click', () => {
    Object.assign(scene.movement, DEFAULT_MOVEMENT);
    scene.applyMovement();
    save(STORAGE_KEY, movementToJson(scene.movement));
    Object.assign(scene.cameraParams, DEFAULT_CAMERA);
    scene.applyCamera();
    save(CAMERA_STORAGE_KEY, cameraToJson(scene.cameraParams));
    refreshMovement();
    refreshCamera();
  });
  element('button', actions, undefined, 'Replacer Céleste').addEventListener('click', () => {
    scene.respawn();
  });

  // Hitbox, repères et stats, dessinés après la mise à jour de la scène.
  const graphics = scene.add.graphics().setDepth(1000);
  let lastStats = 0;
  let simMsSum = 0;
  let simMsMax = 0;
  let frames = 0;
  const onPostUpdate = (time: number) => {
    const player = scene.player;
    const camera = scene.camera;
    graphics.clear();
    if (showHitbox) {
      graphics.lineStyle(1, HITBOX_COLOR, 1);
      graphics.strokeRect(
        player.box.x + 0.5,
        player.box.y + 0.5,
        PLAYER_HITBOX.width - 1,
        PLAYER_HITBOX.height - 1,
      );
    }
    if (showCamera) {
      const p = scene.cameraParams;
      const view = scene.cameras.main.worldView;
      const half = p.deadZoneWidthPx / 2;
      graphics.lineStyle(1, CAMERA_GUIDE_COLOR, 0.8);
      // Zone morte horizontale, autour du centre de la vue.
      graphics.lineBetween(camera.x - half, view.y, camera.x - half, view.bottom);
      graphics.lineBetween(camera.x + half, view.y, camera.x + half, view.bottom);
      // Bande verticale autour du dernier sol.
      graphics.lineStyle(1, CAMERA_GUIDE_COLOR, 0.5);
      graphics.lineBetween(
        view.x,
        camera.refFeetY - p.bandUpPx,
        view.right,
        camera.refFeetY - p.bandUpPx,
      );
      graphics.lineBetween(
        view.x,
        camera.refFeetY + p.bandDownPx,
        view.right,
        camera.refFeetY + p.bandDownPx,
      );
      // Cible d'anticipation et centre de la vue.
      const targetX = player.box.x + player.box.width / 2 + camera.lookAheadOffset;
      graphics.fillStyle(CAMERA_GUIDE_COLOR, 1);
      graphics.fillRect(targetX - 1, player.box.y - 6, 3, 3);
      graphics.strokeCircle(camera.x, camera.y, 3);
    }
    simMsSum += scene.frameStats.simulationMs;
    simMsMax = Math.max(simMsMax, scene.frameStats.simulationMs);
    frames++;
    if (time - lastStats >= STATS_REFRESH_MS) {
      // La salle peut aussi changer depuis le menu pause.
      if (select.value !== scene.level.id && document.activeElement !== select) {
        select.value = scene.level.id;
      }
      const loop = scene.game.loop;
      stats.textContent =
        `${loop.actualFps.toFixed(0)} FPS  ${player.state.padEnd(4)}  ${player.grounded ? 'sol' : 'air'}\n` +
        `vx ${player.vx.toFixed(0).padStart(4)}  vy ${player.vy.toFixed(0).padStart(4)}  ` +
        `x ${player.box.x.toFixed(1)}  y ${player.box.y.toFixed(1)}\n` +
        `cam ${camera.x.toFixed(0)} ${camera.y.toFixed(0)}  avance ${camera.lookAheadOffset.toFixed(0)}  ` +
        `vue ${camera.viewWidth.toFixed(0)}×${camera.viewHeight.toFixed(0)}\n` +
        `simu ${((simMsSum / frames) * 1000).toFixed(0)} µs/img (max ${(simMsMax * 1000).toFixed(0)})  ` +
        `pas perdus ${scene.clock.droppedSteps}`;
      const touch = scene.touch;
      if (touch) {
        const stick = touch.controller.joystick;
        stats.textContent +=
          `\ndoigts ${touch.activeCount}  joystick ${stick.outX.toFixed(2)} ${stick.outY.toFixed(2)}` +
          `  boutons ${touch.controller.heldMask.toString(2).padStart(6, '0')}`;
      }
      lastStats = time;
      simMsSum = 0;
      simMsMax = 0;
      frames = 0;
    }
  };
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, onPostUpdate);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, onPostUpdate);
    root.remove();
    style.remove();
  });
}
