import type { ArcadeGameId } from '../config/arcade';
import { endlessChunk } from '../core/arcade/arcade';
import type { EndlessChunk } from '../core/arcade/endless';
import type { EndlessReply, EndlessRequest } from '../core/arcade/endlessMessages';

/**
 * Les morceaux du mode Sans fin (D-167) : demandés à l'avance au générateur en arrière-plan (un
 * worker), récupérés quand ils sont prêts. Sans worker (navigateur ancien, erreur), ou si un
 * morceau manque au moment d'en avoir besoin, il est généré tout de suite (le jeu attend un
 * instant).
 */
export class EndlessChunks {
  private worker: Worker | null = null;
  private readonly ready = new Map<string, EndlessChunk>();
  private readonly asked = new Set<string>();
  /** La partie en cours : les morceaux d'une autre partie, arrivés en retard, sont oubliés. */
  private runSeed = -1;

  constructor() {
    try {
      this.worker = new Worker(new URL('../core/arcade/endlessWorker.ts', import.meta.url), {
        type: 'module',
      });
      this.worker.onmessage = (event: MessageEvent<EndlessReply>) => {
        const { chunk } = event.data;
        const key = keyOf(event.data);
        this.asked.delete(key);
        if (chunk && event.data.runSeed === this.runSeed) {
          this.ready.set(key, chunk);
        }
      };
      this.worker.onerror = () => {
        // Le worker ne marche pas ici : tout se génère sur place.
        this.worker?.terminate();
        this.worker = null;
        this.asked.clear();
      };
    } catch {
      this.worker = null;
    }
  }

  /**
   * Demande un morceau à l'avance (sans effet s'il est déjà prêt ou demandé) ; `entryTop` : la
   * hauteur de sa jointure (null : celle du départ).
   */
  prepare(game: ArcadeGameId, index: number, runSeed: number, entryTop: number | null): void {
    const request: EndlessRequest = { game, index, runSeed, entryTop };
    const key = keyOf(request);
    if (!this.worker || this.ready.has(key) || this.asked.has(key)) {
      return;
    }
    this.asked.add(key);
    this.worker.postMessage(request);
  }

  /** Le morceau s'il est prêt (sans attendre), retiré de la réserve ; sinon null. */
  take(game: ArcadeGameId, index: number, runSeed: number): EndlessChunk | null {
    const key = keyOf({ game, index, runSeed, entryTop: null });
    const chunk = this.ready.get(key) ?? null;
    this.ready.delete(key);
    return chunk;
  }

  /** Le morceau tout de suite : prêt, ou généré sur place. Null pour un jeu sans morceaux. */
  now(
    game: ArcadeGameId,
    index: number,
    runSeed: number,
    entryTop: number | null,
  ): EndlessChunk | null {
    return this.take(game, index, runSeed) ?? endlessChunk(game, index, runSeed, entryTop);
  }

  /** Une nouvelle partie (sa graine) : les morceaux de l'ancienne sont oubliés. */
  start(runSeed: number): void {
    this.runSeed = runSeed;
    this.ready.clear();
  }

  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this.ready.clear();
    this.asked.clear();
  }
}

function keyOf(request: EndlessRequest): string {
  return `${request.game}:${String(request.runSeed)}:${String(request.index)}`;
}
