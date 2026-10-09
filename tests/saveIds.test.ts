import { describe, expect, it } from 'vitest';
import { Ability } from '../src/config/abilities';
import { MARIA_THINGS, MEMORIES, STRANGE_THINGS } from '../src/config/memories';
import { RECORD_SLOTS } from '../src/config/records';
import { StoryFlag } from '../src/config/story';
import { EntityType } from '../src/core/level/LevelData';
import { checkpointId } from '../src/core/save/saveData';
import { ZONES } from '../src/levels';
import frozenText from './fixtures/saveIds.txt?raw';

/**
 * Les identifiants écrits dans la sauvegarde (D-152, pilier 10) : salles, lanternes, coquilles,
 * capacités, souvenirs (et disques), étapes de l'histoire. La liste figée `saveIds.txt` est celle
 * des parties qui existent : un identifiant n'en sort jamais sans être déclaré dans `RETIRED`.
 */

/**
 * Identifiants retirés du jeu, chacun avec la raison pour laquelle une partie qui le porte ne perd
 * rien (une migration de la sauvegarde, un équivalent…). Vide : rien n'a encore été retiré.
 */
const RETIRED: Readonly<Record<string, string>> = {};

function currentSaveIds(): string[] {
  const ids: string[] = [];
  for (const zone of ZONES) {
    for (const [room, level] of zone.rooms) {
      ids.push(`room ${room}`);
      for (const e of level.entities) {
        if (e.type === EntityType.Checkpoint) {
          ids.push(`lantern ${room}:${checkpointId(e)}`);
        } else if (e.type === EntityType.Shell && e.name !== undefined) {
          ids.push(`shell ${e.name}`);
        }
      }
    }
  }
  ids.push(...Object.values(Ability).map((id) => `ability ${id}`));
  ids.push(
    ...[...MEMORIES, ...MARIA_THINGS, ...STRANGE_THINGS, ...RECORD_SLOTS].map(
      (id) => `memory ${id}`,
    ),
  );
  ids.push(...Object.values(StoryFlag).map((id) => `flag ${id}`));
  return [...new Set(ids)].sort();
}

function frozenSaveIds(): string[] {
  return frozenText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
}

describe('identifiants de la sauvegarde (D-152)', () => {
  it('aucun identifiant d’une partie existante ne disparaît sans être déclaré retiré', () => {
    const current = new Set(currentSaveIds());
    const lost = frozenSaveIds().filter((id) => !current.has(id) && !(id in RETIRED));
    // Renommer ou retirer une salle, une lanterne, une coquille… ferait perdre une partie :
    // garder l'ancien nom, ou migrer la sauvegarde et déclarer l'identifiant dans RETIRED.
    expect(lost).toEqual([]);
  });

  it('la liste figée est complète : un nouvel identifiant y est ajouté', () => {
    const frozen = new Set(frozenSaveIds());
    // Ajouter les lignes manquantes à tests/fixtures/saveIds.txt (triées).
    expect(currentSaveIds().filter((id) => !frozen.has(id))).toEqual([]);
  });

  it('chaque lanterne du jeu a un nom fixe', () => {
    expect(currentSaveIds().filter((id) => /^lantern .*:c\d+-\d+$/.test(id))).toEqual([]);
  });
});
