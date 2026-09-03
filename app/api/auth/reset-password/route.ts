import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resetPasswordWithToken } from '@/server/auth/reset';
import { writeAudit } from '@/server/services/audit.service';

// node:crypto (scrypt hashing) requires the Node.js runtime, not Edge.
export const runtime = 'nodejs';

const Body = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const userId = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!userId) {
    return NextResponse.json(
      { error: 'This reset link is invalid or has expired.' },
      { status: 400 }
    );
  }

  // The user proved control of the account by following the emailed link; the
  // reset itself is worth an audit row even though no session is minted here.
  await writeAudit(userId, 'PASSWORD_RESET', undefined, 'Password changed via self-service reset');

  return NextResponse.json({ ok: true });
}
