import { NextResponse } from 'next/server';
import { requireRole } from '@/server/http/respond';
import { listStaff } from '@/server/services/admin.service';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireRole(['Data Manager']);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ users: await listStaff(auth.userId) });
}
