/**
 * RALP registry data access.
 *
 * Every call goes to Postgres over PostgREST with the caller's own JWT, so row
 * level security decides what comes back — the browser is never trusted to
 * filter. Audit rows, follow-up schedules, grade groups and BCR flags are all
 * produced server-side (see supabase/migrations/0002_functions.sql); nothing
 * here recomputes them.
 */
import { supabase } from './supabase/client';
import {
  toPatient, toFollowUp, toAudit, toIngestionJob, stripNhs,
  fromBaseline, fromOperation, fromHistology, fromFollowUp, fromProm,
} from './supabase/mappers';
import { PatientFullRecord, PatientDemographics } from '@/types/patient';
import { BaselineCancerData } from '@/types/cancer';
import { OperationData } from '@/types/operation';
import { HistologyData } from '@/types/histology';
import { FollowUpRecord } from '@/types/follow-up';
import { PromSubmission } from '@/types/prom';
import { AuditLogEntry } from '@/types/audit';
import { IngestionJob } from '@/types/ingestion';
import { ClinicalDocument } from '@/types/document';
import { SurgeonCode } from '@/types/common';
import { RecoveryPoint, SurgeonBenchmark, RegistrySummary } from '@/types/outcomes';

const FULL_PATIENT =
  '*, baseline_cancer(*), operations(*), histology(*), follow_ups(*), prom_submissions(*)';
const LIST_PATIENT = '*, baseline_cancer(*), operations(*), histology(*), follow_ups(*)';

export interface PatientQuery {
  search?: string;
  surgeon?: SurgeonCode | 'ALL';
  stage?: string | 'ALL';
  status?: string | 'ALL';
  page?: number;
  pageSize?: number;
}

/** Throws on a Postgres/RLS error so callers surface it instead of rendering empty. */
function unwrap<T>(res: { data: unknown; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/**
 * Updates a patient's one-row clinical section, inserting it only if there is
 * not one yet.
 *
 * An upsert cannot do this. PostgREST compiles it to INSERT ... ON CONFLICT, so
 * a partial patch is validated as a fresh row first and fails on every NOT NULL
 * column it omits — `surgeon`, `operation_date`, `psa` — long before the
 * conflict clause would have turned it into an update. Reconciling a single
 * disputed field therefore failed outright.
 */
async function upsertSection(
  table: 'baseline_cancer' | 'operations' | 'histology',
  patientId: string,
  row: Record<string, unknown>
): Promise<void> {
  const { data: updated, error: updateError } = await supabase()
    .from(table)
    .update(row)
    .eq('patient_id', patientId)
    .select('patient_id');
  if (updateError) throw new Error(updateError.message);
  if (updated && updated.length > 0) return;

  const { error: insertError } = await supabase()
    .from(table)
    .insert({ ...row, patient_id: patientId });
  if (insertError) throw new Error(insertError.message);
}

export const db = {
  // ------------------------------------------------------------- patients

  async getPatients(q: PatientQuery = {}): Promise<{ patients: PatientFullRecord[]; total: number }> {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 25;

    let query = supabase()
      .from('patients')
      .select(LIST_PATIENT, { count: 'exact' })
      .order('surname');

    if (q.search && q.search.trim().length >= 2) {
      // PostgREST's or() grammar is delimited by , ( ) " and \ — strip them so a
      // search term cannot break out of the filter it is embedded in. Names and
      // both identifier formats survive this untouched.
      const term = q.search.trim().replace(/[,()"\\*%]/g, '');
      const digits = stripNhs(term);
      // search_text is a generated column holding name + both identifiers
      const clauses = [`search_text.ilike.%${term}%`];
      if (digits.length >= 3) clauses.push(`search_text.ilike.%${digits}%`);
      query = query.or(clauses.join(','));
    }
    if (q.surgeon && q.surgeon !== 'ALL') query = query.eq('primary_surgeon', q.surgeon);
    if (q.status && q.status !== 'ALL') query = query.eq('status', q.status);

    const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw new Error(error.message);

    let patients = ((data ?? []) as Record<string, any>[]).map(toPatient);
    // Stage spans two tables (clinical vs pathological) — narrowed after mapping
    if (q.stage && q.stage !== 'ALL') {
      patients = patients.filter(
        (p: PatientFullRecord) =>
          p.baseline?.clinicalStage === q.stage || p.histology?.pathologicalStage === q.stage
      );
    }

    return { patients, total: count ?? patients.length };
  },

  async getPatientById(id: string): Promise<PatientFullRecord | null> {
    const { data, error } = await supabase()
      .from('patients')
      .select(FULL_PATIENT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toPatient(data) : null;
  },

  async createPatient(d: Partial<PatientDemographics>): Promise<PatientFullRecord> {
    const row = unwrap<Record<string, any>>(
      await supabase()
        .from('patients')
        .insert({
          first_name: d.firstName,
          surname: d.surname,
          date_of_birth: d.dateOfBirth,
          nhs_number: stripNhs(d.nhsNumber ?? ''),
          hospital_number: d.hospitalNumber,
          phone: d.phone ?? null,
          email: d.email ?? null,
          address: d.address ?? null,
          postcode: d.postcode ?? null,
          primary_surgeon: d.primarySurgeon,
          other_surgeon_name: d.otherSurgeonName ?? null,
        })
        .select(FULL_PATIENT)
        .single()
    );
    await db.audit('PATIENT_CREATED', row.id, `Registered ${d.firstName} ${d.surname}`);
    return toPatient(row);
  },

  async updatePatient(id: string, d: Partial<PatientDemographics>): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (d.firstName !== undefined) patch.first_name = d.firstName;
    if (d.surname !== undefined) patch.surname = d.surname;
    if (d.dateOfBirth !== undefined) patch.date_of_birth = d.dateOfBirth;
    if (d.nhsNumber !== undefined) patch.nhs_number = stripNhs(d.nhsNumber);
    if (d.hospitalNumber !== undefined) patch.hospital_number = d.hospitalNumber;
    if (d.phone !== undefined) patch.phone = d.phone;
    if (d.email !== undefined) patch.email = d.email;
    if (d.address !== undefined) patch.address = d.address;
    if (d.postcode !== undefined) patch.postcode = d.postcode;
    if (d.primarySurgeon !== undefined) patch.primary_surgeon = d.primarySurgeon;

    const { error } = await supabase().from('patients').update(patch).eq('id', id);
    if (error) throw new Error(error.message);
    await db.audit('PATIENT_UPDATED', id, 'Demographics amended');
  },

  // ------------------------------------------------------------- clinical sections

  async updateBaseline(patientId: string, d: Partial<BaselineCancerData>): Promise<void> {
    await upsertSection('baseline_cancer', patientId, fromBaseline(patientId, d));
  },

  /** Saving an operation date also (re)builds the 7-milestone follow-up schedule. */
  async updateOperation(patientId: string, d: Partial<OperationData>): Promise<void> {
    await upsertSection('operations', patientId, fromOperation(patientId, d));
  },

  async updateHistology(patientId: string, d: Partial<HistologyData>): Promise<void> {
    await upsertSection('histology', patientId, fromHistology(patientId, d));
  },

  // ------------------------------------------------------------- follow-ups

  async getFollowUps(status?: 'due' | 'overdue' | 'completed'): Promise<
    { followUp: FollowUpRecord; patient: PatientFullRecord }[]
  > {
    let query = supabase()
      .from('follow_ups')
      .select(`*, patients!inner(${LIST_PATIENT})`)
      .order('due_date');
    if (status) query = query.eq('status', status);

    const rows = unwrap<Record<string, any>[]>(await query);
    return (rows ?? []).map((r) => ({
      followUp: toFollowUp(r),
      patient: toPatient(r.patients),
    }));
  },

  async updateFollowUp(_patientId: string, f: FollowUpRecord): Promise<void> {
    const { error } = await supabase()
      .from('follow_ups')
      .upsert(fromFollowUp(f), { onConflict: 'patient_id,milestone' });
    if (error) throw new Error(error.message);
  },

  /** Re-ages scheduled -> due -> overdue across the registry. */
  async refreshFollowUpStatus(patientId?: string): Promise<void> {
    const { error } = await supabase().rpc('refresh_follow_up_status', {
      p_patient: patientId ?? null,
    });
    if (error) throw new Error(error.message);
  },

  // ------------------------------------------------------------- PROMs
  // Insert only. A trigger closes the matching follow-up milestone.

  async addPromSubmission(_patientId: string, prom: PromSubmission): Promise<void> {
    const { error } = await supabase().from('prom_submissions').insert(fromProm(prom));
    if (error) throw new Error(error.message);
  },

  // ------------------------------------------------------------- registry exports
  // Two distinct products: one that carries no identifier, and one that does.
  // Selecting between them is the caller's explicit decision, and each is
  // audited under its own action.

  async exportPseudonymised(): Promise<Record<string, unknown>[]> {
    const rows = unwrap<Record<string, unknown>[]>(
      await supabase().from('registry_export_pseudonymised').select('*').order('pseudonym')
    );
    await db.audit('EXPORT_PSEUDONYMISED', undefined, `${rows?.length ?? 0} records, no identifiers`);
    return rows ?? [];
  },

  /**
   * Carries NHS number, hospital number, name and date of birth. Only for a
   * national submission under an agreed information-sharing basis — the
   * resulting file is identifiable patient data wherever it is saved.
   */
  async exportIdentifiable(): Promise<Record<string, unknown>[]> {
    const rows = unwrap<Record<string, unknown>[]>(
      await supabase().from('registry_export_identifiable').select('*').order('surname')
    );
    await db.audit(
      'EXPORT_IDENTIFIABLE',
      undefined,
      `${rows?.length ?? 0} records including NHS number, hospital number, name and date of birth`
    );
    return rows ?? [];
  },

  // ------------------------------------------------------------- outcomes
  // Computed by the database (supabase/migrations/0006_outcome_views.sql) so a
  // chart can never disagree with the records underneath it.

  async getRecoveryCurve(): Promise<RecoveryPoint[]> {
    const rows = unwrap<Record<string, any>[]>(
      await supabase().from('outcome_recovery_curve').select('*').order('target_months')
    );
    return (rows ?? []).map((r) => ({
      milestone: r.milestone,
      months: r.target_months,
      continenceN: r.continence_n,
      potencyN: r.potency_n,
      continentPct: r.continent_pct === null ? null : Number(r.continent_pct),
      potentPct: r.potent_pct === null ? null : Number(r.potent_pct),
      meanPsa: r.mean_psa === null ? null : Number(r.mean_psa),
      bcrCount: r.bcr_count,
    }));
  },

  async getSurgeonBenchmark(): Promise<SurgeonBenchmark[]> {
    const rows = unwrap<Record<string, any>[]>(
      await supabase().from('surgeon_benchmark').select('*')
    );
    return (rows ?? []).map((r) => ({
      surgeon: r.surgeon,
      caseload: r.caseload,
      continenceN: r.continence_n,
      continenceRate: r.continence_rate === null ? null : Number(r.continence_rate),
      potencyN: r.potency_n,
      potencyRate: r.potency_rate === null ? null : Number(r.potency_rate),
      histologyN: r.histology_n,
      marginPositiveRate: r.margin_positive_rate === null ? null : Number(r.margin_positive_rate),
    }));
  },

  async getRegistrySummary(): Promise<RegistrySummary | null> {
    const { data, error } = await supabase().from('registry_summary').select('*').maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const r = data as Record<string, any>;
    return {
      patients: r.patients,
      operations: r.operations,
      completedFollowUps: r.completed_follow_ups,
      overdueFollowUps: r.overdue_follow_ups,
      bcrEvents: r.bcr_events,
      marginPositiveRate: r.margin_positive_rate === null ? null : Number(r.margin_positive_rate),
    };
  },

  // ------------------------------------------------------------- documents

  async getDocuments(patientId: string): Promise<ClinicalDocument[]> {
    const rows = unwrap<Record<string, any>[]>(
      await supabase()
        .from('documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('uploaded_at', { ascending: false })
    );
    return (rows ?? []).map((r) => ({
      id: r.id,
      patientId: r.patient_id ?? undefined,
      title: r.title,
      docType: r.source_type === 'theatre_note'
        ? 'Theatre Operation Note'
        : r.source_type === 'clinic_letter'
          ? 'Clinic Follow-up Letter'
          : 'Other',
      fileSize: r.file_size ?? 0,
      mimeType: r.mime_type ?? 'application/octet-stream',
      uploadedAt: r.uploaded_at,
      uploadedBy: r.uploaded_by ?? 'Unknown',
      rawText: r.raw_text ?? undefined,
      parsedStatus: 'parsed',
    }));
  },

  // ------------------------------------------------------------- ingestion

  async getIngestionJobs(): Promise<IngestionJob[]> {
    const rows = unwrap<Record<string, any>[]>(
      await supabase()
        .from('ingestion_jobs')
        .select('*, documents(*), patients(id, first_name, surname, nhs_number, hospital_number, date_of_birth)')
        .order('created_at', { ascending: false })
    );
    return (rows ?? []).map(toIngestionJob);
  },

  async saveIngestionJob(job: Partial<IngestionJob> & { id?: string }): Promise<void> {
    const { error } = await supabase().from('ingestion_jobs').upsert({
      id: job.id,
      document_id: (job as Record<string, any>).documentId ?? null,
      matched_patient: job.matchedPatient?.patientId ?? null,
      match_score: job.matchedPatient?.matchScore ?? null,
      match_reasons: job.matchedPatient?.matchReasons ?? null,
      status: job.status,
      conflict_count: job.conflictCount ?? 0,
      extracted_fields: job.extractedFields ?? [],
    });
    if (error) throw new Error(error.message);
  },

  // ------------------------------------------------------------- audit trail

  async getAuditLogs(limit = 200): Promise<AuditLogEntry[]> {
    const rows = unwrap<Record<string, any>[]>(
      await supabase()
        .from('audit_log')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(limit)
    );
    return (rows ?? []).map(toAudit);
  },

  /**
   * Records an explicit action (a view, an export, an approval) that no table
   * trigger would catch. Actor identity is taken from the session inside the
   * function, so the caller cannot claim to be someone else.
   */
  async audit(action: string, patientId?: string, details?: string): Promise<void> {
    const { error } = await supabase().rpc('write_audit', {
      p_action: action,
      p_patient: patientId ?? null,
      p_details: details ?? null,
    });
    if (error) console.warn('audit write failed:', error.message);
  },
};
