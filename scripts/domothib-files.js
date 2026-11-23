// Mode `domothib` (D-193) : le manifeste de DomoThib Games et la jaquette, à la racine du build,
// absents des autres builds. La version du manifeste est celle de l'écran de départ (D-152).
import { readFileSync } from 'node:fs';

/** Version du manifeste de DomoThib : 20 caractères au plus (`docs/domothib.md`, §3). */
export function manifestVersion(version) {
  return version.replace(' · ', ' ').slice(0, 20);
}

export function domothibFiles(version) {
  return {
    name: 'maria-domothib-files',
    apply: 'build',
    generateBundle() {
      const manifest = JSON.parse(readFileSync('domothib/domothib.json', 'utf8'));
      manifest.version = manifestVersion(version);
      this.emitFile({
        type: 'asset',
        fileName: 'domothib.json',
        source: `${JSON.stringify(manifest, null, 2)}\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'jaquette.webp',
        source: readFileSync('domothib/jaquette.webp'),
      });
    },
  };
}
