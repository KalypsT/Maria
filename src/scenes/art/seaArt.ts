import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt } from '../../core/level/LevelData';
import type { ShapeTools } from './gardenArt';
import type { ArtContext, Rect } from './roomArt';

/**
 * La station balnéaire (D-95, D-98), dessinée par le code en aplats doux. PLACEHOLDER : formes
 * simples. Ce qu'on foule (socle, banc, coffre, kiosque, auvents, balcons, toit, enseigne,
 * plancher, couchettes) suit exactement ses tuiles ; façade, balustrade, grille, ancre, escalier,
 * longue-vue, passe-plat et sacs sont du fond.
 */

type Drawer = (a: ArtContext, r: Rect) => void;

const WHITE = '#f4f1e8';
const WHITE_SHADE = '#d9d4c6';
const IRON = '#2f4858';
const IRON_LIGHT = '#557487';
const STONE = '#d8ccb4';
const STONE_LIGHT = '#ebe2cf';
const STONE_DARK = '#b3a688';
const PLASTER = '#f0dfb3';
const PLASTER_SHADE = '#ddc796';
const SHUTTER = '#5d8fb3';
const TILE_RED = '#c8644a';
const TILE_RED_LIGHT = '#de8a6c';
const WOOD = '#a77b55';
const WOOD_LIGHT = '#cda07a';
const WOOD_DARK = '#7a573b';
const STRIPE_RED = '#d9534f';
const STRIPE_BLUE = '#4f86b8';
const MINT = '#9fd8c8';
const PINK = '#f2a7b8';
const NAVY = '#2c3e66';
const SAND = '#e6d3a3';
const SAND_LIGHT = '#f2e4bd';
const SAND_WET = '#c9b282';
const ROCK = '#7d7a72';
const ROCK_LIGHT = '#a19d92';
const ROCK_DARK = '#5a5852';
const WEED = '#5f8a4e';
const BAGS = ['#e2574c', '#f2c14e', '#6d86c2', '#8cc26f', '#b07ac9', '#e38aa0'] as const;

/** Pseudo-hasard stable (même dessin à chaque chargement). */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 57.3 + y * 191.9) * 43758.5453;
  return n - Math.floor(n);
}

/** Ligne (tuiles) du premier sol plein sous (x px, ligne), ou la hauteur de la salle. */
function groundRow(a: ArtContext, x: number, row: number): number {
  const col = Math.floor(x / T);
  for (let r = Math.floor(row); r < a.level.height; r++) {
    const tile = tileAt(a.level, col, r);
    if (tile === Tile.Solid) {
      return r;
    }
  }
  return a.level.height;
}

/** Une fenêtre à petits carreaux, ses volets ouverts. */
function shutteredWindow(a: ArtContext, x: number, y: number, w: number, h: number): void {
  const { ctx } = a;
  const lit = a.palette.darkness > 0;
  ctx.fillStyle = SHUTTER;
  ctx.fillRect(x - w * 0.35, y, w * 0.32, h);
  ctx.fillRect(x + w * 1.03, y, w * 0.32, h);
  ctx.fillStyle = lit ? '#ffe3a0' : '#bcd9e6';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = WHITE;
  ctx.fillRect(x + w / 2 - 0.5, y, 1, h);
  ctx.fillRect(x, y + h / 2 - 0.5, w, 1);
  ctx.fillRect(x - 1, y + h, w + 2, 2);
}

export function seaDrawers({ rounded, tileShape }: ShapeTools): Record<string, Drawer> {
  return {
    // ——— La promenade ———
    seabalustrade(a, r) {
      const { ctx } = a;
      // La balustrade de la digue (fond) : une main courante blanche, des balustres, une lisse basse.
      const top = r.y + 3;
      const bottom = r.y + r.h - 3;
      ctx.fillStyle = WHITE_SHADE;
      for (let x = r.x + 4; x < r.x + r.w; x += 6) {
        ctx.fillRect(x, top, 2, bottom - top);
      }
      ctx.fillStyle = WHITE;
      ctx.fillRect(r.x, top - 2, r.w, 3);
      ctx.fillRect(r.x, bottom - 2, r.w, 2);
      for (let x = r.x + 2 * T; x < r.x + r.w; x += 6 * T) {
        ctx.fillRect(x - 2, top - 4, 5, bottom - top + 4);
      }
    },
    portgate(a, r) {
      const { ctx } = a;
      // La grille du port (fond), fermée : deux piliers de pierre, des barreaux à pointes, une roue de
      // bateau forgée au milieu. La suite viendra avec le port (PR 4).
      const ground = r.y + r.h;
      ctx.fillStyle = STONE_DARK;
      ctx.fillRect(r.x, r.y + 6, 10, ground - r.y - 6);
      ctx.fillRect(r.x + r.w - 10, r.y + 6, 10, ground - r.y - 6);
      ctx.fillStyle = STONE_LIGHT;
      ctx.fillRect(r.x - 1, r.y + 3, 12, 4);
      ctx.fillRect(r.x + r.w - 11, r.y + 3, 12, 4);
      ctx.strokeStyle = IRON;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = r.x + 13; x < r.x + r.w - 11; x += 5) {
        ctx.moveTo(x, r.y + 14);
        ctx.lineTo(x, ground);
      }
      ctx.moveTo(r.x + 10, r.y + 20);
      ctx.lineTo(r.x + r.w - 10, r.y + 20);
      ctx.moveTo(r.x + 10, ground - 8);
      ctx.lineTo(r.x + r.w - 10, ground - 8);
      ctx.stroke();
      const cx = r.x + r.w / 2;
      const cy = r.y + 34;
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      for (let k = 0; k < 8; k++) {
        const t = (k / 8) * Math.PI * 2;
        ctx.moveTo(cx + Math.cos(t) * 3, cy + Math.sin(t) * 3);
        ctx.lineTo(cx + Math.cos(t) * 12, cy + Math.sin(t) * 12);
      }
      ctx.stroke();
    },
    anchor(a, r) {
      const { ctx } = a;
      // L'ancre (fond), posée sur son socle : la verge, l'organeau, le jas, les bras et leurs pattes ;
      // un cordage enroulé à son pied.
      const cx = r.x + r.w / 2;
      const top = r.y + 6;
      const bottom = r.y + r.h - 4;
      ctx.fillStyle = IRON;
      ctx.fillRect(cx - 3, top + 8, 6, bottom - top - 12);
      ctx.fillRect(cx - 18, top + 14, 36, 4);
      ctx.strokeStyle = IRON;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, top + 4, 5, 0, Math.PI * 2);
      ctx.moveTo(cx - 30, bottom - 22);
      ctx.quadraticCurveTo(cx, bottom + 14, cx + 30, bottom - 22);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 34, bottom - 30);
      ctx.lineTo(cx - 24, bottom - 22);
      ctx.lineTo(cx - 34, bottom - 16);
      ctx.moveTo(cx + 34, bottom - 30);
      ctx.lineTo(cx + 24, bottom - 22);
      ctx.lineTo(cx + 34, bottom - 16);
      ctx.fillStyle = IRON;
      ctx.fill();
      ctx.fillStyle = IRON_LIGHT;
      ctx.fillRect(cx - 2, top + 10, 1.5, bottom - top - 18);
      ctx.strokeStyle = '#c9a86b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx + 16, bottom - 2, 9, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 16, bottom - 5, 7, 2.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    },
    plinth(a, r) {
      // Le socle de pierre (on monte dessus) : une plaque de bronze, sans texte.
      tileShape(a, r, STONE, STONE_LIGHT);
      const { ctx } = a;
      if (a.palette.silhouettes) {
        return;
      }
      ctx.fillStyle = STONE_DARK;
      ctx.fillRect(r.x, r.y + 4, r.w, 2);
      ctx.fillStyle = '#a8875a';
      rounded(ctx, { x: r.x + r.w / 2 - 12, y: r.y + 16, w: 24, h: 12 }, 2);
      ctx.fill();
    },
    beachstairs(a, r) {
      const { ctx } = a;
      // L'escalier de la plage (fond) : la balustrade s'ouvre, des marches descendent derrière, une
      // chaîne tendue entre deux poteaux la ferme pour l'instant (la plage vient avec la PR 3).
      ctx.fillStyle = STONE_DARK;
      ctx.fillRect(r.x, r.y + 4, r.w, r.h - 4);
      for (let k = 0; k < 5; k++) {
        const y = r.y + 10 + k * 10;
        ctx.fillStyle = k % 2 === 0 ? STONE_LIGHT : STONE;
        ctx.fillRect(r.x + 4 + k * 6, y, r.w - 8 - k * 6, 6);
        ctx.fillStyle = STONE_DARK;
        ctx.fillRect(r.x + 4 + k * 6, y + 6, r.w - 8 - k * 6, 1.5);
      }
      ctx.fillStyle = WHITE;
      ctx.fillRect(r.x, r.y, 4, r.h);
      ctx.fillRect(r.x + r.w - 4, r.y, 4, r.h);
      ctx.strokeStyle = '#8a8f96';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(r.x + 4, r.y + 8);
      ctx.quadraticCurveTo(r.x + r.w / 2, r.y + 20, r.x + r.w - 4, r.y + 8);
      ctx.stroke();
    },
    telescope(a, r) {
      const { ctx } = a;
      // La longue-vue à pièces (fond), sur son pied, tournée vers le large.
      const cx = r.x + r.w / 2;
      const ground = r.y + r.h;
      ctx.fillStyle = IRON;
      ctx.fillRect(cx - 1.5, r.y + 18, 3, ground - r.y - 18);
      ctx.fillRect(cx - 6, ground - 3, 12, 3);
      ctx.save();
      ctx.translate(cx, r.y + 16);
      ctx.rotate(-0.25);
      ctx.fillStyle = '#4d7a6a';
      rounded(ctx, { x: -10, y: -5, w: 20, h: 10 }, 3);
      ctx.fill();
      ctx.fillStyle = '#2c4a40';
      ctx.fillRect(9, -6, 3, 12);
      ctx.fillRect(-13, -3, 3, 6);
      ctx.restore();
    },
    seabench(a, r) {
      // Le banc des marées : des lattes sur des pieds de fonte, le dossier dessiné au-dessus (fond).
      const { ctx } = a;
      const seat = r.y + T;
      ctx.fillStyle = WOOD;
      for (let k = 0; k < 3; k++) {
        ctx.fillRect(r.x + 1, r.y + 2 + k * 4, r.w - 2, 2.5);
      }
      ctx.fillStyle = IRON;
      ctx.fillRect(r.x + 3, r.y + 1, 2, T);
      ctx.fillRect(r.x + r.w - 5, r.y + 1, 2, T);
      tileShape(a, { x: r.x, y: seat, w: r.w, h: T }, WOOD, WOOD_LIGHT);
      ctx.fillStyle = IRON;
      ctx.fillRect(r.x + 3, seat + 4, 2, T - 4);
      ctx.fillRect(r.x + r.w - 5, seat + 4, 2, T - 4);
    },
    freezer(a, r) {
      // Le coffre à glaces : blanc, un couvercle, un cornet peint sur le côté.
      tileShape(a, r, WHITE, '#ffffff');
      const { ctx } = a;
      if (a.palette.silhouettes) {
        return;
      }
      ctx.fillStyle = MINT;
      ctx.fillRect(r.x + 1, r.y + 3, r.w - 2, 2);
      const cx = r.x + r.w / 2;
      ctx.fillStyle = '#d9a35b';
      ctx.beginPath();
      ctx.moveTo(cx - 4, r.y + 14);
      ctx.lineTo(cx + 4, r.y + 14);
      ctx.lineTo(cx, r.y + 24);
      ctx.fill();
      ctx.fillStyle = PINK;
      ctx.beginPath();
      ctx.arc(cx, r.y + 12, 4.5, 0, Math.PI * 2);
      ctx.fill();
    },
    icekiosk(a, r) {
      const { ctx } = a;
      // Le kiosque à glaces (fermé le matin) : des rayures roses et blanches, le guichet fermé par
      // un volet, le toit qui déborde (on monte dessus), un grand cornet au-dessus du toit.
      const body = { x: r.x + T, y: r.y + 4 * T, w: r.w - 2 * T, h: r.h - 4 * T };
      tileShape(a, body, WHITE, '#ffffff');
      if (!a.palette.silhouettes) {
        ctx.fillStyle = PINK;
        for (let x = body.x + 4; x < body.x + body.w; x += 12) {
          ctx.fillRect(x, body.y + 6, 6, body.h - 6);
        }
        ctx.fillStyle = '#c9c3b4';
        ctx.fillRect(body.x + 14, body.y + 18, body.w - 28, 30);
        ctx.fillStyle = '#b3ad9e';
        for (let y = body.y + 21; y < body.y + 48; y += 4) {
          ctx.fillRect(body.x + 14, y, body.w - 28, 1);
        }
        ctx.fillStyle = WOOD;
        ctx.fillRect(body.x + 10, body.y + 48, body.w - 20, 4);
      }
      tileShape(a, { x: r.x, y: r.y + 3 * T, w: r.w, h: T }, MINT, '#c6eee2');
      ctx.fillStyle = MINT;
      for (let x = r.x; x < r.x + r.w; x += 8) {
        ctx.beginPath();
        ctx.arc(x + 4, r.y + 4 * T, 4, 0, Math.PI);
        ctx.fill();
      }
      const cx = r.x + r.w / 2;
      const base = r.y + 3 * T;
      ctx.fillStyle = '#d9a35b';
      ctx.beginPath();
      ctx.moveTo(cx - 8, base - 22);
      ctx.lineTo(cx + 8, base - 22);
      ctx.lineTo(cx, base);
      ctx.fill();
      ctx.fillStyle = PINK;
      ctx.beginPath();
      ctx.arc(cx - 4, base - 26, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff1c9';
      ctx.beginPath();
      ctx.arc(cx + 4, base - 28, 6.5, 0, Math.PI * 2);
      ctx.fill();
    },
    kioskawning(a, r) {
      const { ctx } = a;
      // Un auvent du kiosque (traversable) : rayé, festonné, tenu par une console contre le kiosque.
      const left = tileAt(a.level, r.x / T - 1, r.y / T) === Tile.Solid;
      const wall = left ? r.x : r.x + r.w;
      for (let k = 0; k < r.w / 6; k++) {
        ctx.fillStyle = k % 2 === 0 ? STRIPE_RED : WHITE;
        ctx.fillRect(r.x + k * 6, r.y, 6, 5);
        ctx.beginPath();
        ctx.arc(r.x + k * 6 + 3, r.y + 5, 3, 0, Math.PI);
        ctx.fill();
      }
      ctx.strokeStyle = IRON;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wall, r.y + 14);
      ctx.lineTo(left ? r.x + r.w - 3 : r.x + 3, r.y + 5);
      ctx.stroke();
    },
    colonie(a, r) {
      const { ctx } = a;
      // Le centre de la classe de mer (fond) : une grande maison crépie, volets bleus, trois étages
      // de fenêtres, une aile plus basse à droite ; la porte au rez-de-chaussée (porte 2).
      const main = { x: r.x, y: r.y + T, w: 24 * T, h: r.h - T };
      const wing = { x: r.x + 24 * T, y: r.y + 4 * T, w: r.w - 24 * T, h: r.h - 4 * T };
      for (const part of [main, wing]) {
        ctx.fillStyle = PLASTER;
        ctx.fillRect(part.x, part.y, part.w, part.h);
        ctx.fillStyle = PLASTER_SHADE;
        ctx.fillRect(part.x, part.y + part.h - 10, part.w, 10);
      }
      ctx.fillStyle = PLASTER_SHADE;
      ctx.fillRect(wing.x, wing.y, 2, wing.h);
      ctx.fillStyle = STONE_DARK;
      ctx.fillRect(main.x, main.y, main.w, 3);
      for (const floorY of [main.y + 2 * T, main.y + 6 * T, main.y + 10 * T]) {
        for (let k = 0; k < 4; k++) {
          const x = main.x + 2 * T + k * 5.5 * T;
          if (k === 3 && floorY > main.y + 9 * T) {
            continue;
          }
          shutteredWindow(a, x, floorY, 2 * T, 2.5 * T);
        }
      }
      shutteredWindow(a, wing.x + 1.5 * T, wing.y + 5 * T, 2 * T, 2.5 * T);
      shutteredWindow(a, wing.x + 1.5 * T, wing.y + 10 * T, 2 * T, 2.5 * T);
      // La porte, encadrée de pierre, une marquise de fer.
      const door = { x: r.x + 13 * T, y: r.y + r.h - 4 * T, w: 3 * T, h: 4 * T };
      ctx.fillStyle = STONE;
      ctx.fillRect(door.x - 4, door.y - 4, door.w + 8, door.h + 4);
      ctx.fillStyle = NAVY;
      rounded(ctx, door, [door.w / 2, door.w / 2, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#e8c45c';
      ctx.fillRect(door.x + door.w - 8, door.y + door.h / 2, 3, 3);
      ctx.fillStyle = IRON;
      ctx.fillRect(door.x - 10, door.y - 10, door.w + 20, 3);
      // La descente de gouttière.
      ctx.fillStyle = '#9aa3a8';
      ctx.fillRect(main.x + main.w - 6, main.y, 3, main.h);
    },
    colonybalcony(a, r) {
      const { ctx } = a;
      // Un balcon (traversable) : la dalle, une rambarde de fer forgé, une jardinière de géraniums.
      tileShape(a, r, STONE, STONE_LIGHT);
      ctx.strokeStyle = IRON;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y - 10);
      ctx.lineTo(r.x + r.w, r.y - 10);
      for (let x = r.x + 2; x < r.x + r.w; x += 4) {
        ctx.moveTo(x, r.y - 10);
        ctx.lineTo(x, r.y);
      }
      ctx.stroke();
      ctx.fillStyle = STONE_DARK;
      ctx.fillRect(r.x + 2, r.y + 4, 3, 5);
      ctx.fillRect(r.x + r.w - 5, r.y + 4, 3, 5);
      ctx.fillStyle = TILE_RED;
      for (let x = r.x + 4; x < r.x + r.w - 4; x += 5) {
        ctx.beginPath();
        ctx.arc(x, r.y - 12, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    colonyroof(a, r) {
      // Le toit du centre (on y monte) : des tuiles rouges, une cheminée.
      tileShape(a, r, TILE_RED, TILE_RED_LIGHT);
      const { ctx } = a;
      if (a.palette.silhouettes) {
        return;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let x = r.x + 3; x < r.x + r.w; x += 6) {
        ctx.fillRect(x, r.y + 4, 1, T - 4);
      }
      ctx.fillStyle = TILE_RED;
      ctx.fillRect(r.x + r.w - 3 * T, r.y - 10, 10, 10);
    },
    roofsign(a, r) {
      const { ctx } = a;
      // L'enseigne du centre, sur le toit (on peut monter dessus) : un panneau sans texte, un soleil,
      // une vague et une mouette ; deux montants la tiennent.
      tileShape(a, r, WHITE, '#ffffff');
      if (a.palette.silhouettes) {
        return;
      }
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.arc(cx - 14, cy - 3, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = STRIPE_BLUE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(r.x + 6, cy + 8);
      ctx.quadraticCurveTo(cx - 12, cy, cx, cy + 8);
      ctx.quadraticCurveTo(cx + 12, cy + 16, r.x + r.w - 6, cy + 8);
      ctx.stroke();
      ctx.strokeStyle = NAVY;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + 4, cy - 8);
      ctx.quadraticCurveTo(cx + 9, cy - 13, cx + 14, cy - 8);
      ctx.quadraticCurveTo(cx + 19, cy - 13, cx + 24, cy - 8);
      ctx.stroke();
    },
    // ——— La plage et les rochers (D-99) ———
    wetsand(a, r) {
      // Le sable mouillé (on y marche à marée basse) : plus sombre, des rides et des coquillages.
      tileShape(a, r, SAND_WET, SAND);
      const { ctx } = a;
      if (a.palette.silhouettes) {
        return;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let x = r.x + 5; x < r.x + r.w; x += 11) {
        if (tileAt(a.level, Math.floor(x / T), r.y / T) === Tile.Solid) {
          ctx.fillRect(x, r.y + 5 + hash(x, r.y) * 6, 6, 1);
        }
      }
      for (let x = r.x + 9; x < r.x + r.w; x += 37) {
        if (tileAt(a.level, Math.floor(x / T), r.y / T) === Tile.Solid) {
          ctx.fillStyle = hash(x, 1) > 0.5 ? '#f6efe4' : PINK;
          ctx.beginPath();
          ctx.arc(x, r.y + 3, 1.6, Math.PI, 0);
          ctx.fill();
        }
      }
    },
    upperbeach(a, r) {
      // Le haut de plage, au sec : du sable clair, quelques oyats.
      tileShape(a, r, SAND, SAND_LIGHT);
      const { ctx } = a;
      if (a.palette.silhouettes) {
        return;
      }
      ctx.strokeStyle = WEED;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = r.x + 30; x < r.x + r.w - 8; x += 47) {
        for (let k = -2; k <= 2; k++) {
          ctx.moveTo(x + k * 2, r.y);
          ctx.lineTo(x + k * 3.5, r.y - 7 - Math.abs(k));
        }
      }
      ctx.stroke();
    },
    sandstep(a, r) {
      tileShape(a, r, SAND, SAND_LIGHT);
    },
    cave(a, r) {
      // L'entrée de la grotte sous le haut de plage (fond) : une bouche sombre, des algues.
      const { ctx } = a;
      ctx.fillStyle = 'rgba(30,26,22,0.55)';
      ctx.beginPath();
      ctx.ellipse(r.x + T * 1.5, r.y + r.h - 6, 14, 10, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = WEED;
      for (let k = 0; k < 4; k++) {
        ctx.fillRect(r.x + 6 + k * 8, r.y + r.h - 18 + (k % 2) * 3, 2, 6);
      }
    },
    beachcabin(a, r) {
      // Une cabine de plage (on monte sur son toit) : des planches rayées, une porte, un toit pointu.
      const body = { x: r.x, y: r.y + 2 * T, w: r.w, h: r.h - 2 * T };
      const stripe = [STRIPE_BLUE, STRIPE_RED, MINT][Math.floor(hash(r.x, r.y) * 3)] ?? STRIPE_BLUE;
      tileShape(a, body, WHITE, '#ffffff');
      const { ctx } = a;
      if (!a.palette.silhouettes) {
        ctx.fillStyle = stripe;
        for (let x = body.x + 2; x < body.x + body.w; x += 8) {
          ctx.fillRect(x, body.y + 3, 4, body.h - 3);
        }
        ctx.fillStyle = WOOD_DARK;
        rounded(
          ctx,
          { x: body.x + body.w / 2 - 7, y: body.y + 22, w: 14, h: body.h - 22 },
          [7, 7, 0, 0],
        );
        ctx.fill();
      }
      ctx.fillStyle = stripe;
      ctx.beginPath();
      ctx.moveTo(r.x - 3, body.y + 1);
      ctx.lineTo(r.x + r.w / 2, r.y + 6);
      ctx.lineTo(r.x + r.w + 3, body.y + 1);
      ctx.fill();
    },
    beachstairsfoot(a, r) {
      // Le bas de l'escalier de la digue (fond) : la digue de pierre, des marches, la porte (1).
      const { ctx } = a;
      ctx.fillStyle = STONE_DARK;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      for (let k = 0; k < 8; k++) {
        ctx.fillStyle = k % 2 === 0 ? STONE_LIGHT : STONE;
        ctx.fillRect(r.x + 4 + k * 6, r.y + 10 + k * 22, r.w - 8 - k * 6, 8);
      }
      ctx.fillStyle = WHITE;
      ctx.fillRect(r.x, r.y, r.w, 4);
    },
    lifeguardchair(a, r) {
      // La chaise du maître-nageur : quatre pieds blancs, une échelle, le siège (on s'y pose), le
      // drapeau en haut de son mât (la drisse part de là).
      const { ctx } = a;
      const seat = 7 * T + r.y;
      const ground = groundRow(a, r.x + r.w / 2, seat / T + 1) * T;
      ctx.fillStyle = WHITE;
      ctx.fillRect(r.x + 4, seat, 3, ground - seat);
      ctx.fillRect(r.x + r.w - 7, seat, 3, ground - seat);
      ctx.strokeStyle = WHITE_SHADE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = seat + 8; y < ground; y += 8) {
        ctx.moveTo(r.x + 6, y);
        ctx.lineTo(r.x + r.w - 6, y);
      }
      ctx.stroke();
      tileShape(a, { x: r.x + T, y: seat, w: r.w - 2 * T, h: T }, STRIPE_RED, '#ef7a76');
      ctx.fillStyle = STRIPE_RED;
      ctx.fillRect(r.x + T, seat - 10, 3, 10);
      ctx.fillStyle = IRON;
      ctx.fillRect(r.x + 2.5 * T - 1, r.y + T, 2, seat - r.y - T);
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.moveTo(r.x + 2.5 * T + 1, r.y + T);
      ctx.lineTo(r.x + 2.5 * T + 14, r.y + T + 5);
      ctx.lineTo(r.x + 2.5 * T + 1, r.y + T + 10);
      ctx.fill();
    },
    groynepost(a, r) {
      // Un pieu de l'épi : bois sombre jusqu'au sable, coiffé d'une planche (on s'y pose).
      const { ctx } = a;
      ctx.fillStyle = WOOD_DARK;
      ctx.fillRect(r.x + 3, r.y + 3, r.w - 6, r.h - 3);
      ctx.fillStyle = 'rgba(95,138,78,0.7)';
      ctx.fillRect(r.x + 3, r.y + r.h - 12, r.w - 6, 12);
      tileShape(a, { x: r.x, y: r.y, w: r.w, h: T }, WOOD, WOOD_LIGHT);
    },
    buoy(a, r) {
      // Une bouée (traversable, elle monte avec la marée) : ronde, rouge et blanche, un anneau.
      const { ctx } = a;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h - 7;
      ctx.fillStyle = STRIPE_RED;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = WHITE;
      ctx.fillRect(cx - 8, cy - 2, 16, 4);
      ctx.strokeStyle = IRON;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    },
    beacon(a, r) {
      // La balise au large : un mât rayé jusqu'au sable, une petite cage en haut (on s'y pose), un
      // voyant au sommet.
      const { ctx } = a;
      const cx = r.x + r.w / 2;
      const cage = r.y + 10 * T;
      const ground = groundRow(a, cx, cage / T + 1) * T;
      for (let y = cage; y < ground; y += 12) {
        ctx.fillStyle = (y - cage) % 24 === 0 ? NAVY : '#f2c14e';
        ctx.fillRect(cx - 2, y, 4, Math.min(12, ground - y));
      }
      tileShape(a, { x: r.x, y: cage, w: r.w, h: T }, NAVY, '#3d5a8a');
      ctx.strokeStyle = NAVY;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = r.x + 1; x <= r.x + r.w - 1; x += 5) {
        ctx.moveTo(x, cage);
        ctx.lineTo(x, cage - 8);
      }
      ctx.moveTo(r.x, cage - 8);
      ctx.lineTo(r.x + r.w, cage - 8);
      ctx.stroke();
      ctx.fillStyle = NAVY;
      ctx.fillRect(cx - 1, r.y + 4, 2, cage - r.y - 12);
      ctx.fillStyle = a.palette.darkness > 0 ? '#ffe28a' : STRIPE_RED;
      ctx.beginPath();
      ctx.arc(cx, r.y + 6, 3, 0, Math.PI * 2);
      ctx.fill();
    },
    searock(a, r) {
      // Les rochers (on y monte) : de la pierre grise, plus sombre vers le bas ; des bosses sur les
      // crêtes, des fissures, des algues et des bernaches au pied (la ligne de la mer).
      tileShape(a, r, ROCK, ROCK_LIGHT);
      const { ctx } = a;
      if (a.palette.silhouettes) {
        return;
      }
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
          if (tileAt(a.level, col, row) !== Tile.Solid) {
            continue;
          }
          const x = col * T;
          const y = row * T;
          const n = hash(col, row);
          const above = tileAt(a.level, col, row - 1);
          // Plus sombre à mesure qu'on descend dans le rocher.
          let depth = 0;
          while (depth < 6 && tileAt(a.level, col, row - depth - 1) === Tile.Solid) {
            depth++;
          }
          ctx.fillStyle = `rgba(40,38,34,${String(0.05 * depth)})`;
          ctx.fillRect(x, y, T, T);
          if (above !== Tile.Solid) {
            // Une crête irrégulière (au-dessus de la collision, de 2 px au plus).
            ctx.fillStyle = ROCK_LIGHT;
            ctx.beginPath();
            ctx.ellipse(x + 4 + n * 8, y + 1, 4 + n * 3, 2, 0, Math.PI, 0);
            ctx.fill();
          }
          if (n < 0.22) {
            ctx.strokeStyle = ROCK_DARK;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 3 + n * 20, y + 2);
            ctx.lineTo(x + 6 + n * 18, y + 9);
            ctx.lineTo(x + 4 + n * 22, y + 15);
            ctx.stroke();
          } else if (n > 0.86) {
            ctx.fillStyle = '#d9d3c4';
            ctx.beginPath();
            ctx.arc(x + 8, y + 8, 1.5, 0, Math.PI * 2);
            ctx.arc(x + 11, y + 10, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
          const below = tileAt(a.level, col, row + 1);
          if (below === Tile.Water || (below === Tile.Empty && n > 0.6)) {
            ctx.fillStyle = WEED;
            ctx.fillRect(x, y + T - 4, T, 4);
            ctx.fillRect(x + 3 + n * 6, y + T, 2, 4);
          }
        }
      }
    },
    lighthousefoot(a, r) {
      // Le pied du phare (fond) : la tour blanche à bandes rouges, sur son rocher ; la porte, fermée
      // pour l'instant (le phare vient avec la PR 4).
      const { ctx } = a;
      const ground = r.y + r.h;
      const tower = { x: r.x + 2 * T, y: r.y, w: r.w - 4 * T, h: r.h };
      ctx.fillStyle = WHITE;
      ctx.fillRect(tower.x, tower.y, tower.w, tower.h);
      ctx.fillStyle = STRIPE_RED;
      for (let y = tower.y + 2 * T; y < ground - 2 * T; y += 6 * T) {
        ctx.fillRect(tower.x, y, tower.w, 2 * T);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(tower.x + tower.w - 10, tower.y, 10, tower.h);
      const door = { x: r.x + 4 * T, y: ground - 3 * T, w: 2 * T, h: 3 * T };
      ctx.fillStyle = NAVY;
      rounded(ctx, door, [door.w / 2, door.w / 2, 0, 0]);
      ctx.fill();
    },
    // ——— Le centre de la classe de mer ———
    colonyfloor(a, r) {
      // Le plancher du dortoir, vu par la tranche : des lattes, une poutre dessous.
      tileShape(a, r, WOOD, WOOD_LIGHT);
      const { ctx } = a;
      if (a.palette.silhouettes) {
        return;
      }
      ctx.fillStyle = WOOD_DARK;
      ctx.fillRect(r.x, r.y + r.h - 4, r.w, 4);
      for (let x = r.x + 10; x < r.x + r.w; x += 3 * T) {
        ctx.fillRect(x, r.y + 5, 1, T - 5);
      }
    },
    servinghatch(a, r) {
      const { ctx } = a;
      // Le passe-plat (fond) : une ouverture sur la cuisine, son volet roulant à moitié levé.
      ctx.fillStyle = '#8a7a64';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = '#5c5040';
      ctx.fillRect(r.x + 3, r.y + r.h / 2, r.w - 6, r.h / 2);
      ctx.fillStyle = '#c3b9a6';
      for (let y = r.y + 3; y < r.y + r.h / 2; y += 3) {
        ctx.fillRect(r.x + 3, y, r.w - 6, 2);
      }
      ctx.fillStyle = '#e4e0d6';
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.arc(r.x + 16 + k * 10, r.y + r.h - 6, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    colonybunk(a, r) {
      const { ctx } = a;
      // Des couchettes à deux étages (traversables) : les montants, les deux sommiers, matelas et
      // couvertures de couleur, une échelle sur le côté.
      const ground = groundRow(a, r.x + 2, r.y / T) * T;
      ctx.fillStyle = WOOD_DARK;
      ctx.fillRect(r.x, r.y, 3, ground - r.y);
      ctx.fillRect(r.x + r.w - 3, r.y, 3, ground - r.y);
      for (let row = r.y / T; row < r.y / T + r.h / T; row++) {
        if (tileAt(a.level, r.x / T + 1, row) !== Tile.OneWay) {
          continue;
        }
        const y = row * T;
        ctx.fillStyle = WOOD;
        ctx.fillRect(r.x, y, r.w, 4);
        ctx.fillStyle = WHITE;
        rounded(ctx, { x: r.x + 3, y: y - 4, w: r.w - 6, h: 5 }, 2);
        ctx.fill();
        ctx.fillStyle = BAGS[Math.floor(hash(r.x, y) * BAGS.length)] ?? STRIPE_BLUE;
        rounded(ctx, { x: r.x + r.w * 0.35, y: y - 5, w: r.w * 0.6 - 3, h: 4 }, 2);
        ctx.fill();
      }
      ctx.strokeStyle = WOOD_LIGHT;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w - 9, r.y + 2);
      ctx.lineTo(r.x + r.w - 9, ground);
      ctx.moveTo(r.x + r.w - 4, r.y + 2);
      ctx.lineTo(r.x + r.w - 4, ground);
      for (let y = r.y + 6; y < ground; y += 6) {
        ctx.moveTo(r.x + r.w - 9, y);
        ctx.lineTo(r.x + r.w - 4, y);
      }
      ctx.stroke();
    },
    schoolbags(a, r) {
      const { ctx } = a;
      // Les sacs de la classe (fond), posés au pied des couchettes.
      const ground = r.y + r.h;
      let k = 0;
      for (let x = r.x + 4; x < r.x + r.w - 8; x += 13) {
        const color = BAGS[k % BAGS.length] ?? STRIPE_RED;
        k++;
        const h = 10 + hash(x, r.y) * 4;
        ctx.fillStyle = color;
        rounded(ctx, { x, y: ground - h, w: 9, h }, [4, 4, 1, 1]);
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x + 2, ground - h + 4, 5, 3);
      }
    },
  };
}
