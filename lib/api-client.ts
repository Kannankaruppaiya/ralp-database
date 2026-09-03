/**
 * RALP registry data access (client side).
 *
 * Every method calls our own API under /api, which runs the query server-side
 * with the caller's session and returns already-mapped domain objects. The
 * browser never holds a database key and never maps rows — row level security
 * and all business logic live behind the API. Method signatures are unchanged
 * from the previous Supabase-backed client, so nothing that calls `db` changes.
 */
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

export interface PatientQuery {
  search?: string;
  surgeon?: SurgeonCode | 'ALL';
  stage?: string | 'ALL';
  status?: string | 'ALL';
  page?: number;
  pageSize?: number;
}

/** Fetches JSON from our API, throwing the server's error message on failure. */
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export const db = {
  // ------------------------------------------------------------- patients

  async getPatients(q: PatientQuery = {}): Promise<{ patients: PatientFullRecord[]; total: number }> {
    const params = new URLSearchParams();
    if (q.search) params.set('search', q.search);
    if (q.surgeon) params.set('surgeon', q.surgeon);
    if (q.stage) params.set('stage', q.stage);
    if (q.status) params.set('status', q.status);
    if (q.page) params.set('page', String(q.page));
    if (q.pageSize) params.set('pageSize', String(q.pageSize));
    const qs = params.toString();
    return api(`/api/patients${qs ? `?${qs}` : ''}`);
  },

  async getPatientById(id: string): Promise<PatientFullRecord | null> {
    const res = await fetch(`/api/patients/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const { patient } = await res.json();
    return patient ?? null;
  },

  async createPatient(d: Partial<PatientDemographics>): Promise<PatientFullRecord> {
    const { patient } = await api<{ patient: PatientFullRecord }>('/api/patients', jsonInit('POST', d));
    return patient;
  },

  async updatePatient(id: string, d: Partial<PatientDemographics>): Promise<void> {
    await api(`/api/patients/${id}`, jsonInit('PATCH', d));
  },

  // ------------------------------------------------------------- clinical sections

  async updateBaseline(patientId: string, d: Partial<BaselineCancerData>): Promise<void> {
    await api(`/api/patients/${patientId}/baseline`, jsonInit('PATCH', d));
  },

  async updateOperation(patientId: string, d: Partial<OperationData>): Promise<void> {
    await api(`/api/patients/${patientId}/operation`, jsonInit('PATCH', d));
  },

  async updateHistology(patientId: string, d: Partial<HistologyData>): Promise<void> {
    await api(`/api/patients/${patientId}/histology`, jsonInit('PATCH', d));
  },

  // ------------------------------------------------------------- follow-ups

  async getFollowUps(status?: 'due' | 'overdue' | 'completed'): Promise<
    { followUp: FollowUpRecord; patient: PatientFullRecord }[]
  > {
    const qs = status ? `?status=${status}` : '';
    const { items } = await api<{ items: { followUp: FollowUpRecord; patient: PatientFullRecord }[] }>(
      `/api/follow-ups${qs}`
    );
    return items;
  },

  async updateFollowUp(_patientId: string, f: FollowUpRecord): Promise<void> {
    await api('/api/follow-ups', jsonInit('PATCH', f));
  },

  async refreshFollowUpStatus(patientId?: string): Promise<void> {
    await api('/api/follow-ups/refresh-status', jsonInit('POST', { patientId }));
  },

  // ------------------------------------------------------------- PROMs

  async addPromSubmission(_patientId: string, prom: PromSubmission): Promise<void> {
    await api(`/api/patients/${prom.patientId}/proms`, jsonInit('POST', prom));
  },

  // ------------------------------------------------------------- registry exports

  async exportPseudonymised(): Promise<Record<string, unknown>[]> {
    const { rows } = await api<{ rows: Record<string, unknown>[] }>('/api/exports/pseudonymised');
    return rows;
  },

  async exportIdentifiable(): Promise<Record<string, unknown>[]> {
    const { rows } = await api<{ rows: Record<string, unknown>[] }>('/api/exports/identifiable');
    return rows;
  },

  // ------------------------------------------------------------- outcomes

  async getRecoveryCurve(): Promise<RecoveryPoint[]> {
    const { points } = await api<{ points: RecoveryPoint[] }>('/api/outcomes/recovery-curve');
    return points;
  },

  async getSurgeonBenchmark(): Promise<SurgeonBenchmark[]> {
    const { surgeons } = await api<{ surgeons: SurgeonBenchmark[] }>('/api/outcomes/surgeon-benchmark');
    return surgeons;
  },

  async getRegistrySummary(): Promise<RegistrySummary | null> {
    const { summary } = await api<{ summary: RegistrySummary | null }>('/api/outcomes/summary');
    return summary;
  },

  // ------------------------------------------------------------- documents

  async getDocuments(patientId: string): Promise<ClinicalDocument[]> {
    const { documents } = await api<{ documents: ClinicalDocument[] }>(
      `/api/patients/${patientId}/documents`
    );
    return documents;
  },

  // ------------------------------------------------------------- ingestion

  async getIngestionJobs(): Promise<IngestionJob[]> {
    const { jobs } = await api<{ jobs: IngestionJob[] }>('/api/ingestion');
    return jobs;
  },

  async saveIngestionJob(job: Partial<IngestionJob> & { id?: string }): Promise<void> {
    await api('/api/ingestion', jsonInit('POST', job));
  },

  // ------------------------------------------------------------- audit trail

  async getAuditLogs(limit = 200): Promise<AuditLogEntry[]> {
    const { entries } = await api<{ entries: AuditLogEntry[] }>(`/api/audit?limit=${limit}`);
    return entries;
  },

  async audit(action: string, patientId?: string, details?: string): Promise<void> {
    // Best-effort, like before: a failed audit write must not break the action
    // that triggered it.
    try {
      await api('/api/audit', jsonInit('POST', { action, patientId, details }));
    } catch (err) {
      console.warn('audit write failed:', (err as Error).message);
    }
  },
};
