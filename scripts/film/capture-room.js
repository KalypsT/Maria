/**
 * Capture la chambre à chaque âge du film des années (D-190), dans le cadre exact des captures de
 * l'intro (1600 × 900 à l'échelle 2, donc 3200 × 1800). Outil ponctuel, hors du jeu.
 *
 * Usage : npm run dev, puis
 *   node scripts/film/capture-room.js [http://localhost:5173/Maria/] [états…]
 * Playwright : celui du système (PLAYWRIGHT_MODULE, sinon `playwright`), Chromium : PW_CHROMIUM.
 * Sortie : scripts/film/room-<état>.png (puis `python3 scripts/make-intro-art.py film`).
 *
 * Chaque état part de la fin du matin (Maria rangée sur l'étagère, Céleste partie) : des étapes de
 * l'histoire, des objets de mise en scène retirés, et l'habillage de la chambre changé (D-28), avec
 * les meubles dessinés du jeu. PLACEHOLDER : l'avenir de la chambre reste ouvert (§45).
 */
import path from 'node:path';
import { STATES } from './roomStates.js';

const playwright = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
// Un module CommonJS importé : ses exports sous `default`.
const { chromium } = playwright.default ?? playwright;
const OUT = import.meta.dirname;
const url = process.argv[2] ?? 'http://localhost:5173/Maria/';
const wanted = process.argv.slice(3);

const browser = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
);
const page = await browser.newPage({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 2,
});
await page.goto(`${url}?nointro`);
await page.getByRole('button', { name: 'Nouvelle partie' }).first().click();
await page.waitForTimeout(2500);
await page.getByRole('button', { name: 'DEBUG' }).click();
await page.getByRole('button', { name: 'Rejouer la fin : le départ' }).click();
await page.getByLabel('Hitbox').uncheck();
await page.getByRole('button', { name: 'DEBUG' }).click();
await page.addStyleTag({ content: '[class^="dbg"] { display: none !important; }' });
const base = await page.evaluate(() => {
  const s = window.mariaScene;
  // Ni étincelle ni Céleste : la chambre seule.
  const view = s.storyView;
  const render = view.render.bind(view);
  view.render = (...args) => {
    render(...args);
    view.sparkle.setVisible(false);
  };
  s.celesteGone = true;
  return { flags: [...s.story.flags], level: s.level, props: s.story.data.props };
});
for (const [name, state] of Object.entries(STATES)) {
  if (wanted.length > 0 && !wanted.includes(name)) {
    continue;
  }
  await page.evaluate(
    ({ state, baseFlags }) => {
      const s = window.mariaScene;
      if (!s.originalLevel) {
        s.originalLevel = s.level;
        s.originalProps = s.story.data.props;
      }
      const level = s.originalLevel;
      const removed = (d) =>
        (state.removeDecor ?? []).some(
          (r) => r.kind === d.kind && (r.col === undefined || r.col === d.col),
        );
      s.level = {
        ...level,
        decor: [...level.decor.filter((d) => !removed(d)), ...(state.addDecor ?? [])],
      };
      s.story.data.props = s.originalProps.filter((p) => !(state.removeProps ?? []).includes(p.id));
      const flags = baseFlags.filter((f) => !(state.dropFlags ?? []).includes(f));
      s.setStoryFlags([...flags, ...(state.addFlags ?? [])]);
      // Le cadre : celui des captures de l'intro (Céleste sur son lit), ou celui du film des
      // années (Céleste au pied du surmeuble : Maria, la fenêtre, la toise et la porte).
      const at = state.frame === 'intro' ? [12, 15] : [33, 19];
      s.placeCeleste(at[0], at[1], 1);
      s.celesteGone = true;
    },
    { state, baseFlags: base.flags },
  );
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, `room-${name}.png`) });
  console.log(name);
}
await browser.close();
