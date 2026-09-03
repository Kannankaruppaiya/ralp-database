import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/server/http/respond';
import { getAuditLogs, writeAudit } from '@/server/services/audit.service';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const raw = new URL(request.url).searchParams.get('limit');
  const limit = raw ? Math.min(Math.max(Number(raw) || 200, 1), 1000) : 200;

  const entries = await getAuditLogs(auth.userId, limit);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await readJson<{ action: string; patientId?: string; details?: string }>(request);
  if (!body?.action) return NextResponse.json({ error: 'action is required.' }, { status: 400 });

  await writeAudit(auth.userId, body.action, body.patientId, body.details);
  return NextResponse.json({ ok: true });
}
