import Phaser from 'phaser';
import {
  CHASE_CAMERA_UP_PX,
  DEFAULT_CAMERA,
  MEMORY_CAMERA_ZOOM,
  type CameraParams,
} from '../config/camera';
import { DEFAULT_COMBAT, TrainPhase, type CombatParams } from '../config/combat';
import { DEFAULT_FEEL, type FeelParams } from '../config/feel';
import {
  GAME_HEIGHT,
  LEVEL_CHUNK_TILES,
  PLACEHOLDER_COLORS,
  TILE_SIZE,
  type DisplaySettings,
} from '../config/display';
import {
  DEFAULT_MOVEMENT,
  MAX_STEPS_PER_FRAME,
  PHYSICS_STEP_HZ,
  msToSteps,
  type MovementParams,
} from '../config/movement';
import { CameraController } from '../core/camera/CameraController';
import { ChaseEvent } from '../core/boss/Chase';
import { CombatWorld, wavesOf } from '../core/combat/CombatWorld';
import { FixedStepClock } from '../core/FixedStepClock';
import { InputController } from '../core/input/InputController';
import { KeyboardSource } from '../core/input/KeyboardSource';
import { TouchSource } from '../core/input/TouchSource';
import {
  EntityType,
  Material,
  Tile,
  tileAt,
  LayerMask,
  type Layer,
  type LevelData,
} from '../core/level/LevelData';
import { atLayer, commonLayer, layerOf, otherLayer } from '../core/level/layers';
import { LayerShift, ShiftEvent, type ShiftHost } from '../core/player/LayerShift';
import { EraseState, type EraseHost } from '../core/boss/Erase';
import { eraseDissolved, eraseFactor, eraseRoot, erasedLevel } from '../core/level/erase';
import { parseAsciiLevel } from '../core/level/parseAsciiLevel';
import { atTide } from '../core/level/tide';
import { PlayerPhysics, type PlayerInput } from '../core/player/PlayerPhysics';
import { PlayerFeel } from '../core/player/playerFeel';
import { growthPhase, phaseMovement, type GrowthPhase } from '../config/growth';
import {
  LEVELS,
  MEMORY_ROOMS,
  levelName,
  startRoom,
  zoneRoom,
  type LevelSource,
  type ZoneRoom,
} from '../levels';
import {
  PLAYABLE_MEMORIES,
  PLAYABLE_MEMORY_TIMING,
  TODDLER_LOOK,
  type PlayableMemoryId,
} from '../config/playableMemories';
import { MemoryEvent, PlayableMemory } from '../core/memory/PlayableMemory';
import { cubeTower, teaCup } from './art/memoryArt';
import { DEFAULT_WORLD, type WorldParams } from '../config/world';
import { checkpointId } from '../core/save/saveData';
import type { SaveSession } from '../core/save/SaveSession';
import {
  ABILITY_HELP_ICONS,
  ABILITY_HINTS,
  ABILITY_HINT_MS,
  Ability,
  isAbility,
} from '../config/abilities';
import { PickupKind, Pickups } from '../core/world/Pickups';
import { RoomTransition } from '../core/world/RoomTransition';
import { RunEvent, RunState } from '../core/world/RunState';
import {
  arrivalPosition,
  isGardenRoom,
  isMappedRoom,
  isStrangeRoom,
  isStreetRoom,
  mapPage,
  doorAt,
  touchedExit,
  type ExitRef,
  type MapBox,
  type Zone,
} from '../core/world/zone';
import { FlashbackView } from '../ui/FlashbackView';
import { Hud } from '../ui/Hud';
import { showExportDialog, showImportDialog } from '../ui/SaveCodeDialog';
import { PauseMenu } from '../ui/PauseMenu';
import {
  ART_IMAGES,
  DAY_PALETTE,
  DEFAULT_ART_FINISH,
  type ArtFinish,
  GARDEN_PALETTE,
  MEMORY_PALETTE,
  ERASURE_COLORS,
  STREET_DUSK_PALETTE,
  STREET_PALETTE,
  TRAIN_DAY_PALETTE,
  TRAIN_NIGHT_PALETTE,
  MAX_ART_SCALE,
  REAL_PALETTE,
  STRANGE_PALETTE,
  TRAIN_RIDE,
  CHASE_VIEW,
} from '../config/art';
import { STORY_TIMING, StoryFlag } from '../config/story';
import { PropStage } from '../core/story/PropStage';
import { StoryDirector } from '../core/story/StoryDirector';
import type { TimeOfDay } from '../core/story/story';
import { HOUSE_STORY } from '../levels/house/story';
import type { Box } from '../core/physics/gridCollision';
import { StoryView } from './StoryView';
import { StrangeFxView } from './StrangeFxView';
import { CombatView } from './CombatView';
import { CelestePuppet } from './CelestePuppet';
import { RoomArtView } from './RoomArtView';
import { FinishView } from './FinishView';
import { BackdropView } from './BackdropView';
import { ForegroundView } from './ForegroundView';
import { WorldLifeView } from './WorldLifeView';
import { WaterView } from './WaterView';
import { ShiftLayerView } from './ShiftLayerView';
import { RideView } from './RideView';
import { MapPage } from '../ui/MapPage';
import { RecordPicker } from '../ui/RecordPicker';
import { canPlayRecords, recordShelf, type RecordChoice } from '../core/audio/records';
import { buildMapModel } from '../core/world/mapModel';
import { DEFAULT_PUPPET, type PuppetParams } from '../config/puppet';
import { CelestePoser, PoseAttack } from '../core/player/celestePose';
import { AttackPhase } from '../core/combat/PlayerAttack';
import { DustPool } from './DustPool';
import { ChaseView } from './ChaseView';
import { TrainView } from './TrainView';
import { TrainRideView } from './TrainRideView';
import { WorldView } from './WorldView';
import type { AudioPlayer } from '../platform/audioPlayer';
import { isMusicTrack, type MusicTrack } from '../config/audio';
import { chooseMusic } from '../core/audio/musicChoice';
import { debugSwitchUrl } from '../core/platform/debugSwitch';

/** Durée d'image maximale prise en compte (onglet en arrière-plan, pause du navigateur). */
const MAX_FRAME_SECONDS = 0.25;
/** Clé du registre Phaser où main.ts dépose la partie en cours (D-22). */
export const SESSION_KEY = 'maria-session';
/** Clé du registre où main.ts dépose le lecteur de musique (D-57). */
export const AUDIO_KEY = 'maria-audio';

/** Couleurs des tuiles pleines selon le matériau (placeholders, D-24). */
interface SolidColors {
  readonly fill: number;
  readonly edge: number;
}
const DEFAULT_SOLID: SolidColors = {
  fill: PLACEHOLDER_COLORS.solid,
  edge: PLACEHOLDER_COLORS.solidEdge,
};
const SOLID_COLORS: Readonly<Partial<Record<number, SolidColors>>> = {
  [Material.Default]: DEFAULT_SOLID,
  [Material.Wood]: { fill: PLACEHOLDER_COLORS.wood, edge: PLACEHOLDER_COLORS.woodEdge },
  [Material.Fabric]: { fill: PLACEHOLDER_COLORS.fabric, edge: PLACEHOLDER_COLORS.fabricEdge },
  [Material.Leaf]: { fill: PLACEHOLDER_COLORS.leaf, edge: PLACEHOLDER_COLORS.leafEdge },
};

/** Titre de la carte de chaque zone (écrit par Céleste). */
const MAP_TITLES: Readonly<Record<string, string>> = {
  house: 'Ma maison',
  street: 'Mon quartier',
  station: 'La gare',
  train: 'Le train',
  sea: 'La mer',
  // L'avant-dernier niveau (D-107) : la maison de la nounou et ses îlots de mémoire.
  nanny: 'Chez la nounou',
};

/** Boîte englobant toutes les salles d'une page de la carte (disposition stable). */
function mapBounds(zone: Zone, page: string): MapBox {
  const boxes = Object.values(zone.map).filter((box) => (box.page ?? zone.id) === page);
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.w));
  const bottom = Math.max(...boxes.map((b) => b.y + b.h));
  return { x, y, w: right - x, h: bottom - y };
}

/** Identifiant de la maison dans la liste du menu pause (retour à la partie). */
export const HOME_CHOICE = 'home';
/** Couleur d'ambiance d'une salle (`; @ambient: #rrggbb`). */
const AMBIENT = /^#[0-9a-f]{6}$/i;

/** Point de retour de la partie : salle et checkpoint ; départ de la zone de départ sinon. */
function savedReturn(session: SaveSession): { room: ZoneRoom; checkpointId: string | null } {
  const { levelId, checkpointId } = session.data.checkpoint;
  const room = zoneRoom(levelId);
  // Une sauvegarde des phases précédentes peut pointer vers un parcours d'essai : départ.
  return room ? { room, checkpointId } : { room: startRoom(), checkpointId: null };
}

/** Événement du jeu émis quand les réglages d'affichage changent (main.ts redimensionne le canvas). */
export const DISPLAY_SETTINGS_EVENT = 'maria-display-settings';

/** Mesures de la dernière image, lues par l'overlay de debug. */
export interface FrameStats {
  steps: number;
  simulationMs: number;
}

/**
 * Scène du prototype de mouvement : la simulation (pure, pas fixe) avance ici, Phaser ne fait que
 * l'affichage, interpolé entre les deux derniers pas.
 */
export class GameScene extends Phaser.Scene {
  readonly controls = new InputController();
  /** Paramètres courants (modifiables en direct par l'overlay de debug). */
  readonly movement: MovementParams = { ...DEFAULT_MOVEMENT };
  /** Paramètres appliqués au joueur : `movement` (réglable en direct) à la phase de croissance. */
  private readonly grownMovement: MovementParams = { ...DEFAULT_MOVEMENT };
  /** Phase de croissance courante (D-43), déduite des drapeaux de l'histoire. */
  private growth!: GrowthPhase;
  /** Paramètres de caméra courants (modifiables en direct par l'overlay de debug). */
  readonly cameraParams: CameraParams = { ...DEFAULT_CAMERA };
  readonly camera = new CameraController(this.cameraParams);
  /** Sensations visuelles (écrasement, inclinaison, poussière), modifiables par l'overlay. */
  readonly feelParams: FeelParams = { ...DEFAULT_FEEL };
  readonly feel = new PlayerFeel(this.feelParams);
  private dust!: DustPool;
  /** Combat minimal (D-20), modifiable par l'overlay. */
  readonly combatParams: CombatParams = { ...DEFAULT_COMBAT };
  combat!: CombatWorld;
  private combatView!: CombatView;
  /** Trains de la gare et leurs feux (D-66). */
  private trainView!: TrainView;
  /** Valises qui tombent et tunnels du toit du train (D-86). */
  private rideView!: TrainRideView;
  /** Le poursuivant d'une poursuite verticale (boss, D-67). */
  private chaseView!: ChaseView;
  /** Échec, jauge de peur et checkpoints (D-21), modifiables par l'overlay. */
  readonly worldParams: WorldParams = { ...DEFAULT_WORLD };
  run!: RunState;
  /** Objets de capacité de la salle (D-26). */
  readonly pickups = new Pickups();
  /** Outil de debug : escalade débloquée sans objet ni sauvegarde. */
  debugClimb = false;
  /** Outil de debug : saut mural débloqué sans objet ni sauvegarde (D-44). */
  debugWallJump = false;
  /** Outil de debug : parapluie débloqué sans objet ni sauvegarde (D-62). */
  debugUmbrella = false;
  /** Crochet du parapluie débloqué par l'overlay (D-65). */
  debugHook = false;
  /** Glissade débloquée par l'overlay (D-84). */
  debugSlide = false;
  /** Bascule débloquée par l'overlay (D-107). */
  debugShift = false;
  /** La bascule est acquise (sauvegarde, overlay ou parcours d'essai). */
  private canShift = false;
  /** La couche active d'une salle à deux couches (D-107), jamais sauvegardée. */
  private readonly layerShift = new LayerShift();
  private readonly shiftHost: ShiftHost = { tryShift: (to) => this.tryShiftTo(to) };
  private shiftView!: ShiftLayerView;
  /** L'effacement de la salle (D-111) et la salle telle que lue (ses groupes), null sans lui. */
  private erase: EraseState | null = null;
  private eraseBase: LevelData | null = null;
  private eraseVersion = -1;
  /** Facteur de vitesse des vagues appliqué (D-117). */
  private eraseFactor = 1;
  private readonly eraseHost: EraseHost = {
    canApply: (group, mask) => this.eraseCanApply(group, mask),
  };
  /** Aperçu du monde étrange (D-28, overlay) : mêmes formes, autre palette. */
  strangeWorld = false;
  private roomArt!: RoomArtView;
  /** Finition « papier découpé » (D-71), modifiable par l'overlay. */
  readonly artFinish: ArtFinish = { ...DEFAULT_ART_FINISH };
  /** Ombre de Céleste au sol et vignettage (D-71). */
  private finishView!: FinishView;
  /** Plans lointains : ciel, collines, toits, vue par les fenêtres (D-72). */
  private backdrop!: BackdropView;
  /** Avant-plan : silhouettes au bas de l'écran (D-72). */
  private foreground!: ForegroundView;
  /** Vie du monde réel : feuilles et linge au vent (D-73), feu et balancier (D-74). */
  private worldLife!: WorldLifeView;
  private water!: WaterView;
  private ride!: RideView;
  /** Échelle des textures dessinées (habillage, Céleste) : celle de l'écran, plafonnée. */
  private artScale = 1;
  /** Carte (§24) et salles déjà dessinées lors d'une ouverture précédente (tracé animé). */
  private readonly mapPage = new MapPage(
    () => {
      this.closeMap();
    },
    (id) => {
      // Un souvenir jouable touché dans le cahier (D-89) : on le rejoue, puis on revient ici.
      this.closeMap();
      this.playMemory(id, false);
    },
  );
  /** Le tourne-disque du grenier (D-121) : le jeu est arrêté pendant le choix, comme la carte. */
  private readonly recordPicker = new RecordPicker(
    (choice) => {
      this.chooseRecord(choice);
    },
    () => {
      this.closeRecords();
    },
  );
  /** Dernier sens du joystick ou des flèches devant le tourne-disque (un pas par poussée). */
  private recordMoveDir = 0;
  /** Souvenir jouable en cours (D-89), null sinon ; et ce qu'il faut retrouver à sa fin. */
  private memoryPlay: PlayableMemory | null = null;
  private memoryReturn: {
    level: LevelData;
    zone: Zone | null;
    x: number;
    y: number;
    facing: number;
    fromStory: boolean;
  } | null = null;
  /** La tasse que Céleste tient dans le souvenir de la cuisine. */
  private cupImage!: Phaser.GameObjects.Image;
  private readonly mapSeen = new Set<string>();
  /** Changement de salle en cours (D-25). */
  readonly transition = new RoomTransition(this.worldParams);
  session!: SaveSession;
  private worldView!: WorldView;
  private hud!: Hud;
  /** Courts souvenirs (D-68). */
  private flashbackView!: FlashbackView;
  /** Heure de la dernière réapparition (fondu de retour), -1 sinon. */
  private reappearAtMs = -1;
  /** Zoom appliqué à la caméra (celui des réglages, ou rapproché dans un souvenir, D-89). */
  private appliedZoom = DEFAULT_CAMERA.zoom;
  readonly clock = new FixedStepClock(1 / PHYSICS_STEP_HZ, MAX_STEPS_PER_FRAME);
  readonly frameStats: FrameStats = { steps: 0, simulationMs: 0 };
  level!: LevelData;
  /** Zone de la salle courante ; null dans un parcours d'essai (hors partie). */
  zone: Zone | null = null;
  player!: PlayerPhysics;
  /** Commandes tactiles, absentes sur ordinateur. */
  touch?: TouchSource;
  paused = false;
  /** Réglages d'affichage courants (D-18). */
  displaySettings!: DisplaySettings;
  private pauseMenu?: PauseMenu;
  /** Céleste en « papier découpé » (D-29). */
  private puppet!: CelestePuppet;
  /** Animation de la marionnette, modifiable par l'overlay. */
  readonly puppetParams: PuppetParams = { ...DEFAULT_PUPPET };
  readonly poser = new CelestePoser(
    this.puppetParams,
    1 / PHYSICS_STEP_HZ,
    DEFAULT_MOVEMENT.maxRunSpeed,
  );
  private readonly levelImages: Phaser.GameObjects.Image[] = [];
  /** Histoire (§33, D-31) : étapes vécues, scripts, objets de mise en scène. */
  story!: StoryDirector;
  readonly props = new PropStage();
  private storyView!: StoryView;
  /** Effets du monde étrange (D-35) : présage, scintillements, tremblements, vie des salles. */
  private fx!: StrangeFxView;
  private readonly fxView = new Phaser.Geom.Rectangle();
  private readonly irisPoint = { x: 0, y: 0 };
  /** Vue de la caméra pour l'habillage par blocs (réutilisée, aucune allocation). */
  private readonly artView = { x: 0, y: 0, w: 0, h: 0 };
  /** Moment de la journée et monde étrange de la salle dessinée. */
  private drawnTime: TimeOfDay = 'evening';
  private drawnStrange = false;
  /** Lumières éteintes dans la salle dessinée (la nuit dans le train, D-85). */
  private drawnDim = false;
  /** Vue de la caméra (px logiques), pour les objets de mise en scène (pilier 5). */
  private readonly viewBox: Box = { x: 0, y: 0, width: 0, height: 0 };
  /** Musique (D-57) ; le contexte est réutilisé à chaque image (aucune allocation). */
  audio!: AudioPlayer;
  private readonly musicContext = {
    strange: false,
    garden: false,
    street: false,
    room: null as MusicTrack | null,
  };
  /** Heure (ms) avant laquelle une porte fermée ne redonne pas de bulle. */
  private lockedThoughtUntil = 0;
  /** Porte de façade à portée (D-61), 0 si aucune. */
  private nearDoor = 0;
  /** Allure de la salle qui roule (le train, D-85) : 0 à l'arrêt, 1 à pleine vitesse. */
  private motion = 0;
  /** Heure de la prochaine secousse du train (ms). */
  private nextJoltMs = 0;
  private readonly playerInput: PlayerInput = {
    moveX: 0,
    moveY: 0,
    jumpPressed: false,
    jumpHeld: false,
    abilityPressed: false,
  };

  constructor() {
    super('Game');
  }

  preload(): void {
    // Images fournies (D-28) : elles remplacent le dessin par code de l'élément du même nom.
    for (const [key, file] of Object.entries(ART_IMAGES)) {
      this.load.image(`art:${key}`, `art/${file}`);
    }
  }

  create(): void {
    this.session = this.registry.get(SESSION_KEY) as SaveSession;
    this.audio = this.registry.get(AUDIO_KEY) as AudioPlayer;
    this.story = new StoryDirector(HOUSE_STORY, {
      flagCleared: (id) => {
        void this.session.removeStoryFlag(id);
      },
      flagSet: (id) => {
        void this.session.addStoryFlag(id);
        // Croissance : posée dans le noir d'un fondu, avant que le script ne replace Céleste.
        this.applyGrowth();
      },
      place: (col, row, facing) => {
        this.placeCeleste(col, row, facing);
      },
      room: (room, col, row, facing, returnPoint) => {
        this.storyRoom(room, col, row, facing, returnPoint);
      },
      pose: (pose) => {
        this.poser.sitting = pose === 'sit';
      },
      think: (icon, ms, by) => {
        this.storyView.think(icon, ms, by);
      },
      sparkle: (area, ms) => {
        this.fx.sparkle(area, ms);
      },
      shake: (ms, strength) => {
        this.fx.shake(ms, strength);
      },
      memory: (id) => {
        if (!this.session.data.progression.memories.includes(id)) {
          this.audio.playJingle('memory');
        }
        void this.session.addMemory(id);
      },
      hush: (ms) => {
        this.audio.hush(ms);
      },
      ability: (id) => {
        if (isAbility(id)) {
          this.learnAbility(id);
        }
      },
      play: (id) => {
        this.playMemory(id, true);
      },
      records: () => {
        this.openRecords();
      },
    });
    this.story.setFlags(this.session.data.story.flags);
    this.growth = growthPhase(this.story.flags);
    this.drawnTime = this.story.timeOfDay();
    this.roomArt = new RoomArtView(this);
    this.finishView = new FinishView(this);
    this.backdrop = new BackdropView(this);
    this.foreground = new ForegroundView(this);
    this.worldLife = new WorldLifeView(this);
    this.water = new WaterView(this);
    this.shiftView = new ShiftLayerView(this);
    this.ride = new RideView(this);
    const save = this.session.data;
    const { room, checkpointId } = savedReturn(this.session);
    this.level = this.roomLevel(room.level);
    this.zone = room.zone;
    this.artScale = this.computeArtScale();
    // Partie reprise dans le monde étrange (veilleuse du passage d'ombres, D-34).
    this.drawnStrange = isStrangeRoom(this.level);
    this.drawLevel();
    this.run = new RunState(this.level, this.worldParams);
    this.run.load(this.level, save.activatedCheckpoints, checkpointId);
    this.pickups.load(this.level, save.progression.abilities, save.progression.collectibles);
    void this.session.revealRoom(this.level.id);
    const { x, y } = this.respawnPosition();
    this.player = new PlayerPhysics(this.level, this.movement, x, y, this.growth.hitbox);
    // Origine aux pieds : l'écrasement et l'inclinaison se font autour du point d'appui.
    this.puppet = new CelestePuppet(this);
    this.puppet.redraw(this.artScale, this.celestePalette(), this.artImages(), this.growth);
    this.dust = new DustPool(this, this.feelParams);
    this.combat = new CombatWorld(this.level, this.combatParams);
    this.ride.load(this.combat.sweeps);
    this.combatView = new CombatView(this, this.combat, this.combatParams, this.dust);
    this.combatView.setArt(this.artScale, this.palette());
    this.worldView = new WorldView(this, this.run, this.pickups);
    this.worldView.setArt(this.artScale, this.strangeWorld || isStrangeRoom(this.level));
    this.showCables();
    this.trainView = new TrainView(this, this.combat);
    this.trainView.setArt(this.artScale);
    this.trainView.rebuild();
    this.rideView = new TrainRideView(this, this.combat);
    this.rideView.setArt(this.artScale);
    this.rideView.rebuild();
    this.chaseView = new ChaseView(this, this.combat);
    this.chaseView.setArt(this.artScale);
    this.props.load(this.story.data.props, this.level.id, this.story.flags);
    this.storyView = new StoryView(this, this.props, this.story);
    this.storyView.setArt(this.artScale, this.artImages());
    this.fx = new StrangeFxView(this);
    this.fx.load(
      this.level,
      isStrangeRoom(this.level),
      this.palette(),
      this.story.timeOfDay() === 'morning',
    );
    this.hud = new Hud();
    this.flashbackView = new FlashbackView();
    this.cupImage = this.createCupImage();
    this.applyMovement();
    this.applyAbilities();
    this.motion = this.movingTarget();
    this.feel.reset(this.player);
    this.poser.reset();

    const keyboard = new KeyboardSource();
    this.controls.sources.push(keyboard);
    const detachKeyboard = keyboard.attach(window);
    let detachTouch: (() => void) | undefined;
    const controlSettings = { ...save.settings.controls };
    // En dev et dans le build de debug, `?touch` force l'affichage sur ordinateur (essai à la souris).
    const forceTouch = __DEBUG_TOOLS__ && new URLSearchParams(location.search).has('touch');
    if (forceTouch || TouchSource.isTouchDevice()) {
      this.touch = new TouchSource(document.body, controlSettings);
      this.controls.sources.push(this.touch);
      detachTouch = this.touch.attach(window);
    }
    this.displaySettings = { ...save.settings.display };
    this.pauseMenu = new PauseMenu({
      settings: controlSettings,
      display: this.displaySettings,
      onDisplayChange: (settings) => {
        this.setDisplaySettings(settings);
      },
      audio: save.settings.audio,
      onAudioChange: (settings, persist) => {
        this.audio.setSettings(settings);
        if (persist) {
          void this.session.setAudio(settings);
        }
      },
      showTouchSettings: this.touch !== undefined,
      onResume: () => {
        this.setPaused(false);
      },
      onOpenMap: () => {
        this.setPaused(false);
        this.openMap();
      },
      onSettingsChange: (settings) => {
        void this.session.setControls(settings);
        this.touch?.setSettings(settings);
      },
      onExportSave: () => {
        showExportDialog(this.session.data);
      },
      onImportSave: () => {
        void showImportDialog().then(async (data) => {
          if (data) {
            // La partie importée remplace l'actuelle (qui devient l'état précédent), puis relance.
            await this.session.replace(data);
            location.reload();
          }
        });
      },
      debugTools: __DEBUG_TOOLS__,
      onSwitchDebug: () => {
        // Même site, donc même sauvegarde : on reprend à la dernière lanterne dans l'autre version.
        void this.session.manager.flush().then(() => {
          location.assign(debugSwitchUrl(import.meta.env.BASE_URL, __DEBUG_TOOLS__));
        });
      },
      onQuitToTitle: () => {
        // Écritures en cours terminées, puis relance : le démarrage affiche l'accueil.
        void this.session.manager.flush().then(() => {
          location.reload();
        });
      },
      levels: [
        { id: HOME_CHOICE, name: 'La maison (partie)' },
        ...LEVELS.map((level) => ({ id: level.id, name: levelName(level) })),
      ],
      currentLevelId: () => (this.zone ? HOME_CHOICE : this.level.id),
      onLevelChange: (id) => {
        if (id === HOME_CHOICE) {
          this.returnToSaved();
          return;
        }
        const level = LEVELS.find((candidate) => candidate.id === id);
        if (level) {
          this.loadLevel(level);
        }
      },
    });
    const onVisibility = () => {
      if (document.hidden) {
        this.setPaused(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    this.applyCamera();
    this.resetCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      detachKeyboard();
      detachTouch?.();
      document.removeEventListener('visibilitychange', onVisibility);
      this.pauseMenu?.destroy();
      this.mapPage.destroy();
      this.recordPicker.destroy();
      this.hud.destroy();
      this.flashbackView.destroy();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize);
    });

    if (__DEBUG_TOOLS__) {
      void import('../debug/DebugOverlay').then(({ installDebugOverlay }) => {
        installDebugOverlay(this);
      });
    }
  }

  override update(): void {
    const frameSeconds = Math.min(this.game.loop.rawDelta / 1000, MAX_FRAME_SECONDS);
    this.controls.update();
    const mapPressed = this.controls.consumePressed('Map');
    if (this.mapPage.isOpen) {
      // Carte ouverte (§24) : Carte ou Pause la referment, le jeu reste arrêté.
      if (mapPressed || this.controls.consumePressed('Pause')) {
        this.closeMap();
      }
      return;
    }
    if (this.recordPicker.isOpen()) {
      this.stepRecordPicker(mapPressed);
      return;
    }
    if (this.controls.consumePressed('Pause') && !this.memoryPlay) {
      this.setPaused(!this.paused);
    }
    if (this.paused) {
      return;
    }
    if (mapPressed && !this.story.locked) {
      this.openMap();
      return;
    }
    const steps = this.clock.advance(frameSeconds);
    const start = __DEBUG_TOOLS__ ? performance.now() : 0;
    const input = this.playerInput;
    const camera = this.camera;
    const feel = this.feel;
    const combat = this.combat;
    const run = this.run;
    const transition = this.transition;
    for (let i = 0; i < steps; i++) {
      if (transition.leaving) {
        // Fondu au noir d'un changement de salle (D-25) : rien ne bouge, puis nouvelle salle.
        if (transition.stepOut()) {
          this.enterRoom(transition.target, transition.vx);
          transition.arrive();
        }
        this.freezeInterpolation();
        continue;
      }
      if (combat.hitstopSteps > 0) {
        // Arrêt sur image : toute la simulation est suspendue, les pressions restent mémorisées.
        combat.hitstopSteps--;
        this.freezeInterpolation();
        continue;
      }
      if (run.fainting) {
        // Évanouissement (D-21) : rien ne bouge ; à la fin, retour au point de retour.
        run.stepFainting();
        this.freezeInterpolation();
        if ((run.events & RunEvent.Respawn) !== 0) {
          this.respawnAtCheckpoint();
        }
        continue;
      }
      if (run.splashing) {
        // Chute dans l'eau (D-97) : rien ne bouge ; à la fin, retour au dernier appui sec.
        run.stepSplashing();
        this.freezeInterpolation();
        if ((run.events & RunEvent.SplashReturn) !== 0) {
          this.returnToFooting();
        }
        continue;
      }
      const memory = this.memoryPlay;
      if (memory) {
        // Souvenir jouable (D-89) : sa propre petite boucle, hors de la partie.
        this.stepMemory(memory);
        continue;
      }
      // Histoire (D-31) : près de ce qu'on peut faire, Action devient Agir. Une porte de façade
      // (D-61) s'ouvre aussi avec Agir, si aucun déclencheur de l'histoire n'est à portée.
      const story = this.story;
      const seen = this.zone && !story.busy ? doorAt(this.level, this.player.box) : 0;
      const door = seen !== 0 && story.doorHidden(this.level.id, seen) ? 0 : seen;
      const near = story.interactable >= 0 || door !== 0;
      const interact = this.controls.consumePressed('Interact');
      const action = this.controls.consumePressed('Attack');
      const pressed = interact || (near && action);
      story.step(this.level.id, this.player.box, pressed);
      if (this.recordPicker.isOpen()) {
        // Le tourne-disque s'est ouvert (D-121) : le jeu s'arrête jusqu'au choix.
        this.freezeInterpolation();
        break;
      }
      this.nearDoor = story.interactable < 0 && !story.busy ? door : 0;
      if (this.nearDoor !== 0 && pressed && this.player.grounded) {
        this.openDoor(this.nearDoor);
      }
      const locked = story.locked;
      input.moveX = locked ? 0 : this.controls.moveX;
      input.moveY = locked ? 0 : this.controls.moveY;
      input.jumpPressed = this.controls.consumePressed('Jump') && !locked;
      input.jumpHeld = this.controls.isHeld('Jump') && !locked;
      input.abilityPressed = this.controls.consumePressed('Ability') && !locked;
      if (
        this.poser.sitting &&
        !locked &&
        (input.moveX !== 0 || input.jumpPressed || input.abilityPressed)
      ) {
        this.poser.sitting = false; // Céleste se relève dès qu'on la fait bouger.
      }
      this.stepShift(this.controls.consumePressed('Shift') && !locked);
      this.stepErase();
      this.player.step(input);
      combat.step(this.player, action && !near && !locked);
      const chase = combat.chase;
      if (chase && !chase.horizontal && (chase.events & ChaseEvent.Wake) !== 0) {
        this.fx.shake(CHASE_VIEW.wakeShakeMs, CHASE_VIEW.wakeShakeStrength);
      }
      if (combat.events !== 0) {
        this.combatView.onEvents(combat.events);
      }
      run.step(this.player.box, combat.events, this.player.grounded);
      if ((run.events & RunEvent.Splashed) !== 0) {
        this.dust.splash(this.player.box);
      }
      const picked = this.pickups.step(this.player.box);
      if (picked >= 0) {
        this.onPicked(picked);
      }
      if ((run.events & RunEvent.CheckpointActivated) !== 0 && this.zone) {
        // Sauvegarde automatique au checkpoint (D-22), sans attendre l'écriture. Les parcours
        // d'essai sont hors partie : leurs checkpoints ne sont pas sauvegardés.
        const checkpoint = run.checkpoints[run.current];
        void this.session.setCheckpoint(this.level.id, checkpoint ? checkpoint.id : null);
      }
      transition.stepIn();
      const zone = this.zone;
      if (zone && (run.events & RunEvent.Fainted) === 0) {
        const exit = touchedExit(this.level, this.player.box);
        const target = exit !== 0 ? zone.destination(this.level.id, exit) : null;
        if (target && story.exitsLocked(this.level.id, exit)) {
          this.lockedExitThought(exit);
        } else if (target) {
          transition.start(target, this.player.vx);
        }
      }
      camera.lookInput = input.moveY;
      camera.step(this.player);
      feel.step(this.player);
      this.stepPose();
      this.stepStage();
      if (feel.events !== 0) {
        this.dust.emit(feel.events, this.player.box, this.player.facing);
      }
    }
    if (__DEBUG_TOOLS__) {
      this.frameStats.steps = steps;
      this.frameStats.simulationMs = performance.now() - start;
    }

    const alpha = this.clock.alpha;
    const player = this.player;
    const box = player.box;
    this.puppet.render(
      player.prevX + (box.x - player.prevX) * alpha + box.width / 2,
      player.prevY + (box.y - player.prevY) * alpha + box.height,
      player.facing,
      feel.scaleX,
      feel.scaleY,
      feel.lean,
      this.poser.pose,
    );
    this.renderCup();
    this.finishView.render(
      this.level,
      this.artFinish,
      this.puppet.x,
      this.puppet.y,
      box.width,
      this.puppet.alpha,
    );
    this.combatView.render(alpha, player, this.puppet);
    this.trainView.render();
    this.rideView.render(
      this.time.now,
      camera.viewWidth,
      camera.viewHeight,
      this.cameras.main.zoom,
    );
    this.chaseView.render(camera.prevY + (camera.y - camera.prevY) * alpha + camera.viewHeight / 2);
    this.storyView.render(this.puppet.x, this.puppet.y, box.height);
    this.shiftView.render(this.time.now, this.puppet.x, this.puppet.y - box.height / 2, this.erase);
    this.worldView.render();
    this.dust.update();
    const main = this.cameras.main;
    main.centerOn(
      camera.prevX + (camera.x - camera.prevX) * alpha,
      camera.prevY + (camera.y - camera.prevY) * alpha,
    );
    // Monde étrange (D-35) : présage en grimpant, effets, tremblement (visuel seulement).
    const fx = this.fx;
    fx.setOmen(this.story.omen(this.level.id, this.puppet.x, this.puppet.y - box.height / 2));
    const view = this.fxView;
    view.setTo(
      camera.x - camera.viewWidth / 2,
      camera.y - camera.viewHeight / 2,
      camera.viewWidth,
      camera.viewHeight,
    );
    fx.update(view, this.puppet.x, this.puppet.y - box.height / 2, player.grounded);
    // Habillage par blocs proches de la vue (D-60) ; tout ce qui manque d'un coup dans le noir.
    const artView = this.artView;
    artView.x = view.x;
    artView.y = view.y;
    artView.w = view.width;
    artView.h = view.height;
    this.roomArt.update(artView, Math.max(this.story.veil, this.transition.veil) >= 1);
    this.water.update(this.time.now);
    this.ride.update(
      this.time.now,
      this.combat.sweepWarnProgress,
      this.combat.sweepPhase === TrainPhase.Passing,
    );
    if (this.combat.waveRow >= 0) {
      this.water.updateWaves(
        this.time.now,
        this.combat.waveWarnProgress,
        this.combat.wavePhase === TrainPhase.Passing,
      );
    }
    this.worldLife.update(
      this.time.now,
      this.game.loop.delta,
      artView,
      this.puppet.x,
      this.puppet.y - box.height / 2,
    );
    main.scrollX += fx.offsetX;
    main.scrollY += fx.offsetY;
    // Coin haut gauche de la vue (px du monde) : la caméra Phaser zoome autour de son centre.
    const unzoom = 1 - 1 / main.zoom;
    const viewLeft = main.scrollX + (main.width / 2) * unzoom;
    this.stepMotion(this.game.loop.delta);
    this.backdrop.update(
      viewLeft,
      main.scrollY + (main.height / 2) * unzoom,
      camera.viewWidth,
      this.time.now,
      this.game.loop.delta,
      this.motion,
    );
    this.foreground.update(
      viewLeft,
      camera.viewWidth,
      this.puppet.x,
      this.puppet.y,
      this.combat.enemies,
      this.game.loop.delta,
    );
    this.renderRunState();
  }

  /**
   * Le train en route (D-85) : l'allure monte et descend doucement (le départ se voit au paysage) ;
   * à pleine vitesse, une petite secousse de temps en temps (visuelle seulement, pilier 1).
   */
  private stepMotion(dtMs: number): void {
    const target = this.movingTarget();
    const step = (TRAIN_RIDE.accelPerS * dtMs) / 1000;
    this.motion =
      this.motion < target
        ? Math.min(target, this.motion + step)
        : Math.max(target, this.motion - step);
    const now = this.time.now;
    if (this.motion < 0.9) {
      this.nextJoltMs = 0;
      return;
    }
    const [min, max] = TRAIN_RIDE.joltEveryMs;
    if (this.nextJoltMs === 0) {
      this.nextJoltMs = now + min + Math.random() * (max - min);
    } else if (now >= this.nextJoltMs && !this.story.busy) {
      this.fx.shake(TRAIN_RIDE.joltMs, TRAIN_RIDE.joltStrength);
      this.nextJoltMs = now + min + Math.random() * (max - min);
    }
  }

  /** Allure visée : 1 dans une salle qui roule, 0 sinon. */
  private movingTarget(): number {
    return this.zone && this.story.moving(this.level.id) ? 1 : 0;
  }

  /** Allure du train (outil de debug). */
  get trainMotion(): number {
    return this.motion;
  }

  /** Blocs d'habillage dessinés en ce moment (outil de debug, D-60). */
  get artChunks(): number {
    return this.roomArt.preparedCount;
  }

  /**
   * Carte dessinée par Céleste (§24) : salles visitées et devinées, veilleuses allumées,
   * trouvailles, Céleste. Seulement dans une zone (pas dans les parcours d'essai).
   */
  openMap(): void {
    const zone = this.zone;
    if (!zone) {
      return;
    }
    const data = this.session.data;
    const box = this.player.box;
    // Page du cahier de la salle ; dans le monde étrange (hors carte), celle de la zone.
    const page = mapPage(zone, this.level.id) ?? zone.id;
    const model = buildMapModel(
      zone,
      {
        visited: data.progression.mapRevealed,
        seen: this.mapSeen,
        activatedCheckpoints: data.activatedCheckpoints,
        checkpoint: data.checkpoint,
        collectibles: data.progression.collectibles,
        celeste: { room: this.level.id, x: box.x + box.width / 2, y: box.y + box.height },
      },
      page,
    );
    for (const room of data.progression.mapRevealed) {
      this.mapSeen.add(room);
    }
    this.clock.reset();
    this.touch?.releaseAll();
    this.mapPage.open(
      model,
      MAP_TITLES[page] ?? page,
      mapBounds(zone, page),
      data.progression.memories,
      this.ownedAbilities(),
    );
  }

  /**
   * Le tourne-disque du grenier (D-121) : les pochettes des disques trouvés, ou, sans disque, une
   * bulle (le plateau vide). Rien de sauvegardé.
   */
  private openRecords(): void {
    const shelf = recordShelf(this.session.data.progression.memories, (slot) =>
      this.audio.has(slot),
    );
    if (!canPlayRecords(shelf)) {
      this.storyView.think('record', STORY_TIMING.thoughtMs);
      return;
    }
    this.clock.reset();
    this.touch?.releaseAll();
    this.recordMoveDir = 0;
    this.recordPicker.open(shelf, this.audio.record);
  }

  /** Devant le tourne-disque : gauche et droite, Agir, Action ou Saut ; Pause ou Carte referment. */
  private stepRecordPicker(mapPressed: boolean): void {
    const controls = this.controls;
    if (mapPressed || controls.consumePressed('Pause')) {
      this.closeRecords();
      return;
    }
    const dir = controls.moveX > 0.5 ? 1 : controls.moveX < -0.5 ? -1 : 0;
    if (dir !== 0 && dir !== this.recordMoveDir) {
      this.recordPicker.move(dir);
    }
    this.recordMoveDir = dir;
    const confirm = controls.consumePressed('Interact');
    const attack = controls.consumePressed('Attack');
    const jump = controls.consumePressed('Jump');
    if (confirm || attack || jump) {
      this.recordPicker.confirm();
    }
  }

  /** Un disque choisi joue une fois en entier, où que soit Céleste ; ou le disque s'arrête. */
  private chooseRecord(choice: RecordChoice): void {
    if (choice === 'stop') {
      this.audio.stopRecord();
    } else {
      this.audio.playRecord(choice);
    }
    this.closeRecords();
  }

  private closeRecords(): void {
    this.recordPicker.close();
    this.clock.reset();
    this.touch?.releaseAll();
    this.controls.consumePressed('Jump');
    this.controls.consumePressed('Interact');
    this.controls.consumePressed('Attack');
  }

  private closeMap(): void {
    this.mapPage.close();
    this.clock.reset();
    this.controls.consumePressed('Jump');
  }

  /** Met le jeu en pause (simulation arrêtée, menu affiché) ou le reprend. */
  setPaused(paused: boolean): void {
    if (paused === this.paused) {
      return;
    }
    this.paused = paused;
    this.audio.setPaused(paused);
    this.clock.reset();
    this.touch?.releaseAll();
    if (paused) {
      this.pauseMenu?.open();
    } else {
      this.pauseMenu?.close();
      // Une pression de saut faite pendant la pause ne doit pas partir à la reprise.
      this.controls.consumePressed('Jump');
    }
  }

  /** Applique les paramètres courants au joueur (après un réglage en direct). */
  applyMovement(): void {
    const movement = phaseMovement(this.movement, this.growth, this.grownMovement);
    this.player.setParams(movement);
    this.feel.maxRunSpeed = movement.maxRunSpeed;
    this.feel.maxFallSpeed = movement.maxFallSpeed;
    this.poser.setParams(this.puppetParams, movement.maxRunSpeed);
  }

  /**
   * Phase de croissance d'après les drapeaux (D-43) : hitbox, mouvement et marionnette. Appelée
   * quand un drapeau change (dans le noir d'un fondu, ou par l'outil de debug).
   */
  private applyGrowth(): void {
    const growth = growthPhase(this.story.flags);
    if (growth === this.growth || this.memoryPlay) {
      return;
    }
    this.useGrowth(growth);
  }

  /** Hitbox, mouvement et marionnette d'une phase (ou de Céleste toute petite, D-89). */
  private useGrowth(growth: GrowthPhase): void {
    this.growth = growth;
    this.player.setHitbox(growth.hitbox);
    this.applyMovement();
    this.puppet.redraw(this.artScale, this.celestePalette(), this.artImages(), growth);
  }

  /** Hitbox courante de Céleste (croissance). */
  get hitbox(): Readonly<{ width: number; height: number }> {
    return this.growth.hitbox;
  }

  /** Applique les réglages de combat (overlay). */
  applyCombat(): void {
    this.combat.setParams(this.combatParams);
    this.erase?.setParams(this.combatParams);
  }

  /** Ennemis remis à leur départ (overlay). */
  resetEnemies(): void {
    this.combat.reset();
  }

  /** Pendant l'arrêt sur image, l'interpolation ne doit pas faire osciller l'affichage. */
  private freezeInterpolation(): void {
    const player = this.player;
    player.prevX = player.box.x;
    player.prevY = player.box.y;
    this.camera.prevX = this.camera.x;
    this.camera.prevY = this.camera.y;
    for (const enemy of this.combat.enemies) {
      enemy.prevX = enemy.box.x;
      enemy.prevY = enemy.box.y;
    }
  }

  /** Applique les réglages de sensations visuelles (overlay). */
  applyFeel(): void {
    this.feel.setParams(this.feelParams);
  }

  /** Applique les paramètres de caméra courants (après un réglage en direct ou un changement de zoom). */
  applyCamera(): void {
    this.applyRoomCamera();
    this.onResize();
  }

  /**
   * Réglages de la caméra pour la salle : une poursuite vers le haut (D-67, `; @camera: up`)
   * montre davantage ce qui est au-dessus de Céleste.
   */
  private applyRoomCamera(): void {
    const up = this.level.meta.camera === 'up';
    const zoom = this.roomZoom;
    this.camera.setParams({
      ...this.cameraParams,
      zoom,
      ...(up ? { verticalOffsetPx: this.cameraParams.verticalOffsetPx + CHASE_CAMERA_UP_PX } : {}),
    });
    if (zoom !== this.appliedZoom) {
      // Un souvenir jouable (D-89) rapproche la caméra : la vue et les dessins suivent.
      this.appliedZoom = zoom;
      this.onResize();
    }
  }

  /** Zoom de la salle : celui des réglages, rapproché dans un souvenir jouable (D-89). */
  private get roomZoom(): number {
    return this.cameraParams.zoom * (this.level.meta.world === 'memory' ? MEMORY_CAMERA_ZOOM : 1);
  }

  /** Change la résolution de rendu (D-18) : sauvegardée, puis appliquée par main.ts. */
  setDisplaySettings(settings: Readonly<DisplaySettings>): void {
    this.displaySettings = { ...settings };
    void this.session.setDisplay(this.displaySettings);
    this.game.events.emit(DISPLAY_SETTINGS_EVENT, this.displaySettings);
  }

  /** Échelle de rendu courante (D-18) : 1 à la résolution logique. */
  get renderScale(): number {
    return this.scale.height / GAME_HEIGHT;
  }

  /** Applique les réglages d'échec et de jauge (overlay). */
  applyWorld(): void {
    this.run.setParams(this.worldParams);
    this.transition.setParams(this.worldParams);
  }

  /** Position (px) de réapparition : pieds au bas de la tuile du checkpoint courant ou du départ. */
  private respawnPosition(): { x: number; y: number } {
    const tile = this.run.respawnTile();
    return {
      x: (tile.col + 0.5) * TILE_SIZE - this.growth.hitbox.width / 2,
      y: (tile.row + 1) * TILE_SIZE - this.growth.hitbox.height,
    };
  }

  /**
   * Fin de l'évanouissement : retour au point de retour, monde local restauré (§20.2). Dans une
   * zone, le point de retour peut être dans une autre salle (D-25).
   */
  private respawnAtCheckpoint(): void {
    if (this.zone) {
      this.returnToSaved();
    } else {
      this.respawn();
    }
    this.reappearAtMs = this.time.now;
  }

  /**
   * Fin de l'éclaboussement (D-97) : Céleste reprend pied sur son dernier appui sec de la salle (ou,
   * sans appui retenu, à son point de retour dans la salle), arrêtée ; l'image revient.
   */
  private returnToFooting(): void {
    const footing = this.run.footing;
    // L'appui retenu dans l'autre couche (D-107) : Céleste y revient.
    this.showLayer(footing ? layerOf(footing.level) : 'present');
    const { x, y } = footing ?? this.respawnPosition();
    this.player.reset(x, y, this.level);
    this.feel.reset(this.player);
    this.poser.reset();
    this.resetCamera();
    this.reappearAtMs = this.time.now;
  }

  /** Voile de l'évanouissement, jauge de peur, transparence de Céleste. */
  private renderRunState(): void {
    // Court souvenir (D-68) : la vignette au-dessus du jeu.
    this.flashbackView.update(this.story.flashback, this.story.flashbackProgress);
    const memory = this.memoryPlay;
    if (memory) {
      // Souvenir jouable (D-89) : son propre voile ; à la fin, la salle reste seule.
      this.hud.setVeil(memory.veil);
      this.puppet.setAlpha(memory.celesteVisible ? 1 : 0);
      return;
    }
    const run = this.run;
    this.hud.setFear(run.fear, this.worldParams.fearMax);
    if (run.splashing) {
      const progress = run.splashProgress;
      this.hud.setVeil(Math.max(progress, this.transition.veil));
      this.puppet.setAlpha(1 - progress);
      return;
    }
    if (run.fainting) {
      const progress = run.faintProgress;
      this.hud.setVeil(Math.max(progress, this.transition.veil));
      this.puppet.setAlpha(1 - progress);
      return;
    }
    let veil = Math.max(this.transition.veil, this.story.veil);
    if (this.reappearAtMs >= 0) {
      const duration = this.worldParams.reappearMs;
      const k = duration > 0 ? (this.time.now - this.reappearAtMs) / duration : 1;
      veil = Math.max(veil, 1 - k);
      if (k >= 1) {
        this.reappearAtMs = -1;
      }
    }
    this.hud.setVeil(veil, this.story.veilShape === 'iris' ? this.irisCenter() : null);
  }

  respawn(): void {
    this.erase?.reset();
    this.eraseFactor = 1;
    this.applyErase();
    this.showLayer('present');
    const { x, y } = this.respawnPosition();
    this.player.reset(x, y, this.level);
    this.feel.reset(this.player);
    this.poser.reset();
    this.combat.reset();
    this.clock.reset();
    this.transition.cancel();
    this.resetCamera();
  }

  /**
   * Parcours d'essai (hors partie) : Céleste y est placée au départ ; la sauvegarde n'est pas
   * modifiée, « La maison » ramène au point de retour de la partie.
   */
  loadLevel(source: LevelSource): void {
    this.abortMemory();
    this.story.cancel();
    this.setRoom(parseAsciiLevel(source.id, source.text), null, null);
    this.respawn();
  }

  /** Retour au point de retour de la partie, dans sa salle (réapparition, menu pause). */
  returnToSaved(): void {
    this.abortMemory();
    const { room, checkpointId } = savedReturn(this.session);
    if (this.atTide(room.level) !== this.level) {
      this.setRoom(room.level, room.zone, checkpointId);
    }
    this.respawn();
  }

  /** Outil de debug : Céleste placée au départ `P` d'une salle de zone, sauvegarde inchangée. */
  teleportToRoom(id: string): void {
    const room = zoneRoom(id);
    if (!room) {
      return;
    }
    const { checkpointId, levelId } = this.session.data.checkpoint;
    this.abortMemory();
    this.story.cancel();
    this.setRoom(room.level, room.zone, levelId === id ? checkpointId : null);
    const { spawn } = room.level;
    this.player.reset(
      (spawn.col + 0.5) * TILE_SIZE - this.growth.hitbox.width / 2,
      (spawn.row + 1) * TILE_SIZE - this.growth.hitbox.height,
      this.level,
    );
    this.feel.reset(this.player);
    this.poser.reset();
    this.clock.reset();
    this.transition.cancel();
    this.resetCamera();
  }

  /**
   * Ce n'est pas le moment de sortir (le soir), ou la porte ne s'ouvre pas encore (la porte de
   * derrière, D-46) : une bulle le rappelle, sans texte. Un parent le rappelle (D-37), sinon Céleste
   * y pense elle-même.
   */
  private lockedExitThought(exit: number): void {
    const story = this.story;
    if (this.time.now < this.lockedThoughtUntil || story.busy) {
      return;
    }
    this.storyView.think(
      story.lockIcon(this.level.id, exit),
      STORY_TIMING.thoughtMs,
      story.lockSpeaker(this.level.id, exit) ?? undefined,
    );
    this.lockedThoughtUntil = this.time.now + STORY_TIMING.lockedExitThoughtMs;
  }

  /** Agir devant une porte de façade (D-61) : on entre (même fondu qu'une sortie), ou une bulle. */
  private openDoor(door: number): void {
    const target = this.zone?.destination(this.level.id, door) ?? null;
    if (!target) {
      return;
    }
    if (this.story.exitsLocked(this.level.id, door)) {
      this.lockedThoughtUntil = 0;
      this.lockedExitThought(door);
      return;
    }
    this.transition.start(target, 0);
  }

  /**
   * Arrivée par une sortie (D-25) : nouvelle salle, Céleste juste à l'intérieur avec son élan
   * horizontal. Le point de retour ne change pas.
   */
  private enterRoom(target: ExitRef | null, vx: number): void {
    const room = target ? zoneRoom(target.room) : null;
    if (!target || !room) {
      return;
    }
    const fear = this.run.fear;
    const { checkpointId, levelId } = this.session.data.checkpoint;
    this.setRoom(room.level, room.zone, levelId === target.room ? checkpointId : null);
    // La peur suit Céleste d'une salle à l'autre : changer de salle ne la calme pas.
    this.run.fear = fear;
    const { x, y } = arrivalPosition(
      room.level,
      target.exit,
      this.growth.hitbox.width,
      this.growth.hitbox.height,
    );
    this.player.reset(x, y, this.level);
    // Devant une porte de façade (D-61), Céleste arrive arrêtée, face à la rue.
    this.player.vx = room.level.doors.some((d) => d.id === target.exit) ? 0 : vx;
    this.feel.reset(this.player);
    this.poser.reset();
    this.resetCamera();
  }

  /**
   * La bascule (D-107), à chaque pas : une pression de Basculer, gardée tant que la place manque.
   * Sans la capacité, rien ; dans une salle sans couches, le petit signe du refus.
   */
  private stepShift(pressed: boolean): void {
    if (!this.canShift) {
      return;
    }
    if (!this.level.layers) {
      if (pressed) {
        this.shiftView.refuse(this.time.now);
      }
      return;
    }
    const event = this.layerShift.step(pressed, this.player.movement, this.shiftHost);
    if (event === ShiftEvent.Shifted) {
      this.shiftView.flash(this.time.now);
    } else if (event === ShiftEvent.Refused) {
      this.shiftView.refuse(this.time.now);
    }
  }

  /** Passe Céleste dans la couche `to` si la place le permet (D-107) ; rien ne bouge. */
  private tryShiftTo(to: Layer): boolean {
    const target = atLayer(this.level, to);
    if (!this.player.shiftTo(target, this.player.movement.shiftNudgePx)) {
      return false;
    }
    this.level = target;
    this.run.setLayer(target);
    this.combat.setLayer(target);
    this.shiftView.show(to, this.erase?.masks ?? null);
    this.showCables();
    return true;
  }

  /**
   * La salle telle qu'elle se charge (D-107, D-111) : à la marée du moment, dans le présent, et avec
   * l'effacement à son départ s'il y en a un (créé ici).
   */
  private roomLevel(source: LevelData): LevelData {
    const level = this.atTide(source);
    if (level.erase) {
      this.eraseBase = eraseRoot(level);
      this.erase = new EraseState(level.erase, this.combatParams, PHYSICS_STEP_HZ);
      this.eraseVersion = this.erase.version;
      this.eraseFactor = 1;
      return atLayer(erasedLevel(level, this.erase.masks), 'present');
    }
    this.eraseBase = null;
    this.erase = null;
    return atLayer(level, 'present');
  }

  /** L'effacement (D-111), à chaque pas : les bandes devant la poursuite, les vagues. */
  private stepErase(): void {
    const erase = this.erase;
    if (!erase) {
      return;
    }
    // L'histoire (D-117) : chaque objet retrouvé fait reculer l'effacement, qui accélère ensuite ;
    // dissous, plus rien ne change.
    const flags = this.story.flags;
    if (eraseDissolved(erase.data, flags)) {
      return;
    }
    const factor = eraseFactor(erase.data, flags);
    if (factor !== this.eraseFactor) {
      this.eraseFactor = factor;
      erase.recoil(factor);
    }
    const chase = this.combat.chase;
    const rising = chase && !chase.horizontal && !chase.done && chase.placed;
    erase.step(rising ? chase.front : null, this.eraseHost);
    this.applyErase();
  }

  /** Le motif de l'effacement a changé : la salle à jour, Céleste dans la même couche. */
  private applyErase(): void {
    const erase = this.erase;
    const base = this.eraseBase;
    if (!erase || !base || erase.version === this.eraseVersion) {
      return;
    }
    this.eraseVersion = erase.version;
    const layer = layerOf(this.level);
    const target = atLayer(erasedLevel(base, erase.masks), layer);
    // Rien n'apparaît sur Céleste (`eraseCanApply`) : la place est libre.
    this.player.shiftTo(target, 0);
    this.level = target;
    this.run.setLayer(target);
    this.combat.setLayer(target);
    this.shiftView.show(layer, erase.masks);
    this.showCables();
  }

  /** Un groupe peut prendre ces couches : il n'apparaît pas sur Céleste, dans sa couche (D-111). */
  private eraseCanApply(group: number, mask: number): boolean {
    const erase = this.erase;
    const g = erase?.data.groups[group];
    if (!erase || !g) {
      return true;
    }
    const bit = layerOf(this.level) === 'present' ? LayerMask.Present : LayerMask.Memory;
    if ((mask & bit) === 0 || ((erase.masks[group] ?? 0) & bit) !== 0) {
      return true;
    }
    const box = this.player.box;
    return !g.rects.some(
      (r) =>
        box.x < (r.col + r.width) * TILE_SIZE &&
        box.x + box.width > r.col * TILE_SIZE &&
        box.y < (r.row + r.height) * TILE_SIZE &&
        box.y + box.height > r.row * TILE_SIZE,
    );
  }

  /** Affiche une couche sans rien vérifier (réapparition, retour au dernier appui, D-107). */
  private showLayer(layer: Layer): void {
    if (layerOf(this.level) === layer) {
      return;
    }
    const target = atLayer(this.level, layer);
    this.level = target;
    this.run.setLayer(target);
    this.combat.setLayer(target);
    this.layerShift.layer = layer;
    this.shiftView.show(layer, this.erase?.masks ?? null);
    this.showCables();
  }

  /**
   * Les câbles de la couche active, et en fantôme ceux de l'autre couche (D-107) ; les vaguelettes
   * de l'eau d'une seule couche (D-115).
   */
  private showCables(): void {
    const level = this.level;
    if (!level.layers) {
      this.worldView.setCables(level.cables);
      return;
    }
    this.water.showLayer(layerOf(level));
    const other = atLayer(level, otherLayer(layerOf(level))).cables;
    this.worldView.setCables(
      level.cables,
      other.filter((c) => !level.cables.includes(c)),
    );
  }

  /** La variante d'une salle à la marée du moment (D-95) ; une salle sans marée est inchangée. */
  private atTide(level: LevelData): LevelData {
    return atTide(level, this.story.flags.has(StoryFlag.TideHigh));
  }

  /** Change la salle de marée sous Céleste, qui garde sa place, sa peur et son point de retour. */
  private swapTide(): void {
    const { x, y } = this.player.box;
    const facing = this.player.facing;
    const fear = this.run.fear;
    const { checkpointId, levelId } = this.session.data.checkpoint;
    this.setRoom(this.level, this.zone, levelId === this.level.id ? checkpointId : null);
    this.run.fear = fear;
    this.player.reset(x, y, this.level);
    this.player.facing = facing;
    this.feel.reset(this.player);
  }

  /**
   * Remplace la salle : dessin, ennemis, checkpoints, ambiance ; une salle de zone est ajoutée à la
   * carte révélée. Céleste est replacée ensuite.
   */
  private setRoom(source: LevelData, zone: Zone | null, checkpointId: string | null): void {
    // Une salle à deux couches se charge toujours dans le présent (D-107).
    const level = this.roomLevel(source);
    this.level = level;
    this.layerShift.reset();
    this.zone = zone;
    if (zone && isMappedRoom(level)) {
      void this.session.revealRoom(level.id);
    }
    if (isStrangeRoom(level) !== this.drawnStrange) {
      this.redrawArt(); // Céleste et les jouets changent aussi de palette.
    } else {
      this.drawLevel();
    }
    this.combat.load(level);
    this.ride.load(this.combat.sweeps);
    this.combatView.rebuild();
    this.trainView.rebuild();
    this.rideView.rebuild();
    this.chaseView.rebuild();
    this.applyRoomCamera();
    this.run.load(level, this.session.data.activatedCheckpoints, checkpointId);
    const { abilities, collectibles } = this.session.data.progression;
    this.pickups.load(level, abilities, collectibles);
    this.applyAbilities();
    this.worldView.rebuild();
    this.showCables();
    this.props.load(this.story.data.props, level.id, this.story.flags);
    this.storyView.rebuild();
    this.storyView.clearThought();
    this.poser.sitting = false;
    this.fx.reset();
    this.fx.load(level, isStrangeRoom(level), this.palette(), this.story.timeOfDay() === 'morning');
    // Arrivée dans une salle qui roule déjà : à pleine vitesse (le départ, lui, se voit).
    this.motion = this.movingTarget();
    this.nextJoltMs = 0;
  }

  /** Capacités de Céleste en ce moment (sauvegarde, debug, parcours d'essai), pour le cahier. */
  private ownedAbilities(): Ability[] {
    const player = this.player;
    return [
      ...(player.canClimb ? [Ability.Climb] : []),
      ...(player.canWallJump ? [Ability.WallJump] : []),
      ...(player.canGlide ? [Ability.Umbrella] : []),
      ...(player.canHook ? [Ability.Hook] : []),
      ...(player.canSlide ? [Ability.Slide] : []),
      ...(this.canShift ? [Ability.Shift] : []),
    ];
  }

  /**
   * Capacités acquises (sauvegarde), débloquées par l'overlay ou prêtées par un parcours d'essai
   * (`; @abilities:`, hors partie), appliquées à Céleste.
   */
  applyAbilities(): void {
    const owned = this.session.data.progression.abilities;
    const lent = this.zone ? [] : (this.level.meta.abilities ?? '').split(/\s+/);
    const has = (ability: Ability) => owned.includes(ability) || lent.includes(ability);
    this.player.canClimb = this.debugClimb || has(Ability.Climb);
    this.player.canWallJump = this.debugWallJump || has(Ability.WallJump);
    this.player.canGlide = this.debugUmbrella || has(Ability.Umbrella);
    // Le crochet (D-65) s'ajoute au parapluie : il ne sert qu'en planant.
    this.player.canHook = this.debugHook || has(Ability.Hook);
    this.player.canSlide = this.debugSlide || has(Ability.Slide);
    this.canShift = this.debugShift || has(Ability.Shift);
    // Le bouton Basculer n'apparaît qu'avec la bascule (D-107), pâli dans une salle sans couches.
    this.touch?.setShiftState(this.canShift, this.level.layers === null);
    // Le bouton Capacité n'apparaît qu'avec la glissade (D-84).
    this.touch?.setAbilityVisible(this.player.canSlide);
  }

  /**
   * Objet ramassé, sauvegardé aussitôt. Capacité (D-26) : appliquée, indice de prototype affiché.
   * Trouvaille (D-27) : rien d'affiché pour l'instant (pas de compteur avant la carte, §23).
   */
  private onPicked(index: number): void {
    const item = this.pickups.items[index];
    if (!item) {
      return;
    }
    if (item.kind === PickupKind.Secret) {
      this.audio.playJingle('found');
      void this.session.addCollectible(item.id);
      return;
    }
    if (isAbility(item.id)) {
      this.learnAbility(item.id);
    }
  }

  /**
   * Capacité obtenue (objet ramassé, D-26, ou apprise dans l'histoire, D-85) : sauvegardée,
   * appliquée, indice de prototype et bulle d'aide.
   */
  private learnAbility(id: Ability): void {
    this.audio.playJingle('found');
    void this.session.unlockAbility(id);
    this.applyAbilities();
    this.hud.showHint(ABILITY_HINTS[id], ABILITY_HINT_MS);
    // Bulle d'aide (D-62, demande de l'utilisateur) : comment s'en servir, en pictogramme.
    const help = ABILITY_HELP_ICONS[id];
    if (help) {
      this.storyView.think(help, ABILITY_HINT_MS);
    }
  }

  private resetCamera(): void {
    const camera = this.camera;
    camera.setBounds(this.level.width * TILE_SIZE, this.level.height * TILE_SIZE);
    camera.reset(this.player);
    this.cameras.main.centerOn(camera.x, camera.y);
  }

  /**
   * Largeur logique variable (D-01) et échelle de rendu (D-18) : la vue de la caméra est la taille
   * logique ; le zoom Phaser est le zoom de caméra × l'échelle de rendu.
   */
  private readonly onResize = (): void => {
    const scale = this.renderScale;
    this.camera.setView(this.scale.width / scale, this.scale.height / scale);
    this.cameras.main.setZoom(this.roomZoom * scale);
    this.cameras.main.centerOn(this.camera.x, this.camera.y);
    const artScale = this.computeArtScale();
    if (artScale !== this.artScale) {
      this.artScale = artScale;
      this.redrawArt();
    }
  };

  /** Échelle des dessins : pixels de l'écran par pixel logique (arrondie au demi, plafonnée). */
  private computeArtScale(): number {
    const screen = this.renderScale * this.roomZoom;
    return Math.min(MAX_ART_SCALE, Math.max(1, Math.ceil(screen * 2) / 2));
  }

  /** Aperçu du monde étrange (overlay). */
  setStrangeWorld(strange: boolean): void {
    this.strangeWorld = strange;
    this.redrawArt();
  }

  /** Redessine la salle et Céleste (échelle ou palette changée). */
  private redrawArt(): void {
    this.drawnTime = this.story.timeOfDay();
    this.drawnDim = this.isDim();
    this.drawnStrange = isStrangeRoom(this.level);
    this.worldView.setArt(this.artScale, this.strangeWorld || isStrangeRoom(this.level));
    this.storyView.setArt(this.artScale, this.artImages());
    this.combatView.setArt(this.artScale, this.palette());
    this.trainView.setArt(this.artScale);
    this.rideView.setArt(this.artScale);
    this.chaseView.setArt(this.artScale);
    this.drawLevel();
    this.puppet.redraw(this.artScale, this.celestePalette(), this.artImages(), this.growth);
  }

  /** Images fournies chargées (nom d'élément → image). */
  private artImages(): Map<string, CanvasImageSource> {
    const images = new Map<string, CanvasImageSource>();
    for (const key of Object.keys(ART_IMAGES)) {
      if (this.textures.exists(`art:${key}`)) {
        images.set(key, this.textures.get(`art:${key}`).getSourceImage() as CanvasImageSource);
      }
    }
    return images;
  }

  /**
   * Dessine la salle une seule fois, par blocs (D-17) : une image par bloc, et les blocs hors
   * écran ne sont pas dessinés par Phaser. Remplace le dessin de la salle précédente.
   */
  private drawLevel(): void {
    const ambient = this.level.meta.ambient;
    // Ambiance de la salle : couleur d'effacement du rendu (partagée par la configuration du jeu),
    // gratuite, contrairement au fond de caméra redessiné à chaque image.
    const clear = this.game.config.backgroundColor;
    if (ambient && AMBIENT.test(ambient)) {
      Phaser.Display.Color.HexStringToColor(ambient, clear);
    } else {
      Phaser.Display.Color.IntegerToColor(PLACEHOLDER_COLORS.background, clear);
    }
    for (const image of this.levelImages) {
      const key = image.texture.key;
      image.destroy();
      this.textures.remove(key);
    }
    this.levelImages.length = 0;
    // Une salle à deux couches (D-107) : seulement ce qui est commun ; les couches à part.
    // Avec l'effacement (D-111), sans aucun de ses groupes : ils sont dessinés à part.
    const base = this.eraseBase ?? this.level;
    const level = commonLayer(
      base.erase
        ? erasedLevel(
            base,
            base.erase.groups.map(() => LayerMask.None),
          )
        : base,
    );
    const palette = this.palette();
    const waves = wavesOf(level);
    this.water.load(level, palette.silhouettes, waves?.row ?? -1, level.tide?.highRow ?? -1);
    if (base.layers) {
      const root = base.erase ? eraseRoot(base) : base;
      this.water.loadLayers(atLayer(root, 'present'), atLayer(root, 'memory'), palette.silhouettes);
      this.water.showLayer(layerOf(this.level));
    }
    this.finishView.setPalette(palette, this.artFinish);
    // Salle habillée (D-28) : dessinée par l'habillage, pas tuile par tuile.
    const images = this.artImages();
    const dressed = this.roomArt.build(level, palette, this.artFinish, this.artScale, images);
    // Les deux couches (D-107) : dessinées à part, avec l'habillage si la salle en a.
    this.shiftView.load(
      atTide(base, false),
      dressed
        ? {
            present: palette,
            memory: MEMORY_PALETTE,
            finish: this.artFinish,
            scale: this.artScale,
            images,
          }
        : null,
    );
    this.shiftView.show(layerOf(this.level), this.erase?.masks ?? null);
    if (dressed) {
      this.backdrop.build(level, palette, this.artScale, images);
      this.foreground.build(level, palette, this.artScale);
      this.worldLife.load(level, palette, this.artScale);
      return;
    }
    this.backdrop.clear();
    this.foreground.clear();
    this.worldLife.clear();
    const chunkPx = LEVEL_CHUNK_TILES * TILE_SIZE;
    const g = this.make.graphics({}, false);
    for (let chunkRow = 0; chunkRow * LEVEL_CHUNK_TILES < level.height; chunkRow++) {
      for (let chunkCol = 0; chunkCol * LEVEL_CHUNK_TILES < level.width; chunkCol++) {
        const col0 = chunkCol * LEVEL_CHUNK_TILES;
        const row0 = chunkRow * LEVEL_CHUNK_TILES;
        const cols = Math.min(LEVEL_CHUNK_TILES, level.width - col0);
        const rows = Math.min(LEVEL_CHUNK_TILES, level.height - row0);
        g.clear();
        let drawn = false;
        for (let row = row0; row < row0 + rows; row++) {
          for (let col = col0; col < col0 + cols; col++) {
            drawn =
              this.drawTile(
                g,
                level,
                col,
                row,
                (col - col0) * TILE_SIZE,
                (row - row0) * TILE_SIZE,
              ) || drawn;
          }
        }
        if (!drawn) {
          continue;
        }
        const key = `level-${level.id}-${chunkCol}-${chunkRow}`;
        if (this.textures.exists(key)) {
          this.textures.remove(key);
        }
        g.generateTexture(key, cols * TILE_SIZE, rows * TILE_SIZE);
        this.levelImages.push(
          this.add.image(chunkCol * chunkPx, chunkRow * chunkPx, key).setOrigin(0, 0),
        );
      }
    }
    g.destroy();
  }

  /** Dessine une tuile à (x, y) dans le bloc ; retourne faux si elle est vide. */
  private drawTile(
    g: Phaser.GameObjects.Graphics,
    level: LevelData,
    col: number,
    row: number,
    x: number,
    y: number,
  ): boolean {
    const tile = tileAt(level, col, row);
    const material = level.materials[row * level.width + col];
    if (tile === Tile.Solid) {
      // Placeholders de matériaux (D-25) : murs, meubles en bois, tissu (lit, canapé, linge).
      const colors = SOLID_COLORS[material ?? Material.Default] ?? DEFAULT_SOLID;
      g.fillStyle(colors.fill);
      g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      const above = row * level.width - level.width + col;
      if (tileAt(level, col, row - 1) !== Tile.Solid || level.materials[above] !== material) {
        g.fillStyle(colors.edge);
        g.fillRect(x, y, TILE_SIZE, 2);
      }
      return true;
    }
    if (tile === Tile.Empty && (col === 0 || col === level.width - 1)) {
      // Sortie (D-25) : ouverture dans le mur, à peine éclairée, linteau en haut.
      g.fillStyle(PLACEHOLDER_COLORS.exit, 0.08);
      g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      if (tileAt(level, col, row - 1) === Tile.Solid) {
        g.fillStyle(PLACEHOLDER_COLORS.exit, 0.35);
        g.fillRect(x, y, TILE_SIZE, 2);
      }
      return true;
    }
    if (tile === Tile.Hazard || tile === Tile.Thorns) {
      // Placeholder de danger (design ouvert, §45) : rangée de pointes émoussées, sans violence.
      g.fillStyle(PLACEHOLDER_COLORS.hazard);
      for (let i = 0; i < 4; i++) {
        g.fillTriangle(
          x + i * 4,
          y + TILE_SIZE,
          x + i * 4 + 2,
          y + 6,
          x + i * 4 + 4,
          y + TILE_SIZE,
        );
      }
      return true;
    }
    if (tile === Tile.Water) {
      // L'effacement (D-111) : gris pâle à la place de l'eau.
      g.fillStyle(
        level.meta.void === 'erasure' ? ERASURE_COLORS.tile : PLACEHOLDER_COLORS.water,
        0.8,
      );
      g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      return true;
    }
    if (tile === Tile.OneWay) {
      const color =
        material === Material.Wood ? PLACEHOLDER_COLORS.woodEdge : PLACEHOLDER_COLORS.oneWay;
      g.fillStyle(color);
      g.fillRect(x, y, TILE_SIZE, 3);
      g.fillStyle(color, 0.25);
      g.fillRect(x, y + 3, TILE_SIZE, 5);
      return true;
    }
    const goal = level.goal;
    if (goal?.col === col && goal.row === row) {
      // Placeholder d'arrivée : un fanion.
      g.fillStyle(PLACEHOLDER_COLORS.goal);
      g.fillRect(x + 3, y, 2, TILE_SIZE);
      g.fillTriangle(x + 5, y, x + 15, y + 4, x + 5, y + 8);
      return true;
    }
    return false;
  }

  /** Pose de la marionnette (D-29), un pas : état de Céleste et coup de bâton en cours. */
  private stepPose(): void {
    const attack = this.combat.attack;
    let phase: number = PoseAttack.None;
    let progress = 0;
    if (attack.phase === AttackPhase.Startup) {
      phase = PoseAttack.Startup;
    } else if (attack.phase === AttackPhase.Active) {
      phase = PoseAttack.Active;
      progress = 1 - attack.phaseSteps / Math.max(1, msToSteps(this.combatParams.attackActiveMs));
    } else if (attack.phase === AttackPhase.Recovery) {
      phase = PoseAttack.Recovery;
    }
    this.poser.step(this.player, phase, progress);
  }

  /** Applique les réglages de finition (overlay) : la salle est redessinée. */
  applyFinish(): void {
    this.redrawArt();
  }

  /** Applique les réglages de la marionnette (overlay). */
  applyPuppet(): void {
    this.poser.setParams(this.puppetParams, this.grownMovement.maxRunSpeed);
  }

  /** Lumières éteintes dans la salle courante (la nuit dans le train, D-85). */
  private isDim(): boolean {
    return this.zone !== null && this.story.dim(this.level.id);
  }

  /**
   * Palette courante ; lumières éteintes (D-85) : plus sombre, les liseuses éteintes (halos des
   * lampes réduits).
   */
  private palette() {
    const palette = this.basePalette();
    return this.isDim()
      ? {
          ...palette,
          darkness: Math.max(palette.darkness, TRAIN_RIDE.dimDarkness),
          glow: Math.min(palette.glow, TRAIN_RIDE.dimGlow),
        }
      : palette;
  }

  /** Palette de la salle : monde étrange (D-28), ou maison le soir ou le matin (D-31). */
  private basePalette() {
    if (this.strangeWorld || isStrangeRoom(this.level)) {
      // Derrière la haie (D-49) : le monde étrange, dehors (ciel violet au lieu du mur).
      return this.level.meta.outdoor ? { ...STRANGE_PALETTE, outdoor: true } : STRANGE_PALETTE;
    }
    if (this.level.meta.world === 'memory') {
      // Un souvenir jouable (D-89) : couleurs chaudes et passées.
      return MEMORY_PALETTE;
    }
    if (isGardenRoom(this.level)) {
      return GARDEN_PALETTE;
    }
    if (this.level.meta.vehicle === 'train' && this.level.meta.outdoor) {
      // Le toit du train (D-86) : dehors, la nuit ; de jour à quai (D-90), un ciel clair.
      return this.story.timeOfDay() === 'morning' ? TRAIN_DAY_PALETTE : TRAIN_NIGHT_PALETTE;
    }
    if (isStreetRoom(this.level) && this.level.meta.indoor) {
      // Un lieu fermé du quartier (la supérette, D-63) : dedans, de jour, ses propres murs. La nuit
      // (le hall de la gare, D-69) : la nuit de la maison, avec ses murs de nuit
      // (`; @nightwalls: haut bas`).
      const night = this.story.timeOfDay() === 'evening' && this.level.meta.nightwalls;
      const walls = (night || this.level.meta.walls)?.split(/\s+/);
      const base = night ? REAL_PALETTE : DAY_PALETTE;
      return walls?.[0] && walls[1] ? { ...base, wallTop: walls[0], wallBottom: walls[1] } : base;
    }
    if (isStreetRoom(this.level)) {
      // Sol propre à un lieu du quartier (`; @floor: dessus bord`), le sol souple de l'aire de jeux.
      // Le soir de l'école (D-64) : le crépuscule.
      const street = this.story.timeOfDay() === 'evening' ? STREET_DUSK_PALETTE : STREET_PALETTE;
      const floor = this.level.meta.floor?.split(/\s+/);
      return floor?.[0] && floor[1] ? { ...street, floor: floor[0], floorEdge: floor[1] } : street;
    }
    const base = this.story.timeOfDay() === 'morning' ? DAY_PALETTE : REAL_PALETTE;
    // Couleur de mur propre à une salle (`; @walls: haut bas`), la cabane en bois par exemple.
    const walls = this.level.meta.walls?.split(/\s+/);
    return walls?.[0] && walls[1] ? { ...base, wallTop: walls[0], wallBottom: walls[1] } : base;
  }

  /**
   * Céleste garde ses couleurs dans le monde étrange (D-31) : lisible (pilier 1), seule chose
   * « réelle » au milieu des silhouettes.
   */
  private celestePalette() {
    const palette = this.palette();
    return palette.silhouettes ? REAL_PALETTE : palette;
  }

  /**
   * Objets de mise en scène (pilier 5) : un changement n'est appliqué que hors de la vue ou dans
   * le noir ; le moment de la journée change dans le noir (la salle est redessinée).
   */
  private stepStage(): void {
    const camera = this.camera;
    const view = this.viewBox;
    view.width = camera.viewWidth;
    view.height = camera.viewHeight;
    view.x = camera.x - view.width / 2;
    view.y = camera.y - view.height / 2;
    const story = this.story;
    const veil = Math.max(story.veil, this.transition.veil);
    // Le train arrêté (D-90) : ni tunnel ni valise qui tombe.
    this.combat.still = this.level.meta.vehicle === 'train' && !story.moving(this.level.id);
    const memory = this.memoryPlay;
    if (this.props.update(memory ? memory.flags : story.flags, view, veil)) {
      this.storyView.refresh();
    }
    if (veil >= 1 && (story.timeOfDay() !== this.drawnTime || this.isDim() !== this.drawnDim)) {
      this.redrawArt();
    }
    // La marée a tourné (D-95) : dans le noir d'un fondu (le banc), ou tout de suite hors script
    // (outil de debug). Céleste reste où elle est (le banc est au sec aux deux marées).
    if ((veil >= 1 || !story.busy) && this.atTide(this.level) !== this.level) {
      this.swapTide();
    }
    const near = memory
      ? memory.interactable >= 0
      : (story.interactable >= 0 || this.nearDoor !== 0) && !story.busy;
    this.touch?.setLabel('Attack', near ? 'Agir' : null);
    const door = this.level.doors.find((d) => d.id === this.nearDoor);
    const mark = this.storyView.doorMark;
    if (memory) {
      // Souvenir jouable : l'étincelle montre l'action à faire.
      this.storyView.doorMark = memory.locked ? null : (memory.current?.mark ?? null);
    } else if (!door) {
      this.storyView.doorMark = null;
    } else if (mark?.col !== door.col || mark.row !== door.row - 3) {
      this.storyView.doorMark = { col: door.col, row: door.row - 3 };
    }
    const music = this.musicContext;
    music.strange = isStrangeRoom(this.level);
    music.garden = isGardenRoom(this.level);
    music.street = isStreetRoom(this.level);
    const roomTrack = this.level.meta.music;
    music.room = isMusicTrack(roomTrack) ? roomTrack : null;
    this.audio.setMusic(chooseMusic(music));
  }

  /** Centre du fondu en cercle (D-35) : Céleste, en px CSS de la page. */
  private irisCenter(): { x: number; y: number } {
    const main = this.cameras.main;
    const bounds = this.game.canvas.getBoundingClientRect();
    const k = bounds.width / this.scale.width;
    const y = this.puppet.y - this.growth.hitbox.height / 2;
    this.irisPoint.x = bounds.left + (this.puppet.x - main.worldView.x) * main.zoom * k;
    this.irisPoint.y = bounds.top + (y - main.worldView.y) * main.zoom * k;
    return this.irisPoint;
  }

  /** Céleste placée debout sur une tuile par l'histoire (dans le noir d'un fondu). */
  private placeCeleste(col: number, row: number, facing: 1 | -1): void {
    this.player.reset(
      (col + 0.5) * TILE_SIZE - this.growth.hitbox.width / 2,
      (row + 1) * TILE_SIZE - this.growth.hitbox.height,
      this.level,
    );
    this.player.facing = facing;
    this.feel.reset(this.player);
    this.poser.reset();
    this.resetCamera();
  }

  /**
   * Céleste passe dans une autre salle par l'histoire (dans le noir, D-34) ; le script continue.
   * `returnPoint` : la veilleuse de cette salle devient le point de retour (sauvegardé).
   */
  private storyRoom(
    id: string,
    col: number,
    row: number,
    facing: 1 | -1,
    returnPoint: boolean,
  ): void {
    const room = zoneRoom(id);
    if (!room) {
      return;
    }
    if (returnPoint) {
      const lamp = room.level.entities.find((e) => e.type === EntityType.Checkpoint);
      void this.session.setCheckpoint(id, lamp ? checkpointId(lamp.col, lamp.row) : null);
    }
    const saved = this.session.data.checkpoint;
    this.setRoom(room.level, room.zone, saved.levelId === id ? saved.checkpointId : null);
    this.transition.cancel();
    this.placeCeleste(col, row, facing);
  }

  /**
   * Souvenir jouable (D-89) : le jeu est mis de côté (salle, place de Céleste), Céleste toute
   * petite joue le souvenir dans sa salle, hors de la partie (rien n'est sauvegardé). À la fin, elle
   * revient exactement où elle était, dans le noir. `fromStory` : lancé par le script (étape
   * `play`), qui reprend ensuite ; sinon par le cahier, et l'image revient doucement.
   */
  playMemory(id: PlayableMemoryId, fromStory: boolean): void {
    const data = PLAYABLE_MEMORIES[id];
    const source = MEMORY_ROOMS.find((room) => room.id === data.room);
    if (this.memoryPlay || !source) {
      if (fromStory) {
        this.story.endPlay();
      }
      return;
    }
    const box = this.player.box;
    this.memoryReturn = {
      level: this.level,
      zone: this.zone,
      x: box.x,
      y: box.y,
      facing: this.player.facing,
      fromStory,
    };
    this.memoryPlay = new PlayableMemory(data, PHYSICS_STEP_HZ);
    this.transition.cancel();
    this.storyView.clearThought();
    this.setRoom(parseAsciiLevel(source.id, source.text), null, null);
    this.useGrowth(TODDLER_LOOK);
    // Ni saut ni capacité dans un souvenir : Céleste toute petite marche seulement.
    const player = this.player;
    player.canClimb = player.canWallJump = player.canGlide = player.canHook = false;
    player.canSlide = false;
    this.touch?.setAbilityVisible(false);
    this.props.load(data.props, data.room, this.memoryPlay.flags);
    this.storyView.rebuild();
    this.placeCeleste(data.start.col, data.start.row, data.start.facing);
    this.clock.reset();
  }

  /** Un pas du souvenir jouable : marcher, Agir près de l'action suivante. */
  private stepMemory(memory: PlayableMemory): void {
    const controls = this.controls;
    const interact = controls.consumePressed('Interact') || controls.consumePressed('Attack');
    controls.consumePressed('Jump');
    controls.consumePressed('Ability');
    const input = this.playerInput;
    input.moveX = memory.locked ? 0 : controls.moveX;
    input.moveY = 0;
    input.jumpPressed = false;
    input.jumpHeld = false;
    input.abilityPressed = false;
    const player = this.player;
    player.step(input);
    const events = memory.step(player.box, interact && player.grounded);
    if ((events & MemoryEvent.Gesture) !== 0) {
      const action = memory.data.actions[memory.lastAction];
      if (action) {
        // Céleste se tourne vers ce qu'elle fait, les mains devant.
        const center = (action.area.col + action.area.w / 2) * TILE_SIZE;
        player.facing = center < player.box.x + player.box.width / 2 ? -1 : 1;
        this.poser.gesture = action.gesture;
        this.poser.gestureSteps = msToSteps(PLAYABLE_MEMORY_TIMING.gestureMs, PHYSICS_STEP_HZ);
        if (action.sparkle) {
          this.fx.sparkle(action.sparkle, PLAYABLE_MEMORY_TIMING.gestureMs);
        }
      }
      this.poser.carrying = memory.carrying;
    }
    if ((events & MemoryEvent.Heart) !== 0) {
      this.storyView.think('heart', PLAYABLE_MEMORY_TIMING.heartMs);
    }
    if ((events & MemoryEvent.Done) !== 0) {
      this.endMemory();
      return;
    }
    this.camera.lookInput = 0;
    this.camera.step(player);
    this.feel.step(player);
    this.stepPose();
    this.stepStage();
  }

  /** Fin du souvenir (dans le noir) : retour exact là où était Céleste. */
  private endMemory(): void {
    const back = this.memoryReturn;
    this.clearMemory();
    if (!back) {
      return;
    }
    const saved = this.session.data.checkpoint;
    this.setRoom(
      back.level,
      back.zone,
      saved.levelId === back.level.id ? saved.checkpointId : null,
    );
    this.useGrowth(growthPhase(this.story.flags));
    this.player.reset(back.x, back.y, this.level);
    this.player.facing = back.facing < 0 ? -1 : 1;
    this.feel.reset(this.player);
    this.resetCamera();
    this.clock.reset();
    if (back.fromStory) {
      // Le script reprend, toujours dans le noir.
      this.story.endPlay();
    } else {
      this.reappearAtMs = this.time.now;
    }
  }

  /** Souvenir interrompu (menu pause, debug) : Céleste reprend sa taille ; le script s'arrête. */
  private abortMemory(): void {
    if (!this.memoryPlay) {
      return;
    }
    const fromStory = this.memoryReturn?.fromStory ?? false;
    this.clearMemory();
    this.useGrowth(growthPhase(this.story.flags));
    if (fromStory) {
      this.story.cancel();
    }
  }

  private clearMemory(): void {
    this.memoryPlay = null;
    this.memoryReturn = null;
    this.poser.reset();
    this.cupImage.setVisible(false);
    this.puppet.setAlpha(1);
  }

  /** La tasse tenue devant Céleste, les deux mains (souvenir de la cuisine, D-89). */
  /** Ce que Céleste porte dans un souvenir jouable (D-89, D-118) : la tasse, ou un cube. */
  private createCupImage(): Phaser.GameObjects.Image {
    const scale = 4;
    for (const [key, draw] of [
      [
        'memory-cup',
        (ctx: CanvasRenderingContext2D) => {
          teaCup(ctx, 6);
        },
      ],
      [
        'memory-cube',
        (ctx: CanvasRenderingContext2D) => {
          cubeTower(ctx, 7);
        },
      ],
    ] as const) {
      if (this.textures.exists(key)) {
        continue;
      }
      const canvas = document.createElement('canvas');
      canvas.width = 8 * scale;
      canvas.height = 7 * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.translate(4, 3.5);
        draw(ctx);
      }
      this.textures.addCanvas(key, canvas);
    }
    return this.add
      .image(0, 0, 'memory-cup')
      .setScale(1 / scale)
      .setDepth(10.5)
      .setVisible(false);
  }

  private renderCup(): void {
    const memory = this.memoryPlay;
    const visible = memory !== null && memory.carrying && memory.celesteVisible;
    this.cupImage.setVisible(visible);
    if (visible) {
      const key = memory.data.carried === 'cube' ? 'memory-cube' : 'memory-cup';
      if (this.cupImage.texture.key !== key) {
        this.cupImage.setTexture(key);
      }
      const facing = this.player.facing;
      this.cupImage.setPosition(
        this.puppet.x + facing * 6,
        this.puppet.y - this.growth.hitbox.height * 0.48,
      );
      this.cupImage.setFlipX(facing < 0);
    }
  }

  /** Outil de debug : étapes de l'histoire remplacées (sans sauvegarde), salle redessinée. */
  setStoryFlags(flags: readonly string[]): void {
    this.story.setFlags(flags);
    this.applyGrowth();
    this.props.load(this.story.data.props, this.level.id, this.story.flags);
    this.poser.sitting = false;
    this.redrawArt();
  }
}
