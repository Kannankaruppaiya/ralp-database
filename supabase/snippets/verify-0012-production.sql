-- Independent post-migration check. Deliberately re-reads catalogue state
-- rather than trusting the NOTICEs the apply transaction printed about itself.
-- The one write is inside a transaction that always rolls back.

\echo '=== migration history tail ==='
select version, name from supabase_migrations.schema_migrations order by version desc limit 3;

\echo '=== enum gone, column types now text ==='
select
  (select count(*) from pg_type where typname = 'surgeon_code') as enum_should_be_0,
  (select data_type from information_schema.columns
     where table_name='profiles'   and column_name='surgeon_code')    as profiles_type,
  (select data_type from information_schema.columns
     where table_name='patients'   and column_name='primary_surgeon') as patients_type,
  (select data_type from information_schema.columns
     where table_name='operations' and column_name='surgeon')         as operations_type;

\echo '=== roster function, callable by authenticated ==='
select * from surgeon_roster();
select has_function_privilege('authenticated', 'surgeon_roster()', 'execute') as authenticated_may_call;

\echo '=== scoping policies and views survived the recreate ==='
select tablename, policyname from pg_policies
 where tablename='patients' and policyname like 'clinicians%own patients' order by policyname;
select viewname from pg_views
 where viewname in ('surgeon_benchmark','registry_export_pseudonymised','registry_export_identifiable')
 order by viewname;

\echo '=== the actual bug: a code that used to be rejected ==='
begin;
  update profiles set surgeon_code = 'JD' where surgeon_code = 'VK';
  select 'JD accepted' as result, (select count(*) from surgeon_roster() where code='JD') as on_roster;
rollback;

\echo '=== malformed codes still refused ==='
do $$
declare bad text; rejected int := 0;
begin
  foreach bad in array array['jd','J','J-D','TOOLONGCODE'] loop
    begin
      update profiles set surgeon_code = bad where surgeon_code = 'VK';
      raise warning 'LEAK: % was accepted', bad;
    exception when check_violation then rejected := rejected + 1;
    end;
  end loop;
  raise notice '%/4 malformed codes rejected by the check constraints', rejected;
end $$;
