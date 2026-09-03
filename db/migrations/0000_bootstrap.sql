-- RALP Database v2 — vanilla-PostgreSQL bootstrap
--
-- This file is OUR code, not Supabase's. It recreates on a plain PostgreSQL
-- server the few things Supabase used to provide implicitly, so the ported
-- clinical migrations (0001–0008) run unchanged. That is deliberate: keeping
-- those files faithful proves the registry's logic is portable, with the whole
-- Supabase dependency reduced to this one bootstrap.
--
-- What Phase 1 (own auth) will replace:
--   * auth.users        → our own `users` table (with password_hash)
--   * auth.uid()        → reads the same session variable, kept as-is
--   * handle_new_user   → provisioning moves into the API
-- Until then, this bridge lets us stand up a working database today.

-- gen_random_uuid(): in core on PG13+, but declare the extension so the schema
-- also loads on servers where it is packaged separately.
create extension if not exists pgcrypto;

-- Roles Supabase pre-creates. The ported migrations grant/revoke against these,
-- and row level security evaluates policies as the connecting role. NOLOGIN:
-- the application connects as its own owner role and selects the acting role via
-- the session, exactly as it did through PostgREST.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

-- Identity store stand-in. Supabase kept accounts in auth.users; `profiles`
-- references it by foreign key and a trigger provisions a profile on insert.
-- Phase 1 replaces this with a public `users` table carrying password_hash.
create schema if not exists auth;

create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text unique not null,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

-- auth.uid(): the id of the user making the current request.
--
-- Supabase derived this from the request's JWT. Here it reads a per-transaction
-- session variable the API sets before touching the database:
--
--     SET LOCAL app.user_id = '<uuid>';
--
-- This is precisely the Option-B mechanism from the migration plan — the same
-- security-definer functions and RLS policies keep working with no edit, now
-- scoped by our own session variable instead of Supabase's JWT. Returns NULL
-- when unset, i.e. an unauthenticated (anon) request.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
