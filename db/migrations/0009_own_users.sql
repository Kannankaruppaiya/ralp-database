-- RALP Database v2 — Phase 1: our own users table (replaces the auth.users shim)
--
-- 0000 stood up an `auth.users` stand-in so the ported migrations could run.
-- This migration replaces it with a real application-owned `users` table that
-- carries the password hash, and repoints `profiles` at it. `auth.uid()` is
-- unchanged — it is our own function reading the per-request session variable,
-- and every security-definer function and RLS policy keeps working untouched.

-- ---------------------------------------------------------------- users
create table public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  status        text not null default 'active' check (status in ('active','disabled')),
  created_at    timestamptz not null default now()
);

-- Emails are matched case-insensitively at login; store and compare lower-case.
create unique index users_email_lower_idx on public.users (lower(email));

-- ---------------------------------------------------------------- repoint profiles
-- profiles.id referenced auth.users (constraint auto-named profiles_id_fkey in
-- 0001). Drop it and point the same column at our own users table.
alter table profiles drop constraint profiles_id_fkey;
alter table profiles add constraint profiles_id_fkey
  foreign key (id) references public.users(id) on delete cascade;

-- ---------------------------------------------------------------- retire the shim
-- Provisioning (creating a user *and* their profile) is now an application
-- concern, done in one transaction by the admin API — not a database trigger on
-- signup. Drop the trigger, its function, and the auth.users stand-in.
drop trigger if exists t_auth_user_created on auth.users;
drop function if exists handle_new_user();
drop table if exists auth.users;

-- The `auth` schema is kept: it still holds auth.uid(), which the ported
-- functions and policies call. It reads the session variable, no Supabase.
