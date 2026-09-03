import 'server-only';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { withUser } from '@/server/db/pool';
import {
  matchCandidates, clinicalSections, insertDocument, saveIngestionJob,
} from '@/server/db/repositories/registry.repo';
import { writeAudit } from '@/server/db/repositories/clinical.repo';
import { getStorage } from '@/server/storage/storage';
import { stripNhs } from '@/lib/mappers';
import { extractIdentifiers } from '@/features/ingestion/extraction';
import type { ExtractedField } from '@/types/ingestion';

export interface IngestInput {
  title: string;
  sourceType: string;
  rawText: string;
  fields: ExtractedField[];
  /** The original file's bytes, stored in object storage. Optional. */
  fileBytes?: Buffer;
  fileSize?: number;
  mimeType?: string;
}

export interface IngestResult {
  matched: string | null;
  nameMismatch: boolean;
  fieldConflicts: number;
  fields: ExtractedField[];
}

/** Database columns are snake_case; extracted fields are keyed camelCase. */
function toCamel(row: Record<string, unknown> | null): Record<string, unknown> {
  if (!row) return {};
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v])
  );
}

/**
 * Deterministic identifier matching, field-level conflict detection, document
 * storage and ingestion-job creation — the logic previously done directly in the
 * browser, now server-side in one transaction. The document parsing itself
 * (reading the file, extracting fields) stays on the client, since it works on
 * the uploaded File; only the resulting fields and text arrive here.
 */
export async function ingestDocument(userId: string, input: IngestInput): Promise<IngestResult> {
  const { nhsNumber, hospitalNumber, surname } = extractIdentifiers(input.fields);

  // Store the original file bytes before recording the row, so storage_path
  // points at something real. An unlikely failure after this leaves an orphan
  // object, not a dangling database reference.
  let storagePath: string | null = null;
  if (input.fileBytes && input.fileBytes.length > 0) {
    storagePath = `${randomUUID()}${extname(input.title).toLowerCase()}`;
    await getStorage().save(storagePath, input.fileBytes);
  }

  return withUser(userId, async (client) => {
    let matchedPatientId: string | null = null;
    let matchedName: string | null = null;
    let nameMismatch = false;
    const reasons: string[] = [];

    if (nhsNumber || hospitalNumber) {
      const candidates = await matchCandidates(
        client, nhsNumber ? stripNhs(nhsNumber) : null, hospitalNumber ?? null
      );
      if (candidates.length === 1) {
        const c = candidates[0] as Record<string, string>;
        matchedPatientId = c.id;
        matchedName = `${c.first_name} ${c.surname}`;
        if (nhsNumber && stripNhs(nhsNumber) === c.nhs_number) reasons.push(`NHS number ${c.nhs_number}`);
        if (hospitalNumber && hospitalNumber === c.hospital_number) reasons.push(`MRN ${c.hospital_number}`);
        // The document surname never makes a match, only contradicts one.
        if (surname && surname.toLowerCase() !== String(c.surname).toLowerCase()) {
          nameMismatch = true;
          reasons.push(`NAME MISMATCH: document says "${surname}", record says "${c.surname}" — verify before committing`);
        }
      } else if (candidates.length > 1) {
        reasons.push('Identifiers matched more than one record — needs manual review');
      }
    }

    let fieldConflicts = 0;
    if (matchedPatientId) {
      const { op, base, hist } = await clinicalSections(client, matchedPatientId);
      const stored: Record<string, unknown> = { ...toCamel(base), ...toCamel(op), ...toCamel(hist) };
      input.fields.forEach((f) => {
        const current = stored[f.fieldKey];
        if (current === undefined || current === null) return;
        if (String(current) !== String(f.normalizedValue)) {
          f.hasConflict = true;
          f.status = 'conflicted';
          f.currentDbValue = current as ExtractedField['currentDbValue'];
          fieldConflicts += 1;
        }
      });
    }

    const documentId = await insertDocument(client, {
      patientId: matchedPatientId, title: input.title,
      sourceType: input.sourceType, rawText: input.rawText.slice(0, 200_000),
      storagePath, fileSize: input.fileSize ?? input.fileBytes?.length ?? null,
      mimeType: input.mimeType ?? null,
    });

    await saveIngestionJob(client, {
      documentId,
      matchedPatientId,
      matchScore: matchedPatientId ? (nameMismatch ? 50 : 100) : null,
      matchReasons: reasons.length ? reasons : null,
      status: nameMismatch || fieldConflicts > 0 ? 'conflicted' : 'review_required',
      conflictCount: (nameMismatch ? 1 : 0) + fieldConflicts,
      extractedFields: input.fields,
    });

    await writeAudit(
      client, 'DOCUMENT_INGESTED', matchedPatientId,
      `Parsed "${input.title}" — ${input.fields.length} fields extracted, ${matchedPatientId ? 'matched' : 'unmatched'}`
    );

    return { matched: matchedName, nameMismatch, fieldConflicts, fields: input.fields };
  });
}
