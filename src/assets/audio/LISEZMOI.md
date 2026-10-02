# Musique (D-57)

Déposer ici les morceaux, nommés d'après leur emplacement :

| Fichier           | Quand                                              |
| ----------------- | -------------------------------------------------- |
| `title`           | écran d'accueil                                    |
| `house-night`     | la maison le soir et la nuit                       |
| `house-day`       | la maison le matin, et après la croissance         |
| `garden`          | le jardin                                          |
| `strange`         | le monde étrange de la maison                      |
| `hedge`           | derrière la haie                                   |
| `street`          | la rue du quartier                                 |
| `street-strange`  | l'école étrange (le monde étrange du quartier)     |
| `station`         | la gare                                            |
| `station-strange` | le monde étrange de la gare et sa tour             |
| `train`           | le train de nuit                                   |
| `train-strange`   | la cuisine étrange et le train de la vaisselle     |
| `memory-play`     | les souvenirs jouables (la cuisine rose)           |
| `found` (court)   | capacité ou trouvaille ramassée                    |
| `memory` (court)  | nouveau souvenir                                   |
| `maria` (court)   | apparition de Maria (sans ce fichier : le silence) |

Ne pas déposer les fichiers bruts : les préparer avec `npm run audio:prepare -- <dossier>` (ffmpeg
requis, D-92). Le script coupe les silences du début et de la fin, ramène tous les sons à la même
sonie (−18 LUFS) et produit `garden.m4a` (AAC 96 kbit/s, lu partout, y compris sur iPhone) à
partir de `garden.mp3` ou `f9d40126-garden.mp3`. Formats lus : `.ogg` / `.opus`, `.m4a`, `.mp3`.
Un emplacement sans fichier reste silencieux. Poids total maximal : `AUDIO_BUDGET_BYTES`
(`src/config/audio.ts`), vérifié par les tests, car tout est précaché pour le hors ligne.
Les thèmes bouclent en fondu enchaîné avec leur propre fin (`loopCrossfadeMs`).
