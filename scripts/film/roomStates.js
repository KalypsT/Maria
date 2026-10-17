/**
 * Les états de la chambre du film de la fin (D-190, D-191) : voir `capture-room.js`. Ce matin-là,
 * Céleste partie, Maria rangée sur l'étagère : le jour, et la nuit (sans le matin). Céleste ne
 * grandit pas au-delà du jeu : la chambre ne change pas.
 */
const MORNING = ['finale.morning', 'finale.awake', 'finale.together'];

export const STATES = {
  day: {},
  // Un autre jour, le chat n'est pas sur le tabouret (D-191).
  'day-nocat': { removeProps: ['cat-sleep-finale'] },
  night: { dropFlags: MORNING },
};
