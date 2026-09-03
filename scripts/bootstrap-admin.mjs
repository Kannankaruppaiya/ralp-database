#!/usr/bin/env node
/**
 * Creates (or repairs) the single standing administrator account for one tier.
 *
 *   node scripts/bootstrap-admin.mjs staging
 *   node scripts/bootstrap-admin.mjs production
 *
 * Reads ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME from .env.<tier>. This is the
 * one account that exists before anybody has logged in; every other account is
 * created through the admin UI, which needs an administrator to already be
 * signed in. Running it again is safe: an existing account has its password
 * reset to the .env value and its profile corrected to Data Manager, so the
 * .env file stays the source of truth for these credentials.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const tier = process.argv[2];
const TIERS = ['development', 'staging', 'production'];

if (!TIERS.includes(tier)) {
  console.error(`Usage: node scripts/bootstrap-admin.mjs <${TIERS.join('|')}>`);
  process.exit(1);
}

const envFile = `.env.${tier}`;
if (!existsSync(envFile)) {
  console.error(`Missing ${envFile}.`);
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

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const email = env.ADMIN_EMAIL;
const password = env.ADMIN_PASSWORD;
const fullName = env.ADMIN_NAME || 'Registry Administrator';

const missing = Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  ADMIN_EMAIL: email,
  ADMIN_PASSWORD: password,
})
  .filter(([, v]) => !v || v.startsWith('<'))
  .map(([k]) => k);

if (missing.length) {
  console.error(`${envFile}: set ${missing.join(', ')} first.`);
  process.exit(1);
}

// Password length is left to Supabase so there is one authority for the rule;
// its rejection message is surfaced verbatim below.
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(`Bootstrapping administrator -> ${tier} (${url})`);

// Find an existing account rather than trusting createUser's error text, which
// differs between Supabase versions.
const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (listError) {
  console.error(`Could not list users: ${listError.message}`);
  process.exit(1);
}

const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
let userId;

if (existing) {
  userId = existing.id;
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });
  if (error) {
    console.error(`Could not reset the password: ${error.message}`);
    process.exit(1);
  }
  console.log(`Existing account found — password reset from ${envFile}.`);
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data?.user) {
    console.error(`Could not create the account: ${error?.message ?? 'unknown error'}`);
    process.exit(1);
  }
  userId = data.user.id;
  console.log('Account created.');
}

// The signup trigger writes a profile with the default role, so this upsert is
// what actually makes the account an administrator. must_change_password stays
// false: these credentials are maintained in .env, not rotated at first login.
const { error: profileError } = await admin.from('profiles').upsert(
  {
    id: userId,
    full_name: fullName,
    email,
    role: 'Data Manager',
    must_change_password: false,
    deactivated_at: null,
  },
  { onConflict: 'id' }
);

if (profileError) {
  console.error(`Account exists but the profile write failed: ${profileError.message}`);
  console.error('Sign-in will fail until a Data Manager profile exists for this id.');
  process.exit(1);
}

const { error: auditError } = await admin.from('audit_log').insert({
  actor_id: userId,
  actor_name: fullName,
  actor_role: 'Data Manager',
  action: 'ADMIN_BOOTSTRAPPED',
  details: `Standing administrator account provisioned from ${envFile}`,
});
if (auditError) console.warn(`audit write failed: ${auditError.message}`);

console.log(`\nAdministrator ready: ${email}  (Data Manager)`);
console.log('Sign in at /admin-login and create the clinician accounts from there.');
