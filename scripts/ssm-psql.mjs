#!/usr/bin/env node
/**
 * Runs a local .sql file against the production Postgres on the self-hosted
 * Supabase EC2 host, over AWS Systems Manager.
 *
 *   node scripts/ssm-psql.mjs supabase/snippets/apply-0012-production.sql
 *
 * SSM is the only route to that host: its SSH (22) and Postgres (5432) ports
 * are closed to the internet, and `npm run db:push:prod` targets Supabase
 * Cloud, which this deployment does not use (SUPABASE_PROJECT_REF is empty in
 * .env.production).
 *
 * The file is base64-encoded and reassembled on the instance rather than
 * interpolated into the command. SQL is full of quotes, $$ dollar-quoting and
 * newlines; every attempt to pass it as shell text mangles something, and a
 * half-mangled migration is far worse than one that fails to start.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const INSTANCE = 'i-0d9c1d1d03a4dd389';
const REGION   = 'eu-west-2';
const CONTAINER = 'supabase-db';
const CHUNK = 2000;

const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error('Usage: node scripts/ssm-psql.mjs <file.sql>');
  process.exit(1);
}

const aws = (args) =>
  JSON.parse(execFileSync('aws', [...args, '--region', REGION, '--output', 'json'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));

const b64 = readFileSync(sqlPath).toString('base64');
const chunks = b64.match(new RegExp(`.{1,${CHUNK}}`, 'g')) ?? [];

const remote = '/tmp/ralp-ssm.b64';
const commands = [
  `rm -f ${remote} ${remote}.sql`,
  ...chunks.map((c) => `printf %s '${c}' >> ${remote}`),
  `base64 -d ${remote} > ${remote}.sql`,
  // ON_ERROR_STOP so a failing statement aborts instead of the script marching
  // on; the bundle wraps itself in BEGIN/COMMIT so that abort rolls everything
  // back rather than leaving the schema half-migrated.
  `docker exec -i ${CONTAINER} psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - < ${remote}.sql`,
  `rc=$?`,
  `rm -f ${remote} ${remote}.sql`,
  `exit $rc`,
];

console.error(`Sending ${sqlPath} (${b64.length} b64 chars, ${chunks.length} chunks) to ${INSTANCE}…`);

const sent = aws([
  'ssm', 'send-command',
  '--document-name', 'AWS-RunShellScript',
  '--instance-ids', INSTANCE,
  '--comment', `psql ${sqlPath}`.slice(0, 100),
  '--parameters', JSON.stringify({ commands }),
]);
const commandId = sent.Command.CommandId;
console.error(`CommandId ${commandId}`);

// Poll rather than sleep-then-read: a migration that finishes in two seconds
// should not cost thirty.
let inv;
for (let i = 0; i < 120; i++) {
  // Atomics.wait rather than shelling out to sleep/timeout: `timeout` needs a
  // console it does not have when spawned this way, and fails with status 125.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
  try {
    inv = aws(['ssm', 'get-command-invocation',
      '--command-id', commandId, '--instance-id', INSTANCE]);
  } catch { continue; }
  if (!['Pending', 'InProgress', 'Delayed'].includes(inv.Status)) break;
}

console.log('--- status ---');
console.log(inv?.Status, `(exit ${inv?.ResponseCode})`);
if (inv?.StandardOutputContent) { console.log('--- stdout ---'); console.log(inv.StandardOutputContent); }
if (inv?.StandardErrorContent)  { console.log('--- stderr ---'); console.log(inv.StandardErrorContent); }

process.exit(inv?.Status === 'Success' ? 0 : 1);
