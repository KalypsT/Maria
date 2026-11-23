/// <reference types="vite-plugin-pwa/client" />

/** Vrai en dev et dans le build de debug, faux dans le build principal (décision D-12). */
declare const __DEBUG_TOOLS__: boolean;

/** Version du jeu (D-152) : date et identifiant court du dernier commit, ou « dev ». */
declare const __APP_VERSION__: string;

/** Vrai dans le build de DomoThib Games seulement (D-193) : le jeu s'ouvre dans DomoThib. */
declare const __DOMOTHIB__: boolean;
