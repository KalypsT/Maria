import { defineConfig } from 'vite';

// GitHub Pages sert le site sous https://kalypst.github.io/Maria/ ; même base en dev pour éviter les écarts.
export default defineConfig({
  base: '/Maria/',
  server: { host: true },
  preview: { host: true },
  build: {
    target: 'es2022',
    // Phaser seul pèse ~1,5 Mo minifié.
    chunkSizeWarningLimit: 2000,
  },
});
