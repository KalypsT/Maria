import type { PuppetParams } from '../../config/puppet';
import { PlayerState } from './playerState';

/**
 * Pose de Céleste en « papier découpé » (D-29), pure et indépendante de Phaser : angles des pièces
 * (radians, 0 = pendant vers le bas, positif = vers l'avant), décalages du corps (px). Visuel
 * seulement. Aucune allocation dans `step`.
 */
export interface CelestePose {
  bodyY: number;
  bodyTilt: number;
  headTilt: number;
  armFront: number;
  armBack: number;
  legFront: number;
  legBack: number;
  /** Inclinaison des couettes (vers l'arrière si positive). */
  pigtails: number;
  /** Allongement des bras (1 au repos) : tendus vers le rebord quand elle est suspendue. */
  armReach: number;
}

/** Ce que la marionnette lit de Céleste et du combat, à chaque pas. */
export interface PoseSubject {
  readonly state: PlayerState;
  readonly vx: number;
  readonly vy: number;
  readonly facing: number;
}

/** Attaque (D-20) : 0 aucune, 1 préparation, 2 frappe, 3 récupération. */
export const PoseAttack = { None: 0, Startup: 1, Active: 2, Recovery: 3 } as const;

const DEG = Math.PI / 180;

export class CelestePoser {
  readonly pose: CelestePose = {
    bodyY: 0,
    bodyTilt: 0,
    headTilt: 0,
    armFront: 0,
    armBack: 0,
    legFront: 0,
    legBack: 0,
    pigtails: 0,
    armReach: 1,
  };
  /** Phase du cycle de pas (radians). */
  runPhase = 0;
  private time = 0;
  private stateSteps = 0;
  private lastState: PlayerState = PlayerState.Idle;
  private pigtailVel = 0;
  private readonly params: PuppetParams;
  private readonly target: CelestePose = {
    bodyY: 0,
    bodyTilt: 0,
    headTilt: 0,
    armFront: 0,
    armBack: 0,
    legFront: 0,
    legBack: 0,
    pigtails: 0,
    armReach: 1,
  };

  constructor(
    params: Readonly<PuppetParams>,
    private readonly dt: number,
    /** Vitesse de course maximale (px/s), pour doser les couettes. */
    private maxRunSpeed: number,
  ) {
    this.params = { ...params };
  }

  setParams(params: Readonly<PuppetParams>, maxRunSpeed = this.maxRunSpeed): void {
    Object.assign(this.params, params);
    this.maxRunSpeed = maxRunSpeed;
  }

  /** Remise à la pose de repos (réapparition, changement de salle). */
  reset(): void {
    const pose = this.pose;
    pose.bodyY = pose.bodyTilt = pose.headTilt = 0;
    pose.armFront = pose.armBack = pose.legFront = pose.legBack = pose.pigtails = 0;
    pose.armReach = 1;
    this.pigtailVel = 0;
    this.runPhase = 0;
    this.stateSteps = 0;
  }

  /** Un pas de simulation. `attack` : phase d'attaque (`PoseAttack`), `attackProgress` 0 → 1. */
  step(subject: PoseSubject, attack: number, attackProgress: number): void {
    const p = this.params;
    const dt = this.dt;
    const t = this.target;
    this.time += dt;
    if (subject.state !== this.lastState) {
      this.lastState = subject.state;
      this.stateSteps = 0;
    } else {
      this.stateSteps++;
    }
    const speed = Math.abs(subject.vx);
    t.bodyY = 0;
    t.bodyTilt = 0;
    t.headTilt = 0;
    t.armReach = 1;
    switch (subject.state) {
      case PlayerState.Run: {
        this.runPhase += ((speed * dt) / Math.max(1, p.strideLengthPx)) * Math.PI * 2;
        const swing = Math.sin(this.runPhase);
        const amount = Math.min(1, speed / Math.max(1, this.maxRunSpeed));
        t.legFront = swing * p.legSwingDeg * DEG * amount;
        t.legBack = -t.legFront;
        t.armFront = -swing * p.armSwingDeg * DEG * amount;
        t.armBack = -t.armFront;
        t.bodyY = -Math.abs(Math.cos(this.runPhase)) * p.runBobPx * amount;
        break;
      }
      case PlayerState.Jump:
        t.legFront = 25 * DEG;
        t.legBack = -30 * DEG;
        t.armFront = 70 * DEG;
        t.armBack = 40 * DEG;
        t.headTilt = -4 * DEG;
        break;
      case PlayerState.Fall:
        t.legFront = 12 * DEG;
        t.legBack = -12 * DEG;
        t.armFront = 55 * DEG;
        t.armBack = -45 * DEG;
        break;
      case PlayerState.Hang: {
        const sway = Math.sin((this.time * 1000 * Math.PI * 2) / p.hangSwingMs);
        t.armFront = 170 * DEG;
        t.armBack = 160 * DEG;
        t.armReach = 1.6;
        t.legFront = sway * p.hangSwingDeg * DEG;
        t.legBack = -sway * p.hangSwingDeg * DEG * 0.7;
        t.headTilt = -8 * DEG;
        break;
      }
      case PlayerState.Climb: {
        // Traction : bras qui ramènent le corps, une jambe qui monte.
        const k = Math.min(1, this.stateSteps / 24);
        t.armFront = (170 - 130 * k) * DEG;
        t.armBack = (160 - 130 * k) * DEG;
        t.armReach = 1.6 - 0.6 * k;
        t.legFront = 55 * Math.sin(k * Math.PI) * DEG;
        t.legBack = -10 * DEG;
        t.bodyTilt = 10 * DEG * Math.sin(k * Math.PI);
        break;
      }
      case PlayerState.Hurt:
        t.bodyTilt = -14 * DEG;
        t.headTilt = -10 * DEG;
        t.armFront = 40 * DEG;
        t.armBack = 30 * DEG;
        t.legFront = 10 * DEG;
        t.legBack = -8 * DEG;
        break;
      default: {
        // Attente et réception : respiration, bras presque au repos.
        const breath = Math.sin((this.time * 1000 * Math.PI * 2) / p.breathMs);
        t.bodyY = -breath * p.breathPx;
        t.armFront = 4 * DEG + breath * 2 * DEG;
        t.armBack = -3 * DEG - breath * 2 * DEG;
        t.legFront = 0;
        t.legBack = 0;
        this.runPhase = 0;
      }
    }
    // Attaque : le bras avant accompagne le bâton (levé, balayage, tendu).
    if (attack === PoseAttack.Startup) {
      t.armFront = 150 * DEG;
    } else if (attack === PoseAttack.Active) {
      t.armFront = (150 - 80 * Math.min(1, attackProgress * 2)) * DEG;
    } else if (attack === PoseAttack.Recovery) {
      t.armFront = 70 * DEG;
    }
    // Passage en douceur vers la pose visée (la course garde son cycle exact).
    const k = p.blendMs <= 0 ? 1 : 1 - Math.exp((-dt * 1000) / p.blendMs);
    const pose = this.pose;
    const running = subject.state === PlayerState.Run;
    const limbK = running ? Math.max(k, 0.5) : k;
    pose.bodyY += (t.bodyY - pose.bodyY) * limbK;
    pose.bodyTilt += (t.bodyTilt - pose.bodyTilt) * k;
    pose.headTilt += (t.headTilt - pose.headTilt) * k;
    pose.armFront += (t.armFront - pose.armFront) * (attack !== PoseAttack.None ? 1 : limbK);
    pose.armBack += (t.armBack - pose.armBack) * limbK;
    pose.legFront += (t.legFront - pose.legFront) * limbK;
    pose.legBack += (t.legBack - pose.legBack) * limbK;
    pose.armReach += (t.armReach - pose.armReach) * k;
    // Couettes : ressort amorti, tirées vers l'arrière par la course et vers le haut par la chute.
    const max = p.pigtailMaxDeg * DEG;
    const run = Math.min(1, speed / Math.max(1, this.maxRunSpeed));
    const lift = Math.max(-1, Math.min(1, subject.vy / 300));
    const target = Math.max(-max, Math.min(max, (run * 0.6 + Math.max(0, lift) * 0.8) * max));
    const w = 2 * Math.PI * p.pigtailHz;
    const accel = w * w * (target - pose.pigtails) - 2 * p.pigtailDamping * w * this.pigtailVel;
    this.pigtailVel += accel * dt;
    pose.pigtails = Math.max(-max, Math.min(max, pose.pigtails + this.pigtailVel * dt));
  }
}
