/**
 * Les états de l'intro (D-185), sans DOM ni horloge propre (l'heure est passée en argument) :
 * - `loading` : les images se chargent ;
 * - `waiting` : la boîte à musique attend le premier toucher (il permet aussi le son) ;
 * - `playing` : l'intro se déroule ; un toucher montre « Passer » quelques secondes ;
 * - `leaving` : passée, elle se fond dans le papier de l'écran titre ;
 * - `done` : finie (jouée en entier, passée, ou impossible à charger).
 *
 * Mise en arrière-plan : le temps de l'intro s'arrête (`pause` / `resume`).
 *
 * Déjà vue en entier sur l'appareil (`alwaysSkippable`, D-186) : « Passer » est montré d'emblée,
 * dès la boîte qui attend, et jusqu'à la fin.
 */
export type IntroPhase = 'loading' | 'waiting' | 'playing' | 'leaving' | 'done';

export interface IntroTiming {
  totalMs: number;
  skipButtonMs: number;
  skipFadeMs: number;
}

export class IntroDirector {
  private state: IntroPhase = 'loading';
  private startAt = 0;
  private pausedAt = -1;
  private pausedMs = 0;
  private skipUntil = -1;
  private leaveAt = -1;
  /** Temps de l'intro au moment où elle a été passée (l'image reste figée dessous). */
  private frozenMs = 0;
  private playedThrough = false;

  constructor(
    private readonly timing: IntroTiming,
    private readonly alwaysSkippable = false,
  ) {}

  get phase(): IntroPhase {
    return this.state;
  }

  /** Vue jusqu'au bout (ni passée, ni impossible à jouer) : l'écran titre joue alors le plan 8. */
  get completed(): boolean {
    return this.playedThrough;
  }

  /** Les images sont prêtes : la boîte attend. */
  ready(): void {
    if (this.state === 'loading') {
      this.state = 'waiting';
    }
  }

  /** Impossible de jouer l'intro (chargement, erreur) : on passe directement à la suite. */
  abort(): void {
    this.state = 'done';
  }

  /** Un toucher (ou Entrée / Espace) : ouvre la boîte, ou montre « Passer ». */
  press(now: number): void {
    if (this.state === 'waiting') {
      this.state = 'playing';
      this.startAt = now;
      this.pausedMs = 0;
      this.pausedAt = -1;
    } else if (this.state === 'playing') {
      this.skipUntil = now + this.timing.skipButtonMs;
    }
  }

  /** « Passer » (ou Échap) : fondu vers l'écran titre. Pendant le chargement : tout de suite. */
  skip(now: number): void {
    if (this.state === 'loading') {
      this.state = 'done';
    } else if (this.state === 'waiting' || this.state === 'playing') {
      this.frozenMs = this.elapsed(now);
      this.state = 'leaving';
      this.leaveAt = now;
      this.skipUntil = -1;
    }
  }

  pause(now: number): void {
    if (this.pausedAt < 0) {
      this.pausedAt = now;
    }
  }

  resume(now: number): void {
    if (this.pausedAt >= 0) {
      const away = now - this.pausedAt;
      this.pausedMs += away;
      if (this.skipUntil >= 0) {
        this.skipUntil += away;
      }
      if (this.leaveAt >= 0) {
        this.leaveAt += away;
      }
      this.pausedAt = -1;
    }
  }

  /** Temps écoulé dans l'intro (ms), arrêté en arrière-plan ; 0 tant que la boîte attend. */
  elapsed(now: number): number {
    if (this.state === 'leaving' || this.state === 'done') {
      return this.frozenMs;
    }
    if (this.state !== 'playing') {
      return 0;
    }
    const until = this.pausedAt >= 0 ? this.pausedAt : now;
    return Math.max(0, until - this.startAt - this.pausedMs);
  }

  /** Le bouton « Passer » est-il montré ? */
  skipVisible(now: number): boolean {
    if (this.alwaysSkippable) {
      return this.state === 'waiting' || this.state === 'playing';
    }
    return this.state === 'playing' && now < this.skipUntil;
  }

  /** Opacité du papier pendant qu'on passe l'intro (0 → 1). */
  leaveProgress(now: number): number {
    if (this.state === 'done') {
      return 1;
    }
    if (this.state !== 'leaving') {
      return 0;
    }
    const until = this.pausedAt >= 0 ? this.pausedAt : now;
    return Math.min(1, Math.max(0, (until - this.leaveAt) / this.timing.skipFadeMs));
  }

  /** Avance : finie à la fin du déroulé, ou à la fin du fondu quand on l'a passée. */
  update(now: number): IntroPhase {
    if (this.state === 'playing' && this.elapsed(now) >= this.timing.totalMs) {
      this.frozenMs = this.timing.totalMs;
      this.state = 'done';
      this.playedThrough = true;
    } else if (this.state === 'leaving' && this.leaveProgress(now) >= 1) {
      this.state = 'done';
    }
    return this.state;
  }
}
