-- System-wide configuration for the RALP registry.
-- One row per key; the full set is always read and written together.
-- RLS: only the Data Manager role may read or write.

create table if not exists system_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table system_settings enable row level security;

create policy "data_manager_read_settings"
  on system_settings for select
  using (
    (select role from profiles where id = auth.uid()) = 'Data Manager'
  );

create policy "data_manager_write_settings"
  on system_settings for all
  using  ((select role from profiles where id = auth.uid()) = 'Data Manager')
  with check ((select role from profiles where id = auth.uid()) = 'Data Manager');

-- Seed defaults so a GET before the first POST is never empty
insert into system_settings (key, value) values
  ('trust_name',          'Oxford University Hospitals NHS Foundation Trust'),
  ('hospital_prefix',     'RALP-'),
  ('lead_surgeon_code',   'VK'),
  ('notify_api_key',      ''),
  ('auto_dispatch_proms', 'true')
on conflict (key) do nothing;