import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';

/**
 * HUD minimal (spec §38, D-21) en DOM : jauge de peur discrète en haut de l'écran et voile de
 * l'évanouissement. Le DOM n'est modifié que si une valeur change.
 */
export class Hud {
  private readonly gauge: HTMLElement;
  private readonly veil: HTMLElement;
  private readonly hint: HTMLElement;
  private hintTimer = 0;
  private dots: HTMLElement[] = [];
  private shownFear = -1;
  private shownMax = -1;
  private shownVeil = -1;

  constructor(parent: HTMLElement = document.body) {
    this.gauge = document.createElement('div');
    this.gauge.id = 'fear-gauge';
    this.gauge.setAttribute('aria-label', 'Peur');
    this.gauge.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    this.veil = document.createElement('div');
    this.veil.id = 'faint-veil';
    this.hint = document.createElement('p');
    this.hint.id = 'hud-hint';
    this.hint.setAttribute('role', 'status');
    parent.append(this.gauge, this.veil, this.hint);
  }

  /** Jauge de peur : `fear` crans remplis sur `max`. Masquée tant qu'elle est vide. */
  setFear(fear: number, max: number): void {
    if (fear === this.shownFear && max === this.shownMax) {
      return;
    }
    if (max !== this.shownMax) {
      this.gauge.replaceChildren();
      this.dots = Array.from({ length: max }, () => {
        const dot = document.createElement('span');
        this.gauge.appendChild(dot);
        return dot;
      });
    }
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('filled', i < fear);
    });
    this.gauge.classList.toggle('visible', fear > 0);
    this.shownFear = fear;
    this.shownMax = max;
  }

  /** Voile d'évanouissement (0 transparent → 1 noir), arrondi pour limiter les écritures. */
  setVeil(opacity: number): void {
    const value = Math.round(Math.min(1, Math.max(0, opacity)) * 50) / 50;
    if (value === this.shownVeil) {
      return;
    }
    this.veil.style.opacity = String(value);
    this.veil.style.visibility = value > 0 ? 'visible' : 'hidden';
    this.shownVeil = value;
  }

  /** Indice discret en bas de l'écran, effacé après `durationMs`. */
  showHint(text: string, durationMs: number): void {
    this.hint.textContent = text;
    this.hint.classList.add('visible');
    window.clearTimeout(this.hintTimer);
    this.hintTimer = window.setTimeout(() => {
      this.hint.classList.remove('visible');
    }, durationMs);
  }

  destroy(): void {
    window.clearTimeout(this.hintTimer);
    this.gauge.remove();
    this.veil.remove();
    this.hint.remove();
  }
}
