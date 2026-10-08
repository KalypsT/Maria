import { describe, expect, it } from 'vitest';
import { DEFAULT_PUPPET } from '../src/config/puppet';
import {
  SFX_BUDGET_BYTES,
  SFX_LOOP_MARGIN_S,
  SFX_SLOTS,
  STEP_SLOT,
  TEST_TONES,
  isSfxSlot,
  LANDING_SOUND,
  VOICE_EVERY,
} from '../src/config/sfx';
import { Surface } from '../src/config/surfaces';
import {
  PhaseCue,
  PhaseWatch,
  SfxCue,
  SfxDirector,
  pickVariant,
  sfxFileMap,
  type SfxSubject,
} from '../src/core/audio/sfx';
import { TrainPhase } from '../src/config/combat';
import { JumpKind } from '../src/core/player/PlayerPhysics';
import { FeelEvent } from '../src/core/player/playerFeel';
import { PlayerState } from '../src/core/player/playerState';

const T = 16;

describe('fichiers des bruitages (D-126)', () => {
  it('range les variantes par emplacement, garde le meilleur format, signale les inconnus', () => {
    const { slots, unknown } = sfxFileMap({
      '../assets/sfx/step-wood-2.m4a': 'w2.m4a',
      '../assets/sfx/step-wood-1.mp3': 'w1.mp3',
      '../assets/sfx/step-wood-1.ogg': 'w1.ogg',
      '../assets/sfx/land-big.m4a': 'big.m4a',
      '../assets/sfx/map-open-1.m4a': 'map.m4a',
      '../assets/sfx/step-lava-1.m4a': 'lava.m4a',
      '../assets/sfx/jump.wav': 'jump.wav',
    });
    expect(slots.get('step-wood')).toEqual(['w1.ogg', 'w2.m4a']);
    expect(slots.get('land-big')).toEqual(['big.m4a']);
    expect(slots.get('map-open')).toEqual(['map.m4a']);
    expect(slots.has('jump')).toBe(false);
    expect(unknown.sort()).toEqual(['jump.wav', 'step-lava-1.m4a']);
  });

  it('chaque matière du sol a son pas, chaque emplacement son son de test', () => {
    for (const surface of Object.values(Surface)) {
      expect(isSfxSlot(STEP_SLOT[surface])).toBe(true);
    }
    expect(Object.keys(TEST_TONES).sort()).toEqual([...SFX_SLOTS].sort());
  });

  it('les fichiers déposés ont un nom d’emplacement et tiennent dans le budget', () => {
    // `?inline` : chaque fichier en data URL base64 (4 caractères pour 3 octets).
    const files = import.meta.glob<string>(['../src/assets/sfx/*.*', '!**/*.md'], {
      eager: true,
      query: '?inline',
      import: 'default',
    });
    const names = Object.keys(files);
    expect(sfxFileMap(Object.fromEntries(names.map((path) => [path, path]))).unknown).toEqual([]);
    let total = 0;
    for (const path of names) {
      const data = files[path] ?? '';
      total += ((data.length - data.indexOf(',') - 1) * 3) / 4;
    }
    expect(total).toBeLessThanOrEqual(SFX_BUDGET_BYTES);
  });

  it('les boucles sont préparées avec la marge que le lecteur saute', () => {
    const script = Object.values(
      import.meta.glob<string>('../scripts/prepare-audio.js', {
        eager: true,
        query: '?raw',
        import: 'default',
      }),
    )[0];
    expect(/const LOOP_MARGIN_S = ([\d.]+);/.exec(script ?? '')?.[1]).toBe(`${SFX_LOOP_MARGIN_S}`);
  });
});

describe('choix des variantes', () => {
  it('ne rejoue jamais deux fois de suite la même variante', () => {
    for (let last = 0; last < 4; last++) {
      for (let r = 0; r < 1; r += 0.01) {
        const pick = pickVariant(4, last, r);
        expect(pick).not.toBe(last);
        expect(pick).toBeGreaterThanOrEqual(0);
        expect(pick).toBeLessThan(4);
      }
    }
    expect(pickVariant(1, 0, 0.7)).toBe(0);
    expect(pickVariant(3, -1, 0.99)).toBe(2);
  });

  it('tire toutes les autres variantes', () => {
    const seen = new Set<number>();
    for (let r = 0; r < 1; r += 0.05) {
      seen.add(pickVariant(3, 1, r));
    }
    expect([...seen].sort()).toEqual([0, 2]);
  });
});

/** Céleste vue par les bruitages : un état, le saut du pas, le parapluie. */
function subject(
  state: PlayerState,
  jumpKind: JumpKind = JumpKind.None,
  glideOpen = false,
): SfxSubject {
  return { state, jumpKind, glideOpen };
}

describe('bruitages du mouvement', () => {
  const stride = DEFAULT_PUPPET.strideLengthPx;

  /** Course à vitesse constante pendant `seconds`, la foulée avançant comme dans la marionnette. */
  function runSteps(speed: number, seconds: number): number {
    const director = new SfxDirector();
    let phase = 0;
    let steps = 0;
    for (let i = 0; i < seconds * 120; i++) {
      phase += (speed / 120 / stride) * Math.PI * 2;
      director.step(subject(PlayerState.Run), phase, speed / 136, FeelEvent.None, 0);
      if ((director.cues & SfxCue.Step) !== 0) {
        steps++;
      }
    }
    return steps;
  }

  it('un pas à chaque pied posé : deux par foulée, plus vite en courant plus vite', () => {
    const steps = runSteps(136, 2);
    const strides = (136 * 2) / stride;
    expect(Math.abs(steps - 2 * strides)).toBeLessThanOrEqual(1);
    expect(runSteps(60, 2)).toBeLessThan(steps);
  });

  it('aucun pas en l’air ni à l’arrêt', () => {
    const director = new SfxDirector();
    for (let i = 0; i < 240; i++) {
      const state = i < 120 ? PlayerState.Fall : PlayerState.Idle;
      director.step(subject(state), i * 0.3, 1, FeelEvent.None, 0);
      expect(director.cues).toBe(SfxCue.None);
    }
  });

  it('les sauts, coyote compris, et la réception selon la hauteur de la chute', () => {
    const director = new SfxDirector();
    director.step(subject(PlayerState.Jump, JumpKind.Ground), 0, 0, FeelEvent.None, 0);
    expect(director.cues).toBe(SfxCue.Jump);
    director.step(subject(PlayerState.Jump, JumpKind.Cable), 0, 0, FeelEvent.None, 0);
    expect(director.cues).toBe(SfxCue.Jump);
    const land = (tiles: number) => {
      director.step(subject(PlayerState.Land), 0, 0, FeelEvent.Land, tiles * T);
      return director.cues;
    };
    expect(land(LANDING_SOUND.quietFallTiles / 2)).toBe(SfxCue.Step);
    expect(land(3.5)).toBe(SfxCue.Step | SfxCue.Land);
    expect(land(LANDING_SOUND.bigFallTiles + 1)).toBe(SfxCue.Step | SfxCue.LandBig);
  });

  it('le rebord, le crochet, la glissade : une fois, en y entrant', () => {
    const director = new SfxDirector();
    const cues = (state: PlayerState) => {
      director.step(subject(state), 0, 0, FeelEvent.None, 0);
      return director.cues & ~SfxCue.VoiceEffort;
    };
    expect(cues(PlayerState.Hang)).toBe(SfxCue.LedgeGrab);
    expect(cues(PlayerState.Hang)).toBe(SfxCue.None);
    expect(cues(PlayerState.Climb)).toBe(SfxCue.LedgeClimb);
    expect(cues(PlayerState.Cable)).toBe(SfxCue.HookCatch);
    expect(director.cableSliding).toBe(true);
    expect(cues(PlayerState.Slide)).toBe(SfxCue.Slide);
    expect(director.cableSliding).toBe(false);
    expect(cues(PlayerState.WallSlide)).toBe(SfxCue.None);
    expect(director.wallSliding).toBe(true);
  });

  it('le parapluie s’ouvre et se referme ; le crochet remplace la fermeture', () => {
    const director = new SfxDirector();
    const glide = (state: PlayerState, open: boolean) => {
      director.step(subject(state, JumpKind.None, open), 0, 0, FeelEvent.None, 0);
      return director.cues;
    };
    expect(glide(PlayerState.Glide, true)).toBe(SfxCue.UmbrellaOpen);
    expect(glide(PlayerState.Glide, true)).toBe(SfxCue.None);
    expect(glide(PlayerState.Fall, false)).toBe(SfxCue.UmbrellaClose);
    expect(glide(PlayerState.Glide, true)).toBe(SfxCue.UmbrellaOpen);
    expect(glide(PlayerState.Cable, false)).toBe(SfxCue.HookCatch);
  });

  it('la voix, rarement : un « hop » tous les quelques sauts, un effort une fois sur deux', () => {
    const director = new SfxDirector();
    let hops = 0;
    for (let i = 0; i < VOICE_EVERY.hop * 3; i++) {
      director.step(subject(PlayerState.Jump, JumpKind.Ground), 0, 0, FeelEvent.None, 0);
      hops += (director.cues & SfxCue.VoiceHop) !== 0 ? 1 : 0;
    }
    expect(hops).toBe(3);
    let efforts = 0;
    for (let i = 0; i < VOICE_EVERY.effort * 4; i++) {
      director.step(subject(PlayerState.Jump, JumpKind.Wall), 0, 0, FeelEvent.None, 0);
      expect(director.cues & SfxCue.WallJump).toBe(SfxCue.WallJump);
      efforts += (director.cues & SfxCue.VoiceEffort) !== 0 ? 1 : 0;
    }
    expect(efforts).toBe(4);
  });
});

describe('dangers à cycle', () => {
  it('l’annonce et le passage, une fois chacun ; rien au premier moment observé', () => {
    const watch = new PhaseWatch();
    expect(watch.step(TrainPhase.Warning)).toBe(PhaseCue.None);
    expect(watch.step(TrainPhase.Passing)).toBe(PhaseCue.Pass);
    expect(watch.step(TrainPhase.Passing)).toBe(PhaseCue.None);
    expect(watch.step(TrainPhase.Calm)).toBe(PhaseCue.None);
    expect(watch.step(TrainPhase.Warning)).toBe(PhaseCue.Warn);
    watch.reset();
    expect(watch.step(TrainPhase.Passing)).toBe(PhaseCue.None);
  });
});
