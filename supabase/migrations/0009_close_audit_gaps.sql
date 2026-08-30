-- RALP Database v2 — close the audit-coverage and delete-safety gaps
--
-- Findings from the production-readiness review:
--   DG-01  Patient-record changes were audited only by a best-effort client call,
--          so a direct PostgREST write left no trail. The trail must be a database
--          guarantee, not an application convention.
--   DG-03  Any clinician could DELETE a patient, cascade-wiping every clinical
--          row, unlogged and irreversible.
--   DG-05  Role changes (privilege escalation to Data Manager) were not audited.
--
-- The existing audit_clinical_change() keys off new.patient_id, which the
-- patients/profiles/ingestion tables do not have, so each gets a purpose-built
-- trigger below. All of them route through write_audit(), which takes the actor
-- from auth.uid() inside a security-definer function — the caller cannot forge it.

-- ---------------------------------------------------------------- patients
-- On DELETE the row is gone within the transaction, so the audit row must not
-- reference it (the FK would fail) — identity is preserved in the details text.

create or replace function audit_patient_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform write_audit(
      'PATIENTS_DELETE', null,
      'Deleted patient ' || old.surname || ', ' || old.first_name ||
      ' (nhs ' || old.nhs_number || ', id ' || old.id || ')'
    );
    return old;
  end if;

  perform write_audit('PATIENTS_' || tg_op, new.id, tg_op || ' on patient record');
  return new;
end;
$$;

create trigger t_audit_patients
  after insert or update or delete on patients
  for each row execute function audit_patient_change();

-- ---------------------------------------------------------------- documents
-- Uploaded theatre notes / clinic letters hold extracted PII in raw_text.

create or replace function audit_document_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform write_audit(
    'DOCUMENTS_' || tg_op,
    coalesce(new.patient_id, old.patient_id),
    tg_op || ' on ingested document'
  );
  return coalesce(new, old);
end;
$$;

create trigger t_audit_documents
  after insert or update or delete on documents
  for each row execute function audit_document_change();

-- ---------------------------------------------------------------- ingestion jobs

create or replace function audit_ingestion_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform write_audit(
    'INGESTION_' || tg_op,
    coalesce(new.matched_patient, old.matched_patient),
    tg_op || ' on ingestion job'
  );
  return coalesce(new, old);
end;
$$;

create trigger t_audit_ingestion
  after insert or update or delete on ingestion_jobs
  for each row execute function audit_ingestion_change();

-- ---------------------------------------------------------------- profiles
-- Only privilege-relevant changes are recorded: the role a login carries, and
-- the patient a 'Patient' login is bound to. Both decide what data is reachable.

create or replace function audit_profile_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     or new.patient_id is distinct from old.patient_id then
    perform write_audit(
      'PROFILE_ACCESS_CHANGE', new.patient_id,
      'Profile ' || new.id ||
      ' role ' || coalesce(old.role::text, 'none') || ' -> ' || coalesce(new.role::text, 'none') ||
      ', patient link ' || coalesce(old.patient_id::text, 'none') || ' -> ' || coalesce(new.patient_id::text, 'none')
    );
  end if;
  return new;
end;
$$;

create trigger t_audit_profiles
  after update on profiles
  for each row execute function audit_profile_change();

-- The new trigger functions are fired by the trigger machinery, which does not
-- check EXECUTE. Keep them off the published RPC surface, consistent with 0005.
revoke execute on function audit_patient_change()   from public;
revoke execute on function audit_document_change()  from public;
revoke execute on function audit_ingestion_change() from public;
revoke execute on function audit_profile_change()   from public;

-- ---------------------------------------------------------------- DG-03: delete safety
-- Splitting the blanket FOR ALL policy so clinicians keep insert/update but can
-- no longer delete a patient. Deletion (e.g. an erroneously created record) is a
-- governance action, restricted to Data Managers and now captured by the audit
-- trigger above. Withdrawal of care uses the 'Deceased'/'Discharged' status, not
-- a row delete.

drop policy "clinicians write patients" on patients;

create policy "clinicians insert patients" on patients
  for insert with check (is_clinician());

create policy "clinicians update patients" on patients
  for update using (is_clinician()) with check (is_clinician());

create policy "admin deletes patients" on patients
  for delete using (is_admin());
