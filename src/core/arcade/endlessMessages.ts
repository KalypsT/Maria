import type { ArcadeGameId } from '../../config/arcade';
import type { EndlessChunk, EndlessEntry } from './endless';

/** Une demande de morceau au générateur en arrière-plan (D-167). */
export interface EndlessRequest {
  readonly game: ArcadeGameId;
  readonly index: number;
  readonly runSeed: number;
  /** Où il commence (null : le premier morceau). */
  readonly entry: EndlessEntry | null;
}

/** Sa réponse : le morceau, ou null (et l'erreur) si la génération a échoué. */
export interface EndlessReply extends EndlessRequest {
  readonly chunk: EndlessChunk | null;
  readonly error?: string;
}
