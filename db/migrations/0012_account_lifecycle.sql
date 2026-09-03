-- Accounts provisioned by an administrator start with a password the
-- administrator knows. The clinician is held at /change-password until they
-- have replaced it, so that audit_log attribution names someone who is the only
-- person able to have acted.
alter table profiles
  add column if not exists must_change_password boolean not null default false;

-- A clinician who leaves the department stops being able to sign in while
-- everything they recorded stays attributable. Null means active.
alter table profiles
  add column if not exists deactivated_at timestamptz;

comment on column profiles.must_change_password is
  'Set when an administrator provisions the account; cleared once the clinician sets their own password.';
comment on column profiles.deactivated_at is
  'Null while the account may sign in. Stamped when an administrator deactivates it.';
