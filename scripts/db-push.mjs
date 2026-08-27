#!/usr/bin/env node
/**
 * Applies supabase/migrations/*.sql to one environment.
 *
 *   node scripts/db-push.mjs development
 *   node scripts/db-push.mjs staging
 *   node scripts/db-push.mjs production
 *
 * Reads SUPABASE_PROJECT_REF and SUPABASE_DB_PASSWORD from .env.<tier>.
 * Production requires an explicit --yes so nobody pushes to live by reflex.
 */
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const tier = process.argv[2];
const confirmed = process.argv.includes('--yes');
const TIERS = ['development', 'staging', 'production'];

if (!TIERS.includes(tier)) {
  console.error(`Usage: node scripts/db-push.mjs <${TIERS.join('|')}> [--yes]`);
  process.exit(1);
}

const envFile = `.env.${tier}`;
if (!existsSync(envFile)) {
  console.error(`Missing ${envFile}. Copy ${envFile}.example and fill it in.`);
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envFile, 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const ref = env.SUPABASE_PROJECT_REF;
const password = env.SUPABASE_DB_PASSWORD;

if (!ref || ref.startsWith('<') || !password) {
  console.error(`${envFile}: set SUPABASE_PROJECT_REF and SUPABASE_DB_PASSWORD first.`);
  process.exit(1);
}

if (tier === 'production' && !confirmed) {
  console.error('Refusing to migrate production without --yes.');
  process.exit(1);
}

// Pooler host — direct db.<ref>.supabase.co is IPv6-only on newer projects.
const url =
  `postgresql://postgres.${ref}:${encodeURIComponent(password)}` +
  `@aws-0-eu-west-2.pooler.supabase.com:5432/postgres`;

console.log(`Pushing migrations -> ${tier} (${ref})`);
const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['--yes', 'supabase@latest', 'db', 'push', '--db-url', url],
  { stdio: 'inherit' }
);

process.exit(result.status ?? 1);
