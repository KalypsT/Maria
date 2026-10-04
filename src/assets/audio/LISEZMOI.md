# Musique (D-57)

Déposer ici les morceaux, nommés d'après leur emplacement :

| Fichier          | Quand                                                       |
| ---------------- | ----------------------------------------------------------- |
| `title`          | écran d'accueil                                             |
| `house`          | la maison, de jour comme de nuit                            |
| `garden`         | le jardin                                                   |
| `street`         | la rue du quartier                                          |
| `station`        | la gare                                                     |
| `train`          | le train de nuit                                            |
| `strange`        | tous les mondes étranges (maison, haie, école, gare, train) |
| `memory-play`    | les souvenirs jouables (la cuisine rose)                    |
| `found` (court)  | capacité ou trouvaille ramassée                             |
| `memory` (court) | nouveau souvenir                                            |
| `maria` (court)  | apparition de Maria (sans ce fichier : le silence)          |
| `record-<id>`    | un disque du tourne-disque (D-121), joué une fois en entier |

Ne pas déposer les fichiers bruts : les préparer avec `npm run audio:prepare -- <dossier>` (ffmpeg
requis, D-92). Le script coupe les silences du début et de la fin, ramène tous les sons à la même
sonie (−18 LUFS) et produit `garden.m4a` (AAC 96 kbit/s, lu partout, y compris sur iPhone) à
partir de `garden.mp3` ou `f9d40126-garden.mp3`. `--max 5` raccourcit un son à 5 s avec un
fondu de sortie (le jingle `memory`). Formats lus : `.ogg` / `.opus`, `.m4a`, `.mp3`.
Un emplacement sans fichier reste silencieux (un disque sans fichier est caché). Les disques
sont listés dans `src/config/records.ts` ; `record-adventures` : « Les Aventures de Céleste ». Poids total maximal : `AUDIO_BUDGET_BYTES`
(`src/config/audio.ts`), vérifié par les tests, car tout est précaché pour le hors ligne.
Les thèmes bouclent en fondu enchaîné avec leur propre fin (`loopCrossfadeMs`).
