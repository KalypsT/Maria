import { STORY_TIMING as S, StoryFlag as F } from '../../config/story';
import type { StoryData, StoryStep, TileArea } from '../../core/story/story';
import { STATION_STORY } from '../station/story';

/** Haut de la bibliothèque du salon, là où Maria était assise. */
const LIVING_TOP: TileArea = { col: 46, row: 5, w: 10, h: 3 };
/** Autour de Maria, en haut de la bibliothèque : là où l'air scintille. */
const MARIA_SPOT: TileArea = { col: 48, row: 5, w: 6, h: 4 };
/** Arrivée dans le salon étrange : à la même place, sur la bibliothèque (dans le noir). */
const STRANGE_ARRIVAL: StoryStep = {
  do: 'room',
  room: 'living-strange',
  col: 50,
  row: 8,
  facing: -1,
};

/** L'étagère haute de la classe, sous l'oculus (D-64) : là où l'on passe dans l'école étrange. */
const SCHOOL_SHELF: TileArea = { col: 44, row: 8, w: 5, h: 3 };
/** Arrivée dans l'école étrange (dans le noir). */
const SCHOOL_ARRIVAL: StoryStep = {
  do: 'room',
  room: 'school-strange',
  col: 3,
  row: 43,
  facing: 1,
};

/** Le trou de la haie, au fond du jardin (D-49) : là où l'on passe derrière la haie. */
const HEDGE_HOLE: TileArea = { col: 38, row: 36, w: 7, h: 4 };
/** Arrivée dans le jardin renversé (dans le noir). */
const HEDGE_ARRIVAL: StoryStep = {
  do: 'room',
  room: 'garden-upside',
  col: 3,
  row: 23,
  facing: 1,
};

/**
 * Histoire de la maison (§5.2, D-31), PLACEHOLDER : le soir, Céleste joue avec Maria, la couche
 * dans son berceau, puis se couche ; au matin, Maria n'est plus là et des traces mènent vers le
 * rez-de-chaussée ; Maria aperçue en haut de la bibliothèque du salon, puis le monde étrange
 * (D-34). Maria ne change de place que dans le noir d'un fondu (pilier 5).
 */
export const HOUSE_STORY: StoryData = {
  triggers: [
    {
      id: 'evening-play',
      room: 'bedroom',
      on: 'interact',
      area: { col: 18, row: 17, w: 4, h: 3 },
      mark: { col: 19, row: 18 },
      when: { none: [F.EveningPlayed] },
      lock: true,
      steps: [
        { do: 'fadeOut', ms: S.fadeMs },
        { do: 'flag', id: F.EveningPlayed },
        { do: 'place', col: 21, row: 19, facing: -1 },
        { do: 'pose', pose: 'sit' },
        { do: 'fadeIn', ms: S.fadeMs },
        // Un câlin, puis une histoire du soir.
        { do: 'thought', icon: 'heart', ms: S.holdMs },
        { do: 'wait', ms: S.holdMs + 200 },
        { do: 'thought', icon: 'book', ms: S.holdMs },
        { do: 'wait', ms: S.holdMs + 200 },
        { do: 'pose', pose: 'stand' },
        // Maria a besoin de sa couverture (sur l'étagère au-dessus du bureau).
        { do: 'thought', icon: 'blanket', ms: S.thoughtMs },
      ],
    },
    {
      id: 'evening-blanket',
      room: 'bedroom',
      on: 'touch',
      area: { col: 31, row: 9, w: 6, h: 3 },
      when: { all: [F.EveningPlayed], none: [F.EveningBlanket] },
      lock: true,
      steps: [
        { do: 'flag', id: F.EveningBlanket },
        { do: 'thought', icon: 'cradle', ms: S.thoughtMs },
        { do: 'wait', ms: 800 },
      ],
    },
    {
      // Coucher Maria : Céleste la porte au berceau pendant le noir (on ne la voit jamais bouger).
      id: 'evening-tuck',
      room: 'bedroom',
      on: 'interact',
      area: { col: 18, row: 17, w: 4, h: 3 },
      mark: { col: 19, row: 18 },
      when: { all: [F.EveningPlayed, F.EveningBlanket], none: [F.EveningTucked] },
      lock: true,
      steps: [
        { do: 'fadeOut', ms: S.fadeMs },
        { do: 'flag', id: F.EveningTucked },
        { do: 'place', col: 25, row: 17, facing: -1 },
        { do: 'fadeIn', ms: S.fadeMs },
        // Céleste la regarde un moment, puis c'est l'heure d'aller au lit.
        { do: 'thought', icon: 'heart', ms: S.holdMs },
        { do: 'wait', ms: S.holdMs + 200 },
        { do: 'thought', icon: 'bed', ms: S.thoughtMs },
      ],
    },
    {
      // Au lit : maman vient dire bonne nuit (D-37), puis la nuit.
      id: 'evening-sleep',
      room: 'bedroom',
      on: 'interact',
      area: { col: 7, row: 13, w: 11, h: 3 },
      mark: { col: 9, row: 14 },
      when: { all: [F.EveningTucked], none: [F.Slept] },
      lock: true,
      steps: [
        { do: 'pose', pose: 'sit' },
        { do: 'thought', icon: 'heart', ms: S.holdMs },
        { do: 'wait', ms: S.holdMs },
        { do: 'fadeOut', ms: S.fadeMs },
        { do: 'flag', id: F.EveningGoodnight },
        { do: 'place', col: 12, row: 15, facing: 1 },
        { do: 'pose', pose: 'sit' },
        { do: 'fadeIn', ms: S.fadeMs },
        { do: 'wait', ms: 500 },
        { do: 'thought', icon: 'heart', ms: S.holdMs, by: 'mom-bed' },
        { do: 'wait', ms: S.holdMs + 200 },
        { do: 'thought', icon: 'heart', ms: S.holdMs },
        { do: 'wait', ms: S.holdMs },
        { do: 'fadeOut', ms: S.nightFadeOutMs },
        { do: 'flag', id: F.Slept },
        // Le berceau vide (D-57) : silence jusqu'à la fin de la bulle, puis le thème du matin.
        {
          do: 'hush',
          ms: S.nightBlackMs + S.nightFadeInMs + 1200 + S.thoughtMs + 1500,
        },
        { do: 'place', col: 12, row: 15, facing: 1 },
        { do: 'pose', pose: 'sit' },
        { do: 'wait', ms: S.nightBlackMs },
        { do: 'fadeIn', ms: S.nightFadeInMs },
        { do: 'wait', ms: 1200 },
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs + 1500 },
        { do: 'wait', ms: 2000 },
      ],
    },
    // Les affaires de Maria (D-58) : Agir les ramasse ; elles quittent le jeu pour le cahier.
    {
      id: 'take-slipper',
      room: 'hall',
      on: 'interact',
      area: { col: 22, row: 13, w: 5, h: 3 },
      mark: { col: 24, row: 14 },
      when: { all: [F.Slept], none: [F.SlipperTaken] },
      lock: true,
      steps: [
        { do: 'flag', id: F.TraceHall },
        { do: 'flag', id: F.SlipperTaken },
        { do: 'memory', id: 'slipper' },
        { do: 'thought', icon: 'maria', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      id: 'take-bottle',
      room: 'staircase',
      on: 'interact',
      area: { col: 33, row: 13, w: 5, h: 3 },
      mark: { col: 35, row: 14 },
      when: { all: [F.Slept], none: [F.BottleTaken] },
      lock: true,
      steps: [
        { do: 'flag', id: F.TraceStairs },
        { do: 'flag', id: F.BottleTaken },
        { do: 'memory', id: 'bottle' },
        { do: 'thought', icon: 'maria', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Le bandeau, posé sur le lit à côté de Céleste à la fin du monde étrange.
      id: 'take-headband',
      room: 'bedroom',
      on: 'interact',
      area: { col: 13, row: 14, w: 4, h: 2 },
      mark: { col: 15, row: 14 },
      when: { all: [F.StrangeDone], none: [F.HeadbandTaken] },
      lock: true,
      steps: [
        { do: 'flag', id: F.HeadbandTaken },
        { do: 'memory', id: 'headband' },
        { do: 'thought', icon: 'maria', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Le bonnet, dans l'herbe à côté de Céleste, au retour de derrière la haie.
      id: 'take-bonnet',
      room: 'garden-tree',
      on: 'interact',
      area: { col: 25, row: 38, w: 4, h: 2 },
      mark: { col: 27, row: 38 },
      when: { all: [F.HedgeDone], none: [F.BonnetTaken] },
      lock: true,
      steps: [
        { do: 'flag', id: F.BonnetTaken },
        { do: 'memory', id: 'bonnet' },
        { do: 'thought', icon: 'maria', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Au matin, papa boit son café : il ne sait pas où est Maria, il console (D-37).
      id: 'morning-dad',
      room: 'kitchen',
      on: 'interact',
      area: { col: 22, row: 14, w: 8, h: 8 },
      mark: { col: 27, row: 13 },
      when: { all: [F.Slept], none: [F.MorningDad, F.MomHug, F.Grown] },
      lock: true,
      steps: [
        { do: 'flag', id: F.MorningDad },
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'question', ms: S.thoughtMs, by: 'dad-kitchen' },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'heart', ms: S.thoughtMs, by: 'dad-kitchen' },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Maman lit sur le canapé, juste sous Maria… et ne la voit pas.
      id: 'morning-mom',
      room: 'living',
      on: 'interact',
      area: { col: 8, row: 14, w: 13, h: 8 },
      mark: { col: 14, row: 13 },
      when: { all: [F.Slept], none: [F.MorningMom, F.DadVisit, F.Grown] },
      lock: true,
      steps: [
        { do: 'flag', id: F.MorningMom },
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'question', ms: S.thoughtMs, by: 'mom-sofa' },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'heart', ms: S.thoughtMs, by: 'mom-sofa' },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Le chat gris regarde le haut de la bibliothèque.
      id: 'cat-pet',
      room: 'living',
      on: 'interact',
      area: { col: 42, row: 19, w: 4, h: 3 },
      mark: { col: 44, row: 19 },
      when: { all: [F.Slept], none: [F.CatPetted] },
      lock: true,
      steps: [
        { do: 'flag', id: F.CatPetted },
        { do: 'thought', icon: 'heart', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Maria aperçue en haut de la bibliothèque, là où une poupée n'a rien à faire.
      id: 'living-see',
      room: 'living',
      on: 'touch',
      area: { col: 38, row: 14, w: 26, h: 8 },
      when: { all: [F.Slept], none: [F.MariaSeen, F.MariaVanished] },
      lock: true,
      steps: [
        { do: 'flag', id: F.MariaSeen },
        { do: 'hush', ms: S.thoughtMs + S.lookMs },
        { do: 'thought', icon: 'maria', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // En haut : un clignement ; dans le noir, Maria n'y est plus et Céleste est passée dans le
      // salon étrange, à la même place (D-34).
      id: 'living-vanish',
      room: 'living',
      on: 'touch',
      area: LIVING_TOP,
      when: { all: [F.Slept], none: [F.MariaVanished] },
      lock: true,
      steps: [
        // L'air scintille autour d'elle (jamais sur elle), tout tremble… puis le noir, en silence.
        { do: 'hush', ms: S.omenPeakMs + S.blinkOutMs + S.blinkBlackMs },
        { do: 'sparkle', area: MARIA_SPOT, ms: S.omenPeakMs + 400 },
        { do: 'shake', ms: S.omenPeakMs, strength: 1 },
        { do: 'wait', ms: S.omenPeakMs },
        { do: 'fadeOut', ms: S.blinkOutMs },
        { do: 'flag', id: F.MariaVanished },
        STRANGE_ARRIVAL,
        { do: 'wait', ms: S.blinkBlackMs },
        // Le monde étrange se révèle autour de Céleste.
        { do: 'fadeIn', ms: S.blinkInMs, shape: 'iris' },
        { do: 'wait', ms: 500 },
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs + 800 },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Après un évanouissement dans le monde étrange (retour au point de retour réel), le haut de
      // la bibliothèque y ramène, tant que la fin n'est pas vécue.
      id: 'living-reenter',
      room: 'living',
      on: 'touch',
      area: LIVING_TOP,
      when: { all: [F.MariaVanished], none: [F.StrangeDone] },
      lock: true,
      steps: [
        { do: 'sparkle', area: MARIA_SPOT, ms: S.reomenPeakMs + 300 },
        { do: 'shake', ms: S.reomenPeakMs, strength: 0.6 },
        { do: 'wait', ms: S.reomenPeakMs },
        { do: 'fadeOut', ms: S.blinkOutMs },
        STRANGE_ARRIVAL,
        { do: 'wait', ms: S.blinkBlackMs },
        { do: 'fadeIn', ms: S.reblinkInMs, shape: 'iris' },
      ],
    },
    {
      // Fin (D-34) : le berceau vide, tout en haut du passage d'ombres. Long fondu : Céleste est
      // assise sur son lit, le bandeau de Maria à côté d'elle. Aucune explication.
      id: 'shadows-cradle',
      room: 'shadows',
      on: 'interact',
      area: { col: 23, row: 3, w: 7, h: 3 },
      mark: { col: 26, row: 4 },
      when: { all: [F.MariaVanished], none: [F.StrangeDone] },
      lock: true,
      steps: [
        // Le berceau scintille, puis le cercle se referme sur Céleste.
        {
          do: 'hush',
          ms: S.cradleSparkleMs + S.nightFadeOutMs + S.nightBlackMs + S.nightFadeInMs + 1200,
        },
        { do: 'sparkle', area: { col: 24, row: 3, w: 5, h: 3 }, ms: S.cradleSparkleMs + 600 },
        { do: 'wait', ms: S.cradleSparkleMs },
        { do: 'fadeOut', ms: S.nightFadeOutMs, shape: 'iris' },
        { do: 'flag', id: F.StrangeDone },
        { do: 'room', room: 'bedroom', col: 12, row: 15, facing: 1, returnPoint: true },
        { do: 'pose', pose: 'sit' },
        { do: 'wait', ms: S.nightBlackMs },
        { do: 'fadeIn', ms: S.nightFadeInMs },
        { do: 'wait', ms: 1200 },
        { do: 'thought', icon: 'maria', ms: S.thoughtMs + 800 },
        { do: 'wait', ms: S.lookMs + 600 },
        // Papa passe la tête par la porte : il s'inquiète, sans rien savoir (D-37).
        { do: 'thought', icon: 'question', ms: S.thoughtMs, by: 'dad-door-end' },
        { do: 'wait', ms: S.thoughtMs + 300 },
        // …et montre maman, en bas (D-58).
        { do: 'thought', icon: 'mom', ms: S.thoughtMs, by: 'dad-door-end' },
        { do: 'wait', ms: S.thoughtMs + 300 },
        { do: 'fadeOut', ms: S.fadeMs },
        { do: 'flag', id: F.DadVisit },
        { do: 'pose', pose: 'stand' },
        { do: 'fadeIn', ms: S.fadeMs },
      ],
    },
    {
      // Après la visite de papa (D-58) : maman, au salon, fait un câlin. Puis la journée passe, la
      // nuit tombe, et Céleste pense à son lit.
      id: 'mom-hug',
      room: 'living',
      on: 'interact',
      area: { col: 8, row: 14, w: 13, h: 8 },
      mark: { col: 14, row: 13 },
      when: { all: [F.DadVisit], none: [F.MomHug] },
      lock: true,
      steps: [
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'heart', ms: S.holdMs, by: 'mom-sofa' },
        { do: 'wait', ms: S.holdMs },
        { do: 'thought', icon: 'heart', ms: S.holdMs },
        { do: 'wait', ms: S.holdMs },
        { do: 'fadeOut', ms: S.nightFadeOutMs },
        { do: 'flag', id: F.MomHug },
        { do: 'wait', ms: S.nightBlackMs },
        { do: 'fadeIn', ms: S.nightFadeInMs },
        { do: 'wait', ms: 800 },
        { do: 'thought', icon: 'bed', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Quelques mois plus tard (D-43) : le soir après le câlin de maman, Céleste se couche. Le noir le
      // plus long ; au retour, elle a grandi (hitbox, saut, tenue) et la toise a un trait de plus.
      // Aucun texte (pilier 6) ; Maria reste introuvable.
      id: 'months-later',
      room: 'bedroom',
      on: 'interact',
      area: { col: 7, row: 13, w: 11, h: 3 },
      mark: { col: 9, row: 14 },
      when: { all: [F.MomHug], none: [F.Grown] },
      lock: true,
      steps: [
        { do: 'pose', pose: 'sit' },
        { do: 'thought', icon: 'maria', ms: S.holdMs },
        { do: 'wait', ms: S.holdMs },
        { do: 'fadeOut', ms: S.nightFadeOutMs },
        { do: 'flag', id: F.Grown },
        { do: 'place', col: 12, row: 15, facing: 1 },
        { do: 'pose', pose: 'sit' },
        { do: 'wait', ms: S.monthsBlackMs },
        { do: 'fadeIn', ms: S.monthsFadeInMs },
        { do: 'wait', ms: 1400 },
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs + 800 },
        { do: 'wait', ms: S.lookMs },
        // Il fait beau : envie de jouer dehors, et d'y chercher Maria (D-46).
        { do: 'thought', icon: 'sun', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // La toise (D-43) : un nouveau trait, plus haut. Souvenir du cahier.
      id: 'look-height',
      room: 'bedroom',
      on: 'interact',
      area: { col: 40, row: 17, w: 5, h: 3 },
      mark: { col: 42, row: 15 },
      when: { all: [F.Grown] },
      lock: true,
      repeat: true,
      steps: [
        { do: 'memory', id: 'height' },
        { do: 'thought', icon: 'height', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Le jardin (D-46) : la première sortie. Il fait beau… et Maria est peut-être dehors.
      id: 'garden-arrive',
      room: 'garden-terrace',
      on: 'touch',
      area: { col: 1, row: 17, w: 5, h: 5 },
      when: { all: [F.Grown], none: [F.GardenArrived] },
      lock: true,
      steps: [
        { do: 'flag', id: F.GardenArrived },
        { do: 'wait', ms: 600 },
        { do: 'thought', icon: 'sun', ms: S.thoughtMs },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'maria', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Maman étend le linge : elle ne sait pas non plus où est Maria, elle console.
      id: 'garden-mom',
      room: 'garden-terrace',
      on: 'interact',
      area: { col: 10, row: 16, w: 10, h: 6 },
      mark: { col: 17, row: 15 },
      when: { all: [F.Grown], none: [F.GardenMom, F.GateOpen] },
      lock: true,
      steps: [
        { do: 'flag', id: F.GardenMom },
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs },
        { do: 'wait', ms: S.thoughtMs },
        // Au jardin, maman ne sait pas non plus, mais encourage : « cherche bien » (D-50).
        { do: 'thought', icon: 'search', ms: S.thoughtMs, by: 'mom-garden' },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'heart', ms: S.thoughtMs, by: 'mom-garden' },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Papa arrose le potager, au pied des bacs.
      id: 'garden-dad',
      room: 'garden-vegetables',
      on: 'interact',
      area: { col: 1, row: 16, w: 8, h: 6 },
      mark: { col: 7, row: 15 },
      when: { all: [F.Grown], none: [F.GardenDad, F.GardenTreehouse] },
      lock: true,
      steps: [
        { do: 'flag', id: F.GardenDad },
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs },
        { do: 'wait', ms: S.thoughtMs },
        // Papa montre, sans rien savoir, la cabane dans l'arbre : un indice (D-50).
        { do: 'thought', icon: 'treehouse', ms: S.thoughtMs, by: 'dad-garden' },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'heart', ms: S.thoughtMs, by: 'dad-garden' },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Après le bonnet (D-60), papa montre le portillon au bout de l'allée : la suite.
      id: 'garden-dad-gate',
      room: 'garden-vegetables',
      on: 'interact',
      area: { col: 1, row: 16, w: 8, h: 6 },
      mark: { col: 7, row: 15 },
      when: { all: [F.HedgeDone], none: [F.GardenDadGate, F.GateOpen] },
      lock: true,
      steps: [
        { do: 'flag', id: F.GardenDadGate },
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'gate', ms: S.thoughtMs, by: 'dad-garden' },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'heart', ms: S.thoughtMs, by: 'dad-garden' },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // La chevillette (D-60), pendue haut dans la cheminée de l'allée : on l'atteint en saut
      // mural, après le bonnet. Tirée, elle ouvre le portillon au bout du passage.
      id: 'gate-cord',
      room: 'garden-alley',
      on: 'interact',
      area: { col: 31, row: 15, w: 3, h: 3 },
      mark: { col: 32, row: 15 },
      when: { all: [F.HedgeDone], none: [F.GateOpen] },
      lock: true,
      steps: [
        { do: 'flag', id: F.GateOpen },
        { do: 'thought', icon: 'gate', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Une fois le saut mural trouvé (D-55), papa montre la haie au fond du jardin : le trou qui
      // scintille, la suite. Toujours sans rien savoir de Maria.
      id: 'garden-dad-hedge',
      room: 'garden-vegetables',
      on: 'interact',
      area: { col: 1, row: 16, w: 8, h: 6 },
      mark: { col: 7, row: 15 },
      when: { all: [F.Grown, F.GardenTreehouse], none: [F.GardenDadHedge, F.HedgeEntered] },
      lock: true,
      steps: [
        { do: 'flag', id: F.GardenDadHedge },
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'hedge', ms: S.thoughtMs, by: 'dad-garden' },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'heart', ms: S.thoughtMs, by: 'dad-garden' },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Au fond du jardin, un creux sombre dans la haie, trop serré pour passer ; quelque chose
      // y scintille, une fois (pour plus tard, §25.3). Aucune explication.
      id: 'garden-hedge',
      room: 'garden-tree',
      on: 'touch',
      area: { col: 36, row: 36, w: 8, h: 4 },
      when: { none: [F.GardenHedge] },
      lock: true,
      steps: [
        { do: 'flag', id: F.GardenHedge },
        { do: 'sparkle', area: { col: 40, row: 37, w: 4, h: 3 }, ms: 2000 },
        { do: 'wait', ms: S.lookMs },
        { do: 'thought', icon: 'question', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // La cabane dans l'arbre (D-46) : Céleste y trouve le saut mural, et pense à Maria.
      id: 'treehouse-find',
      room: 'garden-treehouse',
      on: 'touch',
      area: { col: 12, row: 9, w: 4, h: 3 },
      when: { none: [F.GardenTreehouse] },
      lock: false,
      steps: [
        { do: 'flag', id: F.GardenTreehouse },
        { do: 'thought', icon: 'maria', ms: S.thoughtMs },
      ],
    },
    {
      // Derrière la haie (D-49) : une fois le saut mural trouvé, le trou de la haie scintille et
      // attire Céleste. Agir : un clignement dans le noir, et le jardin renversé se révèle.
      id: 'hedge-enter',
      room: 'garden-tree',
      on: 'interact',
      area: HEDGE_HOLE,
      mark: { col: 41, row: 36 },
      when: { all: [F.GardenTreehouse], none: [F.HedgeEntered] },
      lock: true,
      steps: [
        { do: 'hush', ms: S.omenPeakMs + S.blinkOutMs + S.blinkBlackMs },
        { do: 'sparkle', area: { col: 39, row: 37, w: 5, h: 3 }, ms: S.omenPeakMs + 400 },
        { do: 'shake', ms: S.omenPeakMs, strength: 1 },
        { do: 'wait', ms: S.omenPeakMs },
        { do: 'fadeOut', ms: S.blinkOutMs },
        { do: 'flag', id: F.HedgeEntered },
        HEDGE_ARRIVAL,
        { do: 'wait', ms: S.blinkBlackMs },
        { do: 'fadeIn', ms: S.blinkInMs, shape: 'iris' },
        { do: 'wait', ms: 500 },
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs + 800 },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Après un évanouissement (avant la veilleuse turquoise) : le trou y ramène, plus vite.
      id: 'hedge-reenter',
      room: 'garden-tree',
      on: 'interact',
      area: HEDGE_HOLE,
      mark: { col: 41, row: 36 },
      when: { all: [F.HedgeEntered], none: [F.HedgeDone] },
      lock: true,
      steps: [
        { do: 'sparkle', area: { col: 39, row: 37, w: 5, h: 3 }, ms: S.reomenPeakMs + 300 },
        { do: 'shake', ms: S.reomenPeakMs, strength: 0.6 },
        { do: 'wait', ms: S.reomenPeakMs },
        { do: 'fadeOut', ms: S.blinkOutMs },
        HEDGE_ARRIVAL,
        { do: 'wait', ms: S.blinkBlackMs },
        { do: 'fadeIn', ms: S.reblinkInMs, shape: 'iris' },
      ],
    },
    {
      // Fin (D-49) : au bout de la ronce, le bonnet de Maria. Le cercle se referme ; Céleste est au
      // pied du grand arbre, et le bonnet est accroché à une branche. Aucune explication.
      id: 'thorns-bonnet',
      room: 'garden-thorns',
      on: 'interact',
      area: { col: 18, row: 5, w: 9, h: 3 },
      mark: { col: 24, row: 5 },
      when: { all: [F.HedgeEntered], none: [F.HedgeDone] },
      lock: true,
      steps: [
        {
          do: 'hush',
          ms: S.cradleSparkleMs + S.nightFadeOutMs + S.nightBlackMs + S.nightFadeInMs + 1200,
        },
        { do: 'sparkle', area: { col: 22, row: 5, w: 5, h: 3 }, ms: S.cradleSparkleMs + 600 },
        { do: 'wait', ms: S.cradleSparkleMs },
        { do: 'fadeOut', ms: S.nightFadeOutMs, shape: 'iris' },
        { do: 'flag', id: F.HedgeDone },
        { do: 'room', room: 'garden-tree', col: 29, row: 39, facing: -1, returnPoint: true },
        // Assise dans l'herbe, comme au réveil (D-58) ; elle se relève dès qu'on la fait bouger.
        { do: 'pose', pose: 'sit' },
        { do: 'wait', ms: S.nightBlackMs },
        { do: 'fadeIn', ms: S.nightFadeInMs },
        { do: 'wait', ms: 1200 },
        { do: 'thought', icon: 'maria', ms: S.thoughtMs + 800 },
        { do: 'wait', ms: S.lookMs + 600 },
      ],
    },
    // La rue (D-60) : la palissade du chantier est la porte de façade 6 (fermée tant que ce n'est
    // pas le lendemain de l'école étrange, D-64), qui mène à la gare (D-66). L'aire de jeux, la
    // supérette et l'école ont aussi leur porte de façade.
    {
      // Le lendemain matin (D-64), maman montre la grue du chantier : c'est là qu'il faut aller.
      id: 'street-mom-crane',
      room: 'playground',
      on: 'interact',
      area: { col: 6, row: 22, w: 8, h: 6 },
      mark: { col: 10, row: 20 },
      when: { all: [F.StreetMorning], none: [F.StreetMomCrane] },
      lock: true,
      steps: [
        { do: 'flag', id: F.StreetMomCrane },
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'crane', ms: S.thoughtMs, by: 'mom-bench' },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'heart', ms: S.thoughtMs, by: 'mom-bench' },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // L'école (D-64) : la porte qui donne sur la rue se pousse de l'intérieur (un raccourci).
      id: 'school-door',
      room: 'school',
      on: 'interact',
      area: { col: 1, row: 18, w: 4, h: 4 },
      mark: { col: 2, row: 17 },
      when: { none: [F.SchoolOpen] },
      lock: true,
      steps: [
        { do: 'flag', id: F.SchoolOpen },
        { do: 'sparkle', area: { col: 0, row: 18, w: 2, h: 4 }, ms: S.lookMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // L'école étrange (D-64) : en haut des étagères de la classe, sous l'oculus, l'air scintille.
      // Agir : un clignement dans le noir, et la classe se révèle en silhouettes, autour de Céleste.
      id: 'school-enter',
      room: 'school',
      on: 'interact',
      area: SCHOOL_SHELF,
      mark: { col: 46, row: 9 },
      when: { none: [F.SchoolStrange] },
      lock: true,
      steps: [
        { do: 'sparkle', area: { col: 44, row: 5, w: 5, h: 5 }, ms: S.omenPeakMs + 400 },
        { do: 'shake', ms: S.omenPeakMs, strength: 1 },
        { do: 'wait', ms: S.omenPeakMs },
        { do: 'fadeOut', ms: S.blinkOutMs },
        { do: 'flag', id: F.SchoolStrange },
        SCHOOL_ARRIVAL,
        { do: 'wait', ms: S.blinkBlackMs },
        { do: 'fadeIn', ms: S.blinkInMs, shape: 'iris' },
        { do: 'wait', ms: 500 },
        // Pas de Maria ici : seulement la question (D-61, option B).
        { do: 'thought', icon: 'question', ms: S.thoughtMs + 800 },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Après un évanouissement (avant la première veilleuse) : l'oculus y ramène, plus vite.
      id: 'school-reenter',
      room: 'school',
      on: 'interact',
      area: SCHOOL_SHELF,
      mark: { col: 46, row: 9 },
      when: { all: [F.SchoolStrange], none: [F.SchoolDone] },
      lock: true,
      steps: [
        { do: 'sparkle', area: { col: 44, row: 5, w: 5, h: 5 }, ms: S.reomenPeakMs + 300 },
        { do: 'shake', ms: S.reomenPeakMs, strength: 0.6 },
        { do: 'wait', ms: S.reomenPeakMs },
        { do: 'fadeOut', ms: S.blinkOutMs },
        SCHOOL_ARRIVAL,
        { do: 'wait', ms: S.blinkBlackMs },
        { do: 'fadeIn', ms: S.reblinkInMs, shape: 'iris' },
      ],
    },
    {
      // Fin de l'école étrange (D-64) : la boîte à formes, sur le couvercle géant. Céleste la
      // regarde (un trou a la forme de Maria) : elle devient un souvenir de la rubrique « Monde
      // étrange » ; on ne la ramasse pas. Le cercle se referme ; Céleste est assise dans la cour, au
      // crépuscule ; maman vient la chercher. La nuit, dans sa chambre, une lueur au loin.
      id: 'school-box',
      room: 'school-strange',
      on: 'interact',
      area: { col: 10, row: 5, w: 7, h: 3 },
      mark: { col: 13, row: 4 },
      when: { all: [F.SchoolStrange], none: [F.SchoolDone] },
      lock: true,
      steps: [
        {
          do: 'hush',
          ms: S.cradleSparkleMs + S.holdMs + S.nightFadeOutMs + S.nightBlackMs + S.nightFadeInMs,
        },
        { do: 'memory', id: 'shape-box' },
        { do: 'sparkle', area: { col: 11, row: 5, w: 5, h: 3 }, ms: S.cradleSparkleMs + 600 },
        { do: 'wait', ms: S.cradleSparkleMs },
        { do: 'thought', icon: 'maria', ms: S.holdMs },
        { do: 'wait', ms: S.holdMs },
        { do: 'fadeOut', ms: S.nightFadeOutMs, shape: 'iris' },
        { do: 'flag', id: F.SchoolDone },
        { do: 'room', room: 'schoolyard', col: 12, row: 23, facing: 1, returnPoint: true },
        { do: 'pose', pose: 'sit' },
        { do: 'wait', ms: S.nightBlackMs },
        { do: 'fadeIn', ms: S.nightFadeInMs },
        { do: 'wait', ms: 1200 },
        { do: 'thought', icon: 'maria', ms: S.thoughtMs },
        { do: 'wait', ms: S.thoughtMs + 300 },
        // Maman est venue la chercher, à hauteur d'enfant : un cœur.
        { do: 'thought', icon: 'heart', ms: S.holdMs, by: 'mom-yard' },
        { do: 'wait', ms: S.holdMs },
        { do: 'thought', icon: 'heart', ms: S.holdMs },
        { do: 'wait', ms: S.holdMs },
        // La nuit, dans sa chambre : par la fenêtre, au loin, une lueur au bout de la grue.
        { do: 'fadeOut', ms: S.nightFadeOutMs },
        { do: 'room', room: 'bedroom', col: 12, row: 15, facing: 1, returnPoint: true },
        { do: 'pose', pose: 'sit' },
        { do: 'wait', ms: S.nightBlackMs },
        { do: 'fadeIn', ms: S.nightFadeInMs },
        { do: 'wait', ms: 900 },
        { do: 'sparkle', area: { col: 28, row: 5, w: 3, h: 3 }, ms: S.cradleSparkleMs + 1000 },
        { do: 'wait', ms: S.cradleSparkleMs },
        { do: 'thought', icon: 'crane', ms: S.thoughtMs + 800 },
        { do: 'wait', ms: S.thoughtMs + 800 },
        { do: 'thought', icon: 'bed', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Le lendemain (D-64) : se coucher fait passer la nuit. Au réveil, Céleste pense à la grue.
      id: 'street-night',
      room: 'bedroom',
      on: 'interact',
      area: { col: 7, row: 13, w: 11, h: 3 },
      mark: { col: 9, row: 14 },
      when: { all: [F.SchoolDone], none: [F.StreetMorning] },
      lock: true,
      steps: [
        { do: 'pose', pose: 'sit' },
        { do: 'thought', icon: 'maria', ms: S.holdMs },
        { do: 'wait', ms: S.holdMs },
        { do: 'fadeOut', ms: S.nightFadeOutMs },
        { do: 'flag', id: F.StreetMorning },
        { do: 'place', col: 12, row: 15, facing: 1 },
        { do: 'pose', pose: 'sit' },
        { do: 'wait', ms: S.nightBlackMs },
        { do: 'fadeIn', ms: S.nightFadeInMs },
        { do: 'wait', ms: 1400 },
        { do: 'thought', icon: 'crane', ms: S.thoughtMs + 800 },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // À l'aire de jeux (D-61), maman sur un banc : elle ne sait pas non plus où est Maria ; elle
      // montre papa, parti faire les courses à la supérette (D-63), puis un cœur.
      id: 'street-mom',
      room: 'playground',
      on: 'interact',
      area: { col: 6, row: 22, w: 8, h: 6 },
      mark: { col: 10, row: 20 },
      when: { all: [F.GateOpen], none: [F.StreetMom, F.StreetMorning] },
      lock: true,
      steps: [
        { do: 'flag', id: F.StreetMom },
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'dad', ms: S.thoughtMs, by: 'mom-bench' },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'heart', ms: S.thoughtMs, by: 'mom-bench' },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // À la supérette (D-63), papa fait les courses. Il ne sait pas non plus où est Maria ; sans
      // rien savoir, il montre la grue du chantier (le parapluie y est coincé), puis un cœur.
      id: 'street-dad',
      room: 'shop',
      on: 'interact',
      area: { col: 4, row: 16, w: 7, h: 6 },
      mark: { col: 7, row: 14 },
      when: { all: [F.GateOpen], none: [F.StreetDad] },
      lock: true,
      steps: [
        { do: 'flag', id: F.StreetDad },
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'crane', ms: S.thoughtMs, by: 'dad-shop' },
        { do: 'wait', ms: S.thoughtMs },
        { do: 'thought', icon: 'heart', ms: S.thoughtMs, by: 'dad-shop' },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    // Objets à regarder (D-38) : la première fois, ils deviennent des souvenirs du cahier ; on
    // peut les regarder autant qu'on veut.
    {
      id: 'look-photo',
      room: 'living',
      on: 'interact',
      area: { col: 12, row: 10, w: 5, h: 12 },
      mark: { col: 14, row: 7 },
      when: {},
      lock: true,
      repeat: true,
      steps: [
        { do: 'memory', id: 'photo' },
        { do: 'thought', icon: 'family', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      id: 'look-drawing',
      room: 'bedroom',
      on: 'interact',
      area: { col: 36, row: 8, w: 5, h: 12 },
      mark: { col: 38, row: 4 },
      when: {},
      lock: true,
      repeat: true,
      steps: [
        { do: 'memory', id: 'drawing' },
        { do: 'thought', icon: 'drawing', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      id: 'look-music-box',
      room: 'bedroom',
      on: 'interact',
      area: { col: 10, row: 10, w: 5, h: 3 },
      mark: { col: 12, row: 10 },
      when: {},
      lock: true,
      repeat: true,
      steps: [
        { do: 'memory', id: 'music-box' },
        { do: 'thought', icon: 'music', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      id: 'look-plant',
      room: 'kitchen',
      on: 'interact',
      area: { col: 49, row: 13, w: 6, h: 4 },
      mark: { col: 52, row: 13 },
      when: {},
      lock: true,
      repeat: true,
      steps: [
        { do: 'memory', id: 'plant' },
        { do: 'thought', icon: 'flower', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      // Souvenir en haut de la bibliothèque (D-39) : une raison de revenir au salon.
      id: 'look-baby-photo',
      room: 'living',
      on: 'interact',
      area: LIVING_TOP,
      mark: { col: 51, row: 6 },
      when: { all: [F.StrangeDone] },
      lock: true,
      repeat: true,
      steps: [
        { do: 'memory', id: 'bookcase' },
        { do: 'thought', icon: 'baby', ms: S.thoughtMs + 800 },
        { do: 'wait', ms: S.lookMs + 400 },
      ],
    },
    // La gare (D-66).
    ...STATION_STORY.triggers,
  ],
  props: [
    // La toise de la chambre (D-43), au mur près de la porte.
    {
      id: 'height-chart',
      room: 'bedroom',
      kind: 'height-chart',
      col: 42,
      row: 19,
      when: { none: [F.Grown] },
    },
    {
      id: 'height-chart-grown',
      room: 'bedroom',
      kind: 'height-chart-grown',
      col: 42,
      row: 19,
      when: { all: [F.Grown] },
    },
    {
      id: 'maria-rug',
      room: 'bedroom',
      kind: 'maria-sit',
      col: 19,
      row: 19,
      when: { none: [F.EveningTucked] },
    },
    {
      id: 'cradle',
      room: 'bedroom',
      kind: 'cradle',
      col: 23,
      row: 17,
      when: { none: [F.EveningTucked] },
    },
    {
      id: 'cradle-maria',
      room: 'bedroom',
      kind: 'cradle-maria',
      col: 23,
      row: 17,
      when: { all: [F.EveningTucked], none: [F.Slept] },
    },
    {
      id: 'cradle-undone',
      room: 'bedroom',
      kind: 'cradle-undone',
      col: 23,
      row: 17,
      when: { all: [F.Slept] },
    },
    {
      id: 'blanket',
      room: 'bedroom',
      kind: 'blanket',
      col: 33,
      row: 11,
      instant: true,
      when: { all: [F.EveningPlayed], none: [F.EveningBlanket] },
    },
    {
      id: 'slipper',
      room: 'hall',
      kind: 'slipper',
      col: 24,
      row: 15,
      instant: true,
      when: { all: [F.Slept], none: [F.SlipperTaken] },
    },
    {
      id: 'bottle',
      room: 'staircase',
      kind: 'bottle',
      col: 35,
      row: 15,
      flip: true,
      instant: true,
      when: { all: [F.Slept], none: [F.BottleTaken] },
    },
    {
      id: 'maria-bookcase',
      room: 'living',
      kind: 'maria-sit',
      col: 51,
      row: 8,
      when: { all: [F.Slept], none: [F.MariaVanished] },
    },
    {
      // Aperçue de l'autre côté du vide, hors d'atteinte ; elle est là dès l'entrée et ne bouge
      // jamais (pilier 5).
      id: 'maria-shadows',
      room: 'shadows',
      kind: 'maria-sit',
      col: 4,
      row: 19,
      when: { none: [F.StrangeDone] },
    },
    { id: 'cradle-shadows', room: 'shadows', kind: 'cradle', col: 26, row: 5, when: {} },
    // La famille (D-37) : papa à la porte le soir, maman au bord du lit ; au matin, papa à la
    // cuisine, maman au salon. Le chat gris dort sur le tabouret, puis regarde la bibliothèque.
    {
      id: 'dad-door',
      room: 'bedroom',
      kind: 'dad-door',
      col: 43,
      row: 19,
      flip: true,
      when: { none: [F.EveningGoodnight, F.Slept] },
    },
    {
      id: 'mom-bed',
      room: 'bedroom',
      kind: 'mom-bed',
      col: 16,
      row: 15,
      flip: true,
      when: { all: [F.EveningGoodnight], none: [F.Slept] },
    },
    {
      id: 'cat-sleep',
      room: 'bedroom',
      kind: 'cat-sleep',
      col: 27,
      row: 16,
      when: { none: [F.Slept] },
    },
    {
      id: 'dad-door-end',
      room: 'bedroom',
      kind: 'dad-door',
      col: 43,
      row: 19,
      flip: true,
      when: { all: [F.StrangeDone], none: [F.DadVisit] },
    },
    {
      id: 'dad-kitchen',
      room: 'kitchen',
      kind: 'dad-kitchen',
      col: 26,
      row: 21,
      // Quelques mois plus tard, les parents sont au jardin (D-46). La nuit du câlin, ils ne sont
      // plus en bas (D-58).
      when: { all: [F.Slept], none: [F.MomHug, F.Grown] },
    },
    // Maman est assise dans le canapé, entre les accoudoirs (D-39).
    {
      id: 'mom-sofa',
      room: 'living',
      kind: 'mom-sofa',
      col: 14,
      row: 19,
      when: { all: [F.Slept], none: [F.MomHug, F.Grown] },
    },
    // Après le monde étrange, là où Maria était assise : une photo de Céleste bébé avec Maria.
    {
      id: 'baby-photo',
      room: 'living',
      kind: 'baby-photo',
      col: 51,
      row: 8,
      when: { all: [F.StrangeDone] },
    },
    { id: 'cat-sit', room: 'living', kind: 'cat-sit', col: 44, row: 21, when: { all: [F.Slept] } },
    { id: 'music-box', room: 'bedroom', kind: 'music-box', col: 12, row: 12, when: {} },
    { id: 'plant', room: 'kitchen', kind: 'plant', col: 52, row: 16, when: {} },
    // Derrière la haie (D-49) : Maria de l'autre côté du vide, hors d'atteinte ; elle est là dès
    // l'arrivée dans la ronce et ne bouge jamais (pilier 5). Le bonnet, au bout du chemin, puis
    // accroché à une branche du grand arbre.
    {
      id: 'maria-thorns',
      room: 'garden-thorns',
      kind: 'maria-sit',
      col: 41,
      row: 3,
      when: { none: [F.HedgeDone] },
    },
    {
      id: 'bonnet-thorns',
      room: 'garden-thorns',
      kind: 'bonnet',
      col: 24,
      row: 7,
      when: { none: [F.HedgeDone] },
    },
    // Le portillon au bout du passage sous le vieux mur (D-60), ouvert par la chevillette.
    {
      id: 'gate',
      room: 'garden-alley',
      kind: 'gate',
      col: 54,
      row: 23,
      instant: true,
      when: { none: [F.GateOpen] },
    },
    {
      id: 'gate-open',
      room: 'garden-alley',
      kind: 'gate-open',
      col: 54,
      row: 23,
      instant: true,
      when: { all: [F.GateOpen] },
    },
    {
      id: 'bonnet-grass',
      room: 'garden-tree',
      kind: 'bonnet',
      col: 27,
      row: 39,
      instant: true,
      when: { all: [F.HedgeDone], none: [F.BonnetTaken] },
    },
    // Au jardin (D-46) : maman étend le linge sur la terrasse, papa arrose le potager, loin des
    // araignées (pas d'ennemi près d'un adulte, D-39).
    {
      // Une fois le portillon ouvert, maman n'étend plus le linge : elle attend Céleste à l'aire
      // de jeux (D-61). Elle change de place hors de la vue (règle des objets de mise en scène).
      id: 'mom-garden',
      room: 'garden-terrace',
      kind: 'mom-garden',
      col: 15,
      row: 21,
      when: { all: [F.Grown], none: [F.GateOpen] },
    },
    {
      id: 'mom-bench',
      room: 'playground',
      kind: 'mom-bench',
      col: 10,
      row: 26,
      when: { all: [F.GateOpen] },
    },
    {
      id: 'dad-garden',
      room: 'garden-vegetables',
      kind: 'dad-garden',
      col: 5,
      row: 21,
      // Une fois le portillon ouvert, papa part faire les courses à la supérette (D-63).
      when: { all: [F.Grown], none: [F.GateOpen] },
    },
    {
      // Maman vient chercher Céleste dans la cour, au crépuscule (D-64).
      id: 'mom-yard',
      room: 'schoolyard',
      kind: 'mom-yard',
      col: 16,
      row: 23,
      flip: true,
      when: { all: [F.SchoolDone], none: [F.StreetMorning] },
    },
    // La boîte à formes reste dans le monde étrange (D-64) : on ne la ramasse pas.
    { id: 'shape-box', room: 'school-strange', kind: 'shape-box', col: 13, row: 7, when: {} },
    {
      // La nuit, par la fenêtre de la chambre : la grue au loin, une lueur au bout de la flèche.
      id: 'far-crane',
      room: 'bedroom',
      kind: 'far-crane',
      col: 28,
      row: 8,
      when: { all: [F.SchoolDone], none: [F.StreetMorning] },
    },
    {
      // Le lendemain, la palissade du chantier est ouverte : la porte de la gare (D-66).
      id: 'site-gap',
      room: 'street',
      kind: 'site-gap',
      col: 167,
      row: 27,
      when: { all: [F.StreetMorning] },
    },
    {
      id: 'dad-shop',
      room: 'shop',
      kind: 'dad-shop',
      col: 7,
      row: 21,
      when: { all: [F.GateOpen] },
    },
    {
      id: 'headband',
      room: 'bedroom',
      kind: 'headband',
      col: 15,
      row: 15,
      instant: true,
      when: { all: [F.StrangeDone], none: [F.HeadbandTaken] },
    },
  ],
  // La nuit après le câlin de maman (D-58), puis le matin quelques mois plus tard.
  times: [
    // Le crépuscule puis la nuit, après l'école étrange (D-64), jusqu'au lendemain matin.
    { when: { all: [F.SchoolDone], none: [F.StreetMorning] }, time: 'evening' },
    { when: { all: [F.MomHug], none: [F.Grown] }, time: 'evening' },
    { when: { all: [F.Slept] }, time: 'morning' },
  ],
  lockedRooms: [
    { room: 'bedroom', when: { none: [F.Slept] }, speaker: 'dad-door' },
    // La porte de derrière (D-46) : la poignée est trop haute tant que Céleste n'a pas grandi.
    { room: 'laundry', exit: 3, when: { none: [F.Grown] }, icon: 'handle' },
    // Le portillon (D-60) : fermé tant que la chevillette n'est pas tirée.
    { room: 'garden-alley', exit: 3, when: { none: [F.GateOpen] }, icon: 'gate' },
    // La palissade du chantier (D-64, D-66) : ouverte le lendemain de l'école étrange (la gare).
    { room: 'street', exit: 6, when: { none: [F.StreetMorning] }, icon: 'question' },
    // La porte de l'école (D-64) : elle ne s'ouvre que de l'intérieur.
    { room: 'street', exit: 5, when: { none: [F.SchoolOpen] }, icon: 'question' },
    { room: 'school', exit: 1, when: { none: [F.SchoolOpen] }, icon: 'question' },
    // La nuit après l'école étrange (D-64) : c'est l'heure de dormir.
    { room: 'bedroom', when: { all: [F.SchoolDone], none: [F.StreetMorning] }, icon: 'bed' },
  ],
  omens: [
    // L'oculus de l'école (D-64) : en montant les étagères, tant que la fin n'est pas vécue.
    { room: 'school', when: { none: [F.SchoolDone] }, col: 46, row: 7, radius: 10 },
    // Le lendemain, près de la palissade ouverte du chantier : la suite (jusqu'à la gare, D-66).
    {
      room: 'street',
      when: { all: [F.StreetMorning], none: [F.StationArrived] },
      col: 167,
      row: 26,
      radius: 12,
    },
    // Derrière la haie (D-49) : en approchant du trou, une fois le saut mural trouvé.
    {
      room: 'garden-tree',
      when: { all: [F.GardenTreehouse], none: [F.HedgeDone] },
      col: 41,
      row: 38,
      radius: 12,
    },
    // En approchant de Maria (en grimpant la bibliothèque), la lumière vacille, les couleurs se
    // refroidissent, puis tout tremble ; rien à l'autre bout de la pièce (D-40).
    {
      room: 'living',
      when: { all: [F.Slept], none: [F.StrangeDone] },
      col: 51,
      row: 8,
      radius: 13,
    },
    // La gare (D-66).
    ...STATION_STORY.omens,
  ],
};
