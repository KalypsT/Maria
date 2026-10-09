import { STATS } from '../../config/stats';

/**
 * Les stats de la partie (D-153), pures et indépendantes de Phaser : le temps de jeu (pauses, carte
 * et appli en arrière-plan exclues ; scènes et souvenirs compris), les évanouissements et le fil
 * discret, salle par salle. Pour le joueur, le temps et les évanouissements ; le reste pour les
 * essais (debug, code de sauvegarde).
 */
export interface RoomStats {
  /** Temps de jeu passé dans la salle (ms). */
  ms: number;
  /**
   * Évanouissements dans la salle (la peur pleine : dangers, ennemis, poursuivants, tunnels piquent
   * tous la peur, D-56).
   */
  faints: number;
  /** Fois où le fil discret s'est allumé dans la salle (D-129). */
  hints: number;
}

export interface GameStats {
  /** Temps de jeu total (ms). */
  playMs: number;
  /** Par salle (identifiant de la salle). */
  rooms: Record<string, RoomStats>;
}

const ROOM_ID = /^[\w-]{1,64}$/;
/** Clés qui ne doivent jamais devenir des propriétés d'objet. */
const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);

export function createStats(): GameStats {
  return { playMs: 0, rooms: {} };
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.min(Math.floor(value), STATS.maxCount)
    : 0;
}

function isRoomId(id: string): boolean {
  return ROOM_ID.test(id) && !FORBIDDEN.has(id);
}

/**
 * Stats lues dans une sauvegarde : bornées, jamais refusées (des stats abîmées ne doivent pas faire
 * perdre la progression). Absentes (sauvegarde plus ancienne) : à zéro, sans migration.
 */
export function sanitizeStats(raw: unknown): GameStats {
  const stats = createStats();
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return stats;
  }
  const data = raw as Record<string, unknown>;
  stats.playMs = count(data['playMs']);
  const rooms = data['rooms'];
  if (typeof rooms !== 'object' || rooms === null || Array.isArray(rooms)) {
    return stats;
  }
  let kept = 0;
  for (const [id, value] of Object.entries(rooms as Record<string, unknown>)) {
    if (kept >= STATS.maxRooms) {
      break;
    }
    if (!isRoomId(id) || typeof value !== 'object' || value === null || Array.isArray(value)) {
      continue;
    }
    const room = value as Record<string, unknown>;
    stats.rooms[id] = {
      ms: count(room['ms']),
      faints: count(room['faints']),
      hints: count(room['hints']),
    };
    kept++;
  }
  return stats;
}

/** La salle, créée à zéro la première fois (null : identifiant refusé, ou trop de salles). */
function roomOf(stats: GameStats, room: string): RoomStats | null {
  const existing = Object.hasOwn(stats.rooms, room) ? stats.rooms[room] : undefined;
  if (existing) {
    return existing;
  }
  if (!isRoomId(room) || Object.keys(stats.rooms).length >= STATS.maxRooms) {
    return null;
  }
  const created: RoomStats = { ms: 0, faints: 0, hints: 0 };
  stats.rooms[room] = created;
  return created;
}

/** Du temps de jeu dans une salle (sans allocation, sauf la première fois dans la salle). */
export function addPlayTime(stats: GameStats, room: string, ms: number): void {
  if (!(ms > 0) || !Number.isFinite(ms)) {
    return;
  }
  stats.playMs = Math.min(stats.playMs + ms, STATS.maxCount);
  const r = roomOf(stats, room);
  if (r) {
    r.ms = Math.min(r.ms + ms, STATS.maxCount);
  }
}

export function addFaint(stats: GameStats, room: string): void {
  const r = roomOf(stats, room);
  if (r) {
    r.faints = Math.min(r.faints + 1, STATS.maxCount);
  }
}

export function addHint(stats: GameStats, room: string): void {
  const r = roomOf(stats, room);
  if (r) {
    r.hints = Math.min(r.hints + 1, STATS.maxCount);
  }
}

/** Tous les évanouissements de la partie. */
export function totalFaints(stats: Readonly<GameStats>): number {
  let total = 0;
  for (const room of Object.values(stats.rooms)) {
    total += room.faints;
  }
  return total;
}

/**
 * Les stats regroupées par lieu (le debug, les essais) : `placeOf` donne le lieu d'une salle (null :
 * « autre »). Dans l'ordre de la première salle rencontrée.
 */
export function statsByPlace(
  stats: Readonly<GameStats>,
  placeOf: (room: string) => string | null,
): { place: string; ms: number; faints: number; hints: number }[] {
  const places = new Map<string, { place: string; ms: number; faints: number; hints: number }>();
  for (const [id, room] of Object.entries(stats.rooms)) {
    const place = placeOf(id) ?? 'autre';
    const entry = places.get(place) ?? { place, ms: 0, faints: 0, hints: 0 };
    entry.ms += room.ms;
    entry.faints += room.faints;
    entry.hints += room.hints;
    places.set(place, entry);
  }
  return [...places.values()];
}

/** Un temps de jeu lisible : « 1 h 05 », « 12 min », « 40 s ». */
export function formatPlayTime(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${String(hours)} h ${String(minutes).padStart(2, '0')}`;
  }
  if (minutes > 0) {
    return `${String(minutes)} min`;
  }
  return `${String(totalSeconds)} s`;
}
