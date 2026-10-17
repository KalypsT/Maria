import { INTRO_VIEW, type IntroCamera } from '../config/intro';
import { FILM, FILM_IMAGES, FILMS, type FilmId, type FilmImage } from '../config/film';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';
import {
  cameraAt,
  coverScale,
  createIntroFrame,
  introFrameAt,
  introSchedule,
  keyValue,
  type IntroLayer,
} from '../core/intro/introTimeline';
import {
  createGlows,
  drawGlow,
  drawHeartBubble,
  drawMotes,
  drawShadow,
  drawSprite,
  loadImage,
  paintVignette,
} from './filmDraw';

type Images = ReadonlyMap<FilmImage, HTMLImageElement>;

/** Les images d'un film (ses décors et ses personnages), chargées une fois. */
async function loadFilmImages(id: FilmId): Promise<Images> {
  const keys = new Set<FilmImage>();
  for (const shot of FILMS[id]) {
    keys.add(shot.backdrop);
    for (const sprite of shot.sprites) {
      keys.add(sprite.image);
    }
  }
  const entries = await Promise.all(
    [...keys].map(async (key) => [key, await loadImage(FILM_IMAGES[key])] as const),
  );
  return new Map(entries);
}

/**
 * Un film de la fin (D-190), joué par le moteur de l'intro (D-185) : un canvas plein écran qui
 * apparaît par-dessus l'image du jeu (fondu enchaîné), déroule ses plans, puis s'y fond. Pas de
 * « Passer » : il n'est vu qu'une fois par partie. Le temps s'arrête quand l'onglet passe en
 * arrière-plan. Images manquantes, trop lentes ou erreur : la promesse se résout aussitôt (le jeu
 * ne doit jamais attendre).
 */
export function playFilm(id: FilmId): Promise<void> {
  return new Promise((resolve) => {
    const shots = FILMS[id];
    const schedule = introSchedule(shots);
    const root = document.createElement('div');
    root.className = 'film-screen';
    root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    root.style.setProperty('--film-fade-in', `${String(FILM.fadeInMs)}ms`);
    root.style.setProperty('--film-fade-out', `${String(FILM.fadeOutMs)}ms`);
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    root.appendChild(canvas);
    document.body.appendChild(root);

    const ctx = canvas.getContext('2d');
    const buffer = document.createElement('canvas');
    const bufferCtx = buffer.getContext('2d');
    const vignette = document.createElement('canvas');
    const glows = createGlows();
    const frame = createIntroFrame();
    const camera: IntroCamera = { x: 0, y: 0, zoom: 1 };
    let images: Images | null = null;
    let width = 0;
    let height = 0;
    let cover = 1;
    let raf = 0;
    /** Début du film (ms), une fois les images prêtes ; -1 avant. */
    let startAt = -1;
    let pausedAt = -1;
    let pausedMs = 0;
    let leaving = false;
    let finished = false;

    const elapsed = (now: number): number => {
      if (startAt < 0) {
        return 0;
      }
      const until = pausedAt >= 0 ? pausedAt : now;
      return Math.min(schedule.totalMs, Math.max(0, until - startAt - pausedMs));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const k = Math.min(1, FILM.maxRenderWidth / Math.max(1, root.clientWidth * dpr));
      width = Math.max(1, Math.round(root.clientWidth * dpr * k));
      height = Math.max(1, Math.round(root.clientHeight * dpr * k));
      canvas.width = buffer.width = vignette.width = width;
      canvas.height = buffer.height = vignette.height = height;
      cover = coverScale(width, height, INTRO_VIEW.width, INTRO_VIEW.height);
      paintVignette(vignette, FILM.vignette);
    };

    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      images = null;
      root.remove();
      canvas.width = canvas.height = buffer.width = buffer.height = 0;
      vignette.width = vignette.height = 0;
      resolve();
    };

    const drawLayer = (c: CanvasRenderingContext2D, imgs: Images, layer: IntroLayer) => {
      const shot = shots[layer.shot];
      if (!shot) {
        return;
      }
      const t = layer.localMs;
      cameraAt(shot, t, camera);
      const s = cover * camera.zoom;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = '#000';
      c.fillRect(0, 0, width, height);
      c.setTransform(s, 0, 0, s, width / 2 - camera.x * s, height / 2 - camera.y * s);
      const backdrop = imgs.get(shot.backdrop);
      if (backdrop) {
        c.drawImage(backdrop, 0, 0, INTRO_VIEW.width, INTRO_VIEW.height);
      }
      if (shot.glow) {
        const g = shot.glow;
        drawGlow(c, glows, g.color, g.x, g.y, g.radius, keyValue(g.strength, t, 0));
      }
      for (const sprite of shot.sprites) {
        const img = imgs.get(sprite.image);
        const alpha = keyValue(sprite.opacity, t, 1);
        if (!img || alpha <= 0) {
          continue;
        }
        if (sprite.shadow) {
          c.globalAlpha = alpha;
          drawShadow(c, sprite.x, sprite.bottom - 4, sprite.shadow);
        }
        c.globalAlpha = alpha;
        drawSprite(c, img, sprite, layer.sceneMs, 0, FILM.breathMs, FILM.breathAmount);
        c.globalAlpha = 1;
      }
      if (shot.bubble) {
        const b = shot.bubble;
        drawHeartBubble(c, b.x, b.y, b.scale, keyValue(b.opacity, t, 0));
      }
      drawMotes(c, shot.motes, layer.sceneMs);
      c.setTransform(1, 0, 0, 1, 0, 0);
    };

    const draw = (imgs: Images, now: number) => {
      if (!ctx) {
        return;
      }
      introFrameAt(shots, schedule, elapsed(now), 1, '#000', frame);
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
          drawLayer(ctx, imgs, layer);
        } else {
          // Fondu enchaîné : le plan entier, puis posé en transparence.
          drawLayer(bufferCtx, imgs, layer);
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
    };

    const tick = (now: number) => {
      try {
        if (images) {
          if (startAt < 0) {
            // Les images sont prêtes : le film apparaît par-dessus le jeu.
            startAt = now;
            root.classList.add('film-shown');
          }
          if (!leaving && elapsed(now) >= schedule.totalMs) {
            // Fini : il se fond dans l'image du jeu, puis s'en va.
            leaving = true;
            root.classList.remove('film-shown');
            window.setTimeout(finish, FILM.fadeOutMs);
          }
          draw(images, now);
        }
        raf = requestAnimationFrame(tick);
      } catch {
        finish();
      }
    };

    const onVisibility = () => {
      const now = performance.now();
      if (document.hidden) {
        if (pausedAt < 0) {
          pausedAt = now;
        }
      } else if (pausedAt >= 0) {
        pausedMs += now - pausedAt;
        pausedAt = -1;
      }
    };
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    const timeout = new Promise<null>((done) => {
      window.setTimeout(() => {
        done(null);
      }, FILM.loadTimeoutMs);
    });
    void Promise.race([loadFilmImages(id), timeout])
      .then((loaded) => {
        if (!loaded) {
          finish();
          return;
        }
        images = loaded;
      })
      .catch(() => {
        finish();
      });
    raf = requestAnimationFrame(tick);
  });
}
