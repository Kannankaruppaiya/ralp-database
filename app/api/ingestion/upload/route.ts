import { NextResponse } from 'next/server';
import { requireUser } from '@/server/http/respond';
import { ingestDocument, type IngestInput } from '@/server/services/ingest-document.service';

export const runtime = 'nodejs';

/**
 * Accepts multipart/form-data: the original file plus a `meta` JSON part
 * ({ title, sourceType, rawText, fields }). The file is parsed on the client
 * (it works on the File object); its bytes are stored here alongside the row.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data.' }, { status: 400 });
  }

  const metaRaw = form.get('meta');
  const file = form.get('file');
  let meta: Partial<IngestInput> | null = null;
  try {
    meta = typeof metaRaw === 'string' ? JSON.parse(metaRaw) : null;
  } catch {
    meta = null;
  }
  if (!meta?.title || !Array.isArray(meta.fields)) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  let fileBytes: Buffer | undefined;
  let fileSize: number | undefined;
  let mimeType: string | undefined;
  if (file && typeof file === 'object' && 'arrayBuffer' in file) {
    fileBytes = Buffer.from(await (file as File).arrayBuffer());
    fileSize = fileBytes.length;
    mimeType = (file as File).type || 'application/octet-stream';
  }

  const result = await ingestDocument(auth.userId, {
    title: meta.title,
    sourceType: meta.sourceType ?? 'theatre_note',
    rawText: meta.rawText ?? '',
    fields: meta.fields,
    fileBytes,
    fileSize,
    mimeType,
  });
  return NextResponse.json(result);
}
