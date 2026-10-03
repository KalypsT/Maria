import { TILE_SIZE as T } from '../../config/display';
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
/** Les cubes de jouets : rouge, bleu, jaune, vert, passés. */
const CUBES = ['#d9788f', '#6f8fc4', '#e6c27a', '#7fa37a'] as const;

/** Pseudo-hasard stable (même dessin à chaque chargement). */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 41.3 + y * 97.1) * 43758.5453;
  return n - Math.floor(n);
}

export function nannyDrawers({ tileShape, rounded }: ShapeTools): Record<string, Drawer> {
  /** Le motif d'un passage : un arc sombre bordé de turquoise, où passe une lueur. */
  const arch = (a: ArtContext, r: Rect) => {
    const { ctx, palette: p } = a;
    ctx.fillStyle = p.structure;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y + r.h);
    ctx.lineTo(r.x, r.y + r.w / 2);
    ctx.arc(r.x + r.w / 2, r.y + r.w / 2, r.w / 2, Math.PI, 0);
    ctx.lineTo(r.x + r.w, r.y + r.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = GLOW_SOFT;
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
      // veilleuses éteintes (une par îlot de mémoire).
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
      for (let i = 0; i < 4; i++) {
        const x = r.x + ((i + 0.5) * r.w) / 4;
        ctx.fillStyle = 'rgba(160, 160, 190, 0.45)';
        ctx.beginPath();
        ctx.arc(x, r.y + T, 3, 0, Math.PI * 2);
        ctx.fill();
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
      arch(a, r);
      const { ctx } = a;
      ctx.strokeStyle = GLOW;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w * 0.25, r.y + r.h * 0.8);
      ctx.lineTo(r.x + r.w * 0.25, r.y + r.h * 0.55);
      ctx.quadraticCurveTo(r.x + r.w / 2, r.y + r.h * 0.42, r.x + r.w * 0.75, r.y + r.h * 0.55);
      ctx.lineTo(r.x + r.w * 0.75, r.y + r.h * 0.8);
      ctx.stroke();
      ctx.fillStyle = GLOW_SOFT;
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
    },
    bedgate(a, r) {
      // Le raccourci de l'îlot 1 (D-112) : une petite arche basse, à hauteur de tout-petit, la tête
      // d'un lit dessinée dessus, des feuilles de haie au pied. Elle ne mène nulle part tant que Roger
      // n'est pas retrouvé (la porte n'existe pas encore).
      arch(a, r);
      const { ctx } = a;
      ctx.strokeStyle = GLOW_SOFT;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w * 0.28, r.y + r.h * 0.75);
      ctx.lineTo(r.x + r.w * 0.28, r.y + r.h * 0.5);
      ctx.quadraticCurveTo(r.x + r.w / 2, r.y + r.h * 0.38, r.x + r.w * 0.72, r.y + r.h * 0.5);
      ctx.lineTo(r.x + r.w * 0.72, r.y + r.h * 0.75);
      ctx.stroke();
      ctx.fillStyle = GLOW_SOFT;
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
      arch(a, r);
      const { ctx } = a;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h * 0.5;
      ctx.strokeStyle = GLOW_SOFT;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r.w * 0.2, 0, Math.PI * 2);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - r.w * 0.13);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r.w * 0.09, cy);
      ctx.stroke();
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
      arch(a, r);
      const { ctx } = a;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.w / 2 + 2;
      ctx.strokeStyle = GLOW;
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
    },
    passagestation(a, r) {
      // Vers la gare et le train : l'horloge de quai pendue, et un rail qui file.
      arch(a, r);
      const { ctx } = a;
      const cx = r.x + r.w / 2;
      ctx.strokeStyle = GLOW;
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
    },
    passagesea(a, r) {
      // Vers la plage et le carrousel : une trappe dans le plancher, une vague, un peu de sable.
      const { ctx, palette: p } = a;
      ctx.fillStyle = p.structure;
      ctx.fillRect(r.x, r.y + r.h - 6, r.w, 6);
      ctx.strokeStyle = GLOW;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(r.x + 0.75, r.y + r.h - 6, r.w - 1.5, 5);
      ctx.beginPath();
      ctx.moveTo(r.x + 4, r.y + r.h - 12);
      ctx.quadraticCurveTo(r.x + r.w * 0.3, r.y + r.h - 20, r.x + r.w / 2, r.y + r.h - 12);
      ctx.quadraticCurveTo(r.x + r.w * 0.7, r.y + r.h - 4, r.x + r.w - 4, r.y + r.h - 12);
      ctx.stroke();
      ctx.fillStyle = 'rgba(230, 205, 150, 0.45)';
      for (let k = 0; k < r.w / 6; k++) {
        ctx.fillRect(r.x + hash(k, 6) * r.w, r.y + r.h - 7 - hash(k, 7) * 3, 1.5, 1);
      }
    },
  };
}
