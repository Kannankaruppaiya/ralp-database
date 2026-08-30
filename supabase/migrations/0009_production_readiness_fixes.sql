-- RALP Database v2 — production-readiness corrections
--
-- Closes three findings from the production-readiness review:
--   M3 — PROM milestone was free text and could silently close nothing
--   H1 — stage filtering ran client-side, after pagination
--   H2/H3 — registry exports were reachable outside the admin gate, and unaudited

-- ---------------------------------------------------------------- M3: constrain PROM milestone
-- apply_prom_to_follow_up() (0002) matches prom_submissions.milestone against the
-- follow_up_milestone enum by string equality. A value outside the set closes no
-- milestone and raises no error, so a questionnaire could be recorded yet leave
-- its visit "due" forever. Constrain it to the same seven values the schedule uses.
alter table prom_submissions
  add constraint prom_milestone_valid
  check (milestone in ('2m','6m','12m','18m','24m','30m','36m'));

-- ---------------------------------------------------------------- H1: server-side patient search
-- A flat projection of the columns the registry search filters on. The stage a
-- patient is searched by spans two tables (clinical vs pathological); exposing
-- both here lets the filter and the row count run in SQL, before pagination,
-- instead of being applied to a single already-paginated page in the browser.
-- security_invoker: the caller's row level security still decides visibility.
create or replace view patient_search with (security_invoker = true) as
select
  p.id,
  p.surname,
  p.primary_surgeon,
  p.status,
  p.search_text,
  b.clinical_stage,
  h.pathological_stage
from patients p
left join baseline_cancer b on b.patient_id = p.id
left join histology       h on h.patient_id = p.id;

-- ---------------------------------------------------------------- H2/H3: gate + audit exports
-- The export views are security_invoker, so any clinician role could read them
-- straight from PostgREST — bypassing the Data-Manager-only screen and the audit
-- row the UI writes. Move both behind security-definer functions that check
-- is_admin() and write the Caldicott entry in the same transaction, then revoke
-- direct access to the views so the function is the only way in. Because the
-- audit write shares the transaction, a failed audit rolls the export back: an
-- extract is never delivered unlogged.

create or replace function export_registry_pseudonymised()
returns setof registry_export_pseudonymised
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not is_admin() then
    raise exception 'not authorised: registry export requires the Data Manager role'
      using errcode = '42501';
  end if;
  select count(*) into n from registry_export_pseudonymised;
  perform write_audit('EXPORT_PSEUDONYMISED', null, n || ' records, no identifiers');
  return query select * from registry_export_pseudonymised order by pseudonym;
end;
$$;

create or replace function export_registry_identifiable()
returns setof registry_export_identifiable
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not is_admin() then
    raise exception 'not authorised: registry export requires the Data Manager role'
      using errcode = '42501';
  end if;
  select count(*) into n from registry_export_identifiable;
  perform write_audit('EXPORT_IDENTIFIABLE', null,
    n || ' records including NHS number, hospital number, name and date of birth');
  return query select * from registry_export_identifiable order by surname;
end;
$$;

-- The application no longer reads the views directly. Revoking select closes the
-- un-audited PostgREST path; the security-definer functions own the underlying
-- tables and so continue to read them.
revoke all on registry_export_pseudonymised from anon, authenticated;
revoke all on registry_export_identifiable  from anon, authenticated;

-- PostgREST publishes every public function; only signed-in users may invoke.
revoke execute on function export_registry_pseudonymised() from public;
revoke execute on function export_registry_identifiable()  from public;
grant  execute on function export_registry_pseudonymised() to authenticated;
grant  execute on function export_registry_identifiable()  to authenticated;
