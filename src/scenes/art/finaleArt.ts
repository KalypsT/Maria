import { TILE_SIZE as T } from '../../config/display';
import type { ShapeTools } from './gardenArt';
import type { ArtContext, Rect } from './roomArt';

/**
 * Le dernier niveau (D-138, D-141), le monde de Maria : la chambre du premier soir, démesurée, à la
 * lumière de la veilleuse. PLACEHOLDER. Le berceau vide sur le coffre à jouets, la veilleuse
 * champignon, la jupe du lit, l'oreiller, la cabane du lit et sa guirlande (les ampoules du premier
 * soir), la boîte à musique. Les étoiles de la berceuse sont dessinées à part (`LullabyView`).
 */

type Drawer = (a: ArtContext, r: Rect) => void;

/** La couverture du berceau : rose à carreaux, comme le premier soir (D-31). */
const BLANKET = '#f19bb5';
const BLANKET_LIGHT = '#f8c3d3';
/** Le chapeau de la veilleuse : rouge à pois, une lumière chaude dessous. */
const CAP = '#d9707a';
const CAP_DOTS = '#fbe9d6';
const LIGHT = 'rgba(255, 214, 150, 0.35)';
/** Les ampoules de la guirlande. */
const BULBS = ['#ffd88a', '#f6b3c4', '#bfe8d8'] as const;

export function finaleDrawers({ tileShape, rounded }: ShapeTools): Record<string, Drawer> {
  return {
    giantcradle(a, r) {
      // Le berceau, démesuré : une caisse sur deux patins, le côté bas à gauche (on en sort), la tête
      // haute à droite ; des barreaux ; dedans, l'oreiller et la couverture bordée, et personne.
      const { ctx, palette: p } = a;
      const base = r.y + r.h - 3 * T;
      tileShape(a, r, p.wood, p.woodLight, 'rgba(0,0,0,0.2)');
      // Les patins, sous la caisse.
      ctx.strokeStyle = p.woodDark;
      ctx.lineWidth = T * 0.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(r.x + T * 0.5, r.y + r.h - T * 0.4);
      ctx.quadraticCurveTo(
        r.x + r.w / 2,
        r.y + r.h + T * 0.5,
        r.x + r.w - T * 0.5,
        r.y + r.h - T * 0.4,
      );
      ctx.stroke();
      // Les barreaux des deux côtés.
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let x = r.x + T * 1.5; x < r.x + r.w - T; x += T * 1.2) {
        ctx.fillRect(x, base + T * 0.4, T * 0.3, T * 1.8);
      }
      // L'oreiller à la tête (à droite) et la couverture rose, bien bordée.
      ctx.fillStyle = p.linen;
      rounded(ctx, { x: r.x + r.w - 4 * T, y: base - T * 1.4, w: 2.6 * T, h: T * 1.4 }, T * 0.6);
      ctx.fill();
      ctx.fillStyle = BLANKET;
      rounded(ctx, { x: r.x + 2 * T, y: base - T * 1.1, w: r.w - 6.5 * T, h: T * 1.1 }, T * 0.4);
      ctx.fill();
      ctx.fillStyle = BLANKET_LIGHT;
      for (let x = r.x + 2.6 * T; x < r.x + r.w - 5 * T; x += T * 1.1) {
        ctx.fillRect(x, base - T * 0.9, T * 0.4, T * 0.4);
      }
    },
    nightlamp(a, r) {
      // La veilleuse champignon : un chapeau rouge à pois, un pied, une lumière chaude dessous.
      const { ctx, palette: p } = a;
      const glow = ctx.createRadialGradient(
        r.x + r.w / 2,
        r.y + T * 2,
        T,
        r.x + r.w / 2,
        r.y + T * 2,
        r.w * 1.6,
      );
      glow.addColorStop(0, LIGHT);
      glow.addColorStop(1, 'rgba(255, 214, 150, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(r.x - r.w * 1.6, r.y - r.w, r.w * 4.2, r.h + r.w * 1.5);
      ctx.fillStyle = p.linen;
      rounded(ctx, { x: r.x + r.w - 2 * T, y: r.y + 2 * T, w: 2 * T, h: r.h - 2 * T }, T * 0.4);
      ctx.fill();
      ctx.fillStyle = CAP;
      ctx.beginPath();
      ctx.moveTo(r.x - T * 0.3, r.y + 2 * T);
      ctx.quadraticCurveTo(r.x + r.w / 2, r.y - T * 1.2, r.x + r.w + T * 0.3, r.y + 2 * T);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = CAP_DOTS;
      for (const [dx, dy, s] of [
        [0.25, 1.1, 0.35],
        [0.55, 0.5, 0.45],
        [0.8, 1.2, 0.3],
      ] as const) {
        ctx.beginPath();
        ctx.arc(r.x + r.w * dx, r.y + T * dy, T * s, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    bedskirt(a, r) {
      // La jupe du lit : un volant de tissu qui pend, ses plis ; dessous, juste la place de glisser.
      const { ctx, palette: p } = a;
      ctx.fillStyle = p.fabric;
      ctx.fillRect(r.x, r.y, r.w, r.h - T * 0.3);
      ctx.fillStyle = p.fabricLight;
      for (let x = r.x + T * 0.4; x < r.x + r.w; x += T) {
        ctx.fillRect(x, r.y + T * 0.2, T * 0.25, r.h - T * 0.6);
      }
      ctx.fillStyle = p.fabric;
      for (let x = r.x; x < r.x + r.w; x += T) {
        ctx.beginPath();
        ctx.arc(x + T / 2, r.y + r.h - T * 0.3, T / 2, 0, Math.PI);
        ctx.fill();
      }
    },
    giantpillow(a, r) {
      // L'oreiller, posé contre la tête de lit : on y monte.
      const { ctx, palette: p } = a;
      ctx.fillStyle = p.linen;
      rounded(ctx, r, T);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(r.x + T, r.y + r.h / 2);
      ctx.quadraticCurveTo(r.x + r.w / 2, r.y + r.h * 0.8, r.x + r.w - T, r.y + r.h / 2);
      ctx.stroke();
    },
    giantcabin(a, r) {
      // La cabane du lit (D-75), démesurée : deux montants posés sur le lit, le toit en pente. Ses
      // barreaux et sa traverse sont à part (des étagères), sa guirlande aussi (le souvenir).
      const { ctx, palette: p } = a;
      const post = T * 0.9;
      const beam = r.y + 10 * T;
      const bottom = r.y + r.h;
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(r.x, beam, post, bottom - beam);
      ctx.fillRect(r.x + r.w - post, beam, post, bottom - beam);
      ctx.strokeStyle = p.wood;
      ctx.lineWidth = post;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(r.x + post / 2, beam);
      ctx.lineTo(r.x + r.w / 2, r.y + post / 2);
      ctx.lineTo(r.x + r.w - post / 2, beam);
      ctx.stroke();
    },
    garland(a, r) {
      // La guirlande de la cabane (le souvenir du premier soir) : un fil tendu et ses ampoules, assez
      // serrées pour s'y poser.
      const { ctx, palette: p } = a;
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(r.x, r.y + 1, r.w, 2);
      for (let i = 0, x = r.x + T * 0.3; x < r.x + r.w; i++, x += T * 0.5) {
        ctx.fillStyle = BULBS[i % BULBS.length] ?? BULBS[0];
        ctx.beginPath();
        ctx.ellipse(x, r.y + 5, T * 0.18, T * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    giantmusicbox(a, r) {
      // La boîte à musique (D-38) : une boîte de bois, sa manivelle, une petite étoile dessus.
      const { ctx, palette: p } = a;
      tileShape(a, r, p.wood, p.woodLight, 'rgba(0,0,0,0.22)');
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(r.x + T * 0.3, r.y + T * 0.9, r.w - T * 0.6, T * 0.25);
      ctx.strokeStyle = p.woodLight;
      ctx.lineWidth = T * 0.25;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w, r.y + r.h / 2);
      ctx.lineTo(r.x + r.w + T * 0.8, r.y + r.h / 2);
      ctx.lineTo(r.x + r.w + T * 0.8, r.y + r.h / 2 - T * 0.8);
      ctx.stroke();
      ctx.fillStyle = BULBS[0];
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const angle = -Math.PI / 2 + (k * Math.PI) / 5;
        const radius = k % 2 === 0 ? T * 0.55 : T * 0.25;
        const x = r.x + r.w / 2 + Math.cos(angle) * radius;
        const y = r.y - T * 0.5 + Math.sin(angle) * radius;
        if (k === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
    },
    // Les étoiles de la berceuse (D-140) : dessinées par `LullabyView`.
    lullabystar() {
      return;
    },
  };
}
