-- RALP Database v2 — function hardening
-- Closes two findings from the Supabase database linter.

-- ---------------------------------------------------------------- 1. pinned search_path
-- Without an explicit search_path a caller can prepend their own schema and
-- have the function resolve to objects they control. The security-definer
-- functions in 0002 already pin it; these two trigger functions did not.

create or replace function touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function set_grade_group()
returns trigger language plpgsql set search_path = public as $$
begin
  new.grade_group := case new.gleason_grade
    when '3+3' then 1 when '3+4' then 2 when '4+3' then 3 when '4+4' then 4 else 5
  end;
  return new;
end;
$$;

-- ---------------------------------------------------------------- 2. RPC exposure
-- Every function in `public` is published as a REST endpoint. Trigger functions
-- were therefore callable directly at /rest/v1/rpc/... by anyone holding the
-- publishable key. PostgreSQL checks EXECUTE when a function is called, not
-- when a trigger fires it, so revoking here leaves the triggers working.

revoke execute on function touch_updated_at()        from anon, authenticated;
revoke execute on function set_grade_group()         from anon, authenticated;
revoke execute on function schedule_follow_ups()     from anon, authenticated;
revoke execute on function apply_prom_to_follow_up() from anon, authenticated;
revoke execute on function audit_clinical_change()   from anon, authenticated;
revoke execute on function handle_new_user()         from anon, authenticated;

-- Called by the application, but only ever by a signed-in user.
-- Left open to `anon`, write_audit would let an unauthenticated caller forge
-- entries in the Caldicott trail.
revoke execute on function write_audit(text, uuid, text)   from anon;
revoke execute on function refresh_follow_up_status(uuid)  from anon;

-- is_clinician() and is_admin() are deliberately left executable: row level
-- security policies evaluate them as the querying role, so revoking EXECUTE
-- would make every policy raise a permission error instead of returning false.

-- Unused: the application reads the profile through PostgREST, not this helper.
drop function if exists current_profile();

-- Note: the linter also flags pg_trgm living in `public`. Moving it would
-- rewrite the operator class behind patients_search_idx, so it is left in place
-- deliberately — the finding is schema hygiene, not an access-control gap.
