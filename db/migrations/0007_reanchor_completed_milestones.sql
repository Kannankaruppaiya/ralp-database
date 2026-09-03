-- RALP Database v2 — re-anchor completed milestones too
--
-- 0002 skipped completed rows when an operation date changed:
--
--   on conflict (patient_id, milestone) do update
--     set due_date = excluded.due_date
--     where follow_ups.status <> 'completed';
--
-- The intent was to protect a visit that had already happened. It protected the
-- wrong column. A milestone's due_date *is* "N months from surgery" — if the
-- operation date is corrected, every target moves with it, including for visits
-- already done. Leaving them behind produced records where the 6-month
-- milestone was dated four days after the operation.
--
-- What must never be rewritten is the result: status, completed_date, PSA and
-- the questionnaire scores. Those are untouched here, and always were — the
-- update statement only ever set due_date.

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
    -- Target date follows the operation unconditionally. Recorded results are
    -- not in this SET list and so survive.
    on conflict (patient_id, milestone) do update
      set due_date = excluded.due_date;
  end loop;

  perform refresh_follow_up_status(new.patient_id);
  return new;
end;
$$;

-- Repair rows already anchored to a superseded operation date.
update follow_ups f
set due_date = o.operation_date + (f.target_months || ' months')::interval
from operations o
where o.patient_id = f.patient_id
  and f.due_date <> o.operation_date + (f.target_months || ' months')::interval;

select refresh_follow_up_status(null);
