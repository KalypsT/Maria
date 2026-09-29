import {
  DECOR_KINDS,
  LAMP_LIGHT_RADIUS,
  WALL_STYLES,
  type WallStyle,
  MOON_LIGHT_RADIUS,
  type ArtPalette,
} from '../../config/art';
import { TILE_SIZE as T } from '../../config/display';
import {
  EntityType,
  Tile,
  tileAt,
  type LevelData,
  type LevelDecor,
} from '../../core/level/LevelData';

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
}

type Rect = { x: number; y: number; w: number; h: number };

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
      full = tile === Tile.Solid || tile === Tile.Hazard;
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

const DRAWERS: Readonly<Record<string, (a: ArtContext, r: Rect) => void>> = {
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
    const sky = ctx.createLinearGradient(0, r.y - 6, 0, r.y + T);
    sky.addColorStop(0, p.night);
    sky.addColorStop(1, p.nightLow);
    ctx.fillStyle = p.wood;
    rounded(ctx, { x: r.x - 3, y: r.y - 9, w: r.w + 6, h: T + 9 }, 3);
    ctx.fill();
    ctx.fillStyle = sky;
    ctx.fillRect(r.x, r.y - 6, r.w, T + 2);
    ctx.fillStyle = p.moon;
    ctx.beginPath();
    ctx.arc(r.x + r.w * 0.7, r.y - 1, 3, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.strokeStyle = p.silhouettes ? p.moon : '#3b3330';
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
    for (let i = 0; i < 12; i++) {
      ctx.fillRect(r.x + ((i * 37) % r.w), r.y + ((i * 23) % (r.h - 6)) + 3, 1, 1);
    }
    if (p.silhouettes) {
      ctx.strokeStyle = p.moon;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let t = 0; t < 12; t += 0.2) {
        ctx.lineTo(
          r.x + r.w * 0.3 + Math.cos(t) * t * 1.5,
          r.y + r.h * 0.65 + Math.sin(t) * t * 1.5,
        );
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
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

/** Fond, structure, sol et meubles (sous les personnages). */
export function drawRoomBackground(a: ArtContext): void {
  const { ctx, level, palette: p } = a;
  const width = level.width * T;
  const height = level.height * T;
  const floorY = floorRow(level) * T;
  const wainscotY = floorY - 5 * T;
  // Mur : dégradé, papier peint, lambris.
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
  // Éléments de fond, puis structure (murs, plafond, sol), puis meubles.
  const images = a.images;
  const drawDecor = (furniture: boolean) => {
    for (const d of level.decor) {
      const isFurniture = DECOR_KINDS[d.kind]?.furniture ?? false;
      if (isFurniture !== furniture) {
        continue;
      }
      const r = rect(d);
      const image = images.get(d.kind);
      if (image) {
        ctx.drawImage(image, r.x, r.y, r.w, r.h);
      } else {
        DRAWERS[d.kind]?.(a, r);
      }
    }
  };
  drawDecor(false);
  drawStructure(a, floorY);
  drawDecor(true);
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
      if (y >= floorY) {
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
      } else if (tile === Tile.Hazard) {
        if (y >= floorY) {
          ctx.fillStyle = p.floor;
          ctx.fillRect(x, y, T, T);
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
 * Lumière (au-dessus des personnages) : obscurité percée par les veilleuses et la lune, halos,
 * puis liseré des surfaces praticables (on voit toujours où poser le pied).
 */
export function drawRoomLight(a: ArtContext, scratch: HTMLCanvasElement): void {
  const { ctx, level, palette: p } = a;
  const width = level.width * T;
  const height = level.height * T;
  const lamps = level.entities.filter((e) => e.type === EntityType.Checkpoint);
  const windows = level.decor.filter((d) => d.kind === 'window').map(rect);
  const lights = level.decor.filter((d) => d.kind === 'lamp').map(rect);
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
    hole(light.x + light.w / 2, light.y + 4, LAMP_LIGHT_RADIUS * 0.8, 0.9);
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
    glow((lamp.col + 0.5) * T, (lamp.row + 0.5) * T, LAMP_LIGHT_RADIUS * 0.8, p.lamp, 0.28);
  }
  for (const light of lights) {
    glow(light.x + light.w / 2, light.y + 4, LAMP_LIGHT_RADIUS * 0.6, p.lamp, 0.22);
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
        above !== Tile.OneWay
      ) {
        ctx.fillRect(col * T, row * T, T, 1);
      }
    }
  }
}
