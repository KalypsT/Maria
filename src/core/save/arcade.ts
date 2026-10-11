import { ARCADE, ARCADE_GAMES, ArcadeMode, type ArcadeGameId } from '../../config/arcade';

/** Meilleurs scores d'un jeu de la console (m), un par mode (D-166). */
export interface ArcadeRecords {
  levels: number;
  endless: number;
}

/**
 * La console dans la sauvegarde (D-166) : les records, et les jeux déjà vus (l'étincelle d'un
 * nouveau jeu). Absente des sauvegardes plus anciennes : vide, sans migration.
 */
export interface ArcadeSave {
  records: Partial<Record<ArcadeGameId, ArcadeRecords>>;
  seen: ArcadeGameId[];
}

const GAME_IDS: ReadonlySet<string> = new Set(ARCADE_GAMES.map((game) => game.id));

function isGameId(value: unknown): value is ArcadeGameId {
  return typeof value === 'string' && GAME_IDS.has(value);
}

function meters(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.min(Math.floor(value), ARCADE.maxRecordMeters)
    : 0;
}

export function createArcade(): ArcadeSave {
  return { records: {}, seen: [] };
}

/**
 * La console lue dans une sauvegarde : seulement les jeux connus, des scores bornés ; jamais
 * refusée (des records abîmés ne doivent pas faire perdre la partie).
 */
export function sanitizeArcade(raw: unknown): ArcadeSave {
  const arcade = createArcade();
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return arcade;
  }
  const data = raw as Record<string, unknown>;
  const records = data['records'];
  if (typeof records === 'object' && records !== null && !Array.isArray(records)) {
    for (const [id, value] of Object.entries(records as Record<string, unknown>)) {
      if (!isGameId(id) || typeof value !== 'object' || value === null || Array.isArray(value)) {
        continue;
      }
      const record = value as Record<string, unknown>;
      arcade.records[id] = { levels: meters(record['levels']), endless: meters(record['endless']) };
    }
  }
  const seen = data['seen'];
  if (Array.isArray(seen)) {
    arcade.seen = [...new Set(seen.filter(isGameId))];
  }
  return arcade;
}

/** Record d'un jeu dans un mode (0 : jamais joué). */
export function arcadeRecord(
  arcade: Readonly<ArcadeSave>,
  game: ArcadeGameId,
  mode: ArcadeMode,
): number {
  const record = arcade.records[game];
  return record ? (mode === ArcadeMode.Levels ? record.levels : record.endless) : 0;
}

/**
 * Fin d'une partie (une chute, ou quitter : le score atteint compte) : garde le meilleur score.
 * Retourne true pour un nouveau record.
 */
export function submitArcadeScore(
  arcade: ArcadeSave,
  game: ArcadeGameId,
  mode: ArcadeMode,
  score: number,
): boolean {
  const value = meters(score);
  if (value <= arcadeRecord(arcade, game, mode)) {
    return false;
  }
  const record = (arcade.records[game] ??= { levels: 0, endless: 0 });
  if (mode === ArcadeMode.Levels) {
    record.levels = value;
  } else {
    record.endless = value;
  }
  return true;
}
