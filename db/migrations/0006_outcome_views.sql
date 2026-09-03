-- RALP Database v2 — computed outcome measures
--
-- The analytics screens previously rendered fixed arrays. These views derive the
-- same figures from the registry, so a chart cannot disagree with the records
-- underneath it.
--
-- Definitions, stated once here so every chart uses the same ones:
--   continent  — pad-free: "Completely dry, no pad" or "Occasional leakage, no pad"
--   potent     — SHIM >= 17 (mild ED or better)
--   R1 rate    — histology.surgical_margins = 'Positive (R1)'
-- Denominators count only milestones that were actually completed, so a
-- milestone nobody has reached yet reports n = 0 rather than a flattering rate.

create or replace view outcome_recovery_curve
with (security_invoker = true) as
select
  f.milestone,
  f.target_months,
  count(*) filter (where f.continence_day is not null) as continence_n,
  count(*) filter (where f.shim_score is not null)     as potency_n,
  round(100.0 * count(*) filter (
    where f.continence_day in ('Completely dry, no pad', 'Occasional leakage, no pad')
  ) / nullif(count(*) filter (where f.continence_day is not null), 0)) as continent_pct,
  round(100.0 * count(*) filter (where f.shim_score >= 17)
        / nullif(count(*) filter (where f.shim_score is not null), 0)) as potent_pct,
  round(avg(f.psa)::numeric, 3)                        as mean_psa,
  count(*) filter (where f.bcr)                        as bcr_count
from follow_ups f
where f.status = 'completed'
group by f.milestone, f.target_months
order by f.target_months;

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

-- Registry-wide headline figures for the analytics hub.
create or replace view registry_summary
with (security_invoker = true) as
select
  (select count(*) from patients)                                   as patients,
  (select count(*) from operations)                                 as operations,
  (select count(*) from follow_ups where status = 'completed')       as completed_follow_ups,
  (select count(*) from follow_ups where status = 'overdue')         as overdue_follow_ups,
  (select count(*) from follow_ups where bcr)                        as bcr_events,
  (select round(100.0 * count(*) filter (where surgical_margins = 'Positive (R1)')
                / nullif(count(*), 0), 1) from histology)            as margin_positive_rate;
