import 'server-only';
import type { PoolClient } from 'pg';

/**
 * Patient data access. Each query returns rows in the same nested shape the old
 * PostgREST embed produced (`baseline_cancer`, `operations`, `histology` as
 * objects; `follow_ups`, `prom_submissions` as arrays), so the existing mappers
 * in lib/mappers.ts consume the output unchanged.
 */

// Full record — includes PROM submissions (single-patient view).
const FULL = `
  p.*,
  (select to_jsonb(b) from baseline_cancer b where b.patient_id = p.id) as baseline_cancer,
  (select to_jsonb(o) from operations o where o.patient_id = p.id) as operations,
  (select to_jsonb(h) from histology h where h.patient_id = p.id) as histology,
  coalesce((select jsonb_agg(f order by f.target_months) from follow_ups f where f.patient_id = p.id), '[]'::jsonb) as follow_ups,
  coalesce((select jsonb_agg(pr order by pr.submitted_at desc) from prom_submissions pr where pr.patient_id = p.id), '[]'::jsonb) as prom_submissions
`;

// List record — omits PROM submissions, matching the old LIST_PATIENT select.
const LIST = `
  p.*,
  (select to_jsonb(b) from baseline_cancer b where b.patient_id = p.id) as baseline_cancer,
  (select to_jsonb(o) from operations o where o.patient_id = p.id) as operations,
  (select to_jsonb(h) from histology h where h.patient_id = p.id) as histology,
  coalesce((select jsonb_agg(f order by f.target_months) from follow_ups f where f.patient_id = p.id), '[]'::jsonb) as follow_ups
`;

export interface ListFilters {
  searchTerm?: string;   // already sanitised by the service
  searchDigits?: string; // NHS/hospital-number digits, already sanitised
  surgeon?: string;      // primary_surgeon, or undefined for all
  status?: string;       // patient status, or undefined for all
  limit: number;
  offset: number;
}

export async function listPatients(client: PoolClient, f: ListFilters) {
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (v: unknown) => { params.push(v); return `$${params.length}`; };

  if (f.searchTerm && f.searchTerm.length >= 2) {
    const clauses = [`p.search_text ilike '%' || ${add(f.searchTerm)} || '%'`];
    if (f.searchDigits && f.searchDigits.length >= 3) {
      clauses.push(`p.search_text ilike '%' || ${add(f.searchDigits)} || '%'`);
    }
    where.push(`(${clauses.join(' or ')})`);
  }
  if (f.surgeon) where.push(`p.primary_surgeon = ${add(f.surgeon)}`);
  if (f.status) where.push(`p.status = ${add(f.status)}`);

  const whereSql = where.length ? `where ${where.join(' and ')}` : '';

  const totalRes = await client.query(
    `select count(*)::int as total from patients p ${whereSql}`,
    params
  );

  const limitParam = add(f.limit);
  const offsetParam = add(f.offset);
  const rows = await client.query(
    `select ${LIST} from patients p ${whereSql} order by p.surname ${limitParam ? `limit ${limitParam}` : ''} offset ${offsetParam}`,
    params
  );

  return { rows: rows.rows, total: totalRes.rows[0].total as number };
}

export async function getPatientById(client: PoolClient, id: string) {
  const res = await client.query(`select ${FULL} from patients p where p.id = $1`, [id]);
  return res.rows[0] ?? null;
}

export async function insertPatient(client: PoolClient, d: {
  firstName?: string; surname?: string; dateOfBirth?: string; nhsNumber: string;
  hospitalNumber?: string; phone?: string | null; email?: string | null;
  address?: string | null; postcode?: string | null; primarySurgeon?: string;
  otherSurgeonName?: string | null;
}) {
  const res = await client.query(
    `insert into patients
       (first_name, surname, date_of_birth, nhs_number, hospital_number, phone, email,
        address, postcode, primary_surgeon, other_surgeon_name)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     returning id`,
    [
      d.firstName, d.surname, d.dateOfBirth, d.nhsNumber, d.hospitalNumber,
      d.phone ?? null, d.email ?? null, d.address ?? null, d.postcode ?? null,
      d.primarySurgeon, d.otherSurgeonName ?? null,
    ]
  );
  return res.rows[0].id as string;
}

/** Applies only the provided columns; `patch` is a snake_case column→value map. */
export async function updatePatient(client: PoolClient, id: string, patch: Record<string, unknown>) {
  const keys = Object.keys(patch);
  if (keys.length === 0) return;
  const sets = keys.map((k, i) => `${k} = $${i + 2}`);
  await client.query(
    `update patients set ${sets.join(', ')} where id = $1`,
    [id, ...keys.map((k) => patch[k])]
  );
}

/**
 * Updates a one-row clinical section, inserting it only if absent — the same
 * update-then-insert the old client used, because an upsert compiles to
 * INSERT ... ON CONFLICT and fails the NOT NULL checks on a partial patch.
 */
export async function upsertSection(
  client: PoolClient,
  table: 'baseline_cancer' | 'operations' | 'histology',
  patientId: string,
  row: Record<string, unknown>
) {
  const cols = Object.keys(row).filter((k) => k !== 'patient_id');
  if (cols.length > 0) {
    const sets = cols.map((k, i) => `${k} = $${i + 2}`);
    const updated = await client.query(
      `update ${table} set ${sets.join(', ')} where patient_id = $1 returning patient_id`,
      [patientId, ...cols.map((k) => row[k])]
    );
    if (updated.rows.length > 0) return;
  }
  const insertCols = ['patient_id', ...cols];
  const placeholders = insertCols.map((_, i) => `$${i + 1}`);
  await client.query(
    `insert into ${table} (${insertCols.join(', ')}) values (${placeholders.join(', ')})`,
    [patientId, ...cols.map((k) => row[k])]
  );
}
