import { NextResponse } from 'next/server';
import { currentUserId } from '@/server/auth/session';
import { loadProfile } from '@/server/auth/profile';

export const runtime = 'nodejs';

/** The current session's profile, or { user: null } when not signed in. */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ user: null });
  return NextResponse.json({ user: await loadProfile(userId) });
}
