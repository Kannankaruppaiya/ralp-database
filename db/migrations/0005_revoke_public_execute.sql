-- RALP Database v2 — finish closing the RPC surface
--
-- 0004 revoked EXECUTE from `anon` and `authenticated`, which changed nothing:
-- Postgres grants EXECUTE to PUBLIC on every new function, and both roles
-- inherit it. The revoke has to name PUBLIC.

-- Trigger functions. Fired by the trigger machinery, which does not check
-- EXECUTE, so nothing needs to be granted back.
revoke execute on function touch_updated_at()        from public;
revoke execute on function set_grade_group()         from public;
revoke execute on function schedule_follow_ups()     from public;
revoke execute on function apply_prom_to_follow_up() from public;
revoke execute on function audit_clinical_change()   from public;
revoke execute on function handle_new_user()         from public;

-- Called by the application over RPC, but only ever by a signed-in user.
-- Reachable by `anon`, write_audit would let an unauthenticated caller forge
-- Caldicott entries, and refresh_follow_up_status would let them re-age every
-- milestone in the registry.
revoke execute on function write_audit(text, uuid, text)  from public;
revoke execute on function refresh_follow_up_status(uuid) from public;
grant  execute on function write_audit(text, uuid, text)  to authenticated;
grant  execute on function refresh_follow_up_status(uuid) to authenticated;

-- is_clinician() and is_admin() stay reachable on purpose. Row level security
-- evaluates them as the querying role, so without EXECUTE every policy would
-- raise a permission error instead of returning false. They disclose nothing:
-- each returns a boolean about the caller's own session and reads no patient
-- data. The linter will keep flagging them; this is the intended state.
revoke execute on function is_clinician() from public;
revoke execute on function is_admin()     from public;
grant  execute on function is_clinician() to authenticated, anon;
grant  execute on function is_admin()     to authenticated, anon;
