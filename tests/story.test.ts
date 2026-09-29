import { describe, expect, it } from 'vitest';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { DEFAULT_MOVEMENT, PLAYER_HITBOX } from '../src/config/movement';
import { TILE_SIZE as T } from '../src/config/display';
import { PROP_SIZE, StoryFlag as F } from '../src/config/story';
import { analyzeLevel } from '../src/core/analysis/analyzeLevel';
import { surfaceUnder } from '../src/core/analysis/surfaces';
import type { Box } from '../src/core/physics/gridCollision';
import { PropStage, canChangeProp, propBox } from '../src/core/story/PropStage';
import { StoryDirector, type StoryHost } from '../src/core/story/StoryDirector';
import { checkCondition, type StoryData, type StoryStep } from '../src/core/story/story';
import { storyProblems } from '../src/core/story/storyProblems';
import { buildZone } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { HOUSE } from '../src/levels/house/zone';

const HZ = 100;

/** Hôte qui enregistre ce que demandent les scripts. */
function recorder() {
  const log: string[] = [];
  const host: StoryHost = {
    flagSet: (id) => log.push(`flag ${id}`),
    place: (col, row, facing) => log.push(`place ${String(col)},${String(row)},${String(facing)}`),
    room: (room, col, row, facing, returnPoint) =>
      log.push(
        `room ${room} ${String(col)},${String(row)},${String(facing)}${returnPoint ? ' retour' : ''}`,
      ),
    pose: (pose) => log.push(`pose ${pose}`),
    think: (icon) => log.push(`think ${icon}`),
  };
  return { log, host };
}

/** Hitbox de Céleste debout sur la tuile (col, row). */
function standing(col: number, row: number): Box {
  return {
    x: (col + 0.5) * T - PLAYER_HITBOX.width / 2,
    y: (row + 1) * T - PLAYER_HITBOX.height,
    width: PLAYER_HITBOX.width,
    height: PLAYER_HITBOX.height,
  };
}

function story(steps: StoryStep[], on: 'interact' | 'touch' = 'interact', lock = true): StoryData {
  return {
    triggers: [
      {
        id: 't',
        room: 'r',
        on,
        area: { col: 2, row: 2, w: 2, h: 2 },
        when: { none: ['done'] },
        lock,
        steps: [...steps, { do: 'flag', id: 'done' }],
      },
    ],
    props: [],
    times: [{ when: { all: ['done'] }, time: 'morning' }],
    lockedRooms: [{ room: 'r', when: { none: ['done'] } }],
  };
}

describe('conditions (§33)', () => {
  it('toutes les étapes de all, aucune de none', () => {
    const flags = new Set(['a', 'b']);
    expect(checkCondition(flags, {})).toBe(true);
    expect(checkCondition(flags, { all: ['a', 'b'] })).toBe(true);
    expect(checkCondition(flags, { all: ['a', 'c'] })).toBe(false);
    expect(checkCondition(flags, { none: ['c'] })).toBe(true);
    expect(checkCondition(flags, { all: ['a'], none: ['b'] })).toBe(false);
  });
});

describe('StoryDirector', () => {
  it('Agir dans la zone lance le script ; hors de la zone ou sans Agir, rien', () => {
    const { log, host } = recorder();
    const d = new StoryDirector(story([{ do: 'thought', icon: 'heart', ms: 100 }]), host, HZ);
    d.step('r', standing(8, 3), true);
    expect(d.interactable).toBe(-1);
    d.step('r', standing(2, 3), false);
    expect(d.interactable).toBe(0);
    expect(log).toEqual([]);
    d.step('autre', standing(2, 3), true);
    expect(log).toEqual([]);
    d.step('r', standing(2, 3), true);
    expect(log).toEqual(['think heart', 'flag done']);
    expect(d.flags.has('done')).toBe(true);
    // Il s'est désactivé : Agir ne fait plus rien.
    d.step('r', standing(2, 3), true);
    expect(d.interactable).toBe(-1);
    expect(log).toHaveLength(2);
  });

  it('un contact lance le script sans Agir', () => {
    const { log, host } = recorder();
    const d = new StoryDirector(story([], 'touch', false), host, HZ);
    d.step('r', standing(3, 3), false);
    expect(log).toEqual(['flag done']);
  });

  it('fondus : voile qui monte, étapes dans le noir, voile qui descend, commandes suspendues', () => {
    const { log, host } = recorder();
    const d = new StoryDirector(
      story([
        { do: 'fadeOut', ms: 100 },
        { do: 'place', col: 5, row: 3, facing: -1 },
        { do: 'wait', ms: 50 },
        { do: 'fadeIn', ms: 100 },
      ]),
      host,
      HZ,
    );
    d.step('r', standing(2, 3), true);
    expect(d.locked).toBe(true);
    expect(d.veil).toBeCloseTo(0.1);
    for (let i = 0; i < 8; i++) {
      d.step('r', standing(2, 3), false);
    }
    expect(d.veil).toBeCloseTo(0.9);
    expect(log).toEqual([]);
    d.step('r', standing(2, 3), false);
    expect(d.veil).toBe(1);
    expect(log).toEqual(['place 5,3,-1']);
    for (let i = 0; i < 5; i++) {
      d.step('r', standing(5, 3), false);
    }
    expect(d.veil).toBe(1);
    for (let i = 0; i < 10; i++) {
      d.step('r', standing(5, 3), false);
    }
    expect(d.veil).toBe(0);
    expect(d.busy).toBe(false);
    expect(d.locked).toBe(false);
    expect(log).toEqual(['place 5,3,-1', 'flag done']);
  });

  it('moment de la journée et portes fermées selon les étapes', () => {
    const { host } = recorder();
    const d = new StoryDirector(story([]), host, HZ);
    expect(d.timeOfDay()).toBe('evening');
    expect(d.exitsLocked('r')).toBe(true);
    expect(d.exitsLocked('autre')).toBe(false);
    d.setFlags(['done']);
    expect(d.timeOfDay()).toBe('morning');
    expect(d.exitsLocked('r')).toBe(false);
  });

  it('setFlags arrête le script et lève le voile', () => {
    const { host } = recorder();
    const d = new StoryDirector(story([{ do: 'fadeOut', ms: 100 }]), host, HZ);
    d.step('r', standing(2, 3), true);
    expect(d.busy).toBe(true);
    d.setFlags([]);
    expect(d.busy).toBe(false);
    expect(d.veil).toBe(0);
  });
});

describe('objets de mise en scène (pilier 5)', () => {
  const view: Box = { x: 0, y: 0, width: 200, height: 100 };

  it('ne changent jamais à l’écran, sauf dans le noir complet', () => {
    const box: Box = { x: 50, y: 50, width: 10, height: 10 };
    expect(canChangeProp(box, view, 0)).toBe(false);
    expect(canChangeProp(box, view, 0.99)).toBe(false);
    expect(canChangeProp(box, view, 1)).toBe(true);
    expect(canChangeProp({ ...box, x: 300 }, view, 0)).toBe(true);
    // Un bord qui dépasse dans la vue compte comme visible.
    expect(canChangeProp({ ...box, x: 195 }, view, 0)).toBe(false);
  });

  it('le changement attend que l’objet sorte de la vue', () => {
    const stage = new PropStage();
    const props = [
      { id: 'm', room: 'r', kind: 'maria-sit' as const, col: 3, row: 3, when: { none: ['gone'] } },
    ];
    const flags = new Set<string>();
    stage.load(props, 'r', flags);
    expect(stage.shown).toEqual([true]);
    flags.add('gone');
    expect(stage.update(flags, view, 0)).toBe(false);
    expect(stage.shown).toEqual([true]);
    expect(stage.update(flags, { ...view, x: 400 }, 0)).toBe(true);
    expect(stage.shown).toEqual([false]);
  });

  it('un objet ramassé disparaît aussitôt ; jamais Maria', () => {
    const stage = new PropStage();
    const props = [
      {
        id: 'b',
        room: 'r',
        kind: 'blanket' as const,
        col: 3,
        row: 3,
        instant: true,
        when: { none: ['taken'] },
      },
    ];
    const flags = new Set<string>();
    stage.load(props, 'r', flags);
    flags.add('taken');
    expect(stage.update(flags, view, 0)).toBe(true);
    expect(stage.shown).toEqual([false]);
    const zone = buildZone(HOUSE);
    const bad: StoryData = {
      ...HOUSE_STORY,
      props: [
        { id: 'm', room: 'bedroom', kind: 'maria-sit', col: 19, row: 19, instant: true, when: {} },
      ],
    };
    expect(storyProblems(bad, zone)).toContain("objet m : Maria ne disparaît jamais à l'écran");
  });

  it('posés au centre du bas de leur tuile', () => {
    const box = propBox({ id: 'b', room: 'r', kind: 'bottle', col: 2, row: 4, when: {} });
    expect(box.x + box.width / 2).toBe(2.5 * T);
    expect(box.y + box.height).toBe(5 * T);
    expect(box.height).toBe(PROP_SIZE.bottle.h);
  });
});

describe('histoire de la maison (D-31)', () => {
  const zone = buildZone(HOUSE);

  it('données cohérentes avec la maison', () => {
    expect(storyProblems(HOUSE_STORY, zone)).toEqual([]);
  });

  it('détecte un script qui se rejoue, un déplacement visible, un objet dans le vide', () => {
    const bad: StoryData = {
      ...HOUSE_STORY,
      triggers: [
        {
          id: 'x',
          room: 'bedroom',
          on: 'touch',
          area: { col: 1, row: 1, w: 1, h: 1 },
          when: {},
          lock: false,
          steps: [{ do: 'place', col: 3, row: 3, facing: 1 }],
        },
      ],
      props: [{ id: 'p', room: 'bedroom', kind: 'bottle', col: 20, row: 5, when: {} }],
    };
    const problems = storyProblems(bad, zone);
    expect(problems).toContain('déclencheur x : ne se désactive pas (rejoué sans fin)');
    expect(problems).toContain('déclencheur x : Céleste déplacée sous les yeux du joueur');
    expect(problems).toContain('objet p : ne repose sur rien');
  });

  it('détecte un changement de salle visible, dans le vide, ou sans veilleuse (D-34)', () => {
    const bad: StoryData = {
      ...HOUSE_STORY,
      triggers: [
        {
          id: 'y',
          room: 'living',
          on: 'touch',
          area: { col: 1, row: 1, w: 1, h: 1 },
          when: {},
          lock: true,
          steps: [
            { do: 'room', room: 'hall', col: 5, row: 5, facing: 1, returnPoint: true },
            { do: 'fadeOut', ms: 100 },
            { do: 'place', col: 30, row: 2, facing: 1 },
            { do: 'fadeIn', ms: 100 },
          ],
        },
      ],
    };
    const problems = storyProblems(bad, zone);
    // Un script qui change de salle peut rester disponible (il emmène Céleste ailleurs).
    expect(problems).not.toContain('déclencheur y : ne se désactive pas (rejoué sans fin)');
    expect(problems).toContain('déclencheur y : Céleste déplacée sous les yeux du joueur');
    expect(problems).toContain('déclencheur y : point de retour sans veilleuse dans hall');
    expect(problems).toContain('déclencheur y : Céleste placée dans le vide ou dans un meuble');
  });

  it('le prologue se joue en entier : jouer, coucher Maria, se coucher, réveil', () => {
    const { log, host } = recorder();
    const d = new StoryDirector(HOUSE_STORY, host, HZ);
    let box = standing(20, 19);
    const place = host.place.bind(host);
    host.place = (col, row, facing) => {
      place(col, row, facing);
      box = standing(col, row);
    };
    const run = (interact: boolean) => {
      d.step('bedroom', box, interact);
      for (let i = 0; i < 2000 && d.busy; i++) {
        d.step('bedroom', box, false);
      }
    };
    expect(d.exitsLocked('bedroom')).toBe(true);
    run(true);
    expect(d.flags.has(F.EveningPlayed)).toBe(true);
    // Sans la couverture, on ne peut pas encore la coucher.
    box = standing(20, 19);
    run(true);
    expect(d.flags.has(F.EveningTucked)).toBe(false);
    box = standing(33, 11);
    run(false);
    expect(d.flags.has(F.EveningBlanket)).toBe(true);
    box = standing(20, 19);
    run(true);
    expect(d.flags.has(F.EveningTucked)).toBe(true);
    box = standing(12, 15);
    run(true);
    expect(d.flags.has(F.Slept)).toBe(true);
    expect(d.timeOfDay()).toBe('morning');
    expect(d.exitsLocked('bedroom')).toBe(false);
    expect(d.veil).toBe(0);
    expect(log.filter((l) => l.startsWith('think'))).toEqual([
      'think heart',
      'think book',
      'think blanket',
      'think cradle',
      'think heart',
      'think bed',
      'think heart',
      'think maria-missing',
    ]);
  });

  it('le soir (couverture comprise) se joue dans la chambre sans grimper, par des passages faciles', () => {
    const level = zone.rooms.get('bedroom');
    if (!level) {
      throw new Error('chambre absente');
    }
    const analysis = analyzeLevel(level, DEFAULT_MOVEMENT, { climb: false });
    const at = (col: number, row: number) => surfaceUnder(level, analysis.map, col, row);
    const graph = new Map<number, Set<number>>();
    for (const move of analysis.moves) {
      if (move.windowMs >= DIFFICULTY_MIN_WINDOW_MS.easy) {
        graph.set(move.from, (graph.get(move.from) ?? new Set()).add(move.to));
      }
    }
    const reach = (from: number) => {
      const seen = new Set([from]);
      const queue = [from];
      for (let n = queue.shift(); n !== undefined; n = queue.shift()) {
        for (const next of graph.get(n) ?? []) {
          if (!seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      return seen;
    };
    // Du lit à Maria (sur le tapis), de Maria à la couverture (étagère du bureau) et retour,
    // puis du berceau (où Céleste se retrouve) au lit.
    expect(reach(at(12, 15)).has(at(19, 19))).toBe(true);
    expect(reach(at(21, 19)).has(at(33, 11))).toBe(true);
    expect(reach(at(33, 11)).has(at(19, 19))).toBe(true);
    expect(reach(at(25, 17)).has(at(12, 15))).toBe(true);
  });

  it('en haut de la bibliothèque : Maria disparaît dans le noir, Céleste passe dans le salon étrange', () => {
    const { log, host } = recorder();
    const d = new StoryDirector(HOUSE_STORY, host, HZ);
    d.setFlags([F.EveningPlayed, F.EveningTucked, F.Slept]);
    const stage = new PropStage();
    stage.load(HOUSE_STORY.props, 'living', d.flags);
    const maria = stage.props.findIndex((p) => p.id === 'maria-bookcase');
    expect(stage.shown[maria]).toBe(true);
    // Vue fixe qui montre toute la bibliothèque (Céleste est juste à côté de Maria).
    const view: Box = { x: 30 * T, y: 0, width: 30 * T, height: 24 * T };
    d.step('living', standing(44, 21), false);
    expect(d.flags.has(F.MariaSeen)).toBe(true);
    // Céleste s'arrête un instant pour la regarder.
    expect(d.locked).toBe(true);
    for (let i = 0; i < 1000 && d.busy; i++) {
      d.step('living', standing(44, 21), false);
    }
    const top = standing(50, 8);
    let veilAtChange = -1;
    let veilAtRoom = -1;
    d.step('living', top, false);
    expect(d.locked).toBe(true);
    for (let i = 0; i < 2000 && d.busy; i++) {
      const before = stage.shown[maria];
      const moved = log.length;
      stage.update(d.flags, view, d.veil);
      if (before !== stage.shown[maria]) {
        veilAtChange = d.veil;
      }
      // La scène change de salle quand le script le demande (ici, le journal).
      const room = log.some((line) => line.startsWith('room')) ? 'living-strange' : 'living';
      d.step(room, top, false);
      if (log.length > moved && log.at(-1)?.startsWith('room')) {
        veilAtRoom = d.veil;
      }
    }
    // Elle a disparu sous les yeux de Céleste… mais dans le noir complet du clignement.
    expect(veilAtChange).toBe(1);
    expect(veilAtRoom).toBe(1);
    expect(stage.shown[maria]).toBe(false);
    expect(log).toContain('room living-strange 50,8,-1');
    expect(log).toContain('think maria-missing');
  });

  it('après un échec, le haut de la bibliothèque ramène au monde étrange, jusqu’à la fin', () => {
    const { log, host } = recorder();
    const d = new StoryDirector(HOUSE_STORY, host, HZ);
    d.setFlags([F.EveningPlayed, F.EveningTucked, F.Slept, F.MariaSeen, F.MariaVanished]);
    const run = (room: string, box: Box) => {
      d.step(room, box, false);
      for (let i = 0; i < 3000 && d.busy; i++) {
        d.step(room, box, false);
      }
    };
    // Retour au point de retour réel (évanouissement), puis de nouveau en haut : clignement bref.
    run('living', standing(50, 8));
    expect(log).toEqual(['room living-strange 50,8,-1']);
    // Tout en haut du passage d'ombres : le berceau vide ; Agir.
    const cradle = standing(26, 5);
    d.step('shadows', cradle, false);
    expect(d.interactable).toBeGreaterThanOrEqual(0);
    d.step('shadows', cradle, true);
    for (let i = 0; i < 3000 && d.busy; i++) {
      d.step('shadows', cradle, false);
    }
    expect(d.flags.has(F.StrangeDone)).toBe(true);
    expect(log).toContain('room bedroom 12,15,1 retour');
    expect(log).toContain('think maria');
    // Le bandeau est posé à côté d'elle ; le haut de la bibliothèque ne fait plus rien.
    const stage = new PropStage();
    stage.load(HOUSE_STORY.props, 'bedroom', d.flags);
    expect(stage.props.filter((_, i) => stage.shown[i]).map((p) => p.id)).toContain('headband');
    const before = log.length;
    run('living', standing(50, 8));
    expect(log).toHaveLength(before);
  });

  it('un déclencheur « en quittant la salle » ne part pas au premier pas', () => {
    const { log, host } = recorder();
    const d = new StoryDirector(
      {
        ...story([]),
        triggers: [
          {
            id: 'l',
            room: 'r',
            on: 'leave',
            when: { none: ['left'] },
            lock: false,
            steps: [{ do: 'flag', id: 'left' }],
          },
        ],
      },
      host,
      HZ,
    );
    d.step('r', standing(0, 0), false);
    d.step('r', standing(0, 0), false);
    expect(log).toEqual([]);
    d.step('s', standing(0, 0), false);
    expect(log).toEqual(['flag left']);
  });
});
