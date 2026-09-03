import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/server/http/respond';
import { updateOperation } from '@/server/services/patients.service';
import type { OperationData } from '@/types/operation';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await readJson<Partial<OperationData>>(request);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  await updateOperation(auth.userId, id, body);
  return NextResponse.json({ ok: true });
}
