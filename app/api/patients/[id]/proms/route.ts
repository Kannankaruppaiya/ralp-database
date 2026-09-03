import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/server/http/respond';
import { addPromSubmission } from '@/server/services/follow-ups.service';
import type { PromSubmission } from '@/types/prom';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await readJson<PromSubmission>(request);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  // The route's patient id is authoritative over any id in the body.
  await addPromSubmission(auth.userId, { ...body, patientId: id });
  return NextResponse.json({ ok: true }, { status: 201 });
}
