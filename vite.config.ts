import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const BACKGROUND = '#1b1a24';

// GitHub Pages sert le site sous https://kalypst.github.io/Maria/ ; même base en dev pour éviter les écarts.
// Le mode `debug` produit le build de debug publié sous /Maria/debug/ (décision D-12).
export default defineConfig(({ mode }) => {
  const isDebugBuild = mode === 'debug';
  return {
    base: isDebugBuild ? '/Maria/debug/' : '/Maria/',
    define: {
      // Remplacé textuellement : le code de debug est éliminé du build principal.
      __DEBUG_TOOLS__: JSON.stringify(mode !== 'production'),
    },
    plugins: [
      // PWA (D-09, D-23) : build principal seulement. Le build de debug et le serveur de dev n'ont
      // pas de service worker (toujours à jour) ; le module d'enregistrement y est sans effet.
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
          globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
          // Le build de debug est publié sous /Maria/debug/ : jamais précaché ni servi par ce SW.
          globIgnores: ['debug/**'],
          navigateFallbackDenylist: [/^\/Maria\/debug(\/|$)/],
          // Phaser seul pèse ~1,5 Mo minifié.
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          cleanupOutdatedCaches: true,
        },
      }),
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
