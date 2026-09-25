import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANDING_MEDIA } from '@/components/landing/media';

const ROOT = process.cwd();
const DIRS = ['components/landing', 'app/(landing)'];

function files(dir: string): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const rel = join(dir, name);
    return statSync(join(ROOT, rel)).isDirectory() ? files(rel) : [rel];
  });
}

const SOURCES = DIRS.flatMap(files).map((file) => ({ file, text: readFileSync(join(ROOT, file), 'utf8') }));

// Hex colours allowed on the landing page: the light and dark token table (spec 02).
const TOKENS = [
  '#F4F1EA', '#FBF9F4', '#141816', '#55605C', '#D9D3C7', '#0B6E63', '#B4442B',
  '#0F1514', '#151D1C', '#E9EEEC', '#9AA7A3', '#26312F', '#3FB7A6', '#E07A5F',
];

describe('landing never-list', () => {
  const banned: [string, RegExp][] = [
    ['gradient text', /bg-clip-text|text-transparent|background-clip:\s*text/],
    ['glass', /backdrop-blur|backdrop-filter/],
    ['purple/indigo/violet', /\b(purple|indigo|violet)-/],
    ['large rounded cards', /rounded-(2xl|3xl)/],
    ['third-party fonts', /fonts\.(googleapis|gstatic)/],
  ];

  it.each(banned)('contains no %s', (_label, pattern) => {
    const hits = SOURCES.filter((s) => pattern.test(s.text)).map((s) => s.file);
    expect(hits).toEqual([]);
  });

  it('uses only token hex colours', () => {
    const allowed = new Set(TOKENS.map((t) => t.toLowerCase()));
    const stray = SOURCES.flatMap((s) =>
      (s.text.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) ?? [])
        .filter((hex) => !allowed.has(hex.toLowerCase()))
        .map((hex) => `${s.file}: ${hex}`),
    );
    expect(stray).toEqual([]);
  });

  it('never imports server, database or AI modules', () => {
    const forbidden = /from ['"]@\/(server|db|lib\/ai)\/|from ['"]@\/features\/[^'"]+\/api|['"]server-only['"]/;
    const hits = SOURCES.filter((s) => forbidden.test(s.text)).map((s) => s.file);
    expect(hits).toEqual([]);
  });
});

describe('landing media', () => {
  const KB = 1024;
  const budget = (path: string) =>
    /hero\.(webm|mp4)$/.test(path) ? 900 * KB : path.includes('/patient.') ? 120 * KB : path.endsWith('og.jpg') ? 200 * KB : 150 * KB;

  const paths: string[] = [];
  JSON.stringify(LANDING_MEDIA, (_k, v) => (typeof v === 'string' && v.startsWith('/landing/') ? (paths.push(v), v) : v));

  it.each(paths)('%s exists and fits its budget', (path) => {
    const size = statSync(join(ROOT, 'public', path)).size;
    expect(size).toBeGreaterThan(0);
    expect(size, relative(ROOT, path)).toBeLessThanOrEqual(budget(path));
  });
});
