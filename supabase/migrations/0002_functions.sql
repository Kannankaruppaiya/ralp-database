-- RALP Database v2 — server-side logic
-- Anything the client could get wrong (schedule dates, status ageing, completeness,
-- grade groups) is computed here so every writer sees the same answer.

-- ---------------------------------------------------------------- helpers

create or replace function current_profile()
returns profiles language sql stable security definer set search_path = public as $$
  select * from profiles where id = auth.uid();
$$;

create or replace function is_clinician()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('Consultant Surgeon','Surgical Registrar','Clinical Nurse Specialist',
                   'Data Manager')
  );
$$;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'Data Manager');
$$;

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger t_patients_touch        before update on patients        for each row execute function touch_updated_at();
create trigger t_baseline_touch        before update on baseline_cancer for each row execute function touch_updated_at();
create trigger t_operations_touch      before update on operations      for each row execute function touch_updated_at();
create trigger t_histology_touch       before update on histology       for each row execute function touch_updated_at();
create trigger t_follow_ups_touch      before update on follow_ups      for each row execute function touch_updated_at();

-- ---------------------------------------------------------------- follow-up scheduling
-- The 7 client-specified milestones. Recording (or amending) an operation date
-- re-anchors the whole schedule; already-captured results are preserved.

create or replace function schedule_follow_ups()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m record;
begin
  if tg_op = 'UPDATE' and new.operation_date = old.operation_date then
    return new;
  end if;

  for m in select * from (values (2),(6),(12),(18),(24),(30),(36)) as t(months) loop
    insert into follow_ups (patient_id, milestone, target_months, due_date, status)
    values (
      new.patient_id,
      (m.months || 'm')::follow_up_milestone,
      m.months,
      new.operation_date + (m.months || ' months')::interval,
      'scheduled'
    )
    on conflict (patient_id, milestone) do update
      set due_date = excluded.due_date
      -- never demote a visit that already happened
      where follow_ups.status <> 'completed';
  end loop;

  perform refresh_follow_up_status(new.patient_id);
  return new;
end;
$$;

create trigger t_operations_schedule
  after insert or update of operation_date on operations
  for each row execute function schedule_follow_ups();

-- Ages 'scheduled' -> 'due' (within 30 days) -> 'overdue' (past due date).
-- Call for one patient, or with null to sweep the whole registry (nightly cron).
create or replace function refresh_follow_up_status(p_patient uuid default null)
returns void language sql security definer set search_path = public as $$
  update follow_ups set status = case
      when due_date <  current_date                        then 'overdue'::follow_up_status
      when due_date <= current_date + interval '30 days'   then 'due'::follow_up_status
      else 'scheduled'::follow_up_status
    end
  where status <> 'completed'
    and (p_patient is null or patient_id = p_patient);
$$;

-- ---------------------------------------------------------------- PROM -> follow-up sync
-- A patient submitting their questionnaire closes the matching milestone.

create or replace function apply_prom_to_follow_up()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update follow_ups set
    ipss_score       = coalesce(new.ipss_total, ipss_score),
    shim_score       = coalesce(new.shim_total, shim_score),
    continence_day   = coalesce(new.continence_day, continence_day),
    continence_night = coalesce(new.continence_night, continence_night),
    prom_submitted   = true,
    status           = 'completed',
    completed_date   = current_date
  where patient_id = new.patient_id
    and milestone::text = new.milestone;
  return new;
end;
$$;

create trigger t_prom_sync
  after insert on prom_submissions
  for each row execute function apply_prom_to_follow_up();

-- ---------------------------------------------------------------- completeness
-- Same weighting the app used client-side, now single-sourced in the database.

create or replace view patient_completeness as
select
  p.id as patient_id,
  (b.patient_id is not null) as baseline_complete,
  (o.patient_id is not null) as operation_complete,
  (h.patient_id is not null) as histology_complete,
  coalesce(f.completed, 0)   as follow_ups_complete,
  20
    + case when b.patient_id is not null then 25 else 0 end
    + case when o.patient_id is not null then 25 else 0 end
    + case when h.patient_id is not null then 20 else 0 end
    + least(10, round(coalesce(f.completed, 0)::numeric / 7 * 10))::int
  as score
from patients p
left join baseline_cancer b on b.patient_id = p.id
left join operations      o on o.patient_id = p.id
left join histology       h on h.patient_id = p.id
left join lateral (
  select count(*) as completed from follow_ups
  where patient_id = p.id and status = 'completed'
) f on true;

-- ---------------------------------------------------------------- search
-- Backs the "search patients" requirement: name, NHS number or hospital number,
-- trigram-matched so partial and mistyped input still finds the record.

create or replace function search_patients(q text, lim int default 25)
returns setof patients language sql stable security definer set search_path = public as $$
  select * from patients
  where is_clinician()
    and (q is null or q = '' or search_text ilike '%' || replace(q, ' ', '') || '%'
         or search_text ilike '%' || q || '%')
  order by similarity(search_text, q) desc nulls last, surname
  limit lim;
$$;

-- ---------------------------------------------------------------- audit
-- Every clinical mutation writes one immutable row. Actor identity comes from the
-- session, not the caller's payload, so it cannot be spoofed by the client.

create or replace function write_audit(
  p_action text, p_patient uuid default null, p_details text default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  me profiles;
  pname text;
begin
  select * into me from profiles where id = auth.uid();
  select first_name || ' ' || surname into pname from patients where id = p_patient;

  insert into audit_log (actor_id, actor_name, actor_role, gmc_number,
                         patient_id, patient_name, action, details)
  values (auth.uid(), coalesce(me.full_name, 'system'), coalesce(me.role::text, 'system'),
          me.gmc_number, p_patient, pname, p_action, p_details);
end;
$$;

create or replace function audit_clinical_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pid uuid := coalesce(new.patient_id, old.patient_id);
begin
  perform write_audit(upper(tg_table_name) || '_' || tg_op, pid,
                      tg_op || ' on ' || tg_table_name);
  return coalesce(new, old);
end;
$$;

create trigger t_audit_baseline   after insert or update or delete on baseline_cancer  for each row execute function audit_clinical_change();
create trigger t_audit_operations after insert or update or delete on operations       for each row execute function audit_clinical_change();
create trigger t_audit_histology  after insert or update or delete on histology        for each row execute function audit_clinical_change();
create trigger t_audit_followups  after update           on follow_ups                 for each row execute function audit_clinical_change();
create trigger t_audit_proms      after insert           on prom_submissions           for each row execute function audit_clinical_change();

-- ---------------------------------------------------------------- new user bootstrap

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'Surgical Registrar')
  );
  return new;
end;
$$;

create trigger t_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
