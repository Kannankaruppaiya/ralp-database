import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/server/http/respond';
import { getIngestionJobs, saveIngestionJob } from '@/server/services/ingestion.service';
import type { IngestionJob } from '@/types/ingestion';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ jobs: await getIngestionJobs(auth.userId) });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await readJson<Partial<IngestionJob> & { id?: string; documentId?: string }>(request);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  await saveIngestionJob(auth.userId, body);
  return NextResponse.json({ ok: true });
}
