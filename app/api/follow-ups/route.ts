import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/server/http/respond';
import { getFollowUps, updateFollowUp } from '@/server/services/follow-ups.service';
import type { FollowUpRecord } from '@/types/follow-up';

export const runtime = 'nodejs';

const STATUSES = ['due', 'overdue', 'completed'] as const;
type Status = (typeof STATUSES)[number];

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const raw = new URL(request.url).searchParams.get('status');
  const status = STATUSES.includes(raw as Status) ? (raw as Status) : undefined;

  const items = await getFollowUps(auth.userId, status);
  return NextResponse.json({ items });
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await readJson<FollowUpRecord>(request);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  await updateFollowUp(auth.userId, body);
  return NextResponse.json({ ok: true });
}
