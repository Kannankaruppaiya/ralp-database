-- RALP Database v2 — Phase 4: document file storage metadata
--
-- The documents table already carries storage_path (the object key). Add the
-- size and content type so a stored file can be listed and served with the
-- right headers. The bytes themselves live in the configured object store
-- (local filesystem by default, S3/MinIO later), never in the database.

alter table documents add column if not exists file_size bigint;
alter table documents add column if not exists mime_type text;
