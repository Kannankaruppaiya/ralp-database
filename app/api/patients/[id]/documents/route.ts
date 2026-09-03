import { NextResponse } from 'next/server';
import { requireUser } from '@/server/http/respond';
import { getDocuments } from '@/server/services/ingestion.service';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  return NextResponse.json({ documents: await getDocuments(auth.userId, id) });
}
