import { STORY_TIMING as S, StoryFlag as F } from '../../config/story';
import type { StoryData, StoryStep, TileArea } from '../../core/story/story';

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
        { do: 'place', col: 12, row: 15, facing: 1 },
        { do: 'pose', pose: 'sit' },
        { do: 'wait', ms: S.nightBlackMs },
        { do: 'fadeIn', ms: S.nightFadeInMs },
        { do: 'wait', ms: 1200 },
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs + 1500 },
        { do: 'wait', ms: 2000 },
      ],
    },
    {
      id: 'trace-hall',
      room: 'hall',
      on: 'touch',
      area: { col: 21, row: 12, w: 7, h: 4 },
      when: { all: [F.Slept], none: [F.TraceHall] },
      lock: true,
      steps: [
        { do: 'flag', id: F.TraceHall },
        { do: 'thought', icon: 'maria', ms: S.thoughtMs },
        { do: 'wait', ms: S.lookMs },
      ],
    },
    {
      id: 'trace-stairs',
      room: 'staircase',
      on: 'touch',
      area: { col: 32, row: 12, w: 6, h: 4 },
      when: { all: [F.Slept], none: [F.TraceStairs] },
      lock: true,
      steps: [
        { do: 'flag', id: F.TraceStairs },
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
      when: { all: [F.Slept], none: [F.MorningDad] },
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
      area: { col: 7, row: 13, w: 11, h: 9 },
      mark: { col: 14, row: 12 },
      when: { all: [F.Slept], none: [F.MorningMom] },
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
        // L'air scintille autour d'elle (jamais sur elle), tout tremble… puis le noir.
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
        { do: 'fadeOut', ms: S.fadeMs },
        { do: 'flag', id: F.DadVisit },
        { do: 'pose', pose: 'stand' },
        { do: 'fadeIn', ms: S.fadeMs },
      ],
    },
  ],
  props: [
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
    { id: 'slipper', room: 'hall', kind: 'slipper', col: 24, row: 15, when: { all: [F.Slept] } },
    {
      id: 'bottle',
      room: 'staircase',
      kind: 'bottle',
      col: 35,
      row: 15,
      flip: true,
      when: { all: [F.Slept] },
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
      when: { all: [F.Slept] },
    },
    {
      id: 'mom-sofa',
      room: 'living',
      kind: 'mom-sofa',
      col: 12,
      row: 18,
      when: { all: [F.Slept] },
    },
    { id: 'cat-sit', room: 'living', kind: 'cat-sit', col: 44, row: 21, when: { all: [F.Slept] } },
    {
      id: 'headband',
      room: 'bedroom',
      kind: 'headband',
      col: 15,
      row: 15,
      when: { all: [F.StrangeDone] },
    },
  ],
  times: [{ when: { all: [F.Slept] }, time: 'morning' }],
  lockedRooms: [{ room: 'bedroom', when: { none: [F.Slept] }, speaker: 'dad-door' }],
  omens: [
    // En grimpant vers Maria, la lumière vacille, les couleurs se refroidissent, puis tout tremble.
    { room: 'living', when: { all: [F.Slept], none: [F.StrangeDone] }, fromRow: 21, toRow: 8 },
  ],
};
