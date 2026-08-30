'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle, RefreshCw, UploadCloud, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { db } from '@/lib/api-client';
import { parseClinicalDocument, extractIdentifiers } from '@/features/ingestion/extraction';
import { ExtractedField } from '@/types/ingestion';
import { stripNhs } from '@/lib/supabase/mappers';
import { useToast } from '@/hooks/use-toast';

type SourceType = 'theatre_note' | 'clinic_letter' | 'google_form_csv';

const ACCEPT = '.docx,.txt,.csv,.md';
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Reads the document's text.
 *
 * .docx is a zip and needs mammoth; it is imported lazily so the parser is not
 * in the bundle for anyone who never uploads one. Plain text formats are read
 * directly. .doc (the pre-2007 binary format) and scanned PDFs are not
 * supported — both need conversion or OCR first, and silently returning empty
 * text would look like a document with nothing in it.
 */
async function readDocumentText(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const buffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });
    return value;
  }
  if (/\.(txt|csv|md)$/i.test(file.name)) return file.text();
  throw new Error(
    `${file.name}: unsupported format. Upload .docx, .txt, .csv or .md — a .doc or scanned PDF must be converted first.`
  );
}

/** Database columns are snake_case; extracted fields are keyed camelCase. */
function toCamel(row: Record<string, unknown> | null): Record<string, unknown> {
  if (!row) return {};
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v])
  );
}

export function DocumentUpload() {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [docType, setDocType] = useState<SourceType>('theatre_note');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ name: string; fields: ExtractedField[]; matched: string | null; nameMismatch: boolean; fieldConflicts: number } | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setPreview(null);

    if (file.size > MAX_BYTES) {
      setError(`${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is 10 MB.`);
      return;
    }

    setIsProcessing(true);
    try {
      const rawText = await readDocumentText(file);
      const fields = parseClinicalDocument(rawText);

      if (fields.length === 0) {
        setError(
          `Nothing recognisable was found in ${file.name}. Check it is a theatre note or clinic letter in the unit's template.`
        );
        return;
      }

      // Deterministic matching on identifiers only. A document whose identifiers
      // match nothing is still stored — it lands in the queue unmatched rather
      // than being attached to a guess.
      const { nhsNumber, hospitalNumber, surname } = extractIdentifiers(fields);
      let matchedPatientId: string | null = null;
      let matchedName: string | null = null;
      let nameMismatch = false;
      const reasons: string[] = [];

      if (nhsNumber || hospitalNumber) {
        const filters = [
          nhsNumber ? `nhs_number.eq.${stripNhs(nhsNumber)}` : null,
          hospitalNumber ? `hospital_number.eq.${hospitalNumber}` : null,
        ].filter(Boolean) as string[];

        const { data: candidates } = await supabase()
          .from('patients')
          .select('id, first_name, surname, nhs_number, hospital_number')
          .or(filters.join(','))
          .limit(2);

        if (candidates?.length === 1) {
          const c = candidates[0] as Record<string, string>;
          matchedPatientId = c.id;
          matchedName = `${c.first_name} ${c.surname}`;
          if (nhsNumber && stripNhs(nhsNumber) === c.nhs_number) reasons.push(`NHS number ${c.nhs_number}`);
          if (hospitalNumber && hospitalNumber === c.hospital_number) reasons.push(`MRN ${c.hospital_number}`);

          // A mistyped identifier matches a real but wrong record, and nothing
          // else in the pipeline would catch it. The surname in the document is
          // never used to match, only to contradict a match.
          if (surname && surname.toLowerCase() !== String(c.surname).toLowerCase()) {
            nameMismatch = true;
            reasons.push(
              `NAME MISMATCH: document says "${surname}", record says "${c.surname}" — verify before committing`
            );
          }
        } else if ((candidates?.length ?? 0) > 1) {
          reasons.push('Identifiers matched more than one record — needs manual review');
        }
      }

      // Field-level conflicts: an extracted value that disagrees with what the
      // record already holds. Without this every field was reported as "no
      // conflict" no matter what it contradicted, and the reconciliation screen
      // had nothing real to show.
      let fieldConflicts = 0;
      if (matchedPatientId) {
        const [{ data: op }, { data: base }, { data: hist }] = await Promise.all([
          supabase().from('operations').select('*').eq('patient_id', matchedPatientId).maybeSingle(),
          supabase().from('baseline_cancer').select('*').eq('patient_id', matchedPatientId).maybeSingle(),
          supabase().from('histology').select('*').eq('patient_id', matchedPatientId).maybeSingle(),
        ]);

        const stored: Record<string, unknown> = {
          ...toCamel(base as Record<string, unknown> | null),
          ...toCamel(op as Record<string, unknown> | null),
          ...toCamel(hist as Record<string, unknown> | null),
        };

        fields.forEach((f) => {
          const current = stored[f.fieldKey];
          if (current === undefined || current === null) return;
          // Compare as text: the database returns numerics as strings.
          if (String(current) !== String(f.normalizedValue)) {
            f.hasConflict = true;
            f.status = 'conflicted';
            f.currentDbValue = current;
            fieldConflicts += 1;
          }
        });
      }

      // The document text is stored so a reviewer can check any field against
      // its source rather than trusting the extraction.
      const { data: doc, error: docError } = await supabase()
        .from('documents')
        .insert({
          patient_id: matchedPatientId,
          title: file.name,
          source_type: docType,
          raw_text: rawText.slice(0, 200_000),
        })
        .select('id')
        .single();
      if (docError) throw new Error(docError.message);

      const { error: jobError } = await supabase().from('ingestion_jobs').insert({
        document_id: (doc as { id: string }).id,
        matched_patient: matchedPatientId,
        match_score: matchedPatientId ? (nameMismatch ? 50 : 100) : null,
        match_reasons: reasons.length ? reasons : null,
        // A contradicted match must not sit in the ordinary review queue.
        status: nameMismatch || fieldConflicts > 0 ? 'conflicted' : 'review_required',
        conflict_count: (nameMismatch ? 1 : 0) + fieldConflicts,
        extracted_fields: fields,
      });
      if (jobError) throw new Error(jobError.message);

      await db.audit(
        'DOCUMENT_INGESTED',
        matchedPatientId ?? undefined,
        `Parsed "${file.name}" — ${fields.length} fields extracted, ${matchedPatientId ? 'matched' : 'unmatched'}`
      );

      setPreview({ name: file.name, fields, matched: matchedName, nameMismatch, fieldConflicts });
      toast({
        title: nameMismatch ? 'Identity conflict' : `${fields.length} fields extracted`,
        description: nameMismatch
          ? `Identifiers matched ${matchedName}, but the document names "${surname}". Verify before committing.`
          : matchedName
            ? `Matched to ${matchedName}. Review before committing.`
            : 'No patient matched — queued for manual identity matching.',
        variant: nameMismatch ? 'destructive' : 'success',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that document.');
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-6">
      <div
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50/40'
            : 'border-slate-300 bg-slate-50/70 hover:border-blue-500 hover:bg-blue-50/20 dark:border-slate-800 dark:bg-slate-900/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 shadow-sm dark:bg-blue-950 dark:text-blue-300">
          {isProcessing ? <RefreshCw className="h-7 w-7 animate-spin" /> : <UploadCloud className="h-7 w-7" />}
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {isProcessing ? 'Reading document…' : 'Drop a theatre note or clinic letter'}
        </h3>
        <p className="mx-auto mb-5 mt-1 max-w-md text-xs text-slate-500">
          Word (.docx), plain text or Google Form CSV export. Scanned PDFs and legacy .doc files
          must be converted first — nothing is read by OCR.
        </p>

        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          {([
            ['theatre_note', 'Theatre note'],
            ['clinic_letter', 'Clinic letter'],
            ['google_form_csv', 'Google Form export'],
          ] as [SourceType, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setDocType(value)}
              className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                docType === value
                  ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                  : 'border-slate-300 text-slate-600 hover:border-blue-400 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button size="sm" disabled={isProcessing} onClick={() => inputRef.current?.click()} className="gap-1.5">
          <FileText className="h-4 w-4" />
          <span>Choose file</span>
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {preview && (
        <Card className="shadow-sm">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{preview.name}</span>
            </CardTitle>
            <p className={`text-xs ${preview.nameMismatch ? 'font-semibold text-rose-600' : 'text-slate-500'}`}>
              {preview.nameMismatch
                ? `Identifiers matched ${preview.matched}, but the document names someone else — do not commit without verifying`
                : preview.matched
                  ? `Matched to ${preview.matched}`
                  : 'No patient matched — queued for identity matching'}
            </p>
          </CardHeader>
          <CardContent className="space-y-2 p-5 pt-2">
            <div className="flex flex-wrap gap-1.5">
              {preview.fields.map((f) => (
                <Badge key={f.id} variant="outline" className="text-[10px]">
                  {f.fieldLabel}: {String(f.normalizedValue)}
                </Badge>
              ))}
            </div>
            <Button size="sm" className="mt-2" onClick={() => router.push('/data-ingestion/extraction-review')}>
              Review &amp; commit
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
