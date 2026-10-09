/**
 * Les stats de la partie (D-153) : le temps de jeu, les évanouissements, le fil discret, salle par
 * salle. Valeurs PROVISOIRES.
 */
export const STATS = {
  /**
   * Le temps de jeu est écrit avec chaque sauvegarde ; sans autre sauvegarde, au plus tard après ce
   * temps de jeu (ms) : on ne perd jamais plus d'une minute en fermant l'appli.
   */
  saveEveryMs: 60 * 1000,
  /** Plafond d'un compteur (le temps en ms : environ 11 jours de jeu). */
  maxCount: 1e9,
  /** Nombre de salles retenues au plus (une sauvegarde abîmée n'en ajoute pas sans fin). */
  maxRooms: 500,
} as const;
