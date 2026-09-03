-- RALP Database v2 — self-service password reset tokens
--
-- The reset link a clinician receives carries a single-use token. We never
-- store that token: only its SHA-256 hash lands here, the same principle as
-- password_hash in users — a leaked table row cannot be replayed as a link.
-- A row is spent (used_at set) the moment it resets a password, and it is
-- valid only until expires_at, so a link works once and briefly.

create table public.password_reset_tokens (
  token_hash  text primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index password_reset_user_idx on public.password_reset_tokens (user_id);
