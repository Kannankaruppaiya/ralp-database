import { NextResponse } from 'next/server';
import { requireUser } from '@/server/http/respond';
import { getSurgeonBenchmark } from '@/server/services/outcomes.service';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ surgeons: await getSurgeonBenchmark(auth.userId) });
}
