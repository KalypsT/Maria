# Bruitages (D-126)

Déposer ici les bruitages, nommés d'après leur emplacement (`src/config/sfx.ts`), avec un numéro
par variante : `step-wood-1.m4a`, `step-wood-2.m4a`, `jump-1.m4a`, `checkpoint.m4a`… La liste
des sons et quand ils sont joués : `docs/BRUITAGES.md`.

Ne pas déposer les fichiers bruts : les préparer avec `npm run audio:prepare -- --sfx <fichiers>`
(ffmpeg requis). Le script coupe les silences, passe en mono, ramène tous les sons à la même crête
(−4 dBFS) et produit un `.m4a` de quelques Ko. Formats lus : `.ogg` / `.opus`, `.m4a`, `.mp3`.
Poids total maximal : `SFX_BUDGET_BYTES`, vérifié par les tests (tout est précaché pour le hors
ligne). Un emplacement sans fichier reste silencieux.
