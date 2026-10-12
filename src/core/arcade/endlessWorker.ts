import { endlessChunk } from './arcade';
import type { EndlessRequest, EndlessReply } from './endlessMessages';

/**
 * Le mode Sans fin (D-167), en arrière-plan : un morceau demandé est généré ici (de 0,1 à 0,4 s),
 * sans faire attendre le jeu. Pur : le générateur des niveaux, rien de Phaser.
 */
self.onmessage = (event: MessageEvent<EndlessRequest>) => {
  const { game, index, runSeed } = event.data;
  let reply: EndlessReply;
  try {
    reply = { game, index, runSeed, chunk: endlessChunk(game, index, runSeed) };
  } catch (error) {
    reply = { game, index, runSeed, chunk: null, error: String(error) };
  }
  self.postMessage(reply);
};
