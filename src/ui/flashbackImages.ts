import { FLASHBACK_IMAGES } from '../config/art';
import type { FlashbackId } from '../config/memories';

const images = new Map<FlashbackId, HTMLImageElement>();

/**
 * L'illustration d'un court souvenir (D-170), si elle est chargée ; sinon null, et `onLoad` est
 * appelé quand elle l'est (pour redessiner la vignette). Le chargement commence au premier appel.
 */
export function flashbackImage(id: FlashbackId, onLoad?: () => void): HTMLImageElement | null {
  let image = images.get(id);
  if (!image) {
    image = new Image();
    image.decoding = 'async';
    image.src = `art/${FLASHBACK_IMAGES[id]}`;
    images.set(id, image);
  }
  if (image.complete && image.naturalWidth > 0) {
    return image;
  }
  if (onLoad) {
    image.addEventListener('load', onLoad, { once: true });
  }
  return null;
}
