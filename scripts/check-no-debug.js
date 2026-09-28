// Vérifie que le build principal (dist/, hors dist/debug/) ne contient aucun outil de debug (décision D-12).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MARKER = 'maria-debug-overlay';
const root = 'dist';

function collect(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (path === join(root, 'debug')) {
      return [];
    }
    return statSync(path).isDirectory() ? collect(path) : [path];
  });
}

const offenders = collect(root).filter((path) => readFileSync(path, 'utf8').includes(MARKER));
if (offenders.length > 0) {
  console.error(`Outils de debug présents dans le build principal : ${offenders.join(', ')}`);
  process.exit(1);
}
console.log('Build principal sans outils de debug.');
