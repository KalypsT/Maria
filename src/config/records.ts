/**
 * Les disques (D-121) : un easter egg secret. Des disques inédits trouvés au fil de l'aventure, à
 * écouter sur le tourne-disque du grenier. Un disque joue une fois en entier, où que soit Céleste,
 * à la place des thèmes ; ensuite les thèmes reprennent.
 *
 * Le fichier d'un disque est `record-<id>` dans `src/assets/audio/` ; un disque sans fichier est
 * caché (ni pochette ni objet dans le monde). Trouvé, il est enregistré dans les souvenirs de la
 * sauvegarde sous ce même nom (`record-<id>`), sans onglet dans le cahier. L'ordre est celui des
 * pochettes. Les pochettes sont sans texte (pilier 6) ; `title` ne sert qu'à l'accessibilité.
 */
export const RECORDS = [
  {
    /**
     * « Céleste petite étoile » (D-156) : sur l'étagère sous le toit de la cabane dans l'arbre, au
     * jardin (niveau 2).
     */
    id: 'early',
    title: 'Céleste petite étoile',
    sleeve: 0x7fb3a6,
  },
  {
    /** « Les Aventures de Céleste » : au bureau des objets trouvés de la gare (niveau 4). */
    id: 'adventures',
    title: 'Les Aventures de Céleste',
    sleeve: 0xe38aa0,
  },
  {
    /**
     * « Avant même ta naissance » (D-156), une berceuse : sur l'armoire du dortoir de la classe de
     * mer (niveau 6). Pas chez la nounou (niveau 7) : on n'y revient jamais, un disque raté y serait
     * perdu.
     */
    id: 'lullaby',
    title: 'Avant même ta naissance',
    sleeve: 0xb7a3d6,
  },
] as const;

export type RecordId = (typeof RECORDS)[number]['id'];
/** Nom du fichier audio d'un disque, et son identifiant dans les souvenirs de la sauvegarde. */
export type RecordSlot = `record-${RecordId}`;

export function recordSlot(id: RecordId): RecordSlot {
  return `record-${id}`;
}

export const RECORD_SLOTS: readonly RecordSlot[] = RECORDS.map((r) => recordSlot(r.id));

export function isRecordSlot(id: string): id is RecordSlot {
  return (RECORD_SLOTS as readonly string[]).includes(id);
}
