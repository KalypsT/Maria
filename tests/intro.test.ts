import { describe, expect, it } from 'vitest';
import { isMusicTrack } from '../src/config/audio';
import {
  INTRO,
  INTRO_IMAGES,
  INTRO_SHOTS,
  TITLE_ENTRANCE,
  type IntroShot,
} from '../src/config/intro';
import { IntroDirector } from '../src/core/intro/IntroDirector';
import { titleEntranceSchedule } from '../src/core/intro/titleEntrance';
import {
  cameraAt,
  coverScale,
  createIntroFrame,
  cutsMatch,
  introFrameAt,
  introSchedule,
  keyValue,
  shotIndexAt,
} from '../src/core/intro/introTimeline';

const schedule = introSchedule(INTRO_SHOTS);
const ART = new Set(
  Object.keys(import.meta.glob('../public/art/**/*')).map((path) => path.replace('../public/', '')),
);
const MUSIC = new Set(
  Object.keys(import.meta.glob('../src/assets/audio/*.m4a')).map((path) =>
    path.replace('../src/assets/audio/', '').replace('.m4a', ''),
  ),
);

/** Maria (ou rien) dans un plan : sa place, ou null. */
function mariaOf(shot: IntroShot) {
  return shot.sprites.find((sprite) => sprite.image === 'maria') ?? null;
}

describe('le déroulé de l’intro (D-185)', () => {
  it('dure environ 32 s (puis le titre s’écrit sur l’écran titre : ≈ 36 s en tout)', () => {
    expect(schedule.totalMs).toBeGreaterThanOrEqual(30_000);
    expect(schedule.totalMs).toBeLessThanOrEqual(33_000);
  });

  it('chaque passage tient dans son plan, la fin aussi', () => {
    for (const shot of INTRO_SHOTS) {
      const enter = shot.enter;
      const ms =
        enter.kind === 'cut' ? 0 : enter.kind === 'dip' ? enter.ms + enter.holdMs : enter.ms;
      expect(ms, shot.id).toBeLessThan(shot.durationMs);
    }
    expect(INTRO.outroMs).toBeLessThan(INTRO_SHOTS[INTRO_SHOTS.length - 1]?.durationMs ?? 0);
  });

  it('les images et les musiques existent', () => {
    expect(Object.values(INTRO_IMAGES).filter((file) => !ART.has(file))).toEqual([]);
    const cues = INTRO_SHOTS.map((shot) => shot.music).filter((m) => m !== undefined && m !== null);
    expect(cues).toEqual(['ending']);
    for (const cue of cues) {
      expect(isMusicTrack(cue)).toBe(true);
      expect(MUSIC.has(cue)).toBe(true);
    }
  });

  it('une seule musique, de la boîte à la fin : `ending` dès le toucher, jamais changée', () => {
    expect(INTRO_SHOTS[0]?.music).toBe('ending');
    expect(INTRO_SHOTS.slice(1).every((shot) => shot.music === undefined)).toBe(true);
  });

  it('une coupe franche dans le même décor se raccorde (même cadrage)', () => {
    INTRO_SHOTS.forEach((shot, i) => {
      const prev = INTRO_SHOTS[i - 1];
      if (prev && prev.scene === shot.scene && shot.enter.kind === 'cut') {
        expect(cutsMatch(prev, shot), shot.id).toBe(true);
      }
    });
  });
});

describe('Maria ne bouge jamais (pilier 5)', () => {
  it('ni respiration, ni fondu : elle est là ou pas', () => {
    for (const shot of INTRO_SHOTS) {
      for (const sprite of shot.sprites.filter((s) => s.image === 'maria')) {
        expect(sprite.breathe, shot.id).toBeFalsy();
        expect(sprite.opacity, shot.id).toBeUndefined();
      }
    }
  });

  it('d’un plan à l’autre du même décor, elle reste exactement à sa place', () => {
    INTRO_SHOTS.forEach((shot, i) => {
      const prev = INTRO_SHOTS[i - 1];
      const before = prev ? mariaOf(prev) : null;
      const now = mariaOf(shot);
      if (prev && before && now && prev.scene === shot.scene) {
        expect([now.x, now.bottom, now.height]).toEqual([before.x, before.bottom, before.height]);
      }
    });
  });

  it('elle n’apparaît ou ne disparaît que dans le noir complet, jamais par un fondu enchaîné', () => {
    const frame = createIntroFrame();
    let checked = 0;
    INTRO_SHOTS.forEach((shot, i) => {
      const prev = INTRO_SHOTS[i - 1];
      if (!prev) {
        return;
      }
      const before = mariaOf(prev);
      const now = mariaOf(shot);
      const changes =
        (before === null) !== (now === null) || (before && now && prev.scene !== shot.scene);
      if (!changes) {
        return;
      }
      checked++;
      expect(shot.enter.kind, shot.id).toBe('dip');
      // Pendant le passage, un moment tout noir : aucun plan dessiné, voile plein.
      const start = schedule.starts[i] ?? 0;
      const enter = shot.enter;
      const middle = enter.kind === 'dip' ? start + enter.ms / 2 + enter.holdMs / 2 : start;
      introFrameAt(INTRO_SHOTS, schedule, middle, INTRO.outroMs, INTRO.paper, frame);
      expect(frame.layerCount, shot.id).toBe(0);
      expect(frame.veilAlpha, shot.id).toBe(1);
    });
    // Elle arrive (le premier soir) et s'en va (le berceau vide).
    expect(checked).toBe(2);
  });
});

describe('les images de l’intro', () => {
  it('clés : interpolées, bornées', () => {
    const keys = [
      [1000, 0],
      [3000, 1],
    ] as const;
    expect(keyValue(keys, 0)).toBe(0);
    expect(keyValue(keys, 2000)).toBeCloseTo(0.5);
    expect(keyValue(keys, 9000)).toBe(1);
    expect(keyValue(undefined, 500)).toBe(1);
    expect(keyValue([], 500, 0.3)).toBe(0.3);
  });

  it('le cadrage glisse de son début à sa fin', () => {
    const shot = INTRO_SHOTS[0];
    if (!shot) {
      throw new Error('aucun plan');
    }
    const cam = { x: 0, y: 0, zoom: 1 };
    expect(cameraAt(shot, 0, cam)).toEqual(shot.camera.from);
    expect(cameraAt(shot, shot.durationMs, cam)).toEqual(shot.camera.to);
  });

  it('l’écran est toujours couvert (pas de bandes noires)', () => {
    expect(coverScale(1920, 1080, 1920, 1080)).toBe(1);
    // Téléphone en 20:9 : la largeur commande, le haut et le bas sont rognés.
    expect(coverScale(2400, 1080, 1920, 1080)).toBeCloseTo(1.25);
    expect(coverScale(1024, 768, 1920, 1080)).toBeCloseTo(768 / 1080);
  });

  it('un fondu enchaîné montre les deux plans, le second par-dessus', () => {
    const i = INTRO_SHOTS.findIndex((shot) => shot.enter.kind === 'dissolve');
    const start = schedule.starts[i] ?? 0;
    const frame = introFrameAt(
      INTRO_SHOTS,
      schedule,
      start + 100,
      1000,
      '#fff',
      createIntroFrame(),
    );
    expect(frame.layerCount).toBe(2);
    expect(frame.layers[0].shot).toBe(i - 1);
    expect(frame.layers[1].shot).toBe(i);
    expect(frame.layers[1].alpha).toBeGreaterThan(0);
    expect(frame.layers[1].alpha).toBeLessThan(1);
  });

  it('le temps d’un décor continue d’un plan à l’autre (rien ne saute à la coupe)', () => {
    const i = INTRO_SHOTS.findIndex((shot) => shot.id === 'growing');
    const start = schedule.starts[i] ?? 0;
    const before = introFrameAt(INTRO_SHOTS, schedule, start - 1, 1000, '#fff', createIntroFrame());
    const after = introFrameAt(INTRO_SHOTS, schedule, start + 1, 1000, '#fff', createIntroFrame());
    expect(after.layers[0].sceneMs - before.layers[0].sceneMs).toBe(2);
    expect(after.layers[0].localMs).toBe(1);
  });

  it('la fin se fond dans le papier de l’écran titre', () => {
    const frame = createIntroFrame();
    introFrameAt(INTRO_SHOTS, schedule, schedule.totalMs, INTRO.outroMs, INTRO.paper, frame);
    expect(frame.ended).toBe(true);
    expect(frame.veilColor).toBe(INTRO.paper);
    expect(frame.veilAlpha).toBe(1);
    expect(shotIndexAt(schedule, schedule.totalMs + 500)).toBe(INTRO_SHOTS.length - 1);
  });
});

describe('les commandes de l’intro', () => {
  const timing = { totalMs: 10_000, skipButtonMs: 3000, skipFadeMs: 500 };

  it('la boîte attend le premier toucher ; rien ne se passe pendant le chargement', () => {
    const d = new IntroDirector(timing);
    d.press(100);
    expect(d.phase).toBe('loading');
    d.ready();
    expect(d.phase).toBe('waiting');
    expect(d.elapsed(5000)).toBe(0);
    d.press(5000);
    expect(d.phase).toBe('playing');
    expect(d.elapsed(6000)).toBe(1000);
  });

  it('un toucher montre « Passer » quelques secondes ; Passer se fond dans le titre', () => {
    const d = new IntroDirector(timing);
    d.ready();
    d.press(0);
    expect(d.skipVisible(10)).toBe(false);
    d.press(1000);
    expect(d.skipVisible(3999)).toBe(true);
    expect(d.skipVisible(4000)).toBe(false);
    d.press(5000);
    d.skip(5200);
    expect(d.phase).toBe('leaving');
    expect(d.skipVisible(5300)).toBe(false);
    // L'image reste figée dessous pendant le fondu.
    expect(d.elapsed(5400)).toBe(5200);
    expect(d.leaveProgress(5450)).toBeCloseTo(0.5);
    expect(d.update(5650)).toBe('leaving');
    expect(d.update(5700)).toBe('done');
  });

  it('jouée en entier : finie à la fin du déroulé', () => {
    const d = new IntroDirector(timing);
    d.ready();
    d.press(0);
    expect(d.update(9999)).toBe('playing');
    expect(d.update(10_000)).toBe('done');
  });

  it('en arrière-plan, le temps de l’intro s’arrête', () => {
    const d = new IntroDirector(timing);
    d.ready();
    d.press(0);
    d.pause(2000);
    expect(d.elapsed(60_000)).toBe(2000);
    expect(d.update(60_000)).toBe('playing');
    d.resume(60_000);
    expect(d.elapsed(61_000)).toBe(3000);
  });

  it('impossible à charger, ou passée avant d’être prête : on va droit au titre', () => {
    const failed = new IntroDirector(timing);
    failed.abort();
    expect(failed.update(0)).toBe('done');
    const early = new IntroDirector(timing);
    early.skip(0);
    expect(early.phase).toBe('done');
  });
});

describe('l’intro déjà vue (D-186)', () => {
  const timing = { totalMs: 10_000, skipButtonMs: 3000, skipFadeMs: 500 };

  it('« Passer » est montré dès la boîte qui attend, sans toucher', () => {
    const d = new IntroDirector(timing, true);
    expect(d.skipVisible(0)).toBe(false);
    d.ready();
    expect(d.skipVisible(0)).toBe(true);
    d.skip(100);
    expect(d.phase).toBe('leaving');
    expect(d.skipVisible(200)).toBe(false);
    expect(d.update(700)).toBe('done');
    expect(d.completed).toBe(false);
  });

  it('« Passer » reste montré pendant tout le déroulé ; vue jusqu’au bout, elle compte', () => {
    const d = new IntroDirector(timing, true);
    d.ready();
    d.press(0);
    expect(d.skipVisible(9000)).toBe(true);
    expect(d.update(10_000)).toBe('done');
    expect(d.skipVisible(10_000)).toBe(false);
    expect(d.completed).toBe(true);
  });
});

describe('le plan 8 : le titre s’écrit sur l’écran titre', () => {
  const entrance = titleEntranceSchedule(TITLE_ENTRANCE, 5);

  it('les lettres une à une, puis Céleste, puis le menu', () => {
    expect(entrance.letterStarts).toHaveLength(5);
    entrance.letterStarts.forEach((start, i) => {
      expect(start).toBeGreaterThan(entrance.letterStarts[i - 1] ?? -1);
    });
    const last = entrance.letterStarts[4] ?? 0;
    expect(entrance.portraitStart).toBeGreaterThan(last);
    expect(entrance.panelStart).toBeGreaterThan(entrance.portraitStart);
    expect(entrance.totalMs).toBe(entrance.panelStart + TITLE_ENTRANCE.panelMs);
  });

  it('l’intro et le titre font environ 36 s', () => {
    const all = schedule.totalMs + entrance.totalMs;
    expect(all).toBeGreaterThanOrEqual(34_000);
    expect(all).toBeLessThanOrEqual(38_000);
  });

  it('seulement après l’intro vue en entier (ni passée, ni impossible)', () => {
    const timing = { totalMs: 10_000, skipButtonMs: 3000, skipFadeMs: 500 };
    const watched = new IntroDirector(timing);
    watched.ready();
    watched.press(0);
    watched.update(10_000);
    expect(watched.completed).toBe(true);
    const skipped = new IntroDirector(timing);
    skipped.ready();
    skipped.press(0);
    skipped.skip(9_000);
    skipped.update(9_600);
    expect(skipped.phase).toBe('done');
    expect(skipped.completed).toBe(false);
    const failed = new IntroDirector(timing);
    failed.abort();
    expect(failed.completed).toBe(false);
  });
});
