import { RECORDS, recordSlot } from '../config/records';
import { StoryFlag } from '../config/story';
import Phaser from 'phaser';
import { CAMERA_PARAM_RANGES, DEFAULT_CAMERA, type CameraParams } from '../config/camera';
import { COMBAT_PARAM_RANGES, DEFAULT_COMBAT, type CombatParams } from '../config/combat';
import { DEFAULT_FEEL, FEEL_PARAM_RANGES, type FeelParams } from '../config/feel';
import { DEFAULT_WORLD, WORLD_PARAM_RANGES, type WorldParams } from '../config/world';
import { DEFAULT_PUPPET, PUPPET_PARAM_RANGES, type PuppetParams } from '../config/puppet';
import { ART_FINISH_RANGES, DEFAULT_ART_FINISH, type ArtFinish } from '../config/art';
import { deserializeSave } from '../core/save/saveData';
import { HitchMonitor, type FrameWork } from '../core/perf/hitchMonitor';
import { STRANGE_MOCKUPS, STRANGE_MOCKUP_NAMES } from '../config/strangeThemes';
import { DEFAULT_MOVEMENT, MOVEMENT_PARAM_RANGES, type MovementParams } from '../config/movement';
import { LEVELS, ZONES, levelName } from '../levels';
import type { GameScene } from '../scenes/GameScene';
import {
  cameraToJson,
  combatToJson,
  feelToJson,
  movementToJson,
  orderedParams,
  sanitizeCameraOverrides,
  sanitizeCombatOverrides,
  sanitizeFeelOverrides,
  sanitizeWorldOverrides,
  worldToJson,
  sanitizeMovementOverrides,
} from './movementOverrides';

/** Identifiant de l'overlay ; sert aussi de marqueur à `check:no-debug` (décision D-12). */
const OVERLAY_ID = 'maria-debug-overlay';
const STORAGE_KEY = 'maria.debug.movement';
const CAMERA_STORAGE_KEY = 'maria.debug.camera';
const FEEL_STORAGE_KEY = 'maria.debug.feel';
const COMBAT_STORAGE_KEY = 'maria.debug.combat';
const WORLD_STORAGE_KEY = 'maria.debug.world';
/** Cadre d'infos (FPS, position…) affiché ou masqué (D-59). */
const STATS_STORAGE_KEY = 'maria.debug.stats';
/** Sons de test des bruitages (D-126). */
const SFX_TEST_STORAGE_KEY = 'maria.debug.sfxTest';
const ATTACK_COLOR = 0xff5d5d;
const ENEMY_BOX_COLOR = 0xffa24d;
const ENEMY_STATE_LABEL = ['patrouille', 'étourdi', 'dispersé'] as const;
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
#${OVERLAY_ID} .dbg-stats[hidden] { display: none; }
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
): HTMLInputElement {
  const row = element('label', parent, 'dbg-check');
  const input = element('input', row);
  input.type = 'checkbox';
  input.checked = initial;
  row.append(label);
  input.addEventListener('change', () => {
    onChange(input.checked);
  });
  return input;
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
  Object.assign(scene.feelParams, load(FEEL_STORAGE_KEY, sanitizeFeelOverrides));
  scene.applyFeel();
  Object.assign(scene.combatParams, load(COMBAT_STORAGE_KEY, sanitizeCombatOverrides));
  scene.applyCombat();
  Object.assign(scene.worldParams, load(WORLD_STORAGE_KEY, sanitizeWorldOverrides));
  scene.applyWorld();

  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);

  const root = element('div', document.body);
  root.id = OVERLAY_ID;
  root.dataset.uiOverlay = '';
  const bar = element('div', root, 'dbg-bar');
  const stats = element('div', bar, 'dbg-stats');
  // Cadre d'infos : masqué ou affiché d'un toucher, choix retenu (D-59).
  let statsShown = true;
  try {
    statsShown = localStorage.getItem(STATS_STORAGE_KEY) !== 'hidden';
  } catch {
    // Stockage indisponible : affiché.
  }
  stats.hidden = !statsShown;
  const infoToggle = element('button', bar, undefined, 'INFOS');
  infoToggle.addEventListener('click', () => {
    stats.hidden = !stats.hidden;
    save(STATS_STORAGE_KEY, stats.hidden ? 'hidden' : 'shown');
  });
  const toggle = element('button', bar, undefined, 'DEBUG');
  const panel = element('div', root, 'dbg-panel');
  panel.hidden = true;
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });

  // Salle (téléportation de zone) et options d'affichage.
  const select = element('select', panel);
  for (const zone of ZONES) {
    for (const [id, level] of zone.rooms) {
      const option = element('option', select, undefined, `${zone.id} · ${level.meta.name ?? id}`);
      option.value = id;
    }
  }
  for (const source of LEVELS) {
    const option = element('option', select, undefined, levelName(source));
    option.value = source.id;
  }
  select.value = scene.level.id;
  select.addEventListener('change', () => {
    const source = LEVELS.find((level) => level.id === select.value);
    if (source) {
      scene.loadLevel(source);
    } else {
      scene.teleportToRoom(select.value);
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
  // Aperçu du monde étrange (D-28) : mêmes formes, autre palette et lumière.
  addCheck(panel, 'Monde étrange (aperçu)', scene.strangeWorld, (checked) => {
    scene.setStrangeWorld(checked);
  });
  // Finition (D-71) : avant / après, sans toucher aux réglages.
  let finishBackup: ArtFinish | null = null;
  addCheck(panel, 'Comparer : sans finition', false, (checked) => {
    if (checked) {
      finishBackup = { ...scene.artFinish };
      Object.assign(scene.artFinish, {
        playShadow: 0,
        backShadow: 0,
        contactShadow: 0,
        grain: 0,
        celesteShadow: 0,
        veil: 0,
        vignette: 0,
      });
    } else if (finishBackup) {
      Object.assign(scene.artFinish, finishBackup);
      finishBackup = null;
    }
    scene.applyFinish();
    refreshFinish();
  });
  // Maquettes du monde étrange (D-130) : la palette, le motif, les liserés et le halo à comparer.
  const mockupSelect = element('select', panel);
  element('option', mockupSelect, undefined, 'Maquette du monde étrange : actuelle').value = '';
  for (const mockup of STRANGE_MOCKUPS) {
    element('option', mockupSelect, undefined, STRANGE_MOCKUP_NAMES[mockup]).value = mockup;
  }
  mockupSelect.value = scene.strangeMockup ?? '';
  mockupSelect.addEventListener('change', () => {
    const value = mockupSelect.value;
    scene.setStrangeMockup(STRANGE_MOCKUPS.find((m) => m === value) ?? null);
    mockupSelect.blur();
  });
  // Sensations proposées (D-125) : écrasement, inclinaison, poussière et saut adouci d'un coup,
  // pour comparer sur téléphone ; les valeurs par défaut du jeu ne changent pas.
  const proposedFeel = addCheck(
    panel,
    'Sensations proposées',
    scene.feelParams.squashEnabled >= 1 &&
      scene.feelParams.dustEnabled >= 1 &&
      scene.movement.jumpReleaseMode >= 1,
    (checked) => {
      const on = checked ? 1 : 0;
      scene.feelParams.squashEnabled = on;
      scene.feelParams.dustEnabled = on;
      scene.movement.jumpReleaseMode = on;
      scene.applyFeel();
      scene.applyMovement();
      save(FEEL_STORAGE_KEY, feelToJson(scene.feelParams));
      save(STORAGE_KEY, movementToJson(scene.movement));
      refreshFeel();
      refreshMovement();
    },
  );
  // Sons de test (D-126) : un emplacement de bruitage sans fichier joue un petit son synthétisé.
  try {
    scene.audio.sfx.testTones = localStorage.getItem(SFX_TEST_STORAGE_KEY) === 'on';
  } catch {
    // Stockage indisponible : désactivés.
  }
  addCheck(panel, 'Sons de test (bruitages sans fichier)', scene.audio.sfx.testTones, (checked) => {
    scene.audio.sfx.testTones = checked;
    save(SFX_TEST_STORAGE_KEY, checked ? 'on' : 'off');
  });
  // Étape de l'histoire (D-31) : pour la partie en cours seulement, sans sauvegarde.
  const storySelect = element('select', panel);
  const F = StoryFlag;
  const steps: [string, string[]][] = [
    ['Histoire : le soir (début)', []],
    ['Histoire : a joué avec Maria', [F.EveningPlayed]],
    ['Histoire : couverture prise', [F.EveningPlayed, F.EveningBlanket]],
    ['Histoire : Maria couchée', [F.EveningPlayed, F.EveningBlanket, F.EveningTucked]],
    ['Histoire : le matin', [F.EveningPlayed, F.EveningBlanket, F.EveningTucked, F.Slept]],
    [
      'Histoire : chausson et biberon ramassés',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.TraceHall,
        F.TraceStairs,
        F.SlipperTaken,
        F.BottleTaken,
      ],
    ],
    [
      'Histoire : Maria disparue (monde étrange ouvert)',
      [F.EveningPlayed, F.EveningBlanket, F.EveningTucked, F.Slept, F.MariaSeen, F.MariaVanished],
    ],
    [
      'Histoire : fin du monde étrange (bandeau sur le lit)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
      ],
    ],
    [
      'Histoire : papa est passé (aller voir maman)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
      ],
    ],
    [
      'Histoire : câlin de maman (la nuit, aller se coucher)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
      ],
    ],
    [
      'Histoire : le bonnet trouvé (portillon à ouvrir)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
      ],
    ],
    [
      'Histoire : portillon ouvert (la rue)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
      ],
    ],
    [
      'Histoire : l’école ouverte (monde étrange à faire)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
      ],
    ],
    [
      'Histoire : le lendemain de l’école (palissade ouverte)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
      ],
    ],
    [
      'Histoire : la gare (le crochet à trouver)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
      ],
    ],
    [
      'Histoire : la gare étrange (les objets perdus, la tour)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
      ],
    ],
    [
      'Histoire : Roger trouvé, la nuit après la gare (au lit)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
      ],
    ],
    [
      'Histoire : quelques mois après la gare (phase 3, le train à quai)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
      ],
    ],
    [
      'Histoire : le train, en route (la glissade à apprendre, D-85)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
      ],
    ],
    [
      'Histoire : le train, la nuit (la lueur, D-85)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
      ],
    ],
    [
      'Histoire : le train étrange (la cuisine, la vaisselle, D-88)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
      ],
    ],
    [
      'Histoire : la cuisine rose trouvée (fin du train étrange, D-88)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
      ],
    ],
    [
      'Histoire : le train arrivé, la gare de la mer (D-90)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
      ],
    ],
    [
      'Histoire : la classe de mer, au centre (D-98)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
      ],
    ],
    [
      'Histoire : la première marée, le banc (D-99)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.TideHigh,
      ],
    ],
    [
      'Histoire : le soir de la fête, la jetée (D-101)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.SeaSawCarousel,
        F.SeaEvening,
      ],
    ],
    [
      'Histoire : la fête engloutie (le carrousel, D-102)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.SeaSawCarousel,
        F.SeaEvening,
        F.SeaStrange,
      ],
    ],
    [
      'Histoire : le livre musical trouvé, la nuit au dortoir (D-104, D-105)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.SeaSawCarousel,
        F.SeaEvening,
        F.SeaStrange,
        F.SeaStrangeDone,
      ],
    ],
    [
      'Histoire : la fin de la station balnéaire (la porte du couloir, D-105)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.SeaSawCarousel,
        F.SeaEvening,
        F.SeaStrange,
        F.SeaStrangeDone,
        F.SeaEnd,
      ],
    ],
    [
      'Histoire : la maison de la nounou, l’entrée et le miroir (D-110)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.SeaSawCarousel,
        F.SeaEvening,
        F.SeaStrange,
        F.SeaStrangeDone,
        F.SeaEnd,
        F.NannyArrived,
      ],
    ],
    [
      'Histoire : la bascule apprise, la maison de la nounou (D-110)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.SeaSawCarousel,
        F.SeaEvening,
        F.SeaStrange,
        F.SeaStrangeDone,
        F.SeaEnd,
        F.NannyArrived,
        F.NannyMirror,
        F.NannyHouse,
      ],
    ],
    [
      'Histoire : l’îlot de la chambre fait, le cube rose trouvé (D-112, D-122)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.SeaSawCarousel,
        F.SeaEvening,
        F.SeaStrange,
        F.SeaStrangeDone,
        F.SeaEnd,
        F.NannyArrived,
        F.NannyMirror,
        F.NannyHouse,
        F.NannyBedDone,
      ],
    ],
    [
      'Histoire : les îlots de la chambre et de l’école faits (D-113)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.SeaSawCarousel,
        F.SeaEvening,
        F.SeaStrange,
        F.SeaStrangeDone,
        F.SeaEnd,
        F.NannyArrived,
        F.NannyMirror,
        F.NannyHouse,
        F.NannyBedDone,
        F.NannySchoolDone,
      ],
    ],
    [
      'Histoire : les îlots de la chambre, de l’école et de la gare faits (D-114)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.SeaSawCarousel,
        F.SeaEvening,
        F.SeaStrange,
        F.SeaStrangeDone,
        F.SeaEnd,
        F.NannyArrived,
        F.NannyMirror,
        F.NannyHouse,
        F.NannyBedDone,
        F.NannySchoolDone,
        F.NannyStationDone,
      ],
    ],
    [
      'Histoire : les quatre îlots faits (D-115)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.SeaSawCarousel,
        F.SeaEvening,
        F.SeaStrange,
        F.SeaStrangeDone,
        F.SeaEnd,
        F.NannyArrived,
        F.NannyMirror,
        F.NannyHouse,
        F.NannyBedDone,
        F.NannySchoolDone,
        F.NannyStationDone,
        F.NannySeaDone,
      ],
    ],
    [
      'Histoire : le torchon blanc retrouvé (D-116)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.SeaSawCarousel,
        F.SeaEvening,
        F.SeaStrange,
        F.SeaStrangeDone,
        F.SeaEnd,
        F.NannyArrived,
        F.NannyMirror,
        F.NannyHouse,
        F.NannyBedDone,
        F.NannySchoolDone,
        F.NannyStationDone,
        F.NannySeaDone,
        F.NannyClothDone,
      ],
    ],
    [
      'Histoire : l’effacement, la cage d’escalier (D-117)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.SeaSawCarousel,
        F.SeaEvening,
        F.SeaStrange,
        F.SeaStrangeDone,
        F.SeaEnd,
        F.NannyArrived,
        F.NannyMirror,
        F.NannyHouse,
        F.NannyBedDone,
        F.NannySchoolDone,
        F.NannyStationDone,
        F.NannySeaDone,
        F.NannyClothDone,
        F.NannyErasure,
      ],
    ],
    [
      'Histoire : l’effacement dissous (D-117)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.SeaSawCarousel,
        F.SeaEvening,
        F.SeaStrange,
        F.SeaStrangeDone,
        F.SeaEnd,
        F.NannyArrived,
        F.NannyMirror,
        F.NannyHouse,
        F.NannyBedDone,
        F.NannySchoolDone,
        F.NannyStationDone,
        F.NannySeaDone,
        F.NannyClothDone,
        F.NannyErasure,
        F.NannyPlay1,
        F.NannyPlay2,
        F.NannyPlay3,
        F.NannyErasureGone,
      ],
    ],
    [
      'Histoire : Eden, le souvenir joué (D-118)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.SeaSawCarousel,
        F.SeaEvening,
        F.SeaStrange,
        F.SeaStrangeDone,
        F.SeaEnd,
        F.NannyArrived,
        F.NannyMirror,
        F.NannyHouse,
        F.NannyBedDone,
        F.NannySchoolDone,
        F.NannyStationDone,
        F.NannySeaDone,
        F.NannyClothDone,
        F.NannyErasure,
        F.NannyPlay1,
        F.NannyPlay2,
        F.NannyPlay3,
        F.NannyErasureGone,
        F.NannyEden,
      ],
    ],
    [
      'Histoire : quelques mois plus tard, le soir (phase 4, niveau 8, D-119, D-139)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
        F.GardenTreehouse,
        F.HedgeEntered,
        F.HedgeDone,
        F.GateOpen,
        F.StreetMom,
        F.StreetDad,
        F.SchoolOpen,
        F.SchoolStrange,
        F.SchoolDone,
        F.StreetMorning,
        F.StreetMomCrane,
        F.StationArrived,
        F.StationStrange,
        F.StationDone,
        F.GrownOlder,
        F.StationTrain,
        F.TrainBoarding,
        F.TrainDeparted,
        F.TrainSlide,
        F.TrainNight,
        F.TrainConductor,
        F.TrainRestaurantOpen,
        F.TrainStrange,
        F.TrainStrangeDone,
        F.TrainMorning,
        F.TrainArrived,
        F.SeaArrived,
        F.SeaFirstTide,
        F.SeaSawCarousel,
        F.SeaEvening,
        F.SeaStrange,
        F.SeaStrangeDone,
        F.SeaEnd,
        F.NannyArrived,
        F.NannyMirror,
        F.NannyHouse,
        F.NannyBedDone,
        F.NannySchoolDone,
        F.NannyStationDone,
        F.NannySeaDone,
        F.NannyClothDone,
        F.NannyErasure,
        F.NannyPlay1,
        F.NannyPlay2,
        F.NannyPlay3,
        F.NannyErasureGone,
        F.NannyEden,
        F.NannyWake,
        F.GrownFourth,
      ],
    ],
    [
      'Histoire : quelques mois plus tard (Céleste a grandi)',
      [
        F.EveningPlayed,
        F.EveningBlanket,
        F.EveningTucked,
        F.Slept,
        F.MariaSeen,
        F.MariaVanished,
        F.StrangeDone,
        F.DadVisit,
        F.MomHug,
        F.Grown,
      ],
    ],
  ];
  // La dernière nuit (D-139) : le soir de la phase 4 vécu, le berceau vide s'éclaire ; puis la
  // chambre immense (D-141) et son ciel (D-142).
  const phaseFour = steps.find(([, flags]) => flags.includes(F.GrownFourth));
  if (phaseFour) {
    const night = [...phaseFour[1], F.FinaleRug, F.FinaleCradle, F.FinaleGoodnight, F.FinaleNight];
    steps.splice(
      steps.indexOf(phaseFour) + 1,
      0,
      ['Histoire : la dernière nuit, le berceau vide (D-139)', night],
      ['Histoire : la chambre immense (D-141)', [...night, F.FinaleEntered]],
      [
        'Histoire : le ciel de la chambre (D-142)',
        [...night, F.FinaleEntered, F.FinaleMusicBox, F.FinaleSky],
      ],
    );
  }
  const current = [...scene.story.flags].sort().join();
  for (const [label, flags] of steps) {
    const option = element('option', storySelect, undefined, label);
    option.value = flags.join();
    if ([...flags].sort().join() === current) {
      storySelect.value = option.value;
    }
  }
  storySelect.addEventListener('change', () => {
    scene.setStoryFlags(storySelect.value ? storySelect.value.split(',') : []);
    storySelect.blur();
  });
  // Souvenir jouable (D-89) : comme depuis le cahier (hors partie, retour ici à la fin).
  element('button', panel, undefined, 'Jouer le souvenir de la cuisine').addEventListener(
    'click',
    (event) => {
      scene.playMemory('kitchen', false);
      (event.currentTarget as HTMLElement).blur();
    },
  );
  element('button', panel, undefined, 'Jouer le souvenir d’Eden').addEventListener(
    'click',
    (event) => {
      scene.playMemory('eden', false);
      (event.currentTarget as HTMLElement).blur();
    },
  );
  // Les disques (D-121) : trouvés (sauvegardé), ou joués sans passer par le grenier.
  const records = RECORDS.filter((r) => scene.audio.has(recordSlot(r.id)));
  element('button', panel, undefined, 'Débloquer les disques').addEventListener(
    'click',
    (event) => {
      for (const r of records) {
        void scene.session.addMemory(recordSlot(r.id));
      }
      (event.currentTarget as HTMLElement).blur();
    },
  );
  for (const r of records) {
    element('button', panel, undefined, `Jouer le disque « ${r.title} »`).addEventListener(
      'click',
      (event) => {
        scene.audio.playRecord(r.id);
        (event.currentTarget as HTMLElement).blur();
      },
    );
  }
  element('button', panel, undefined, 'Arrêter le disque').addEventListener('click', (event) => {
    scene.audio.stopRecord();
    (event.currentTarget as HTMLElement).blur();
  });
  // Phase de croissance (D-43) : le drapeau de l'histoire, sans sauvegarde.
  addCheck(panel, 'Croissance : Céleste a grandi', scene.story.flags.has(F.Grown), (checked) => {
    const flags = new Set(scene.story.flags);
    if (checked) {
      flags.add(F.Grown);
    } else {
      flags.delete(F.Grown);
    }
    scene.setStoryFlags([...flags]);
  });
  addCheck(
    panel,
    'Croissance : phase 3 (après la gare)',
    scene.story.flags.has(F.GrownOlder),
    (checked) => {
      const flags = new Set(scene.story.flags);
      if (checked) {
        flags.add(F.Grown);
        flags.add(F.GrownOlder);
      } else {
        flags.delete(F.GrownOlder);
      }
      scene.setStoryFlags([...flags]);
    },
  );
  // La marée (D-95) : la salle de marée change aussitôt, Céleste reste où elle est.
  addCheck(
    panel,
    'Marée haute (la station balnéaire)',
    scene.story.flags.has(F.TideHigh),
    (checked) => {
      const flags = new Set(scene.story.flags);
      if (checked) {
        flags.add(F.TideHigh);
      } else {
        flags.delete(F.TideHigh);
      }
      scene.setStoryFlags([...flags]);
    },
  );
  // Déblocage des capacités (D-26) : pour la partie en cours seulement, sans sauvegarde.
  addCheck(panel, 'Capacité : grimper aux rebords', scene.debugClimb, (checked) => {
    scene.debugClimb = checked;
    scene.applyAbilities();
  });
  addCheck(panel, 'Capacité : saut mural', scene.debugWallJump, (checked) => {
    scene.debugWallJump = checked;
    scene.applyAbilities();
  });
  addCheck(panel, 'Capacité : parapluie', scene.debugUmbrella, (checked) => {
    scene.debugUmbrella = checked;
    scene.applyAbilities();
  });
  addCheck(panel, 'Capacité : crochet du parapluie', scene.debugHook, (checked) => {
    scene.debugHook = checked;
    scene.applyAbilities();
  });
  addCheck(panel, 'Capacité : glissade', scene.debugSlide, (checked) => {
    scene.debugSlide = checked;
    scene.applyAbilities();
  });
  addCheck(panel, 'Capacité : bascule', scene.debugShift, (checked) => {
    scene.debugShift = checked;
    scene.applyAbilities();
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

  const refreshFeel = addSliders<FeelParams>(panel, {
    title: 'Fluidité (visuel)',
    values: scene.feelParams,
    defaults: DEFAULT_FEEL,
    ranges: FEEL_PARAM_RANGES,
    onChange: () => {
      scene.applyFeel();
      save(FEEL_STORAGE_KEY, feelToJson(scene.feelParams));
    },
  });

  const refreshPuppet = addSliders<PuppetParams>(panel, {
    title: 'Céleste (papier découpé)',
    values: scene.puppetParams,
    defaults: DEFAULT_PUPPET,
    ranges: PUPPET_PARAM_RANGES,
    onChange: () => {
      scene.applyPuppet();
    },
  });

  // La salle est redessinée (un peu coûteux) : seulement une fois le curseur immobile.
  let finishTimer = 0;
  const refreshFinish = addSliders<ArtFinish>(panel, {
    title: 'Habillage (finition)',
    values: scene.artFinish,
    defaults: DEFAULT_ART_FINISH,
    ranges: ART_FINISH_RANGES,
    onChange: () => {
      window.clearTimeout(finishTimer);
      finishTimer = window.setTimeout(() => {
        scene.applyFinish();
      }, 200);
    },
  });

  const refreshCombat = addSliders<CombatParams>(panel, {
    title: 'Combat',
    values: scene.combatParams,
    defaults: DEFAULT_COMBAT,
    ranges: COMBAT_PARAM_RANGES,
    onChange: () => {
      scene.applyCombat();
      save(COMBAT_STORAGE_KEY, combatToJson(scene.combatParams));
    },
  });

  const refreshWorld = addSliders<WorldParams>(panel, {
    title: 'Échec et peur',
    values: scene.worldParams,
    defaults: DEFAULT_WORLD,
    ranges: WORLD_PARAM_RANGES,
    onChange: () => {
      scene.applyWorld();
      save(WORLD_STORAGE_KEY, worldToJson(scene.worldParams));
    },
  });

  // Sauvegarde (D-22) : inspection des emplacements, checkpoints, tests de récupération.
  const saveSection = element('details', panel);
  element('summary', saveSection, undefined, 'Sauvegarde');
  const saveInfo = element('div', saveSection, 'dbg-stats');
  const refreshSave = async () => {
    const manager = scene.session.manager;
    const slots = await manager.storage.read();
    const describe = (text: string | null) => {
      if (text === null) {
        return 'vide';
      }
      const result = deserializeSave(text);
      return result.ok
        ? `valide (${new Date(result.data.savedAt).toLocaleTimeString()})`
        : `refusé : ${result.problem}`;
    };
    const checkpoints = scene.run.checkpoints
      .map((c, i) => `${c.id}${c.activated ? ' ✓' : ''}${i === scene.run.current ? ' ←' : ''}`)
      .join('  ');
    saveInfo.textContent =
      `stockage ${manager.storage.kind}${manager.lastError ? `  erreur : ${manager.lastError}` : ''}\n` +
      `principal ${describe(slots.main)}\nprécédent ${describe(slots.previous)}\n` +
      `checkpoints ${checkpoints || '(aucun)'}\n\n${JSON.stringify(scene.session.data, null, 1)}`;
  };
  saveSection.addEventListener('toggle', () => {
    if (saveSection.open) {
      void refreshSave();
    }
  });
  const saveActions = element('div', saveSection, 'dbg-actions');
  element('button', saveActions, undefined, 'Actualiser').addEventListener('click', () => {
    void refreshSave();
  });
  element('button', saveActions, undefined, 'Sauvegarder maintenant').addEventListener(
    'click',
    () => {
      void scene.session.persist().then(refreshSave);
    },
  );
  element('button', saveActions, undefined, 'Corrompre le principal').addEventListener(
    'click',
    () => {
      const storage = scene.session.manager.storage;
      void storage
        .read()
        .then((slots) => storage.write({ main: '{"abîmé": true', previous: slots.previous }))
        .then(refreshSave);
    },
  );
  element('button', saveActions, undefined, 'Effacer la sauvegarde').addEventListener(
    'click',
    () => {
      void scene.session.manager.clear().then(() => {
        location.reload();
      });
    },
  );

  // Saccades (D-124) : images en retard, leur cause probable, la salle et la position de Céleste.
  const hitches = new HitchMonitor();
  const hitchSection = element('details', panel);
  element('summary', hitchSection, undefined, 'Saccades');
  const hitchInfo = element('div', hitchSection, 'dbg-stats');
  hitchInfo.style.whiteSpace = 'pre-wrap';
  const refreshHitches = () => {
    hitchInfo.textContent =
      hitches.recent.length === 0
        ? 'aucune'
        : hitches.recent
            .map(
              (h) =>
                `${h.ms.toFixed(0)} ms  ${h.cause}  ${h.room}  x ${h.x.toFixed(0)} y ${h.y.toFixed(0)}`,
            )
            .join('\n');
  };
  refreshHitches();
  const hitchActions = element('div', hitchSection, 'dbg-actions');
  element('button', hitchActions, undefined, 'Remettre à zéro').addEventListener('click', () => {
    hitches.reset();
    refreshHitches();
  });

  // Actions.
  const actions = element('div', panel, 'dbg-actions');
  const exportButton = element('button', actions, undefined, 'Exporter JSON');
  exportButton.addEventListener('click', () => {
    const json = JSON.stringify(
      {
        movement: orderedParams(scene.movement, MOVEMENT_PARAM_RANGES),
        camera: orderedParams(scene.cameraParams, CAMERA_PARAM_RANGES),
        feel: orderedParams(scene.feelParams, FEEL_PARAM_RANGES),
        combat: orderedParams(scene.combatParams, COMBAT_PARAM_RANGES),
        world: orderedParams(scene.worldParams, WORLD_PARAM_RANGES),
        finish: orderedParams(scene.artFinish, ART_FINISH_RANGES),
        hitches: {
          count: hitches.count,
          big: hitches.big,
          masked: hitches.masked,
          worst: hitches.worst,
          recent: hitches.recent,
        },
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
    proposedFeel.checked = false;
    Object.assign(scene.movement, DEFAULT_MOVEMENT);
    scene.applyMovement();
    save(STORAGE_KEY, movementToJson(scene.movement));
    Object.assign(scene.cameraParams, DEFAULT_CAMERA);
    scene.applyCamera();
    save(CAMERA_STORAGE_KEY, cameraToJson(scene.cameraParams));
    Object.assign(scene.feelParams, DEFAULT_FEEL);
    scene.applyFeel();
    save(FEEL_STORAGE_KEY, feelToJson(scene.feelParams));
    Object.assign(scene.combatParams, DEFAULT_COMBAT);
    scene.applyCombat();
    save(COMBAT_STORAGE_KEY, combatToJson(scene.combatParams));
    refreshMovement();
    refreshCamera();
    refreshFeel();
    Object.assign(scene.worldParams, DEFAULT_WORLD);
    scene.applyWorld();
    save(WORLD_STORAGE_KEY, worldToJson(scene.worldParams));
    refreshCombat();
    refreshWorld();
    Object.assign(scene.puppetParams, DEFAULT_PUPPET);
    scene.applyPuppet();
    refreshPuppet();
    Object.assign(scene.artFinish, DEFAULT_ART_FINISH);
    scene.applyFinish();
    refreshFinish();
  });
  // Le fil discret (D-129) : comme après un long moment sans progrès.
  element('button', actions, undefined, 'Fil discret : maintenant').addEventListener(
    'click',
    () => {
      scene.hintClock.skip();
    },
  );
  element('button', actions, undefined, 'Replacer Céleste').addEventListener('click', () => {
    scene.respawn();
  });
  element('button', actions, undefined, 'Évanouissement').addEventListener('click', () => {
    scene.run.triggerFaint();
  });
  element('button', actions, undefined, 'Réinitialiser les ennemis').addEventListener(
    'click',
    () => {
      scene.resetEnemies();
    },
  );

  // Hitbox, repères et stats, dessinés après la mise à jour de la scène.
  const graphics = scene.add.graphics().setDepth(1000);
  let lastStats = 0;
  let simMsSum = 0;
  let simMsMax = 0;
  let frames = 0;
  // Travail de l'image (D-124) : la mise à jour est mesurée entre PRE_UPDATE et POST_UPDATE.
  let updateStart = 0;
  const frameWork: FrameWork = { updateMs: 0, artMs: 0, roomMs: 0, active: false, veiled: false };
  const onPreUpdate = () => {
    updateStart = performance.now();
  };
  const onPostUpdate = (time: number) => {
    const player = scene.player;
    const camera = scene.camera;
    const frame = scene.frameStats;
    frameWork.updateMs = performance.now() - updateStart;
    frameWork.artMs = frame.artMs;
    frameWork.roomMs = frame.roomMs;
    frameWork.active = frame.active;
    frameWork.veiled = frame.veiled;
    frame.artMs = 0;
    frame.roomMs = 0;
    frame.active = false;
    hitches.frame(
      scene.game.loop.rawDelta,
      frameWork,
      scene.level.meta.name ?? scene.level.id,
      player.box.x,
      player.box.y,
    );
    graphics.clear();
    if (showHitbox) {
      graphics.lineStyle(1, HITBOX_COLOR, 1);
      graphics.strokeRect(
        player.box.x + 0.5,
        player.box.y + 0.5,
        player.box.width - 1,
        player.box.height - 1,
      );
    }
    if (showHitbox) {
      // Zone de frappe (pendant la frappe active) et hurtboxes des ennemis.
      const combat = scene.combat;
      const hit = combat.attackBox;
      if (combat.attack.active) {
        graphics.lineStyle(1, ATTACK_COLOR, 1);
        graphics.strokeRect(hit.x + 0.5, hit.y + 0.5, hit.width - 1, hit.height - 1);
      }
      graphics.lineStyle(1, ENEMY_BOX_COLOR, 1);
      for (const enemy of combat.enemies) {
        if (!enemy.dispersed) {
          const b = enemy.box;
          graphics.strokeRect(b.x + 0.5, b.y + 0.5, b.width - 1, b.height - 1);
        }
      }
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
        `vue ${camera.viewWidth.toFixed(0)}×${camera.viewHeight.toFixed(0)} rendu ×${scene.renderScale.toFixed(2)}\n` +
        `simu ${((simMsSum / frames) * 1000).toFixed(0)} µs/img (max ${(simMsMax * 1000).toFixed(0)})  ` +
        `pas perdus ${scene.clock.droppedSteps}  blocs ${String(scene.artChunks)}`;
      const worst = hitches.worst;
      stats.textContent +=
        `\nsaccades ${String(hitches.count)} (grosses ${String(hitches.big)}, ` +
        `dans le noir ${String(hitches.masked)})` +
        (worst ? `  pire ${worst.ms.toFixed(0)} ms ${worst.cause} · ${worst.room}` : '');
      if (hitchSection.open) {
        refreshHitches();
      }
      const combat = scene.combat;
      const states = combat.enemies.map((enemy) => ENEMY_STATE_LABEL[enemy.state]).join(' ');
      stats.textContent +=
        `\ncombat coup ${combat.attack.phase} n°${combat.attack.swing}  invuln. ${combat.invulnerableSteps}` +
        (states ? `  ennemis ${states}` : '') +
        `\npeur ${scene.run.fear}/${scene.worldParams.fearMax}  retour ${scene.run.currentKey ?? 'départ'}` +
        (scene.run.fainting ? '  évanouie' : '');
      stats.textContent += `\n${scene.audio.status()}\n${scene.audio.sfx.status()}`;
      const hint = scene.hintClock;
      stats.textContent +=
        `\nfil palier ${String(hint.stage)}  sans progrès ${(hint.idleMs / 1000).toFixed(0)} s` +
        (scene.hintGoalName ? `  → ${scene.hintGoalName}` : '');
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
  scene.events.on(Phaser.Scenes.Events.PRE_UPDATE, onPreUpdate);
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, onPostUpdate);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.PRE_UPDATE, onPreUpdate);
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, onPostUpdate);
    root.remove();
    style.remove();
  });
}
