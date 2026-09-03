import { NextResponse } from 'next/server';
import { requireUser } from '@/server/http/respond';
import { exportIdentifiable } from '@/server/services/exports.service';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ rows: await exportIdentifiable(auth.userId) });
}
