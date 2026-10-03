import { describe, expect, it } from 'vitest';
import { StoryFlag as F } from '../src/config/story';
import { EntityType } from '../src/core/level/LevelData';
import { checkCondition } from '../src/core/story/story';
import { isStrangeRoom, mapPage } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import {
  lanternNodes,
  reachableNodes,
  seaAnalysis,
  standOn,
  stuckNodes,
  tideGraph,
  tideNode,
} from './tideGraph';
import { level, storyPassages, zone } from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/** La station balnéaire, PR 6 (D-102) : le monde étrange, la fête engloutie. */
const FAIR = 'sea-strange-fair';
const ARRIVAL = { col: 6, row: 18 };
const END = { col: 168, row: 6 };

const trigger = (id: string) => {
  const t = HOUSE_STORY.triggers.find((c) => c.id === id);
  if (!t) {
    throw new Error(`déclencheur ${id} absent`);
  }
  return t;
};

describe('la fête engloutie (D-102)', () => {
  it('on y entre par le carrousel de la jetée, le soir ; hors de la carte ; sa musique', () => {
    const fair = level(FAIR);
    expect(isStrangeRoom(fair)).toBe(true);
    expect(fair.meta.music).toBe('strange');
    expect(mapPage(zone, FAIR)).toBeNull();
    expect(fair.exits).toHaveLength(0);
    expect(fair.doors).toHaveLength(0);
    // Le « ? » provisoire de la PR 5 est remplacé.
    expect(HOUSE_STORY.triggers.some((t) => t.id === 'sea-carousel')).toBe(false);
    expect(trigger('sea-strange-enter').when).toEqual({
      all: [F.SeaEvening],
      none: [F.SeaStrange],
    });
    expect(trigger('sea-strange-reenter').when).toEqual({ all: [F.SeaStrange] });
    const passages = storyPassages().filter(([, to]) => to.startsWith(`${FAIR}#`));
    expect(passages.length).toBeGreaterThan(0);
    expect(passages.every(([from]) => from.startsWith('sea-jetty#'))).toBe(true);
    // La lumière vacille toujours près du carrousel, le soir.
    const omen = HOUSE_STORY.omens.find((o) => o.room === 'sea-jetty');
    expect(omen && checkCondition(new Set([F.SeaEvening, F.SeaStrange]), omen.when)).toBe(true);
  });

  it('l’entrée : la lueur, le tremblement, le noir, puis le cercle sur le toit du carrousel englouti', () => {
    const steps = trigger('sea-strange-enter').steps;
    const order = steps.map((s) => s.do);
    expect(order.indexOf('flag')).toBeGreaterThan(order.indexOf('fadeOut'));
    expect(order.indexOf('room')).toBeGreaterThan(order.indexOf('fadeOut'));
    expect(steps.find((s) => s.do === 'room')).toMatchObject({ room: FAIR, ...ARRIVAL });
    expect(steps.find((s) => s.do === 'fadeIn')).toMatchObject({ shape: 'iris' });
    expect(standOn(level(FAIR), ARRIVAL)).toBeGreaterThanOrEqual(0);
  });

  it('la fin provisoire : au toit du dernier stand, le cercle se referme devant le carrousel', () => {
    const end = trigger('sea-strange-fair-end');
    expect(end.room).toBe(FAIR);
    expect(end.on).toBe('touch');
    // Elle reste disponible : le script emmène Céleste hors de la salle.
    expect(end.repeat).toBeUndefined();
    const room = end.steps.find((s) => s.do === 'room');
    expect(room).toMatchObject({ room: 'sea-jetty', returnPoint: true });
    const order = end.steps.map((s) => s.do);
    expect(order.indexOf('room')).toBeGreaterThan(order.indexOf('fadeOut'));
    // Ni Maria ni parents (piliers 5, D-95) : aucun personnage dans la fête engloutie.
    expect(HOUSE_STORY.props.filter((p) => p.room === FAIR)).toEqual([]);
    expect(end.steps.some((s) => s.do === 'thought' && s.icon === 'maria')).toBe(false);
    if (room?.do === 'room') {
      expect(standOn(level('sea-jetty'), room)).toBeGreaterThanOrEqual(0);
    }
  });

  it('difficile ; deux veilleuses, la seconde avant le saut long ; l’eau partout dessous', () => {
    const fair = level(FAIR);
    expect(fair.meta.difficulty).toBe('hard');
    const lamps = fair.entities.filter((e) => e.type === EntityType.Checkpoint);
    expect(lamps.map((e) => [e.col, e.row])).toEqual([
      [27, 3],
      [113, 13],
    ]);
    // Les trois tronçons (vérifiés par legs.test.ts) : facile (saut mural), facile (crochet et
    // glissade), difficile (saut mural).
    expect(fair.legs.map((l) => [l.difficulty, ...l.needs])).toEqual([
      ['easy', 'wall-jump'],
      ['easy', 'hook', 'slide'],
      ['hard', 'wall-jump'],
    ]);
    expect(fair.cables).toHaveLength(2);
  });

  it(
    'jamais coincée : de partout, une veilleuse ou le bout de la fête ; le bout atteint',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const fair = level(FAIR);
      const graph = tideGraph(zone, HOUSE_STORY, [FAIR]);
      const from = tideNode(FAIR, false, standOn(fair, ARRIVAL));
      const end = tideNode(FAIR, false, standOn(fair, END));
      const reached = reachableNodes(graph, from);
      expect(reached.has(end)).toBe(true);
      const safe = [...lanternNodes(zone, [FAIR]), end];
      expect(stuckNodes(graph, reached, safe)).toEqual([]);
      // Toutes les surfaces de la salle sont atteintes (rien d'inutile, rien d'inaccessible).
      expect(reached.size).toBe(seaAnalysis(fair).map.surfaces.length);
    },
  );
});
