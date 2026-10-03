import { describe, expect, it } from 'vitest';
import { DEFAULT_COMBAT } from '../src/config/combat';
import { phaseMovement } from '../src/config/growth';
import { DIFFICULTY_MIN_WINDOW_MS } from '../src/config/levelDesign';
import { STRANGE_THINGS } from '../src/config/memories';
import { DEFAULT_MOVEMENT } from '../src/config/movement';
import { StoryFlag as F } from '../src/config/story';
import { EntityType, type TilePos } from '../src/core/level/LevelData';
import { checkCondition } from '../src/core/story/story';
import { isStrangeRoom, mapPage } from '../src/core/world/zone';
import { HOUSE_STORY } from '../src/levels/house/story';
import { chaseRun } from './pace';
import {
  lanternNodes,
  reachableNodes,
  SEA_PHASE,
  seaAnalysis,
  standOn,
  stuckNodes,
  tideGraph,
  tideNode,
} from './tideGraph';
import { level, zone } from './zoneGraph';
import { ANALYSIS_TIMEOUT_MS } from './timeouts';

/** La station balnéaire, PR 8 (D-104) : la vague dans le niveau, le livre musical. */
const FAIR = 'sea-strange-fair';
const WAVE = 'sea-strange-wave';
const BOOK = { col: 181, row: 13 };
const easy = DIFFICULTY_MIN_WINDOW_MS.easy;

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

/** Les veilleuses de la vague, de gauche à droite, puis le livre : les bornes des tronçons. */
function stops(): TilePos[] {
  return [
    ...level(WAVE)
      .entities.filter((e) => e.type === EntityType.Checkpoint)
      .sort((a, b) => a.col - b.col),
    BOOK,
  ];
}

describe('la vague, dans le niveau (D-104)', () => {
  it('au sortir de la fête engloutie ; hors de la carte ; sa musique ; la vague et sa digue', () => {
    const wave = level(WAVE);
    expect(isStrangeRoom(wave)).toBe(true);
    expect(wave.meta.music).toBe('strange');
    expect(mapPage(zone, WAVE)).toBeNull();
    expect(zone.destination(WAVE, 1)).toEqual({ room: FAIR, exit: 1 });
    const chase = need(wave.chase, 'poursuite');
    expect(chase.look).toBe('wave');
    expect(chase.dir).toBe('right');
    // La digue où la vague se brise : la ligne d'arrivée est son bord gauche, avant le livre.
    expect(chase.end).toBe(160);
    expect(BOOK.col).toBeGreaterThan(chase.end);
    // Quatre tronçons, une veilleuse au début de chacun.
    expect(stops()).toHaveLength(5);
    expect(wave.legs).toHaveLength(4);
  });

  it(
    'rythme (phase 3, toutes les capacités) : le joueur parfait n’est jamais touché ; 50 % plus lent, il l’est à chaque tronçon ; sans le reflux, il l’est aussi',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const wave = level(WAVE);
      const a = seaAnalysis(wave);
      const run = phaseMovement(DEFAULT_MOVEMENT, SEA_PHASE).maxRunSpeed;
      const flat = { ...DEFAULT_COMBAT, backwashMs: 0 };
      const s = stops();
      let flatContacts = 0;
      for (let i = 0; i + 1 < s.length; i++) {
        const from = need(s[i], 'départ');
        const to = need(s[i + 1], 'fin');
        const label = `colonnes ${String(from.col)} à ${String(to.col)}`;
        const go = (slow: number, params = DEFAULT_COMBAT) =>
          chaseRun(wave, a, from, to, easy, slow, params, SEA_PHASE.hitbox, run);
        const perfect = go(1);
        expect(perfect.contacts, label).toBe(0);
        expect(perfect.margin, label).toBeGreaterThan(2);
        flatContacts += go(1, flat).contacts;
        expect(go(1.5).contacts, label).toBeGreaterThan(0);
      }
      // Sans le reflux (une vague qui ne s'arrête jamais), le joueur parfait est rattrapé.
      expect(flatContacts).toBeGreaterThan(0);
    },
  );

  it(
    'jamais coincée, de la fête engloutie au livre ; le livre atteint',
    { timeout: ANALYSIS_TIMEOUT_MS },
    () => {
      const rooms = [FAIR, WAVE];
      const graph = tideGraph(zone, HOUSE_STORY, rooms);
      const from = tideNode(FAIR, false, standOn(level(FAIR), { col: 6, row: 18 }));
      const book = tideNode(WAVE, false, standOn(level(WAVE), BOOK));
      const reached = reachableNodes(graph, from);
      expect(reached.has(book)).toBe(true);
      expect(stuckNodes(graph, reached, [...lanternNodes(zone, rooms), book])).toEqual([]);
    },
  );

  it('le livre musical : un souvenir du monde étrange ; le cercle se referme sur la couchette', () => {
    // Le quatrième de la rubrique ; le torchon blanc (D-116) vient après.
    expect(STRANGE_THINGS.indexOf('music-book')).toBe(3);
    const t = trigger('sea-music-book');
    expect(t.room).toBe(WAVE);
    expect(t.when).toEqual({ all: [F.SeaStrange], none: [F.SeaStrangeDone] });
    const order = t.steps.map((s) => s.do);
    expect(t.steps[0]).toEqual({ do: 'memory', id: 'music-book' });
    expect(order.indexOf('flag')).toBeGreaterThan(order.indexOf('fadeOut'));
    const room = t.steps.find((s) => s.do === 'room');
    expect(room).toMatchObject({ room: 'sea-centre', returnPoint: true });
    if (room?.do === 'room') {
      expect(standOn(level('sea-centre'), room)).toBeGreaterThanOrEqual(0);
    }
    // La fin d'un monde étrange (D-70) : Maria en pensée, jamais montrée (pilier 5) ; ni parents.
    expect(t.steps.some((s) => s.do === 'thought' && s.icon === 'maria')).toBe(true);
    const props = HOUSE_STORY.props.filter((p) => p.room === WAVE);
    expect(props.map((p) => p.kind)).toEqual(['music-book']);
    const prop = need(props[0], 'livre');
    expect([prop.col, prop.row]).toEqual([BOOK.col, BOOK.row]);
    const during = new Set<string>([F.SeaEvening, F.SeaStrange]);
    expect(checkCondition(during, prop.when)).toBe(true);
    expect(checkCondition(new Set([...during, F.SeaStrangeDone]), prop.when)).toBe(false);
    // Le carrousel ne ramène plus dans le monde étrange une fois le livre trouvé.
    const reenter = trigger('sea-strange-reenter');
    expect(checkCondition(new Set([...during, F.SeaStrangeDone]), reenter.when)).toBe(false);
  });
});
