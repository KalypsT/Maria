import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt } from '../../core/level/LevelData';
import type { ShapeTools } from './gardenArt';
import type { ArtContext, Rect } from './roomArt';

/**
 * La gare (D-66), dessinée par le code en aplats doux. PLACEHOLDER : formes simples. Ce qu'on
 * foule (quais, abris, passerelle, galerie, comptoir, étagères, wagons, crochets) suit exactement
 * ses tuiles ; façades, verrières, horloges, mâts et feux sont du fond.
 */

type Drawer = (a: ArtContext, r: Rect) => void;

const CONCRETE = '#b9b2a6';
const CONCRETE_LIGHT = '#d8d2c6';
const SAFETY = '#f1e7c4';
const METAL = '#5d6f78';
const METAL_LIGHT = '#8ea1aa';
const IRON = '#3f5a52';
const IRON_LIGHT = '#6b8a7e';
const BRICK = '#b5674f';
const BRICK_LIGHT = '#d08a6f';
const STONE = '#d9ccb2';
const STONE_DARK = '#b8a888';
const WOOD = '#9a7352';
const WOOD_LIGHT = '#c79d6f';
const WOOD_DARK = '#6e5038';
const GLASS = 'rgba(200,228,240,0.55)';
const AMBER = '#f2b84e';
const TEAL = '#5ee6d2';
const LOST_THINGS = ['#e2574c', '#f2c14e', '#6d86c2', '#8cc26f', '#b07ac9', '#e38aa0'] as const;

/** Pseudo-hasard stable (même dessin à chaque chargement). */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 71.7 + y * 233.1) * 43758.5453;
  return n - Math.floor(n);
}

/** Tuiles traversables d'un rectangle, en segments (col0, col1, ligne). */
function oneWayRuns(a: ArtContext, r: Rect): [number, number, number][] {
  const runs: [number, number, number][] = [];
  for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
    let start = -1;
    for (let col = r.x / T; col <= (r.x + r.w) / T; col++) {
      const on = col < (r.x + r.w) / T && tileAt(a.level, col, row) === Tile.OneWay;
      if (on && start < 0) {
        start = col;
      } else if (!on && start >= 0) {
        runs.push([start, col - 1, row]);
        start = -1;
      }
    }
  }
  return runs;
}

/** Dernière ligne de tuiles pleines d'un rectangle (en partant du haut), -1 sinon. */
function lastSolidRow(a: ArtContext, r: Rect): number {
  let last = -1;
  for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
    for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
      if (tileAt(a.level, col, row) === Tile.Solid) {
        last = row;
        break;
      }
    }
  }
  return last;
}

/** Un petit objet perdu posé sur une étagère (parapluie, chapeau, valise, gant, écharpe). */
function lostThing(ctx: CanvasRenderingContext2D, x: number, y: number, k: number): void {
  const color = LOST_THINGS[k % LOST_THINGS.length] ?? '#e2574c';
  ctx.fillStyle = color;
  switch (k % 5) {
    case 0:
      // Parapluie fermé, debout.
      ctx.beginPath();
      ctx.moveTo(x + 2, y - 10);
      ctx.lineTo(x + 4, y - 2);
      ctx.lineTo(x, y - 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = WOOD_DARK;
      ctx.fillRect(x + 1.5, y - 2, 1, 2);
      break;
    case 1:
      // Chapeau.
      ctx.fillRect(x - 1, y - 2, 8, 2);
      ctx.fillRect(x + 1, y - 6, 4, 4);
      break;
    case 2:
      // Petite valise et sa poignée.
      ctx.fillRect(x, y - 6, 7, 6);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + 2, y - 8, 3, 1.2);
      break;
    case 3:
      // Gant.
      ctx.beginPath();
      ctx.roundRect(x, y - 5, 5, 5, 1.5);
      ctx.fill();
      ctx.fillRect(x + 1, y - 7, 1, 2);
      ctx.fillRect(x + 3, y - 7, 1, 2);
      break;
    default:
      // Écharpe pliée.
      ctx.fillRect(x, y - 3, 7, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(x + 2, y - 3, 1, 3);
      ctx.fillRect(x + 5, y - 3, 1, 3);
  }
}

export function stationDrawers({ tileShape }: ShapeTools): Record<string, Drawer> {
  return {
    // ——— Dehors : les voies et les quais ———
    stationfacade(a, r) {
      const { ctx } = a;
      // La gare au fond : un long bâtiment de pierre, de grandes fenêtres cintrées, un fronton.
      ctx.fillStyle = 'rgba(217,204,178,0.55)';
      ctx.fillRect(r.x, r.y + r.h * 0.25, r.w, r.h * 0.75);
      ctx.fillStyle = 'rgba(184,168,136,0.6)';
      ctx.fillRect(r.x, r.y + r.h * 0.25, r.w, 3);
      const mid = r.x + r.w / 2;
      ctx.beginPath();
      ctx.moveTo(mid - 60, r.y + r.h * 0.25);
      ctx.lineTo(mid, r.y);
      ctx.lineTo(mid + 60, r.y + r.h * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(120,140,160,0.35)';
      for (let x = r.x + 12; x < r.x + r.w - 20; x += 34) {
        ctx.beginPath();
        ctx.roundRect(x, r.y + r.h * 0.4, 16, r.h * 0.45, [8, 8, 0, 0]);
        ctx.fill();
      }
    },
    rails(a, r) {
      const { ctx } = a;
      // Ballast gris sur la voie en contrebas, traverses de bois et deux rails d'acier.
      ctx.fillStyle = '#8f8a84';
      ctx.fillRect(r.x, r.y - 4, r.w, 4 + T);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let x = r.x + 1; x < r.x + r.w - 2; x += 3) {
        ctx.fillRect(x, r.y - 3 + (hash(x, r.y) * 3 > 1.5 ? 1 : 0), 1.2, 1.2);
      }
      ctx.fillStyle = WOOD_DARK;
      for (let x = r.x + 2; x < r.x + r.w - 4; x += 7) {
        ctx.fillRect(x, r.y - 3, 4, 3);
      }
      ctx.fillStyle = '#6f777c';
      ctx.fillRect(r.x, r.y - 6, r.w, 2.5);
      ctx.fillStyle = '#dfe6ea';
      ctx.fillRect(r.x, r.y - 6, r.w, 0.8);
    },
    quay(a, r) {
      const { ctx } = a;
      tileShape(a, r, CONCRETE, CONCRETE_LIGHT);
      // La bande claire de sécurité, au bord du quai.
      ctx.fillStyle = SAFETY;
      ctx.fillRect(r.x + 1, r.y + 2, r.w - 2, 2);
    },
    shelter(a, r) {
      const { ctx } = a;
      // Abri de quai : toit vert sur deux poteaux de fonte, un banc dessous (fond).
      ctx.fillStyle = IRON;
      ctx.fillRect(r.x + 3, r.y + 4, 2, r.h - 4);
      ctx.fillRect(r.x + r.w - 5, r.y + 4, 2, r.h - 4);
      ctx.fillStyle = 'rgba(110,80,56,0.7)';
      ctx.fillRect(r.x + 8, r.y + r.h - 6, r.w - 16, 2);
      ctx.fillRect(r.x + 9, r.y + r.h - 4, 1.5, 4);
      ctx.fillRect(r.x + r.w - 10.5, r.y + r.h - 4, 1.5, 4);
      tileShape(a, { x: r.x, y: r.y, w: r.w, h: T }, IRON, IRON_LIGHT);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(r.x + 1, r.y + 4, r.w - 2, 2);
    },
    gantry(a, r) {
      const { ctx } = a;
      // Portique de signalisation : deux pieds en treillis et la poutre (traversable).
      for (const x of [r.x + 2, r.x + r.w - 7]) {
        ctx.strokeStyle = METAL;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, r.y + 4, 5, r.h - 4);
        ctx.beginPath();
        for (let y = r.y + 4; y < r.y + r.h - 6; y += 6) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + 5, y + 6);
        }
        ctx.stroke();
      }
      tileShape(a, { x: r.x, y: r.y, w: r.w, h: T }, METAL, METAL_LIGHT);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      for (let x = r.x + 4; x < r.x + r.w - 4; x += 8) {
        ctx.moveTo(x, r.y + 4);
        ctx.lineTo(x + 4, r.y + 1);
      }
      ctx.stroke();
    },
    signal(a, r) {
      const { ctx } = a;
      // Feu de voie : un mât, un boîtier noir et sa lentille éteinte (allumée par TrainView).
      ctx.fillStyle = '#4b4f55';
      ctx.fillRect(r.x + T / 2 - 1, r.y + 9, 2, r.h - 9);
      ctx.fillStyle = '#26282c';
      ctx.beginPath();
      ctx.roundRect(r.x + T / 2 - 4, r.y, 8, 11, 2);
      ctx.fill();
      ctx.fillStyle = '#5a2422';
      ctx.beginPath();
      ctx.arc(r.x + T / 2, r.y + 5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    },
    catenarymast(a, r) {
      const { ctx } = a;
      // Mât de caténaire : un poteau, un bras en haut, un isolateur (le câble est dessiné à part).
      ctx.fillStyle = '#6e737a';
      ctx.fillRect(r.x + T / 2 - 1.5, r.y, 3, r.h);
      ctx.fillRect(r.x + T / 2 - 8, r.y + 2, 16, 2);
      ctx.fillStyle = '#9aa0a8';
      ctx.fillRect(r.x + T / 2 - 1.5, r.y, 1, r.h);
    },
    signalbox(a, r) {
      const { ctx } = a;
      // Poste d'aiguillage sur pilotis : la cabine de briques (pleine), ses vitres, le toit.
      const bottom = (lastSolidRow(a, r) + 1) * T;
      ctx.fillStyle = WOOD_DARK;
      for (const x of [r.x + 6, r.x + r.w - 9]) {
        ctx.fillRect(x, bottom, 3, r.y + r.h - bottom);
      }
      ctx.strokeStyle = WOOD_DARK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x + 7, bottom);
      ctx.lineTo(r.x + r.w - 8, r.y + r.h - 2);
      ctx.moveTo(r.x + r.w - 8, bottom);
      ctx.lineTo(r.x + 7, r.y + r.h - 2);
      ctx.stroke();
      tileShape(a, { x: r.x, y: r.y, w: r.w, h: bottom - r.y }, BRICK, BRICK_LIGHT);
      ctx.fillStyle = '#bcdcee';
      for (let x = r.x + 6; x < r.x + r.w - 12; x += 14) {
        ctx.fillRect(x, r.y + 14, 10, 12);
      }
      ctx.fillStyle = '#7a3f34';
      ctx.fillRect(r.x - 2, r.y, r.w + 4, 3);
    },
    canopyroof(a, r) {
      const { ctx } = a;
      // Marquise de verre au-dessus des quais : des fermes de fonte et des vitres pâles.
      ctx.fillStyle = GLASS;
      ctx.fillRect(r.x, r.y, r.w, r.h - 6);
      ctx.strokeStyle = 'rgba(63,90,82,0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = r.x; x <= r.x + r.w; x += 48) {
        ctx.moveTo(x, r.y);
        ctx.lineTo(x + 24, r.y + r.h - 6);
        ctx.lineTo(x + 48, r.y);
      }
      ctx.moveTo(r.x, r.y + r.h - 6);
      ctx.lineTo(r.x + r.w, r.y + r.h - 6);
      ctx.stroke();
    },
    pillar(a, r) {
      const { ctx } = a;
      // Pilier de fonte de la marquise (plein), un chapiteau en haut.
      tileShape(a, r, IRON, IRON_LIGHT);
      ctx.fillStyle = IRON_LIGHT;
      ctx.fillRect(r.x - 2, r.y + 2, r.w + 4, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(r.x + r.w - 4, r.y + 5, 3, r.h - 5);
    },
    footbridge(a, r) {
      const { ctx } = a;
      // Passerelle : marches et tablier (traversables), garde-corps au-dessus du tablier.
      for (const [c0, c1, row] of oneWayRuns(a, r)) {
        const x = c0 * T;
        const w = (c1 - c0 + 1) * T;
        ctx.strokeStyle = METAL;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, row * T - 9);
        ctx.lineTo(x + w, row * T - 9);
        for (let bx = x + 3; bx < x + w; bx += 6) {
          ctx.moveTo(bx, row * T - 9);
          ctx.lineTo(bx, row * T);
        }
        ctx.stroke();
        tileShape(a, { x, y: row * T, w, h: T }, METAL, METAL_LIGHT);
      }
    },
    stationclock(a, r) {
      const { ctx } = a;
      // Horloge de quai sur son mât : deux faces rondes, les aiguilles sur dix heures dix.
      const cx = r.x + r.w / 2;
      ctx.fillStyle = IRON;
      ctx.fillRect(cx - 1.5, r.y + 14, 3, r.h - 14);
      ctx.fillStyle = '#fbf6ea';
      ctx.beginPath();
      ctx.arc(cx, r.y + 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = IRON;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, r.y + 8);
      ctx.lineTo(cx - 4, r.y + 5);
      ctx.moveTo(cx, r.y + 8);
      ctx.lineTo(cx + 5, r.y + 4);
      ctx.stroke();
    },
    // ——— Le hall ———
    glassroof(a, r) {
      const { ctx } = a;
      // Verrière en arc : de grands carreaux pâles et leurs montants.
      ctx.fillStyle = GLASS;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y + r.h);
      ctx.quadraticCurveTo(r.x + r.w / 2, r.y - r.h * 0.6, r.x + r.w, r.y + r.h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(93,111,120,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = r.x + 16; x < r.x + r.w; x += 16) {
        ctx.moveTo(x, r.y + r.h);
        ctx.lineTo(r.x + r.w / 2 + (x - r.x - r.w / 2) * 0.4, r.y);
      }
      ctx.stroke();
    },
    bigclock(a, r) {
      const { ctx } = a;
      // La grande horloge du hall : cadran crème, douze traits, les aiguilles (immobiles).
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const radius = Math.min(r.w, r.h) / 2 - 2;
      ctx.fillStyle = WOOD_DARK;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbf6ea';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3b3440';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let k = 0; k < 12; k++) {
        const angle = (k * Math.PI) / 6;
        ctx.moveTo(cx + Math.cos(angle) * (radius - 6), cy + Math.sin(angle) * (radius - 6));
        ctx.lineTo(cx + Math.cos(angle) * (radius - 2), cy + Math.sin(angle) * (radius - 2));
      }
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * 0.35, cy - radius * 0.45);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - radius * 0.1, cy + radius * 0.7);
      ctx.stroke();
    },
    departures(a, r) {
      const { ctx } = a;
      // Tableau des départs, suspendu : des lignes de petits volets ambrés (aucun texte).
      ctx.strokeStyle = '#4b4f55';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x + 8, 0);
      ctx.lineTo(r.x + 8, r.y);
      ctx.moveTo(r.x + r.w - 8, 0);
      ctx.lineTo(r.x + r.w - 8, r.y);
      ctx.stroke();
      ctx.fillStyle = '#26282c';
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 3);
      ctx.fill();
      for (let y = r.y + 6; y < r.y + r.h - 6; y += 12) {
        for (let x = r.x + 6; x < r.x + r.w - 10; x += 8) {
          ctx.fillStyle = hash(x, y) > 0.25 ? AMBER : '#5a4a2a';
          ctx.fillRect(x, y, 6, 7);
        }
      }
    },
    gallery(a, r) {
      const { ctx } = a;
      // Galerie de bois au-dessus du hall, balustres dessous.
      tileShape(a, r, WOOD, WOOD_LIGHT);
      ctx.fillStyle = WOOD_DARK;
      for (let x = r.x + 4; x < r.x + r.w - 2; x += 8) {
        ctx.fillRect(x, r.y + 4, 2, 10);
      }
    },
    hallsteps(a, r) {
      // Marches de pierre scellées au mur (traversables).
      for (const [c0, c1, row] of oneWayRuns(a, r)) {
        tileShape(a, { x: c0 * T, y: row * T, w: (c1 - c0 + 1) * T, h: T }, STONE_DARK, STONE);
      }
    },
    kiosk(a, r) {
      const { ctx } = a;
      // Kiosque à journaux : un toit (traversable) rayé, le comptoir plein, des journaux.
      const roof = { x: r.x, y: r.y, w: r.w, h: T };
      tileShape(a, { x: r.x, y: r.y + T, w: r.w, h: r.h - T }, '#6d86c2', '#98ade0');
      tileShape(a, roof, '#e2574c', '#f39a8f');
      ctx.fillStyle = '#fbf6ea';
      for (let x = r.x + 4; x < r.x + r.w - 4; x += 8) {
        ctx.fillRect(x, r.y + 1, 4, 3);
      }
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = k % 2 === 0 ? '#f3ead7' : '#e6c27a';
        ctx.fillRect(r.x + 8 + k * 9, r.y + T + 8, 7, 9);
      }
    },
    lostoffice(a, r) {
      const { ctx } = a;
      // L'entrée du bureau des objets trouvés : un encadrement de bois, la porte, un guichet, et
      // au-dessus un parapluie et un « ? » dessinés (aucun texte).
      ctx.fillStyle = 'rgba(110,80,56,0.35)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      const doorX = r.x + r.w / 2 - 12;
      ctx.fillStyle = WOOD;
      ctx.fillRect(doorX, r.y + r.h - 40, 24, 40);
      ctx.fillStyle = WOOD_DARK;
      ctx.fillRect(doorX + 3, r.y + r.h - 36, 18, 14);
      ctx.fillStyle = AMBER;
      ctx.fillRect(doorX + 18, r.y + r.h - 20, 2, 3);
      ctx.fillStyle = '#fbf6ea';
      ctx.beginPath();
      ctx.roundRect(r.x + r.w / 2 - 22, r.y + 14, 44, 22, 4);
      ctx.fill();
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.moveTo(r.x + r.w / 2 - 16, r.y + 28);
      ctx.quadraticCurveTo(r.x + r.w / 2 - 8, r.y + 16, r.x + r.w / 2, r.y + 28);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3b3440';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2 + 11, r.y + 21, 3.5, Math.PI * 1.1, Math.PI * 2.4);
      ctx.lineTo(r.x + r.w / 2 + 11, r.y + 28);
      ctx.stroke();
    },
    // ——— Le bureau des objets trouvés ———
    lostcounter(a, r) {
      const { ctx } = a;
      // Le guichet : comptoir de bois, une sonnette, un vieux carnet ouvert.
      tileShape(a, r, WOOD, WOOD_LIGHT);
      ctx.fillStyle = '#c9a43a';
      ctx.beginPath();
      ctx.arc(r.x + r.w - 10, r.y - 2, 3, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fbf6ea';
      ctx.fillRect(r.x + 10, r.y - 2, 12, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(r.x + 4, r.y + 8, r.w - 8, 2);
    },
    lostshelf(a, r) {
      const { ctx } = a;
      // Étagères des objets perdus : montants dans l'ombre, planches (traversables), et dessus
      // des choses perdues par des inconnus.
      ctx.fillStyle = 'rgba(110,80,56,0.45)';
      ctx.fillRect(r.x, r.y, 2, r.h);
      ctx.fillRect(r.x + r.w - 2, r.y, 2, r.h);
      for (const [c0, c1, row] of oneWayRuns(a, r)) {
        const x = c0 * T;
        const w = (c1 - c0 + 1) * T;
        tileShape(a, { x, y: row * T, w, h: T }, WOOD, WOOD_LIGHT);
        for (let k = 0; k * 9 + 2 < w - 4; k++) {
          lostThing(ctx, x + 2 + k * 9, row * T, Math.floor(hash(x + k, row) * 5) + k);
        }
      }
    },
    tallcabinet(a, r) {
      const { ctx } = a;
      // Haute armoire de rangement (pleine) : deux portes, une poignée.
      tileShape(a, r, WOOD_DARK, WOOD);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w / 2, r.y + 4);
      ctx.lineTo(r.x + r.w / 2, r.y + r.h - 4);
      ctx.stroke();
      ctx.fillStyle = AMBER;
      ctx.fillRect(r.x + r.w / 2 - 3, r.y + r.h / 2, 1.5, 4);
    },
    lockers(a, r) {
      const { ctx } = a;
      // Casiers de consigne (pleins) ; tout en haut, une petite porte entrouverte où passe une
      // lueur turquoise (le monde étrange, plus tard).
      tileShape(a, r, METAL, METAL_LIGHT);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      for (let y = r.y + 4; y < r.y + r.h - 8; y += 20) {
        for (let x = r.x + 3; x < r.x + r.w - 8; x += 13) {
          ctx.strokeRect(x, y, 11, 17);
          ctx.fillStyle = '#c9d4da';
          ctx.fillRect(x + 8, y + 8, 1.5, 3);
        }
      }
      const glow = ctx.createLinearGradient(r.x + 3, 0, r.x + 18, 0);
      glow.addColorStop(0, 'rgba(94,230,210,0.9)');
      glow.addColorStop(1, 'rgba(94,230,210,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(r.x + 3, r.y + 4, 14, 17);
      ctx.fillStyle = TEAL;
      ctx.fillRect(r.x + 4, r.y + 5, 1.5, 15);
    },
    // ——— Revisites avec le crochet (le jardin, la rue) ———
    windowbox(a, r) {
      const { ctx } = a;
      // Jardinière de bois sous une fenêtre, des fleurs.
      tileShape(a, r, WOOD, WOOD_LIGHT);
      for (let x = r.x + 3; x < r.x + r.w - 2; x += 5) {
        ctx.fillStyle = '#5d9152';
        ctx.fillRect(x, r.y - 4, 1.5, 4);
        ctx.fillStyle = LOST_THINGS[Math.floor(hash(x, r.y) * LOST_THINGS.length)] ?? '#e2574c';
        ctx.beginPath();
        ctx.arc(x + 0.75, r.y - 5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    nest(a, r) {
      const { ctx } = a;
      // Une branche du platane (traversable) et un nid de brindilles.
      tileShape(a, r, '#7d5a3b', '#a57b52');
      const cx = r.x + r.w / 2;
      ctx.fillStyle = '#8a6a44';
      ctx.beginPath();
      ctx.ellipse(cx, r.y - 2, 9, 4, 0, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#5b4429';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let k = -7; k <= 7; k += 3) {
        ctx.moveTo(cx + k, r.y - 2);
        ctx.lineTo(cx + k + 3, r.y + 1);
      }
      ctx.stroke();
    },
    // ——— Le monde étrange de la gare (D-68) : silhouettes, lueurs turquoise ———
    upsidehall(a, r) {
      const { ctx, palette: p } = a;
      // Le hall à l'envers : la verrière en bas, ses arcs tournés vers le sol, des bancs au
      // plafond (fond, jamais de collision).
      ctx.strokeStyle = p.rim;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.quadraticCurveTo(r.x + r.w / 2, r.y + r.h * 1.6, r.x + r.w, r.y);
      for (let x = r.x + 16; x < r.x + r.w; x += 16) {
        ctx.moveTo(x, r.y);
        ctx.lineTo(r.x + r.w / 2 + (x - r.x - r.w / 2) * 0.4, r.y + r.h);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.structure;
      for (let x = r.x + 30; x < r.x + r.w - 30; x += 90) {
        ctx.fillRect(x, 4, 40, 4);
        ctx.fillRect(x + 4, 8, 3, 8);
        ctx.fillRect(x + 33, 8, 3, 8);
      }
    },
    upsideclock(a, r) {
      const { ctx, palette: p } = a;
      // La grande horloge, à l'envers, qui flotte ; ses aiguilles reculent (immobiles ici).
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const radius = Math.min(r.w, r.h) / 2 - 2;
      ctx.fillStyle = p.structure;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = p.rim;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let k = 0; k < 12; k++) {
        const angle = (k * Math.PI) / 6;
        ctx.moveTo(cx + Math.cos(angle) * (radius - 6), cy + Math.sin(angle) * (radius - 6));
        ctx.lineTo(cx + Math.cos(angle) * (radius - 2), cy + Math.sin(angle) * (radius - 2));
      }
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - radius * 0.35, cy + radius * 0.45);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * 0.1, cy - radius * 0.7);
      ctx.stroke();
    },
    floatsuitcase(a, r) {
      const { ctx, palette: p } = a;
      // Une valise qui flotte (son dessus est une planche traversable), poignée et sangles.
      tileShape(a, { x: r.x, y: r.y, w: r.w, h: T }, p.wood, p.woodLight);
      ctx.fillStyle = p.wood;
      ctx.beginPath();
      ctx.roundRect(r.x + 1, r.y + 3, r.w - 2, r.h - 3, 3);
      ctx.fill();
      ctx.strokeStyle = p.rim;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + r.w / 2 - 4, r.y - 3, 8, 3);
      ctx.beginPath();
      ctx.moveTo(r.x + 5, r.y + 4);
      ctx.lineTo(r.x + 5, r.y + r.h - 1);
      ctx.moveTo(r.x + r.w - 5, r.y + 4);
      ctx.lineTo(r.x + r.w - 5, r.y + r.h - 1);
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
    suitcasestack(a, r) {
      const { ctx, palette: p } = a;
      // Une pile de valises (pleine) : des bords de valises, des poignées.
      tileShape(a, r, p.wood, p.woodLight);
      ctx.strokeStyle = p.rim;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1;
      for (let y = r.y + 10; y < r.y + r.h - 4; y += 9 + hash(r.x, y) * 8) {
        ctx.beginPath();
        ctx.moveTo(r.x + 1, y);
        ctx.lineTo(r.x + r.w - 1, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    lostpile(a, r) {
      const { ctx, palette: p } = a;
      // La montagne des choses perdues (pleine, en marches) : parapluies, chapeaux, valises,
      // gants, en silhouettes, des bords turquoise.
      tileShape(a, r, p.wood, p.woodLight);
      ctx.globalAlpha = 0.35;
      for (let x = r.x + 3; x < r.x + r.w - 8; x += 9) {
        for (let y = r.y + 10; y < r.y + r.h; y += 12) {
          if (tileAt(a.level, Math.floor(x / T), Math.floor(y / T)) !== Tile.Solid) {
            continue;
          }
          ctx.strokeStyle = p.rim;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.roundRect(x, y, 6 + hash(x, y) * 4, 4 + hash(y, x) * 3, 1.5);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    },
    // ——— Le dépôt ———
    depotwindows(a, r) {
      const { ctx } = a;
      // Le grand atelier au fond du dépôt : un mur de briques, de hautes verrières à petits
      // carreaux.
      ctx.fillStyle = 'rgba(181,103,79,0.45)';
      ctx.fillRect(r.x, r.y - 8, r.w, r.h + 8);
      ctx.fillStyle = 'rgba(122,63,52,0.5)';
      ctx.fillRect(r.x, r.y - 8, r.w, 4);
      const windowH = r.h * 0.55;
      for (let x = r.x + 10; x < r.x + r.w - 40; x += 70) {
        ctx.fillStyle = 'rgba(200,228,240,0.35)';
        ctx.fillRect(x, r.y, 40, windowH);
        ctx.strokeStyle = 'rgba(60,64,70,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let gx = x; gx <= x + 40; gx += 10) {
          ctx.moveTo(gx, r.y);
          ctx.lineTo(gx, r.y + windowH);
        }
        for (let gy = r.y; gy <= r.y + windowH; gy += 12) {
          ctx.moveTo(x, gy);
          ctx.lineTo(x + 40, gy);
        }
        ctx.stroke();
      }
    },
    wagon(a, r) {
      const { ctx } = a;
      // Wagon de marchandises garé (plein) : caisse rouge brique, nervures, roues.
      tileShape(a, r, BRICK, BRICK_LIGHT);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      for (let x = r.x + 8; x < r.x + r.w - 4; x += 12) {
        ctx.fillRect(x, r.y + 4, 2, r.h - 10);
      }
      ctx.fillStyle = '#2a2436';
      for (const x of [r.x + 14, r.x + 26, r.x + r.w - 26, r.x + r.w - 14]) {
        ctx.beginPath();
        ctx.arc(x, r.y + r.h - 1, 5, Math.PI, 0);
        ctx.fill();
      }
    },
    cranehook(a, r) {
      const { ctx } = a;
      // Crochet du pont roulant (traversable) au bout de sa chaîne.
      const cx = r.x + r.w / 2;
      ctx.strokeStyle = '#4b4f55';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 1.5]);
      ctx.beginPath();
      ctx.moveTo(cx, 6 * T);
      ctx.lineTo(cx, r.y);
      ctx.stroke();
      ctx.setLineDash([]);
      tileShape(a, r, '#e8b23a', '#f5d27a');
      ctx.strokeStyle = '#b98a22';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, r.y + 9, 3, 0, Math.PI);
      ctx.stroke();
    },
    overheadcrane(a, r) {
      const { ctx } = a;
      // Pont roulant : la poutre jaune et son chariot (fond).
      ctx.fillStyle = '#e8b23a';
      ctx.fillRect(r.x, r.y + r.h / 2 - 4, r.w, 8);
      ctx.fillStyle = '#b98a22';
      ctx.fillRect(r.x, r.y + r.h / 2 + 2, r.w, 2);
      ctx.fillStyle = '#4b4f55';
      ctx.fillRect(r.x + r.w / 2 - 10, r.y + r.h / 2 - 7, 20, 12);
    },
  };
}

/** Pointes de parapluies perdus (danger du monde étrange de la gare, D-68). */
export function drawUmbrellaTips(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  inFloor: boolean,
): void {
  const base = inFloor ? y + 4 : y + T;
  for (let i = 0; i < 2; i++) {
    const px = x + 3 + i * 7;
    const h = 8 + ((col * 3 + i * 5) % 4);
    ctx.fillStyle = '#16112a';
    ctx.beginPath();
    ctx.moveTo(px - 2.5, base);
    ctx.quadraticCurveTo(px - 1, base - h * 0.6, px, base - h);
    ctx.quadraticCurveTo(px + 1, base - h * 0.6, px + 2.5, base);
    ctx.fill();
    ctx.strokeStyle = TEAL;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}
