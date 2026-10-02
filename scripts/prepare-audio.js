// Prépare les morceaux bruts (Suno…) pour le jeu (D-57, D-92) : silences du début et de la fin
// coupés, volume ramené à la même sonie, AAC 96 kbit/s en .m4a, sans pochette ni métadonnées.
// Usage : npm run audio:prepare -- <fichiers ou dossier> ; nécessite ffmpeg.
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

function prepare(file) {
  const name = basename(file, extname(file)).replace(/^[0-9a-f]{8}-/, '');
  const out = join(OUT_DIR, `${name}.m4a`);
  const { start, end } = audibleRange(file);
  const trim =
    `atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS,` +
    `afade=t=in:d=${EDGE_FADE_S},areverse,afade=t=in:d=${EDGE_FADE_S},areverse`;
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

const inputs = process.argv.slice(2).flatMap((path) =>
  statSync(path).isDirectory()
    ? readdirSync(path)
        .filter((n) => /\.(mp3|wav|flac|ogg|m4a|opus)$/i.test(n))
        .map((n) => join(path, n))
    : [path],
);
if (inputs.length === 0) {
  console.error('Usage : npm run audio:prepare -- <fichiers ou dossier>');
  process.exit(1);
}
for (const file of inputs) {
  prepare(file);
}
