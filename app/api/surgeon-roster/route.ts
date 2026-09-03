import { NextResponse } from 'next/server';
import { requireUser } from '@/server/http/respond';
import { withUser } from '@/server/db/pool';

export const runtime = 'nodejs';

/**
 * The pickable surgeon roster. surgeon_roster() is a security-definer function
 * (db/migrations/0015): it unions the codes held on profiles, patients and
 * operations so a newly provisioned consultant appears without a redeploy, and
 * a surgeon who has left keeps resolving in historical filters. Only the code
 * and display name cross that boundary — no patient data does.
 */
export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const rows = await withUser(auth.userId, (client) =>
    client.query('select code, full_name from surgeon_roster()')
  );

  const surgeons = rows.rows.map((r: { code: string; full_name: string }) => ({
    code: r.code,
    fullName: r.full_name,
  }));

  return NextResponse.json({ surgeons });
}
