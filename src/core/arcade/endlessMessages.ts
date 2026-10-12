import type { ArcadeGameId } from '../../config/arcade';
import type { EndlessChunk } from './endless';

/** Une demande de morceau au générateur en arrière-plan (D-167). */
export interface EndlessRequest {
  readonly game: ArcadeGameId;
  readonly index: number;
  readonly runSeed: number;
  /** La hauteur de sa jointure (null : celle du départ). */
  readonly entryTop: number | null;
}

/** Sa réponse : le morceau, ou null (et l'erreur) si la génération a échoué. */
export interface EndlessReply extends EndlessRequest {
  readonly chunk: EndlessChunk | null;
  readonly error?: string;
}
