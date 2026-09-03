#!/usr/bin/env node
/**
 * Plain-PostgreSQL migration runner — replaces the Supabase CLI (db-push.mjs).
 *
 *   DATABASE_URL=postgres://user:pass@host:5432/db  node scripts/migrate.mjs
 *   node scripts/migrate.mjs --dry     # list what would run, apply nothing
 *
 * Applies every db/migrations/*.sql not yet recorded, in filename order, each in
 * its own transaction. Forward-only: an applied migration is never re-run and
 * must never be edited (add a new file instead). Idempotent — safe to re-run.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(here, '..', 'db', 'migrations');
const dryRun = process.argv.includes('--dry');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Example:\n' +
    '  DATABASE_URL=postgres://ralp:ralp@localhost:5432/ralp node scripts/migrate.mjs');
  process.exit(1);
}

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort(); // 0000, 0001, ... — zero-padded names sort chronologically

const client = new pg.Client({ connectionString });

async function main() {
  await client.connect();

  await client.query(`
    create table if not exists schema_migrations (
      version     text primary key,
      applied_at  timestamptz not null default now()
    );
  `);

  const { rows } = await client.query('select version from schema_migrations');
  const applied = new Set(rows.map((r) => r.version));

  const pending = files.filter((f) => !applied.has(f));
  if (pending.length === 0) {
    console.log(`✓ up to date — ${files.length} migration(s) already applied`);
    return;
  }

  console.log(`${pending.length} pending migration(s):`);
  for (const f of pending) console.log(`  • ${f}`);
  if (dryRun) {
    console.log('\n--dry: nothing applied.');
    return;
  }

  for (const file of pending) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    process.stdout.write(`→ ${file} ... `);
    try {
      await client.query('begin');
      await client.query(sql);
      await client.query('insert into schema_migrations (version) values ($1)', [file]);
      await client.query('commit');
      console.log('ok');
    } catch (err) {
      await client.query('rollback');
      console.log('FAILED');
      console.error(`\n${file} failed and was rolled back:\n${err.message}\n`);
      process.exit(1);
    }
  }
  console.log(`\n✓ applied ${pending.length} migration(s)`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => client.end());
