import type { MusicTrack } from '../config/audio';
import { INTRO_VIEW, type IntroCamera } from '../config/intro';
import type { SfxSlot } from '../config/sfx';
import {
  FILM,
  FILM_IMAGES,
  FILM_ROOM,
  FILMS,
  type Film,
  type FilmId,
  type FilmImage,
  type FilmShot,
} from '../config/film';
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
  TAU,
  createGlows,
  drawGlow,
  drawHeartBubble,
  drawMotes,
  drawShadow,
  drawSprite,
  hash,
  loadImage,
  paintVignette,
} from './filmDraw';

type Images = ReadonlyMap<FilmImage, HTMLImageElement>;

/** Les images d'un film (ses décors et ses personnages), chargées une fois. */
async function loadFilmImages(film: Film): Promise<Images> {
  const backdrops = new Set<FilmImage>();
  const sprites = new Set<FilmImage>();
  for (const shot of film.shots) {
    backdrops.add(shot.backdrop);
    for (const sprite of shot.sprites) {
      sprites.add(sprite.image);
    }
  }
  const load = async (key: FilmImage) => [key, await loadImage(FILM_IMAGES[key])] as const;
  // Sans ses décors, pas de film ; un personnage qui manque n'est simplement pas dessiné.
  const [scenes, people] = await Promise.all([
    Promise.all([...backdrops].map(load)),
    Promise.allSettled([...sprites].filter((key) => !backdrops.has(key)).map(load)),
  ]);
  const found = people.flatMap((p) => (p.status === 'fulfilled' ? [p.value] : []));
  return new Map([...scenes, ...found]);
}

/** La lumière du couloir dans la porte de la chambre, ouverte de 0 à 1, ajoutée à l'image. */
function drawDoor(c: CanvasRenderingContext2D, open: number): void {
  if (open <= 0) {
    return;
  }
  const { x, y, w, h, spill } = FILM_ROOM.door;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = 'rgb(255, 192, 112)';
  // L'ouverture s'élargit avec la porte, depuis le dehors.
  c.globalAlpha = 0.85;
  c.fillRect(x + w * (1 - open), y, w * open, h);
  c.globalAlpha = 0.45 * open;
  c.beginPath();
  c.moveTo(x, y + h);
  c.lineTo(x - spill * open, y + h);
  c.lineTo(x - spill * open * 0.6, y + h - 30);
  c.lineTo(x, y + h - 30);
  c.closePath();
  c.fill();
  c.restore();
}

/** Le carré de soleil : de la fenêtre au sol, vers la gauche, ajouté à l'image. */
function drawSun(c: CanvasRenderingContext2D, left: number): void {
  const { window: win, floorY, sun } = FILM_ROOM;
  const top = win.y + win.h;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = sun.alpha;
  c.fillStyle = 'rgb(255, 214, 150)';
  c.beginPath();
  c.moveTo(left, top);
  c.lineTo(left + sun.width, top);
  c.lineTo(left + sun.width - sun.slant, floorY);
  c.lineTo(left - sun.slant, floorY);
  c.closePath();
  c.fill();
  c.restore();
}

/** Ce que le film demande au son du jeu (D-190) : la musique d'un plan, ses bruitages. */
export interface FilmAudio {
  setMusic(track: MusicTrack | null): void;
  sfx(slot: SfxSlot): void;
}

/**
 * Les étoiles du monde étrange, un instant (le dernier signe, D-190) : des étoiles turquoise qui
 * scintillent autour d'un point, chacune à son rythme, et un halo léger.
 */
function drawSparkles(
  c: CanvasRenderingContext2D,
  glows: ReturnType<typeof createGlows>,
  sparkles: NonNullable<FilmShot['sparkles']>,
  strength: number,
  t: number,
): void {
  if (strength <= 0) {
    return;
  }
  drawGlow(c, glows, 'teal', sparkles.x, sparkles.y, sparkles.radius * 1.3, strength * 0.35);
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = 'rgb(150, 245, 230)';
  for (let i = 0; i < sparkles.count; i++) {
    const angle = (i / sparkles.count) * TAU + hash(i + 7) * 0.6;
    const r = sparkles.radius * (0.55 + hash(i + 17) * 0.45);
    const x = sparkles.x + Math.cos(angle) * r;
    const y = sparkles.y + Math.sin(angle) * r * 0.75;
    const twinkle = 0.5 + 0.5 * Math.sin(t / (380 + hash(i + 27) * 420) + i);
    const size = (7 + hash(i + 37) * 8) * (0.6 + 0.4 * twinkle);
    c.globalAlpha = strength * (0.45 + 0.55 * twinkle);
    c.beginPath();
    c.moveTo(x, y - size);
    c.quadraticCurveTo(x, y, x + size, y);
    c.quadraticCurveTo(x, y, x, y + size);
    c.quadraticCurveTo(x, y, x - size, y);
    c.quadraticCurveTo(x, y, x, y - size);
    c.fill();
  }
  c.restore();
}

/**
 * Un film de la fin (D-190), joué par le moteur de l'intro (D-185) : un canvas plein écran qui
 * apparaît par-dessus l'image du jeu (fondu enchaîné), déroule ses plans, puis s'y fond. Pas de
 * « Passer » : il n'est vu qu'une fois par partie. Le temps s'arrête quand l'onglet passe en
 * arrière-plan. Images manquantes, trop lentes ou erreur : la promesse se résout aussitôt (le jeu
 * ne doit jamais attendre).
 */
export function playFilm(id: FilmId, audio?: FilmAudio): Promise<void> {
  return new Promise((resolve) => {
    const film: Film = FILMS[id];
    const shots = film.shots;
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

    /** Fini : la promesse se résout ; le film reste encore `keepMs` à l'écran (dans le noir). */
    const finish = (keepMs = 0) => {
      if (finished) {
        return;
      }
      finished = true;
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      resolve();
      window.setTimeout(() => {
        cancelAnimationFrame(raf);
        images = null;
        root.remove();
        canvas.width = canvas.height = buffer.width = buffer.height = 0;
        vignette.width = vignette.height = 0;
      }, keepMs);
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
      const backdrop = imgs.get(shot.backdrop);
      c.setTransform(s, 0, 0, s, width / 2 - camera.x * s, height / 2 - camera.y * s);
      if (backdrop) {
        c.drawImage(backdrop, 0, 0, INTRO_VIEW.width, INTRO_VIEW.height);
      }
      if (shot.sun) {
        drawSun(c, keyValue(shot.sun, t, 0));
      }
      if (shot.door) {
        drawDoor(c, keyValue(shot.door, t, 0));
      }
      if (shot.sparkles) {
        drawSparkles(c, glows, shot.sparkles, keyValue(shot.sparkles.strength, t, 0), t);
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
        if (sprite.flip) {
          c.save();
          c.translate(sprite.x * 2, 0);
          c.scale(-1, 1);
        }
        drawSprite(c, img, sprite, layer.sceneMs, 0, FILM.breathMs, FILM.breathAmount);
        if (sprite.flip) {
          c.restore();
        }
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
      introFrameAt(shots, schedule, elapsed(now), film.outroMs ?? 1, '#000', frame);
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

    /** La musique et les bruitages des plans, une fois chacun, quand le film les atteint. */
    let cuedUntil = -1;
    const cue = (now: number) => {
      const at = elapsed(now);
      if (!audio || at <= cuedUntil) {
        return;
      }
      shots.forEach((shot, i) => {
        const start = schedule.starts[i] ?? 0;
        if (shot.music !== undefined && start > cuedUntil && start <= at) {
          audio.setMusic(shot.music);
        }
        for (const [ms, slot] of shot.sfx ?? []) {
          if (start + ms > cuedUntil && start + ms <= at) {
            audio.sfx(slot);
          }
        }
      });
      cuedUntil = at;
    };

    const tick = (now: number) => {
      try {
        if (images) {
          cue(now);
          if (startAt < 0) {
            // Les images sont prêtes : le film apparaît par-dessus le jeu.
            startAt = now;
            root.classList.add('film-shown');
          }
          if (!leaving && elapsed(now) >= schedule.totalMs) {
            leaving = true;
            if (film.outroMs === undefined) {
              // Fini : il se fond dans l'image du jeu, puis s'en va.
              root.classList.remove('film-shown');
              window.setTimeout(finish, FILM.fadeOutMs);
            } else {
              // Fini dans le noir : le jeu passe au noir dessous, puis le film s'en va.
              finish(FILM.blackHoldMs);
            }
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
    void Promise.race([loadFilmImages(film), timeout])
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
