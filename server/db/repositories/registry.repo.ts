import 'server-only';
import type { PoolClient } from 'pg';

/**
 * Read access to the computed views (outcomes, registry summary, exports) and to
 * documents and ingestion jobs. The heavy lifting is in the database views
 * (db/migrations/0006, 0008); this layer only selects from them.
 */

export async function recoveryCurve(client: PoolClient) {
  const res = await client.query('select * from outcome_recovery_curve order by target_months');
  return res.rows;
}

export async function surgeonBenchmark(client: PoolClient) {
  const res = await client.query('select * from surgeon_benchmark');
  return res.rows;
}

export async function registrySummary(client: PoolClient) {
  const res = await client.query('select * from registry_summary');
  return res.rows[0] ?? null;
}

export async function exportPseudonymised(client: PoolClient) {
  const res = await client.query('select * from registry_export_pseudonymised order by pseudonym');
  return res.rows;
}

export async function exportIdentifiable(client: PoolClient) {
  const res = await client.query('select * from registry_export_identifiable order by surname');
  return res.rows;
}

export async function listDocuments(client: PoolClient, patientId: string) {
  const res = await client.query(
    'select * from documents where patient_id = $1 order by uploaded_at desc',
    [patientId]
  );
  return res.rows;
}

// Ingestion jobs with their document and matched patient embedded, matching the
// shape toIngestionJob() expects.
export async function listIngestionJobs(client: PoolClient) {
  const res = await client.query(
    `select
       j.*,
       (select to_jsonb(d) from documents d where d.id = j.document_id) as documents,
       (select jsonb_build_object(
          'id', p.id, 'first_name', p.first_name, 'surname', p.surname,
          'nhs_number', p.nhs_number, 'hospital_number', p.hospital_number,
          'date_of_birth', p.date_of_birth)
        from patients p where p.id = j.matched_patient) as patients
     from ingestion_jobs j
     order by j.created_at desc`
  );
  return res.rows;
}

export async function saveIngestionJob(client: PoolClient, job: {
  id?: string; documentId?: string | null; matchedPatientId?: string | null;
  matchScore?: number | null; matchReasons?: string[] | null; status?: string;
  conflictCount?: number; extractedFields?: unknown;
}) {
  // jsonb must be passed as a JSON string, or node-postgres would encode a JS
  // array as a Postgres array literal instead.
  const extracted = JSON.stringify(job.extractedFields ?? []);
  const values = [
    job.documentId ?? null, job.matchedPatientId ?? null, job.matchScore ?? null,
    job.matchReasons ?? null, job.status ?? 'review_required', job.conflictCount ?? 0, extracted,
  ];

  if (job.id) {
    await client.query(
      `insert into ingestion_jobs
         (id, document_id, matched_patient, match_score, match_reasons, status, conflict_count, extracted_fields)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (id) do update set
         document_id = excluded.document_id, matched_patient = excluded.matched_patient,
         match_score = excluded.match_score, match_reasons = excluded.match_reasons,
         status = excluded.status, conflict_count = excluded.conflict_count,
         extracted_fields = excluded.extracted_fields`,
      [job.id, ...values]
    );
  } else {
    await client.query(
      `insert into ingestion_jobs
         (document_id, matched_patient, match_score, match_reasons, status, conflict_count, extracted_fields)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      values
    );
  }
}
