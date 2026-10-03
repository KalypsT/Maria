import { describe, expect, it } from 'vitest';
import { Ability } from '../src/config/abilities';
import { TILE_SIZE as T } from '../src/config/display';
import { phaseMovement } from '../src/config/growth';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { StoryFlag as F } from '../src/config/story';
import { EntityType, Tile, tileAt } from '../src/core/level/LevelData';
import { atLayer } from '../src/core/level/layers';
import { PlayerPhysics, type PlayerInput } from '../src/core/player/PlayerPhysics';
import { checkCondition } from '../src/core/story/story';
import { storyProblems } from '../src/core/story/storyProblems';
import { isMappedRoom, isStrangeRoom, mapPage } from '../src/core/world/zone';
import { Pickups } from '../src/core/world/Pickups';
import { mapProblems } from '../src/core/world/mapModel';
import { HOUSE_STORY } from '../src/levels/house/story';
import { MIRROR, NANNY_ARRIVAL } from '../src/levels/nanny/story';
import {
  lanternNodes,
  reachableNodes,
  seaAnalysis,
  standOn,
  stuckNodes,
  tideGraph,
  tideNode,
} from './tideGraph';
import { level, phase, zone } from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/** L'avant-dernier niveau, PR 3 (D-110) : la porte, l'entrée et son miroir, la maison, la carte. */
const ROOMS = ['nanny-entry', 'nanny-house'];
const P3 = phase(3);

function need<V>(value: V | null | undefined, what: string): V {
  if (value === null || value === undefined) {
    throw new Error(`${what} absent`);
  }
  return value;
}
const trigger = (id: string) =>
  need(
    HOUSE_STORY.triggers.find((c) => c.id === id),
    id,
  );

describe('la maison de la nounou : l’entrée, le miroir, la maison (D-110)', () => {
  it('la porte du couloir mène, dans le noir, à l’entrée de la nounou (point de retour)', () => {
    for (const id of ['sea-end-door', 'sea-end-later']) {
      const steps = trigger(id).steps;
      const order = steps.map((s) => s.do);
      const room = steps.find((s) => s.do === 'room');
      expect(room).toEqual({
        do: 'room',
        room: 'nanny-entry',
        ...NANNY_ARRIVAL,
        facing: 1,
        returnPoint: true,
      });
      expect(order.indexOf('room')).toBeGreaterThan(order.indexOf('fadeOut'));
      expect(steps).toContainEqual({ do: 'flag', id: F.NannyArrived });
      // Le début d'un niveau (D-70) : Céleste pense à Maria ; ni Maria ni parents à l'écran.
      expect(steps.some((s) => s.do === 'thought' && s.icon === 'maria')).toBe(true);
    }
    expect(standOn(level('nanny-entry'), NANNY_ARRIVAL)).toBeGreaterThanOrEqual(0);
    expect(storyProblems(HOUSE_STORY, zone)).toEqual([]);
  });

  it('les salles : monde étrange, mais sur la page « Chez la nounou » du cahier', () => {
    for (const room of ROOMS) {
      const l = level(room);
      expect(isStrangeRoom(l)).toBe(true);
      expect(isMappedRoom(l)).toBe(true);
      expect(mapPage(zone, room)).toBe('nanny');
      expect(l.meta.music).toBe('strange');
    }
    expect(zone.destination('nanny-entry', 1)).toEqual({ room: 'nanny-house', exit: 1 });
    expect(mapProblems(zone)).toEqual([]);
  });

  it('aucun personnage réel dans la maison de la nounou, ni Maria', () => {
    const kinds = HOUSE_STORY.props.filter((p) => ROOMS.includes(p.room)).map((p) => p.kind);
    // La veilleuse de l'îlot 1 sur la porte de la sieste (D-112) est un objet.
    expect(kinds.sort()).toEqual(['nap-light-bed', 'reflection', 'reflection-through']);
  });

  it('le miroir : sa vitre n’existe que dans le présent ; dans le souvenir, le cadre est vide', () => {
    const entry = level('nanny-entry');
    const memory = atLayer(entry, 'memory');
    for (let row = 1; row <= MIRROR.row; row++) {
      expect(tileAt(entry, MIRROR.col, row)).toBe(Tile.Solid);
      expect(tileAt(memory, MIRROR.col, row)).toBe(Tile.Empty);
    }
    expect(entry.decor.some((d) => d.kind === 'mirrorglass')).toBe(true);
    expect(memory.decor.some((d) => d.kind === 'mirrorglass')).toBe(false);
    expect(memory.decor.some((d) => d.kind === 'nannymirror')).toBe(true);
  });

  it('le reflet passe de l’autre côté dans le noir, et Céleste apprend la bascule', () => {
    const mirror = trigger('nanny-mirror');
    expect(mirror.when).toEqual({ all: [F.NannyArrived], none: [F.NannyMirror] });
    const order = mirror.steps.map((s) => s.do);
    expect(order.indexOf('flag')).toBeGreaterThan(order.indexOf('fadeOut'));
    expect(order.indexOf('flag')).toBeLessThan(order.indexOf('fadeIn'));
    expect(mirror.steps).toContainEqual({ do: 'ability', id: Ability.Shift });
    expect(order.indexOf('ability')).toBeGreaterThan(order.indexOf('fadeIn'));
    // Le reflet est dans la vitre avant, de l'autre côté après ; plus là une fois dans la maison.
    const shown = (flags: string[]) =>
      HOUSE_STORY.props
        .filter((p) => p.room === 'nanny-entry' && checkCondition(new Set(flags), p.when))
        .map((p) => p.id);
    expect(shown([F.NannyArrived])).toEqual(['nanny-reflection']);
    expect(shown([F.NannyArrived, F.NannyMirror])).toEqual(['nanny-reflection-through']);
    expect(shown([F.NannyArrived, F.NannyMirror, F.NannyHouse])).toEqual([]);
    const through = need(
      HOUSE_STORY.props.find((p) => p.id === 'nanny-reflection-through'),
      'reflet',
    );
    expect(through.col).toBeGreaterThan(MIRROR.col + 1);
    // L'aide de la bascule : la bulle du reflet, puis celle de l'obtention.
    expect(mirror.steps.some((s) => s.do === 'thought' && s.icon === 'shift')).toBe(true);
  });

  it('chaque veilleuse est une fente sur la nuit du dortoir', () => {
    for (const room of ROOMS) {
      const l = level(room);
      const lamps = l.entities.filter((e) => e.type === EntityType.Checkpoint);
      expect(lamps.length).toBeGreaterThan(0);
      for (const lamp of lamps) {
        const slit = l.decor.some(
          (d) => d.kind === 'nightslit' && Math.abs(d.col + d.width / 2 - lamp.col) <= 4,
        );
        expect(slit, `${room} ${String(lamp.col)}`).toBe(true);
      }
    }
  });

  it(
    'jamais coincée : de tout endroit atteint, une veilleuse (avec la bascule)',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const graph = tideGraph(zone, HOUSE_STORY, ROOMS);
      const start = tideNode('nanny-entry', false, standOn(level('nanny-entry'), NANNY_ARRIVAL));
      const reached = reachableNodes(graph, start);
      expect(stuckNodes(graph, reached, lanternNodes(zone, ROOMS))).toEqual([]);
      // La maison est atteinte, et sans la bascule on ne passe pas le miroir.
      const house = level('nanny-house');
      expect(reached.has(tideNode('nanny-house', false, standOn(house, { col: 1, row: 36 })))).toBe(
        true,
      );
    },
  );

  it('sans la bascule, on ne passe pas le miroir', { timeout: ANALYSIS_TIMEOUT_MS }, () => {
    const entry = level('nanny-entry');
    const a = seaAnalysis(entry, Ability.Shift);
    const from = standOn(entry, NANNY_ARRIVAL, Ability.Shift);
    const to = standOn(entry, { col: 82, row: 22 }, Ability.Shift);
    const seen = new Set([from]);
    const queue = [from];
    for (let n = queue.shift(); n !== undefined; n = queue.shift()) {
      for (const m of a.moves) {
        if (m.from === n && !seen.has(m.to)) {
          seen.add(m.to);
          queue.push(m.to);
        }
      }
    }
    expect(seen.has(to)).toBe(false);
  });

  it('sous le canapé, dans le souvenir : on y glisse jusqu’à la trouvaille ; jamais dans le présent', () => {
    const house = level('nanny-house');
    const secret = need(
      house.entities.find((e) => e.type === EntityType.Secret && e.row === 36),
      'trouvaille du canapé',
    );
    const attempt = (layer: 'present' | 'memory', slide: boolean) => {
      const data = atLayer(house, layer);
      const { width, height } = P3.hitbox;
      const player = new PlayerPhysics(
        data,
        phaseMovement(DEFAULT_MOVEMENT, P3),
        (11.5 + 0.5) * T - width / 2,
        37 * T - height,
        P3.hitbox,
      );
      player.canClimb = player.canWallJump = player.canGlide = player.canHook = true;
      player.canSlide = slide;
      const pickups = new Pickups();
      pickups.load(data, [], []);
      const input: PlayerInput = { moveX: 1, moveY: 0, jumpPressed: false, jumpHeld: false };
      for (let s = 0; s < 900; s++) {
        input.abilityPressed = slide && s % 30 === 0;
        input.jumpPressed = !slide && s % 40 === 0;
        input.jumpHeld = input.jumpPressed;
        player.step(input);
        if (pickups.step(player.box) >= 0) {
          return true;
        }
      }
      return false;
    };
    expect(secret.col).toBeGreaterThan(13);
    expect(attempt('memory', true)).toBe(true);
    expect(attempt('memory', false)).toBe(false);
    expect(attempt('present', true)).toBe(false);
  });
});
