import {
  type ChaseDir,
  type ChaseLook,
  EntityType,
  type LevelDecor,
  Material,
  Tile,
  type LevelCable,
  type LevelData,
  type LevelDoor,
  type LevelEntity,
  type LevelExit,
  type LevelLayers,
  type LayerMask,
  type LevelLeg,
  type LevelHide,
  type LevelTide,
  type ShellIntent,
  type LevelTrain,
  type TilePos,
  type TileRect,
} from './LevelData';
import { buildErase, checkErase, erasedLevel, initialMasks, maskOf } from './erase';
import { buildLayers, checkLayers, presentOf } from './layers';
import { buildTide, checkTide } from './tide';
import { TILE_SIZE } from '../../config/display';

const LEGEND: Readonly<Record<string, number>> = {
  '.': Tile.Empty,
  '#': Tile.Solid,
  b: Tile.Solid,
  t: Tile.Solid,
  v: Tile.Solid,
  '=': Tile.OneWay,
  '-': Tile.OneWay,
  P: Tile.Empty,
  G: Tile.Empty,
  e: Tile.Empty,
  a: Tile.Empty,
  o: Tile.Empty,
  C: Tile.Empty,
  A: Tile.Empty,
  S: Tile.Empty,
  '^': Tile.Hazard,
  '!': Tile.Thorns,
  '~': Tile.Water,
};
/** Marqueurs d'entités (la tuile elle-même est vide). */
const ENTITIES: Readonly<Record<string, EntityType>> = {
  e: EntityType.Patroller,
  a: EntityType.Spider,
  o: EntityType.Snail,
  C: EntityType.Checkpoint,
  A: EntityType.Ability,
  S: EntityType.Shell,
};
/** Matériaux d'affichage (D-25). */
const MATERIALS: Readonly<Record<string, Material>> = {
  b: Material.Wood,
  t: Material.Fabric,
  v: Material.Leaf,
  '-': Material.Wood,
};
/** Chiffres de sortie (D-25). */
const EXIT = /^[1-9]$/;
const SPAWN = 'P';
const GOAL = 'G';
const COMMENT = ';';
/** Métadonnée dans un commentaire : `; @difficulty: medium`. */
const META = /^;\s*@([\w-]+)\s*:\s*(.*)$/;
/** Élément d'habillage (D-28), répétable : `; @decor: bed 7 16 11 4` (nom, colonne, ligne, largeur, hauteur). */
const DECOR = /^([a-z][\w-]*)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/;
/**
 * Porte de façade (D-61), répétable : `; @door: 2 50 27` (numéro, colonne, ligne où l'on se tient).
 * Numéro de 1 à 99 (D-116) : les sorties, elles, sont un chiffre dans la carte.
 */
const DOOR = /^([1-9]\d?)\s+(\d+)\s+(\d+)$/;
/** Câble (D-65), répétable : `; @cable: 4 10 30 14` (colonne et ligne de chaque bout, au centre des tuiles). */
const CABLE = /^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/;
/** Voie ferrée (D-66), répétable : `; @train: 26 right` (ligne des rails, sens du train). */
const TRAIN = /^(\d+)\s+(left|right)$/;
/**
 * Poursuite (D-67, D-87) : `; @chase: 4` (vers le haut, ligne d'arrivée) ou `; @chase: right 140`
 * (sens, ligne ou colonne d'arrivée), `; @chase-phase: 40 1.5` (jusqu'à la ligne ou la colonne,
 * tuiles/s), `; @chase-trip: col ligne l h`, `; @chase-look: wave` (la vague, D-103).
 */
const CHASE_END = /^(?:(up|right|left)\s+)?(\d+)$/;
const CHASE_PHASE = /^(\d+)\s+(\d+(?:\.\d+)?)$/;
const CHASE_TRIP = /^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/;
/**
 * Marée (D-95) : `; @tide: 26 18` (première ligne d'eau à marée basse, puis à marée haute) ;
 * `; @sea: col ligne l h` (répétable) : là où monte la mer ; `; @rise: col ligne l h` (répétable) :
 * ce qui flotte (bateau, ponton), tout son contenu monte avec la marée.
 */
const TIDE = /^(\d+)\s+(\d+)$/;
const RECT = /^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/;
/**
 * Tronçon (D-96), répétable : `; @leg: 3,20 40,12 medium hook slide high` (tuile de départ et
 * d'arrivée, difficulté exacte, capacités exigées, marée haute ; basse par défaut).
 */
const LEG = /^(\d+),(\d+)\s+(\d+),(\d+)\s+(easy|medium|hard)((?:\s+[a-z-]+)*)$/;
const LEG_NEEDS: ReadonlySet<string> = new Set([
  'climb',
  'wall-jump',
  'umbrella',
  'hook',
  'slide',
  'shift',
]);
/** Mots d'un tronçon qui ne sont pas des capacités : la marée, la couche de départ (D-107). */
const LEG_STATES: ReadonlySet<string> = new Set(['high', 'low', 'memory', 'present']);
/**
 * Groupe de l'effacement (D-111), répétable : `; @erase: a present 10 4 6 1` ; une étoile de la
 * berceuse (D-140) : `both` (allumée) ou `none` (éteinte), avec `; @erase-look: stars`.
 */
const ERASE = /^([a-z0-9-]+)\s+(present|memory|both|none)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/;
/**
 * Accélération des vagues (D-117), répétable : `; @erase-speed: nanny.play-1 1.25` (étape
 * d'histoire, facteur) ; dissolution : `; @erase-until: nanny.erasure-gone`.
 */
const ERASE_SPEED = /^([\w.-]+)\s+(\d+(?:\.\d+)?)$/;
const ERASE_UNTIL = /^([\w.-]+)$/;
/** Étape des vagues de l'effacement (D-111), répétable, dans l'ordre : `; @erase-step: a,b`. */
const ERASE_STEP = /^([a-z0-9-]+(?:\s*,\s*[a-z0-9-]+)*)$/;
/**
 * Nom fixe d'une coquille (D-148), répétable : `; @shell: attic-ridge 6 5 medium climb` (nom,
 * colonne et ligne de son `S`, puis son intention : difficulté, capacités exigées, `growth`,
 * `crawl`, `from col,ligne`, `high`). Le nom est son identifiant dans la sauvegarde : la déplacer ne
 * la fait pas oublier.
 */
const SHELL = /^([a-z0-9]+(?:-[a-z0-9]+)*)\s+(\d+)\s+(\d+)((?:\s+[\w,-]+)*)$/;
/** Cachette (D-148), répétable : `; @hide: sheet 36 15 4 5` (dessin, colonne, ligne, largeur, hauteur). */
const HIDE = DECOR;
/** Zone d'une seule couche (D-107), répétable : `; @shift: memory 10 4 6 2`. */
const SHIFT = /^(present|memory)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/;

/**
 * Convertit une carte ASCII (décision D-06) en `LevelData`.
 * Lignes vides en début et fin ignorées, lignes commençant par `;` ignorées (commentaires).
 * Légende : `#` plein, `=` traversable par le dessous, `.` vide, `P` départ (une seule fois),
 * `G` arrivée d'un parcours (au plus une fois), `e` patrouilleur, `a` araignée (D-46), `o` escargot (D-49), `C` checkpoint, `^` danger qui pique, `!` ronces, qui piquent aussi (D-51, D-56),
 * `b` bois, `t` tissu et `v` feuillage (pleins, D-46), `-` étagère (traversable), `1`-`9` sortie dans un mur latéral,
 * `A` objet de capacité (au plus un, capacité nommée par `; @ability:`), `S` coquille (nommée par
 * `; @shell:`, D-148),
 * `~` eau (une flaque, la mer qui ne se retire jamais, D-95).
 * Les commentaires `; @clé: valeur` sont des métadonnées ; `; @decor:` (répétable) déclare
 * l'habillage (D-28), `; @door:` (répétable) une porte de façade (D-61), `; @cable:` (répétable)
 * un câble pour le crochet du parapluie (D-65), `; @train:` (répétable) une voie ferrée (D-66).
 */
export function parseAsciiLevel(id: string, text: string): LevelData {
  const rows: { text: string; line: number }[] = [];
  const meta: Record<string, string> = {};
  const decor: LevelDecor[] = [];
  const doors: LevelDoor[] = [];
  const cableTiles: number[][] = [];
  const trains: LevelTrain[] = [];
  /** Noms et intentions des coquilles (D-148), par tuile `col,ligne`. */
  const shellNames = new Map<string, { name: string; intent: ShellIntent | undefined }>();
  const hides: LevelHide[] = [];
  let chaseEnd = -1;
  let chaseDir = 'up' as ChaseDir;
  let chaseLook = 'default' as ChaseLook;
  const chasePhases: { until: number; speed: number }[] = [];
  const chaseTrips: { col: number; row: number; width: number; height: number }[] = [];
  let tideRows = null as { low: number; high: number } | null;
  const seas: TileRect[] = [];
  const rises: TileRect[] = [];
  const legs: LevelLeg[] = [];
  const sweeps: TileRect[] = [];
  const shiftZones: { present: TileRect[]; memory: TileRect[] } = { present: [], memory: [] };
  const eraseRects: { id: string; mask: LayerMask; rect: TileRect }[] = [];
  const eraseSteps: string[][] = [];
  const eraseSpeeds: { flag: string; scale: number }[] = [];
  let eraseUntil = '';
  let eraseLook = '';
  text.split('\n').forEach((raw, index) => {
    const line = raw.replace(/\r$/, '').trimEnd();
    if (!line.startsWith(COMMENT)) {
      rows.push({ text: line, line: index + 1 });
      return;
    }
    const match = META.exec(line);
    if (match?.[1] === 'decor' && match[2] !== undefined) {
      const d = DECOR.exec(match[2].trim());
      if (!d?.[1]) {
        throw new Error(
          `Niveau ${id}, ligne ${index + 1} : @decor attend « nom col ligne largeur hauteur »`,
        );
      }
      const [col, row, width, height] = d.slice(2, 6).map(Number);
      decor.push({
        kind: d[1],
        col: col ?? 0,
        row: row ?? 0,
        width: width ?? 0,
        height: height ?? 0,
      });
    } else if (match?.[1] === 'door' && match[2] !== undefined) {
      const d = DOOR.exec(match[2].trim());
      if (!d) {
        throw new Error(`Niveau ${id}, ligne ${index + 1} : @door attend « numéro col ligne »`);
      }
      doors.push({ id: Number(d[1]), col: Number(d[2]), row: Number(d[3]) });
    } else if (match?.[1] === 'shell' && match[2] !== undefined) {
      const m = SHELL.exec(match[2].trim());
      if (!m?.[1]) {
        throw new Error(`Niveau ${id}, ligne ${index + 1} : @shell attend « nom col ligne »`);
      }
      const at = `${m[2] ?? ''},${m[3] ?? ''}`;
      const name = m[1];
      if (shellNames.has(at) || [...shellNames.values()].some((s) => s.name === name)) {
        throw new Error(`Niveau ${id}, ligne ${index + 1} : @shell ${name} en double`);
      }
      const words = (m[4] ?? '')
        .trim()
        .split(/\s+/)
        .filter((w) => w !== '');
      shellNames.set(at, { name, intent: parseShellIntent(id, index + 1, name, words) });
    } else if (match?.[1] === 'hide' && match[2] !== undefined) {
      const h = HIDE.exec(match[2].trim());
      if (!h?.[1]) {
        throw new Error(
          `Niveau ${id}, ligne ${index + 1} : @hide attend « dessin col ligne largeur hauteur »`,
        );
      }
      const [col, row, width, height] = h.slice(2, 6).map(Number);
      hides.push({
        kind: h[1],
        col: col ?? 0,
        row: row ?? 0,
        width: width ?? 0,
        height: height ?? 0,
      });
    } else if (match?.[1] === 'cable' && match[2] !== undefined) {
      const c = CABLE.exec(match[2].trim());
      if (!c) {
        throw new Error(
          `Niveau ${id}, ligne ${index + 1} : @cable attend « col1 ligne1 col2 ligne2 »`,
        );
      }
      cableTiles.push(c.slice(1, 5).map(Number));
    } else if (match?.[1] === 'train' && match[2] !== undefined) {
      const t = TRAIN.exec(match[2].trim());
      if (!t) {
        throw new Error(`Niveau ${id}, ligne ${index + 1} : @train attend « ligne left|right »`);
      }
      trains.push({ row: Number(t[1]), dir: t[2] === 'left' ? -1 : 1 });
    } else if (match?.[1] === 'tide' && match[2] !== undefined) {
      const t = TIDE.exec(match[2].trim());
      if (!t || tideRows) {
        throw new Error(
          `Niveau ${id}, ligne ${index + 1} : @tide attend « basse haute » (une fois)`,
        );
      }
      tideRows = { low: Number(t[1]), high: Number(t[2]) };
    } else if (match?.[1] === 'sweep' && match[2] !== undefined) {
      const r = RECT.exec(match[2].trim());
      if (!r) {
        throw new Error(`Niveau ${id}, ligne ${index + 1} : @sweep attend « col ligne l h »`);
      }
      const [col = 0, row = 0, w = 0, h = 0] = r.slice(1, 5).map(Number);
      sweeps.push({ col, row, width: w, height: h });
    } else if ((match?.[1] === 'sea' || match?.[1] === 'rise') && match[2] !== undefined) {
      const r = RECT.exec(match[2].trim());
      if (!r) {
        throw new Error(`Niveau ${id}, ligne ${index + 1} : @${match[1]} attend « col ligne l h »`);
      }
      const [col = 0, row = 0, w = 0, h = 0] = r.slice(1, 5).map(Number);
      (match[1] === 'sea' ? seas : rises).push({ col, row, width: w, height: h });
    } else if (match?.[1] === 'erase' && match[2] !== undefined) {
      const z = ERASE.exec(match[2].trim());
      const mask = z ? maskOf(z[2] ?? '') : null;
      if (!z || mask === null) {
        throw new Error(
          `Niveau ${id}, ligne ${index + 1} : @erase attend « groupe present|memory|both|none col ligne l h »`,
        );
      }
      const [col = 0, row = 0, w = 0, h = 0] = z.slice(3, 7).map(Number);
      eraseRects.push({ id: z[1] ?? '', mask, rect: { col, row, width: w, height: h } });
    } else if (match?.[1] === 'erase-step' && match[2] !== undefined) {
      const z = ERASE_STEP.exec(match[2].trim());
      if (!z) {
        throw new Error(
          `Niveau ${id}, ligne ${index + 1} : @erase-step attend « groupe[,groupe] »`,
        );
      }
      eraseSteps.push((z[1] ?? '').split(',').map((g) => g.trim()));
    } else if (match?.[1] === 'erase-speed' && match[2] !== undefined) {
      const z = ERASE_SPEED.exec(match[2].trim());
      if (!z) {
        throw new Error(`Niveau ${id}, ligne ${index + 1} : @erase-speed attend « étape facteur »`);
      }
      eraseSpeeds.push({ flag: z[1] ?? '', scale: Number(z[2]) });
    } else if (match?.[1] === 'erase-until' && match[2] !== undefined) {
      const z = ERASE_UNTIL.exec(match[2].trim());
      if (!z) {
        throw new Error(`Niveau ${id}, ligne ${index + 1} : @erase-until attend « étape »`);
      }
      eraseUntil = z[1] ?? '';
    } else if (match?.[1] === 'erase-look' && match[2] !== undefined) {
      // La berceuse (D-140) : des étoiles qui s'allument et s'éteignent.
      if (match[2].trim() !== 'stars') {
        throw new Error(`Niveau ${id}, ligne ${index + 1} : @erase-look attend « stars »`);
      }
      eraseLook = 'stars';
    } else if (match?.[1] === 'shift' && match[2] !== undefined) {
      const z = SHIFT.exec(match[2].trim());
      if (!z) {
        throw new Error(
          `Niveau ${id}, ligne ${index + 1} : @shift attend « present|memory col ligne l h »`,
        );
      }
      const [col = 0, row = 0, w = 0, h = 0] = z.slice(2, 6).map(Number);
      shiftZones[z[1] === 'memory' ? 'memory' : 'present'].push({ col, row, width: w, height: h });
    } else if (match?.[1] === 'leg' && match[2] !== undefined) {
      const l = LEG.exec(match[2].trim());
      const words = (l?.[6] ?? '')
        .trim()
        .split(/\s+/)
        .filter((w) => w !== '');
      const needs = words.filter((w) => !LEG_STATES.has(w));
      const tides = words.filter((w) => w === 'high' || w === 'low').length;
      const layerWords = words.filter((w) => w === 'memory' || w === 'present').length;
      if (!l || needs.some((w) => !LEG_NEEDS.has(w)) || tides > 1 || layerWords > 1) {
        throw new Error(
          `Niveau ${id}, ligne ${index + 1} : @leg attend « col,ligne col,ligne difficulté [capacités] [high] [memory] »`,
        );
      }
      const [c1 = 0, r1 = 0, c2 = 0, r2 = 0] = l.slice(1, 5).map(Number);
      legs.push({
        from: { col: c1, row: r1 },
        to: { col: c2, row: r2 },
        difficulty: l[5] as LevelLeg['difficulty'],
        needs,
        tide: words.includes('high') ? 'high' : 'low',
        layer: words.includes('memory') ? 'memory' : 'present',
      });
    } else if (match?.[1]?.startsWith('chase') && match[2] !== undefined) {
      const value = match[2].trim();
      const bad = () =>
        new Error(`Niveau ${id}, ligne ${index + 1} : @${match[1] ?? ''} mal formé (« ${value} »)`);
      if (match[1] === 'chase') {
        const c = CHASE_END.exec(value);
        if (!c) {
          throw bad();
        }
        chaseDir = (c[1] ?? 'up') as ChaseDir;
        chaseEnd = Number(c[2]);
      } else if (match[1] === 'chase-phase') {
        const c = CHASE_PHASE.exec(value);
        if (!c) {
          throw bad();
        }
        chasePhases.push({ until: Number(c[1]), speed: Number(c[2]) });
      } else if (match[1] === 'chase-look') {
        if (value !== 'wave' && value !== 'erasure') {
          throw bad();
        }
        chaseLook = value;
      } else if (match[1] === 'chase-trip') {
        const c = CHASE_TRIP.exec(value);
        if (!c) {
          throw bad();
        }
        const [col, row, width, height] = c.slice(1, 5).map(Number);
        chaseTrips.push({
          col: col ?? 0,
          row: row ?? 0,
          width: width ?? 0,
          height: height ?? 0,
        });
      } else {
        throw bad();
      }
    } else if (match?.[1] !== undefined && match[2] !== undefined) {
      meta[match[1]] = match[2];
    }
  });
  while (rows.length > 0 && rows[0]?.text === '') {
    rows.shift();
  }
  while (rows.length > 0 && rows[rows.length - 1]?.text === '') {
    rows.pop();
  }
  const first = rows[0];
  if (!first) {
    throw new Error(`Niveau ${id} : carte vide`);
  }
  const width = first.text.length;
  const height = rows.length;
  const drawn = new Uint8Array(width * height);
  const materials = new Uint8Array(width * height);
  let spawn: TilePos | undefined;
  let goal: TilePos | null = null;
  const entities: LevelEntity[] = [];
  const exitTiles = new Map<number, TilePos[]>();

  rows.forEach(({ text: rowText, line }, row) => {
    if (rowText.length !== width) {
      throw new Error(
        `Niveau ${id}, ligne ${line} : largeur ${rowText.length} au lieu de ${width}`,
      );
    }
    for (let col = 0; col < width; col++) {
      const char = rowText.charAt(col);
      if (EXIT.test(char)) {
        const id = Number(char);
        exitTiles.set(id, [...(exitTiles.get(id) ?? []), { col, row }]);
        drawn[row * width + col] = Tile.Empty;
        continue;
      }
      const tile = LEGEND[char];
      if (tile === undefined) {
        throw new Error(
          `Niveau ${id}, ligne ${line}, colonne ${col + 1} : caractère « ${char} » inconnu`,
        );
      }
      if (char === SPAWN) {
        if (spawn) {
          throw new Error(`Niveau ${id}, ligne ${line} : plusieurs points de départ`);
        }
        spawn = { col, row };
      } else if (char === GOAL) {
        if (goal) {
          throw new Error(`Niveau ${id}, ligne ${line} : plusieurs arrivées`);
        }
        goal = { col, row };
      }
      const entity = ENTITIES[char];
      const named = entity === EntityType.Shell ? shellNames.get(`${col},${row}`) : undefined;
      if (entity && named !== undefined) {
        entities.push({
          type: entity,
          col,
          row,
          name: named.name,
          ...(named.intent ? { intent: named.intent } : {}),
        });
        shellNames.delete(`${col},${row}`);
      } else if (entity) {
        entities.push({ type: entity, col, row });
      }
      drawn[row * width + col] = tile;
      materials[row * width + col] = MATERIALS[char] ?? Material.Default;
    }
  });

  if (!spawn) {
    throw new Error(`Niveau ${id} : point de départ « ${SPAWN} » manquant`);
  }
  const [orphan] = shellNames;
  if (orphan) {
    const [at, { name }] = orphan;
    throw new Error(
      `Niveau ${id} : @shell ${name} ${at.replace(',', ' ')} sans « S » à cette place`,
    );
  }
  for (const h of hides) {
    if (h.width < 1 || h.height < 1 || h.col + h.width > width || h.row + h.height > height) {
      throw new Error(`Niveau ${id} : @hide ${h.kind} hors de la salle`);
    }
  }
  if (!tideRows && (seas.length > 0 || rises.length > 0)) {
    throw new Error(`Niveau ${id} : @sea et @rise vont de pair avec @tide`);
  }
  let tide: LevelTide | null = null;
  let tiles: Uint8Array = drawn;
  let tileMaterials: Uint8Array = materials;
  let layers: LevelLayers | null = null;
  if (shiftZones.present.length > 0 || shiftZones.memory.length > 0) {
    if (tideRows) {
      throw new Error(`Niveau ${id} : @shift et @tide ne vont pas ensemble`);
    }
    const built = buildLayers(id, width, height, drawn, materials, shiftZones);
    layers = built.layers;
    tiles = built.tiles;
    tileMaterials = built.materials;
  }
  if (tideRows) {
    const built = buildTide(id, width, height, drawn, materials, {
      lowRow: tideRows.low,
      highRow: tideRows.high,
      seas,
      rises,
    });
    tide = built.tide;
    tiles = built.tiles;
  }
  for (const r of sweeps) {
    if (r.width < 1 || r.height < 1 || r.col + r.width > width || r.row + r.height > height) {
      throw new Error(`Niveau ${id} : @sweep ${String(r.col)} ${String(r.row)} hors de la salle`);
    }
  }
  for (const leg of legs) {
    for (const p of [leg.from, leg.to]) {
      if (p.col >= width || p.row >= height) {
        throw new Error(`Niveau ${id} : @leg ${String(p.col)},${String(p.row)} hors de la salle`);
      }
    }
  }
  // Les tuiles d'eau d'une salle (D-95) : l'effacement (D-111) ou le vide de la nuit (D-142).
  if (meta.void !== undefined && meta.void !== 'erasure' && meta.void !== 'night') {
    throw new Error(`Niveau ${id} : @void attend « erasure » ou « night » (« ${meta.void} »)`);
  }
  const abilities = entities.filter((entity) => entity.type === EntityType.Ability).length;
  if (abilities > 1 || (abilities === 1) !== (meta.ability !== undefined)) {
    throw new Error(`Niveau ${id} : un objet « A » va de pair avec « ; @ability: » (un seul)`);
  }
  const exits = [...exitTiles.entries()]
    .sort(([a], [b]) => a - b)
    .map(([exitId, cells]) => exitFromTiles(id, exitId, cells, width));
  for (const d of decor) {
    if (d.width < 1 || d.height < 1 || d.col + d.width > width || d.row + d.height > height) {
      throw new Error(`Niveau ${id} : @decor ${d.kind} hors de la salle`);
    }
  }
  for (const door of doors) {
    if (exits.some((e) => e.id === door.id) || doors.filter((d) => d.id === door.id).length > 1) {
      throw new Error(`Niveau ${id} : porte ${door.id} en double`);
    }
    if (door.col >= width || door.row >= height) {
      throw new Error(`Niveau ${id} : porte ${door.id} hors de la salle`);
    }
  }
  if (chaseEnd >= 0 !== chasePhases.length > 0 || (chaseEnd < 0 && chaseTrips.length > 0)) {
    throw new Error(`Niveau ${id} : @chase va de pair avec au moins une @chase-phase`);
  }
  // Les phases vont dans le sens de la course : lignes décroissantes vers le haut, colonnes
  // croissantes vers la droite, décroissantes vers la gauche.
  const forward = chaseDir === 'right' ? 1 : -1;
  for (let k = 1; k < chasePhases.length; k++) {
    if (((chasePhases[k]?.until ?? 0) - (chasePhases[k - 1]?.until ?? 0)) * forward <= 0) {
      throw new Error(
        chaseDir === 'up'
          ? `Niveau ${id} : les @chase-phase vont de bas en haut`
          : `Niveau ${id} : les @chase-phase vont dans le sens de la poursuite`,
      );
    }
  }
  if (chaseLook === 'wave' && (chaseEnd < 0 || chaseDir === 'up')) {
    throw new Error(`Niveau ${id} : @chase-look: wave va avec une poursuite horizontale`);
  }
  if (chaseLook === 'erasure' && (chaseEnd < 0 || chaseDir !== 'up')) {
    throw new Error(`Niveau ${id} : @chase-look: erasure va avec une poursuite vers le haut`);
  }
  if (chaseEnd >= (chaseDir === 'up' ? height : width)) {
    throw new Error(`Niveau ${id} : @chase ${chaseEnd} hors de la salle`);
  }
  for (const train of trains) {
    if (train.row >= height) {
      throw new Error(`Niveau ${id} : @train ${train.row} hors de la salle`);
    }
  }
  const cables: LevelCable[] = [];
  for (const [c1 = 0, r1 = 0, c2 = 0, r2 = 0] of cableTiles) {
    if (c1 === c2 || Math.max(c1, c2) >= width || Math.max(r1, r2) >= height) {
      throw new Error(`Niveau ${id} : @cable ${c1} ${r1} ${c2} ${r2} vertical ou hors de la salle`);
    }
    const left = c1 < c2;
    cables.push({
      x1: ((left ? c1 : c2) + 0.5) * TILE_SIZE,
      y1: ((left ? r1 : r2) + 0.5) * TILE_SIZE,
      x2: ((left ? c2 : c1) + 0.5) * TILE_SIZE,
      y2: ((left ? r2 : r1) + 0.5) * TILE_SIZE,
    });
  }
  const level: LevelData = {
    id,
    width,
    height,
    tiles,
    spawn,
    goal,
    meta,
    entities,
    materials: tileMaterials,
    exits,
    doors,
    decor,
    cables,
    trains,
    chase:
      chaseEnd >= 0
        ? { dir: chaseDir, end: chaseEnd, phases: chasePhases, trips: chaseTrips, look: chaseLook }
        : null,
    tide,
    layers,
    erase:
      eraseRects.length > 0 || eraseSteps.length > 0
        ? buildErase(id, width, height, {
            rects: eraseRects,
            steps: eraseSteps,
            speeds: eraseSpeeds,
            ...(eraseUntil ? { until: eraseUntil } : {}),
            ...(eraseLook === 'stars' ? { look: 'stars' as const } : {}),
          })
        : null,
    legs,
    sweeps,
    ...(hides.length > 0 ? { hides } : {}),
  };
  checkTide(level);
  const present = presentOf(level);
  checkLayers(present);
  checkErase(present);
  // Avec l'effacement (D-111), la salle se lit à son motif de départ.
  return present.erase ? erasedLevel(present, initialMasks(present.erase)) : present;
}

/** Une sortie : tuiles d'une même colonne de mur latéral, contiguës, au moins 2 de haut. */
function exitFromTiles(
  levelId: string,
  exitId: number,
  cells: TilePos[],
  width: number,
): LevelExit {
  const cols = new Set(cells.map((c) => c.col));
  const rows = cells.map((c) => c.row);
  const col = cells[0]?.col ?? -1;
  const rowMin = Math.min(...rows);
  const rowMax = Math.max(...rows);
  if (cols.size !== 1 || (col !== 0 && col !== width - 1)) {
    throw new Error(
      `Niveau ${levelId} : la sortie ${exitId} doit être dans le mur gauche ou droit`,
    );
  }
  if (rowMax - rowMin + 1 !== cells.length || cells.length < 2) {
    throw new Error(
      `Niveau ${levelId} : la sortie ${exitId} doit être une ouverture continue d'au moins 2 tuiles`,
    );
  }
  return { id: exitId, side: col === 0 ? 'left' : 'right', col, rowMin, rowMax };
}

/** L'intention d'une coquille (D-148), après son nom et sa place ; absente : rien après. */
function parseShellIntent(
  levelId: string,
  line: number,
  name: string,
  words: readonly string[],
): ShellIntent | undefined {
  const [difficulty, ...rest] = words;
  if (difficulty === undefined) {
    return undefined;
  }
  const fail = (why: string): never => {
    throw new Error(`Niveau ${levelId}, ligne ${String(line)} : @shell ${name} : ${why}`);
  };
  if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') {
    return fail(`difficulté « ${difficulty} » inconnue`);
  }
  const needs: string[] = [];
  let growth = false;
  let crawl = false;
  let high = false;
  let from: TilePos | null = null;
  for (let i = 0; i < rest.length; i++) {
    const word = rest[i] ?? '';
    if (LEG_NEEDS.has(word)) {
      needs.push(word);
    } else if (word === 'growth') {
      growth = true;
    } else if (word === 'crawl') {
      crawl = true;
    } else if (word === 'high') {
      high = true;
    } else if (word === 'from') {
      const at = /^(\d+),(\d+)$/.exec(rest[i + 1] ?? '');
      if (!at) {
        return fail('« from » attend « col,ligne »');
      }
      from = { col: Number(at[1]), row: Number(at[2]) };
      i++;
    } else {
      return fail(`« ${word} » inconnu`);
    }
  }
  return { difficulty, needs, growth, crawl, from, high };
}
