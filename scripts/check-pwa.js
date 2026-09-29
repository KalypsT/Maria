// Vérifie la PWA (décision D-23) après `build` puis `build:debug` : service worker et manifeste
// dans le build principal, /debug/ exclu, aucun doublon précaché, aucun service worker en debug.
import { existsSync, readFileSync } from 'node:fs';

const errors = [];
const check = (ok, message) => {
  if (!ok) {
    errors.push(message);
  }
};

check(existsSync('dist/sw.js'), 'dist/sw.js absent (service worker du build principal)');
check(existsSync('dist/manifest.webmanifest'), 'dist/manifest.webmanifest absent');
if (existsSync('dist/sw.js')) {
  const sw = readFileSync('dist/sw.js', 'utf8');
  const urls = [...sw.matchAll(/url:"([^"]*)"/g)].map((match) => match[1]);
  check(urls.length > 0, 'précache vide');
  check(!urls.some((url) => url.startsWith('debug/')), 'le précache contient le build de debug');
  const duplicates = urls.filter((url, i) => urls.indexOf(url) !== i);
  check(duplicates.length === 0, `doublons dans le précache : ${duplicates.join(', ')}`);
  check(/Maria\\\/debug/.test(sw), 'le service worker n’exclut pas /Maria/debug/ des navigations');
}
if (existsSync('dist/manifest.webmanifest')) {
  const manifest = JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'));
  check(manifest.orientation === 'landscape', 'manifeste : orientation paysage attendue (D-03)');
  check(manifest.start_url === '/Maria/', 'manifeste : start_url /Maria/ attendu');
}
check(existsSync('dist/debug/index.html'), 'build de debug absent (lancer build:debug avant)');
check(!existsSync('dist/debug/sw.js'), 'le build de debug ne doit pas avoir de service worker');
if (existsSync('dist/debug/index.html')) {
  const html = readFileSync('dist/debug/index.html', 'utf8');
  check(!html.includes('manifest.webmanifest'), 'le build de debug ne doit pas avoir de manifeste');
}

if (errors.length > 0) {
  console.error(`PWA : ${errors.join(' ; ')}`);
  process.exit(1);
}
console.log('PWA : build principal avec service worker et manifeste, build de debug sans.');
