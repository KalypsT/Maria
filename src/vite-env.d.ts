/// <reference types="vite-plugin-pwa/client" />

/** Vrai en dev et dans le build de debug, faux dans le build principal (décision D-12). */
declare const __DEBUG_TOOLS__: boolean;

/** Version du jeu (D-152) : date et identifiant court du dernier commit, ou « dev ». */
declare const __APP_VERSION__: string;
