import { NextResponse } from 'next/server';
import { z } from 'zod';
import { signInPatient } from '@/server/auth/patient-login';
import { patientLoginThrottle } from '@/server/auth/throttle';
import { startSession } from '@/server/auth/session';
import { loadProfile } from '@/server/auth/profile';

// pg and the session cookie require the Node.js runtime, not Edge.
export const runtime = 'nodejs';

const Body = z.object({
  firstName: z.string().trim().min(1),
  surname: z.string().trim().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// One message for every failed sign-in, so the response never reveals which
// field was wrong nor whether a person is in the registry at all.
const GENERIC = 'We could not find your record. Please check your details or contact the clinic.';

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: Request) {
  const key = clientKey(request);
  if (patientLoginThrottle.blocked(key)) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait fifteen minutes and try again.' },
      { status: 429 }
    );
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    patientLoginThrottle.fail(key);
    return NextResponse.json({ error: GENERIC }, { status: 400 });
  }

  const result = await signInPatient(parsed.data);

  if (!result.ok && result.reason === 'ambiguous') {
    // Not a failed guess — a real person whose record we will not choose for
    // them. It does not count against the throttle.
    return NextResponse.json(
      {
        error:
          'More than one record matches those details. Please contact the clinic so we can identify you safely.',
      },
      { status: 409 }
    );
  }

  if (!result.ok) {
    patientLoginThrottle.fail(key);
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  const profile = await loadProfile(result.userId);
  if (!profile) {
    patientLoginThrottle.fail(key);
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  patientLoginThrottle.clear(key);
  await startSession(result.userId, profile.role);
  return NextResponse.json({ user: profile });
}
