-- RALP Database v2 — surgeon codes become data, not a type
--
-- 0001 declared the roster as `create type surgeon_code as enum
-- ('VK','RDM','CI','OAK','OTHER')`. That made the list of surgeons part of the
-- schema, so provisioning a colleague who was not one of those five failed at
-- the API with "Choose a valid surgeon code", and adding one needed a
-- migration and a deploy. The enum was doing two jobs: naming the roster, and
-- rejecting malformed codes. Only the second belongs in the schema, and stays
-- here as a check constraint; the roster becomes ordinary data.

-- Postgres refuses to alter a column's type while a view selects it, so the
-- three views over these columns are dropped and recreated verbatim below.
-- Order matters: registry_export_identifiable selects from the pseudonymised one.
drop view if exists registry_export_identifiable;
drop view if exists registry_export_pseudonymised;
drop view if exists surgeon_benchmark;

-- Same reason, for policies: 0011's caseload scoping compares
-- patients.primary_surgeon against profiles.surgeon_code, so both policies are
-- dropped here and recreated verbatim below. can_access_patient() is left
-- alone — its body is an unparsed string literal, so it is not type-locked —
-- but it is re-created below anyway so a bad comparison would fail here rather
-- than at query time.
drop policy if exists "clinicians read own patients"  on patients;
drop policy if exists "clinicians write own patients" on patients;

alter table profiles   alter column surgeon_code    type text using surgeon_code::text;
alter table patients   alter column primary_surgeon type text using primary_surgeon::text;
alter table operations alter column surgeon         type text using surgeon::text;

drop type surgeon_code;

-- The half of the enum worth keeping. Codes are typed by hand into an admin
-- form, so this is a trust boundary: a code is initials, uppercase, 2-8 chars.
-- 'OTHER' (visiting/locum consultant) still satisfies it.
alter table profiles   add constraint profiles_surgeon_code_format
  check (surgeon_code is null or surgeon_code ~ '^[A-Z][A-Z0-9]{1,7}$');
alter table patients   add constraint patients_primary_surgeon_format
  check (primary_surgeon ~ '^[A-Z][A-Z0-9]{1,7}$');
alter table operations add constraint operations_surgeon_format
  check (surgeon ~ '^[A-Z][A-Z0-9]{1,7}$');

-- Who may be picked as a surgeon. Derived rather than configured: a code is on
-- the roster once someone holds it on their profile, or once a patient or
-- operation is already assigned to it. Deriving it means there is no second
-- list to keep in step with the accounts admins actually provision, and codes
-- belonging to surgeons who have since left keep resolving in the filters and
-- historical reports instead of disappearing.
--
-- security definer because 0003 lets a clinician read only their own profile
-- row and 0011 narrows patients to their own caseload — neither can answer
-- "who else could I assign this patient to". Only the code and the display
-- name cross that boundary; no patient data does.
create or replace function surgeon_roster()
returns table (code text, full_name text)
language sql stable security definer set search_path = public as $$
  select r.code, coalesce(max(r.full_name), r.code) as full_name
  from (
    select surgeon_code   as code, full_name from profiles where surgeon_code is not null
    union all
    select primary_surgeon as code, null::text  from patients
    union all
    select surgeon         as code, null::text  from operations
  ) r
  group by r.code
  order by r.code;
$$;

revoke execute on function surgeon_roster() from public;
grant  execute on function surgeon_roster() to authenticated;

-- ---------------------------------------------------------------- policies, verbatim from 0011

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

create policy "clinicians read own patients" on patients
  for select using (
    is_clinician() and (
      is_admin()
      or created_by = auth.uid()
      or primary_surgeon = (select surgeon_code from profiles where id = auth.uid())
    )
  );

create policy "clinicians write own patients" on patients
  for all using (
    is_clinician() and (
      is_admin()
      or created_by = auth.uid()
      or primary_surgeon = (select surgeon_code from profiles where id = auth.uid())
    )
  ) with check (is_clinician());

-- ---------------------------------------------------------------- views, verbatim from 0006 / 0008

create or replace view surgeon_benchmark
with (security_invoker = true) as
with caseload as (
  select o.surgeon, count(*) as cases, array_agg(o.patient_id) as ids
  from operations o
  group by o.surgeon
),
functional as (
  -- One year is the conventional reporting point for both outcomes.
  select o.surgeon,
         count(*) filter (where f.continence_day is not null) as cont_n,
         count(*) filter (
           where f.continence_day in ('Completely dry, no pad', 'Occasional leakage, no pad')
         ) as cont_ok,
         count(*) filter (where f.shim_score is not null)     as pot_n,
         count(*) filter (where f.shim_score >= 17)           as pot_ok
  from operations o
  join follow_ups f on f.patient_id = o.patient_id and f.milestone = '12m'
  group by o.surgeon
),
margins as (
  select o.surgeon,
         count(h.patient_id) as histology_n,
         count(*) filter (where h.surgical_margins = 'Positive (R1)') as r1
  from operations o
  join histology h on h.patient_id = o.patient_id
  group by o.surgeon
)
select
  c.surgeon,
  c.cases                                                        as caseload,
  coalesce(fn.cont_n, 0)                                         as continence_n,
  round(100.0 * fn.cont_ok / nullif(fn.cont_n, 0))               as continence_rate,
  coalesce(fn.pot_n, 0)                                          as potency_n,
  round(100.0 * fn.pot_ok / nullif(fn.pot_n, 0))                 as potency_rate,
  coalesce(m.histology_n, 0)                                     as histology_n,
  round(100.0 * m.r1 / nullif(m.histology_n, 0), 1)              as margin_positive_rate
from caseload c
left join functional fn on fn.surgeon = c.surgeon
left join margins    m  on m.surgeon  = c.surgeon
order by c.surgeon;

create or replace view registry_export_pseudonymised
with (security_invoker = true) as
select
  patient_pseudonym(p.id)                       as pseudonym,
  extract(year from age(current_date, p.date_of_birth))::int as age,
  p.primary_surgeon,
  p.status,
  b.psa                                         as preop_psa,
  b.gleason_grade                               as biopsy_gleason,
  b.grade_group                                 as biopsy_grade_group,
  b.clinical_stage,
  b.ukb_score,
  o.operation_date,
  o.surgeon                                     as operating_surgeon,
  o.bladder_neck,
  o.nerve_sparing,
  o.blood_loss_ml,
  o.duration_minutes,
  h.pathological_stage,
  h.gleason_grade                               as histology_gleason,
  h.surgical_margins,
  h.extraprostatic_extension,
  h.seminal_vesicle_invasion,
  f12.continence_day                            as continence_12m,
  f12.shim_score                                as shim_12m,
  f12.ipss_score                                as ipss_12m,
  f12.psa                                       as psa_12m
from patients p
left join baseline_cancer b on b.patient_id = p.id
left join operations      o on o.patient_id = p.id
left join histology       h on h.patient_id = p.id
left join follow_ups    f12 on f12.patient_id = p.id and f12.milestone = '12m';

create or replace view registry_export_identifiable
with (security_invoker = true) as
select
  p.nhs_number,
  p.hospital_number,
  p.first_name,
  p.surname,
  p.date_of_birth,
  e.*
from patients p
join registry_export_pseudonymised e
  on e.pseudonym = patient_pseudonym(p.id);
