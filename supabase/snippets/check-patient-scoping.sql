-- Runnable check for 0011_patient_scoping.sql. Everything happens inside a
-- transaction that is rolled back, so it is safe against any environment.
--
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/snippets/check-patient-scoping.sql
--
-- Fails loudly (assertion error) if a doctor can see a colleague's patient.

begin;

do $$
declare
  vk   uuid := '11111111-1111-1111-1111-111111111111';  -- Consultant, code VK
  rdm  uuid := '22222222-2222-2222-2222-222222222222';  -- Consultant, code RDM
  reg  uuid := '33333333-3333-3333-3333-333333333333';  -- Registrar, no code
  p_vk uuid;
  p_reg uuid;
  seen int;
begin
  insert into auth.users (instance_id, id, aud, role, email)
  values ('00000000-0000-0000-0000-000000000000', vk,  'authenticated', 'authenticated', 'vk@test.invalid'),
         ('00000000-0000-0000-0000-000000000000', rdm, 'authenticated', 'authenticated', 'rdm@test.invalid'),
         ('00000000-0000-0000-0000-000000000000', reg, 'authenticated', 'authenticated', 'reg@test.invalid')
  on conflict (id) do nothing;

  insert into profiles (id, full_name, email, role, surgeon_code) values
    (vk,  'Test VK',  'vk@test.invalid',  'Consultant Surgeon', 'VK'),
    (rdm, 'Test RDM', 'rdm@test.invalid', 'Consultant Surgeon', 'RDM'),
    (reg, 'Test Reg', 'reg@test.invalid', 'Surgical Registrar', null)
  on conflict (id) do update set role = excluded.role, surgeon_code = excluded.surgeon_code;

  -- VK's patient, and one the codeless registrar entered onto RDM's list.
  insert into patients (first_name, surname, date_of_birth, nhs_number, hospital_number,
                        primary_surgeon, created_by)
  values ('Scope', 'AlphaVK', '1960-01-01', '9990000001', 'SCOPE-A', 'VK', vk)
  returning id into p_vk;

  insert into patients (first_name, surname, date_of_birth, nhs_number, hospital_number,
                        primary_surgeon, created_by)
  values ('Scope', 'BetaRDM', '1960-01-01', '9990000002', 'SCOPE-B', 'RDM', reg)
  returning id into p_reg;

  -- can_access_patient() is the predicate every child-table policy uses, so
  -- asserting it is asserting the whole scoping rule.
  perform set_config('request.jwt.claims', json_build_object('sub', vk)::text, true);
  assert     can_access_patient(p_vk),  'VK cannot see their own patient';
  assert not can_access_patient(p_reg), 'VK can see RDM''s patient — scoping is not enforced';

  perform set_config('request.jwt.claims', json_build_object('sub', rdm)::text, true);
  assert     can_access_patient(p_reg), 'RDM cannot see their own patient';
  assert not can_access_patient(p_vk),  'RDM can see VK''s patient — scoping is not enforced';

  -- A codeless registrar keeps the record they entered, and nothing else.
  perform set_config('request.jwt.claims', json_build_object('sub', reg)::text, true);
  assert     can_access_patient(p_reg), 'registrar lost the record they created';
  assert not can_access_patient(p_vk),  'codeless registrar can see the whole registry';

  assert not can_access_patient(null),  'null patient id is not access';

  -- And the table policy itself, not just the helper.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', vk)::text, true);
  select count(*) into seen from patients where id in (p_vk, p_reg);
  assert seen = 1, format('VK sees %s of the 2 test patients through RLS, expected 1', seen);

  reset role;
  raise notice 'patient scoping OK';
end $$;

rollback;
