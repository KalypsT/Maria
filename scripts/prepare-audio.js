// Prépare les morceaux bruts (Suno…) pour le jeu (D-57, D-92) : silences du début et de la fin
// coupés, volume ramené à la même sonie, AAC 96 kbit/s en .m4a, sans pochette ni métadonnées.
// Usage : npm run audio:prepare -- [--max <secondes>] <fichiers ou dossier> ; nécessite ffmpeg.
// `--max` raccourcit le son à cette durée, avec un fondu de sortie (D-94, jingle `memory`).
// `--sfx` prépare des bruitages (D-126) dans `src/assets/sfx/` : mono, ramenés à la même crête (la
// sonie se mesure mal sur un son très court), fondus de bord très courts (l'attaque d'un pas reste
// nette) ; le nom (`step-wood-1`) doit être un emplacement de `src/config/sfx.ts`.
// Le nom du fichier produit est le nom d'origine sans préfixe d'envoi (`f9d40126-garden.mp3` →
// `garden.m4a`) ; il doit être un emplacement de `src/config/audio.ts`.
import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const OUT_DIR = 'src/assets/audio';
/** Sonie intégrée visée (LUFS) et crête vraie maximale (dBTP), la même pour tous les sons. */
const TARGET_LUFS = -18;
const TARGET_TP = -1.5;
const BITRATE = '96k';
/** Seuils de silence (dBFS, fenêtres de 50 ms) : en dessous, le début et la fin sont coupés. */
const HEAD_SILENCE_DB = -60;
const TAIL_SILENCE_DB = -50;
/** Petit fondu aux coupures, contre les clics. */
const EDGE_FADE_S = 0.02;
/** Fondu de sortie quand `--max` raccourcit le son. */
const MAX_FADE_S = 1.5;
/** Bruitages (`--sfx`) : dossier, crête visée (dBFS), débit (mono), fondus de bord. */
const SFX_DIR = 'src/assets/sfx';
const SFX_PEAK_DB = -4;
const SFX_BITRATE = '80k';
const SFX_EDGE_FADE_S = 0.004;

function ffmpeg(args) {
  return execFileSync('ffmpeg', ['-hide_banner', '-nostdin', ...args], {
    maxBuffer: 1 << 28,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/** Bornes du son utile (secondes), d'après l'enveloppe en fenêtres de 50 ms. */
function audibleRange(file) {
  const rate = 8000;
  const raw = ffmpeg(['-v', 'error', '-i', file, '-ac', '1', '-ar', `${rate}`, '-f', 'f32le', '-']);
  const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
  const win = rate / 20;
  const db = [];
  for (let i = 0; (i + 1) * win <= x.length; i++) {
    let sum = 0;
    for (let j = i * win; j < (i + 1) * win; j++) {
      sum += x[j] * x[j];
    }
    db.push(10 * Math.log10(sum / win + 1e-12));
  }
  const first = Math.max(
    0,
    db.findIndex((v) => v > HEAD_SILENCE_DB),
  );
  let last = db.length - 1;
  while (last > first && db[last] <= TAIL_SILENCE_DB) {
    last--;
  }
  return { start: first / 20, end: Math.min(x.length / rate, (last + 2) / 20) };
}

/** Mesure de `loudnorm` (premier passage), écrite par ffmpeg sur la sortie d'erreur. */
function measure(file, filters) {
  const { stderr } = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-nostdin', '-i', file, '-af', filters, '-f', 'null', '-'],
    { encoding: 'utf8', maxBuffer: 1 << 26 },
  );
  return JSON.parse(stderr.slice(stderr.lastIndexOf('{')));
}

/** Crête du son filtré (dBFS), mesurée par `volumedetect`. */
function peakDb(file, filters) {
  const { stderr } = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-nostdin', '-i', file, '-af', `${filters},volumedetect`, '-f', 'null', '-'],
    { encoding: 'utf8', maxBuffer: 1 << 26 },
  );
  const match = /max_volume: (-?[\d.]+) dB/.exec(stderr);
  return match ? Number(match[1]) : 0;
}

/** Bruitage (D-126) : silences coupés, mono, même crête pour tous. */
function prepareSfx(file) {
  const name = basename(file, extname(file)).replace(/^[0-9a-f]{8}-/, '');
  const out = join(SFX_DIR, `${name}.m4a`);
  const { start, end } = audibleRange(file);
  const trim =
    `atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS,` +
    `afade=t=in:d=${SFX_EDGE_FADE_S},areverse,afade=t=in:d=${SFX_EDGE_FADE_S * 5},areverse`;
  const gain = SFX_PEAK_DB - peakDb(file, trim);
  ffmpeg([
    '-v',
    'error',
    '-y',
    '-i',
    file,
    '-vn',
    '-map_metadata',
    '-1',
    '-af',
    `${trim},volume=${gain.toFixed(2)}dB`,
    '-ac',
    '1',
    '-ar',
    '44100',
    '-c:a',
    'aac',
    '-b:a',
    SFX_BITRATE,
    '-movflags',
    '+faststart',
    out,
  ]);
  const kb = Math.round(statSync(out).size / 1024);
  console.log(
    `${out} : ${((end - start) * 1000).toFixed(0)} ms, gain ${gain.toFixed(1)} dB, ${kb} Ko`,
  );
}

function prepare(file, maxSec) {
  const name = basename(file, extname(file)).replace(/^[0-9a-f]{8}-/, '');
  const out = join(OUT_DIR, `${name}.m4a`);
  const range = audibleRange(file);
  const { start } = range;
  const shortened = maxSec > 0 && range.end - start > maxSec;
  const end = shortened ? start + maxSec : range.end;
  const outFade = shortened ? Math.min(MAX_FADE_S, maxSec / 2) : EDGE_FADE_S;
  const trim =
    `atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS,` +
    `afade=t=in:d=${EDGE_FADE_S},areverse,afade=t=in:d=${outFade},areverse`;
  // Mesure, puis normalisation linéaire (sans compression) avec les valeurs mesurées.
  const norm = `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=20`;
  const json = measure(file, `${trim},${norm}:print_format=json`);
  const second =
    `${norm}:linear=true:measured_I=${json.input_i}:measured_TP=${json.input_tp}` +
    `:measured_LRA=${json.input_lra}:measured_thresh=${json.input_thresh}` +
    `:offset=${json.target_offset}`;
  ffmpeg([
    '-v',
    'error',
    '-y',
    '-i',
    file,
    '-vn',
    '-map_metadata',
    '-1',
    '-af',
    `${trim},${second}`,
    '-ar',
    '44100',
    '-c:a',
    'aac',
    '-b:a',
    BITRATE,
    '-movflags',
    '+faststart',
    out,
  ]);
  const kb = Math.round(statSync(out).size / 1024);
  console.log(
    `${out} : ${(end - start).toFixed(1)} s (coupé ${start.toFixed(2)} s au début), ` +
      `sonie ${json.input_i} → ${TARGET_LUFS} LUFS, ${kb} Ko`,
  );
}

const args = process.argv.slice(2);
const sfxAt = args.indexOf('--sfx');
const sfx = sfxAt >= 0;
if (sfx) {
  args.splice(sfxAt, 1);
}
const maxAt = args.indexOf('--max');
const maxSec = maxAt >= 0 ? Number(args.splice(maxAt, 2)[1]) : 0;
if (!(maxSec >= 0)) {
  console.error('--max : durée en secondes attendue');
  process.exit(1);
}
const inputs = args.flatMap((path) =>
  statSync(path).isDirectory()
    ? readdirSync(path)
        .filter((n) => /\.(mp3|wav|flac|ogg|m4a|opus)$/i.test(n))
        .map((n) => join(path, n))
    : [path],
);
if (inputs.length === 0) {
  console.error(
    'Usage : npm run audio:prepare -- [--sfx] [--max <secondes>] <fichiers ou dossier>',
  );
  process.exit(1);
}
for (const file of inputs) {
  if (sfx) {
    prepareSfx(file);
  } else {
    prepare(file, maxSec);
  }
}
