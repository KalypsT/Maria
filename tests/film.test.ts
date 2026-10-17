import { describe, expect, it } from 'vitest';
import { FILM, FILM_IMAGES, FILMS, isFilmId, type FilmShot } from '../src/config/film';
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
const ALL = Object.entries<readonly FilmShot[]>(FILMS);

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
    const [then, now] = FILMS.contrechamp;
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
    const shots = FILMS.contrechamp;
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
    const play = HOUSE_STORY.triggers.find((t) => t.id === 'finale-play');
    const steps = play?.steps ?? [];
    const film = steps.findIndex((s) => s.do === 'film');
    const zoom = steps.findIndex((s) => s.do === 'look' && s.zoom !== undefined);
    const putAway = steps.findIndex((s) => s.do === 'await' && s.mode === 'hold');
    expect(film).toBeGreaterThan(zoom);
    expect(film).toBeLessThan(putAway);
  });
});
