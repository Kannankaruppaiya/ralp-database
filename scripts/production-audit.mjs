#!/usr/bin/env node
/**
 * Production-readiness audit.
 *
 * A fast, dependency-free scan for the class of mistakes that quietly ship to
 * real users: demo credentials, debug output, dev-only widgets that aren't
 * env-gated, leaked secrets, unsafe HTML, dead links. Run it locally
 * (`npm run audit`) and in CI on every PR so these never reach production again.
 *
 * Exit code: 0 = clean, 1 = at least one BLOCKER found. WARN never fails the
 * build but is printed so it can be triaged.
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const SCAN_GLOBS = ['app', 'components', 'lib', 'hooks', 'features', 'config'];

function files() {
  return execSync(
    `find ${SCAN_GLOBS.join(' ')} -type f \\( -name '*.ts' -o -name '*.tsx' \\)`,
    { encoding: 'utf8' }
  ).trim().split('\n').filter(Boolean);
}

/**
 * Each rule: { id, level, test(line) -> bool, hint }. `allow` lets a line opt
 * out with a trailing `// audit-ok: <reason>` when a match is a false positive.
 */
const RULES = [
  { id: 'console', level: 'WARN',
    test: l => /\bconsole\.(log|debug|info)\b/.test(l),
    hint: 'Leftover debug output. Remove or gate behind a logger.' },
  { id: 'debugger', level: 'BLOCKER',
    test: l => /\bdebugger\b/.test(l),
    hint: 'A debugger statement will freeze the browser in production.' },
  { id: 'todo', level: 'WARN',
    test: l => /\b(TODO|FIXME|HACK|XXX)\b/.test(l),
    hint: 'Unfinished work marker — resolve or track it in an issue.' },
  { id: 'dangerous-html', level: 'BLOCKER',
    test: l => /dangerouslySetInnerHTML/.test(l),
    hint: 'Raw HTML injection is an XSS risk — sanitise or avoid.' },
  { id: 'dead-link', level: 'WARN',
    test: l => /href=["']#["']/.test(l),
    hint: 'Placeholder link — point it somewhere or make it a button.' },
  { id: 'browser-dialog', level: 'WARN',
    test: l => /\b(alert|confirm|prompt)\(/.test(l) && !/AlertDialog|confirmationMessage/.test(l),
    hint: 'Native alert/confirm is not production UX — use a dialog/toast.' },
  { id: 'hardcoded-http', level: 'WARN',
    test: l => /["']http:\/\/(?!localhost)/.test(l),
    hint: 'Insecure http:// URL hardcoded.' },
  { id: 'hardcoded-localhost', level: 'WARN',
    test: l => /localhost:\d+|127\.0\.0\.1/.test(l),
    hint: 'Hardcoded localhost — should come from env.' },
  { id: 'service-role-in-client', level: 'BLOCKER',
    test: l => /SERVICE_ROLE|sb_secret_/.test(l),
    hint: 'Service-role / secret key must never appear in client-reachable code.' },
  { id: 'demo-data-ungated', level: 'BLOCKER',
    // A literal demo email that is NOT on the same line as an env gate.
    test: l => /@nhs\.net['"]/.test(l)
      && !/placeholder|e\.g\.|showDemoHelpers|isProduction|APP_ENV|@nhs\.net\)/.test(l),
    hint: 'Demo/seed email in a shipped path — gate behind APP_CONFIG.showDemoHelpers.' },
];

const results = [];
for (const f of files()) {
  const src = readFileSync(f, 'utf8');
  src.split('\n').forEach((line, i) => {
    if (/\/\/\s*audit-ok/.test(line)) return;
    for (const r of RULES) {
      if (r.test(line)) results.push({ file: f, line: i + 1, ...r, text: line.trim().slice(0, 100) });
    }
  });
}

const blockers = results.filter(r => r.level === 'BLOCKER');
const warns = results.filter(r => r.level === 'WARN');

function print(list, label) {
  if (!list.length) return;
  console.log(`\n${label} (${list.length})`);
  for (const r of list) {
    console.log(`  ${r.file}:${r.line}  [${r.id}]`);
    console.log(`    ${r.text}`);
    console.log(`    → ${r.hint}`);
  }
}

console.log('── Production-readiness audit ──');
print(blockers, '❌ BLOCKERS');
print(warns, '⚠️  WARNINGS');

if (!results.length) console.log('\n✅ Clean — no red flags in scanned source.');
else console.log(`\n${blockers.length} blocker(s), ${warns.length} warning(s).`);

console.log('\nTip: add `// audit-ok: <reason>` to a line to suppress an intentional match.');
process.exit(blockers.length ? 1 : 0);
