import { ART_IMAGES, SHELL_ART, TREASURE_FLY } from '../config/art';
import { FEAR_LOOK } from '../config/world';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';

/**
 * Une veilleuse de la peur (D-189) : la lampe-tempête du monde réel (D-179), son anse, son chapeau,
 * son verre, sa flamme, son socle ; la fumée qui monte quand elle s'éteint.
 */
const FEAR_LAMP_SVG = `<svg viewBox="0 0 24 34" aria-hidden="true">
<path class="smoke" d="M12 8c-2-2 2-3 0-5s2-3 0-4" fill="none" stroke-width="1.6" stroke-linecap="round"/>
<path d="M8 11a4 4 0 0 1 8 0" fill="none" stroke="#8b6a4f" stroke-width="1.8"/>
<path d="M5 14h14l-3-3H8z" fill="#8b6a4f"/>
<ellipse class="glass" cx="12" cy="21" rx="6" ry="7.5"/>
<path d="M6 15v12M18 15v12" stroke="#8b6a4f" stroke-width="1.6"/>
<ellipse class="flame" cx="12" cy="22" rx="2.4" ry="4.4"/>
<ellipse class="flame-core" cx="12" cy="23.5" rx="1" ry="2"/>
<rect x="4.5" y="28" width="15" height="3.6" rx="1.6" fill="#8b6a4f"/></svg>`;

/** Image de la coquille (D-148), servie avec les autres images fournies. */
const SHELL_SRC = `art/${ART_IMAGES['shell'] ?? 'shell.png'}`;

/**
 * HUD minimal (spec §38, D-21) en DOM : la peur (ses veilleuses et son froid, D-189) et voile de
 * l'évanouissement (uniforme, ou en cercle autour de Céleste, D-35). Le DOM n'est modifié que si une
 * valeur change.
 */
export class Hud {
  private readonly gauge: HTMLElement;
  /** Le froid de la peur (D-189), sur les bords de l'écran. */
  private readonly cold: HTMLElement;
  private readonly coldCanvas: HTMLCanvasElement;
  /** La taille à laquelle le froid est dessiné (« l×h »), pour ne le redessiner qu'au besoin. */
  private coldSize = '';
  private readonly onResize = (): void => {
    if (this.shownFear > 0) {
      this.drawCold();
    }
  };
  private readonly veil: HTMLElement;
  private readonly hint: HTMLElement;
  private hintTimer = 0;
  /** Les coquilles (D-148) : « n/N » du lieu, et la coquille qui y file au ramassage. */
  private readonly shellCount: HTMLElement;
  private readonly shellText: HTMLElement;
  private readonly shellFly: HTMLImageElement;
  private shellTimers: number[] = [];
  /** Les trésors en vol vers le sac (D-169). */
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
    this.cold = document.createElement('div');
    this.cold.id = 'fear-cold';
    this.coldCanvas = document.createElement('canvas');
    this.cold.append(this.coldCanvas);
    window.addEventListener('resize', this.onResize);
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
    parent.append(this.cold, this.gauge, this.veil, this.hint, this.shellCount, this.shellFly);
  }

  /**
   * La peur (D-189, piste C) : une veilleuse par cran, qui s'éteint (un filet de fumée) à chaque
   * cran pris ; la dernière tremble ; cachées tant que Céleste n'a pas peur. Le froid gagne les
   * bords de l'écran, et bat comme un cœur au dernier cran.
   */
  setFear(fear: number, max: number): void {
    if (fear === this.shownFear && max === this.shownMax) {
      return;
    }
    // Une veilleuse par cran : la dernière éteinte, c'est l'évanouissement.
    const lamps = Math.max(1, max);
    // Le dernier cran avant l'évanouissement.
    const last = Math.max(1, max - 1);
    if (max !== this.shownMax) {
      this.gauge.replaceChildren();
      this.dots = Array.from({ length: lamps }, () => {
        const lamp = document.createElement('span');
        lamp.className = 'fear-lamp';
        lamp.innerHTML = FEAR_LAMP_SVG;
        this.gauge.appendChild(lamp);
        return lamp;
      });
    }
    const lit = Math.max(0, lamps - fear);
    this.dots.forEach((lamp, i) => {
      const wasLit = !lamp.classList.contains('out');
      const isLit = i < lit;
      lamp.classList.toggle('out', !isLit);
      lamp.classList.toggle('last', isLit && lit === 1 && fear > 0);
      if (wasLit && !isLit && this.shownMax === max) {
        // Elle vient de s'éteindre : la fumée monte une fois.
        lamp.classList.remove('smoke');
        lamp.getBoundingClientRect(); // relance l'animation
        lamp.classList.add('smoke');
      }
    });
    this.gauge.classList.toggle('visible', fear > 0);
    // Le froid : proportionnel à la peur, au plus fort au dernier cran.
    const cold = fear <= 0 ? 0 : (FEAR_LOOK.coldMax * Math.min(fear, last)) / last;
    if (cold > 0) {
      this.drawCold();
    }
    this.cold.style.opacity = String(cold);
    this.cold.classList.toggle('beat', fear > 0 && fear >= last);
    if (fear > this.shownFear && this.shownFear >= 0) {
      // Un contact : le froid saisit un instant.
      this.cold.classList.remove('hit');
      this.cold.getBoundingClientRect(); // relance l'animation
      this.cold.classList.add('hit');
    }
    this.shownFear = fear;
    this.shownMax = max;
  }

  /**
   * Le froid (D-189), à la taille de l'écran : un voile bleu nuit en ellipse, qui laisse le milieu
   * clair, et des hachures au crayon croisées, plus nombreuses vers les bords. Dessiné seulement
   * quand la taille change.
   */
  private drawCold(): void {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(window.innerWidth * ratio);
    const h = Math.round(window.innerHeight * ratio);
    const size = `${String(w)}x${String(h)}`;
    if (size === this.coldSize) {
      return;
    }
    this.coldSize = size;
    const canvas = this.coldCanvas;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    // Le voile : une ellipse aux proportions de l'écran, claire au milieu.
    ctx.save();
    ctx.translate(w / 2, h * 0.55);
    ctx.scale(w / 2, h / 2);
    const veil = ctx.createRadialGradient(0, 0, 0, 0, 0, 1.15);
    veil.addColorStop(0, 'rgba(26, 34, 72, 0)');
    veil.addColorStop(0.48, 'rgba(26, 34, 72, 0)');
    veil.addColorStop(0.74, 'rgba(26, 34, 72, 0.6)');
    veil.addColorStop(1, 'rgba(16, 20, 46, 0.92)');
    ctx.fillStyle = veil;
    ctx.fillRect(-1.2, -1.3, 2.4, 2.6);
    ctx.restore();
    // Les hachures : des traits courts et croisés, plus serrés et plus nets vers les bords.
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const stroke = FEAR_LOOK.hatchPx * ratio;
    ctx.lineWidth = Math.max(1, ratio * 1.4);
    ctx.lineCap = 'round';
    const count = Math.round((w * h) / (ratio * ratio * FEAR_LOOK.hatchAreaPx));
    for (let i = 0; i < count; i++) {
      const x = random() * w;
      const y = random() * h;
      const dx = (x - w / 2) / (w / 2);
      const dy = (y - h * 0.55) / (h / 2);
      const edge = Math.hypot(dx, dy);
      if (edge < 0.62 || random() > (edge - 0.62) * 2.5) {
        continue;
      }
      const angle = (i % 2 === 0 ? -0.85 : 0.75) + (random() - 0.5) * 0.3;
      const length = stroke * (0.6 + random() * 0.8);
      ctx.strokeStyle = `rgba(150, 170, 220, ${String(Math.min(0.45, (edge - 0.62) * 1.1))})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
  }

  /** Au dernier cran avant l'évanouissement (D-189) : Céleste frissonne. */
  get shivering(): boolean {
    return this.shownFear > 0 && this.shownFear >= Math.max(1, this.shownMax - 1);
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
   * Un trésor trouvé ou une gommette de capacité (D-169) : `content` apparaît en `from` (px CSS de
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
    window.removeEventListener('resize', this.onResize);
    this.gauge.remove();
    this.cold.remove();
    this.veil.remove();
    this.hint.remove();
  }
}
