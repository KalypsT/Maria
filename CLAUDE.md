# MARIA — Instructions pour Claude Code

Jeu d'action-platformer 2D / Metroidvania compact pour **navigateur mobile (paysage)**.
Héroïne : **Céleste**, petite fille qui grandit et cherche son poupon **Maria**.
Stack : **Phaser 4 + TypeScript strict + Vite** (Phaser 4 plutôt que 3 : voir `docs/DECISIONS.md`, D-04). Solo, hors ligne après chargement.

## Documents de référence

- `docs/MARIA_Specifications.md` : spécification complète (~1900 lignes). **Ne pas la relire en entier à chaque session.** Lire uniquement les sections utiles à la tâche (les titres `# N.` permettent de s'y repérer).
- `docs/DECISIONS.md` : décisions techniques validées. Elles priment sur la spec en cas d'écart.
- `PROGRESS.md` : phase en cours, ce qui est fait, ce qui reste. **Le lire au début de chaque session et le mettre à jour à la fin.**

## Piliers à ne jamais modifier sans validation explicite

1. Le platforming est le cœur du jeu : **précision avant réalisme physique**.
2. Monde interconnecté ; les revisites doivent avoir une raison (nouvelle route, secret, croissance).
3. Les capacités transforment le déplacement, elles ne sont pas de simples clés.
4. Le combat reste secondaire ; les ennemis sont conçus autour du mouvement. Pas de gore.
5. **Maria ne parle jamais et n'est jamais montrée en train de se déplacer.**
6. Le fantastique n'est jamais entièrement expliqué ; peu de texte, pas de monologue explicatif.
7. La croissance a une influence réelle mais modérée (physique commune, paramètres contrôlés).
8. Ton doux-amer, mystérieux, parfois inquiétant, jamais horreur.
9. Conçu d'abord pour mobile paysage, tactile en premier.
10. La sauvegarde ne doit pas se perdre facilement.

Toute modification substantielle du mouvement, de la progression, de Maria, de la structure du monde, de la croissance, de la sauvegarde ou de la boucle de gameplay doit être **signalée avant d'être appliquée**.

## Ce qui reste volontairement ouvert (spec §45)

Ne pas inventer comme définitifs : design visuel final, coiffures par phase, détails de Maria, histoire de la famille, événement de disparition, explication finale, liste des zones et des capacités, nombre de boss/souvenirs, valeurs de physique finales, musique, effets sonores. Utiliser des **placeholders clairement marqués** et les traiter comme des paramètres.

## Identité visuelle à respecter (spec §2)

- Céleste : **lunettes rondes roses**, couettes ou queue de cheval selon la phase.
- Maria : poupon métisse, apparence cohérente et reconnaissable.
- Tant que la direction artistique n'est pas validée : formes géométriques simples en placeholder.

## Commandes

Node ≥ 22.12 (`.nvmrc`). Installer avec `npm ci`.

```
npm run dev           # serveur de dev Vite sur http://<ip-locale>:5173/Maria/ (--host : accessible sur le réseau local)
npm run build         # build de production dans dist/
npm run preview       # sert dist/ localement (http://<ip-locale>:4173/Maria/)
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint (typescript-eslint strictTypeChecked)
npm run format        # Prettier --write
npm run format:check  # Prettier --check (vérifié en CI)
npm run test          # Vitest (tests/**/*.test.ts)
npm run test:watch    # Vitest en mode watch
```

Le déploiement se fait via GitHub Pages (`.github/workflows/deploy.yml`) : chaque push sur `main` lance typecheck, lint, format, tests, build puis publie sur https://kalypst.github.io/Maria/. Les PR lancent les mêmes vérifications sans déployer.

## Conventions de code

- TypeScript `strict`. Pas de `any` sans justification en commentaire.
- Identifiants de code en **anglais** ; textes du jeu, docs et échanges en **français**.
- Toutes les valeurs de gameplay (vitesse, gravité, coyote time, jump buffer, etc.) dans `src/config/`, jamais de valeurs magiques dispersées.
- Données séparées de la logique ; niveaux et zones pilotés par des données externes.
- Logique de mouvement, sauvegarde, inventaire, événements : **fonctions pures testables** (Vitest), indépendantes de Phaser.
- Le gameplay ne dépend jamais directement du tactile ou du clavier : passer par l'abstraction `InputAction` (Move, Jump, Attack, Ability, Interact, Pause, Map) alimentée par Touch / Keyboard / Gamepad.
- Machine à états du joueur explicite, sans dépendances circulaires entre états.
- Commentaires uniquement quand la logique n'est pas évidente.
- Éviter les allocations par frame et le pullulement de GameObjects (cible : téléphones récents fluides).
- Pas d'architecture complexe sans nécessité. La structure de dossiers de la spec (§29.2) est indicative.

## Mouvement (priorité n°1)

- Simulation du joueur à pas de temps fixe (voir `docs/DECISIONS.md`, D-05).
- Doit inclure : accélération/décélération, saut à hauteur variable, coyote time, jump buffering, contrôle aérien. Valeurs de départ dans la spec §14, à régler par essais sur téléphone.
- Ne jamais figer des valeurs « à l'aveugle » : prévoir un overlay de debug avec réglage en direct.

## Outils de debug

Activés en développement uniquement (jamais dans le build de production) : hitboxes, vitesse, état du joueur, téléportation de zone, déblocage des capacités, changement de phase de croissance, déclenchement d'événements, IDs de checkpoints, inspection de la sauvegarde.

## Sauvegarde

IndexedDB en priorité, avec : version de schéma, validation, checksum, écriture atomique, conservation de la sauvegarde précédente valide, migrations, et export/import d'un code de sauvegarde. Demander le stockage persistant du navigateur.

## Méthode de travail

- **Une phase = une branche = une session.** Ne pas déborder sur la phase suivante.
- Ordre des phases : spec §42 (mouvement → plateforme → contrôles mobiles → combat minimal → checkpoint/sauvegarde → première zone → croissance → carte/secrets → narration → contenu). Les contrôles tactiles passent **juste après** le mouvement de base.
- Premier objectif de production : **vertical slice de 15–30 min** (spec §53). Pas de contenu massif avant sa validation.
- Commits petits et fréquents, messages clairs.
- Avant de coder une tâche non triviale : proposer un plan court, signaler les risques (coût, contradiction, dette technique, performances mobiles).
- Si une décision technique de la spec peut être améliorée : identifier le problème, proposer une alternative, expliquer brièvement les conséquences, puis attendre validation.
- Tester sur un appareil réel dès que possible ; ne pas conclure qu'un mouvement est « bon » uniquement d'après le code.
- Fin de session : `npm run typecheck`, `npm run lint`, `npm run test`, mise à jour de `PROGRESS.md`.

## Priorités si les ressources sont limitées (spec §52)

Mouvement > level design > contrôles tactiles > exploration/carte > capacités > croissance > Maria/narration > combat > secrets avancés > polish audiovisuel.
Un petit contenu très bien conçu vaut mieux qu'un grand contenu médiocre.

## Question de réussite

> Est-ce que contrôler cette petite fille et explorer son monde est suffisamment agréable pour donner envie de continuer à jouer ?
