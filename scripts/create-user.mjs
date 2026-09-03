#!/usr/bin/env node
/**
 * Provisions a user account and its profile — the replacement for creating a
 * login in the Supabase dashboard. Runs a scrypt hash (same scheme as
 * server/auth/password.ts) and inserts both rows in one transaction.
 *
 *   DATABASE_URL=... node scripts/create-user.mjs \
 *     --email you@nhs.net --password 'secret' --name 'Your Name' \
 *     --role 'Data Manager' [--surgeon VK] [--patient <uuid>]
 */
import { randomBytes, scryptSync } from 'node:crypto';
import pg from 'pg';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i].replace(/^--/, '');
  args[key] = process.argv[i + 1];
}

const { email, password, name, role } = args;
if (!email || !password || !name || !role) {
  console.error("Usage: --email --password --name --role ['Data Manager'|'Consultant Surgeon'|...] [--surgeon VK] [--patient <uuid>]");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

function hashPassword(pw) {
  const salt = randomBytes(16);
  const key = scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query('begin');
  const { rows } = await client.query(
    'insert into users (email, password_hash) values (lower($1), $2) returning id',
    [email, hashPassword(password)]
  );
  const id = rows[0].id;
  await client.query(
    `insert into profiles (id, full_name, email, role, surgeon_code, patient_id)
     values ($1, $2, lower($3), $4, $5, $6)`,
    [id, name, email, role, args.surgeon ?? null, args.patient ?? null]
  );
  await client.query('commit');
  console.log(`Created ${role} account for ${email} (id ${id}).`);
} catch (err) {
  await client.query('rollback');
  console.error('Failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
