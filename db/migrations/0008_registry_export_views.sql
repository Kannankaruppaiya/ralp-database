-- RALP Database v2 — registry export views
--
-- The NPCA extract was built in the browser from the full patient objects and
-- shipped NHS numbers and hospital numbers in clear text, while the interface
-- described it as pseudonymised. Two different exports were being conflated:
--
--   * a national submission, which legitimately carries identifiers so NPCA can
--     link records — and must be treated as identifiable data throughout;
--   * a research or audit extract, which must not.
--
-- They are now separate views. The pseudonymised one never emits an identifier,
-- so the browser cannot leak what it is never sent.

-- Stable surrogate derived from the patient's primary key. That key is a random
-- UUID, not derived from any identifier, so the pseudonym is unguessable and
-- reveals nothing — yet stays constant across submissions, which is what makes
-- longitudinal linkage possible without the NHS number.
create or replace function patient_pseudonym(p_id uuid)
returns text language sql immutable as $$
  select 'PSN-' || upper(left(replace(p_id::text, '-', ''), 12));
$$;

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

-- Same clinical content, with the identifiers NPCA requires. Kept as a separate
-- object so that requesting identifiable data is an explicit act rather than a
-- side effect of clicking "export".
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
