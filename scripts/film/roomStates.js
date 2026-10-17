/**
 * Les états de la chambre du film des années (D-190) : voir `capture-room.js`. Chaque âge reprend
 * le précédent. PLACEHOLDER : l'avenir de la chambre reste ouvert (§45), à changer ici.
 */
const MORNING = ['finale.morning', 'finale.awake', 'finale.together'];
/** Après la fin (D-145, D-169) : le dessin de toute la famille au mur, la console sur le bureau. */
const AFTER = ['finale.gone'];

/** Les choses de bébé s'en vont (le berceau, le mobile) ; ses dessins arrivent, une photo. */
const AGE9 = {
  addFlags: AFTER,
  removeProps: ['cradle-empty-finale'],
  removeDecor: [{ kind: 'mobile' }],
  addDecor: [
    { kind: 'drawings', col: 16, row: 2, width: 6, height: 3 },
    { kind: 'photo', col: 12, row: 3, width: 2, height: 2 },
  ],
};

/**
 * Le coffre à jouets devient des cartons (les jouets rangés) ; le tapis, la cabane du lit et les
 * étoiles de la veilleuse s'en vont ; une lampe, un panier.
 */
const AGE12 = {
  ...AGE9,
  removeDecor: [
    ...AGE9.removeDecor,
    { kind: 'toybox' },
    { kind: 'rug' },
    { kind: 'bedhouse' },
    { kind: 'nightstars' },
  ],
  addDecor: [
    ...AGE9.addDecor,
    { kind: 'boxes', col: 22, row: 16, width: 4, height: 4 },
    { kind: 'lamp', col: 30, row: 13, width: 2, height: 2 },
    { kind: 'basket', col: 27, row: 18, width: 3, height: 2 },
  ],
};

/** Ses vêtements à la porte ; un tableau à la place des dessins d'enfant. */
const AGE15 = {
  ...AGE12,
  addDecor: [
    ...AGE12.addDecor.filter((d) => d.kind !== 'drawings'),
    { kind: 'frame', col: 17, row: 2, width: 4, height: 3 },
    { kind: 'coatrack', col: 39, row: 13, width: 4, height: 2 },
  ],
};

/** Le départ : une malle près de la porte. */
const AGE18 = {
  ...AGE15,
  addDecor: [...AGE15.addDecor, { kind: 'trunk', col: 39, row: 17, width: 4, height: 3 }],
};

export const STATES = {
  // Ce matin, Céleste partie : 7 ans.
  'age7-day': {},
  'age7-night': { dropFlags: MORNING },
  age9: AGE9,
  age12: AGE12,
  // Une nuit, à 13 ans : papa à la porte (D-190, PR 7).
  'age13-night': { ...AGE12, dropFlags: MORNING },
  age15: AGE15,
  age18: AGE18,
  // La dernière nuit, la chambre vide : le dernier signe (D-190, PR 8).
  'age18-night': { ...AGE18, dropFlags: MORNING },
};
