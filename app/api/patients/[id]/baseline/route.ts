import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/server/http/respond';
import { updateBaseline } from '@/server/services/patients.service';
import type { BaselineCancerData } from '@/types/cancer';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await readJson<Partial<BaselineCancerData>>(request);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  await updateBaseline(auth.userId, id, body);
  return NextResponse.json({ ok: true });
}
