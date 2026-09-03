import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/server/http/respond';
import { updateHistology } from '@/server/services/patients.service';
import type { HistologyData } from '@/types/histology';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await readJson<Partial<HistologyData>>(request);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  await updateHistology(auth.userId, id, body);
  return NextResponse.json({ ok: true });
}
