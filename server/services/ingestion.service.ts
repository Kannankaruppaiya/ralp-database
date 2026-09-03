import 'server-only';
import { withUser } from '@/server/db/pool';
import * as repo from '@/server/db/repositories/registry.repo';
import { toIngestionJob } from '@/lib/supabase/mappers';
import type { ClinicalDocument } from '@/types/document';
import type { IngestionJob } from '@/types/ingestion';

export async function getDocuments(userId: string, patientId: string): Promise<ClinicalDocument[]> {
  const rows = await withUser(userId, (c) => repo.listDocuments(c, patientId));
  return rows.map((r) => ({
    id: r.id,
    patientId: r.patient_id ?? undefined,
    title: r.title,
    docType:
      r.source_type === 'theatre_note'
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
  })) as ClinicalDocument[];
}

export async function getIngestionJobs(userId: string): Promise<IngestionJob[]> {
  const rows = await withUser(userId, (c) => repo.listIngestionJobs(c));
  return rows.map(toIngestionJob);
}

export async function saveIngestionJob(
  userId: string, job: Partial<IngestionJob> & { id?: string; documentId?: string }
): Promise<void> {
  await withUser(userId, (c) =>
    repo.saveIngestionJob(c, {
      id: job.id,
      documentId: job.documentId ?? null,
      matchedPatientId: job.matchedPatient?.patientId ?? null,
      matchScore: job.matchedPatient?.matchScore ?? null,
      matchReasons: job.matchedPatient?.matchReasons ?? null,
      status: job.status,
      conflictCount: job.conflictCount ?? 0,
      extractedFields: job.extractedFields ?? [],
    })
  );
}
