#!/usr/bin/env node
// Landing page media pipeline (needs ffmpeg on PATH).
//
//   node scripts/landing-media.mjs encode <clip.mp4> [--delogo x:y:w:h]
//       -> hero.webm, hero.mp4, hero-poster.{avif,jpg} (first frame),
//          hero-end.{avif,jpg} (last frame, shown when motion is reduced)
//   node scripts/landing-media.mjs encode-still <image> <key> [--size WxH]
//       -> <key>.avif, <key>.jpg (hero-plate also writes og.jpg 1200x630)
//   node scripts/landing-media.mjs budget
//       -> fails if any file in public/landing exceeds its budget
//
// Source files live in ralph/assets-in/ (git-ignored); only outputs are committed.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'public', 'landing');
const KB = 1024;

// Largest allowed size per file, matched by prefix of the file name.
const BUDGETS = [
  ['hero.webm', 900 * KB],
  ['hero.mp4', 900 * KB],
  ['hero-poster.', 150 * KB],
  ['hero-end.', 150 * KB],
  ['hero-m.', 150 * KB],
  ['patient.', 120 * KB],
  ['og.jpg', 200 * KB],
];

function ffmpeg(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
}

function requireFfmpeg() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  } catch {
    console.error('ffmpeg not found on PATH. Install it (e.g. apt install ffmpeg) and retry.');
    process.exit(1);
  }
}

function flag(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
}

function budgetFor(file) {
  return BUDGETS.find(([prefix]) => file.startsWith(prefix))?.[1];
}

// Encode an image at decreasing quality until it fits its budget.
function stillWithinBudget(input, output, vf) {
  const limit = budgetFor(output.split('/').pop()) ?? 150 * KB;
  const avif = output.endsWith('.avif');
  const steps = avif ? [28, 32, 36, 40, 44, 48] : [3, 4, 5, 6, 8, 10, 12];
  for (const q of steps) {
    const codec = avif
      ? ['-c:v', 'libaom-av1', '-still-picture', '1', '-crf', String(q), '-cpu-used', '4', '-pix_fmt', 'yuv420p']
      : ['-q:v', String(q)];
    ffmpeg(['-i', input, '-frames:v', '1', '-vf', vf, ...codec, output]);
    if (statSync(output).size <= limit) return;
  }
  throw new Error(`${output} is still over budget at the lowest quality step`);
}

function encodeClip(src) {
  const delogo = flag('--delogo');
  const clean = delogo ? `delogo=${delogo.split(':').map((v, i) => `${'xywh'[i]}=${v}`).join(':')},` : '';
  const vf = `${clean}scale=1280:-2:flags=lanczos,format=yuv420p`;
  const tmp = mkdtempSync(join(tmpdir(), 'landing-'));
  try {
    // VP9, two-pass at a fixed bitrate so the file size is predictable.
    const vp9 = ['-i', src, '-an', '-vf', vf, '-c:v', 'libvpx-vp9', '-b:v', '560k', '-g', '48', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2'];
    ffmpeg([...vp9, '-pass', '1', '-passlogfile', join(tmp, 'vp9'), '-f', 'null', '/dev/null']);
    ffmpeg([...vp9, '-pass', '2', '-passlogfile', join(tmp, 'vp9'), join(OUT, 'hero.webm')]);
    // H.264 fallback for Safari; faststart puts the index first so playback begins early.
    const h264 = ['-i', src, '-an', '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-b:v', '600k', '-g', '48', '-profile:v', 'high'];
    ffmpeg([...h264, '-pass', '1', '-passlogfile', join(tmp, 'x264'), '-f', 'null', '/dev/null']);
    ffmpeg([...h264, '-pass', '2', '-passlogfile', join(tmp, 'x264'), '-movflags', '+faststart', join(OUT, 'hero.mp4')]);
    // First frame sits under the video (LCP); last frame is the reduced-motion still.
    const first = join(tmp, 'first.png');
    const last = join(tmp, 'last.png');
    ffmpeg(['-i', src, '-frames:v', '1', first]);
    ffmpeg(['-sseof', '-0.1', '-i', src, '-update', '1', last]);
    for (const [png, key] of [[first, 'hero-poster'], [last, 'hero-end']]) {
      stillWithinBudget(png, join(OUT, `${key}.avif`), vf);
      stillWithinBudget(png, join(OUT, `${key}.jpg`), vf);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function encodeStill(src, key) {
  const [w, h] = (flag('--size') ?? '960x1200').split('x').map(Number);
  const vf = `scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${w}:${h}`;
  if (key === 'hero-plate') {
    stillWithinBudget(src, join(OUT, 'og.jpg'), 'scale=1200:630:force_original_aspect_ratio=increase:flags=lanczos,crop=1200:630');
    return;
  }
  stillWithinBudget(src, join(OUT, `${key}.avif`), vf);
  stillWithinBudget(src, join(OUT, `${key}.jpg`), vf);
}

function budget() {
  let failed = false;
  for (const file of readdirSync(OUT).sort()) {
    const size = statSync(join(OUT, file)).size;
    const limit = budgetFor(file);
    const ok = limit === undefined || size <= limit;
    if (!ok) failed = true;
    console.log(`${ok ? 'ok  ' : 'OVER'} ${file.padEnd(20)} ${(size / KB).toFixed(0).padStart(5)} KB${limit ? ` / ${limit / KB} KB` : ''}`);
  }
  if (failed) process.exit(1);
}

const [mode, a, b] = process.argv.slice(2);
if (mode === 'budget') {
  budget();
} else if (mode === 'encode' && a && existsSync(a)) {
  requireFfmpeg();
  encodeClip(a);
  budget();
} else if (mode === 'encode-still' && a && b && existsSync(a)) {
  requireFfmpeg();
  encodeStill(a, b);
  budget();
} else {
  console.error('Usage: landing-media.mjs encode <clip.mp4> [--delogo x:y:w:h] | encode-still <image> <key> [--size WxH] | budget');
  process.exit(1);
}
