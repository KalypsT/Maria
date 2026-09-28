import type { GameScene } from '../scenes/GameScene';

/** Overlay de debug (build de debug uniquement, décision D-12). */
export function installDebugOverlay(scene: GameScene): void {
  const root = document.createElement('div');
  root.id = 'maria-debug-overlay';
  document.body.appendChild(root);
  scene.events.once('shutdown', () => {
    root.remove();
  });
}
