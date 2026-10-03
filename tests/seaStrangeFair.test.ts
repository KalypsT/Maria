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
/** Le toit du dernier stand, devant la sortie vers la vague. */
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
    // Une seule sortie, vers la vague (D-104), jamais de porte.
    expect(fair.exits.map((e) => e.id)).toEqual([1]);
    expect(fair.doors).toHaveLength(0);
    expect(zone.destination(FAIR, 1)).toEqual({ room: 'sea-strange-wave', exit: 1 });
    // Le « ? » provisoire de la PR 5 est remplacé.
    expect(HOUSE_STORY.triggers.some((t) => t.id === 'sea-carousel')).toBe(false);
    expect(trigger('sea-strange-enter').when).toEqual({
      all: [F.SeaEvening],
      none: [F.SeaStrange],
    });
    expect(trigger('sea-strange-reenter').when).toEqual({
      all: [F.SeaStrange],
      none: [F.SeaStrangeDone],
    });
    const passages = storyPassages().filter(([, to]) => to.startsWith(`${FAIR}#`));
    expect(passages.length).toBeGreaterThan(0);
    expect(passages.every(([from]) => from.startsWith('sea-jetty#'))).toBe(true);
    // La lumière vacille toujours près du carrousel, le soir.
    const omen = HOUSE_STORY.omens.find((o) => o.room === 'sea-jetty');
    expect(omen && checkCondition(new Set([F.SeaEvening, F.SeaStrange]), omen.when)).toBe(true);
    // Elle s'arrête une fois le livre musical trouvé (D-104).
    const done = new Set([F.SeaEvening, F.SeaStrange, F.SeaStrangeDone]);
    expect(omen && checkCondition(done, omen.when)).toBe(false);
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

  it('la fin provisoire de la PR 6 est remplacée par la sortie vers la vague ; aucun personnage', () => {
    expect(HOUSE_STORY.triggers.some((t) => t.id === 'sea-strange-fair-end')).toBe(false);
    // Ni Maria ni parents (pilier 5, D-95) : aucun personnage dans la fête engloutie.
    expect(HOUSE_STORY.props.filter((p) => p.room === FAIR)).toEqual([]);
    const exit = level(FAIR).exits[0];
    expect(exit && standOn(level(FAIR), { col: exit.col - 1, row: exit.rowMax })).toBe(
      standOn(level(FAIR), END),
    );
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
    'jamais coincée : de partout, une veilleuse ou la sortie vers la vague ; la sortie atteinte',
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
