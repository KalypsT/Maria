/** Environnement du navigateur utile à l'installation (D-23), injecté pour rester testable. */
export interface InstallEnvironment {
  userAgent: string;
  maxTouchPoints: number;
  /** `matchMedia('(display-mode: standalone)')` ou `fullscreen`. */
  displayModeInstalled: boolean;
  /** `navigator.standalone` (iOS Safari, application ajoutée à l'écran d'accueil). */
  iosStandalone: boolean | undefined;
}

export type InstallHint = 'none' | 'ios-share';

/** Le jeu tourne-t-il déjà comme application installée ? */
export function isInstalled(env: Readonly<InstallEnvironment>): boolean {
  return env.displayModeInstalled || env.iosStandalone === true;
}

/** iPhone, iPod, iPad (iPadOS se présente comme un Mac tactile). */
export function isIos(env: Readonly<InstallEnvironment>): boolean {
  const ua = env.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && env.maxTouchPoints > 1);
}

/**
 * Aide à afficher sur l'écran de départ : sur iOS, hors application installée et hors navigateurs
 * intégrés (Facebook, Instagram…) où « Sur l'écran d'accueil » n'existe pas, on explique le geste
 * Partager → Sur l'écran d'accueil (seul vrai plein écran, et protection de la sauvegarde).
 */
export function installHint(env: Readonly<InstallEnvironment>): InstallHint {
  if (isInstalled(env) || !isIos(env)) {
    return 'none';
  }
  if (/FBAN|FBAV|Instagram|Line\/|MicroMessenger/.test(env.userAgent)) {
    return 'none';
  }
  return 'ios-share';
}
