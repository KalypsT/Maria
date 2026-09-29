import Phaser from 'phaser';
import { DEFAULT_CAMERA, type CameraParams } from '../config/camera';
import { DEFAULT_COMBAT, type CombatParams } from '../config/combat';
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
  PLAYER_HITBOX,
  msToSteps,
  type MovementParams,
} from '../config/movement';
import { CameraController } from '../core/camera/CameraController';
import { CombatWorld } from '../core/combat/CombatWorld';
import { FixedStepClock } from '../core/FixedStepClock';
import { InputController } from '../core/input/InputController';
import { KeyboardSource } from '../core/input/KeyboardSource';
import { TouchSource } from '../core/input/TouchSource';
import { Material, Tile, tileAt, type LevelData } from '../core/level/LevelData';
import { parseAsciiLevel } from '../core/level/parseAsciiLevel';
import { PlayerPhysics, type PlayerInput } from '../core/player/PlayerPhysics';
import { PlayerFeel } from '../core/player/playerFeel';
import { LEVELS, levelName, startRoom, zoneRoom, type LevelSource, type ZoneRoom } from '../levels';
import { DEFAULT_WORLD, type WorldParams } from '../config/world';
import type { SaveSession } from '../core/save/SaveSession';
import { ABILITY_HINTS, ABILITY_HINT_MS, Ability, isAbility } from '../config/abilities';
import { PickupKind, Pickups } from '../core/world/Pickups';
import { RoomTransition } from '../core/world/RoomTransition';
import { RunEvent, RunState } from '../core/world/RunState';
import { arrivalPosition, touchedExit, type ExitRef, type Zone } from '../core/world/zone';
import { Hud } from '../ui/Hud';
import { showExportDialog, showImportDialog } from '../ui/SaveCodeDialog';
import { PauseMenu } from '../ui/PauseMenu';
import { ART_IMAGES, MAX_ART_SCALE, REAL_PALETTE, STRANGE_PALETTE } from '../config/art';
import { CombatView } from './CombatView';
import { CelestePuppet } from './CelestePuppet';
import { RoomArtView } from './RoomArtView';
import { DEFAULT_PUPPET, type PuppetParams } from '../config/puppet';
import { CelestePoser, PoseAttack } from '../core/player/celestePose';
import { AttackPhase } from '../core/combat/PlayerAttack';
import { DustPool } from './DustPool';
import { WorldView } from './WorldView';

/** Durée d'image maximale prise en compte (onglet en arrière-plan, pause du navigateur). */
const MAX_FRAME_SECONDS = 0.25;
/** Clé du registre Phaser où main.ts dépose la partie en cours (D-22). */
export const SESSION_KEY = 'maria-session';

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
};

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
  /** Échec, jauge de peur et checkpoints (D-21), modifiables par l'overlay. */
  readonly worldParams: WorldParams = { ...DEFAULT_WORLD };
  run!: RunState;
  /** Objets de capacité de la salle (D-26). */
  readonly pickups = new Pickups();
  /** Outil de debug : escalade débloquée sans objet ni sauvegarde. */
  debugClimb = false;
  /** Aperçu du monde étrange (D-28, overlay) : mêmes formes, autre palette. */
  strangeWorld = false;
  private roomArt!: RoomArtView;
  /** Échelle des textures dessinées (habillage, Céleste) : celle de l'écran, plafonnée. */
  private artScale = 1;
  /** Changement de salle en cours (D-25). */
  readonly transition = new RoomTransition(this.worldParams);
  session!: SaveSession;
  private worldView!: WorldView;
  private hud!: Hud;
  /** Heure de la dernière réapparition (fondu de retour), -1 sinon. */
  private reappearAtMs = -1;
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
  private readonly playerInput: PlayerInput = {
    moveX: 0,
    moveY: 0,
    jumpPressed: false,
    jumpHeld: false,
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
    this.roomArt = new RoomArtView(this);
    this.artScale = this.computeArtScale();
    const save = this.session.data;
    const { room, checkpointId } = savedReturn(this.session);
    this.level = room.level;
    this.zone = room.zone;
    this.drawLevel();
    this.run = new RunState(this.level, this.worldParams);
    this.run.load(this.level, save.activatedCheckpoints, checkpointId);
    this.pickups.load(this.level, save.progression.abilities, save.progression.collectibles);
    void this.session.revealRoom(this.level.id);
    const { x, y } = this.respawnPosition();
    this.player = new PlayerPhysics(this.level, this.movement, x, y);
    // Origine aux pieds : l'écrasement et l'inclinaison se font autour du point d'appui.
    this.puppet = new CelestePuppet(this);
    this.puppet.redraw(this.artScale, this.palette(), this.artImages());
    this.dust = new DustPool(this, this.feelParams);
    this.combat = new CombatWorld(this.level, this.combatParams);
    this.combatView = new CombatView(this, this.combat, this.combatParams, this.dust);
    this.worldView = new WorldView(this, this.run, this.pickups);
    this.worldView.setArtScale(this.artScale);
    this.hud = new Hud();
    this.applyMovement();
    this.applyAbilities();
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
      showTouchSettings: this.touch !== undefined,
      onResume: () => {
        this.setPaused(false);
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
      this.hud.destroy();
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
    if (this.controls.consumePressed('Pause')) {
      this.setPaused(!this.paused);
    }
    if (this.paused) {
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
      input.moveX = this.controls.moveX;
      input.moveY = this.controls.moveY;
      input.jumpPressed = this.controls.consumePressed('Jump');
      input.jumpHeld = this.controls.isHeld('Jump');
      this.player.step(input);
      combat.step(this.player, this.controls.consumePressed('Attack'));
      if (combat.events !== 0) {
        this.combatView.onEvents(combat.events);
      }
      run.step(this.player.box, combat.events);
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
        if (target) {
          transition.start(target, this.player.vx);
        }
      }
      camera.lookInput = input.moveY;
      camera.step(this.player);
      feel.step(this.player);
      this.stepPose();
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
    this.combatView.render(alpha, player, this.puppet);
    this.worldView.render();
    this.renderRunState();
    this.dust.update();
    this.cameras.main.centerOn(
      camera.prevX + (camera.x - camera.prevX) * alpha,
      camera.prevY + (camera.y - camera.prevY) * alpha,
    );
  }

  /** Met le jeu en pause (simulation arrêtée, menu affiché) ou le reprend. */
  setPaused(paused: boolean): void {
    if (paused === this.paused) {
      return;
    }
    this.paused = paused;
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
    this.player.setParams(this.movement);
    this.feel.maxRunSpeed = this.movement.maxRunSpeed;
    this.feel.maxFallSpeed = this.movement.maxFallSpeed;
    this.poser.setParams(this.puppetParams, this.movement.maxRunSpeed);
  }

  /** Applique les réglages de combat (overlay). */
  applyCombat(): void {
    this.combat.setParams(this.combatParams);
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
    this.camera.setParams(this.cameraParams);
    this.onResize();
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
      x: (tile.col + 0.5) * TILE_SIZE - PLAYER_HITBOX.width / 2,
      y: (tile.row + 1) * TILE_SIZE - PLAYER_HITBOX.height,
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

  /** Voile de l'évanouissement, jauge de peur, transparence de Céleste. */
  private renderRunState(): void {
    const run = this.run;
    this.hud.setFear(run.fear, this.worldParams.fearMax);
    if (run.fainting) {
      const progress = run.faintProgress;
      this.hud.setVeil(Math.max(progress, this.transition.veil));
      this.puppet.setAlpha(1 - progress);
      return;
    }
    let veil = this.transition.veil;
    if (this.reappearAtMs >= 0) {
      const duration = this.worldParams.reappearMs;
      const k = duration > 0 ? (this.time.now - this.reappearAtMs) / duration : 1;
      veil = Math.max(veil, 1 - k);
      if (k >= 1) {
        this.reappearAtMs = -1;
      }
    }
    this.hud.setVeil(veil);
  }

  respawn(): void {
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
    this.setRoom(parseAsciiLevel(source.id, source.text), null, null);
    this.respawn();
  }

  /** Retour au point de retour de la partie, dans sa salle (réapparition, menu pause). */
  returnToSaved(): void {
    const { room, checkpointId } = savedReturn(this.session);
    if (room.level !== this.level) {
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
    this.setRoom(room.level, room.zone, levelId === id ? checkpointId : null);
    const { spawn } = room.level;
    this.player.reset(
      (spawn.col + 0.5) * TILE_SIZE - PLAYER_HITBOX.width / 2,
      (spawn.row + 1) * TILE_SIZE - PLAYER_HITBOX.height,
      room.level,
    );
    this.feel.reset(this.player);
    this.poser.reset();
    this.clock.reset();
    this.transition.cancel();
    this.resetCamera();
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
      PLAYER_HITBOX.width,
      PLAYER_HITBOX.height,
    );
    this.player.reset(x, y, room.level);
    this.player.vx = vx;
    this.feel.reset(this.player);
    this.poser.reset();
    this.resetCamera();
  }

  /**
   * Remplace la salle : dessin, ennemis, checkpoints, ambiance ; une salle de zone est ajoutée à la
   * carte révélée. Céleste est replacée ensuite.
   */
  private setRoom(level: LevelData, zone: Zone | null, checkpointId: string | null): void {
    this.level = level;
    this.zone = zone;
    if (zone) {
      void this.session.revealRoom(level.id);
    }
    this.drawLevel();
    this.combat.load(level);
    this.combatView.rebuild();
    this.run.load(level, this.session.data.activatedCheckpoints, checkpointId);
    const { abilities, collectibles } = this.session.data.progression;
    this.pickups.load(level, abilities, collectibles);
    this.worldView.rebuild();
  }

  /** Capacités acquises (sauvegarde) ou débloquées par l'overlay, appliquées à Céleste. */
  applyAbilities(): void {
    this.player.canClimb =
      this.debugClimb || this.session.data.progression.abilities.includes(Ability.Climb);
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
      void this.session.addCollectible(item.id);
      return;
    }
    if (!isAbility(item.id)) {
      return;
    }
    void this.session.unlockAbility(item.id);
    this.applyAbilities();
    this.hud.showHint(ABILITY_HINTS[item.id], ABILITY_HINT_MS);
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
    this.cameras.main.setZoom(this.cameraParams.zoom * scale);
    this.cameras.main.centerOn(this.camera.x, this.camera.y);
    const artScale = this.computeArtScale();
    if (artScale !== this.artScale) {
      this.artScale = artScale;
      this.redrawArt();
    }
  };

  /** Échelle des dessins : pixels de l'écran par pixel logique (arrondie au demi, plafonnée). */
  private computeArtScale(): number {
    const screen = this.renderScale * this.cameraParams.zoom;
    return Math.min(MAX_ART_SCALE, Math.max(1, Math.ceil(screen * 2) / 2));
  }

  /** Aperçu du monde étrange (overlay). */
  setStrangeWorld(strange: boolean): void {
    this.strangeWorld = strange;
    this.redrawArt();
  }

  /** Redessine la salle et Céleste (échelle ou palette changée). */
  private redrawArt(): void {
    this.worldView.setArtScale(this.artScale);
    this.drawLevel();
    this.puppet.redraw(this.artScale, this.palette(), this.artImages());
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
    const level = this.level;
    // Salle habillée (D-28) : dessinée par l'habillage, pas tuile par tuile.
    const palette = this.strangeWorld ? STRANGE_PALETTE : REAL_PALETTE;
    if (this.roomArt.build(level, palette, this.artScale, this.artImages())) {
      return;
    }
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
              this.drawTile(g, col, row, (col - col0) * TILE_SIZE, (row - row0) * TILE_SIZE) ||
              drawn;
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
    col: number,
    row: number,
    x: number,
    y: number,
  ): boolean {
    const level = this.level;
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
    if (tile === Tile.Hazard) {
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

  /** Applique les réglages de la marionnette (overlay). */
  applyPuppet(): void {
    this.poser.setParams(this.puppetParams, this.movement.maxRunSpeed);
  }

  /** Palette courante : maison réelle ou monde étrange (D-28). */
  private palette() {
    return this.strangeWorld ? STRANGE_PALETTE : REAL_PALETTE;
  }
}
