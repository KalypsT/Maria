import {
  DECOR_KINDS,
  LAMP_LIGHT_RADIUS,
  WALL_STYLES,
  type WallStyle,
  MOON_LIGHT_RADIUS,
  type ArtPalette,
  type ArtFinish,
} from '../../config/art';
import { TILE_SIZE as T } from '../../config/display';
import {
  EntityType,
  Tile,
  tileAt,
  type LevelData,
  type LevelDecor,
} from '../../core/level/LevelData';
import { floatingDecor } from '../../core/level/decor';
import { gardenDrawers } from './gardenArt';
import { playgroundDrawers } from './playgroundArt';
import { drawPencils, schoolDrawers } from './schoolArt';
import { drawRubble, shopSiteDrawers } from './shopSiteArt';
import { drawUmbrellaTips, stationDrawers } from './stationArt';
import { streetDrawers } from './streetArt';
import { drawMemory } from './memoryArt';
import { livingDrawers } from './livingArt';
import { paperGrainPattern } from './paperGrain';

/**
 * Dessin d'une salle habillée (D-28) avec l'API Canvas : fond et meubles sous les personnages,
 * lumière (obscurité percée, halos, liserés des surfaces praticables) au-dessus. Coordonnées en
 * pixels logiques : l'appelant fixe l'échelle et le décalage du bloc dessiné. Appelé au chargement
 * d'une salle seulement, jamais par image.
 */
export interface ArtContext {
  readonly ctx: CanvasRenderingContext2D;
  readonly level: LevelData;
  readonly palette: Readonly<ArtPalette>;
  /** Images fournies (nom d'élément → image) qui remplacent le dessin par code. */
  readonly images: ReadonlyMap<string, CanvasImageSource>;
  /**
   * Bloc en cours de dessin (px logiques, D-60) : les éléments de décor loin de lui sont sautés.
   * Absent : toute la salle.
   */
  readonly clip?: Rect;
}

/** Débord possible d'un élément de décor hors de ses tuiles (ombres, feuillage, halos). */
const DECOR_OVERHANG = 4 * T;

function decorVisible(r: Rect, clip: Rect | undefined): boolean {
  return (
    !clip ||
    (r.x < clip.x + clip.w + DECOR_OVERHANG &&
      r.x + r.w > clip.x - DECOR_OVERHANG &&
      r.y < clip.y + clip.h + DECOR_OVERHANG &&
      r.y + r.h > clip.y - DECOR_OVERHANG)
  );
}

export type Rect = { x: number; y: number; w: number; h: number };

function rect(d: LevelDecor): Rect {
  return { x: d.col * T, y: d.row * T, w: d.width * T, h: d.height * T };
}

function rounded(ctx: CanvasRenderingContext2D, r: Rect, radius: number | number[]): void {
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, radius);
}

/** Ligne du sol : première ligne de la bande pleine du bas de la salle. */
export function floorRow(level: LevelData): number {
  let row = level.height;
  while (row > 0) {
    let full = true;
    for (let col = 0; col < level.width && full; col++) {
      const tile = tileAt(level, col, row - 1);
      // Les dangers posés dans le sol (briques de jeu) font partie du sol.
      full = tile === Tile.Solid || tile === Tile.Hazard || tile === Tile.Thorns;
    }
    if (!full) {
      break;
    }
    row--;
  }
  return row;
}

/** Meuble en bois : volume arrondi, rehaut clair en haut, ombre en bas (sauf en silhouette). */
function woodBlock(a: ArtContext, r: Rect, radius = 3): void {
  const { ctx, palette: p } = a;
  ctx.fillStyle = p.wood;
  rounded(ctx, r, radius);
  ctx.fill();
  if (p.silhouettes) {
    return;
  }
  ctx.fillStyle = p.woodLight;
  rounded(ctx, { x: r.x, y: r.y, w: r.w, h: Math.min(3, r.h) }, [radius, radius, 0, 0]);
  ctx.fill();
  if (r.h > 8) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    rounded(ctx, { x: r.x, y: r.y + r.h - 3, w: r.w, h: 3 }, [0, 0, radius, radius]);
    ctx.fill();
  }
}

/**
 * Meuble dessiné d'après ses tuiles pleines ou traversables (forme exacte de la collision) :
 * aplat, rehaut sur les bords du haut, ombre sur ceux du bas, coins adoucis.
 */
function tileShape(
  a: ArtContext,
  r: Rect,
  fill: string,
  light: string,
  shade = 'rgba(0,0,0,0.2)',
): void {
  const { ctx, level, palette: p } = a;
  const col0 = r.x / T;
  const row0 = r.y / T;
  const inside = (col: number, row: number) => {
    if (col < col0 || row < row0 || col >= col0 + r.w / T || row >= row0 + r.h / T) {
      return false;
    }
    const tile = tileAt(level, col, row);
    return tile === Tile.Solid || tile === Tile.OneWay;
  };
  for (let row = row0; row < row0 + r.h / T; row++) {
    for (let col = col0; col < col0 + r.w / T; col++) {
      if (!inside(col, row)) {
        continue;
      }
      const x = col * T;
      const y = row * T;
      const oneWay = tileAt(level, col, row) === Tile.OneWay;
      const up = inside(col, row - 1);
      const down = inside(col, row + 1);
      const left = inside(col - 1, row);
      const right = inside(col + 1, row);
      const radius = [
        !up && !left ? 3 : 0,
        !up && !right ? 3 : 0,
        !down && !right ? 3 : 0,
        !down && !left ? 3 : 0,
      ];
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(x, y, T, oneWay ? 4 : T, radius);
      ctx.fill();
      if (p.silhouettes) {
        continue;
      }
      if (!up) {
        ctx.fillStyle = light;
        ctx.fillRect(x + (left ? 0 : 1), y, T - (left ? 0 : 1) - (right ? 0 : 1), 2.5);
      }
      if (!down && !oneWay) {
        ctx.fillStyle = shade;
        ctx.fillRect(x, y + T - 2.5, T, 2.5);
      }
    }
  }
}

const wood = (a: ArtContext, r: Rect) => {
  tileShape(a, r, a.palette.wood, a.palette.woodLight);
};

const fabric = (a: ArtContext, r: Rect) => {
  tileShape(a, r, a.palette.fabric, a.palette.fabricLight);
};

/** Vue peinte dans une fenêtre (monde étrange) : ciel, lune, étoiles, spirale. */
function windowView(ctx: CanvasRenderingContext2D, p: Readonly<ArtPalette>, r: Rect): void {
  const sky = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  sky.addColorStop(0, p.night);
  sky.addColorStop(1, p.nightLow);
  ctx.fillStyle = sky;
  rounded(ctx, r, 3);
  ctx.fill();
  ctx.fillStyle = p.moon;
  ctx.beginPath();
  ctx.arc(r.x + r.w * 0.72, r.y + r.h * 0.3, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < (p.stars ? 12 : 0); i++) {
    ctx.fillRect(r.x + ((i * 37) % r.w), r.y + ((i * 23) % (r.h - 6)) + 3, 1, 1);
  }
  if (p.silhouettes) {
    ctx.strokeStyle = p.moon;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let t = 0; t < 12; t += 0.2) {
      ctx.lineTo(r.x + r.w * 0.3 + Math.cos(t) * t * 1.5, r.y + r.h * 0.65 + Math.sin(t) * t * 1.5);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

/** Linge d'un fil (D-73) : pince en (`x`, `y`), couleur, grand (pyjama) ou chaussette. */
export interface LaundryItem {
  readonly x: number;
  readonly y: number;
  readonly color: string;
  readonly big: boolean;
}

/** Le linge pendu à un fil à linge (le fil pend un peu au milieu). */
export function clotheslineItems(r: Rect): LaundryItem[] {
  const colors = ['#f19bb5', '#9fc0e8', '#e6c27a', '#f1a9bd', '#7fa37a'];
  const count = Math.max(3, Math.floor(r.w / 24));
  const items: LaundryItem[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    items.push({
      x: r.x + t * r.w,
      y: r.y + 2 + 5 * 4 * t * (1 - t),
      color: colors[i % colors.length] ?? '#f19bb5',
      big: i % 3 === 1,
    });
  }
  return items;
}

/** Une pièce de linge, pince à l'origine. */
export function drawLaundryItem(
  ctx: CanvasRenderingContext2D,
  item: LaundryItem,
  p: Readonly<ArtPalette>,
): void {
  ctx.fillStyle = p.silhouettes ? p.wood : item.color;
  if (item.big) {
    rounded(ctx, { x: -6, y: 0, w: 12, h: 14 }, 3);
  } else {
    rounded(ctx, { x: -2.5, y: 0, w: 5, h: 11 }, [1, 1, 3, 3]);
    ctx.fill();
    rounded(ctx, { x: -2.5, y: 8, w: 8, h: 4 }, 2);
  }
  ctx.fill();
  ctx.fillStyle = '#c79d6f';
  ctx.fillRect(-1, -2, 2, 3);
}

const DRAWERS: Readonly<Record<string, (a: ArtContext, r: Rect) => void>> = {
  ...gardenDrawers({ tileShape, rounded }),
  ...streetDrawers({ tileShape, rounded }),
  ...playgroundDrawers({ tileShape, rounded }),
  ...shopSiteDrawers({ tileShape, rounded }),
  ...schoolDrawers({ tileShape, rounded }),
  ...stationDrawers({ tileShape, rounded }),
  ...livingDrawers({ tileShape, rounded }),
  console(a, r) {
    wood(a, r);
    if (!a.palette.silhouettes) {
      a.ctx.fillStyle = '#7fa37a';
      rounded(a.ctx, { x: r.x + r.w / 2 - 4, y: r.y - 9, w: 8, h: 9 }, 3);
      a.ctx.fill();
    }
  },
  basket(a, r) {
    tileShape(
      a,
      r,
      a.palette.silhouettes ? a.palette.wood : '#b99a6b',
      a.palette.silhouettes ? a.palette.wood : '#d6b98a',
    );
    if (a.palette.silhouettes) {
      return;
    }
    const { ctx } = a;
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let x = r.x + 4; x < r.x + r.w; x += 5) {
      ctx.beginPath();
      ctx.moveTo(x, r.y + 3);
      ctx.lineTo(x, r.y + r.h - 2);
      ctx.stroke();
    }
    ctx.fillStyle = a.palette.linen;
    rounded(ctx, { x: r.x + 4, y: r.y - 4, w: r.w - 8, h: 6 }, 3);
    ctx.fill();
  },
  bench: wood,
  wallshelf(a, r) {
    wood(a, r);
    a.ctx.fillStyle = a.palette.woodDark;
    a.ctx.fillRect(r.x + 3, r.y + T - 2, 2, 5);
    a.ctx.fillRect(r.x + r.w - 5, r.y + T - 2, 2, 5);
  },
  ledge: wood,
  stairs(a, r) {
    const p = a.palette;
    tileShape(a, r, p.woodDark, p.woodLight, 'rgba(0,0,0,0.25)');
    if (p.silhouettes) {
      return;
    }
    // Contremarches plus claires : une bande sous chaque nez de marche.
    const { ctx, level } = a;
    ctx.fillStyle = 'rgba(255,230,190,0.08)';
    for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        if (tileAt(level, col, row) === Tile.Solid && tileAt(level, col, row - 1) !== Tile.Solid) {
          ctx.fillRect(col * T, row * T + 3, T, 4);
          break;
        }
      }
    }
  },
  landing: wood,
  buffet(a, r) {
    wood(a, r);
    if (a.palette.silhouettes) {
      return;
    }
    const { ctx } = a;
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 4, r.y + 6, r.w - 8, r.h - 12);
    ctx.fillStyle = '#f2c879';
    ctx.fillRect(r.x + r.w / 2 - 2, r.y + r.h / 2, 4, 1.5);
  },
  trunk(a, r) {
    tileShape(
      a,
      r,
      a.palette.silhouettes ? a.palette.wood : '#6f4f3a',
      a.palette.silhouettes ? a.palette.wood : '#8f6a4c',
    );
    if (a.palette.silhouettes) {
      return;
    }
    const { ctx } = a;
    ctx.fillStyle = '#c9a46b';
    ctx.fillRect(r.x + 5, r.y, 2, r.h);
    ctx.fillRect(r.x + r.w - 7, r.y, 2, r.h);
    ctx.fillRect(r.x + r.w / 2 - 2, r.y + 6, 4, 4);
  },
  boxes(a, r) {
    tileShape(
      a,
      r,
      a.palette.silhouettes ? a.palette.wood : '#b08a5c',
      a.palette.silhouettes ? a.palette.wood : '#caa577',
    );
    if (a.palette.silhouettes) {
      return;
    }
    const { ctx } = a;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(r.x, r.y + r.h / 2, r.w, 1.5);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(r.x + r.w / 2 - 1, r.y, 2, r.h / 2);
    ctx.fillRect(r.x + r.w / 2 - 1, r.y + r.h / 2 + 2, 2, r.h / 2 - 2);
  },
  rolledrug(a, r) {
    tileShape(
      a,
      r,
      a.palette.silhouettes ? a.palette.wood : '#a0566a',
      a.palette.silhouettes ? a.palette.wood : '#c07a8c',
    );
    if (!a.palette.silhouettes) {
      a.ctx.fillStyle = '#e6c27a';
      for (let x = r.x + 6; x < r.x + r.w; x += 12) {
        a.ctx.beginPath();
        a.ctx.arc(x, r.y + T / 2 + 1, 2.5, 0, Math.PI * 2);
        a.ctx.fill();
      }
    }
  },
  beam: wood,
  skylight(a, r) {
    const { ctx, palette: p } = a;
    ctx.fillStyle = p.wood;
    rounded(ctx, { x: r.x - 3, y: r.y - 9, w: r.w + 6, h: T + 9 }, 3);
    ctx.fill();
    if (seesOutside(p)) {
      // Vitre transparente : la vue du dehors est un plan lointain (D-72).
      ctx.clearRect(r.x, r.y - 6, r.w, T + 2);
    } else {
      const sky = ctx.createLinearGradient(0, r.y - 6, 0, r.y + T);
      sky.addColorStop(0, p.night);
      sky.addColorStop(1, p.nightLow);
      ctx.fillStyle = sky;
      ctx.fillRect(r.x, r.y - 6, r.w, T + 2);
      ctx.fillStyle = p.moon;
      ctx.beginPath();
      ctx.arc(r.x + r.w * 0.7, r.y - 1, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = p.wood;
    ctx.fillRect(r.x + r.w / 2 - 1, r.y - 6, 2, T + 2);
  },
  sofa(a, r) {
    fabric(a, r);
    if (a.palette.silhouettes) {
      return;
    }
    const { ctx } = a;
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x = r.x + r.w / 3; x < r.x + r.w - 4; x += r.w / 3) {
      ctx.fillRect(x, r.y + 3, 1.5, T - 4);
    }
    ctx.fillStyle = '#e6c27a';
    rounded(ctx, { x: r.x + 6, y: r.y - 6, w: 10, h: 8 }, 3);
    ctx.fill();
  },
  fridge(a, r) {
    // Frigo : grand bloc clair, poignées, magnets (et le dessin de Céleste).
    const p = a.palette;
    tileShape(a, r, p.silhouettes ? p.wood : '#e8ecef', p.silhouettes ? p.wood : '#f7f9fa');
    if (p.silhouettes) {
      return;
    }
    const { ctx } = a;
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(r.x + 2, r.y + r.h * 0.34, r.w - 4, 1.5);
    ctx.fillStyle = '#9aa3ad';
    ctx.fillRect(r.x + r.w - 7, r.y + 8, 2, 12);
    ctx.fillRect(r.x + r.w - 7, r.y + r.h * 0.34 + 8, 2, 20);
    for (const [dx, dy, color] of [
      [8, 28, '#d9788f'],
      [20, 34, '#e6c27a'],
      [12, 44, '#4f6f8f'],
    ] as const) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(r.x + dx, r.y + r.h * 0.34 + dy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fdf8ee';
    ctx.fillRect(r.x + 7, r.y + r.h * 0.34 + 50, 16, 12);
    ctx.strokeStyle = '#d9788f';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 11, r.y + r.h * 0.34 + 55, 7, 5);
  },
  linencabinet(a, r) {
    // Armoire haute et étroite sur quatre pieds fins (on passe dessous), deux portes, des draps
    // pliés qui dépassent en haut.
    const { ctx, palette: p } = a;
    ctx.fillStyle = p.woodDark;
    ctx.fillRect(r.x + 2, r.y + r.h, 2, 3 * T);
    ctx.fillRect(r.x + r.w - 4, r.y + r.h, 2, 3 * T);
    wood(a, r);
    if (p.silhouettes) {
      return;
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 3, r.y + 4, r.w / 2 - 4, r.h - 8);
    ctx.strokeRect(r.x + r.w / 2 + 1, r.y + 4, r.w / 2 - 4, r.h - 8);
    ctx.fillStyle = '#f2c879';
    ctx.fillRect(r.x + r.w / 2 - 3, r.y + r.h / 2, 1.5, 4);
    ctx.fillRect(r.x + r.w / 2 + 1.5, r.y + r.h / 2, 1.5, 4);
  },
  jarshelf(a, r) {
    // Étagère murale et ses bocaux (pâtes, confiture, biscuits).
    DRAWERS.wallshelf?.(a, r);
    if (a.palette.silhouettes) {
      return;
    }
    const { ctx } = a;
    const colors = ['#e6c27a', '#d9788f', '#c79d6f', '#9bc49a'];
    for (let x = r.x + 3, i = 0; x < r.x + r.w - 6; x += 9, i++) {
      const h = 7 + (i % 2) * 2;
      ctx.fillStyle = 'rgba(240,248,255,0.75)';
      rounded(ctx, { x, y: r.y - h, w: 6, h }, 1.5);
      ctx.fill();
      ctx.fillStyle = colors[i % colors.length] ?? '#e6c27a';
      ctx.fillRect(x + 1, r.y - h + 3, 4, h - 4);
      ctx.fillStyle = '#b85f75';
      ctx.fillRect(x, r.y - h - 1, 6, 1.5);
    }
  },
  clothesline(a, r) {
    // Deux piquets plantés dans le sol (le fil ne flotte pas), un fil qui pend un peu, des
    // pinces, des chaussettes et un petit pyjama rose.
    const { ctx, level, palette: p } = a;
    const ground = floorRow(level) * T;
    for (const x of [r.x - 1.5, r.x + r.w - 1.5]) {
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(x, r.y - 3, 3, ground - r.y + 3);
      ctx.fillRect(x - 4, r.y - 3, 11, 2.5);
      if (!p.silhouettes) {
        ctx.fillStyle = 'rgba(255,230,190,0.25)';
        ctx.fillRect(x + 0.5, r.y - 1, 1, ground - r.y);
      }
    }
    ctx.strokeStyle = p.silhouettes ? p.structure : '#8a7b6c';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y + 2);
    ctx.quadraticCurveTo(r.x + r.w / 2, r.y + 7, r.x + r.w, r.y + 2);
    ctx.stroke();
    // Dehors, le linge se balance au vent (D-73) : il est dessiné à part.
    if (p.outdoor && !p.silhouettes) {
      return;
    }
    for (const item of clotheslineItems(r)) {
      ctx.save();
      ctx.translate(item.x, item.y);
      drawLaundryItem(ctx, item, p);
      ctx.restore();
    }
  },
  sofaback(a, r) {
    // Dossier du canapé, derrière l'assise où l'on s'assoit (D-39).
    const p = a.palette;
    const { ctx } = a;
    ctx.fillStyle = p.silhouettes ? p.fabric : p.fabric;
    rounded(ctx, { x: r.x + 4, y: r.y + 2, w: r.w - 8, h: r.h + 6 }, [8, 8, 2, 2]);
    ctx.fill();
    if (p.silhouettes) {
      return;
    }
    ctx.fillStyle = p.fabricLight;
    for (let i = 0; i < 3; i++) {
      const w = (r.w - 16) / 3;
      rounded(ctx, { x: r.x + 8 + i * w, y: r.y + 6, w: w - 3, h: r.h - 2 }, 5);
      ctx.fill();
    }
  },
  rod(a, r) {
    // Tringle du rideau : une barre dorée et ses anneaux.
    const { ctx, palette: p } = a;
    ctx.fillStyle = p.silhouettes ? p.wood : '#c9a45c';
    rounded(ctx, { x: r.x, y: r.y + 1, w: r.w, h: 3 }, 1.5);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r.x + 2, r.y + 2.5, 3, 0, Math.PI * 2);
    ctx.arc(r.x + r.w - 2, r.y + 2.5, 3, 0, Math.PI * 2);
    ctx.fill();
    if (p.silhouettes) {
      return;
    }
    ctx.strokeStyle = '#a8843f';
    ctx.lineWidth = 1;
    for (let x = r.x + 8; x < r.x + r.w - 6; x += 9) {
      ctx.beginPath();
      ctx.arc(x, r.y + 4, 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  },
  pouf(a, r) {
    tileShape(
      a,
      r,
      a.palette.silhouettes ? a.palette.fabric : '#c26a7e',
      a.palette.silhouettes ? a.palette.fabric : '#dd8fa1',
    );
  },
  table: wood,
  chair: wood,
  bookcase(a, r) {
    const { ctx, palette: p } = a;
    // Fond de la bibliothèque, puis étagères et dessus d'après les tuiles.
    ctx.fillStyle = p.silhouettes ? p.structure : 'rgba(60,40,30,0.55)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    tileShape(a, r, p.wood, p.woodLight);
    if (p.silhouettes) {
      return;
    }
    const colors = ['#d9788f', '#4f6f8f', '#e6c27a', '#7fa37a', '#c9823f'];
    for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
      for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
        if (
          tileAt(a.level, col, row) !== Tile.OneWay ||
          tileAt(a.level, col, row - 1) !== Tile.Empty
        ) {
          continue;
        }
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = colors[(col * 3 + row + i) % colors.length] ?? '#d9788f';
          const h = 8 + ((col + i * 2) % 4);
          ctx.fillRect(col * T + 1 + i * 5, row * T - h, 4, h);
        }
      }
    }
  },
  counter(a, r) {
    wood(a, r);
    if (a.palette.silhouettes) {
      return;
    }
    const { ctx } = a;
    ctx.fillStyle = a.palette.linen;
    ctx.fillRect(r.x, r.y, r.w, 3);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let x = r.x + T; x < r.x + r.w - 4; x += 2 * T) {
      ctx.strokeRect(x - T + 3, r.y + 8, 2 * T - 6, r.h - 12);
    }
  },
  cupboard(a, r) {
    wood(a, r);
    if (a.palette.silhouettes) {
      return;
    }
    const { ctx } = a;
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    for (let x = r.x; x < r.x + r.w - 4; x += 3 * T) {
      ctx.strokeRect(x + 3, r.y + 4, Math.min(3 * T, r.x + r.w - x) - 6, r.h - 8);
    }
  },
  hood(a, r) {
    tileShape(
      a,
      r,
      a.palette.silhouettes ? a.palette.wood : '#9aa3ad',
      a.palette.silhouettes ? a.palette.wood : '#c3cbd3',
    );
  },
  machine(a, r) {
    const { ctx, palette: p } = a;
    tileShape(a, r, p.silhouettes ? p.wood : '#dfe3e8', p.silhouettes ? p.wood : '#f4f6f8');
    if (p.silhouettes) {
      return;
    }
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2 + 4;
    ctx.fillStyle = '#9aa3ad';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(r.w, r.h) * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5f79a8';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(r.w, r.h) * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b8bec6';
    ctx.fillRect(r.x + 4, r.y + 4, r.w - 8, 5);
  },
  laundry(a, r) {
    fabric(a, r);
    if (a.palette.silhouettes) {
      return;
    }
    const { ctx } = a;
    const colors = ['#f1a9bd', '#e6c27a', '#f3ead7'];
    colors.forEach((color, i) => {
      ctx.fillStyle = color;
      rounded(ctx, { x: r.x + 3 + i * (r.w / 3), y: r.y + 3 + (i % 2) * 5, w: r.w / 3, h: 6 }, 3);
      ctx.fill();
    });
  },
  lamp(a, r) {
    const { ctx, palette: p } = a;
    ctx.fillStyle = p.silhouettes ? p.structure : p.woodDark;
    ctx.fillRect(r.x + r.w / 2 - 1, r.y + 6, 2, r.h - 6);
    ctx.fillStyle = p.silhouettes ? p.moon : '#ffe2a0';
    rounded(ctx, { x: r.x + 2, y: r.y, w: r.w - 4, h: 8 }, [5, 5, 1, 1]);
    ctx.fill();
  },
  coatrack(a, r) {
    const { ctx, palette: p } = a;
    ctx.fillStyle = p.silhouettes ? p.structure : p.woodDark;
    ctx.fillRect(r.x, r.y + 4, r.w, 3);
    if (p.silhouettes) {
      return;
    }
    const colors = ['#b85f75', '#4f6f8f', '#e6c27a'];
    colors.forEach((color, i) => {
      ctx.fillStyle = color;
      rounded(ctx, { x: r.x + 3 + i * 9, y: r.y + 6, w: 7, h: 14 + (i % 2) * 4 }, 3);
      ctx.fill();
    });
  },
  clock(a, r) {
    const { ctx, palette: p } = a;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    ctx.fillStyle = p.silhouettes ? p.structure : p.woodDark;
    ctx.beginPath();
    ctx.arc(cx, cy, r.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.silhouettes ? p.wainscot : p.linen;
    ctx.beginPath();
    ctx.arc(cx, cy, r.w / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    if (p.silhouettes) {
      // Monde étrange : sans aiguilles dans le décor ; une aiguille animée recule (D-35).
      return;
    }
    ctx.strokeStyle = '#3b3330';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - r.w / 3);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r.w / 4, cy + 1);
    ctx.stroke();
  },
  wardrobe(a, r) {
    woodBlock(a, r, 4);
    if (a.palette.silhouettes) {
      return;
    }
    const { ctx } = a;
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1.2;
    const half = r.w / 2;
    for (const x of [r.x + 4, r.x + half + 2]) {
      ctx.beginPath();
      ctx.roundRect(x, r.y + 8, half - 6, r.h * 0.45, 3);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.roundRect(r.x + 4, r.y + r.h * 0.45 + 14, r.w - 8, r.h * 0.5 - 20, 3);
    ctx.stroke();
    ctx.fillStyle = '#f2c879';
    ctx.beginPath();
    ctx.arc(r.x + half - 3, r.y + r.h * 0.3, 1.6, 0, Math.PI * 2);
    ctx.arc(r.x + half + 3, r.y + r.h * 0.3, 1.6, 0, Math.PI * 2);
    ctx.fill();
  },
  headboard(a, r) {
    woodBlock(a, r, 4);
    if (!a.palette.silhouettes) {
      a.ctx.fillStyle = a.palette.woodLight;
      a.ctx.beginPath();
      a.ctx.arc(r.x + r.w / 2, r.y + 2, 3, 0, Math.PI * 2);
      a.ctx.fill();
    }
  },
  bed(a, r) {
    const { ctx, palette: p } = a;
    const mattress = { x: r.x, y: r.y, w: r.w, h: r.h / 2 };
    woodBlock(a, { x: r.x, y: r.y + r.h / 2, w: r.w, h: r.h / 2 }, 3);
    ctx.fillStyle = p.fabric;
    rounded(ctx, mattress, [6, 6, 2, 2]);
    ctx.fill();
    if (p.silhouettes) {
      return;
    }
    ctx.fillStyle = p.fabricLight;
    rounded(ctx, { x: r.x, y: r.y, w: r.w, h: 3 }, [6, 6, 0, 0]);
    ctx.fill();
    // Couette à carreaux et pan rabattu.
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    for (let x = r.x + 30; x < r.x + r.w - 4; x += 10) {
      for (let y = r.y + 4; y < r.y + r.h / 2 - 4; y += 7) {
        if (((x - r.x) / 10 + (y - r.y) / 7) % 2 < 1) {
          ctx.fillRect(x, y, 5, 3.5);
        }
      }
    }
    ctx.fillStyle = 'rgba(40,50,100,0.35)';
    ctx.fillRect(r.x + 28, r.y + r.h / 2 - 6, r.w - 28, 6);
    // Oreiller.
    ctx.fillStyle = p.linen;
    rounded(ctx, { x: r.x + 3, y: r.y - 3, w: 22, h: 9 }, 4);
    ctx.fill();
  },
  shelf(a, r) {
    const { ctx, palette: p } = a;
    ctx.fillStyle = p.wood;
    rounded(ctx, { x: r.x, y: r.y, w: r.w, h: 3 }, 1);
    ctx.fill();
    ctx.fillStyle = p.woodDark;
    ctx.fillRect(r.x + 4, r.y + 3, 2, 5);
    ctx.fillRect(r.x + r.w - 6, r.y + 3, 2, 5);
    if (p.silhouettes) {
      return;
    }
    // Quelques livres debout au bord gauche.
    const colors = ['#d9788f', '#4f6f8f', '#e6c27a'];
    colors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(r.x + 2 + i * 5, r.y - 9 + (i % 2) * 2, 4, 9 - (i % 2) * 2);
    });
  },
  toybox(a, r) {
    const { ctx, palette: p } = a;
    ctx.fillStyle = p.toy;
    rounded(ctx, r, 4);
    ctx.fill();
    if (p.silhouettes) {
      return;
    }
    ctx.fillStyle = p.toyLight;
    rounded(ctx, { x: r.x - 1, y: r.y, w: r.w + 2, h: 5 }, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    star(ctx, r.x + r.w / 2, r.y + r.h / 2 + 2, 6);
  },
  stool(a, r) {
    woodBlock(a, { x: r.x, y: r.y, w: r.w, h: 5 }, 2);
    a.ctx.fillStyle = a.palette.wood;
    a.ctx.fillRect(r.x + 3, r.y + 5, 3, r.h - 5);
    a.ctx.fillRect(r.x + r.w - 6, r.y + 5, 3, r.h - 5);
  },
  desk(a, r) {
    const { ctx, palette: p } = a;
    woodBlock(a, { x: r.x, y: r.y, w: r.w, h: 6 }, 2);
    woodBlock(a, { x: r.x + 1, y: r.y + T, w: 2 * T - 2, h: r.h - T }, 3);
    woodBlock(a, { x: r.x + r.w - T + 4, y: r.y + T, w: T - 8, h: r.h - T }, 2);
    if (p.silhouettes) {
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let i = 1; i < 3; i++) {
      ctx.fillRect(r.x + 3, r.y + T + i * ((r.h - T) / 3), 2 * T - 6, 1.5);
    }
    ctx.fillStyle = '#f2c879';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(r.x + T - 3, r.y + T + i * ((r.h - T) / 3) + 7, 6, 2);
    }
    // Feuille, pot à crayons.
    ctx.save();
    ctx.translate(r.x + 3 * T, r.y - 1);
    ctx.rotate(-0.07);
    ctx.fillStyle = p.linen;
    ctx.fillRect(0, -2, 22, 3);
    ctx.restore();
    ctx.fillStyle = '#4f6f8f';
    rounded(ctx, { x: r.x + r.w - 20, y: r.y - 10, w: 8, h: 10 }, 2);
    ctx.fill();
    ctx.fillStyle = '#d9788f';
    ctx.fillRect(r.x + r.w - 18, r.y - 15, 1.5, 6);
    ctx.fillStyle = '#e6c27a';
    ctx.fillRect(r.x + r.w - 15, r.y - 16, 1.5, 7);
  },
  books(a, r) {
    const { ctx, palette: p } = a;
    const colors = p.silhouettes ? [p.wood, p.wood, p.wood] : ['#4f6f8f', '#d9788f', '#e6c27a'];
    const h = r.h / 3;
    colors.forEach((color, i) => {
      const inset = i * 3;
      ctx.fillStyle = color;
      rounded(ctx, { x: r.x + inset, y: r.y + r.h - (i + 1) * h, w: r.w - inset - 1, h: h - 1 }, 2);
      ctx.fill();
      if (!p.silhouettes) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(r.x + inset + 2, r.y + r.h - (i + 1) * h + h / 2 - 1, r.w - inset - 6, 1.5);
      }
    });
  },
  window(a, r) {
    const { ctx, palette: p } = a;
    ctx.fillStyle = p.silhouettes ? p.structure : p.linen;
    rounded(ctx, { x: r.x - 4, y: r.y - 4, w: r.w + 8, h: r.h + 8 }, 5);
    ctx.fill();
    if (seesOutside(p)) {
      // Vitre transparente : la vue du dehors est un plan lointain (D-72).
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    } else {
      windowView(ctx, p, r);
    }
    ctx.fillStyle = p.silhouettes ? p.structure : p.linen;
    ctx.fillRect(r.x + r.w / 2 - 1.5, r.y, 3, r.h);
    ctx.fillRect(r.x, r.y + r.h / 2 - 1.5, r.w, 3);
    // Rideaux.
    ctx.fillStyle = p.curtain;
    rounded(ctx, { x: r.x - 12, y: r.y - 8, w: 14, h: r.h + 18 }, 7);
    ctx.fill();
    rounded(ctx, { x: r.x + r.w - 2, y: r.y - 8, w: 14, h: r.h + 18 }, 7);
    ctx.fill();
    if (!p.silhouettes) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(r.x - 9 + i * 4, r.y - 6, 1, r.h + 14);
        ctx.fillRect(r.x + r.w + 1 + i * 4, r.y - 6, 1, r.h + 14);
      }
    }
  },
  frame(a, r) {
    const { ctx, palette: p } = a;
    if (p.silhouettes) {
      // Monde étrange : les cadres penchent (D-35).
      tilted(ctx, r, ((r.x * 7 + r.y * 3) % 5) * 0.09 - 0.2);
    }
    ctx.fillStyle = p.silhouettes ? p.structure : p.linen;
    rounded(ctx, r, 2);
    ctx.fill();
    ctx.fillStyle = p.silhouettes ? p.wood : '#8fb3d9';
    ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    if (!p.silhouettes) {
      ctx.fillStyle = '#5a8f5a';
      ctx.beginPath();
      ctx.moveTo(r.x + 2, r.y + r.h - 2);
      ctx.lineTo(r.x + r.w / 2, r.y + r.h / 2 - 2);
      ctx.lineTo(r.x + r.w - 2, r.y + r.h - 2);
      ctx.fill();
    }
    if (p.silhouettes) {
      ctx.restore();
    }
  },
  photo(a, r) {
    // La photo de famille (souvenir, D-38) : papa, maman, Céleste et le chat.
    const size = Math.min(r.w / 0.92, r.h / 0.72);
    drawMemory(a.ctx, 'photo', r.x + r.w / 2, r.y + r.h / 2, size);
  },
  drawing(a, r) {
    const { ctx, palette: p } = a;
    ctx.save();
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
    ctx.rotate(0.06);
    ctx.fillStyle = p.silhouettes ? p.wainscot : p.linen;
    ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h - 6);
    ctx.strokeStyle = p.silhouettes ? p.moon : '#d9788f';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-r.w / 4, -r.h / 8, r.w / 2, r.h / 4);
    ctx.beginPath();
    ctx.moveTo(-r.w / 4 - 2, -r.h / 8);
    ctx.lineTo(0, -r.h / 3);
    ctx.lineTo(r.w / 4 + 2, -r.h / 8);
    ctx.stroke();
    ctx.fillStyle = '#e0598b';
    ctx.beginPath();
    ctx.arc(0, -r.h / 2 + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
  door(a, r) {
    drawDoor(a, r, false);
  },
  'door-upside'(a, r) {
    drawDoor(a, r, true);
  },
  wallstairs(a, r) {
    // Un escalier qui monte… et entre dans le mur.
    const { ctx, palette: p } = a;
    const steps = Math.max(3, Math.round(r.h / 8));
    const sw = r.w / steps;
    const sh = r.h / steps;
    // Pâle, sans liseré : ce n'est jamais une surface praticable (pilier 1).
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.moveTo(r.x, r.y + r.h);
    for (let i = 0; i < steps; i++) {
      ctx.lineTo(r.x + i * sw, r.y + r.h - (i + 1) * sh);
      ctx.lineTo(r.x + (i + 1) * sw, r.y + r.h - (i + 1) * sh);
    }
    ctx.lineTo(r.x + r.w, r.y + r.h);
    ctx.fill();
    // Le haut se fond dans le mur.
    const fade = ctx.createLinearGradient(r.x + r.w * 0.6, 0, r.x + r.w, 0);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, p.wallTop);
    ctx.fillStyle = fade;
    ctx.fillRect(r.x + r.w * 0.6, r.y, r.w * 0.4 + 1, r.h);
  },
  peel(a, r) {
    // Papier peint qui pèle : des lambeaux qui s'enroulent, le mur nu dessous.
    const { ctx, palette: p } = a;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (let x = r.x; x < r.x + r.w; x += 7) {
      const len = r.h * (0.45 + (((x * 13) % 7) / 7) * 0.55);
      ctx.beginPath();
      ctx.moveTo(x, r.y);
      ctx.lineTo(x + 5, r.y);
      ctx.lineTo(x + 4, r.y + len);
      ctx.lineTo(x + 1, r.y + len - 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = p.silhouettes ? p.wallpaper : 'rgba(255,236,200,0.3)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(x + 3, r.y + len, 2.2, Math.PI * 0.1, Math.PI * 1.3);
      ctx.stroke();
    }
  },
  'giant-chair'(a, r) {
    // Chaise démesurée, en arrière-plan : dossier, assise, pieds.
    const { ctx } = a;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    const leg = Math.max(3, r.w * 0.08);
    const seat = r.y + r.h * 0.55;
    ctx.fillRect(r.x, r.y, leg, r.h);
    ctx.fillRect(r.x + r.w * 0.12, r.y + r.h * 0.08, r.w * 0.05, seat - r.y - r.h * 0.08);
    ctx.fillRect(r.x + r.w * 0.24, r.y + r.h * 0.08, r.w * 0.05, seat - r.y - r.h * 0.08);
    ctx.fillRect(r.x, r.y, r.w * 0.35, leg);
    ctx.fillRect(r.x, seat, r.w, leg * 1.4);
    ctx.fillRect(r.x + r.w - leg, seat, leg, r.y + r.h - seat);
  },
  'giant-pencil'(a, r) {
    const { ctx, palette: p } = a;
    tilted(ctx, r, -0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.moveTo(r.x, r.y + r.h * 0.3);
    ctx.lineTo(r.x + r.w * 0.82, r.y + r.h * 0.3);
    ctx.lineTo(r.x + r.w, r.y + r.h / 2);
    ctx.lineTo(r.x + r.w * 0.82, r.y + r.h * 0.7);
    ctx.lineTo(r.x, r.y + r.h * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = p.silhouettes ? p.wallpaper : 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  },
  'bedroom-window'(a, r) {
    // Fenêtre trop haute qui donne… sur la chambre de Céleste, chaude et lointaine.
    const { ctx, palette: p } = a;
    ctx.fillStyle = p.structure;
    rounded(ctx, { x: r.x - 3, y: r.y - 3, w: r.w + 6, h: r.h + 6 }, 4);
    ctx.fill();
    const inside = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    inside.addColorStop(0, '#3a4470');
    inside.addColorStop(1, '#6a5242');
    ctx.fillStyle = inside;
    rounded(ctx, r, 3);
    ctx.fill();
    const floorY = r.y + r.h * 0.82;
    ctx.fillStyle = '#9a7352';
    ctx.fillRect(r.x + r.w * 0.08, floorY - r.h * 0.3, r.w * 0.22, r.h * 0.3);
    ctx.fillStyle = '#6d86c2';
    ctx.fillRect(r.x + r.w * 0.34, floorY - r.h * 0.09, r.w * 0.5, r.h * 0.09);
    ctx.fillStyle = '#ffcf7a';
    ctx.beginPath();
    ctx.arc(r.x + r.w * 0.78, floorY - r.h * 0.4, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,207,122,0.18)';
    ctx.beginPath();
    ctx.arc(r.x + r.w * 0.78, floorY - r.h * 0.4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.structure;
    ctx.fillRect(r.x + r.w / 2 - 1, r.y, 2, r.h);
    for (let y = r.y + r.h / 3; y < r.y + r.h - 1; y += r.h / 3) {
      ctx.fillRect(r.x, y - 1, r.w, 2);
    }
  },
  'toy-shadow'() {
    // Ombre de l'ours : elle glisse le long du mur, animée par les effets du monde étrange (D-36).
  },
  'narrow-left'(a, r) {
    narrowing(a, r, -1);
  },
  'narrow-right'(a, r) {
    narrowing(a, r, 1);
  },
  eyes() {
    // Animés par les effets du monde étrange (StrangeFxView).
  },
  rug(a, r) {
    const { ctx, palette: p } = a;
    if (p.silhouettes) {
      return;
    }
    ctx.fillStyle = '#b25b6e';
    rounded(ctx, { x: r.x, y: r.y + 3, w: r.w, h: 8 }, 4);
    ctx.fill();
    ctx.strokeStyle = '#e6c27a';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 2]);
    rounded(ctx, { x: r.x + 3, y: r.y + 5, w: r.w - 6, h: 4 }, 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

/**
 * Ombre géante d'un ours en peluche sur le mur (le jouet, lui, n'est nulle part), dans le
 * rectangle `r` (px). Dessinée dans une texture des effets, qui la fait glisser (D-36).
 */
export function drawToyShadow(ctx: CanvasRenderingContext2D, r: Rect): void {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  const cx = r.x + r.w / 2;
  const head = r.w * 0.26;
  ctx.beginPath();
  ctx.arc(cx, r.y + head, head, 0, Math.PI * 2);
  ctx.arc(cx - head * 0.85, r.y + head * 0.3, head * 0.38, 0, Math.PI * 2);
  ctx.arc(cx + head * 0.85, r.y + head * 0.3, head * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, r.y + head * 2 + r.h * 0.22, r.w * 0.36, r.h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - r.w * 0.36, r.y + r.h * 0.5, r.w * 0.12, r.h * 0.08, -0.6, 0, Math.PI * 2);
  ctx.ellipse(cx + r.w * 0.36, r.y + r.h * 0.5, r.w * 0.12, r.h * 0.08, 0.6, 0, Math.PI * 2);
  ctx.ellipse(cx - r.w * 0.2, r.y + r.h * 0.9, r.w * 0.14, r.h * 0.1, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + r.w * 0.2, r.y + r.h * 0.9, r.w * 0.14, r.h * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Ouvre une transformation penchée autour du centre de `r` (à fermer par `ctx.restore()`). */
function tilted(ctx: CanvasRenderingContext2D, r: Rect, angle: number): void {
  ctx.save();
  ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
  ctx.rotate(angle);
  ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
}

/** Porte de la maison (fond) ; `upside` : accrochée au plafond, à l'envers. */
function drawDoor(a: ArtContext, r: Rect, upside: boolean): void {
  const { ctx, palette: p } = a;
  ctx.save();
  if (upside) {
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
    ctx.rotate(Math.PI);
    ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
  }
  ctx.fillStyle = p.structure;
  rounded(ctx, { x: r.x - 2, y: r.y - 2, w: r.w + 4, h: r.h + 2 }, [4, 4, 0, 0]);
  ctx.fill();
  ctx.fillStyle = p.silhouettes ? p.wood : p.woodDark;
  rounded(ctx, r, [3, 3, 0, 0]);
  ctx.fill();
  ctx.strokeStyle = p.silhouettes ? p.wallpaper : 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(r.x + 3, r.y + 4, r.w - 6, r.h * 0.35);
  ctx.strokeRect(r.x + 3, r.y + r.h * 0.5, r.w - 6, r.h * 0.42);
  ctx.fillStyle = p.silhouettes ? p.moon : '#e6c27a';
  ctx.beginPath();
  ctx.arc(r.x + r.w - 5, r.y + r.h * 0.52, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Mur qui se resserre vers le haut (`side` : -1 mur gauche, 1 mur droit). */
function narrowing(a: ArtContext, r: Rect, side: number): void {
  const { ctx, palette: p } = a;
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, p.structure);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  if (side < 0) {
    ctx.moveTo(r.x, r.y);
    ctx.lineTo(r.x + r.w, r.y);
    ctx.quadraticCurveTo(r.x + r.w * 0.2, r.y + r.h * 0.4, r.x, r.y + r.h);
  } else {
    ctx.moveTo(r.x + r.w, r.y);
    ctx.lineTo(r.x, r.y);
    ctx.quadraticCurveTo(r.x + r.w * 0.8, r.y + r.h * 0.4, r.x + r.w, r.y + r.h);
  }
  ctx.closePath();
  ctx.fill();
  // Planches courbées : quelques lignes qui suivent la courbe.
  ctx.strokeStyle = p.wallpaper;
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 4; i++) {
    const k = i / 4;
    ctx.beginPath();
    if (side < 0) {
      ctx.moveTo(r.x + r.w * k, r.y);
      ctx.quadraticCurveTo(r.x + r.w * k * 0.2, r.y + r.h * 0.4, r.x, r.y + r.h * k);
    } else {
      ctx.moveTo(r.x + r.w * (1 - k), r.y);
      ctx.quadraticCurveTo(r.x + r.w * (1 - k * 0.2), r.y + r.h * 0.4, r.x + r.w, r.y + r.h * k);
    }
    ctx.stroke();
  }
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? radius : radius * 0.45;
    ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }
  ctx.fill();
}

function wallStyle(level: LevelData): WallStyle {
  const style = level.meta.wall;
  return WALL_STYLES.find((s) => s === style) ?? 'dots';
}

/** Motif du mur au-dessus du lambris, selon la salle. */
function drawWallpaper(
  ctx: CanvasRenderingContext2D,
  p: Readonly<ArtPalette>,
  style: WallStyle,
  width: number,
  bottom: number,
): void {
  ctx.fillStyle = p.wallpaper;
  ctx.strokeStyle = p.wallpaper;
  ctx.lineWidth = 1;
  if (style === 'stripes') {
    for (let x = 0; x < width; x += 12) {
      ctx.fillRect(x, 0, 4, bottom);
    }
  } else if (style === 'planks') {
    // Planches verticales, quelques nœuds.
    for (let x = 0; x < width; x += 14) {
      ctx.fillRect(x, 0, 1.2, bottom);
      if ((x / 14) % 3 === 1) {
        ctx.beginPath();
        ctx.ellipse(x + 7, ((x * 37) % Math.max(1, bottom - 20)) + 10, 1.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (style === 'tiles') {
    for (let y = 0; y < bottom; y += 12) {
      ctx.fillRect(0, y, width, 1);
    }
    for (let x = 0; x < width; x += 12) {
      ctx.fillRect(x, 0, 1, bottom);
    }
  } else {
    for (let y = 10; y < bottom - 4; y += 18) {
      for (let x = (y / 18) % 2 < 1 ? 6 : 15; x < width; x += 18) {
        ctx.beginPath();
        ctx.ellipse(x, y, 1.4, 2.4, 0.5, 0, Math.PI * 2);
        ctx.ellipse(x + 2, y + 2, 1.4, 2.4, -0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/**
 * Plans du décor (D-71) : ciel (plan lointain, D-72), fond lointain (voilé), fond proche, meubles
 * (couche jouable).
 */
type DecorPlane = 'sky' | 'far' | 'back' | 'furniture';

function decorPlane(kind: string): DecorPlane {
  const known = DECOR_KINDS[kind];
  if (known?.furniture) {
    return 'furniture';
  }
  if (known?.sky) {
    return 'sky';
  }
  return known?.far ? 'far' : 'back';
}

/** Éléments du ciel (le soleil), dessinés dans le plan du ciel (D-72). */
export function drawSkyDecor(a: ArtContext): void {
  drawDecor(a, 'sky');
}

/** Éléments de décor d'un plan, dans l'ordre de déclaration ; une image fournie les remplace. */
function drawDecor(a: ArtContext, plane: DecorPlane): void {
  for (const d of a.level.decor) {
    if (decorPlane(d.kind) !== plane) {
      continue;
    }
    const r = rect(d);
    if (!decorVisible(r, a.clip)) {
      continue;
    }
    const image = a.images.get(d.kind);
    if (image) {
      a.ctx.drawImage(image, r.x, r.y, r.w, r.h);
    } else {
      DRAWERS[d.kind]?.(a, r);
    }
  }
}

/**
 * Fond, structure, sol et meubles (sous les personnages). Finition « papier découpé » (D-71) :
 * le fond lointain est voilé ; le fond proche puis la couche jouable sont chacun dessinés sur une
 * feuille à part (`sheet`), posée avec son ombre douce ; ombres de contact ; grain de papier.
 */
export function drawRoomBackground(
  a: ArtContext,
  sheet: HTMLCanvasElement,
  finish: Readonly<ArtFinish>,
): void {
  const { level, palette: p } = a;
  const width = level.width * T;
  const height = level.height * T;
  const floorY = floorRow(level) * T;
  const wainscotY = floorY - 5 * T;
  // Dehors, le ciel et les collines sont des plans lointains (D-72) : le fond reste transparent.
  if (!p.outdoor) {
    drawWall(a, width, height, floorY, wainscotY);
  }
  drawDecor(a, 'far');
  drawVeil(a, floorY, p.veil * finish.veil);
  // Vitres transparentes (D-72) : la vue du dehors est un plan lointain, derrière.
  if (seesOutside(p)) {
    a.ctx.save();
    a.ctx.globalCompositeOperation = 'destination-out';
    // Opaque : la découpe efface tout (sinon elle prendrait l'opacité du dernier remplissage).
    a.ctx.fillStyle = '#000';
    for (const pane of windowPanes(level)) {
      a.ctx.fillRect(pane.x, pane.y, pane.w, pane.h);
    }
    a.ctx.restore();
  }
  // Le fond proche (fenêtres, façades) se pose à peine sur le mur ; la couche jouable, nettement.
  drawSheet(
    a,
    sheet,
    finish.backShadow,
    finish.playShadowX / 2,
    finish.playShadowY / 2,
    finish.playShadowBlur * 0.7,
    (s) => {
      drawDecor(s, 'back');
    },
  );
  if (p.silhouettes) {
    drawFloatingGlow(a);
  }
  drawSheet(
    a,
    sheet,
    finish.playShadow,
    finish.playShadowX,
    finish.playShadowY,
    finish.playShadowBlur,
    (s) => {
      drawStructure(s, floorY);
      drawContactShadows(s, finish.contactShadow);
      drawDecor(s, 'furniture');
    },
  );
  drawPaperGrain(a, sheet, finish.grain);
}

/**
 * Vitres et ciel transparents (D-72) : dans le monde réel, ou dehors (le ciel). Le monde étrange
 * garde ses fenêtres peintes (silhouettes).
 */
export function seesOutside(p: Readonly<ArtPalette>): boolean {
  return p.outdoor || !p.silhouettes;
}

/** Vitres des fenêtres et des lucarnes de la salle (px logiques). */
export function windowPanes(level: LevelData): Rect[] {
  const panes: Rect[] = [];
  for (const d of level.decor) {
    const r = rect(d);
    if (d.kind === 'window') {
      panes.push(r);
    } else if (d.kind === 'skylight') {
      panes.push({ x: r.x, y: r.y - 6, w: r.w, h: T + 2 });
    }
  }
  return panes;
}

/**
 * Perspective atmosphérique (D-71) : le dégradé du mur ou du ciel, posé en transparence sur le
 * fond lointain déjà dessiné.
 */
function drawVeil(a: ArtContext, floorY: number, alpha: number): void {
  if (alpha <= 0) {
    return;
  }
  const { ctx, level, palette: p } = a;
  const veil = ctx.createLinearGradient(0, 0, 0, floorY);
  veil.addColorStop(0, p.wallTop);
  veil.addColorStop(1, p.wallBottom);
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  // Seulement sur ce qui est déjà dessiné : jamais sur le ciel transparent (D-72).
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = veil;
  const clip = a.clip ?? { x: 0, y: 0, w: level.width * T, h: level.height * T };
  ctx.fillRect(clip.x, clip.y, clip.w, clip.h);
  ctx.restore();
}

/**
 * Marge d'une feuille autour du bloc (px logiques) : ce qui dépasse du bloc y projette encore son
 * ombre (pas de coupure nette entre deux blocs). Plus grande que décalage + flou des ombres.
 */
const SHEET_MARGIN = 24;

/**
 * Feuille de papier découpé (D-71) : `draw` dessine sur une toile à part (même transformation,
 * avec une marge), qui est ensuite posée sur le bloc avec une ombre douce (décalage et flou en px
 * logiques). Sans ombre, `draw` dessine directement.
 */
function drawSheet(
  a: ArtContext,
  sheet: HTMLCanvasElement,
  alpha: number,
  dx: number,
  dy: number,
  blur: number,
  draw: (s: ArtContext) => void,
): void {
  const { ctx } = a;
  const sctx = alpha > 0 ? prepareSheet(ctx, sheet) : null;
  if (!sctx) {
    draw(a);
    return;
  }
  draw({ ...a, ctx: sctx });
  const scale = ctx.getTransform().a;
  const margin = Math.round(SHEET_MARGIN * scale);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.shadowColor = `rgba(20,14,24,${String(Math.min(1, alpha))})`;
  ctx.shadowBlur = blur * scale;
  ctx.shadowOffsetX = dx * scale;
  ctx.shadowOffsetY = dy * scale;
  ctx.drawImage(sheet, -margin, -margin);
  ctx.restore();
}

/** Toile vide de la taille du bloc et de sa marge, avec la transformation du bloc. */
function prepareSheet(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLCanvasElement,
): CanvasRenderingContext2D | null {
  const t = ctx.getTransform();
  const margin = Math.round(SHEET_MARGIN * t.a);
  const width = ctx.canvas.width + 2 * margin;
  const height = ctx.canvas.height + 2 * margin;
  if (sheet.width !== width || sheet.height !== height) {
    // Réaffecter la taille vide la toile et remet son état à zéro.
    sheet.width = width;
    sheet.height = height;
  }
  const sctx = sheet.getContext('2d');
  if (!sctx) {
    return null;
  }
  // Toile réutilisée (seconde feuille du bloc) : vidée, état d'origine (`reset()` manque sur
  // d'anciens Safari).
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.clearRect(0, 0, width, height);
  sctx.globalAlpha = 1;
  sctx.globalCompositeOperation = 'source-over';
  sctx.setTransform(t.a, t.b, t.c, t.d, t.e + margin, t.f + margin);
  return sctx;
}

/**
 * Ombres de contact (D-71) : sous chaque meuble, là où il touche vraiment une surface (sa tuile du
 * bas pleine ou traversable, et une tuile pleine ou traversable dessous), une ombre douce qui
 * l'ancre au sol : sous les pieds d'une table, sous tout le canapé.
 */
function drawContactShadows(a: ArtContext, alpha: number): void {
  if (alpha <= 0) {
    return;
  }
  const { ctx, level } = a;
  const solid = (col: number, row: number) => {
    const tile = tileAt(level, col, row);
    return tile === Tile.Solid || tile === Tile.OneWay;
  };
  for (const d of level.decor) {
    if (!(DECOR_KINDS[d.kind]?.furniture ?? false) || !decorVisible(rect(d), a.clip)) {
      continue;
    }
    const bottom = d.row + d.height - 1;
    if (bottom + 1 >= level.height) {
      continue;
    }
    // Suites de colonnes posées.
    let start = -1;
    for (let col = d.col; col <= d.col + d.width; col++) {
      const resting = col < d.col + d.width && solid(col, bottom) && solid(col, bottom + 1);
      if (resting && start < 0) {
        start = col;
      } else if (!resting && start >= 0) {
        contactShadow(ctx, start * T, col * T, (bottom + 1) * T, alpha);
        start = -1;
      }
    }
  }
}

/** Ombre douce sous [x0, x1[, centrée sur la surface `y`. */
function contactShadow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  alpha: number,
): void {
  const cx = (x0 + x1) / 2;
  const rx = (x1 - x0) / 2 + 6;
  const ry = 5;
  const a = Math.min(1, alpha);
  const shadow = ctx.createRadialGradient(cx, y, 0, cx, y, rx);
  shadow.addColorStop(0, `rgba(20,14,24,${String(a)})`);
  shadow.addColorStop(0.7, `rgba(20,14,24,${String(a * 0.6)})`);
  shadow.addColorStop(1, 'rgba(20,14,24,0)');
  ctx.save();
  ctx.translate(cx, y);
  ctx.scale(1, ry / rx);
  ctx.translate(-cx, -y);
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(cx, y, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Grain de papier (D-71) sur tout le bloc, en lumière douce : ni teinte ni contraste changés.
 * S'il reste du transparent (ciel, vitres, D-72), le grain est d'abord découpé à la forme du
 * décor sur la toile de travail : la lumière douce sur du transparent laisserait un voile gris.
 */
function drawPaperGrain(a: ArtContext, sheet: HTMLCanvasElement, alpha: number): void {
  if (alpha <= 0) {
    return;
  }
  const { ctx, level, palette: p } = a;
  const transform = ctx.getTransform();
  const pattern = paperGrainPattern(ctx, transform.a);
  if (!pattern) {
    return;
  }
  const clip = a.clip ?? { x: 0, y: 0, w: level.width * T, h: level.height * T };
  const holes = p.outdoor || (seesOutside(p) && windowPanes(level).length > 0);
  if (!holes) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = pattern;
    ctx.fillRect(clip.x, clip.y, clip.w, clip.h);
    ctx.restore();
    return;
  }
  const { width, height } = ctx.canvas;
  if (sheet.width !== width || sheet.height !== height) {
    sheet.width = width;
    sheet.height = height;
  }
  const sctx = sheet.getContext('2d');
  if (!sctx) {
    return;
  }
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.globalAlpha = 1;
  sctx.globalCompositeOperation = 'copy';
  sctx.drawImage(ctx.canvas, 0, 0);
  sctx.globalCompositeOperation = 'source-in';
  sctx.setTransform(transform);
  sctx.fillStyle = pattern;
  sctx.fillRect(clip.x, clip.y, clip.w, clip.h);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.drawImage(sheet, 0, 0);
  ctx.restore();
}

/** Dedans : mur en dégradé, papier peint, lambris. */
function drawWall(
  a: ArtContext,
  width: number,
  height: number,
  floorY: number,
  wainscotY: number,
): void {
  const { ctx, level, palette: p } = a;
  const wall = ctx.createLinearGradient(0, 0, 0, floorY);
  wall.addColorStop(0, p.wallTop);
  wall.addColorStop(1, p.wallBottom);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);
  drawWallpaper(
    ctx,
    p,
    wallStyle(level),
    width,
    wallStyle(level) === 'dots' || wallStyle(level) === 'stripes' ? wainscotY : floorY,
  );
  const style = wallStyle(level);
  const wainscot = style === 'dots' || style === 'stripes';
  if (wainscot) {
    ctx.fillStyle = p.wainscot;
    ctx.fillRect(0, wainscotY, width, floorY - wainscotY);
    ctx.fillStyle = p.wallpaper;
    ctx.fillRect(0, wainscotY, width, 2);
  }
  if (wainscot && !p.silhouettes) {
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 1;
    for (let x = 12; x < width - 20; x += 30) {
      ctx.strokeRect(x, wainscotY + 7, 22, floorY - wainscotY - 12);
    }
  }
}

/**
 * Monde étrange (D-34) : sous un meuble qui flotte (rien sous lui), une lueur turquoise. Purement
 * visuel et immobile : le dessin reste exactement sur la collision (pilier 1).
 */
function drawFloatingGlow(a: ArtContext): void {
  const { ctx, level, palette: p } = a;
  for (const d of floatingDecor(level)) {
    const r = rect(d);
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h;
    const rx = r.w / 2 + 6;
    const ry = 9;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    glow.addColorStop(0, `rgba(${p.lamp},0.32)`);
    glow.addColorStop(1, `rgba(${p.lamp},0)`);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    ctx.translate(-cx, -cy);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** Murs, plafond, sol en parquet et encadrement des sorties. */
function drawStructure(a: ArtContext, floorY: number): void {
  const { ctx, level, palette: p } = a;
  for (let row = 0; row < level.height; row++) {
    for (let col = 0; col < level.width; col++) {
      const index = row * level.width + col;
      if (level.tiles[index] !== Tile.Solid || level.materials[index] !== 0) {
        continue;
      }
      const x = col * T;
      const y = row * T;
      if (y >= floorY && p.paved) {
        // Trottoir (D-60) : dalles grises, joints, bordure claire en haut.
        ctx.fillStyle = p.floor;
        ctx.fillRect(x, y, T, T);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        if (col % 2 === 0) {
          ctx.fillRect(x, y, 1, T);
        }
        if (y === floorY) {
          ctx.fillStyle = p.floorEdge;
          ctx.fillRect(x, y, T, 4);
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(x, y + 4, T, 1);
        }
      } else if (y >= floorY && p.outdoor) {
        // Terre sous une bande d'herbe.
        ctx.fillStyle = p.floor;
        ctx.fillRect(x, y, T, T);
        if (y === floorY) {
          // Herbe : bande, touffes, et de temps en temps une petite fleur (dehors seulement).
          ctx.fillStyle = p.floorEdge;
          ctx.fillRect(x, y, T, 5);
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.fillRect(x, y + 5, T, 1.5);
          ctx.fillStyle = p.floorEdge;
          for (let k = 0; k < 4; k++) {
            const gx = x + ((col * 7 + k * 5) % 15);
            const gh = 2 + ((col + k * 3) % 3);
            ctx.beginPath();
            ctx.moveTo(gx - 1, y + 1);
            ctx.lineTo(gx, y - gh);
            ctx.lineTo(gx + 1, y + 1);
            ctx.fill();
          }
          if (!p.silhouettes && (col * 13) % 7 === 0) {
            ctx.fillStyle = (col * 5) % 3 === 0 ? '#fff6f0' : '#f2c14e';
            ctx.beginPath();
            ctx.arc(x + 8, y - 2, 1.3, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (!p.silhouettes && (col * 7 + row * 3) % 4 === 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.14)';
          ctx.beginPath();
          ctx.ellipse(x + 5 + ((col * 3) % 7), y + 8, 2, 1.2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (y >= floorY) {
        ctx.fillStyle = p.floor;
        ctx.fillRect(x, y, T, T);
        if (!p.silhouettes && (col * 7 + row * 3) % 5 === 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.fillRect(x, y, 1, T);
        }
      } else {
        ctx.fillStyle = p.structure;
        ctx.fillRect(x, y, T, T);
      }
    }
  }
  ctx.fillStyle = p.floorEdge;
  ctx.fillRect(0, floorY, level.width * T, 3);
  for (let row = 0; row < level.height; row++) {
    for (let col = 0; col < level.width; col++) {
      const index = row * level.width + col;
      const tile = level.tiles[index];
      const x = col * T;
      const y = row * T;
      if (tile === Tile.OneWay && level.materials[index] === 0) {
        // Planche traversable : bois, petite ombre dessous.
        ctx.fillStyle = p.wood;
        ctx.fillRect(x, y, T, 4);
        if (!p.silhouettes) {
          ctx.fillStyle = p.woodLight;
          ctx.fillRect(x, y, T, 1.5);
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.fillRect(x, y + 4, T, 3);
        }
      } else if (tile === Tile.Thorns) {
        if (y >= floorY) {
          ctx.fillStyle = p.floor;
          ctx.fillRect(x, y, T, T);
        }
        drawThorns(ctx, p, x, y >= floorY ? y + 3 : y + T, col);
      } else if (tile === Tile.Hazard) {
        if (y >= floorY) {
          ctx.fillStyle = p.floor;
          ctx.fillRect(x, y, T, T);
        }
        if (level.meta.hazard === 'pencils') {
          // Pointes de crayons de l'école étrange (D-64).
          drawPencils(ctx, x, y, col, y >= floorY);
          continue;
        }
        if (level.meta.hazard === 'rubble') {
          // Gravats du chantier (D-63).
          drawRubble(ctx, x, y, col, y >= floorY);
          continue;
        }
        if (level.meta.hazard === 'umbrellas') {
          // Pointes de parapluies perdus, du monde étrange de la gare (D-68).
          drawUmbrellaTips(ctx, x, y, col, y >= floorY);
          continue;
        }
        if (p.outdoor) {
          drawNettles(ctx, p, x, y, col, y >= floorY);
          continue;
        }
        // Briques de jeu éparpillées (danger, sans violence).
        const colors = p.silhouettes ? [p.rim] : ['#d9788f', '#4f6f8f', '#e6c27a', '#7fa37a'];
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = colors[(col + i) % colors.length] ?? '#d9788f';
          const bx = x + 1 + i * 5;
          // Dans le sol : posées à la surface ; ailleurs : au bas de la tuile.
          const base = y >= floorY ? y + 4 : y + T - 5;
          const by = base - ((col * 7 + i * 3) % 4);
          ctx.fillRect(bx, by, 4, 4);
          ctx.fillRect(bx + 0.5, by - 1.2, 1.2, 1.2);
          ctx.fillRect(bx + 2.3, by - 1.2, 1.2, 1.2);
        }
      }
    }
  }
  // Dehors : une trouée dans la haie, claire (on voit qu'on peut passer).
  if (p.outdoor) {
    for (const exit of level.exits) {
      const x = exit.col * T;
      const y = exit.rowMin * T;
      const h = (exit.rowMax - exit.rowMin + 1) * T;
      ctx.fillStyle = p.wallBottom;
      ctx.fillRect(x, y, T, h);
      ctx.fillStyle = p.leafDark;
      ctx.beginPath();
      ctx.ellipse(x + T / 2, y, T * 0.9, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  // Sorties : ouverture sombre, encadrement en bois.
  for (const exit of level.exits) {
    const x = exit.col * T;
    const y = exit.rowMin * T;
    const h = (exit.rowMax - exit.rowMin + 1) * T;
    const inner = ctx.createLinearGradient(x, 0, x + T, 0);
    inner.addColorStop(exit.side === 'left' ? 0 : 1, '#07080d');
    inner.addColorStop(exit.side === 'left' ? 1 : 0, p.structure);
    ctx.fillStyle = inner;
    ctx.fillRect(x, y, T, h);
    ctx.fillStyle = p.wood;
    ctx.fillRect(exit.side === 'left' ? x + T - 3 : x, y - 3, 3, h + 3);
    ctx.fillRect(x, y - 3, T, 3);
  }
}

/**
 * Ronces (danger qui pique, D-51, D-56) : tiges sombres entrelacées hérissées d'épines, bien plus hautes
 * et plus pointues que les orties, pour qu'on ne les confonde jamais.
 */
function drawThorns(
  ctx: CanvasRenderingContext2D,
  p: Readonly<ArtPalette>,
  x: number,
  base: number,
  col: number,
): void {
  const stem = p.silhouettes ? '#0f0b1e' : '#4a2f38';
  const spike = p.silhouettes ? p.rim : '#c7485f';
  ctx.strokeStyle = stem;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 2; i++) {
    const x0 = x + (i === 0 ? 1 : T - 1);
    ctx.moveTo(x0, base);
    ctx.quadraticCurveTo(
      x + T / 2,
      base - 14 - ((col + i) % 3) * 2,
      x + (i === 0 ? T : 0),
      base - 6,
    );
  }
  ctx.stroke();
  ctx.fillStyle = spike;
  for (let k = 0; k < 5; k++) {
    const sx = x + 2 + ((col * 5 + k * 7) % 12);
    const sy = base - 3 - ((col * 3 + k * 5) % 9);
    ctx.beginPath();
    ctx.moveTo(sx - 1.5, sy + 1);
    ctx.lineTo(sx, sy - 3);
    ctx.lineTo(sx + 1.5, sy + 1);
    ctx.fill();
  }
}

/** Orties (danger du jardin, D-46) : touffes dentelées d'un vert vif, sans violence. */
function drawNettles(
  ctx: CanvasRenderingContext2D,
  p: Readonly<ArtPalette>,
  x: number,
  y: number,
  col: number,
  inFloor: boolean,
): void {
  if (inFloor) {
    ctx.fillStyle = p.floor;
    ctx.fillRect(x, y, T, T);
  }
  const base = inFloor ? y + 3 : y + T;
  // Monde étrange (D-49) : des ronces en ombre, bordées de turquoise (lisibles, pilier 1).
  ctx.fillStyle = p.silhouettes ? p.rim : '#3f8f4a';
  for (let i = 0; i < 3; i++) {
    const cx = x + 3 + i * 5;
    const h = 7 + ((col * 3 + i * 5) % 4);
    ctx.beginPath();
    ctx.moveTo(cx - 2.5, base);
    ctx.lineTo(cx - 1.5, base - h * 0.5);
    ctx.lineTo(cx - 2.8, base - h * 0.55);
    ctx.lineTo(cx, base - h);
    ctx.lineTo(cx + 2.8, base - h * 0.55);
    ctx.lineTo(cx + 1.5, base - h * 0.5);
    ctx.lineTo(cx + 2.5, base);
    ctx.fill();
  }
  if (!p.silhouettes) {
    ctx.fillStyle = '#b7e36b';
    ctx.fillRect(x + 7.5, base - 8, 1, 1);
  }
}

/**
 * Lumière (au-dessus des personnages) : obscurité percée par les veilleuses et la lune, halos,
 * puis liseré des surfaces praticables (on voit toujours où poser le pied).
 */
export function drawRoomLight(a: ArtContext, scratch: HTMLCanvasElement): void {
  const { ctx, level, palette: p } = a;
  const width = level.width * T;
  const height = level.height * T;
  const lamps = level.entities.filter((e) => e.type === EntityType.Checkpoint);
  const windows = level.decor.filter((d) => d.kind === 'window').map(rect);
  // Sources de lumière du décor : lampes, lustre (sous l'abat-jour), feu de la cheminée (D-74).
  const lights = level.decor.flatMap((d) => {
    const r = rect(d);
    if (d.kind === 'lamp') {
      return [{ x: r.x + r.w / 2, y: r.y + 4, k: 1 }];
    }
    if (d.kind === 'ceilinglamp') {
      return [{ x: r.x + r.w / 2, y: r.y + r.h + 8, k: 1.1 }];
    }
    if (d.kind === 'fireplace') {
      return [{ x: r.x + r.w / 2, y: r.y + r.h - 12, k: 1.25 }];
    }
    return [];
  });
  const skylights = level.decor.filter((d) => d.kind === 'skylight').map(rect);
  // Calque d'obscurité, percé hors écran (destination-out), puis posé sur la salle.
  const transform = ctx.getTransform();
  scratch.width = ctx.canvas.width;
  scratch.height = ctx.canvas.height;
  const dark = scratch.getContext('2d');
  if (!dark) {
    return;
  }
  dark.setTransform(transform);
  dark.fillStyle = `rgba(8,10,24,${String(p.darkness)})`;
  dark.fillRect(0, 0, width, height);
  dark.globalCompositeOperation = 'destination-out';
  const hole = (x: number, y: number, radius: number, strength: number) => {
    const g = dark.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(0,0,0,${String(strength)})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    dark.fillStyle = g;
    dark.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);
  };
  for (const lamp of lamps) {
    hole((lamp.col + 0.5) * T, (lamp.row + 0.5) * T, LAMP_LIGHT_RADIUS, 1);
  }
  for (const light of lights) {
    hole(light.x, light.y, LAMP_LIGHT_RADIUS * 0.8 * light.k, 0.9);
  }
  for (const sky of skylights) {
    hole(sky.x + sky.w / 2, sky.y, MOON_LIGHT_RADIUS * 0.8, 0.8);
  }
  const floorY = floorRow(level) * T;
  for (const w of windows) {
    hole(w.x + w.w * 0.72, w.y + w.h * 0.3, MOON_LIGHT_RADIUS, 0.9);
    // Rai de lune jusqu'au sol.
    dark.fillStyle = 'rgba(0,0,0,0.3)';
    dark.beginPath();
    dark.moveTo(w.x, w.y + w.h);
    dark.lineTo(w.x + w.w, w.y + w.h);
    dark.lineTo(w.x + w.w * 0.3, floorY + 20);
    dark.lineTo(w.x - w.w * 1.2, floorY + 20);
    dark.fill();
  }
  for (const exit of level.exits.filter(
    (e) => e.side === 'left' && e.rowMax < floorRow(level) - 4,
  )) {
    // Passage en hauteur (derrière l'armoire) : une lueur discrète.
    hole(exit.col * T + T, (exit.rowMin + 1.5) * T, 40, 0.6);
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(scratch, 0, 0);
  ctx.restore();
  // Halos.
  const glow = (x: number, y: number, radius: number, rgb: string, alpha: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(${rgb},${String(alpha)})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);
  };
  for (const lamp of lamps) {
    glow(
      (lamp.col + 0.5) * T,
      (lamp.row + 0.5) * T,
      LAMP_LIGHT_RADIUS * 0.8,
      p.lamp,
      0.28 * p.glow,
    );
  }
  for (const light of lights) {
    glow(light.x, light.y, LAMP_LIGHT_RADIUS * 0.6 * light.k, p.lamp, 0.22 * p.glow);
  }
  for (const exit of level.exits.filter(
    (e) => e.side === 'left' && e.rowMax < floorRow(level) - 4,
  )) {
    glow(exit.col * T + T, (exit.rowMin + 1.5) * T, 30, '120,240,220', p.silhouettes ? 0.5 : 0.15);
  }
  // Liserés : dessus de chaque surface praticable.
  ctx.fillStyle = p.rim;
  for (let row = 1; row < level.height; row++) {
    for (let col = 0; col < level.width; col++) {
      const tile = tileAt(level, col, row);
      const above = tileAt(level, col, row - 1);
      if (
        (tile === Tile.Solid || tile === Tile.OneWay) &&
        above !== Tile.Solid &&
        above !== Tile.OneWay &&
        above !== Tile.Hazard &&
        above !== Tile.Thorns
      ) {
        ctx.fillRect(col * T, row * T, T, 1);
      }
    }
  }
}
