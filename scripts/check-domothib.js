// Vérifie le build de DomoThib Games (D-193) après `build:domothib`, d'après le contrat
// (`docs/domothib.md`) : le manifeste (§3), la jaquette, aucun service worker ni manifeste
// d'application, aucune ressource extérieure, aucun outil de debug (§6).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = 'dist';
const GAME_ID = 'maria';
const errors = [];
const check = (ok, message) => {
  if (!ok) {
    errors.push(message);
  }
};

function collect(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? collect(path) : [path];
  });
}

/** Largeur et hauteur d'une image WebP (VP8, VP8L ou VP8X), ou null. */
function webpSize(bytes) {
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
    return null;
  }
  const chunk = bytes.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') {
    return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    const bits = bytes.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') {
    return { width: bytes.readUIntLE(24, 3) + 1, height: bytes.readUIntLE(27, 3) + 1 };
  }
  return null;
}

const subsetOf = (value, allowed) =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((item) => allowed.includes(item)) &&
  new Set(value).size === value.length;

check(existsSync(join(root, 'index.html')), 'dist/index.html absent (lancer build:domothib avant)');

// Le manifeste (§3).
const manifestPath = join(root, 'domothib.json');
if (!existsSync(manifestPath)) {
  errors.push('dist/domothib.json absent');
} else {
  const text = readFileSync(manifestPath, 'utf8');
  check(Buffer.byteLength(text) <= 16 * 1024, 'domothib.json : 16 Ko au plus');
  const m = JSON.parse(text);
  check(m.protocole === 1, 'domothib.json : protocole 1 attendu');
  check(m.id === GAME_ID && /^[a-z0-9-]{1,40}$/.test(m.id), `domothib.json : id « ${GAME_ID} »`);
  check(typeof m.nom === 'string' && m.nom.length >= 1 && m.nom.length <= 40, 'nom : 1 à 40');
  check(
    m.description === undefined ||
      (typeof m.description === 'string' && m.description.length <= 200),
    'description : 200 caractères au plus',
  );
  check(
    typeof m.version === 'string' && m.version.length >= 1 && m.version.length <= 20,
    'version : 1 à 20 caractères',
  );
  check(['paysage', 'portrait', 'libre'].includes(m.orientation), 'orientation invalide');
  check(m.orientation === 'paysage', 'orientation : paysage attendu (D-03)');
  check(subsetOf(m.ecrans, ['telephone', 'tablette']), 'ecrans invalide');
  check(subsetOf(m.commandes, ['tactile', 'clavier']), 'commandes invalide');
  check(m.commandes?.includes('tactile'), 'commandes : le tactile doit suffire');
  check(m.sauvegarde === 'integree', 'sauvegarde : « integree » attendu (étape G1)');
  check(
    m.poignee === undefined ||
      ['haut-gauche', 'haut-droite', 'bas-gauche', 'bas-droite'].includes(m.poignee),
    'poignee invalide',
  );
  check(m.pleinEcran === undefined || typeof m.pleinEcran === 'boolean', 'pleinEcran invalide');
  if (m.jaquette !== undefined) {
    const path = join(root, m.jaquette);
    if (!existsSync(path)) {
      errors.push(`jaquette ${m.jaquette} absente du build`);
    } else {
      check(statSync(path).size <= 300 * 1024, 'jaquette : 300 Ko au plus');
      check(extname(path) === '.webp', 'jaquette : WebP attendu');
      const size = webpSize(readFileSync(path));
      check(
        size !== null && size.width * 9 === size.height * 16,
        `jaquette : 16:9 attendu (${size ? `${size.width} × ${size.height}` : 'illisible'})`,
      );
    }
  }
}

const files = existsSync(root) ? collect(root) : [];
const names = files.map((path) => relative(root, path).split('\\').join('/'));

// Aucun service worker, aucun manifeste d'application (§6).
check(!names.includes('sw.js'), 'service worker présent (sw.js)');
check(!names.includes('registerSW.js'), 'enregistrement de service worker présent');
check(!names.some((name) => /^workbox-/.test(name)), 'workbox présent');
check(!names.includes('manifest.webmanifest'), "manifeste d'application présent");
check(!names.some((name) => name.startsWith('debug/')), 'build de debug présent');

// Ressources du jeu sous /maria/ ; aucune ressource extérieure (§6). Les seules adresses permises
// dans le code ne chargent rien : les espaces de noms SVG et XHTML, la bannière de Phaser.
const ALLOWED_URLS = [
  'http://www.w3.org/2000/svg',
  'http://www.w3.org/1999/xhtml',
  'https://phaser.io',
  'https://phaser.io/',
];
const html = existsSync(join(root, 'index.html'))
  ? readFileSync(join(root, 'index.html'), 'utf8')
  : '';
check(html.includes(`/${GAME_ID}/assets/`), `index.html : ressources sous /${GAME_ID}/assets/`);
check(!html.includes('manifest.webmanifest'), "index.html : manifeste d'application");
check(!/(src|href)="(https?:)?\/\//.test(html), 'index.html : ressource extérieure');
for (const [index, path] of files.entries()) {
  if (!['.js', '.css', '.html', '.json'].includes(extname(path))) {
    continue;
  }
  const text = readFileSync(path, 'utf8');
  const urls = [...text.matchAll(/https?:\/\/[^\s"'`)<>\\]+/g)].map((match) => match[0]);
  const foreign = [...new Set(urls)].filter((url) => !ALLOWED_URLS.includes(url));
  check(foreign.length === 0, `${names[index]} : adresses extérieures ${foreign.join(', ')}`);
  if (extname(path) === '.css') {
    check(!/url\(\s*["']?\/\//.test(text), `${names[index]} : ressource extérieure`);
  }
  // Aucun outil de debug (D-12).
  check(!text.includes('maria-debug-overlay'), `${names[index]} : outils de debug présents`);
}

if (errors.length > 0) {
  console.error(`DomoThib : ${errors.join(' ; ')}`);
  process.exit(1);
}
console.log(
  'DomoThib : manifeste et jaquette valides, sans service worker ni ressource extérieure.',
);
