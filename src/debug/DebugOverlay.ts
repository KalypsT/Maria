import Phaser from 'phaser';
import {
  DEFAULT_MOVEMENT,
  MOVEMENT_PARAM_RANGES,
  PLAYER_HITBOX,
  type MovementParams,
} from '../config/movement';
import type { GameScene } from '../scenes/GameScene';
import { movementToJson, sanitizeMovementOverrides } from './movementOverrides';

/** Identifiant de l'overlay ; sert aussi de marqueur à `check:no-debug` (décision D-12). */
const OVERLAY_ID = 'maria-debug-overlay';
const STORAGE_KEY = 'maria.debug.movement';
const HITBOX_COLOR = 0x5dff8a;
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
`;

function loadOverrides(): Partial<MovementParams> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeMovementOverrides(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

function saveOverrides(params: Readonly<MovementParams>): void {
  try {
    localStorage.setItem(STORAGE_KEY, movementToJson(params));
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

/**
 * Overlay de debug (build de debug et dev uniquement, décision D-12) : réglages de mouvement en
 * direct, hitbox, vitesse, état, mesures de performance, export JSON.
 */
export function installDebugOverlay(scene: GameScene): void {
  Object.assign(scene.movement, loadOverrides());
  scene.applyMovement();

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

  // Options d'affichage.
  let showHitbox = true;
  const hitboxCheck = element('label', panel, 'dbg-check');
  const hitboxInput = element('input', hitboxCheck);
  hitboxInput.type = 'checkbox';
  hitboxInput.checked = showHitbox;
  hitboxCheck.append('Hitbox');
  hitboxInput.addEventListener('change', () => {
    showHitbox = hitboxInput.checked;
  });

  // Curseurs de réglage.
  const refreshers: (() => void)[] = [];
  for (const key of Object.keys(MOVEMENT_PARAM_RANGES) as (keyof MovementParams)[]) {
    const range = MOVEMENT_PARAM_RANGES[key];
    const row = element('div', panel, 'dbg-row');
    const name = element('span', row, undefined, key);
    const value = element('span', row);
    const slider = element('input', row);
    slider.type = 'range';
    slider.min = String(range.min);
    slider.max = String(range.max);
    slider.step = String(range.step);
    const refresh = () => {
      const current = scene.movement[key];
      slider.value = String(current);
      value.textContent = String(current);
      name.classList.toggle('dbg-modified', current !== DEFAULT_MOVEMENT[key]);
    };
    slider.addEventListener('input', () => {
      scene.movement[key] = Number(slider.value);
      scene.applyMovement();
      saveOverrides(scene.movement);
      refresh();
    });
    refresh();
    refreshers.push(refresh);
  }

  // Actions.
  const actions = element('div', panel, 'dbg-actions');
  const exportButton = element('button', actions, undefined, 'Exporter JSON');
  exportButton.addEventListener('click', () => {
    const json = movementToJson(scene.movement);
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
    link.download = 'maria-movement.json';
    link.click();
    URL.revokeObjectURL(link.href);
    window.setTimeout(() => {
      exportButton.textContent = 'Exporter JSON';
    }, 1500);
  });
  element('button', actions, undefined, 'Valeurs par défaut').addEventListener('click', () => {
    Object.assign(scene.movement, DEFAULT_MOVEMENT);
    scene.applyMovement();
    saveOverrides(scene.movement);
    refreshers.forEach((refresh) => {
      refresh();
    });
  });
  element('button', actions, undefined, 'Replacer Céleste').addEventListener('click', () => {
    scene.respawn();
  });

  // Hitbox et stats, dessinées après la mise à jour de la scène.
  const graphics = scene.add.graphics().setDepth(1000);
  let lastStats = 0;
  let simMsSum = 0;
  let simMsMax = 0;
  let frames = 0;
  const onPostUpdate = (time: number) => {
    const player = scene.player;
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
    simMsSum += scene.frameStats.simulationMs;
    simMsMax = Math.max(simMsMax, scene.frameStats.simulationMs);
    frames++;
    if (time - lastStats >= STATS_REFRESH_MS) {
      const loop = scene.game.loop;
      stats.textContent =
        `${loop.actualFps.toFixed(0)} FPS  ${player.state.padEnd(4)}  ${player.grounded ? 'sol' : 'air'}\n` +
        `vx ${player.vx.toFixed(0).padStart(4)}  vy ${player.vy.toFixed(0).padStart(4)}  ` +
        `x ${player.box.x.toFixed(1)}  y ${player.box.y.toFixed(1)}\n` +
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
