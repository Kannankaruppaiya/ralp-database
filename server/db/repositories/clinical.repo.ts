import 'server-only';
import type { PoolClient } from 'pg';

/**
 * Follow-ups, PROM submissions and the audit trail. Rows come back in the same
 * shape the mappers expect. Scheduling, PROM→milestone closure and audit writes
 * remain the database's job (triggers and functions) — this layer only reads and
 * writes rows and calls those functions.
 */

// Follow-ups joined to their patient (the old query embedded patients!inner).
export async function listFollowUps(client: PoolClient, status?: string) {
  const params: unknown[] = [];
  let where = '';
  if (status) { params.push(status); where = 'where f.status = $1'; }
  const res = await client.query(
    `select
       f.*,
       jsonb_build_object(
         'id', p.id, 'first_name', p.first_name, 'surname', p.surname,
         'date_of_birth', p.date_of_birth, 'nhs_number', p.nhs_number,
         'hospital_number', p.hospital_number, 'phone', p.phone, 'email', p.email,
         'address', p.address, 'postcode', p.postcode, 'primary_surgeon', p.primary_surgeon,
         'other_surgeon_name', p.other_surgeon_name, 'status', p.status,
         'created_at', p.created_at, 'updated_at', p.updated_at,
         'baseline_cancer', (select to_jsonb(b) from baseline_cancer b where b.patient_id = p.id),
         'operations', (select to_jsonb(o) from operations o where o.patient_id = p.id),
         'histology', (select to_jsonb(h) from histology h where h.patient_id = p.id),
         'follow_ups', coalesce((select jsonb_agg(f2 order by f2.target_months) from follow_ups f2 where f2.patient_id = p.id), '[]'::jsonb)
       ) as patients
     from follow_ups f
     join patients p on p.id = f.patient_id
     ${where}
     order by f.due_date`,
    params
  );
  return res.rows;
}

export async function upsertFollowUp(client: PoolClient, row: Record<string, unknown>) {
  const cols = Object.keys(row);
  const placeholders = cols.map((_, i) => `$${i + 1}`);
  const updates = cols
    .filter((c) => c !== 'patient_id' && c !== 'milestone')
    .map((c) => `${c} = excluded.${c}`);
  await client.query(
    `insert into follow_ups (${cols.join(', ')}) values (${placeholders.join(', ')})
     on conflict (patient_id, milestone) do update set ${updates.join(', ')}`,
    cols.map((c) => row[c])
  );
}

export async function refreshFollowUpStatus(client: PoolClient, patientId: string | null) {
  await client.query('select refresh_follow_up_status($1)', [patientId]);
}

export async function insertProm(client: PoolClient, row: Record<string, unknown>) {
  const cols = Object.keys(row);
  const placeholders = cols.map((_, i) => `$${i + 1}`);
  await client.query(
    `insert into prom_submissions (${cols.join(', ')}) values (${placeholders.join(', ')})`,
    cols.map((c) => row[c])
  );
}

// ---------------------------------------------------------------- audit
export async function writeAudit(
  client: PoolClient, action: string, patientId: string | null, details: string | null
) {
  await client.query('select write_audit($1, $2, $3)', [action, patientId, details]);
}

export async function listAudit(client: PoolClient, limit: number) {
  const res = await client.query(
    'select * from audit_log order by occurred_at desc limit $1',
    [limit]
  );
  return res.rows;
}
