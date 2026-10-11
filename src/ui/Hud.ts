import { ART_IMAGES, SHELL_ART, TREASURE_FLY } from '../config/art';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';

/** Image de la coquille (D-148), servie avec les autres images fournies. */
const SHELL_SRC = `art/${ART_IMAGES['shell'] ?? 'shell.png'}`;

/**
 * HUD minimal (spec §38, D-21) en DOM : jauge de peur discrète en haut de l'écran et voile de
 * l'évanouissement (uniforme, ou en cercle autour de Céleste, D-35). Le DOM n'est modifié que si une
 * valeur change.
 */
export class Hud {
  private readonly gauge: HTMLElement;
  private readonly veil: HTMLElement;
  private readonly hint: HTMLElement;
  private hintTimer = 0;
  /** Les coquilles (D-148) : « n/N » du lieu, et la coquille qui y file au ramassage. */
  private readonly shellCount: HTMLElement;
  private readonly shellText: HTMLElement;
  private readonly shellFly: HTMLImageElement;
  private shellTimers: number[] = [];
  /** Les trésors en vol vers le sac (D-164). */
  private readonly flights = new Set<HTMLElement>();
  private bumpTimer = 0;
  private dots: HTMLElement[] = [];
  private shownFear = -1;
  private shownMax = -1;
  private shownVeil = -1;
  private veiledBlack = false;
  private shownBackground = '';

  constructor(private readonly parent: HTMLElement = document.body) {
    this.gauge = document.createElement('div');
    this.gauge.id = 'fear-gauge';
    this.gauge.setAttribute('aria-label', 'Peur');
    this.gauge.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    this.veil = document.createElement('div');
    this.veil.id = 'faint-veil';
    this.hint = document.createElement('p');
    this.hint.id = 'hud-hint';
    this.hint.setAttribute('role', 'status');
    this.shellCount = document.createElement('div');
    this.shellCount.id = 'shell-count';
    this.shellCount.setAttribute('role', 'status');
    const icon = document.createElement('img');
    icon.src = SHELL_SRC;
    icon.alt = '';
    this.shellText = document.createElement('span');
    this.shellCount.append(icon, this.shellText);
    this.shellFly = document.createElement('img');
    this.shellFly.id = 'shell-fly';
    this.shellFly.src = SHELL_SRC;
    this.shellFly.alt = '';
    parent.append(this.gauge, this.veil, this.hint, this.shellCount, this.shellFly);
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
  setVeil(opacity: number, iris: { x: number; y: number } | null = null): void {
    const value = Math.round(Math.min(1, Math.max(0, opacity)) * 50) / 50;
    this.veiledBlack = value >= 1;
    if (iris && value > 0 && value < 1) {
      // Fondu en cercle (D-35) : un trou autour de Céleste (coordonnées de l'écran, px CSS), qui
      // rétrécit quand le voile monte. Le voile est alors opaque autour du trou.
      const reach = Math.hypot(window.innerWidth, window.innerHeight);
      const radius = Math.round((1 - value) * reach);
      const background = `radial-gradient(circle at ${String(Math.round(iris.x))}px ${String(
        Math.round(iris.y),
      )}px, transparent ${String(radius)}px, var(--veil) ${String(radius + 28)}px)`;
      if (background !== this.shownBackground) {
        this.veil.style.background = background;
        this.shownBackground = background;
      }
      this.veil.style.opacity = '1';
      this.veil.style.visibility = 'visible';
      this.shownVeil = -1;
      return;
    }
    if (this.shownBackground !== '') {
      this.veil.style.background = '';
      this.shownBackground = '';
      this.shownVeil = -1;
    }
    if (value === this.shownVeil) {
      return;
    }
    this.veil.style.opacity = String(value);
    this.veil.style.visibility = value > 0 ? 'visible' : 'hidden';
    this.shownVeil = value;
  }

  /** L'écran est entièrement noir (outil de debug : une saccade ne s'y voit pas, D-124). */
  get black(): boolean {
    return this.veiledBlack;
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

  /**
   * Une coquille ramassée (D-148) : elle file de `from` (px CSS de la page, null : sans envol) vers
   * le bouton du cahier (la carte), puis « n/N » du lieu s'affiche à côté, un moment (`count` null :
   * une salle hors de la carte, la coquille seule).
   */
  showShell(
    count: { found: number; total: number } | null,
    from: { x: number; y: number } | null,
  ): void {
    for (const timer of this.shellTimers) {
      window.clearTimeout(timer);
    }
    this.shellTimers = [];
    // À côté du bouton de la carte s'il est là (commandes tactiles), sinon en haut à gauche.
    const map = document.querySelector('.touch-map')?.getBoundingClientRect();
    if (map && map.width > 0) {
      this.shellCount.style.left = `${String(Math.round(map.right + 8))}px`;
      this.shellCount.style.top = `${String(Math.round(map.top + map.height / 2))}px`;
    } else {
      this.shellCount.style.left = '';
      this.shellCount.style.top = '';
    }
    this.shellText.textContent = count ? `${String(count.found)}/${String(count.total)}` : '';
    this.shellCount.classList.remove('visible');
    const show = () => {
      this.shellFly.classList.remove('flying');
      this.shellCount.classList.add('visible');
      this.shellTimers.push(
        window.setTimeout(() => {
          this.shellCount.classList.remove('visible');
        }, SHELL_ART.countMs),
      );
    };
    if (!from) {
      show();
      return;
    }
    const target = this.shellCount.getBoundingClientRect();
    const fly = this.shellFly;
    fly.style.transitionDuration = '0ms';
    fly.style.transform = `translate(${String(from.x)}px, ${String(from.y)}px) translate(-50%, -50%)`;
    fly.classList.add('flying');
    // Le départ est posé avant l'envol (une lecture de la mise en page entre les deux).
    fly.getBoundingClientRect();
    fly.style.transitionDuration = `${String(SHELL_ART.flyMs)}ms`;
    fly.style.transform = `translate(${String(target.left + 14)}px, ${String(
      target.top + target.height / 2,
    )}px) translate(-50%, -50%) scale(0.65)`;
    this.shellTimers.push(window.setTimeout(show, SHELL_ART.flyMs));
  }

  /**
   * Un trésor trouvé ou une gommette de capacité (D-164) : `content` apparaît en `from` (px CSS de
   * la page), monte un instant, puis file vers le bouton du sac (en haut à gauche sans commandes
   * tactiles), qui sursaute ; `onArrive` à son arrivée.
   */
  flyToBag(content: HTMLElement, from: { x: number; y: number }, onArrive?: () => void): void {
    const fly = document.createElement('div');
    fly.className = 'treasure-fly';
    fly.style.width = `${String(TREASURE_FLY.sizePx)}px`;
    fly.style.height = `${String(TREASURE_FLY.sizePx)}px`;
    fly.append(content);
    this.parent.append(fly);
    this.flights.add(fly);
    const bag = document.querySelector<HTMLElement>('.touch-map');
    const box = bag?.getBoundingClientRect();
    const to =
      box && box.width > 0
        ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
        : { x: 40, y: 40 };
    const at = (x: number, y: number, scale: number) =>
      `translate(${String(x)}px, ${String(y)}px) translate(-50%, -50%) scale(${String(scale)})`;
    const { showMs, flyMs, liftPx } = TREASURE_FLY;
    const total = showMs + flyMs;
    const up = { x: from.x, y: from.y - liftPx };
    const animation = fly.animate(
      [
        { transform: at(from.x, from.y, 0.5), opacity: 0, easing: 'ease-out' },
        { transform: at(up.x, up.y, 1), opacity: 1, offset: (showMs * 0.55) / total },
        {
          transform: at(up.x, up.y, 1),
          opacity: 1,
          offset: showMs / total,
          easing: 'cubic-bezier(0.45, 0, 0.3, 1)',
        },
        { transform: at(to.x, to.y, TREASURE_FLY.arriveScale), opacity: 0.85 },
      ],
      { duration: total, fill: 'forwards' },
    );
    animation.onfinish = () => {
      fly.remove();
      this.flights.delete(fly);
      if (bag) {
        bag.classList.add('bump');
        window.clearTimeout(this.bumpTimer);
        this.bumpTimer = window.setTimeout(() => {
          bag.classList.remove('bump');
        }, TREASURE_FLY.bumpMs);
      }
      onArrive?.();
    };
  }

  destroy(): void {
    window.clearTimeout(this.bumpTimer);
    for (const fly of this.flights) {
      fly.remove();
    }
    this.flights.clear();
    window.clearTimeout(this.hintTimer);
    for (const timer of this.shellTimers) {
      window.clearTimeout(timer);
    }
    this.shellCount.remove();
    this.shellFly.remove();
    this.gauge.remove();
    this.veil.remove();
    this.hint.remove();
  }
}
