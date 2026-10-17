import { describe, expect, it } from 'vitest';
import {
  FILM,
  FILM_IMAGES,
  FILM_ROOM,
  FILMS,
  isFilmId,
  type Film,
  type FilmImage,
  type FilmShot,
} from '../src/config/film';
import { INTRO_SHOTS } from '../src/config/intro';
import {
  createIntroFrame,
  introFrameAt,
  introSchedule,
  keyValue,
} from '../src/core/intro/introTimeline';
import { HOUSE_STORY } from '../src/levels/house/story';

const ART = new Set(
  Object.keys(import.meta.glob('../public/art/**/*')).map((path) => path.replace('../public/', '')),
);
const ALL = Object.entries<Film>(FILMS).map(([id, film]) => [id, film.shots] as const);

/** Maria dans un plan : sa place, ou null. */
const mariaOf = (shot: FilmShot) => shot.sprites.find((s) => s.image === 'maria') ?? null;

describe('les films de la fin (D-190)', () => {
  it('les images existent', () => {
    expect(Object.values(FILM_IMAGES).filter((file) => !ART.has(file))).toEqual([]);
  });

  it('chaque passage tient dans son plan ; le premier plan arrive sur l’image du jeu', () => {
    for (const [id, shots] of ALL) {
      expect(shots[0]?.enter, id).toEqual({ kind: 'cut' });
      for (const shot of shots) {
        const enter = shot.enter;
        const ms =
          enter.kind === 'cut' ? 0 : enter.kind === 'dip' ? enter.ms + enter.holdMs : enter.ms;
        expect(ms, `${id} ${shot.id}`).toBeLessThan(shot.durationMs);
      }
    }
  });

  it('Maria ne bouge jamais : même place, même taille, ni respiration ni fondu sur elle', () => {
    for (const [id, shots] of ALL) {
      const marias = shots.map(mariaOf).filter((m) => m !== null);
      for (const maria of marias) {
        expect(maria, id).toEqual(marias[0]);
        expect(maria.breathe, id).toBeUndefined();
        expect(maria.opacity, id).toBeUndefined();
      }
    }
  });

  it('le contrechamp : le premier soir de l’intro, puis ce matin, Céleste plus grande', () => {
    const [then, now] = FILMS.contrechamp.shots;
    const evening = INTRO_SHOTS.find((s) => s.id === 'evening');
    expect(then?.backdrop).toBe('evening');
    expect(now?.backdrop).toBe('morning');
    expect(now?.enter.kind).toBe('dissolve');
    // Le même cadre que le premier soir de l'intro, la même Maria.
    expect(then?.camera.to).toEqual(evening?.camera.to);
    expect(mariaOf(then as FilmShot)).toMatchObject(
      evening?.sprites.find((s) => s.image === 'maria') ?? {},
    );
    const young = then?.sprites.find((s) => s.image === 'celeste');
    const grown = now?.sprites.find((s) => s.image === 'celesteTee');
    expect(young).toMatchObject({ x: 640, bottom: 952 });
    expect(grown?.x).toBe(young?.x);
    expect(grown?.bottom).toBe(young?.bottom);
    expect(grown?.height ?? 0).toBeGreaterThan(young?.height ?? 0);
    // Puis, en fondu, assise devant Maria, tournée vers elle, au sol comme elle.
    const sitting = now?.sprites.find((s) => s.image === 'celesteTeeSit');
    expect(keyValue(sitting?.opacity, 0, 1)).toBe(0);
    expect(keyValue(sitting?.opacity, now?.durationMs ?? 0, 0)).toBe(1);
    expect(keyValue(grown?.opacity, now?.durationMs ?? 0, 1)).toBe(0);
    expect(sitting?.x ?? 0).toBeLessThan(mariaOf(now as FilmShot)?.x ?? 0);
    expect(Math.abs((sitting?.bottom ?? 0) - (mariaOf(now as FilmShot)?.bottom ?? 0))).toBeLessThan(
      20,
    );
    // Le cœur du premier soir seulement.
    expect(then?.bubble).toBeDefined();
    expect(now?.bubble).toBeUndefined();
  });

  it('le déroulé de l’intro joue aussi les films : le fondu enchaîné au bon moment', () => {
    const shots = FILMS.contrechamp.shots;
    const schedule = introSchedule(shots);
    expect(schedule.totalMs).toBe(shots.reduce((t, s) => t + s.durationMs, 0));
    const frame = createIntroFrame();
    const second = schedule.starts[1] ?? 0;
    introFrameAt(shots, schedule, second + 100, 1, '#000', frame);
    expect(frame.layerCount).toBe(2);
    introFrameAt(shots, schedule, schedule.totalMs - 10, 1, '#000', frame);
    expect(frame.layerCount).toBe(1);
    expect(frame.veilAlpha).toBe(0);
    expect(keyValue(shots[0]?.bubble?.opacity, 0, 0)).toBe(0);
    expect(FILM.fadeInMs).toBeLessThan(shots[0]?.durationMs ?? 0);
  });

  it('chaque film est joué par l’histoire, après la vue rapprochée du tapis pour le contrechamp', () => {
    const used = HOUSE_STORY.triggers.flatMap((t) =>
      t.steps.flatMap((s) => (s.do === 'film' ? [s.id] : [])),
    );
    expect(new Set(used)).toEqual(new Set(Object.keys(FILMS)));
    expect(used.every(isFilmId)).toBe(true);
    const leave = HOUSE_STORY.triggers.find((t) => t.id === 'finale-leave');
    const weeks = leave?.steps.findIndex((s) => s.do === 'film' && s.id === 'weeks') ?? -1;
    const closed = leave?.steps.findIndex((s) => s.do === 'door' && !s.open) ?? -1;
    expect(weeks).toBeGreaterThan(closed);
    expect(closed).toBeGreaterThan(-1);
    const play = HOUSE_STORY.triggers.find((t) => t.id === 'finale-play');
    const steps = play?.steps ?? [];
    const film = steps.findIndex((s) => s.do === 'film');
    const zoom = steps.findIndex((s) => s.do === 'look' && s.zoom !== undefined);
    const putAway = steps.findIndex((s) => s.do === 'await' && s.mode === 'hold');
    expect(film).toBeGreaterThan(zoom);
    expect(film).toBeLessThan(putAway);
  });

  it('aucune image en trop : chaque image sert à un film, chaque fichier du film est utilisé', () => {
    const used = new Set(
      Object.values<Film>(FILMS).flatMap((film) =>
        film.shots.flatMap((s) => [s.backdrop, ...s.sprites.map((sp) => sp.image)]),
      ),
    );
    expect(Object.keys(FILM_IMAGES).filter((key) => !used.has(key as FilmImage))).toEqual([]);
    const files = new Set<string>(Object.values(FILM_IMAGES));
    expect([...ART].filter((f) => f.startsWith('art/film/') && !files.has(f))).toEqual([]);
  });

  it('quelques semaines : des nuits de plus en plus courtes, puis des jours ; Maria à la fin', () => {
    const { shots, outroMs } = FILMS.weeks;
    // Il finit dans le noir : l'écran de fin suit.
    expect(outroMs).toBeGreaterThan(0);
    const nights = shots.filter((s) => s.enter.kind === 'dip');
    const lengths = nights.map((s) => (s.enter.kind === 'dip' ? s.enter.ms + s.enter.holdMs : 0));
    expect(nights.length).toBeGreaterThanOrEqual(3);
    expect([...lengths].sort((a, b) => b - a)).toEqual(lengths);
    // Les nuits d'abord, puis plus aucun noir : les jours passent en fondus.
    const lastNight = shots.findLastIndex((s) => s.enter.kind === 'dip');
    expect(shots.slice(lastNight + 1).every((s) => s.enter.kind === 'dissolve')).toBe(true);
    // La chambre de ce matin-là, toujours : Céleste ne grandit pas au-delà du jeu.
    for (const shot of shots.filter((s) => s.id !== 'maria')) {
      expect(['roomDay', 'roomNight'], shot.id).toContain(shot.backdrop);
    }
    // Maria, puis le dernier signe.
    expect(shots.at(-2)?.id).toBe('maria');
    expect(shots.at(-1)?.id).toBe('last-sign');
  });

  it('le soleil : seulement le jour, sous la fenêtre', () => {
    for (const shot of FILMS.weeks.shots) {
      if (shot.sun) {
        expect(shot.backdrop, shot.id).toBe('roomDay');
      }
    }
    const win = FILM_ROOM.window;
    expect(win.x + win.w).toBeLessThanOrEqual(1920);
    expect(win.y + win.h).toBeLessThan(FILM_ROOM.floorY);
  });

  it('elle rentre de l’école, une fois : la porte ouverte tant qu’elle est là ; son cartable reste', () => {
    const shots = FILMS.weeks.shots;
    const sprite = (shot: FilmShot | undefined, image: FilmImage) =>
      shot?.sprites.find((sp) => sp.image === image);
    const passes = shots.filter((s) => sprite(s, 'celesteSchool'));
    expect(passes).toHaveLength(1);
    const i = shots.indexOf(passes[0] as FilmShot);
    const shot = shots[i] as FilmShot;
    const her = sprite(shot, 'celesteSchool');
    const bag = sprite(shot, 'schoolbag');
    // À la taille de Céleste à 7 ans dans le jeu ; à la porte, tournée vers la chambre.
    expect(her?.height ?? 0).toBeLessThan(130);
    expect(her?.flip).toBe(true);
    expect(her?.x ?? 0).toBeGreaterThan(FILM_ROOM.door.x - 300);
    // Elle apparaît et s'efface dans le plan ; la porte ouverte tant qu'elle est là.
    expect(keyValue(her?.opacity, 0, 1)).toBe(0);
    expect(keyValue(her?.opacity, shot.durationMs, 1)).toBe(0);
    for (let t = 0; t <= shot.durationMs; t += 50) {
      if (keyValue(her?.opacity, t, 1) > 0) {
        expect(keyValue(shot.door, t, 0), String(t)).toBe(1);
      }
      // Le cartable sur son dos tant qu'elle est là tout entière, posé ensuite.
      if (keyValue(her?.opacity, t, 1) === 1) {
        expect(keyValue(bag?.opacity, t, 1), String(t)).toBe(0);
      }
    }
    expect(keyValue(shot.door, 0, 0)).toBe(0);
    expect(keyValue(shot.door, shot.durationMs, 0)).toBe(0);
    expect(keyValue(bag?.opacity, shot.durationMs, 0)).toBe(1);
    // Posé sous le bureau, au sol ; puis là, pas là, là : l'école, des jours qui passent.
    expect(bag?.bottom).toBe(FILM_ROOM.floorY);
    const days = shots.slice(
      i + 1,
      shots.findIndex((s) => s.id === 'maria'),
    );
    const withBag = days.map((s) => sprite(s, 'schoolbag') !== undefined);
    expect(withBag).toEqual([true, false, true]);
    for (const day of days) {
      const there = sprite(day, 'schoolbag');
      if (there) {
        expect({ ...there, opacity: undefined }).toEqual({ ...bag, opacity: undefined });
      }
    }
    // Plus personne ensuite.
    expect(
      shots.slice(i + 1).every((s) => s.sprites.every((sp) => sp.image !== 'celesteSchool')),
    ).toBe(true);
  });

  it('le dernier signe : le silence, la boîte à musique et ses trois notes, les étoiles autour de Maria', () => {
    const shots = FILMS.weeks.shots;
    const last = shots.at(-1) as FilmShot;
    expect(last.id).toBe('last-sign');
    expect(shots.at(-2)?.id).toBe('maria');
    // La nuit, la chambre vide (Maria dans le décor, à sa place : elle ne bouge pas).
    expect(last.backdrop).toBe('roomNight');
    expect(last.sprites).toEqual([]);
    // Le silence, puis trois notes de la berceuse.
    expect(last.music).toBeNull();
    const notes = (last.sfx ?? []).map(([ms, slot]) => [ms, slot] as const);
    expect(notes.map(([, slot]) => slot)).toEqual(['lullaby', 'lullaby', 'lullaby']);
    expect(notes.map(([ms]) => ms)).toEqual([...notes.map(([ms]) => ms)].sort((a, b) => a - b));
    // La boîte s'éclaire en turquoise quand elle joue ; les étoiles, autour de Maria, après elle.
    const glow = last.glow;
    expect(glow?.color).toBe('teal');
    const first = notes[0]?.[0] ?? 0;
    expect(keyValue(glow?.strength, first, 0)).toBeGreaterThan(0.5);
    const stars = last.sparkles;
    expect(stars?.x).toBeGreaterThan(glow?.x ?? 0);
    expect(keyValue(stars?.strength, first, 0)).toBe(0);
    // Puis tout redevient normal, avant la fin du plan.
    expect(keyValue(glow?.strength, last.durationMs, 1)).toBe(0);
    expect(keyValue(stars?.strength, last.durationMs, 1)).toBe(0);
    for (const [ms] of notes) {
      expect(ms).toBeLessThan(last.durationMs);
    }
  });
});
