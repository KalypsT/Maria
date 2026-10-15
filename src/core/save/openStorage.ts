import type { SaveLibraryStorage } from './SaveStorage';

/**
 * IndexedDB n'a pas répondu, sans erreur (D-186) : une panne passagère, la base est sans doute là.
 * - `blocked` : une autre fenêtre du jeu (une version plus ancienne) la garde ouverte ;
 * - `timeout` : pas de réponse dans le délai.
 */
export type StorageWaitReason = 'blocked' | 'timeout';

export class StorageWaitError extends Error {
  constructor(readonly reason: StorageWaitReason) {
    super(`IndexedDB : ${reason === 'blocked' ? 'bloquée par une autre fenêtre' : 'trop longue'}`);
  }
}

export type StorageOpening =
  { ok: true; storage: SaveLibraryStorage } | { ok: false; reason: StorageWaitReason };

export interface StorageOpeners {
  /** IndexedDB, ou null s'il n'existe pas ; échoue avec `StorageWaitError` s'il ne répond pas. */
  indexedDb: (() => Promise<SaveLibraryStorage>) | null;
  /** localStorage, ou null s'il refuse l'écriture. */
  local: () => SaveLibraryStorage | null;
  memory: () => SaveLibraryStorage;
}

/**
 * Le meilleur stockage des parties (D-22, D-186) : IndexedDB, sinon localStorage, sinon la mémoire.
 * Le repli n'a lieu que si IndexedDB manque ou refuse durablement (une erreur, toujours la même à
 * chaque lancement). S'il ne répond pas (bloqué, délai), pas de repli : les parties y sont sans
 * doute, et jouer ailleurs les cacherait, puis cacherait la partie jouée ailleurs au lancement
 * suivant. L'appelant le dit à la joueuse et propose de réessayer.
 */
export async function openSaveStorage(openers: StorageOpeners): Promise<StorageOpening> {
  if (openers.indexedDb) {
    try {
      return { ok: true, storage: await openers.indexedDb() };
    } catch (error) {
      if (error instanceof StorageWaitError) {
        return { ok: false, reason: error.reason };
      }
      // Refus durable : repli ci-dessous.
    }
  }
  return { ok: true, storage: openers.local() ?? openers.memory() };
}
