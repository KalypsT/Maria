import { END_SCREEN } from '../config/story';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';

/**
 * L'écran de fin (D-145, §11, §12), sans texte : sur la page du cahier, Maria seule, assise sur
 * son étagère, sous une lumière douce ; quelques scintillements passent près d'elle, puis plus
 * rien. Après un moment, un petit rond invite à continuer : un toucher ou une touche, et la
 * promesse se résout (la scène relance l'accueil). Maria ne bouge pas (pilier 5).
 */
export function showEndScreen(baseUrl: string): Promise<void> {
  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.id = 'end-screen';
    root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    root.style.setProperty('--end-fade', `${String(END_SCREEN.fadeInMs)}ms`);
    const scene = document.createElement('div');
    scene.className = 'end-scene';
    const light = document.createElement('div');
    light.className = 'end-light';
    const maria = document.createElement('img');
    maria.className = 'end-maria';
    maria.src = `${baseUrl}${END_SCREEN.mariaImage}`;
    maria.alt = '';
    maria.draggable = false;
    const shelf = document.createElement('div');
    shelf.className = 'end-shelf';
    scene.append(light, maria, shelf);
    for (let i = 0; i < END_SCREEN.sparkles; i++) {
      const sparkle = document.createElement('span');
      sparkle.className = 'end-sparkle';
      // Places et départs fixes (le même écran à chaque fois), autour de Maria.
      sparkle.style.left = `${String(30 + ((i * 37) % 45))}%`;
      sparkle.style.top = `${String(18 + ((i * 23) % 40))}%`;
      sparkle.style.animationDelay = `${String(END_SCREEN.fadeInMs + i * 260)}ms`;
      sparkle.style.animationDuration = `${String(END_SCREEN.sparkleMs)}ms`;
      scene.appendChild(sparkle);
    }
    root.appendChild(scene);
    const next = document.createElement('button');
    next.className = 'end-next';
    next.type = 'button';
    next.setAttribute('aria-label', 'Continuer');
    root.appendChild(next);
    document.body.appendChild(root);

    let ready = false;
    const timer = window.setTimeout(() => {
      ready = true;
      next.classList.add('end-next-shown');
    }, END_SCREEN.continueAfterMs);
    const finish = () => {
      if (!ready) {
        return;
      }
      window.clearTimeout(timer);
      window.removeEventListener('keydown', finish);
      resolve();
    };
    root.addEventListener('pointerup', finish);
    window.addEventListener('keydown', finish);
  });
}
