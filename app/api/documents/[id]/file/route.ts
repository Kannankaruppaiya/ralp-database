import { NextResponse } from 'next/server';
import { requireUser } from '@/server/http/respond';
import { withUser } from '@/server/db/pool';
import { getDocumentForDownload } from '@/server/db/repositories/registry.repo';
import { getStorage } from '@/server/storage/storage';

export const runtime = 'nodejs';

/** Streams a stored document file, scoped to the caller by row level security. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const doc = await withUser(auth.userId, (client) => getDocumentForDownload(client, id));
  if (!doc || !doc.storage_path) {
    return NextResponse.json({ error: 'Document file not found.' }, { status: 404 });
  }

  const bytes = await getStorage().read(doc.storage_path);
  if (!bytes) return NextResponse.json({ error: 'Document file not found.' }, { status: 404 });

  const safeName = doc.title.replace(/["\\\r\n]/g, '_');
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': doc.mime_type ?? 'application/octet-stream',
      'Content-Disposition': `inline; filename="${safeName}"`,
      'Content-Length': String(bytes.length),
    },
  });
}
