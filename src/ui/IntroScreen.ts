import type { MusicTrack } from '../config/audio';
import {
  INTRO,
  INTRO_BACKDROPS,
  INTRO_DRAWING,
  INTRO_IMAGES,
  INTRO_LOST,
  INTRO_RIM_PAD,
  INTRO_SHOTS,
  INTRO_TOY_TOWN,
  INTRO_VIEW,
  type IntroCamera,
  type IntroGlowColor,
  type IntroImage,
  type IntroShot,
  type IntroSprite,
} from '../config/intro';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';
import { IntroDirector } from '../core/intro/IntroDirector';
import {
  cameraAt,
  coverScale,
  createIntroFrame,
  introFrameAt,
  introSchedule,
  keyValue,
  shotIndexAt,
  type IntroLayer,
} from '../core/intro/introTimeline';

/** L'intro finie : de quoi la retirer, et si elle a été vue jusqu'au bout. */
export interface IntroResult {
  /** Retire l'intro, une fois l'écran titre posé dessous (le même papier : pas d'éclair). */
  close: () => void;
  /** Vue en entier : l'écran titre joue le plan 8 (le titre qui s'écrit). */
  completed: boolean;
}

/** Ce que l'intro demande au lecteur de musique. */
export interface IntroAudio {
  setMusic(track: MusicTrack | null): void;
  preload(track: MusicTrack): void;
}

type Images = Record<IntroImage, HTMLImageElement>;

const GLOW_RGB: Readonly<Record<IntroGlowColor, string>> = {
  warm: '255, 176, 96',
  teal: '80, 225, 210',
};
const MOTE_FILL: Readonly<Record<IntroGlowColor, string>> = {
  warm: 'rgb(255, 214, 160)',
  teal: 'rgb(150, 245, 230)',
};
/** Images entourées d'un halo : leur hauteur affichée est celle de l'objet, sans la marge. */
const RIMMED: ReadonlySet<IntroImage> = new Set<IntroImage>(['celesteRim', 'toyTown']);
const PAPER_LINE = 'rgb(214, 210, 198)';
const PAPER_MARGIN = 'rgb(226, 160, 160)';
const TAU = Math.PI * 2;
/** Les deux petits ronds sous la bulle (décalage et rayon, px à l'échelle 1). */
const BUBBLE_DOTS = [
  [-40, 78, 14],
  [-62, 108, 8],
] as const;

function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  return img.decode().then(() => img);
}

async function loadImages(): Promise<Images> {
  const entries = await Promise.all(
    (Object.keys(INTRO_IMAGES) as IntroImage[]).map(
      async (key) => [key, await loadImage(INTRO_IMAGES[key])] as const,
    ),
  );
  return Object.fromEntries(entries) as Images;
}

/** Un halo radial, dessiné une fois, posé ensuite à l'échelle voulue. */
function makeGlow(rgb: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, `rgba(${rgb}, 1)`);
    g.addColorStop(0.35, `rgba(${rgb}, 0.45)`);
    g.addColorStop(0.7, `rgba(${rgb}, 0.12)`);
    g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }
  return canvas;
}

/** Pseudo-hasard fixe (0 → 1) : les poussières sont les mêmes à chaque lancement. */
function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * L'intro au lancement (D-185). Un canvas plein écran dessine les plans décrits par
 * `INTRO_SHOTS` ; la boîte à musique attend le premier toucher (qui permet aussi le son), puis
 * l'intro se déroule. Un toucher montre « Passer » (d'emblée si elle a déjà été vue en entier,
 * `seen`, D-186). Elle se termine sur le papier de l'écran titre (la promesse rend de quoi la
 * retirer, une fois l'écran titre posé dessous). Rien ne doit bloquer le jeu : image manquante,
 * erreur ou délai dépassé, elle s'efface aussitôt.
 */
export function playIntro(audio: IntroAudio, seen = false): Promise<IntroResult> {
  return new Promise((resolve) => {
    const shots = INTRO_SHOTS;
    const schedule = introSchedule(shots);
    // Déjà vue en entier sur l'appareil (D-186) : « Passer » d'emblée.
    const director = new IntroDirector(
      {
        totalMs: schedule.totalMs,
        skipButtonMs: INTRO.skipButtonMs,
        skipFadeMs: INTRO.skipFadeMs,
      },
      seen,
    );
    const root = document.createElement('div');
    root.id = 'intro-screen';
    root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const skipButton = document.createElement('button');
    skipButton.type = 'button';
    skipButton.className = 'intro-skip';
    skipButton.textContent = 'Passer ›';
    skipButton.hidden = true;
    root.append(canvas, skipButton);
    document.body.appendChild(root);

    const ctx = canvas.getContext('2d');
    const buffer = document.createElement('canvas');
    const bufferCtx = buffer.getContext('2d');
    const vignette = document.createElement('canvas');
    const glows: Record<IntroGlowColor, HTMLCanvasElement> = {
      warm: makeGlow(GLOW_RGB.warm),
      teal: makeGlow(GLOW_RGB.teal),
    };
    const frame = createIntroFrame();
    const camera: IntroCamera = { x: 0, y: 0, zoom: 1 };
    let images: Images | null = null;
    let width = 0;
    let height = 0;
    let cover = 1;
    let lastCue = -1;
    let raf = 0;
    let finished = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const k = Math.min(1, INTRO.maxRenderWidth / Math.max(1, root.clientWidth * dpr));
      width = Math.max(1, Math.round(root.clientWidth * dpr * k));
      height = Math.max(1, Math.round(root.clientHeight * dpr * k));
      canvas.width = buffer.width = vignette.width = width;
      canvas.height = buffer.height = vignette.height = height;
      cover = coverScale(width, height, INTRO_VIEW.width, INTRO_VIEW.height);
      const v = vignette.getContext('2d');
      if (v) {
        const r = Math.hypot(width, height) / 2;
        const g = v.createRadialGradient(width / 2, height / 2, r * 0.45, width / 2, height / 2, r);
        g.addColorStop(0, 'rgba(0, 0, 0, 0)');
        g.addColorStop(1, `rgba(0, 0, 0, ${INTRO.vignette})`);
        v.fillStyle = g;
        v.fillRect(0, 0, width, height);
      }
    };

    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
      skipButton.hidden = true;
      // Les images et les canvas de travail ne servent plus : la mémoire revient au jeu.
      images = null;
      buffer.width = buffer.height = vignette.width = vignette.height = 0;
      resolve({
        close: () => {
          root.remove();
          canvas.width = canvas.height = 0;
        },
        completed: director.completed,
      });
    };

    // ---------- Dessin ----------

    const drawSprite = (
      c: CanvasRenderingContext2D,
      img: HTMLImageElement,
      s: IntroSprite,
      t: number,
    ) => {
      const pad = RIMMED.has(s.image) ? INTRO_RIM_PAD : 0;
      const scale = s.height / (img.naturalHeight - 2 * pad);
      const breath = s.breathe ? 1 + INTRO.breathAmount * Math.sin((TAU * t) / INTRO.breathMs) : 1;
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale * breath;
      c.drawImage(img, s.x - w / 2, s.bottom + pad * scale - h, w, h);
    };

    const drawShadow = (c: CanvasRenderingContext2D, x: number, y: number, w: number) => {
      c.fillStyle = 'rgb(10, 12, 30)';
      for (let i = 0; i < 3; i++) {
        const k = 1 - i * 0.22;
        c.globalAlpha = 0.14;
        c.beginPath();
        c.ellipse(x, y, (w / 2) * k, w * 0.07 * k, 0, 0, TAU);
        c.fill();
      }
      c.globalAlpha = 1;
    };

    const drawGlow = (
      c: CanvasRenderingContext2D,
      color: IntroGlowColor,
      x: number,
      y: number,
      r: number,
      alpha: number,
    ) => {
      if (alpha <= 0) {
        return;
      }
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.min(1, alpha);
      c.drawImage(glows[color], x - r, y - r, r * 2, r * 2);
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    };

    const drawMotes = (c: CanvasRenderingContext2D, shot: IntroShot, t: number) => {
      const motes = shot.motes;
      if (!motes) {
        return;
      }
      const [x0, y0, x1, y1] = motes.area;
      const w = x1 - x0;
      const h = y1 - y0;
      c.fillStyle = MOTE_FILL[motes.color];
      for (let i = 0; i < motes.count; i++) {
        const a = hash(i + 1);
        const b = hash(i + 101);
        const phase = hash(i + 201) * TAU;
        const sway = Math.sin(t / (2400 + a * 2600) + phase) * 22;
        const x = x0 + a * w + sway;
        const y = motes.rise
          ? y1 - ((b * h + t * (0.018 + a * 0.03)) % h)
          : y0 + b * h + Math.cos(t / (3000 + b * 2000) + phase) * 16;
        c.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(t / 1400 + phase));
        c.beginPath();
        c.arc(x, y, 1.4 + hash(i + 301) * 2.4, 0, TAU);
        c.fill();
      }
      c.globalAlpha = 1;
    };

    const drawPaper = (c: CanvasRenderingContext2D, img: HTMLImageElement) => {
      c.fillStyle = INTRO.paper;
      c.fillRect(-2000, -1500, 6000, 4500);
      c.fillStyle = PAPER_LINE;
      for (let y = -1480; y < 3000; y += 42) {
        c.fillRect(-2000, y, 6000, 2);
      }
      c.fillStyle = PAPER_MARGIN;
      c.fillRect(236, -1500, 3, 4500);
      const d = INTRO_DRAWING;
      const h = (d.width * img.naturalHeight) / img.naturalWidth;
      c.save();
      c.translate(d.x, d.y);
      c.rotate((d.rotateDeg * Math.PI) / 180);
      c.fillStyle = 'rgba(60, 40, 20, 0.22)';
      c.fillRect(-d.width / 2 + 14, -h / 2 + 20, d.width, h);
      c.fillStyle = '#fbf8f2';
      c.fillRect(-d.width / 2 - 18, -h / 2 - 18, d.width + 36, h + 36);
      c.drawImage(img, -d.width / 2, -h / 2, d.width, h);
      // Le ruban adhésif, en haut.
      c.rotate(-0.12);
      c.fillStyle = 'rgba(238, 226, 190, 0.75)';
      c.fillRect(-120, -h / 2 - 50, 200, 56);
      c.restore();
    };

    const drawLost = (c: CanvasRenderingContext2D, imgs: Images, t: number) => {
      for (let i = 0; i < INTRO_LOST.length; i++) {
        const thing = INTRO_LOST[i];
        if (!thing) {
          continue;
        }
        const img = imgs[thing.image];
        const p = (TAU * t) / thing.periodMs + i * 1.7;
        const x = thing.x + thing.driftX * Math.sin(p);
        const y = thing.y + thing.driftY * Math.cos(p * 0.77);
        c.save();
        c.translate(x, y);
        c.rotate(((thing.swayDeg * Math.PI) / 180) * Math.sin(p * 1.3));
        c.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        c.restore();
      }
      const town = INTRO_TOY_TOWN;
      const img = imgs.toyTown;
      const left = town.x - img.naturalWidth / 2;
      const top = town.bottom + INTRO_RIM_PAD - img.naturalHeight;
      c.drawImage(img, left, top);
      const open = keyValue(town.eyesOpen, t, 0);
      if (open > 0) {
        for (const [ex, ey] of town.eyes) {
          const x = left + INTRO_RIM_PAD + ex;
          const y = top + INTRO_RIM_PAD + ey;
          drawGlow(c, 'teal', x, y, 34, open * 0.9);
          c.globalAlpha = open;
          c.fillStyle = 'rgb(190, 255, 245)';
          c.beginPath();
          c.arc(x, y, town.eyeRadius, 0, TAU);
          c.fill();
          c.globalAlpha = 1;
        }
      }
    };

    const drawBubble = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      s: number,
      alpha: number,
    ) => {
      if (alpha <= 0) {
        return;
      }
      c.globalAlpha = alpha;
      c.fillStyle = 'rgba(246, 238, 222, 0.94)';
      c.strokeStyle = 'rgb(120, 104, 92)';
      c.lineWidth = 4;
      c.beginPath();
      c.ellipse(x, y, 62 * s, 53 * s, 0, 0, TAU);
      c.fill();
      c.stroke();
      for (const [dx, dy, r] of BUBBLE_DOTS) {
        c.beginPath();
        c.arc(x + dx * s, y + dy * s, r * s, 0, TAU);
        c.fill();
        c.stroke();
      }
      const k = 30 * s;
      c.fillStyle = 'rgb(222, 112, 140)';
      c.beginPath();
      c.moveTo(x, y + k * 0.75);
      c.bezierCurveTo(x - k * 1.3, y - k * 0.1, x - k * 0.6, y - k * 1.05, x, y - k * 0.45);
      c.bezierCurveTo(x + k * 0.6, y - k * 1.05, x + k * 1.3, y - k * 0.1, x, y + k * 0.75);
      c.fill();
      c.globalAlpha = 1;
    };

    /** L'étincelle de la boîte qui attend : « on peut toucher ici ». */
    const drawSparkle = (c: CanvasRenderingContext2D, now: number) => {
      const pulse = 0.5 + 0.5 * Math.sin((TAU * now) / INTRO.sparkleMs);
      const x = 1090;
      const y = 380;
      drawGlow(c, 'warm', x, y, 90 + 40 * pulse, 0.35 + 0.4 * pulse);
      const r = 22 + 12 * pulse;
      c.fillStyle = 'rgb(255, 236, 200)';
      c.globalAlpha = 0.6 + 0.4 * pulse;
      c.beginPath();
      c.moveTo(x, y - r);
      c.quadraticCurveTo(x, y, x + r, y);
      c.quadraticCurveTo(x, y, x, y + r);
      c.quadraticCurveTo(x, y, x - r, y);
      c.quadraticCurveTo(x, y, x, y - r);
      c.fill();
      c.globalAlpha = 1;
    };

    const drawLayer = (
      c: CanvasRenderingContext2D,
      imgs: Images,
      layer: IntroLayer,
      now: number,
    ) => {
      const shot = shots[layer.shot];
      if (!shot) {
        return;
      }
      const t = layer.localMs;
      cameraAt(shot, t, camera);
      const s = cover * camera.zoom;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = shot.scene === 'drawing' ? INTRO.paper : '#000';
      c.fillRect(0, 0, width, height);
      c.setTransform(s, 0, 0, s, width / 2 - camera.x * s, height / 2 - camera.y * s);
      const backdrop = INTRO_BACKDROPS[shot.scene];
      if (backdrop) {
        c.drawImage(imgs[backdrop.image], backdrop.x, backdrop.y, backdrop.width, backdrop.height);
      }
      if (shot.scene === 'drawing') {
        drawPaper(c, imgs.drawing);
      }
      if (shot.scene === 'strange') {
        drawLost(c, imgs, layer.sceneMs);
      }
      if (shot.glow) {
        const g = shot.glow;
        drawGlow(c, g.color, g.x, g.y, g.radius, keyValue(g.strength, t, 0));
      }
      for (const sprite of shot.sprites) {
        const alpha = keyValue(sprite.opacity, t, 1);
        if (alpha <= 0) {
          continue;
        }
        if (sprite.shadow) {
          c.globalAlpha = alpha;
          drawShadow(c, sprite.x, sprite.bottom - 4, sprite.shadow);
        }
        c.globalAlpha = alpha;
        drawSprite(c, imgs[sprite.image], sprite, layer.sceneMs);
        c.globalAlpha = 1;
      }
      if (shot.bubble) {
        const b = shot.bubble;
        drawBubble(c, b.x, b.y, b.scale, keyValue(b.opacity, t, 0));
      }
      drawMotes(c, shot, layer.sceneMs);
      if (shot.darkness) {
        const d = keyValue(shot.darkness, t, 0);
        if (d > 0) {
          c.setTransform(1, 0, 0, 1, 0, 0);
          c.fillStyle = `rgba(0, 0, 0, ${d})`;
          c.fillRect(0, 0, width, height);
          c.setTransform(s, 0, 0, s, width / 2 - camera.x * s, height / 2 - camera.y * s);
        }
      }
      if (director.phase === 'waiting' && layer.shot === 0) {
        drawSparkle(c, now);
      }
      c.setTransform(1, 0, 0, 1, 0, 0);
    };

    const draw = (imgs: Images, now: number) => {
      if (!ctx) {
        return;
      }
      const elapsed = director.elapsed(now);
      introFrameAt(shots, schedule, elapsed, INTRO.outroMs, INTRO.paper, frame);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < frame.layerCount; i++) {
        const layer = frame.layers[i];
        if (!layer) {
          continue;
        }
        if (layer.alpha >= 1 || !bufferCtx) {
          drawLayer(ctx, imgs, layer, now);
        } else {
          // Fondu enchaîné : le plan entier, puis posé en transparence (sinon le décor transparaît
          // à travers les personnages).
          drawLayer(bufferCtx, imgs, layer, now);
          ctx.globalAlpha = layer.alpha;
          ctx.drawImage(buffer, 0, 0);
          ctx.globalAlpha = 1;
        }
      }
      ctx.drawImage(vignette, 0, 0);
      if (frame.veilAlpha > 0) {
        ctx.globalAlpha = Math.min(1, frame.veilAlpha);
        ctx.fillStyle = frame.veilColor;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
      }
      const leave = director.leaveProgress(now);
      if (leave > 0) {
        ctx.globalAlpha = leave;
        ctx.fillStyle = INTRO.paper;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
      }
    };

    /** La musique demandée par les plans atteints (la dernière l'emporte). */
    const cueMusic = (now: number) => {
      if (director.phase !== 'playing') {
        return;
      }
      const index = shotIndexAt(schedule, director.elapsed(now));
      if (index === lastCue) {
        return;
      }
      for (let i = lastCue + 1; i <= index; i++) {
        const music = shots[i]?.music;
        if (music !== undefined) {
          audio.setMusic(music);
        }
      }
      lastCue = index;
    };

    const tick = (now: number) => {
      try {
        const phase = director.update(now);
        if (phase === 'done') {
          finish();
          return;
        }
        cueMusic(now);
        skipButton.hidden = !director.skipVisible(now);
        if (images) {
          draw(images, now);
        }
        raf = requestAnimationFrame(tick);
      } catch {
        finish();
      }
    };

    // ---------- Commandes ----------

    root.addEventListener('pointerdown', (event) => {
      if (event.target === skipButton) {
        return;
      }
      director.press(performance.now());
    });
    skipButton.addEventListener('click', () => {
      director.skip(performance.now());
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        director.skip(performance.now());
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        director.press(performance.now());
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        director.pause(performance.now());
      } else {
        director.resume(performance.now());
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    audio.preload('ending');
    const timeout = new Promise<null>((done) => {
      window.setTimeout(() => {
        done(null);
      }, INTRO.loadTimeoutMs);
    });
    void Promise.race([loadImages(), timeout])
      .then((loaded) => {
        if (!loaded) {
          director.abort();
          return;
        }
        images = loaded;
        director.ready();
      })
      .catch(() => {
        director.abort();
      });
    raf = requestAnimationFrame(tick);
  });
}
