import { describe, expect, it } from 'vitest';
import {
  FILM,
  FILM_IMAGES,
  FILM_ROOM,
  FILM_TOISE,
  FILMS,
  isFilmId,
  toiseHeight,
  type Film,
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
    const years = leave?.steps.findIndex((s) => s.do === 'film' && s.id === 'years') ?? -1;
    const closed = leave?.steps.findIndex((s) => s.do === 'door' && !s.open) ?? -1;
    expect(years).toBeGreaterThan(closed);
    expect(closed).toBeGreaterThan(-1);
    const play = HOUSE_STORY.triggers.find((t) => t.id === 'finale-play');
    const steps = play?.steps ?? [];
    const film = steps.findIndex((s) => s.do === 'film');
    const zoom = steps.findIndex((s) => s.do === 'look' && s.zoom !== undefined);
    const putAway = steps.findIndex((s) => s.do === 'await' && s.mode === 'hold');
    expect(film).toBeGreaterThan(zoom);
    expect(film).toBeLessThan(putAway);
  });

  it('les années : des nuits de plus en plus courtes, puis les âges dans l’ordre, Maria à la fin', () => {
    const { shots, outroMs } = FILMS.years;
    // Il finit dans le noir : l'écran de fin suit.
    expect(outroMs).toBeGreaterThan(0);
    const nights = shots.filter((s) => s.enter.kind === 'dip');
    const lengths = nights.map((s) => (s.enter.kind === 'dip' ? s.enter.ms + s.enter.holdMs : 0));
    expect(nights.length).toBeGreaterThanOrEqual(4);
    expect([...lengths].sort((a, b) => b - a)).toEqual(lengths);
    // Les nuits d'abord, puis plus aucun noir : les années passent en fondus.
    const lastNight = shots.findLastIndex((s) => s.enter.kind === 'dip');
    expect(shots.slice(lastNight + 1).every((s) => s.enter.kind === 'dissolve')).toBe(true);
    // Les âges de la chambre ne reviennent jamais en arrière.
    const ages = shots.flatMap((s) => {
      const m = /^age(\d+)/.exec(s.backdrop);
      return m ? [Number(m[1])] : [];
    });
    expect([...ages].sort((a, b) => a - b)).toEqual(ages);
    expect(ages.at(-1)).toBe(18);
    expect(shots.at(-1)?.id).toBe('maria');
  });

  it('la toise : un trait par an, de 4 à 18 ans, jamais deux fois, de plus en plus haut', () => {
    const toises = FILMS.years.shots.flatMap((s) => (s.toise ? [s.toise] : []));
    let shown = 7;
    for (const toise of toises) {
      // Ce matin, 7 ans (phase 4) ; chaque gros plan reprend où le précédent s'est arrêté.
      expect(toise.shown).toBe(shown);
      expect(toise.write).toBeGreaterThan(toise.shown);
      shown = toise.write;
    }
    expect(shown).toBe(18);
    expect(FILM_TOISE.heights).toHaveLength(18 - FILM_TOISE.firstAge + 1);
    for (let age = 5; age <= 18; age++) {
      expect(toiseHeight(age)).toBeGreaterThan(toiseHeight(age - 1));
    }
    // Elle a fini de grandir : les derniers traits sont plus serrés que les premiers.
    expect(toiseHeight(18) - toiseHeight(17)).toBeLessThan(toiseHeight(5) - toiseHeight(4));
    // Chaque gros plan a le temps d'écrire ses âges.
    for (const shot of FILMS.years.shots) {
      const toise = shot.toise;
      if (toise) {
        const each = FILM_TOISE.lineMs + FILM_TOISE.wordMs;
        expect(toise.fromMs + (toise.write - toise.shown) * each, shot.id).toBeLessThan(
          shot.durationMs,
        );
      }
    }
  });

  it('les saisons et le soleil : seulement dans la chambre, le soleil sous la fenêtre', () => {
    for (const shot of FILMS.years.shots) {
      if (shot.season || shot.sun) {
        expect(shot.toise, shot.id).toBeUndefined();
      }
    }
    const win = FILM_ROOM.window;
    expect(win.x + win.w).toBeLessThanOrEqual(1920);
    expect(win.y + win.h).toBeLessThan(FILM_ROOM.floorY);
  });

  it('Céleste grandit dans les années : une fois par âge, de plus en plus grande', () => {
    const shots = FILMS.years.shots;
    const passes = shots.flatMap((shot) =>
      shot.sprites
        .filter((sp) => sp.image.startsWith('celeste'))
        .map((sp) => ({ shot, sp, age: Number(sp.image.replace('celeste', '')) })),
    );
    expect(passes.map((p) => p.age)).toEqual([9, 12, 15, 18]);
    // Dans la chambre de son âge.
    for (const { shot, age } of passes) {
      const room = /^age(\d+)/.exec(shot.backdrop);
      expect(Number(room?.[1]), shot.id).toBe(age);
    }
    // Debout, de plus en plus grande ; jamais plus grande que papa.
    const standing = passes.filter((p) => p.age !== 12).map((p) => p.sp.height);
    expect([...standing].sort((a, b) => a - b)).toEqual(standing);
    const dad = shots.flatMap((s) => s.sprites).find((sp) => sp.image === 'dad');
    expect(standing.at(-1) ?? 0).toBeLessThan(dad?.height ?? 0);
    // Elle apparaît et disparaît dans le plan (comme un time-lapse), sans jamais rester à la fin.
    for (const { shot, sp } of passes) {
      expect(keyValue(sp.opacity, 0, 1), shot.id).toBe(0);
      expect(keyValue(sp.opacity, shot.durationMs, 1), shot.id).toBe(0);
    }
  });

  it('papa, une nuit : la porte s’ouvre, il regarde la chambre, sans bulle ; elle se referme', () => {
    const night = FILMS.years.shots.filter((s) => s.sprites.some((sp) => sp.image === 'dad'));
    expect(night).toHaveLength(1);
    const shot = night[0] as FilmShot;
    expect(shot.backdrop).toMatch(/Night$/);
    expect(shot.bubble).toBeUndefined();
    const dad = shot.sprites.find((sp) => sp.image === 'dad');
    // Tourné vers la chambre (à gauche), dans la porte.
    expect(dad?.flip).toBe(true);
    expect(dad?.x ?? 0).toBeGreaterThan(FILM_ROOM.door.x - 200);
    // La porte ouverte tant qu'il est là ; fermée au début et à la fin.
    for (let t = 0; t <= shot.durationMs; t += 50) {
      if (keyValue(dad?.opacity, t, 1) > 0) {
        expect(keyValue(shot.door, t, 0), String(t)).toBe(1);
      }
    }
    expect(keyValue(shot.door, 0, 0)).toBe(0);
    expect(keyValue(shot.door, shot.durationMs, 0)).toBe(0);
  });

  it('à 18 ans, elle part : à la porte, tournée vers Maria, puis la porte se ferme ; Maria reste', () => {
    const shots = FILMS.years.shots;
    const i = shots.findIndex((s) => s.sprites.some((sp) => sp.image === 'celeste18'));
    const shot = shots[i] as FilmShot;
    const her = shot.sprites.find((sp) => sp.image === 'celeste18');
    expect(her?.x ?? 0).toBeGreaterThan(FILM_ROOM.door.x - 300);
    for (let t = 0; t <= shot.durationMs; t += 50) {
      if (keyValue(her?.opacity, t, 1) > 0) {
        expect(keyValue(shot.door, t, 0), String(t)).toBe(1);
      }
    }
    expect(keyValue(shot.door, shot.durationMs, 0)).toBe(0);
    // Le dernier plan : Maria, seule.
    expect(shots[i + 1]?.id).toBe('maria');
    expect(shots.slice(i + 1).every((s) => s.sprites.every((sp) => sp.image === 'maria'))).toBe(
      true,
    );
  });
});
