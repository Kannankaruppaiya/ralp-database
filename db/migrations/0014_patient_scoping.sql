-- RALP Database v2 — scope the registry to the caller's own patients
--
-- 0003 let any clinical role read every patient in the registry. A doctor must
-- see only their own caseload. "Own" means either of:
--   * patients.primary_surgeon matches the caller's profiles.surgeon_code, or
--   * the caller entered the record (patients.created_by).
-- 'Data Manager' (is_admin) keeps the whole registry — governance, exports and
-- audit depend on it. A patient's own view of their record is untouched.
--
-- Enforced here rather than in the app: the outcome and export views in 0006 /
-- 0008 are security_invoker, so narrowing the tables narrows those too, and
-- lib/api-client.ts queries PostgREST with the caller's own JWT.

-- created_by was declared in 0001 but never written by any insert path, so the
-- "I entered this record" half of the rule had nothing to match on.
alter table patients alter column created_by set default auth.uid();

create or replace function can_access_patient(p_patient uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_patient is not null and (
    is_admin() or exists (
      select 1
      from patients p
      join profiles me on me.id = auth.uid()
      where p.id = p_patient
        and (p.created_by = me.id or p.primary_surgeon = me.surgeon_code)
    )
  );
$$;

revoke execute on function can_access_patient(uuid) from public;
grant  execute on function can_access_patient(uuid) to authenticated;

-- ---------------------------------------------------------------- patients
-- Inlined rather than routed through can_access_patient() so the planner can
-- still use patients_surgeon_idx on a registry list query.

drop policy "clinicians read patients"  on patients;
drop policy "clinicians write patients" on patients;

create policy "clinicians read own patients" on patients
  for select using (
    is_clinician() and (
      is_admin()
      or created_by = auth.uid()
      or primary_surgeon = (select surgeon_code from profiles where id = auth.uid())
    )
  );

-- USING decides which rows may be touched; WITH CHECK stays open so a handover
-- (reassigning primary_surgeon to a colleague) is not rejected as self-lockout,
-- and so a registrar may enter a patient on a consultant's list.
create policy "clinicians write own patients" on patients
  for all using (
    is_clinician() and (
      is_admin()
      or created_by = auth.uid()
      or primary_surgeon = (select surgeon_code from profiles where id = auth.uid())
    )
  ) with check (is_clinician());

-- ---------------------------------------------------------------- clinical detail tables

do $$
declare t text;
begin
  foreach t in array array['baseline_cancer','operations','histology','follow_ups'] loop
    execute format($p$
      drop policy "clinicians read %1$s"  on %1$I;
      drop policy "clinicians write %1$s" on %1$I;
      create policy "clinicians read own %1$s" on %1$I
        for select using (is_clinician() and can_access_patient(patient_id));
      create policy "clinicians write own %1$s" on %1$I
        for all using (is_clinician() and can_access_patient(patient_id))
        with check (is_clinician() and can_access_patient(patient_id));
    $p$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------- PROMs

drop policy "clinicians read proms"  on prom_submissions;
drop policy "clinicians record prom" on prom_submissions;

create policy "clinicians read own proms" on prom_submissions
  for select using (is_clinician() and can_access_patient(patient_id));

create policy "clinicians record own prom" on prom_submissions
  for insert with check (is_clinician() and can_access_patient(patient_id));

-- ---------------------------------------------------------------- ingestion
-- An uploaded document is not anyone's caseload until it has been matched to a
-- patient, so the unmatched triage queue stays shared. Once matched, only that
-- patient's team sees it.

drop policy "clinicians use documents" on documents;
drop policy "clinicians use ingestion" on ingestion_jobs;

create policy "clinicians use own documents" on documents
  for all using (
    is_clinician() and (patient_id is null or can_access_patient(patient_id))
  ) with check (
    is_clinician() and (patient_id is null or can_access_patient(patient_id))
  );

create policy "clinicians use own ingestion" on ingestion_jobs
  for all using (
    is_clinician() and (matched_patient is null or can_access_patient(matched_patient))
  ) with check (
    is_clinician() and (matched_patient is null or can_access_patient(matched_patient))
  );
