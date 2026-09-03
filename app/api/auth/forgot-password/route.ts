import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createResetToken } from '@/server/auth/reset';

// node:crypto (token generation) requires the Node.js runtime, not Edge.
export const runtime = 'nodejs';

const Body = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  // Even a malformed email resolves the same way — the endpoint never confirms
  // whether an address is registered or well-formed, so it cannot be probed.
  if (!parsed.success) return NextResponse.json({ ok: true });

  const token = await createResetToken(parsed.data.email);

  if (token) {
    const origin = new URL(request.url).origin;
    const resetUrl = `${origin}/update-password?token=${token}`;
    // Email delivery is not wired up in this deployment yet. Until it is, the
    // link is logged server-side so a reset can still be completed; the token
    // never travels back to the browser in production.
    console.info(`[password-reset] link for ${parsed.data.email}: ${resetUrl}`);
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ ok: true, devResetUrl: resetUrl });
    }
  }

  return NextResponse.json({ ok: true });
}
