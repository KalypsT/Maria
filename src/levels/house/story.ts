import { STORY_TIMING as S, StoryFlag as F } from '../../config/story';
import type { StoryData } from '../../core/story/story';

/**
 * Histoire de la maison (§5.2, D-31), PLACEHOLDER : le soir, Céleste joue avec Maria, la couche
 * dans son berceau, puis se couche ; au matin, Maria n'est plus là et des traces mènent vers le
 * rez-de-chaussée. Maria ne change de place que dans le noir d'un fondu (pilier 5).
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
        { do: 'thought', icon: 'heart', ms: S.holdMs + 300 },
        { do: 'wait', ms: S.holdMs },
        { do: 'pose', pose: 'stand' },
        { do: 'thought', icon: 'cradle', ms: S.thoughtMs },
      ],
    },
    {
      // Coucher Maria : Céleste la porte au berceau pendant le noir (on ne la voit jamais bouger).
      id: 'evening-tuck',
      room: 'bedroom',
      on: 'interact',
      area: { col: 18, row: 17, w: 4, h: 3 },
      mark: { col: 19, row: 18 },
      when: { all: [F.EveningPlayed], none: [F.EveningTucked] },
      lock: true,
      steps: [
        { do: 'fadeOut', ms: S.fadeMs },
        { do: 'flag', id: F.EveningTucked },
        { do: 'place', col: 25, row: 17, facing: -1 },
        { do: 'fadeIn', ms: S.fadeMs },
        { do: 'wait', ms: 400 },
        { do: 'thought', icon: 'bed', ms: S.thoughtMs },
      ],
    },
    {
      id: 'evening-sleep',
      room: 'bedroom',
      on: 'interact',
      area: { col: 7, row: 13, w: 11, h: 3 },
      mark: { col: 9, row: 14 },
      when: { all: [F.EveningTucked], none: [F.Slept] },
      lock: true,
      steps: [
        { do: 'fadeOut', ms: S.nightFadeOutMs },
        { do: 'flag', id: F.Slept },
        { do: 'place', col: 12, row: 15, facing: 1 },
        { do: 'pose', pose: 'sit' },
        { do: 'wait', ms: S.nightBlackMs },
        { do: 'fadeIn', ms: S.nightFadeInMs },
        { do: 'wait', ms: 400 },
        { do: 'thought', icon: 'maria-missing', ms: S.thoughtMs + 600 },
        { do: 'wait', ms: 900 },
      ],
    },
    {
      id: 'trace-hall',
      room: 'hall',
      on: 'touch',
      area: { col: 21, row: 12, w: 7, h: 4 },
      when: { all: [F.Slept], none: [F.TraceHall] },
      lock: false,
      steps: [
        { do: 'flag', id: F.TraceHall },
        { do: 'thought', icon: 'maria', ms: S.thoughtMs },
      ],
    },
    {
      id: 'trace-stairs',
      room: 'staircase',
      on: 'touch',
      area: { col: 32, row: 12, w: 6, h: 4 },
      when: { all: [F.Slept], none: [F.TraceStairs] },
      lock: false,
      steps: [
        { do: 'flag', id: F.TraceStairs },
        { do: 'thought', icon: 'maria', ms: S.thoughtMs },
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
  ],
  times: [{ when: { all: [F.Slept] }, time: 'morning' }],
  lockedRooms: [{ room: 'bedroom', when: { none: [F.Slept] } }],
};
