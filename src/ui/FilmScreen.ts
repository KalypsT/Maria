import type { MusicTrack } from '../config/audio';
import { INTRO_VIEW, type IntroCamera } from '../config/intro';
import type { SfxSlot } from '../config/sfx';
import {
  FILM,
  FILM_IMAGES,
  FILM_ROOM,
  FILM_SEASONS,
  FILM_TOISE,
  FILMS,
  toiseHeight,
  toiseY,
  type Film,
  type FilmId,
  type FilmImage,
  type FilmSeason,
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

/**
 * Les images d'un film (ses décors et ses personnages), chargées une fois ; et la police de la
 * main d'un parent, pour les âges de la toise (sans elle, une autre écriture : rien ne bloque).
 */
async function loadFilmImages(film: Film): Promise<Images> {
  const backdrops = new Set<FilmImage>();
  const sprites = new Set<FilmImage>();
  for (const shot of film.shots) {
    backdrops.add(shot.backdrop);
    for (const sprite of shot.sprites) {
      sprites.add(sprite.image);
    }
  }
  if (film.shots.some((shot) => shot.toise)) {
    await document.fonts.load(FILM_TOISE.font).catch(() => undefined);
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

/** La saison à la fenêtre : la teinte du verre, et ce qui passe derrière (neige, pétales, feuilles). */
function drawSeason(c: CanvasRenderingContext2D, season: FilmSeason, t: number): void {
  const look = FILM_SEASONS[season];
  const { x, y, w, h } = FILM_ROOM.window;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.globalAlpha = look.tintAlpha;
  c.fillStyle = look.tint;
  c.fillRect(x, y, w, h);
  c.fillStyle = look.color;
  for (let i = 0; i < look.count; i++) {
    const a = hash(i + 11);
    const b = hash(i + 71);
    const phase = hash(i + 131) * TAU;
    const px = x + a * w + Math.sin(t / (900 + a * 900) + phase) * 18;
    const py = y + ((b * h + (t / 1000) * look.fall * (0.6 + a)) % h);
    c.globalAlpha = 0.75;
    c.beginPath();
    if (season === 'winter') {
      c.arc(px, py, 2.5 + b * 2.5, 0, TAU);
    } else {
      c.ellipse(px, py, 7 + b * 4, 3.5 + b * 2, phase + t / 700, 0, TAU);
    }
    c.fill();
  }
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

/** Un trait de la toise et l'âge écrit à côté ; `k` : 0 → 1, le trait puis le mot. */
function drawToiseMark(c: CanvasRenderingContext2D, age: number, k: number): void {
  if (k <= 0) {
    return;
  }
  const t = FILM_TOISE;
  const lineK = Math.min(1, k * ((t.lineMs + t.wordMs) / t.lineMs));
  const y = toiseY(toiseHeight(age));
  const start = t.x - t.width / 2 - 14;
  // Une main d'enfant qui tient la règle : un trait à peine penché, différent à chaque âge.
  const tilt = (hash(age) - 0.5) * 6;
  c.strokeStyle = t.lineColor;
  c.lineWidth = 7;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(start, y);
  c.lineTo(start + (t.width + 28) * lineK, y + tilt * lineK);
  c.stroke();
  const wordK = (k * (t.lineMs + t.wordMs) - t.lineMs) / t.wordMs;
  if (wordK > 0) {
    // Les traits serrés de la fin : un âge à droite, le suivant à gauche.
    const left = age >= t.alternateFrom && (age - t.alternateFrom) % 2 === 1;
    c.globalAlpha = Math.min(1, wordK);
    c.fillStyle = t.textColor;
    c.font = t.font;
    c.textBaseline = 'middle';
    c.textAlign = left ? 'right' : 'left';
    const x = left ? t.x - t.width / 2 - 30 : t.x + t.width / 2 + 30;
    c.fillText(`${String(age)} ans`, x, y + tilt);
    c.textAlign = 'left';
    c.globalAlpha = 1;
  }
}

/** La toise en gros plan : la planche, ses graduations, ses traits et ses âges. */
function drawToise(c: CanvasRenderingContext2D, toise: NonNullable<FilmShot['toise']>, t: number) {
  const g = FILM_TOISE;
  const top = toiseY(g.topCm);
  const bottom = toiseY(g.bottomCm);
  const left = g.x - g.width / 2;
  c.fillStyle = 'rgba(40, 30, 50, 0.18)';
  c.fillRect(left + 10, top + 12, g.width, bottom - top);
  c.fillStyle = '#e8cc98';
  c.fillRect(left, top, g.width, bottom - top);
  c.fillStyle = '#d9b77c';
  c.fillRect(left, top, 10, bottom - top);
  c.fillStyle = '#8a6238';
  for (let cm = Math.ceil(g.bottomCm); cm <= g.topCm; cm++) {
    const long = cm % 10 === 0 ? 46 : cm % 5 === 0 ? 30 : 16;
    c.fillRect(left + 10, toiseY(cm) - 1.5, long, 3);
  }
  for (let age = g.firstAge; age <= toise.shown; age++) {
    drawToiseMark(c, age, 1);
  }
  const each = g.lineMs + g.wordMs;
  for (let age = toise.shown + 1; age <= toise.write; age++) {
    const start = toise.fromMs + (age - toise.shown - 1) * each;
    drawToiseMark(c, age, Math.min(1, (t - start) / each));
  }
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
      if (backdrop && shot.toise) {
        // La toise : le mur reste fixe, la vue monte avec les traits.
        c.setTransform(cover, 0, 0, cover, (width - INTRO_VIEW.width * cover) / 2, 0);
        c.drawImage(backdrop, 0, 0, INTRO_VIEW.width, INTRO_VIEW.height);
      }
      c.setTransform(s, 0, 0, s, width / 2 - camera.x * s, height / 2 - camera.y * s);
      if (backdrop && !shot.toise) {
        c.drawImage(backdrop, 0, 0, INTRO_VIEW.width, INTRO_VIEW.height);
      }
      if (shot.season) {
        drawSeason(c, shot.season, layer.sceneMs);
      }
      if (shot.sun) {
        drawSun(c, keyValue(shot.sun, t, 0));
      }
      if (shot.toise) {
        drawToise(c, shot.toise, t);
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
