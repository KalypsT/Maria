import { describe, expect, it } from 'vitest';
import {
  ART_IMAGES,
  FLASHBACK_IMAGES,
  MEMORY_IMAGES,
  RECORD_IMAGES,
  TREASURE_SHARED_IMAGES,
} from '../src/config/art';
import { FLASHBACKS, MARIA_THINGS, MEMORIES, STRANGE_THINGS } from '../src/config/memories';
import { RECORDS } from '../src/config/records';

/** Les fichiers de public/art (chemins relatifs à ce dossier). */
const FILES = new Set(
  Object.keys(import.meta.glob('../public/art/**/*')).map((path) =>
    path.replace('../public/art/', ''),
  ),
);
const exists = (file: string) => FILES.has(file);

describe('les images fournies (D-170)', () => {
  it('chaque image déclarée est dans public/art', () => {
    const files = [
      ...Object.values(ART_IMAGES),
      ...Object.values(MEMORY_IMAGES),
      ...Object.values(RECORD_IMAGES),
      ...Object.values(FLASHBACK_IMAGES),
    ];
    expect(files.filter((file) => !exists(file))).toEqual([]);
  });

  it('tous les trésors, les disques et les courts souvenirs ont leur image', () => {
    const treasures = [...MEMORIES, ...MARIA_THINGS, ...STRANGE_THINGS];
    // Roger et l'Educaville ont la leur depuis D-69 et D-155, partagée avec le décor.
    const missing = treasures.filter((id) => !MEMORY_IMAGES[id] && !TREASURE_SHARED_IMAGES[id]);
    expect(missing).toEqual([]);
    expect(Object.values(TREASURE_SHARED_IMAGES).filter((file) => !exists(file))).toEqual([]);
    expect(RECORDS.every((record) => exists(RECORD_IMAGES[record.id]))).toBe(true);
    expect(FLASHBACKS.every((id) => exists(FLASHBACK_IMAGES[id]))).toBe(true);
  });
});
