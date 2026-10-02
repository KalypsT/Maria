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
| `found` (court)   | capacité ou trouvaille ramassée                    |
| `memory` (court)  | nouveau souvenir                                   |
| `maria` (court)   | apparition de Maria (sans ce fichier : le silence) |

Formats : `.ogg` / `.opus` (préférés, plus légers), `.m4a` ou `.mp3`. Exemple : `garden.ogg`.
Un emplacement sans fichier reste silencieux. Poids total maximal : `AUDIO_BUDGET_BYTES`
(`src/config/audio.ts`), vérifié par les tests, car tout est précaché pour le hors ligne.
Les thèmes bouclent en fondu enchaîné avec leur propre fin (`loopCrossfadeMs`).
