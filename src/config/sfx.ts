import type { Surface } from './surfaces';

/**
 * Bruitages (D-126). Les sons sont des fichiers déposés dans `src/assets/sfx/`, nommés d'après
 * leur emplacement, avec un numéro par variante (`step-wood-1.m4a`, `step-wood-2.m4a`…) : une
 * variante est tirée au hasard à chaque fois, jamais deux fois de suite la même. Un emplacement
 * sans fichier reste silencieux (dans le build de debug, un son de test peut le remplacer). Liste
 * des sons à fournir : `docs/BRUITAGES.md`. Valeurs PROVISOIRES, à régler sur téléphone.
 */
export const SFX_SLOTS = [
  // Pas, selon la matière du sol (D-125).
  'step-wood',
  'step-fabric',
  'step-grass',
  'step-stone',
  'step-sand',
  'step-metal',
  'step-leaves',
  /** Le décollage d'un saut (un froissement, un petit souffle). */
  'jump',
  /** Une réception ordinaire, par-dessus le pas de la matière du sol. */
  'land',
  /** La réception d'une grande chute. */
  'land-big',
  /** Céleste touchée : une piqûre, un coup, le poursuivant (jamais un cri). */
  'hurt',
  /** Chute dans l'eau (D-97). */
  'splash',
  /** Une veilleuse s'allume (checkpoint, D-21). */
  'checkpoint',
  /** La page du cahier s'ouvre et se referme (la carte, D-30). */
  'map-open',
  'map-close',
  // Capacités (D-127).
  /** Les mains attrapent un rebord ; Céleste se hisse (D-26). */
  'ledge-grab',
  'ledge-climb',
  /** Glisse contre un mur (boucle) ; le saut mural (D-44). */
  'wall-slide',
  'wall-jump',
  /** Le parapluie s'ouvre et se referme (D-62). */
  'umbrella-open',
  'umbrella-close',
  /** Le crochet attrape un câble ; Céleste glisse le long (boucle, D-65). */
  'hook-catch',
  'cable-slide',
  /** La glissade au sol (D-84). */
  'slide',
  /** La bascule entre les deux couches (D-107). */
  'shift',
  // Combat (D-20).
  /** Le coup de bâton ; le bâton touche ; un ennemi se disperse. */
  'attack',
  'hit',
  'enemy-scatter',
  // Dangers et poursuites.
  /** Un poursuivant s'éveille ; son grondement pendant la poursuite (boucle, D-67). */
  'chase-wake',
  'chase-rumble',
  /** Un train s'annonce en gare, puis passe (D-66). */
  'train-warn',
  'train-pass',
  /** Le train entre dans un tunnel (D-86). */
  'tunnel',
  /** La vague s'annonce (D-103). */
  'wave-warn',
  /** L'effacement s'annonce (D-111). */
  'erase',
  // Monde.
  /** Une porte de façade s'ouvre (D-61). */
  'door',
  /** Une bulle de pensée apparaît. */
  'thought',
  /** Le fil discret se montre (D-129) : un tintement très doux. */
  'hint',
  // La voix de Céleste (facultative, jamais de mots, jouée rarement).
  /** Un petit « hop » à certains sauts. */
  'voice-hop',
  /** L'effort : se hisser, le saut mural. */
  'voice-effort',
  /** Touchée : un petit souffle surpris, jamais un cri. */
  'voice-ouch',
  /** Surprise : un poursuivant qui s'éveille. */
  'voice-oh',
  /** Joie : une trouvaille, une capacité trouvée. */
  'voice-laugh',
] as const;
export type SfxSlot = (typeof SFX_SLOTS)[number];

export function isSfxSlot(id: string): id is SfxSlot {
  return (SFX_SLOTS as readonly string[]).includes(id);
}

/** Pas de chaque matière du sol. */
export const STEP_SLOT: Readonly<Record<Surface, SfxSlot>> = {
  wood: 'step-wood',
  fabric: 'step-fabric',
  grass: 'step-grass',
  stone: 'step-stone',
  sand: 'step-sand',
  metal: 'step-metal',
  leaves: 'step-leaves',
};

/** Volume propre de chaque emplacement (1 par défaut), avant le volume des bruitages. */
export const SFX_GAIN: Readonly<Partial<Record<SfxSlot, number>>> = {
  'step-wood': 0.55,
  'step-fabric': 0.45,
  'step-grass': 0.55,
  'step-stone': 0.55,
  'step-sand': 0.55,
  'step-metal': 0.55,
  'step-leaves': 0.55,
  jump: 0.6,
  land: 0.7,
  'wall-slide': 0.5,
  'cable-slide': 0.5,
  'chase-rumble': 0.6,
  thought: 0.5,
  hint: 0.5,
  'voice-hop': 0.7,
  'voice-effort': 0.7,
  'voice-ouch': 0.8,
  'voice-oh': 0.8,
  'voice-laugh': 0.7,
};

/** Sons joués en boucle tant que dure leur situation (glisser, poursuite). */
export const SFX_LOOPS: readonly SfxSlot[] = ['wall-slide', 'cable-slide', 'chase-rumble'];

/** Fondu d'entrée et de sortie d'une boucle (ms). */
export const SFX_LOOP_FADE_MS = { in: 60, out: 160 } as const;

/**
 * La voix de Céleste (D-127), jouée rarement pour ne pas lasser : un « hop » tous les N sauts
 * depuis le sol, un effort toutes les N fois qu'elle se hisse ou saute contre un mur. Touchée,
 * surprise et joie à chaque fois (rares).
 */
export const VOICE_EVERY = { hop: 4, effort: 2 } as const;

export const SFX_MIX = {
  /** Volume de la famille des bruitages (avant le volume général et celui des réglages). */
  gain: 0.9,
  /** Sons joués en même temps au plus : au-delà, le nouveau son est ignoré. */
  maxVoices: 8,
  /** Écart entre deux lectures d'un même emplacement (ms) : deux pas ne se chevauchent pas. */
  minIntervalMs: 60,
  /** Variation de hauteur de chaque lecture (± part de la vitesse de lecture). */
  pitchVariation: 0.06,
  /** Monde étrange : les mêmes sons, assourdis et avec un écho (D-126). */
  strange: {
    /** Fréquence de coupure du filtre passe-bas (Hz). */
    lowpassHz: 2400,
    /** Retard de l'écho (s), part du son renvoyée à chaque répétition, volume de l'écho. */
    echoDelayS: 0.17,
    echoFeedback: 0.35,
    echoGain: 0.4,
  },
} as const;

/** Pas : le volume suit la vitesse (une marche lente est plus douce). */
export const STEP_SOUND = {
  /** Volume d'un pas à l'arrêt presque complet ; 1 à pleine course. */
  minVolume: 0.35,
} as const;

/**
 * Réception : au-delà de cette hauteur de chute (tuiles), le son de la grande chute ; en dessous de
 * `quietFallTiles`, seul le pas (une petite marche, un rebord).
 */
export const LANDING_SOUND = {
  bigFallTiles: 6,
  quietFallTiles: 1,
} as const;

/** Volume des bruitages par défaut (réglage du menu pause). */
export const DEFAULT_SFX_VOLUME = 0.8;

/**
 * Poids maximal des bruitages (précachés pour le hors ligne, D-23), vérifié par les tests. Des sons
 * courts, en mono : quelques dizaines de Ko chacun.
 */
export const SFX_BUDGET_BYTES = 4 * 1024 * 1024;

/**
 * Sons de test (build de debug seulement) : un emplacement sans fichier joue un petit son synthétisé,
 * pour vérifier au téléphone que chaque bruitage tombe au bon moment. Fréquence de départ et
 * d'arrivée (Hz), durée (ms ; 0 pour une boucle : un son tenu tant qu'elle dure), forme d'onde.
 */
export const TEST_TONES: Readonly<
  Record<SfxSlot, { from: number; to: number; ms: number; wave: OscillatorType }>
> = {
  'step-wood': { from: 260, to: 200, ms: 35, wave: 'triangle' },
  'step-fabric': { from: 160, to: 140, ms: 35, wave: 'sine' },
  'step-grass': { from: 320, to: 280, ms: 35, wave: 'triangle' },
  'step-stone': { from: 420, to: 360, ms: 30, wave: 'triangle' },
  'step-sand': { from: 220, to: 180, ms: 40, wave: 'sine' },
  'step-metal': { from: 900, to: 860, ms: 35, wave: 'square' },
  'step-leaves': { from: 380, to: 300, ms: 40, wave: 'sawtooth' },
  jump: { from: 380, to: 720, ms: 90, wave: 'sine' },
  land: { from: 160, to: 90, ms: 70, wave: 'triangle' },
  'land-big': { from: 110, to: 50, ms: 160, wave: 'triangle' },
  hurt: { from: 520, to: 260, ms: 140, wave: 'square' },
  splash: { from: 900, to: 200, ms: 220, wave: 'sawtooth' },
  checkpoint: { from: 660, to: 990, ms: 260, wave: 'sine' },
  'map-open': { from: 500, to: 650, ms: 70, wave: 'triangle' },
  'map-close': { from: 650, to: 500, ms: 70, wave: 'triangle' },
  'ledge-grab': { from: 700, to: 600, ms: 40, wave: 'square' },
  'ledge-climb': { from: 300, to: 500, ms: 120, wave: 'triangle' },
  'wall-slide': { from: 240, to: 240, ms: 0, wave: 'sawtooth' },
  'wall-jump': { from: 450, to: 800, ms: 90, wave: 'square' },
  'umbrella-open': { from: 400, to: 900, ms: 110, wave: 'sine' },
  'umbrella-close': { from: 900, to: 400, ms: 90, wave: 'sine' },
  'hook-catch': { from: 1400, to: 1200, ms: 60, wave: 'square' },
  'cable-slide': { from: 600, to: 600, ms: 0, wave: 'sine' },
  slide: { from: 300, to: 150, ms: 160, wave: 'sawtooth' },
  shift: { from: 300, to: 1200, ms: 140, wave: 'sine' },
  attack: { from: 800, to: 300, ms: 60, wave: 'sawtooth' },
  hit: { from: 200, to: 120, ms: 60, wave: 'square' },
  'enemy-scatter': { from: 1000, to: 1600, ms: 120, wave: 'triangle' },
  'chase-wake': { from: 90, to: 60, ms: 400, wave: 'sawtooth' },
  'chase-rumble': { from: 55, to: 55, ms: 0, wave: 'sawtooth' },
  'train-warn': { from: 880, to: 880, ms: 300, wave: 'square' },
  'train-pass': { from: 200, to: 80, ms: 600, wave: 'sawtooth' },
  tunnel: { from: 150, to: 60, ms: 400, wave: 'sawtooth' },
  'wave-warn': { from: 120, to: 300, ms: 500, wave: 'sine' },
  erase: { from: 1200, to: 200, ms: 400, wave: 'sine' },
  door: { from: 350, to: 250, ms: 120, wave: 'triangle' },
  thought: { from: 1200, to: 1500, ms: 50, wave: 'sine' },
  hint: { from: 1500, to: 1900, ms: 180, wave: 'sine' },
  'voice-hop': { from: 600, to: 900, ms: 80, wave: 'triangle' },
  'voice-effort': { from: 400, to: 350, ms: 120, wave: 'triangle' },
  'voice-ouch': { from: 700, to: 450, ms: 120, wave: 'triangle' },
  'voice-oh': { from: 500, to: 650, ms: 150, wave: 'triangle' },
  'voice-laugh': { from: 800, to: 1000, ms: 200, wave: 'triangle' },
};
