-- RALP Database v2 — row level security
-- Default posture: deny. Clinical staff see the registry; a patient sees only
-- their own record; the audit trail is readable by governance only and writable
-- by nobody directly (the security-definer triggers in 0002 are the sole author).

alter table profiles         enable row level security;
alter table patients         enable row level security;
alter table baseline_cancer  enable row level security;
alter table operations       enable row level security;
alter table histology        enable row level security;
alter table follow_ups       enable row level security;
alter table prom_submissions enable row level security;
alter table documents        enable row level security;
alter table ingestion_jobs   enable row level security;
alter table audit_log        enable row level security;

-- ---------------------------------------------------------------- profiles

create policy "own profile readable"  on profiles for select using (id = auth.uid());
create policy "admin reads profiles"  on profiles for select using (is_admin());
create policy "admin writes profiles" on profiles for all    using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------- patients

create policy "clinicians read patients" on patients
  for select using (is_clinician());

create policy "patient reads own record" on patients
  for select using (id = (select patient_id from profiles where id = auth.uid()));

create policy "clinicians write patients" on patients
  for all using (is_clinician()) with check (is_clinician());

-- ---------------------------------------------------------------- clinical detail tables
-- Same rule for all three: staff read/write, the patient may read their own.

do $$
declare t text;
begin
  foreach t in array array['baseline_cancer','operations','histology'] loop
    execute format($p$
      create policy "clinicians read %1$s" on %1$I
        for select using (is_clinician());
      create policy "patient reads own %1$s" on %1$I
        for select using (patient_id = (select patient_id from profiles where id = auth.uid()));
      create policy "clinicians write %1$s" on %1$I
        for all using (is_clinician()) with check (is_clinician());
    $p$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------- follow-ups

create policy "clinicians read follow_ups" on follow_ups
  for select using (is_clinician());

create policy "patient reads own follow_ups" on follow_ups
  for select using (patient_id = (select patient_id from profiles where id = auth.uid()));

create policy "clinicians write follow_ups" on follow_ups
  for all using (is_clinician()) with check (is_clinician());

-- ---------------------------------------------------------------- PROMs
-- The patient portal's only write path. A patient may file their own
-- questionnaire and read it back, but never amend it after submission.

create policy "clinicians read proms" on prom_submissions
  for select using (is_clinician());

create policy "patient reads own proms" on prom_submissions
  for select using (patient_id = (select patient_id from profiles where id = auth.uid()));

create policy "patient submits own prom" on prom_submissions
  for insert with check (patient_id = (select patient_id from profiles where id = auth.uid()));

create policy "clinicians record prom" on prom_submissions
  for insert with check (is_clinician());

-- ---------------------------------------------------------------- ingestion

create policy "clinicians use documents" on documents
  for all using (is_clinician()) with check (is_clinician());

create policy "clinicians use ingestion" on ingestion_jobs
  for all using (is_clinician()) with check (is_clinician());

-- ---------------------------------------------------------------- audit trail
-- Read: governance only. No insert/update/delete policy exists, so the table is
-- append-only from the application's point of view.

create policy "admin reads audit" on audit_log for select using (is_admin());
