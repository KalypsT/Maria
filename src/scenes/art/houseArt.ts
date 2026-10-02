import { TILE_SIZE as T } from '../../config/display';
import { Tile, tileAt, type LevelData } from '../../core/level/LevelData';
import type { ShapeTools } from './gardenArt';
import type { ArtContext, Rect } from './roomArt';

/**
 * La maison refaite d'après la grille du salon (D-75), dessinée par le code. Ce qu'on foule
 * (traverse du lit cabane, étagère du surmeuble, fronton du miroir, rebord, palier du grenier) suit
 * exactement ses tuiles ; montants, rampe, cadres et suspensions sont du fond, devant lequel on
 * passe, et chacun tient à quelque chose (rien ne flotte). Ce qui bouge (mobile, étoiles de la
 * veilleuse, poussière, papillon de nuit) est animé à part (`WorldLifeView`).
 */

type Drawer = (a: ArtContext, r: Rect) => void;

const GOLD = '#c9a45c';
const GOLD_DARK = '#a8843f';
const GLASS = '#9fb4c9';
const STONE = '#cbbda6';
const STONE_LIGHT = '#e0d4bf';
const TERRACOTTA = '#c46f4a';
const BULB = '#fff3c9';
const SHADE = '#f1d9a6';

/** Tuile pleine de la salle. */
function solid(level: LevelData, col: number, row: number): boolean {
  return tileAt(level, col, row) === Tile.Solid;
}

/** Ligne (tuiles) du premier appui sous (col, row), ou la hauteur de la salle. */
function groundBelow(level: LevelData, x: number, row: number): number {
  const col = Math.floor(x);
  for (let r = Math.floor(row); r < level.height; r++) {
    const tile = tileAt(level, col, r);
    if (tile === Tile.Solid || tile === Tile.OneWay) {
      return r;
    }
  }
  return level.height;
}

/** Contour des tuiles pleines d'un rectangle, pour y découper un dessin (`ctx.clip()`). */
function clipToSolid(a: ArtContext, r: Rect): void {
  const { ctx, level } = a;
  ctx.beginPath();
  for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
    for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
      if (solid(level, col, row)) {
        ctx.rect(col * T, row * T, T, T);
      }
    }
  }
  ctx.clip();
}

/**
 * Bord du bas d'un plafond plein (retombée, mansarde) : une poutre sous chaque colonne qui donne
 * sur le vide, et un montant sur chaque côté qui donne sur le vide.
 */
function ceilingEdge(a: ArtContext, r: Rect): void {
  const { ctx, level, palette: p } = a;
  for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
    for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
      if (!solid(level, col, row)) {
        continue;
      }
      if (!solid(level, col, row + 1)) {
        ctx.fillStyle = p.woodDark;
        ctx.fillRect(col * T, (row + 1) * T - 5, T, 5);
        if (!p.silhouettes) {
          ctx.fillStyle = p.wood;
          ctx.fillRect(col * T, (row + 1) * T - 5, T, 1.5);
        }
      }
      for (const side of [-1, 1]) {
        if (!solid(level, col + side, row)) {
          ctx.fillStyle = p.woodDark;
          ctx.fillRect(side < 0 ? col * T : (col + 1) * T - 4, row * T, 4, T);
        }
      }
    }
  }
}

/** Montant de bois (fond) de `y0` à `y1`, centré sur `x`. */
function post(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, w: number): void {
  ctx.fillRect(x - w / 2, y0, w, y1 - y0);
}

export function houseDrawers({ tileShape, rounded }: ShapeTools): Record<string, Drawer> {
  return {
    mansard(a, r) {
      // Un pan du toit vu de dessous : une pente droite qui passe sous toutes les tuiles pleines
      // (par les coins des marches de la collision ; on ne l'atteint jamais d'un saut), lambris
      // dans le sens de la pente, chevrons, poutre au bord.
      const { ctx, level, palette: p } = a;
      const runs: { x0: number; x1: number; y: number }[] = [];
      for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
        let bottom = -1;
        for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
          if (solid(level, col, row)) {
            bottom = row + 1;
          }
        }
        const run = runs[runs.length - 1];
        if (bottom < 0) {
          continue;
        }
        if (run && run.y === bottom * T && run.x1 === col * T) {
          run.x1 = (col + 1) * T;
        } else {
          runs.push({ x0: col * T, x1: (col + 1) * T, y: bottom * T });
        }
      }
      const first = runs[0];
      const end = runs[runs.length - 1];
      if (!first || !end || first === end) {
        return;
      }
      // Pente qui descend vers la droite : coins gauches des marches ; qui monte : coins droits.
      const down = end.y > first.y;
      const a0 = down ? { x: first.x0, y: first.y } : { x: first.x1, y: first.y };
      const a1 = down ? { x: end.x0, y: end.y } : { x: end.x1, y: end.y };
      const slope = (a1.y - a0.y) / (a1.x - a0.x);
      const at = (x: number) => a0.y + (x - a0.x) * slope;
      const left = r.x;
      const right = r.x + r.w;
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(left, r.y);
      ctx.lineTo(right, r.y);
      ctx.lineTo(right, at(right));
      ctx.lineTo(left, at(left));
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = p.structure;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      if (!p.silhouettes) {
        ctx.fillStyle = 'rgba(255,230,190,0.06)';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        // Lambris : des lignes parallèles à la pente.
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        for (let k = -r.h * 4; k < r.h; k += 5) {
          ctx.beginPath();
          ctx.moveTo(left, at(left) + k);
          ctx.lineTo(right, at(right) + k);
          ctx.stroke();
        }
        // Chevrons : des bandes claires, perpendiculaires au bord, à intervalles réguliers.
        ctx.fillStyle = 'rgba(255,230,190,0.08)';
        for (let x = r.x + 10; x < right; x += 3 * T) {
          ctx.fillRect(x, r.y, 6, at(x) - r.y);
        }
      }
      ctx.restore();
      // La poutre du bord, le long de la pente.
      ctx.strokeStyle = p.woodDark;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(left, at(left) - 3);
      ctx.lineTo(right, at(right) - 3);
      ctx.stroke();
      if (!p.silhouettes) {
        ctx.strokeStyle = p.wood;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(left, at(left) - 0.5);
        ctx.lineTo(right, at(right) - 0.5);
        ctx.stroke();
      }
      ctx.restore();
    },
    soffit(a, r) {
      // Plafond bas : plâtre un peu plus clair que la structure, poutre au bord.
      const { ctx, palette: p } = a;
      ctx.save();
      clipToSolid(a, r);
      ctx.fillStyle = p.structure;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      if (!p.silhouettes) {
        ctx.fillStyle = 'rgba(255,236,200,0.07)';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        // Solives qui dépassent, tous les deux mètres.
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        for (let x = r.x + T; x < r.x + r.w - 4; x += 4 * T) {
          ctx.fillRect(x, r.y, 4, r.h);
        }
      }
      ctx.restore();
      ceilingEdge(a, r);
    },
    bedhouse(a, r) {
      // Lit cabane : deux montants posés sur le lit, une traverse (étagère où l'on se pose), un
      // toit en fil de bois et une guirlande.
      const { ctx, level, palette: p } = a;
      let beamRow = r.y / T;
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        if (tileAt(level, r.x / T, row) === Tile.OneWay) {
          beamRow = row;
        }
      }
      const beam = beamRow * T;
      const bed = groundBelow(level, r.x / T, beamRow + 1) * T;
      const left = r.x + 2;
      const right = r.x + r.w - 2;
      const apex = { x: r.x + r.w / 2, y: r.y + 6 };
      ctx.fillStyle = p.woodDark;
      post(ctx, left, beam, bed, 3);
      post(ctx, right, beam, bed, 3);
      ctx.strokeStyle = p.wood;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(left - 3, beam + 1);
      ctx.lineTo(apex.x, apex.y);
      ctx.lineTo(right + 3, beam + 1);
      ctx.stroke();
      tileShape(a, { x: r.x, y: beam, w: r.w, h: T }, p.wood, p.woodLight);
      if (p.silhouettes) {
        return;
      }
      // Guirlande sous le toit : un fil qui pend, de petites ampoules chaudes.
      ctx.strokeStyle = 'rgba(60,45,40,0.6)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(left, beam - 4);
      ctx.quadraticCurveTo(apex.x, apex.y + 22, right, beam - 4);
      ctx.stroke();
      for (let i = 1; i < 8; i++) {
        const t = i / 8;
        const x = (1 - t) * (1 - t) * left + 2 * t * (1 - t) * apex.x + t * t * right;
        const y =
          (1 - t) * (1 - t) * (beam - 4) + 2 * t * (1 - t) * (apex.y + 22) + t * t * (beam - 4);
        ctx.fillStyle = i % 2 === 0 ? '#ffd88a' : '#f6b3c4';
        ctx.beginPath();
        ctx.arc(x, y + 1.5, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    hutch(a, r) {
      // Surmeuble du bureau : deux montants posés sur le bureau, un fond, l'étagère (traversable).
      const { ctx, level, palette: p } = a;
      let shelfRow = r.y / T;
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        if (tileAt(level, r.x / T + 1, row) === Tile.OneWay) {
          shelfRow = row;
        }
      }
      const desk = r.y + r.h;
      const top = (shelfRow - 2) * T + 4;
      const x0 = r.x + T - 3;
      const x1 = r.x + r.w - T + 3;
      ctx.fillStyle = p.silhouettes ? p.structure : 'rgba(70,48,36,0.22)';
      ctx.fillRect(x0, shelfRow * T, x1 - x0, desk - shelfRow * T);
      ctx.fillStyle = p.wood;
      rounded(ctx, { x: x0 - 3, y: top, w: 4, h: desk - top }, [2, 2, 0, 0]);
      ctx.fill();
      rounded(ctx, { x: x1 - 1, y: top, w: 4, h: desk - top }, [2, 2, 0, 0]);
      ctx.fill();
      tileShape(a, { x: r.x, y: shelfRow * T, w: r.w, h: T }, p.wood, p.woodLight);
      if (p.silhouettes) {
        return;
      }
      // Quelques livres debout au bout de l'étagère (la couverture se pose au milieu).
      const colors = ['#4f6f8f', '#e6c27a', '#d9788f'];
      colors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(x1 - 6 - i * 4, shelfRow * T - 9 + (i % 2) * 2, 3.5, 9 - (i % 2) * 2);
      });
      // Une petite lampe de bureau sous l'étagère.
      ctx.fillStyle = '#d9788f';
      rounded(ctx, { x: x0 + 3, y: desk - 12, w: 9, h: 5 }, [4, 4, 1, 1]);
      ctx.fill();
      ctx.fillRect(x0 + 7, desk - 7, 1.5, 7);
    },
    mobile(a, r) {
      // Le crochet au plafond ; le mobile lui-même tourne (animé).
      const { ctx, palette: p } = a;
      ctx.fillStyle = p.silhouettes ? p.structure : p.woodDark;
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + 1, 2, 0, Math.PI * 2);
      ctx.fill();
    },
    trumeau(a, r) {
      // Grand miroir posé sur la console, son fronton de bois (plein : on s'y pose).
      const { ctx, palette: p } = a;
      const frame = { x: r.x + 3, y: r.y + T, w: r.w - 6, h: r.h - T };
      ctx.fillStyle = p.silhouettes ? p.structure : GOLD;
      rounded(ctx, frame, [0, 0, 2, 2]);
      ctx.fill();
      if (!p.silhouettes) {
        const glass = ctx.createLinearGradient(
          frame.x,
          frame.y,
          frame.x + frame.w,
          frame.y + frame.h,
        );
        glass.addColorStop(0, '#c9d6e3');
        glass.addColorStop(1, GLASS);
        ctx.fillStyle = glass;
        ctx.fillRect(frame.x + 3, frame.y + 2, frame.w - 6, frame.h - 5);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(frame.x + 8, frame.y + frame.h * 0.55);
        ctx.lineTo(frame.x + frame.w - 10, frame.y + 10);
        ctx.moveTo(frame.x + 11, frame.y + frame.h * 0.75);
        ctx.lineTo(frame.x + frame.w - 8, frame.y + frame.h * 0.32);
        ctx.stroke();
        ctx.fillStyle = GOLD_DARK;
        ctx.fillRect(frame.x, frame.y + frame.h - 3, frame.w, 3);
      }
      tileShape(a, { x: r.x, y: r.y, w: r.w, h: T }, p.woodDark, p.woodLight);
      if (!p.silhouettes) {
        ctx.fillStyle = GOLD;
        ctx.fillRect(r.x + 2, r.y + T - 5, r.w - 4, 1.5);
      }
    },
    roundwindow(a, r) {
      // Œil-de-bœuf : un cadre rond et sa croisée ; la vitre est découpée avec le mur (D-72).
      const { ctx, palette: p } = a;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const radius = Math.min(r.w, r.h) / 2;
      if (p.silhouettes) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = p.night;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.restore();
      }
      ctx.strokeStyle = p.silhouettes ? p.structure : p.linen;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();
      if (!p.silhouettes) {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 4.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    overdoor(a, r) {
      // Placard au-dessus de la porte de l'escalier : deux portes, et l'encadrement du passage.
      const { ctx, level, palette: p } = a;
      const floor = groundBelow(level, r.x / T, (r.y + r.h) / T) * T;
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(r.x - 3, r.y + r.h - 2, 4, floor - r.y - r.h + 2);
      tileShape(a, r, p.wood, p.woodLight);
      if (p.silhouettes) {
        return;
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      const half = (r.w - 10) / 2;
      ctx.strokeRect(r.x + 4, r.y + 6, half - 1, r.h - 14);
      ctx.strokeRect(r.x + 6 + half, r.y + 6, half - 1, r.h - 14);
      ctx.fillStyle = '#f2c879';
      ctx.fillRect(r.x + 2 + half, r.y + r.h / 2 - 2, 1.5, 4);
      ctx.fillRect(r.x + 7 + half, r.y + r.h / 2 - 2, 1.5, 4);
      // Linteau de la porte, sous le placard.
      ctx.fillStyle = p.woodDark;
      ctx.fillRect(r.x, r.y + r.h - 4, r.w, 4);
    },
    commode(a, r) {
      const { ctx, palette: p } = a;
      tileShape(a, r, p.wood, p.woodLight);
      if (p.silhouettes) {
        return;
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 3, r.y + 5, r.w - 6, r.h / 2 - 6);
      ctx.strokeRect(r.x + 3, r.y + r.h / 2 + 2, r.w - 6, r.h / 2 - 6);
      ctx.fillStyle = '#f2c879';
      for (const y of [r.y + r.h / 4 + 1, r.y + (3 * r.h) / 4 - 1]) {
        ctx.fillRect(r.x + r.w / 2 - 3, y, 6, 1.5);
      }
    },
    banister(a, r) {
      // Rampe : une main courante parallèle aux marches, des balustres posés sur chacune, un
      // poteau en haut et en bas ; garde-corps du palier de l'étage.
      const { ctx, level, palette: p } = a;
      const height = 1.6 * T;
      const tops: { x: number; y: number }[] = [];
      for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
        tops.push({ x: col * T, y: groundBelow(level, col, r.y / T) * T });
      }
      ctx.fillStyle = p.silhouettes ? p.structure : p.woodDark;
      // Balustres : deux par tuile.
      for (const top of tops) {
        for (const dx of [4, 12]) {
          const rail = railY(tops, top.x + dx) - height;
          ctx.fillRect(top.x + dx - 0.9, rail, 1.8, top.y - rail);
        }
      }
      // Main courante : suit le nez des marches, en ligne droite d'une marche à l'autre.
      ctx.strokeStyle = p.silhouettes ? p.structure : p.wood;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let x = r.x; x <= r.x + r.w; x += 4) {
        const y = railY(tops, x) - height;
        if (x === r.x) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      // Poteaux : au bout de l'étage, et au bas de la volée.
      const first = tops.find((t, i) => i > 0 && t.y > (tops[i - 1]?.y ?? t.y));
      const last = tops[tops.length - 1];
      ctx.fillStyle = p.silhouettes ? p.structure : p.wood;
      for (const t of [first, last]) {
        if (t) {
          const x = t === last ? t.x + T - 4 : t.x;
          rounded(ctx, { x: x - 2.5, y: t.y - height - 6, w: 5, h: height + 6 }, [2, 2, 0, 0]);
          ctx.fill();
        }
      }
    },
    tallwindow(a, r) {
      // Grande fenêtre en plein cintre : cadre, petits bois, vitrail dans le cintre.
      const { ctx, palette: p } = a;
      const radius = r.w / 2;
      const arch = () => {
        ctx.beginPath();
        ctx.moveTo(r.x, r.y + r.h);
        ctx.lineTo(r.x, r.y + radius);
        ctx.arc(r.x + radius, r.y + radius, radius, Math.PI, 0);
        ctx.lineTo(r.x + r.w, r.y + r.h);
        ctx.closePath();
      };
      if (p.silhouettes) {
        ctx.fillStyle = p.night;
        arch();
        ctx.fill();
      } else {
        // Vitrail du cintre, en transparence sur la nuit.
        ctx.save();
        arch();
        ctx.clip();
        const colors = [
          'rgba(217,120,143,0.35)',
          'rgba(230,194,122,0.35)',
          'rgba(127,163,122,0.35)',
        ];
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = colors[i] ?? colors[0] ?? '';
          ctx.beginPath();
          ctx.moveTo(r.x + radius, r.y + radius);
          ctx.arc(
            r.x + radius,
            r.y + radius,
            radius,
            Math.PI + (i * Math.PI) / 3,
            Math.PI + ((i + 1) * Math.PI) / 3,
          );
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.strokeStyle = p.silhouettes ? p.structure : p.linen;
      ctx.lineWidth = 4;
      arch();
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(r.x + radius, r.y);
      ctx.lineTo(r.x + radius, r.y + r.h);
      for (let y = r.y + radius; y < r.y + r.h - 4; y += T) {
        ctx.moveTo(r.x, y);
        ctx.lineTo(r.x + r.w, y);
      }
      ctx.stroke();
    },
    windowsill(a, r) {
      // Rebord de pierre de la fenêtre (plein).
      const p = a.palette;
      tileShape(a, r, p.silhouettes ? p.wood : STONE, p.silhouettes ? p.wood : STONE_LIGHT);
    },
    stepshelf(a, r) {
      // Bibliothèque en escalier sous le palier : un poteau sous le bord du palier, le fond, des
      // montants, des livres sur les planches (les planches sont celles de la salle).
      const { ctx, level, palette: p } = a;
      const floor = groundBelow(level, r.x / T, (r.y + r.h) / T - 1) * T;
      ctx.fillStyle = p.silhouettes ? p.structure : 'rgba(60,40,30,0.45)';
      ctx.fillRect(r.x + T + 2, r.y, r.w - T - 2, floor - r.y);
      ctx.fillStyle = p.wood;
      post(ctx, r.x + 3, r.y, floor, 5);
      post(ctx, r.x + T + 2, r.y, floor, 3);
      post(ctx, r.x + 6 * T, r.y, floor, 3);
      if (p.silhouettes) {
        return;
      }
      const colors = ['#d9788f', '#4f6f8f', '#e6c27a', '#7fa37a', '#c9823f'];
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        for (let col = r.x / T; col < (r.x + r.w) / T; col++) {
          if (
            tileAt(level, col, row) !== Tile.OneWay ||
            tileAt(level, col, row - 1) !== Tile.Empty
          ) {
            continue;
          }
          // Une colonne sur deux : des livres, l'autre reste libre (on y voit la planche).
          if ((col + row) % 2 === 0) {
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
    atticstep(a, r) {
      // Petit palier devant la porte du grenier : le plateau (plein), un poteau posé sur le
      // buffet, une contrefiche vers le mur.
      const { ctx, level, palette: p } = a;
      const cx = r.x + r.w / 2;
      const below = groundBelow(level, cx / T, r.y / T + 1) * T;
      ctx.fillStyle = p.woodDark;
      post(ctx, cx, r.y + T, below, 4);
      ctx.strokeStyle = p.woodDark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, r.y + T + 22);
      ctx.lineTo(r.x + r.w, r.y + T + 2);
      ctx.stroke();
      tileShape(a, { x: r.x, y: r.y, w: r.w, h: T }, p.wood, p.woodLight);
    },
    pendant(a, r) {
      // Suspension : un fil depuis le plafond (ou le dessous de l'escalier), un abat-jour.
      const { ctx, palette: p } = a;
      const cx = r.x + r.w / 2;
      const shade = r.y + r.h - 10;
      ctx.fillStyle = p.silhouettes ? p.structure : '#3a3330';
      ctx.fillRect(cx - 0.6, r.y, 1.2, shade - r.y);
      ctx.fillStyle = p.silhouettes ? p.fabric : SHADE;
      ctx.beginPath();
      ctx.moveTo(cx - 9, shade + 9);
      ctx.quadraticCurveTo(cx - 8, shade, cx, shade);
      ctx.quadraticCurveTo(cx + 8, shade, cx + 9, shade + 9);
      ctx.closePath();
      ctx.fill();
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = BULB;
      ctx.beginPath();
      ctx.ellipse(cx, shade + 9, 3.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    },
    coatstand(a, r) {
      // Portemanteau sur pied : le pied posé au sol, deux manteaux, une écharpe, un chapeau.
      const { ctx, level, palette: p } = a;
      const cx = r.x + r.w / 2;
      const floor = groundBelow(level, cx / T, r.y / T) * T;
      ctx.fillStyle = p.silhouettes ? p.structure : p.woodDark;
      ctx.fillRect(cx - 1.2, r.y + 4, 2.4, floor - r.y - 4);
      ctx.fillRect(cx - 9, floor - 3, 18, 3);
      ctx.fillRect(cx - 8, r.y + 7, 16, 2);
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = '#4f6f8f';
      rounded(ctx, { x: cx - 13, y: r.y + 8, w: 12, h: 46 }, [5, 5, 3, 3]);
      ctx.fill();
      ctx.fillStyle = '#b25b6e';
      rounded(ctx, { x: cx + 1, y: r.y + 8, w: 11, h: 38 }, [5, 5, 3, 3]);
      ctx.fill();
      ctx.fillStyle = '#e6c27a';
      ctx.fillRect(cx - 2, r.y + 9, 4, 30);
      ctx.fillStyle = '#7a5a40';
      rounded(ctx, { x: cx - 7, y: r.y - 1, w: 14, h: 6 }, [5, 5, 1, 1]);
      ctx.fill();
    },
    floorplant(a, r) {
      // Grande plante en pot posée au sol.
      const { ctx, level, palette: p } = a;
      const cx = r.x + r.w / 2;
      const floor = groundBelow(level, cx / T, r.y / T) * T;
      ctx.fillStyle = p.silhouettes ? p.wood : TERRACOTTA;
      ctx.beginPath();
      ctx.moveTo(cx - 9, floor - 16);
      ctx.lineTo(cx + 9, floor - 16);
      ctx.lineTo(cx + 6, floor);
      ctx.lineTo(cx - 6, floor);
      ctx.fill();
      ctx.fillStyle = p.silhouettes ? p.structure : p.leafDark;
      for (const [dx, dy, rx, ry, angle] of [
        [-10, -30, 9, 4, -0.7],
        [9, -34, 9, 4, 0.7],
        [-3, -44, 8, 4, -0.2],
        [5, -24, 8, 3.5, 0.4],
        [-12, -20, 7, 3, -0.3],
      ] as const) {
        ctx.beginPath();
        ctx.ellipse(cx + dx, floor + dy, rx, ry, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!p.silhouettes) {
        ctx.fillStyle = p.leaf;
        for (const [dx, dy] of [
          [-8, -31],
          [7, -35],
          [-2, -45],
        ] as const) {
          ctx.beginPath();
          ctx.ellipse(cx + dx, floor + dy, 5, 2, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    hoodduct(a, r) {
      // Conduit de la hotte : du plafond (la retombée) jusqu'au-dessus de la hotte.
      const { ctx, palette: p } = a;
      ctx.fillStyle = p.silhouettes ? p.structure : '#8a939d';
      ctx.fillRect(r.x + 6, r.y, r.w - 12, r.h);
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(r.x + 8, r.y, 2, r.h);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (let y = r.y + 10; y < r.y + r.h; y += 18) {
        ctx.fillRect(r.x + 6, y, r.w - 12, 1.5);
      }
    },
    fridgebody(a, r) {
      // Corps du frigo, posé au sol (fond : on passe devant) : portes, poignées, aimants, le
      // dessin de la maison.
      const { ctx, level, palette: p } = a;
      const floor = groundBelow(level, r.x / T, (r.y + r.h) / T - 1) * T;
      // Sous le dessus du frigo (sa planche fait 4 px).
      const body = { x: r.x + 1, y: r.y + 4, w: r.w - 2, h: floor - r.y - 4 };
      ctx.fillStyle = p.silhouettes ? p.structure : '#dfe4e8';
      rounded(ctx, body, [2, 2, 3, 3]);
      ctx.fill();
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(body.x + 2, body.y + body.h * 0.36, body.w - 4, 1.5);
      ctx.fillStyle = '#9aa3ad';
      ctx.fillRect(body.x + body.w - 6, body.y + 6, 2, 12);
      ctx.fillRect(body.x + body.w - 6, body.y + body.h * 0.36 + 6, 2, 22);
      for (const [dx, dy, color] of [
        [8, 30, '#d9788f'],
        [22, 40, '#e6c27a'],
        [13, 56, '#4f6f8f'],
      ] as const) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(body.x + dx, body.y + body.h * 0.36 + dy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = p.linen;
      ctx.fillRect(body.x + 6, body.y + body.h * 0.36 + 8, 16, 13);
      ctx.strokeStyle = '#d9788f';
      ctx.lineWidth = 1;
      ctx.strokeRect(body.x + 10, body.y + body.h * 0.36 + 14, 7, 5);
      ctx.beginPath();
      ctx.moveTo(body.x + 9, body.y + body.h * 0.36 + 14);
      ctx.lineTo(body.x + 13.5, body.y + body.h * 0.36 + 10.5);
      ctx.lineTo(body.x + 18, body.y + body.h * 0.36 + 14);
      ctx.stroke();
    },
    fridgetop(a, r) {
      // Le dessus du frigo, où l'on se pose.
      const p = a.palette;
      tileShape(a, r, p.silhouettes ? p.wood : '#eef1f3', p.silhouettes ? p.wood : '#ffffff');
    },
    kettle(a, r) {
      // Cafetière italienne posée sur la cuisinière.
      const { ctx, palette: p } = a;
      const base = r.y + r.h;
      const cx = r.x + r.w / 2;
      ctx.fillStyle = p.silhouettes ? p.structure : '#9aa3ad';
      ctx.beginPath();
      ctx.moveTo(cx - 6, base);
      ctx.lineTo(cx - 4, base - 9);
      ctx.lineTo(cx - 6, base - 18);
      ctx.lineTo(cx + 6, base - 18);
      ctx.lineTo(cx + 4, base - 9);
      ctx.lineTo(cx + 6, base);
      ctx.fill();
      ctx.fillStyle = p.silhouettes ? p.structure : '#3a3330';
      ctx.fillRect(cx - 4, base - 21, 8, 3);
      ctx.fillRect(cx + 6, base - 15, 4, 2);
      if (!p.silhouettes) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(cx - 4, base - 16, 1.5, 6);
      }
    },
    potrack(a, r) {
      // Barre à casseroles pendue à deux chaînes ; des louches et une petite casserole dessous.
      const { ctx, level, palette: p } = a;
      let barRow = r.y / T;
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        if (tileAt(level, r.x / T, row) === Tile.OneWay) {
          barRow = row;
        }
      }
      const bar = barRow * T;
      ctx.strokeStyle = p.silhouettes ? p.structure : '#6e6a66';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 1.5]);
      ctx.beginPath();
      for (const x of [r.x + 6, r.x + r.w - 6]) {
        ctx.moveTo(x, r.y);
        ctx.lineTo(x, bar);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = p.silhouettes ? p.wood : '#8a7b6c';
      rounded(ctx, { x: r.x, y: bar, w: r.w, h: 4 }, 2);
      ctx.fill();
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = '#b8bec6';
      ctx.fillRect(r.x, bar, r.w, 1.5);
      // Ustensiles accrochés sous la barre (petits : jamais un appui).
      ctx.fillStyle = '#9aa3ad';
      for (const dx of [14, 30, 62]) {
        ctx.fillRect(r.x + dx, bar + 4, 1.2, 9);
        ctx.beginPath();
        ctx.ellipse(r.x + dx + 0.6, bar + 14, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#c46f4a';
      rounded(ctx, { x: r.x + 42, y: bar + 6, w: 12, h: 7 }, [1, 1, 4, 4]);
      ctx.fill();
      ctx.fillRect(r.x + 47, bar + 4, 2, 3);
    },
    ironingboard(a, r) {
      // Planche à repasser : pieds en X sous la planche de la salle, le fer posé dessus.
      const { ctx, level, palette: p } = a;
      const top = r.y + 3;
      const floor = groundBelow(level, r.x / T, (r.y + r.h) / T - 1) * T;
      ctx.strokeStyle = p.silhouettes ? p.structure : '#8a939d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w * 0.25, top);
      ctx.lineTo(r.x + r.w * 0.7, floor);
      ctx.moveTo(r.x + r.w * 0.7, top);
      ctx.lineTo(r.x + r.w * 0.25, floor);
      ctx.stroke();
      ctx.fillStyle = p.silhouettes ? p.fabric : '#9fc0e8';
      rounded(ctx, { x: r.x - 2, y: r.y - 1, w: r.w + 4, h: 5 }, [3, 6, 6, 3]);
      ctx.fill();
      if (p.silhouettes) {
        return;
      }
      ctx.fillStyle = '#d9788f';
      ctx.beginPath();
      ctx.moveTo(r.x + r.w - 26, r.y - 1);
      ctx.lineTo(r.x + r.w - 10, r.y - 1);
      ctx.lineTo(r.x + r.w - 14, r.y - 7);
      ctx.lineTo(r.x + r.w - 24, r.y - 7);
      ctx.fill();
      ctx.fillStyle = '#3a3330';
      ctx.fillRect(r.x + r.w - 22, r.y - 10, 7, 2);
    },
    loft(a, r) {
      // Soupente sous la trappe à linge : un plateau plein, une poutre, un poteau jusqu'au sol.
      const { ctx, level, palette: p } = a;
      const x = r.x + r.w - 4;
      const floor = groundBelow(level, x / T, r.y / T + 1) * T;
      ctx.fillStyle = p.woodDark;
      post(ctx, x, r.y + T, floor, 4);
      ctx.strokeStyle = p.woodDark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, r.y + T + 20);
      ctx.lineTo(x - 20, r.y + T);
      ctx.stroke();
      tileShape(a, r, p.wood, p.woodLight);
      if (!p.silhouettes) {
        // Un panier de linge sale sous la trappe.
        ctx.fillStyle = '#b99a6b';
        rounded(ctx, { x: r.x + 6, y: r.y - 9, w: 18, h: 9 }, [1, 1, 3, 3]);
        ctx.fill();
        ctx.fillStyle = '#f1a9bd';
        rounded(ctx, { x: r.x + 8, y: r.y - 12, w: 9, h: 5 }, 3);
        ctx.fill();
      }
    },
    utilityshelf(a, r) {
      // Étagère de rangement : le dessus plein, quatre pieds fins jusqu'au sol (on passe entre),
      // des bidons de lessive dessus.
      const { ctx, level, palette: p } = a;
      const floor = groundBelow(level, r.x / T, r.y / T + 1) * T;
      ctx.fillStyle = p.silhouettes ? p.structure : '#8a939d';
      for (const x of [r.x + 2, r.x + r.w - 4]) {
        ctx.fillRect(x, r.y + T - 2, 2, floor - r.y - T + 2);
      }
      tileShape(a, r, p.silhouettes ? p.wood : '#a8b2bc', p.silhouettes ? p.wood : '#cfd6dd');
      if (p.silhouettes) {
        return;
      }
      for (const [dx, color, h] of [
        [8, '#7fa37a', 12],
        [20, '#9fc0e8', 10],
        [r.w - 18, '#f1a9bd', 11],
      ] as const) {
        ctx.fillStyle = color;
        rounded(ctx, { x: r.x + dx, y: r.y - h, w: 9, h }, [3, 3, 1, 1]);
        ctx.fill();
      }
    },
    roofwindow(a, r) {
      // Fenêtre de toit dans le pan du toit : la vitre est découpée (on voit la nuit), cadre.
      const { ctx, palette: p } = a;
      const pane = { x: r.x + 4, y: r.y + 6, w: r.w - 8, h: r.h - 12 };
      ctx.fillStyle = p.silhouettes ? p.structure : p.woodDark;
      rounded(ctx, { x: pane.x - 4, y: pane.y - 4, w: pane.w + 8, h: pane.h + 8 }, 3);
      ctx.fill();
      ctx.save();
      if (p.silhouettes) {
        ctx.fillStyle = p.night;
      } else {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000';
      }
      ctx.fillRect(pane.x, pane.y, pane.w, pane.h);
      ctx.restore();
      ctx.fillStyle = p.silhouettes ? p.structure : p.woodDark;
      ctx.fillRect(pane.x + pane.w / 2 - 1, pane.y, 2, pane.h);
    },
    dressform(a, r) {
      // Mannequin de couture oublié, en ombre : un buste sur un pied (un peu inquiétant).
      const { ctx, level, palette: p } = a;
      const cx = r.x + r.w / 2;
      const floor = groundBelow(level, cx / T, r.y / T) * T;
      ctx.fillStyle = p.silhouettes ? p.structure : 'rgba(40,32,44,0.75)';
      ctx.fillRect(cx - 1, r.y + 34, 2, floor - r.y - 34);
      ctx.fillRect(cx - 8, floor - 2, 16, 2);
      ctx.beginPath();
      ctx.moveTo(cx - 3, r.y);
      ctx.lineTo(cx + 3, r.y);
      ctx.quadraticCurveTo(cx + 12, r.y + 6, cx + 9, r.y + 16);
      ctx.quadraticCurveTo(cx + 6, r.y + 22, cx + 10, r.y + 34);
      ctx.lineTo(cx - 10, r.y + 34);
      ctx.quadraticCurveTo(cx - 6, r.y + 22, cx - 9, r.y + 16);
      ctx.quadraticCurveTo(cx - 12, r.y + 6, cx - 3, r.y);
      ctx.fill();
      if (!p.silhouettes) {
        // Un ruban de mesure qui pend.
        ctx.strokeStyle = '#e6c27a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 5, r.y + 4);
        ctx.quadraticCurveTo(cx - 2, r.y + 16, cx + 6, r.y + 28);
        ctx.stroke();
      }
    },
    atticbeam(a, r) {
      // Poutre de la charpente (la planche de la salle), sur un poteau posé au sol, deux liens.
      const { ctx, level, palette: p } = a;
      const cx = r.x + r.w / 2;
      const floor = groundBelow(level, cx / T, r.y / T + 1) * T;
      ctx.fillStyle = p.woodDark;
      post(ctx, cx, r.y + 4, floor, 4);
      ctx.strokeStyle = p.woodDark;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, r.y + 18);
      ctx.lineTo(r.x + 3, r.y + 4);
      ctx.moveTo(cx, r.y + 18);
      ctx.lineTo(r.x + r.w - 3, r.y + 4);
      ctx.stroke();
      ctx.fillStyle = p.wood;
      rounded(ctx, { x: r.x, y: r.y, w: r.w, h: 6 }, 2);
      ctx.fill();
      if (!p.silhouettes) {
        ctx.fillStyle = p.woodLight;
        ctx.fillRect(r.x + 1, r.y, r.w - 2, 1.5);
      }
    },
    collartie(a, r) {
      // Entrait sous le faîte (plein, on s'y pose) : un poinçon jusqu'au faîte au bout gauche,
      // une jambe de force jusqu'au toit au bout droit.
      const { ctx, level, palette: p } = a;
      let beamRow = r.y / T;
      for (let row = r.y / T; row < (r.y + r.h) / T; row++) {
        if (solid(level, r.x / T, row) && !solid(level, r.x / T, row - 1)) {
          beamRow = row;
        }
      }
      const beam = beamRow * T;
      const ceilingAbove = (col: number) => {
        let row = beamRow - 1;
        while (row > 0 && !solid(level, col, row)) {
          row--;
        }
        return (row + 1) * T;
      };
      ctx.fillStyle = p.woodDark;
      post(ctx, r.x + 3, ceilingAbove(r.x / T), beam, 5);
      const endCol = (r.x + r.w) / T - 1;
      post(ctx, r.x + r.w - 4, ceilingAbove(endCol), beam, 4);
      tileShape(a, { x: r.x, y: beam, w: r.w, h: T }, p.wood, p.woodLight);
    },
    // Animés (WorldLifeView) : rien de dessiné dans le décor.
    steam() {},
    nightstars() {},
    dust() {},
    moth() {},
  };
}

/** Hauteur (px) du nez des marches sous `x`, interpolée d'une marche à la suivante. */
function railY(tops: readonly { x: number; y: number }[], x: number): number {
  let prev = tops[0];
  for (const t of tops) {
    if (t.x > x) {
      break;
    }
    prev = t;
  }
  const next = tops.find((t) => t.x > x && t.y !== prev?.y);
  if (!prev) {
    return 0;
  }
  // Entre le début de la marche et le début de la suivante : la ligne des nez. Un long plat (le
  // palier de l'étage) garde une main courante horizontale.
  const start = tops.find((t) => t.y === prev.y)?.x ?? prev.x;
  if (!next || next.y < prev.y || next.x - start > 4 * T) {
    return prev.y;
  }
  const k = (x - start) / Math.max(1, next.x - start);
  return prev.y + (next.y - prev.y) * k;
}
