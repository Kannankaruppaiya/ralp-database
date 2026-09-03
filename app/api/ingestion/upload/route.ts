import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/server/http/respond';
import { ingestDocument, type IngestInput } from '@/server/services/ingest-document.service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await readJson<IngestInput>(request);
  if (!body?.title || !Array.isArray(body.fields)) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const result = await ingestDocument(auth.userId, {
    title: body.title,
    sourceType: body.sourceType ?? 'theatre_note',
    rawText: body.rawText ?? '',
    fields: body.fields,
  });
  return NextResponse.json(result);
}
