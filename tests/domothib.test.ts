import { describe, expect, it } from 'vitest';
import { HostPause, type PauseSource, type PauseTarget } from '../src/core/platform/hostPause';
import manifest from '../domothib/domothib.json';
import { manifestVersion } from '../scripts/domothib-files.js';

/** DomoThib simulé : ses messages de pause et de reprise. */
function fakeHost() {
  const pauses = new Set<() => void>();
  const resumes = new Set<() => void>();
  const source: PauseSource = {
    onPause: (listener) => {
      pauses.add(listener);
      return () => pauses.delete(listener);
    },
    onResume: (listener) => {
      resumes.add(listener);
      return () => resumes.delete(listener);
    },
  };
  return {
    source,
    pause: () => {
      pauses.forEach((listener) => {
        listener();
      });
    },
    resume: () => {
      resumes.forEach((listener) => {
        listener();
      });
    },
  };
}

function recorder(name: string, log: string[]): PauseTarget {
  return {
    pause: () => log.push(`${name}:pause`),
    resume: () => log.push(`${name}:resume`),
  };
}

describe('la pause de DomoThib (D-193)', () => {
  it('arrête puis rend la main, une seule fois quel que soit le nombre de messages', () => {
    const host = fakeHost();
    const log: string[] = [];
    const pause = new HostPause(host.source, recorder('son', log));
    host.resume();
    expect(log).toEqual([]);
    host.pause();
    host.pause();
    expect(pause.isPaused).toBe(true);
    host.resume();
    host.resume();
    expect(pause.isPaused).toBe(false);
    expect(log).toEqual(['son:pause', 'son:resume']);
  });

  it('la partie prend le relais du son, y compris au milieu d’une pause', () => {
    const host = fakeHost();
    const log: string[] = [];
    const pause = new HostPause(host.source, recorder('son', log));
    host.pause();
    const game = recorder('partie', log);
    pause.setTarget(game);
    pause.setTarget(game);
    host.resume();
    expect(log).toEqual(['son:pause', 'son:resume', 'partie:pause', 'partie:resume']);
  });

  it('sans pause en cours, le relais ne touche à rien', () => {
    const host = fakeHost();
    const log: string[] = [];
    const pause = new HostPause(host.source, recorder('son', log));
    pause.setTarget(recorder('partie', log));
    expect(log).toEqual([]);
    host.pause();
    expect(log).toEqual(['partie:pause']);
  });
});

describe('le manifeste de DomoThib Games (docs/domothib.md, §3)', () => {
  it('respecte le contrat, protocole 1, sauvegarde intégrée (G1)', () => {
    expect(manifest.protocole).toBe(1);
    expect(manifest.id).toBe('maria');
    expect(manifest.id).toMatch(/^[a-z0-9-]{1,40}$/);
    expect(manifest.nom.length).toBeGreaterThan(0);
    expect(manifest.nom.length).toBeLessThanOrEqual(40);
    expect(manifest.description.length).toBeLessThanOrEqual(200);
    expect(manifest.orientation).toBe('paysage');
    expect(manifest.ecrans).toEqual(['telephone', 'tablette']);
    expect(manifest.commandes).toContain('tactile');
    expect(manifest.sauvegarde).toBe('integree');
    // Le sac et Pause sont en haut à gauche : la poignée de DomoThib en haut à droite.
    expect(manifest.poignee).toBe('haut-droite');
    expect(manifest.jaquette).toBe('jaquette.webp');
  });

  it('prend la version de l’écran de départ, 20 caractères au plus', () => {
    expect(manifestVersion('2026-11-23 · c78e105')).toBe('2026-11-23 c78e105');
    expect(manifestVersion('2026-11-23 · c78e105abcdef').length).toBe(20);
    expect(manifestVersion('dev')).toBe('dev');
  });
});
