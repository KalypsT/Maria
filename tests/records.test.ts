import { describe, expect, it } from 'vitest';
import { AUDIO_MIX, DEFAULT_AUDIO_SETTINGS, JINGLES, MUSIC_TRACKS } from '../src/config/audio';
import { isMemory } from '../src/config/memories';
import { RECORDS, RECORD_SLOTS, isRecordSlot, recordSlot } from '../src/config/records';
import { AudioMix, equalPower } from '../src/core/audio/AudioMix';
import { audioFileMap } from '../src/core/audio/audioFiles';
import {
  canPlayRecords,
  firstChoice,
  moveChoice,
  recordChoices,
  recordShelf,
} from '../src/core/audio/records';
import { TILE_SIZE as T } from '../src/config/display';
import { PLAYER_HITBOX } from '../src/config/movement';
import { PROP_SIZE } from '../src/config/story';
import { StoryDirector, type StoryHost } from '../src/core/story/StoryDirector';
import { storyProblems } from '../src/core/story/storyProblems';
import { HOUSE_STORY } from '../src/levels/house/story';
import { analysis, level, node, nodeAt, reachable, zone } from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { createNewSave, deserializeSave, serializeSave } from '../src/core/save/saveData';

/** Avance le mixage de `ms` par pas de 10 ms. */
function run(mix: AudioMix, ms: number): void {
  for (let t = 0; t < ms; t += 10) {
    mix.update(10);
  }
}

const FULL = AUDIO_MIX.musicGain * DEFAULT_AUDIO_SETTINGS.volume;

/** Le thème de la maison installé, à plein volume. */
function houseMix(): AudioMix {
  const mix = new AudioMix();
  mix.setTrack('house');
  run(mix, AUDIO_MIX.crossfadeMs);
  return mix;
}

describe('les disques : données (D-121)', () => {
  it('trois disques, des noms de fichier distincts des thèmes et des jingles', () => {
    expect(RECORDS.map((r) => r.id)).toEqual(['early', 'adventures', 'lullaby']);
    expect(RECORD_SLOTS).toEqual(['record-early', 'record-adventures', 'record-lullaby']);
    const others: readonly string[] = [...MUSIC_TRACKS, ...JINGLES];
    expect(RECORD_SLOTS.filter((slot) => others.includes(slot))).toEqual([]);
    expect(new Set(RECORDS.map((r) => r.sleeve)).size).toBe(RECORDS.length);
  });

  it('un disque ne se confond pas avec un souvenir du cahier (pas d’onglet, secret)', () => {
    for (const slot of RECORD_SLOTS) {
      expect(isMemory(slot), slot).toBe(false);
      expect(isRecordSlot(slot)).toBe(true);
    }
    expect(isRecordSlot('photo')).toBe(false);
    expect(isRecordSlot('record-')).toBe(false);
  });

  it('les fichiers des disques sont reconnus', () => {
    const { slots, unknown } = audioFileMap({
      '../assets/audio/record-adventures.m4a': '/a/record-adventures.m4a',
      '../assets/audio/record-autre.m4a': '/a/record-autre.m4a',
    });
    expect(slots.get('record-adventures')).toBe('/a/record-adventures.m4a');
    expect(unknown).toEqual(['record-autre.m4a']);
  });

  it('« Les Aventures de Céleste » a son fichier ; les deux autres attendent leur musique', () => {
    const files = import.meta.glob('../src/assets/audio/record-*.*');
    const { slots } = audioFileMap(Object.fromEntries(Object.keys(files).map((p) => [p, p])));
    expect(slots.has('record-adventures')).toBe(true);
    expect(slots.has('record-early')).toBe(false);
    expect(slots.has('record-lullaby')).toBe(false);
  });
});

describe('les pochettes du tourne-disque (D-121)', () => {
  const onlyAdventures = (slot: string) => slot === 'record-adventures';

  it('un disque sans fichier est caché ; sans disque trouvé, le tourne-disque est vide', () => {
    const shelf = recordShelf([], onlyAdventures);
    expect(shelf.map((s) => s.id)).toEqual(['adventures']);
    expect(shelf[0]?.found).toBe(false);
    expect(canPlayRecords(shelf)).toBe(false);
    expect(recordShelf([], () => false)).toEqual([]);
  });

  it('trouvé d’après les souvenirs de la sauvegarde, dans l’ordre des pochettes', () => {
    const memories = ['photo', recordSlot('adventures')];
    const shelf = recordShelf(memories, () => true);
    expect(shelf.map((s) => [s.id, s.found])).toEqual([
      ['early', false],
      ['adventures', true],
      ['lullaby', false],
    ]);
    expect(canPlayRecords(shelf)).toBe(true);
  });

  it('un disque trouvé survit à la sauvegarde (rangé avec les souvenirs, aucune migration)', () => {
    const data = createNewSave('bedroom', 1_700_000_000_000);
    data.progression.memories.push('photo', recordSlot('adventures'));
    const back = deserializeSave(serializeSave(data));
    expect(back.ok).toBe(true);
    const memories = back.ok ? back.data.progression.memories : [];
    expect(memories).toContain('record-adventures');
    expect(canPlayRecords(recordShelf(memories, onlyAdventures))).toBe(true);
  });
});

describe('le mixage d’un disque (D-121)', () => {
  it('le disque passe avant le thème, qui s’éteint ; le disque arrive vite', () => {
    const mix = houseMix();
    mix.playRecord('record-adventures');
    run(mix, AUDIO_MIX.recordFadeMs);
    expect(mix.musicVolume('record-adventures')).toBeCloseTo(FULL, 5);
    expect(mix.presenceOf('house')).toBeGreaterThan(0);
    run(mix, AUDIO_MIX.crossfadeMs);
    expect(mix.presenceOf('house')).toBe(0);
  });

  it('changer de salle pendant le disque ne le coupe pas (où que soit Céleste)', () => {
    const mix = houseMix();
    mix.playRecord('record-adventures');
    run(mix, AUDIO_MIX.crossfadeMs);
    mix.setTrack('garden');
    run(mix, AUDIO_MIX.crossfadeMs);
    mix.setTrack('strange');
    run(mix, AUDIO_MIX.crossfadeMs);
    expect(mix.musicVolume('record-adventures')).toBeCloseTo(FULL, 5);
    expect(mix.presenceOf('garden')).toBe(0);
    expect(mix.presenceOf('strange')).toBe(0);
  });

  it('à la fin du disque, le thème de la salle revient en fondu', () => {
    const mix = houseMix();
    mix.playRecord('record-adventures');
    run(mix, AUDIO_MIX.crossfadeMs);
    mix.setTrack('garden');
    mix.recordEnded('record-adventures');
    expect(mix.record).toBeNull();
    run(mix, AUDIO_MIX.crossfadeMs / 2);
    expect(mix.musicVolume('garden')).toBeGreaterThan(0);
    expect(mix.musicVolume('garden')).toBeLessThan(FULL);
    run(mix, AUDIO_MIX.crossfadeMs);
    expect(mix.musicVolume('garden')).toBeCloseTo(FULL, 5);
    expect(mix.presenceOf('record-adventures')).toBe(0);
    expect(mix.presenceOf('house')).toBe(0);
  });

  it('arrêter le disque au tourne-disque : il s’éteint vite, le thème revient', () => {
    const mix = houseMix();
    mix.playRecord('record-adventures');
    run(mix, AUDIO_MIX.crossfadeMs);
    mix.stopRecord();
    run(mix, AUDIO_MIX.recordFadeMs);
    expect(mix.presenceOf('record-adventures')).toBe(0);
    run(mix, AUDIO_MIX.crossfadeMs);
    expect(mix.musicVolume('house')).toBeCloseTo(FULL, 5);
  });

  it('un autre disque remplace le premier ; la fin du premier ne coupe pas le second', () => {
    const mix = houseMix();
    mix.playRecord('record-adventures');
    run(mix, AUDIO_MIX.crossfadeMs);
    mix.playRecord('record-early');
    run(mix, AUDIO_MIX.recordFadeMs);
    expect(mix.presenceOf('record-adventures')).toBe(0);
    mix.recordEnded('record-adventures');
    expect(mix.record).toBe('record-early');
    expect(mix.musicVolume('record-early')).toBeCloseTo(FULL, 5);
  });

  it('Maria baisse le disque, qui reprend ensuite ; la pause le baisse aussi', () => {
    const mix = houseMix();
    mix.playRecord('record-adventures');
    run(mix, AUDIO_MIX.crossfadeMs);
    mix.hush(2000, AUDIO_MIX.hushWithJingle);
    run(mix, AUDIO_MIX.hushOutMs);
    expect(mix.musicVolume('record-adventures')).toBeCloseTo(
      FULL * equalPower(AUDIO_MIX.hushWithJingle),
      5,
    );
    expect(mix.record).toBe('record-adventures');
    run(mix, 2000 + AUDIO_MIX.hushInMs + 100);
    expect(mix.musicVolume('record-adventures')).toBeCloseTo(FULL, 5);
    mix.paused = true;
    run(mix, AUDIO_MIX.duckMs);
    expect(mix.musicVolume('record-adventures')).toBeCloseTo(FULL * AUDIO_MIX.pausedDuck, 5);
  });
});

describe('le tourne-disque du grenier (D-121)', () => {
  const shelf = recordShelf([recordSlot('early'), recordSlot('lullaby')], () => true);

  it('les choix : les disques trouvés, puis « arrêter » si un disque joue', () => {
    expect(recordChoices(shelf, null)).toEqual(['early', 'lullaby']);
    expect(recordChoices(shelf, 'lullaby')).toEqual(['early', 'lullaby', 'stop']);
    expect(firstChoice(recordChoices(shelf, 'lullaby'), 'lullaby')).toBe(1);
    expect(firstChoice(recordChoices(shelf, null), null)).toBe(0);
    // Un disque qui joue sans être trouvé (debug) : le premier choix.
    expect(firstChoice(recordChoices(shelf, 'adventures'), 'adventures')).toBe(0);
  });

  it('gauche et droite font le tour des choix', () => {
    expect(moveChoice(0, 1, 3)).toBe(1);
    expect(moveChoice(2, 1, 3)).toBe(0);
    expect(moveChoice(0, -1, 3)).toBe(2);
    expect(moveChoice(0, 1, 0)).toBe(0);
  });

  it('posé sur la malle, rejouable avec Agir, depuis la malle ou le plancher à côté', () => {
    expect(storyProblems(HOUSE_STORY, zone)).toEqual([]);
    const prop = HOUSE_STORY.props.find((p) => p.kind === 'record-player');
    expect(prop).toMatchObject({ room: 'attic', col: 44, row: 17, when: {} });
    expect(PROP_SIZE['record-player'].h).toBeLessThan(T);
    const trigger = HOUSE_STORY.triggers.find((t) => t.id === 'record-player');
    expect(trigger).toMatchObject({ room: 'attic', on: 'interact', repeat: true, when: {} });
    expect(trigger?.steps).toEqual([{ do: 'records' }]);
    const attic = level('attic');
    const at = (col: number, row: number) => attic.tiles[row * attic.width + col];
    // La malle : pleine sur deux tuiles, libre au-dessus.
    expect(at(44, 18)).not.toBe(at(44, 17));
    const calls: string[] = [];
    const host: StoryHost = {
      flagSet: () => undefined,
      place: () => undefined,
      room: () => undefined,
      pose: () => undefined,
      think: () => undefined,
      sparkle: () => undefined,
      shake: () => undefined,
      memory: () => undefined,
      hush: () => undefined,
      ability: () => undefined,
      play: () => undefined,
      records: () => calls.push('records'),
    };
    const standing = (col: number, row: number) => ({
      x: (col + 0.5) * T - PLAYER_HITBOX.width / 2,
      y: (row + 1) * T - PLAYER_HITBOX.height,
      width: PLAYER_HITBOX.width,
      height: PLAYER_HITBOX.height,
    });
    const director = new StoryDirector(HOUSE_STORY, host);
    for (const [col, row] of [
      [44, 17],
      [48, 19],
      [40, 19],
    ] as const) {
      director.step('attic', standing(col, row), true);
      for (let i = 0; i < 10; i++) {
        director.step('attic', standing(col, row), false);
      }
    }
    expect(calls).toEqual(['records', 'records', 'records']);
    director.step('attic', standing(35, 19), true);
    expect(calls).toHaveLength(3);
  });
});

describe('le disque aux objets trouvés de la gare (D-121)', () => {
  const room = 'station-lost';

  it('sur l’étagère à chapeaux du mur de gauche ; Agir le ramasse, il quitte la salle', () => {
    const prop = HOUSE_STORY.props.find((p) => p.kind === 'record-adventures');
    expect(prop).toMatchObject({ room, col: 1, row: 11, instant: true });
    const trigger = HOUSE_STORY.triggers.find((t) => t.id === 'take-record-adventures');
    expect(trigger?.room).toBe(room);
    expect(trigger?.steps).toContainEqual({ do: 'memory', id: recordSlot('adventures') });
    const flag = trigger?.steps.find((s) => s.do === 'flag');
    expect(flag?.do === 'flag' && prop?.when.none?.includes(flag.id)).toBe(true);
    // Le disque a sa musique : sans elle, il ne serait pas dans le monde.
    expect(Object.keys(import.meta.glob('../src/assets/audio/record-adventures.*'))).toHaveLength(
      1,
    );
    const memories: string[] = [];
    const host: StoryHost = {
      flagSet: () => undefined,
      place: () => undefined,
      room: () => undefined,
      pose: () => undefined,
      think: () => undefined,
      sparkle: () => undefined,
      shake: () => undefined,
      memory: (id) => memories.push(id),
      hush: () => undefined,
      ability: () => undefined,
      play: () => undefined,
    };
    const director = new StoryDirector(HOUSE_STORY, host);
    const box = {
      x: 1.5 * T - PLAYER_HITBOX.width / 2,
      y: 12 * T - PLAYER_HITBOX.height,
      width: PLAYER_HITBOX.width,
      height: PLAYER_HITBOX.height,
    };
    director.step(room, box, true);
    expect(memories).toEqual(['record-adventures']);
    expect(canPlayRecords(recordShelf(memories, () => true))).toBe(true);
  });

  it(
    'moyen exactement depuis le sol (on plane depuis le haut de l’armoire), et on en redescend',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const a = analysis(room, true, 2, true, true);
      const floor = nodeAt(room, 20, 27);
      const shelf = nodeAt(room, 1, 11);
      const graph = (min: number) => {
        const g = new Map<string, Set<string>>();
        for (const m of a.moves) {
          if (m.windowMs >= min) {
            const set = g.get(node(room, m.from)) ?? new Set<string>();
            set.add(node(room, m.to));
            g.set(node(room, m.from), set);
          }
        }
        return g;
      };
      expect(reachable(graph(DIFFICULTY_MIN_WINDOW_MS.medium), floor).has(shelf)).toBe(true);
      expect(reachable(graph(DIFFICULTY_MIN_WINDOW_MS.easy), floor).has(shelf), 'trop facile').toBe(
        false,
      );
      expect(reachable(graph(DIFFICULTY_MIN_WINDOW_MS.medium), shelf).has(floor)).toBe(true);
    },
  );
});
