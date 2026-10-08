import { TILE_SIZE as T } from '../../config/display';
import type { ShapeTools } from './gardenArt';
import type { ArtContext, Rect } from './roomArt';

/**
 * Le dernier niveau (D-138, D-141), le monde de Maria : la chambre du premier soir, démesurée, à la
 * lumière de la veilleuse. PLACEHOLDER. Le berceau vide sur le coffre à jouets, la veilleuse
 * champignon, la jupe du lit, l'oreiller, la cabane du lit et sa guirlande (les ampoules du premier
 * soir), la boîte à musique. Les étoiles de la berceuse sont dessinées à part (`LullabyView`).
 * Le ciel de la chambre (D-142) : le cadre, les fils et la lune du mobile, la fenêtre et ses rideaux
 * (fermé ce soir, ouvert le premier soir), le battant ouvert, le surmeuble accroché au-dessus du
 * bureau, la petite porte du grenier.
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
    bigcradle(a, r) {
      // La chambre grande (D-143) : le berceau de poupée deux fois trop grand, sur le coffre ; son
      // côté monte plus haut que le bord : on n'en voit que la couverture, bombée. Pas Maria.
      const { ctx, palette: p } = a;
      const k = r.w / 30;
      const h = r.h / k;
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.scale(k, k);
      ctx.strokeStyle = p.woodDark;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(1, h - 3);
      ctx.quadraticCurveTo(15, h + 1.5, 29, h - 3);
      ctx.stroke();
      ctx.fillStyle = BLANKET;
      ctx.beginPath();
      ctx.moveTo(6, h - 11);
      ctx.quadraticCurveTo(13, h - 15, 20, h - 12.5);
      ctx.quadraticCurveTo(24, h - 11.5, 25, h - 11);
      ctx.lineTo(25, h - 9);
      ctx.lineTo(6, h - 9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = p.wood;
      ctx.beginPath();
      ctx.roundRect(3, h - 12, 24, 9, 2);
      ctx.roundRect(2, h - 16, 4, 13, [2, 2, 0, 0]);
      ctx.roundRect(24, h - 14, 4, 11, [2, 2, 0, 0]);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (let x = 9; x < 23; x += 4) {
        ctx.fillRect(x, h - 11, 1, 7);
      }
      ctx.fillStyle = BLANKET_LIGHT;
      for (let x = 9; x < 21; x += 3) {
        ctx.fillRect(x, h - 12.6, 1, 1);
      }
      ctx.restore();
    },
    // Les étoiles de la berceuse (D-140) : dessinées par `LullabyView`.
    lullabystar() {
      return;
    },
    // Le ciel de la chambre (D-142).
    giantframe(a, r) {
      // La moulure du cadre, au mur : elle dépasse, on s'y pose.
      const { palette: p } = a;
      tileShape(a, r, p.wood, p.woodLight, 'rgba(0,0,0,0.25)');
    },
    giantpicture(a, r) {
      // La toile du cadre, à plat contre le mur, sous sa moulure : une lune qui dort sur des
      // nuages.
      const { ctx, palette: p } = a;
      const canvas = { x: r.x + T * 0.4, y: r.y, w: r.w - T * 0.8, h: r.h - T * 0.3 };
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(canvas.x - 3, canvas.y, canvas.w + 6, canvas.h + 3);
      ctx.fillStyle = p.nightLow;
      ctx.fillRect(canvas.x, canvas.y, canvas.w, canvas.h);
      ctx.fillStyle = p.linen;
      for (const [dx, dy, size] of [
        [0.25, 0.75, 0.9],
        [0.45, 0.8, 1.1],
        [0.7, 0.72, 0.8],
      ] as const) {
        ctx.beginPath();
        ctx.arc(canvas.x + canvas.w * dx, canvas.y + canvas.h * dy, T * size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = BULBS[0];
      ctx.beginPath();
      ctx.arc(canvas.x + canvas.w * 0.6, canvas.y + canvas.h * 0.35, T * 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.nightLow;
      ctx.beginPath();
      ctx.arc(canvas.x + canvas.w * 0.66, canvas.y + canvas.h * 0.3, T * 0.95, 0, Math.PI * 2);
      ctx.fill();
    },
    mobilethread(a, r) {
      // Un fil du mobile, du plafond à ce qu'il tient : un trait, un nœud en bas.
      const { ctx, palette: p } = a;
      // Il finit au centre de sa dernière tuile, là où passe le câble qu'il tient.
      const x = r.x + r.w / 2;
      ctx.strokeStyle = p.linen;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, r.y);
      ctx.lineTo(x, r.y + r.h - T / 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.woodDark;
      ctx.beginPath();
      ctx.arc(x, r.y + 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    },
    mobilestar(a, r) {
      // Une petite étoile du mobile, pendue à un bout de fil (depuis le centre de sa première tuile,
      // le bout d'un câble) : trop petite pour s'y poser.
      const { ctx, palette: p } = a;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h - T * 0.45;
      ctx.strokeStyle = p.linen;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, r.y + T / 2);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = BULBS[0];
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const angle = -Math.PI / 2 + (k * Math.PI) / 5;
        const radius = k % 2 === 0 ? T * 0.42 : T * 0.18;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (k === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
    },
    giantmoon(a, r) {
      // La lune du mobile, couchée comme une barque : le dessus plat (on s'y pose), le ventre rond,
      // les deux pointes relevées.
      const { ctx } = a;
      const top = r.y + 2;
      ctx.fillStyle = BULBS[0];
      ctx.beginPath();
      ctx.moveTo(r.x - T * 0.3, top - T * 0.5);
      ctx.quadraticCurveTo(r.x + T * 0.2, top, r.x + T * 0.6, top);
      ctx.lineTo(r.x + r.w - T * 0.6, top);
      ctx.quadraticCurveTo(r.x + r.w - T * 0.2, top, r.x + r.w + T * 0.3, top - T * 0.5);
      ctx.quadraticCurveTo(r.x + r.w, r.y + r.h, r.x + r.w / 2, r.y + r.h);
      ctx.quadraticCurveTo(r.x, r.y + r.h, r.x - T * 0.3, top - T * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(r.x + T * 0.6, top, r.w - T * 1.2, 2);
      // Un œil fermé : la lune dort.
      ctx.strokeStyle = 'rgba(120,90,60,0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(r.x + r.w * 0.62, top + T * 0.45, T * 0.3, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    },
    giantwindow(a, r) {
      // La fenêtre, démesurée : la nuit dehors, quelques étoiles, les croisillons.
      const { ctx, palette: p } = a;
      ctx.fillStyle = p.linen;
      rounded(ctx, { x: r.x - 6, y: r.y - 6, w: r.w + 12, h: r.h + 6 }, 8);
      ctx.fill();
      const sky = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
      sky.addColorStop(0, p.night);
      sky.addColorStop(1, p.nightLow);
      ctx.fillStyle = sky;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(255,240,210,0.8)';
      for (let i = 0; i < 18; i++) {
        const x = r.x + ((i * 0.618) % 1) * r.w;
        const y = r.y + ((i * 0.382) % 1) * r.h * 0.8;
        ctx.fillRect(x, y, 1.5, 1.5);
      }
      ctx.fillStyle = p.linen;
      ctx.fillRect(r.x + r.w / 2 - 4, r.y, 8, r.h);
      for (const k of [1 / 3, 2 / 3]) {
        ctx.fillRect(r.x, r.y + r.h * k - 3, r.w, 6);
      }
    },
    curtainrod(a, r) {
      // La tringle, tout en haut, et ses deux pommeaux.
      const { ctx, palette: p } = a;
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(r.x, r.y + T * 0.4, r.w, 3);
      for (const x of [r.x, r.x + r.w]) {
        ctx.beginPath();
        ctx.arc(x, r.y + T * 0.4 + 1.5, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    giantcurtain(a, r) {
      // Le rideau fermé, ce soir (le présent) : un grand pan de tissu, ses plis, jusqu'en bas.
      const { ctx, palette: p } = a;
      ctx.fillStyle = p.curtain;
      rounded(ctx, r, [0, 0, T * 0.4, T * 0.4]);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      for (let x = r.x + T * 0.6; x < r.x + r.w - T * 0.3; x += T * 0.9) {
        ctx.fillRect(x, r.y, T * 0.18, r.h - T * 0.3);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let x = r.x + T * 0.2; x < r.x + r.w - T * 0.3; x += T * 0.9) {
        ctx.fillRect(x, r.y, T * 0.12, r.h - T * 0.3);
      }
    },
    tiedcurtain(a, r) {
      // Le rideau ouvert du premier soir (le souvenir) : rassemblé, noué par son embrasse.
      const { ctx, palette: p } = a;
      const tie = r.y + r.h * 0.45;
      ctx.fillStyle = p.curtain;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x + r.w, r.y);
      ctx.quadraticCurveTo(r.x + r.w * 0.7, tie, r.x + r.w, r.y + r.h);
      ctx.lineTo(r.x, r.y + r.h);
      ctx.quadraticCurveTo(r.x + r.w * 0.3, tie, r.x, r.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fillRect(r.x + r.w / 2 - 1, r.y, 2, r.h);
      ctx.fillStyle = BULBS[1];
      ctx.fillRect(r.x - 2, tie - T * 0.3, r.w + 4, T * 0.6);
    },
    casement(a, r) {
      // Le battant ouvert, le premier soir (le souvenir) : on voit son cadre de profil, la vitre.
      const { ctx, palette: p } = a;
      ctx.fillStyle = p.linen;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(160,200,230,0.45)';
      ctx.fillRect(r.x + 4, r.y + 6, r.w - 8, r.h - 12);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(r.x + 6, r.y + 10, 2, r.h * 0.4);
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(r.x + r.w - 4, r.y + r.h * 0.5, 4, T * 0.8);
    },
    gianthutch(a, r) {
      // Le surmeuble, accroché au mur juste au-dessus du bureau : deux portes, une corniche ;
      // dessous, juste la place de glisser.
      const { ctx, palette: p } = a;
      tileShape(a, r, p.wood, p.woodLight, 'rgba(0,0,0,0.22)');
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 1.5;
      const half = r.w / 2;
      for (const x of [r.x + T * 0.4, r.x + half + T * 0.15]) {
        ctx.beginPath();
        ctx.roundRect(x, r.y + T * 1.3, half - T * 0.55, r.h - T * 2, 4);
        ctx.stroke();
      }
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(r.x - 3, r.y, r.w + 6, T * 0.6);
      ctx.fillStyle = '#f2c879';
      ctx.beginPath();
      ctx.arc(r.x + half - T * 0.4, r.y + r.h / 2, 2.5, 0, Math.PI * 2);
      ctx.arc(r.x + half + T * 0.4, r.y + r.h / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // L'ombre sur le bureau, sous le meuble.
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(r.x, r.y + r.h + T - 3, r.w, 3);
    },
    giantdesk(a, r) {
      // Le bureau : son plateau (deux tuiles) et le caisson de tiroirs à gauche, qui descend dans le
      // noir.
      const { ctx, palette: p } = a;
      tileShape(a, { x: r.x, y: r.y, w: r.w, h: 2 * T }, p.wood, p.woodLight, 'rgba(0,0,0,0.25)');
      const drawers = { x: r.x, y: r.y + 2 * T, w: 3 * T, h: r.h - 2 * T };
      tileShape(a, drawers, p.wood, p.woodLight, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let y = drawers.y + 3 * T; y < drawers.y + drawers.h; y += 3 * T) {
        ctx.fillRect(drawers.x + 3, y, drawers.w - 6, 1.5);
      }
      ctx.fillStyle = '#f2c879';
      for (let y = drawers.y + 1.5 * T; y < drawers.y + drawers.h; y += 3 * T) {
        ctx.fillRect(drawers.x + drawers.w / 2 - 4, y, 8, 2.5);
      }
    },
    atticdoor(a, r) {
      // La petite porte du grenier, dans le mur (D-75) : son chambranle, deux panneaux, la poignée ;
      // fermée, un fil de lumière tout autour.
      const { ctx, palette: p } = a;
      const arch: [number, number, number, number] = [T * 0.9, T * 0.9, 0, 0];
      ctx.fillStyle = p.linen;
      rounded(ctx, { x: r.x - 5, y: r.y - 5, w: r.w + 10, h: r.h + 5 }, arch);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,214,150,0.55)';
      rounded(ctx, { x: r.x - 1.5, y: r.y - 1.5, w: r.w + 3, h: r.h + 1.5 }, arch);
      ctx.fill();
      ctx.fillStyle = p.wood;
      rounded(ctx, r, arch);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(r.x + T * 0.5, r.y + T * 1.2, r.w - T, r.h * 0.38, 3);
      ctx.roundRect(r.x + T * 0.5, r.y + r.h * 0.6, r.w - T, r.h * 0.32, 3);
      ctx.stroke();
      ctx.fillStyle = '#f2c879';
      ctx.beginPath();
      ctx.arc(r.x + r.w - T * 0.7, r.y + r.h * 0.55, 2.5, 0, Math.PI * 2);
      ctx.fill();
    },
  };
}
