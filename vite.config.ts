import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { appVersion } from './scripts/app-version.js';
import { domothibFiles } from './scripts/domothib-files.js';

/** Papier du cahier (écran de départ) : couleur de lancement et de la barre d'état. */
const BACKGROUND = '#f3ead7';

// GitHub Pages sert le site sous https://kalypst.github.io/Maria/ ; même base en dev pour éviter les écarts.
// Le mode `debug` produit le build de debug publié sous /Maria/debug/ (décision D-12).
// Le mode `domothib` produit le build de DomoThib Games, servi sous /maria/ sur l'hôte des jeux (D-193).
export default defineConfig(({ mode }) => {
  const isDebugBuild = mode === 'debug';
  const isDomothib = mode === 'domothib';
  const version = appVersion();
  return {
    base: isDebugBuild ? '/Maria/debug/' : isDomothib ? '/maria/' : '/Maria/',
    define: {
      // Remplacé textuellement : le code de debug est éliminé du build principal et de DomoThib.
      __DEBUG_TOOLS__: JSON.stringify(mode !== 'production' && !isDomothib),
      // Le jeu ouvert dans DomoThib Games (D-193) : le pont, sans PWA ni retour d'Android.
      __DOMOTHIB__: JSON.stringify(isDomothib),
      // Version affichée sur l'écran de départ (D-152).
      __APP_VERSION__: JSON.stringify(version),
    },
    plugins: [
      // PWA (D-09, D-23) : build principal seulement. Le build de debug, celui de DomoThib (l'hôte
      // des jeux refuse les service workers, D-193) et le serveur de dev n'en ont pas ; le module
      // d'enregistrement y est sans effet.
      VitePWA({
        disable: mode !== 'production',
        registerType: 'prompt',
        injectRegister: false,
        // Icônes déjà précachées par `globPatterns` : pas de doublon dans le précache.
        includeManifestIcons: false,
        manifest: {
          name: 'MARIA',
          short_name: 'MARIA',
          description: 'Céleste cherche son poupon, Maria.',
          lang: 'fr',
          start_url: '/Maria/',
          scope: '/Maria/',
          display: 'fullscreen',
          display_override: ['fullscreen', 'standalone'],
          orientation: 'landscape',
          background_color: BACKGROUND,
          theme_color: BACKGROUND,
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Musique (D-57) : précachée aussi, jouable hors ligne dès l'installation.
          globPatterns: ['**/*.{js,css,html,png,webp,jpg,svg,woff2,ogg,opus,m4a,mp3}'],
          // Le build de debug est publié sous /Maria/debug/ : jamais précaché ni servi par ce SW.
          globIgnores: ['debug/**'],
          navigateFallbackDenylist: [/^\/Maria\/debug(\/|$)/],
          // Phaser seul pèse ~1,5 Mo minifié ; un morceau de musique peut peser davantage (D-57).
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          cleanupOutdatedCaches: true,
        },
      }),
      ...(isDomothib ? [domothibFiles(version)] : []),
    ],
    server: { host: true },
    preview: { host: true },
    build: {
      target: 'es2022',
      outDir: isDebugBuild ? 'dist/debug' : 'dist',
      // Le build de debug publie aussi la mesure physique maison vs Arcade (condition D-05).
      rollupOptions: isDebugBuild
        ? { input: { main: 'index.html', arcadeBench: 'bench/arcade.html' } }
        : {},
      // Phaser seul pèse ~1,5 Mo minifié.
      chunkSizeWarningLimit: 2000,
    },
  };
});
