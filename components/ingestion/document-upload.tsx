'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle, RefreshCw, UploadCloud, CheckCircle2 } from 'lucide-react';
import { parseClinicalDocument } from '@/features/ingestion/extraction';
import { ExtractedField } from '@/types/ingestion';
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

      // The parsed fields and document text go to the API, which does the
      // identifier matching, field-level conflict detection, document storage,
      // ingestion-job creation and audit write server-side, and returns the
      // annotated result. A document that matches nothing is still stored — it
      // lands in the queue unmatched rather than attached to a guess.
      const res = await fetch('/api/ingestion/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: file.name, sourceType: docType, rawText, fields }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? 'Could not process that document.');
      const { matched, nameMismatch, fieldConflicts, fields: annotated } = body as {
        matched: string | null; nameMismatch: boolean; fieldConflicts: number; fields: ExtractedField[];
      };

      setPreview({ name: file.name, fields: annotated, matched, nameMismatch, fieldConflicts });
      toast({
        title: nameMismatch ? 'Identity conflict' : `${annotated.length} fields extracted`,
        description: nameMismatch
          ? `Identifiers matched ${matched}, but the document names a different patient. Verify before committing.`
          : matched
            ? `Matched to ${matched}. Review before committing.`
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
            ? 'border-teal-500 bg-teal-50/40'
            : 'border-slate-300 bg-slate-50/70 hover:border-teal-500 hover:bg-teal-50/20 dark:border-slate-800 dark:bg-slate-900/50'
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 shadow-sm dark:bg-teal-950 dark:text-teal-300">
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
                  ? 'border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200'
                  : 'border-slate-300 text-slate-600 hover:border-teal-400 dark:border-slate-700 dark:text-slate-400'
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
