import { defineConfig } from 'vite';

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
    server: { host: true },
    preview: { host: true },
    build: {
      target: 'es2022',
      outDir: isDebugBuild ? 'dist/debug' : 'dist',
      // Phaser seul pèse ~1,5 Mo minifié.
      chunkSizeWarningLimit: 2000,
    },
  };
});
