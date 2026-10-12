import { TILE_SIZE as T } from '../../config/display';
import { TOWER_CUBES } from '../../config/story';
import type { ShapeTools } from './gardenArt';
import type { ArtContext, Rect } from './roomArt';

/**
 * La maison de la nounou (D-107, D-110), l'avant-dernier monde étrange, à hauteur de tout-petit,
 * en silhouettes comme les mondes étranges ; PLACEHOLDER. Le grand miroir de l'entrée et sa vitre
 * (qui n'existe que dans le présent), les fentes vers la nuit du dortoir (les seuls éléments réels,
 * qui gardent leur couleur), la petite porte de la sieste et ses quatre veilleuses, les cubes
 * géants, et les passages vers les îlots de mémoire, chacun encadré d'une silhouette reconnaissable
 * de son îlot (le lit et la haie ; l'horloge de l'école et le crayon ; l'horloge de la gare et le
 * rail ; la vague et le sable).
 */

type Drawer = (a: ArtContext, r: Rect) => void;

const GLOW = 'rgba(120, 240, 220, 0.75)';
const GLOW_SOFT = 'rgba(120, 240, 220, 0.25)';
/** Couleurs du dortoir, la nuit (réel : elles ne passent pas en silhouettes). */
const NIGHT_SKY = '#1b2340';
const NIGHT_BLUE = '#2c3a66';
const MOON = '#f3ecd2';
const BLANKET = '#c48a9a';
const SEA_NIGHT = '#28507a';
const TORCH = 'rgba(255, 236, 170, 0.8)';
/** Un passage vers un îlot fini s'éteint à cette fraction de sa lueur (D-171). PROVISOIRE. */
const ISLET_DONE_DIM = 0.35;
/** Les cubes de jouets : rouge, bleu, jaune, vert, passés. */
const CUBES = ['#d9788f', '#6f8fc4', '#e6c27a', '#7fa37a'] as const;

/** Pseudo-hasard stable (même dessin à chaque chargement). */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 41.3 + y * 97.1) * 43758.5453;
  return n - Math.floor(n);
}

/** La couleur de l'îlot `k` (celle de son cube, `TOWER_CUBES`, D-171), avec une opacité. */
function isletColor(k: number, alpha: number): string {
  const n = parseInt((TOWER_CUBES[k]?.color ?? '#78f0dc').slice(1), 16);
  return `rgba(${String((n >> 16) & 255)}, ${String((n >> 8) & 255)}, ${String(n & 255)}, ${String(alpha)})`;
}

/** Le dessin d'un passage vers un îlot (D-171) : sa couleur, éteinte une fois l'îlot fini. */
interface IsletLook {
  readonly k: number;
  readonly done: boolean;
  readonly strong: string;
  readonly soft: string;
}

function isletLook(a: ArtContext, k: number): IsletLook {
  const flag = TOWER_CUBES[k]?.flag;
  const done = flag !== undefined && a.flags?.has(flag) === true;
  const dim = done ? ISLET_DONE_DIM : 1;
  return { k, done, strong: isletColor(k, 0.8 * dim), soft: isletColor(k, 0.3 * dim) };
}

/** L'îlot fini (D-171) : son cube se montre sur son passage, dans un petit halo. */
function doneCube(a: ArtContext, cx: number, cy: number, look: IsletLook): void {
  if (!look.done) {
    return;
  }
  const { ctx } = a;
  const s = 9;
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 2 * s);
  halo.addColorStop(0, 'rgba(255, 240, 200, 0.45)');
  halo.addColorStop(1, 'rgba(255, 240, 200, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(cx - 2 * s, cy - 2 * s, 4 * s, 4 * s);
  ctx.fillStyle = isletColor(look.k, 1);
  ctx.beginPath();
  ctx.roundRect(cx - s / 2, cy - s / 2, s, s, 1.5);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(cx - s * 0.38, cy - s * 0.44, s * 0.76, s * 0.14);
}

export function nannyDrawers({ tileShape, rounded }: ShapeTools): Record<string, Drawer> {
  /** Le motif d'un passage : un arc sombre bordé de turquoise, où passe une lueur. */
  const arch = (a: ArtContext, r: Rect, look?: IsletLook) => {
    const { ctx, palette: p } = a;
    ctx.fillStyle = p.structure;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y + r.h);
    ctx.lineTo(r.x, r.y + r.w / 2);
    ctx.arc(r.x + r.w / 2, r.y + r.w / 2, r.w / 2, Math.PI, 0);
    ctx.lineTo(r.x + r.w, r.y + r.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = look?.soft ?? GLOW_SOFT;
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  return {
    nannymirror(a, r) {
      // Le grand miroir de l'entrée, debout : un cadre ouvragé, deux montants et un fronton cintré.
      // La vitre est à part (`mirrorglass`), seulement dans le présent : dans le souvenir, le cadre
      // est vide.
      const { ctx, palette: p } = a;
      ctx.fillStyle = p.wood;
      const post = Math.max(6, r.w * 0.18);
      rounded(ctx, { x: r.x, y: r.y + T, w: post, h: r.h - T }, 3);
      ctx.fill();
      rounded(ctx, { x: r.x + r.w - post, y: r.y + T, w: post, h: r.h - T }, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(r.x, r.y + 2 * T);
      ctx.quadraticCurveTo(r.x + r.w / 2, r.y - T, r.x + r.w, r.y + 2 * T);
      ctx.lineTo(r.x + r.w - post, r.y + 2 * T);
      ctx.quadraticCurveTo(r.x + r.w / 2, r.y + T * 0.6, r.x + post, r.y + 2 * T);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = p.rim;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.stroke();
      // Les pieds du miroir.
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(r.x - 4, r.y + r.h - 4, post + 8, 4);
      ctx.fillRect(r.x + r.w - post - 4, r.y + r.h - 4, post + 8, 4);
    },
    mirrorglass(a, r) {
      // La vitre : pâle, des reflets en biais ; une lueur turquoise sur ses bords.
      const { ctx } = a;
      const glass = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
      glass.addColorStop(0, 'rgba(190, 200, 235, 0.85)');
      glass.addColorStop(0.5, 'rgba(150, 165, 215, 0.8)');
      glass.addColorStop(1, 'rgba(120, 140, 200, 0.85)');
      ctx.fillStyle = glass;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let y = r.y + 2 * T; y < r.y + r.h; y += 5 * T) {
        ctx.moveTo(r.x + 2, y + T);
        ctx.lineTo(r.x + r.w - 2, y);
      }
      ctx.stroke();
      ctx.strokeStyle = GLOW;
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    },
    nightslit(a, r) {
      // Une fente dans le mur, sur la nuit du dortoir de la classe de mer : le ciel, la lune, la
      // mer par la fenêtre, une camarade endormie sous sa couverture, parfois la lampe de poche de la
      // maîtresse. Réel : ses couleurs ne passent pas en silhouettes.
      const { ctx } = a;
      ctx.save();
      ctx.beginPath();
      const cx = r.x + r.w / 2;
      ctx.moveTo(cx, r.y);
      for (let y = r.y; y <= r.y + r.h; y += 6) {
        const t = (y - r.y) / r.h;
        const half = (r.w / 2) * Math.sin(Math.PI * t) * (0.7 + hash(y, 1) * 0.3);
        ctx.lineTo(cx + half, y);
      }
      for (let y = r.y + r.h; y >= r.y; y -= 6) {
        const t = (y - r.y) / r.h;
        const half = (r.w / 2) * Math.sin(Math.PI * t) * (0.7 + hash(y, 2) * 0.3);
        ctx.lineTo(cx - half, y);
      }
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = NIGHT_SKY;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = MOON;
      ctx.beginPath();
      ctx.arc(cx + r.w * 0.15, r.y + r.h * 0.22, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = SEA_NIGHT;
      ctx.fillRect(r.x, r.y + r.h * 0.38, r.w, r.h * 0.12);
      ctx.fillStyle = 'rgba(243, 236, 210, 0.5)';
      ctx.fillRect(cx - 3, r.y + r.h * 0.4, 6, 1);
      ctx.fillStyle = NIGHT_BLUE;
      ctx.fillRect(r.x, r.y + r.h * 0.5, r.w, r.h * 0.5);
      // La couchette et la camarade endormie (un dos sous la couverture).
      ctx.fillStyle = BLANKET;
      ctx.beginPath();
      ctx.ellipse(cx, r.y + r.h * 0.74, r.w * 0.4, r.h * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = TORCH;
      ctx.beginPath();
      ctx.arc(cx - r.w * 0.2, r.y + r.h * 0.6, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Le bord de la fente, un peu de lumière chaude.
      ctx.strokeStyle = 'rgba(255, 220, 170, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, r.y);
      ctx.lineTo(cx, r.y + r.h);
      ctx.stroke();
    },
    napdoor(a, r) {
      // La petite porte de la chambre de la sieste, à hauteur de tout-petit ; au-dessus, quatre
      // creux en forme de cube (un par îlot de mémoire, D-122), que les cubes trouvés remplissent.
      const { ctx, palette: p } = a;
      const doorH = Math.min(r.h, 5 * T);
      ctx.fillStyle = p.structure;
      rounded(ctx, { x: r.x + T, y: r.y + r.h - doorH, w: r.w - 2 * T, h: doorH }, [8, 8, 0, 0]);
      ctx.fill();
      ctx.strokeStyle = p.rim;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
      const s = 10;
      for (let i = 0; i < 4; i++) {
        const x = r.x + ((i + 0.5) * r.w) / 4;
        ctx.fillStyle = 'rgba(40, 30, 60, 0.45)';
        rounded(ctx, { x: x - s / 2, y: r.y + T - s / 2, w: s, h: s }, 2);
        ctx.fill();
        // Chaque creux a la couleur de son îlot (D-171).
        ctx.strokeStyle = isletColor(i, 0.85);
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 1.5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    },
    toyblocks(a, r) {
      // Des cubes de jouets géants empilés (d'après les tuiles) : chaque cube de 2 tuiles, sa lettre.
      const { ctx, palette: p } = a;
      tileShape(a, r, p.toy, p.toyLight);
      if (p.silhouettes) {
        return;
      }
      for (let y = r.y; y < r.y + r.h; y += 2 * T) {
        for (let x = r.x; x < r.x + r.w; x += 2 * T) {
          const color = CUBES[Math.floor(hash(x, y) * CUBES.length)] ?? CUBES[0];
          ctx.fillStyle = color;
          rounded(ctx, { x: x + 1, y: y + 1, w: 2 * T - 2, h: 2 * T - 2 }, 3);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 6, y + 6, 2 * T - 12, 2 * T - 12);
        }
      }
    },
    giantable(a, r) {
      // La table basse, géante : le plateau (sa tuile) et quatre pieds tournés, derrière, jusqu'au
      // sol (on passe dessous, devant eux).
      const { ctx, palette: p } = a;
      tileShape(a, { x: r.x, y: r.y, w: r.w, h: T }, p.wood, p.woodLight);
      ctx.fillStyle = p.woodDark;
      for (const x of [r.x + 6, r.x + r.w - 12]) {
        rounded(ctx, { x, y: r.y + T, w: 6, h: r.h - T }, 2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.6;
      for (const x of [r.x + T + 4, r.x + r.w - T - 8]) {
        rounded(ctx, { x, y: r.y + T, w: 4, h: r.h - T - 2 }, 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    passagebed(a, r) {
      // Vers la chambre et le jardin renversé : un arc, la tête d'un lit, des feuilles de haie.
      // Aux couleurs de son cube (D-171), éteint une fois l'îlot fini.
      const g = isletLook(a, 0);
      arch(a, r, g);
      const { ctx } = a;
      ctx.strokeStyle = g.strong;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w * 0.25, r.y + r.h * 0.8);
      ctx.lineTo(r.x + r.w * 0.25, r.y + r.h * 0.55);
      ctx.quadraticCurveTo(r.x + r.w / 2, r.y + r.h * 0.42, r.x + r.w * 0.75, r.y + r.h * 0.55);
      ctx.lineTo(r.x + r.w * 0.75, r.y + r.h * 0.8);
      ctx.stroke();
      ctx.fillStyle = g.soft;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.ellipse(
          r.x + 4 + hash(i, 3) * (r.w - 8),
          r.y + r.h - 4 - hash(i, 4) * 6,
          3,
          1.6,
          hash(i, 5) * 3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      doneCube(a, r.x + r.w / 2, r.y + r.w / 2, g);
    },
    napexit(a, r) {
      // La sortie de la chambre de la sieste (D-164, revue des portes) : l'arche de la maison de la
      // nounou, sans dessin dessus : elle ramène à la maison.
      arch(a, r);
    },
    bedgate(a, r) {
      // Le raccourci de l'îlot 1 (D-112) : une petite arche basse, à hauteur de tout-petit, la tête
      // d'un lit dessinée dessus, des feuilles de haie au pied. Elle ne mène nulle part tant que Roger
      // n'est pas retrouvé (la porte n'existe pas encore). Aux couleurs de son cube (D-171).
      const g = isletLook(a, 0);
      arch(a, r, g);
      const { ctx } = a;
      ctx.strokeStyle = g.soft;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w * 0.28, r.y + r.h * 0.75);
      ctx.lineTo(r.x + r.w * 0.28, r.y + r.h * 0.5);
      ctx.quadraticCurveTo(r.x + r.w / 2, r.y + r.h * 0.38, r.x + r.w * 0.72, r.y + r.h * 0.5);
      ctx.lineTo(r.x + r.w * 0.72, r.y + r.h * 0.75);
      ctx.stroke();
      ctx.fillStyle = g.soft;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(
          r.x + 3 + hash(i, 7) * (r.w - 6),
          r.y + r.h - 2,
          2.6,
          1.3,
          hash(i, 8) * 3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    },
    schoolgate(a, r) {
      // Le raccourci de l'îlot 2 (D-113) : la même petite arche, l'horloge ronde de l'école dessus.
      const g = isletLook(a, 1);
      arch(a, r, g);
      const { ctx } = a;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h * 0.5;
      ctx.strokeStyle = g.soft;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r.w * 0.2, 0, Math.PI * 2);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - r.w * 0.13);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r.w * 0.09, cy);
      ctx.stroke();
    },
    stationgate(a, r) {
      // Le raccourci de l'îlot 3 (D-114) : la même petite arche, l'horloge de quai pendue et un rail.
      const g = isletLook(a, 2);
      arch(a, r, g);
      const { ctx } = a;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h * 0.45;
      ctx.strokeStyle = g.soft;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, r.y + r.w * 0.25);
      ctx.lineTo(cx, cy - r.w * 0.16);
      ctx.moveTo(cx + r.w * 0.16, cy);
      ctx.arc(cx, cy, r.w * 0.16, 0, Math.PI * 2);
      ctx.moveTo(r.x + 3, r.y + r.h - 3);
      ctx.lineTo(r.x + r.w - 3, r.y + r.h - 3);
      ctx.stroke();
    },
    seagate(a, r) {
      // Le raccourci de l'îlot 4 (D-115) : la même petite arche, un petit carrousel (D-171 : son mât,
      // son toit festonné, son fanion ; l'ancien toit seul se lisait comme une flèche) et une vague.
      const g = isletLook(a, 3);
      arch(a, r, g);
      const { ctx } = a;
      const cx = r.x + r.w / 2;
      const top = r.y + r.h * 0.28;
      const eave = r.y + r.h * 0.46;
      const half = r.w * 0.3;
      ctx.strokeStyle = g.soft;
      ctx.fillStyle = g.soft;
      ctx.lineWidth = 1.2;
      // Le fanion, au bout du mât.
      ctx.beginPath();
      ctx.moveTo(cx, top);
      ctx.lineTo(cx, top - 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, top - 6);
      ctx.lineTo(cx + 5, top - 4.5);
      ctx.lineTo(cx, top - 3);
      ctx.fill();
      // Le toit en chapiteau, festonné.
      ctx.beginPath();
      ctx.moveTo(cx, top);
      ctx.lineTo(cx - half, eave);
      for (let k = 0; k < 4; k++) {
        const x0 = cx - half + (k * 2 * half) / 4;
        ctx.quadraticCurveTo(x0 + half / 4, eave + 3, x0 + half / 2, eave);
      }
      ctx.closePath();
      ctx.fill();
      // Le mât et deux chevaux de bois, de simples barres.
      ctx.beginPath();
      ctx.moveTo(cx, eave);
      ctx.lineTo(cx, r.y + r.h - 6);
      for (const x of [cx - half * 0.6, cx + half * 0.6]) {
        ctx.moveTo(x, eave + 2);
        ctx.lineTo(x, r.y + r.h * 0.7);
        ctx.moveTo(x - 3, r.y + r.h * 0.66);
        ctx.lineTo(x + 3, r.y + r.h * 0.66);
      }
      ctx.moveTo(r.x + 3, r.y + r.h - 3);
      ctx.quadraticCurveTo(cx - r.w * 0.15, r.y + r.h - 6, cx, r.y + r.h - 3);
      ctx.quadraticCurveTo(cx + r.w * 0.15, r.y + r.h, r.x + r.w - 3, r.y + r.h - 3);
      ctx.stroke();
    },
    napcot(a, r) {
      // Le petit lit de la sieste (D-116), à barreaux, au sommet de la chambre : son matelas est la
      // dernière tuile (la collision) ; ses deux bouts à barreaux, et un drap qui pend.
      const { ctx, palette: p } = a;
      const top = r.y + r.h - T;
      tileShape(a, { x: r.x, y: top, w: r.w, h: T }, p.wood, p.woodLight);
      ctx.fillStyle = p.fabric;
      ctx.fillRect(r.x + 2 * T, top - 2, r.w - 4 * T, 4);
      ctx.strokeStyle = p.wood;
      ctx.lineWidth = 2;
      for (const x0 of [r.x + 2, r.x + r.w - 2 * T + 2]) {
        ctx.strokeRect(x0, r.y + T, 2 * T - 4, top - r.y - T);
        ctx.beginPath();
        for (let x = x0 + 5; x < x0 + 2 * T - 4; x += 5) {
          ctx.moveTo(x, r.y + T);
          ctx.lineTo(x, top);
        }
        ctx.stroke();
      }
    },
    cantower(a, r) {
      // L'arrosoir de papa (D-49), géant, debout cette fois (D-112) : son corps est la collision ;
      // l'anse dessinée sur le haut, le bec qui part vers la droite, des bandes. On passe dessous.
      const { ctx, palette: p } = a;
      tileShape(a, r, p.wood, p.woodLight);
      ctx.strokeStyle = p.rim;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 2;
      for (const f of [0.18, 0.82]) {
        ctx.beginPath();
        ctx.moveTo(r.x + 2, r.y + r.h * f);
        ctx.lineTo(r.x + r.w - 2, r.y + r.h * f);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x + r.w * 0.35, r.y + r.h * 0.3, r.w * 0.18, Math.PI * 1.1, Math.PI * 1.9);
      ctx.moveTo(r.x + r.w - 4, r.y + r.h * 0.55);
      ctx.lineTo(r.x + r.w - 4 - r.w * 0.2, r.y + r.h * 0.4);
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
    passageschool(a, r) {
      // Vers l'école et la rue : l'horloge ronde de l'école, un crayon géant.
      const g = isletLook(a, 1);
      arch(a, r, g);
      const { ctx } = a;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.w / 2 + 2;
      ctx.strokeStyle = g.strong;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r.w * 0.22, 0, Math.PI * 2);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - r.w * 0.15);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r.w * 0.1, cy);
      ctx.moveTo(r.x + r.w * 0.2, r.y + r.h - 3);
      ctx.lineTo(r.x + r.w * 0.8, r.y + r.h * 0.62);
      ctx.stroke();
      doneCube(a, cx, r.y + r.h * 0.72, g);
    },
    passagestation(a, r) {
      // Vers la gare et le train : l'horloge de quai pendue, et un rail qui file.
      const g = isletLook(a, 2);
      arch(a, r, g);
      const { ctx } = a;
      const cx = r.x + r.w / 2;
      ctx.strokeStyle = g.strong;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, r.y + r.w * 0.15);
      ctx.lineTo(cx, r.y + r.w * 0.3);
      ctx.moveTo(cx + 6, r.y + r.w * 0.4);
      ctx.arc(cx, r.y + r.w * 0.4, 6, 0, Math.PI * 2);
      ctx.moveTo(r.x + 3, r.y + r.h - 4);
      ctx.lineTo(r.x + r.w - 3, r.y + r.h - 4);
      ctx.moveTo(r.x + 3, r.y + r.h - 8);
      ctx.lineTo(r.x + r.w - 3, r.y + r.h - 8);
      ctx.stroke();
      doneCube(a, cx, r.y + r.h * 0.6, g);
    },
    passagesea(a, r) {
      // Vers la plage et le carrousel (redessinée en D-171 : elle ressemblait à une marche) : une
      // vraie trappe dans le plancher, son abattant levé (ses planches, son anneau), une lueur bleue
      // qui monte du trou, une vague dedans, un peu de sable autour.
      const { ctx, palette: p } = a;
      const g = isletLook(a, 3);
      const floor = r.y + r.h;
      const hole = { x: r.x + r.w * 0.34, w: r.w * 0.5 };
      // La lueur qui monte du trou, plus large en haut.
      const light = ctx.createLinearGradient(0, floor, 0, r.y);
      light.addColorStop(0, g.soft);
      light.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.moveTo(hole.x, floor - 3);
      ctx.lineTo(hole.x + hole.w, floor - 3);
      ctx.lineTo(hole.x + hole.w + 8, r.y);
      ctx.lineTo(hole.x - 8, r.y);
      ctx.closePath();
      ctx.fill();
      // Le trou, vu un peu de dessus, et sa vague.
      ctx.fillStyle = p.structure;
      ctx.fillRect(hole.x, floor - 5, hole.w, 5);
      ctx.strokeStyle = g.strong;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(hole.x + 0.6, floor - 5, hole.w - 1.2, 4.4);
      ctx.beginPath();
      ctx.moveTo(hole.x + 4, floor - 2.5);
      ctx.quadraticCurveTo(hole.x + hole.w * 0.3, floor - 5, hole.x + hole.w / 2, floor - 2.5);
      ctx.quadraticCurveTo(hole.x + hole.w * 0.7, floor, hole.x + hole.w - 4, floor - 2.5);
      ctx.stroke();
      // L'abattant, levé sur sa charnière (à gauche du trou), penché en arrière.
      const len = hole.w * 0.9;
      ctx.save();
      ctx.translate(hole.x, floor - 5);
      ctx.rotate(-Math.PI * 0.62);
      const thick = 9;
      ctx.fillStyle = p.wood;
      ctx.fillRect(0, -thick, len, thick);
      ctx.strokeStyle = p.woodDark;
      ctx.lineWidth = 0.8;
      for (let k = 1; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo((k * len) / 4, -thick);
        ctx.lineTo((k * len) / 4, 0);
        ctx.stroke();
      }
      ctx.strokeStyle = g.strong;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(0.6, -thick + 0.6, len - 1.2, thick - 1.2);
      ctx.beginPath();
      ctx.arc(len - 8, -thick / 2, 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = 'rgba(230, 205, 150, 0.45)';
      for (let k = 0; k < r.w / 6; k++) {
        ctx.fillRect(r.x + hash(k, 6) * r.w, floor - 2 - hash(k, 7) * 2, 1.5, 1);
      }
      doneCube(a, hole.x + hole.w / 2, r.y + r.h * 0.45, g);
    },
  };
}
