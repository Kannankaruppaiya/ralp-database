-- RALP Database v2 — Storage access policies for clinical documents
--
-- documents.storage_path (0001) is where scanned operation notes and clinic
-- letters — patient PII — are meant to live in Supabase Storage. The application
-- does not upload to Storage yet (document-upload.tsx keeps the extracted text in
-- documents.raw_text, which the clinicians-only policy in 0003 already protects),
-- so nothing sensitive is in a bucket today. This migration locks the bucket down
-- ahead of that feature, so the first upload lands in a private, policy-protected
-- bucket rather than whatever a future change happens to create.
--
-- The posture mirrors the documents table in 0003: clinical staff only. If a
-- patient-facing document view is ever added, extend these with an owning-patient
-- read policy at that point, deliberately.

-- Private bucket: never served by public URL, only via a signed URL or an
-- authenticated request that satisfies the policies below.
insert into storage.buckets (id, name, public)
values ('clinical-documents', 'clinical-documents', false)
on conflict (id) do update set public = false;

-- Row level security is already enabled on storage.objects by Supabase. These
-- policies are additive and scoped to this one bucket. is_clinician() (0002) is
-- security-definer and reads the caller's role from their own profile, so a
-- signed-in patient (or anon) fails the check.
drop policy if exists "clinicians read clinical documents"   on storage.objects;
drop policy if exists "clinicians upload clinical documents" on storage.objects;
drop policy if exists "clinicians update clinical documents" on storage.objects;
drop policy if exists "clinicians delete clinical documents" on storage.objects;

create policy "clinicians read clinical documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'clinical-documents' and is_clinician());

create policy "clinicians upload clinical documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'clinical-documents' and is_clinician());

create policy "clinicians update clinical documents"
  on storage.objects for update to authenticated
  using (bucket_id = 'clinical-documents' and is_clinician())
  with check (bucket_id = 'clinical-documents' and is_clinician());

create policy "clinicians delete clinical documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'clinical-documents' and is_clinician());
