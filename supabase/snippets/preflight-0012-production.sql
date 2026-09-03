-- Read-only. What does production actually look like before 0012?
-- Nothing here writes; it is safe to run against the live registry.

\echo '=== migration history ==='
select version, name from supabase_migrations.schema_migrations order by version;

\echo '=== schema state ==='
select
  (select count(*) from pg_type   where typname = 'surgeon_code')                  as enum_present,
  (select count(*) from pg_policies
     where tablename = 'patients' and policyname like 'clinicians%own patients')   as scoping_policies,
  (select count(*) from pg_views
     where viewname in ('surgeon_benchmark',
                        'registry_export_pseudonymised',
                        'registry_export_identifiable'))                           as views,
  (select count(*) from patients)                                                  as patients,
  (select count(*) from profiles)                                                  as profiles,
  (select count(*) from operations)                                                as operations;

\echo '=== surgeon codes in use ==='
select c as code, count(*) as row_count
from (
  select surgeon_code::text   as c from profiles where surgeon_code is not null
  union all select primary_surgeon::text from patients
  union all select surgeon::text         from operations
) v
group by c order by c;

\echo '=== would any existing code fail the new format check? ==='
select coalesce(string_agg(distinct c, ', '), 'NONE - safe to migrate') as bad_codes
from (
  select surgeon_code::text   as c from profiles where surgeon_code is not null
  union all select primary_surgeon::text from patients
  union all select surgeon::text         from operations
) v
where c !~ '^[A-Z][A-Z0-9]{1,7}$';
