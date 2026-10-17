import { END_SCREEN } from '../config/story';
import { UI_OVERLAY_ATTRIBUTE } from '../core/input/TouchSource';

/**
 * L'écran de fin (D-145, §11, §12) : sur la page du cahier, Maria seule, assise sur son étagère,
 * sous une lumière douce ; quelques scintillements passent près d'elle, puis plus rien. Seul texte,
 * la dédicace (D-183) s'écrit au crayon sous l'étagère, signée en petit. Après un moment, un petit
 * rond invite à continuer : un toucher ou une touche, et la promesse se résout (la scène relance
 * l'accueil). Maria ne bouge pas (pilier 5).
 *
 * Toutes les coquilles trouvées (`snail`, D-148) : un petit escargot vivant traverse lentement
 * l'étagère vers Maria et laisse une trace argentée, sans rien expliquer.
 *
 * Les jouets d'avant (D-191) : posés autour d'elle, comme dans sa chambre, sur l'étagère élargie.
 */
export function showEndScreen(baseUrl: string, snail = false): Promise<void> {
  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.id = 'end-screen';
    root.setAttribute(UI_OVERLAY_ATTRIBUTE, '');
    root.style.setProperty('--end-fade', `${String(END_SCREEN.fadeInMs)}ms`);
    const scene = document.createElement('div');
    scene.className = 'end-scene end-scene-wide';
    const light = document.createElement('div');
    light.className = 'end-light';
    const maria = document.createElement('img');
    maria.className = 'end-maria';
    maria.src = `${baseUrl}${END_SCREEN.mariaImage}`;
    maria.alt = '';
    maria.draggable = false;
    const shelf = document.createElement('div');
    shelf.className = 'end-shelf end-shelf-wide';
    scene.append(light);
    for (const toy of END_SCREEN.toys) {
      const thing = document.createElement('img');
      thing.className = 'end-thing';
      thing.src = `${baseUrl}${toy.image}`;
      thing.alt = '';
      thing.draggable = false;
      thing.style.left = `${String(toy.left)}%`;
      thing.style.height = `${String(toy.height)}%`;
      scene.appendChild(thing);
    }
    // Maria devant eux.
    scene.append(maria, shelf);
    if (snail) {
      scene.style.setProperty('--snail-ms', `${String(END_SCREEN.snailMs)}ms`);
      scene.style.setProperty('--snail-delay', `${String(END_SCREEN.snailDelayMs)}ms`);
      const trail = document.createElement('div');
      trail.className = 'end-trail';
      const crawler = document.createElement('div');
      crawler.className = 'end-snail';
      const body = document.createElement('span');
      body.className = 'end-snail-body';
      for (const side of ['back', 'front']) {
        const horn = document.createElement('span');
        horn.className = `end-snail-horn end-snail-horn-${side}`;
        body.appendChild(horn);
      }
      const shell = document.createElement('img');
      shell.className = 'end-snail-shell';
      shell.src = `${baseUrl}${END_SCREEN.shellImage}`;
      shell.alt = '';
      shell.draggable = false;
      crawler.append(body, shell);
      scene.append(trail, crawler);
    }
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
    root.style.setProperty('--dedication-delay', `${String(END_SCREEN.dedicationDelayMs)}ms`);
    root.style.setProperty('--dedication-ms', `${String(END_SCREEN.dedicationWriteMs)}ms`);
    root.style.setProperty(
      '--signature-delay',
      `${String(END_SCREEN.dedicationDelayMs + END_SCREEN.dedicationWriteMs + END_SCREEN.signatureDelayMs)}ms`,
    );
    const dedication = document.createElement('div');
    dedication.className = 'end-dedication';
    const words = document.createElement('p');
    words.className = 'end-dedication-text';
    words.textContent = END_SCREEN.dedication;
    const signature = document.createElement('p');
    signature.className = 'end-dedication-signature';
    signature.textContent = END_SCREEN.signature;
    dedication.append(words, signature);
    root.appendChild(dedication);
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
