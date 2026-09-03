import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/server/http/respond';
import { refreshFollowUpStatus } from '@/server/services/follow-ups.service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await readJson<{ patientId?: string }>(request);
  await refreshFollowUpStatus(auth.userId, body?.patientId);
  return NextResponse.json({ ok: true });
}
