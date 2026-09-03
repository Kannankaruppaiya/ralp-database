-- RALP Database v2 — core schema
-- Mirrors types/*.ts one-for-one. Enum values are the exact strings the app already uses,
-- so no translation layer is needed between Postgres and TypeScript.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------- enums

-- Mirrors the Role union in config/permissions.ts. 'Data Manager' is the
-- governance role: audit inspection, user provisioning, registry exports.
create type user_role as enum (
  'Consultant Surgeon', 'Surgical Registrar', 'Clinical Nurse Specialist',
  'Data Manager', 'Patient'
);
create type surgeon_code           as enum ('VK','RDM','CI','OAK','OTHER');
create type gleason_grade          as enum ('3+3','3+4','4+3','4+4','4+5','5+4','5+5');
create type cancer_stage           as enum ('2A','2B','2C','3A','3B','4');
create type patient_status         as enum ('Active','Under Surveillance','Discharged','Deceased');
create type bladder_neck_status    as enum ('sparing','slight wide','wide needing reconstruction');
create type nerve_sparing_side     as enum ('Bilateral','Right','Left','None');
create type nerve_sparing_grade    as enum ('2/5','3/5','4/5','5/5','N/A');
create type surgical_quality_grade as enum ('Weak','Good','Excellent');
create type margin_status          as enum ('Negative (R0)','Positive (R1)','Uncertain (Rx)');
create type follow_up_milestone    as enum ('2m','6m','12m','18m','24m','30m','36m');
create type follow_up_status       as enum ('scheduled','due','overdue','completed','missed');
create type incontinence_day_status as enum (
  'Completely dry, no pad','Occasional leakage, no pad','1 pad/day','2 pads/day','>=3 pads/day'
);

-- ---------------------------------------------------------------- profiles

create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  full_name    text not null,
  email        text not null,
  role         user_role not null default 'Surgical Registrar',
  surgeon_code surgeon_code,
  gmc_number   text,
  hospital     text not null default 'Oxford University Hospitals NHS FT',
  -- set only for role = 'Patient'; links a login to the record they may read
  patient_id   uuid,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------- patients

create table patients (
  id                 uuid primary key default gen_random_uuid(),
  first_name         text not null,
  surname            text not null,
  date_of_birth      date not null,
  -- 10 digits, stored unformatted; the app formats for display
  nhs_number         text not null unique check (nhs_number ~ '^[0-9]{10}$'),
  hospital_number    text not null unique,
  phone              text,
  email              text,
  address            text,
  postcode           text,
  primary_surgeon    surgeon_code not null,
  other_surgeon_name text,
  status             patient_status not null default 'Active',
  created_by         uuid references profiles(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  search_text        text generated always as (
    first_name || ' ' || surname || ' ' || nhs_number || ' ' || hospital_number
  ) stored
);

alter table profiles add constraint profiles_patient_fk
  foreign key (patient_id) references patients(id) on delete set null;

create index patients_search_idx  on patients using gin (search_text gin_trgm_ops);
create index patients_surgeon_idx on patients (primary_surgeon);
create index patients_status_idx  on patients (status);

-- ---------------------------------------------------------------- baseline cancer

create table baseline_cancer (
  patient_id                   uuid primary key references patients on delete cascade,
  psa                          numeric(6,2) not null check (psa >= 0),
  psa_date                     date,
  gleason_grade                gleason_grade not null,
  -- ISUP grade group is a pure function of the Gleason score; set by trigger in 0002
  grade_group                  smallint,
  percent_positive_cores_worst smallint check (percent_positive_cores_worst between 1 and 100),
  percent_positive_cores_best  smallint check (percent_positive_cores_best between 1 and 100),
  ukb_score                    smallint check (ukb_score between 1 and 100),
  clinical_stage               cancer_stage not null,
  mri_pirads                   smallint check (mri_pirads between 1 and 5),
  prostate_volume_cc           numeric(5,1),
  biopsy_date                  date,
  notes                        text,
  updated_at                   timestamptz not null default now()
);

-- ---------------------------------------------------------------- operation

create table operations (
  patient_id                 uuid primary key references patients on delete cascade,
  surgeon                    surgeon_code not null,
  other_surgeon_name         text,
  assistant_name             text,
  operation_date             date not null,
  bladder_neck               bladder_neck_status not null,
  nerve_sparing              nerve_sparing_side not null,
  left_nerve_sparing_grade   nerve_sparing_grade not null default 'N/A',
  right_nerve_sparing_grade  nerve_sparing_grade not null default 'N/A',
  sphincter                  surgical_quality_grade,
  anterior_reconstruction    surgical_quality_grade,
  posterior_reconstruction   boolean not null default false,
  lymph_node_dissection      boolean not null default false,
  lymph_node_count           smallint,
  blood_loss_ml              integer check (blood_loss_ml between 0 and 5000),
  duration_minutes           integer check (duration_minutes between 0 and 1440),
  console_duration_minutes   integer,
  robot_type                 text,
  intraoperative_complications text,
  catheter_type              text,
  drain_placed               boolean not null default false,
  notes                      text,
  updated_at                 timestamptz not null default now(),
  -- a side cannot be graded if it was not spared
  constraint nerve_grade_consistent check (
    (nerve_sparing = 'None'  and left_nerve_sparing_grade = 'N/A' and right_nerve_sparing_grade = 'N/A') or
    (nerve_sparing = 'Left'  and right_nerve_sparing_grade = 'N/A') or
    (nerve_sparing = 'Right' and left_nerve_sparing_grade  = 'N/A') or
    (nerve_sparing = 'Bilateral')
  )
);

create index operations_date_idx on operations (operation_date);

-- ---------------------------------------------------------------- histology

create table histology (
  patient_id                uuid primary key references patients on delete cascade,
  report_date               date not null,
  pathologist               text,
  specimen_weight_grams     numeric(6,1),
  gleason_grade             gleason_grade not null,
  grade_group               smallint,
  tertiary_pattern          text,
  pathological_stage        cancer_stage not null,
  surgical_margins          margin_status not null,
  positive_margin_locations text[],
  margin_length_mm          numeric(5,1),
  extraprostatic_extension  boolean not null default false,
  seminal_vesicle_invasion  boolean not null default false,
  tumor_volume_percent      smallint,
  lymphovascular_invasion   boolean not null default false,
  lymph_nodes_examined      smallint,
  lymph_nodes_positive      smallint,
  notes                     text,
  updated_at                timestamptz not null default now(),
  constraint nodes_positive_lte_examined check (
    lymph_nodes_positive is null or lymph_nodes_examined is null
    or lymph_nodes_positive <= lymph_nodes_examined
  )
);

-- ---------------------------------------------------------------- follow-ups

create table follow_ups (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references patients on delete cascade,
  milestone      follow_up_milestone not null,
  target_months  smallint not null,
  due_date       date not null,
  status         follow_up_status not null default 'scheduled',
  psa            numeric(6,3) check (psa >= 0),
  psa_date       date,
  ipss_score     smallint check (ipss_score between 0 and 35),
  shim_score     smallint check (shim_score between 1 and 25),
  continence_day   incontinence_day_status,
  continence_night smallint check (continence_night between 0 and 3),
  prom_submitted boolean not null default false,
  completed_date date,
  notes          text,
  updated_at     timestamptz not null default now(),
  -- BAUS/NPCA biochemical recurrence threshold: derived, never hand-flagged
  bcr            boolean generated always as (psa >= 0.2) stored,
  unique (patient_id, milestone)
);

create index follow_ups_due_idx     on follow_ups (status, due_date);
create index follow_ups_patient_idx on follow_ups (patient_id);

-- ---------------------------------------------------------------- PROM submissions

create table prom_submissions (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references patients on delete cascade,
  milestone      text not null,
  submitted_at   timestamptz not null default now(),
  source         text not null default 'patient_portal',
  ipss_answers   jsonb,
  ipss_total     smallint check (ipss_total between 0 and 35),
  ipss_qol       smallint check (ipss_qol between 0 and 6),
  shim_answers   jsonb,
  shim_total     smallint check (shim_total between 1 and 25),
  continence_day   incontinence_day_status,
  continence_night smallint check (continence_night between 0 and 3)
);

create index prom_patient_idx on prom_submissions (patient_id, submitted_at desc);

-- ---------------------------------------------------------------- ingestion

create table documents (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid references patients on delete set null,
  title         text not null,
  source_type   text not null,           -- theatre_note | clinic_letter | google_form_csv
  storage_path  text,                    -- Supabase Storage object path
  raw_text      text,
  uploaded_by   uuid references profiles(id),
  uploaded_at   timestamptz not null default now()
);

create table ingestion_jobs (
  id               uuid primary key default gen_random_uuid(),
  document_id      uuid references documents on delete cascade,
  matched_patient  uuid references patients on delete set null,
  match_score      smallint,
  match_reasons    text[],
  status           text not null default 'review_required',
  conflict_count   smallint not null default 0,
  extracted_fields jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  resolved_at      timestamptz,
  resolved_by      uuid references profiles(id)
);

create index ingestion_status_idx on ingestion_jobs (status, created_at desc);

-- ---------------------------------------------------------------- audit trail
-- Caldicott Principle 7: append-only. Update/delete are revoked below and in RLS.

create table audit_log (
  id           bigint generated always as identity primary key,
  occurred_at  timestamptz not null default now(),
  actor_id     uuid references profiles(id),
  actor_name   text not null,
  actor_role   text not null,
  gmc_number   text,
  patient_id   uuid references patients on delete set null,
  patient_name text,
  action       text not null,
  details      text
);

create index audit_time_idx    on audit_log (occurred_at desc);
create index audit_patient_idx on audit_log (patient_id, occurred_at desc);

revoke update, delete on audit_log from authenticated, anon;
