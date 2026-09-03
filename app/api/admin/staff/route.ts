import { requireAdmin } from '@/lib/api/require-admin';
import { pool } from '@/server/db/pool';
import { provisionUser } from '@/server/auth/provision';
import { writeAudit } from '@/server/services/audit.service';
import { SURGEON_CODE_PATTERN, SURGEON_CODE_HINT } from '@/config/clinical-options';

export const runtime = 'nodejs';

const ROLES = [
  'Consultant Surgeon',
  'Surgical Registrar',
  'Clinical Nurse Specialist',
  'Data Manager',
  'Patient',
];
const MIN_PASSWORD = 12;

// ------------------------------------------------------------------ GET (list)
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  // The account's status lives on users; everything else on the profile.
  const { rows } = await pool.query(
    `select p.id, p.full_name, p.email, p.role, p.surgeon_code, p.gmc_number,
            p.hospital, p.created_at, p.deactivated_at
       from profiles p
       order by p.full_name`
  );

  return Response.json({ staff: rows });
}

// ------------------------------------------------------------------ POST (create)
export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: 'Send a JSON body.' }, { status: 422 });

  const { fullName, email, role, surgeonCode, gmcNumber, tempPassword } = body;

  if (typeof fullName !== 'string' || fullName.trim().length < 2) {
    return Response.json({ error: 'Enter the full name.' }, { status: 422 });
  }
  if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: 'Enter a valid email address.' }, { status: 422 });
  }
  if (!ROLES.includes(role)) {
    return Response.json({ error: 'Choose a valid role.' }, { status: 422 });
  }
  // Any well-formed code is accepted: provisioning the account is what puts a
  // surgeon on the roster, so a code cannot be required to exist beforehand.
  if (surgeonCode && !SURGEON_CODE_PATTERN.test(surgeonCode)) {
    return Response.json({ error: SURGEON_CODE_HINT }, { status: 422 });
  }
  if (typeof tempPassword !== 'string' || tempPassword.length < MIN_PASSWORD) {
    return Response.json(
      { error: `The temporary password must be at least ${MIN_PASSWORD} characters.` },
      { status: 422 }
    );
  }

  let userId: string;
  try {
    userId = await provisionUser({
      email,
      password: tempPassword,
      fullName: fullName.trim(),
      role,
      surgeonCode: surgeonCode || null,
      gmcNumber: gmcNumber || null,
      mustChangePassword: true,
    });
  } catch (err) {
    // unique_violation on the email — the account already exists.
    if ((err as { code?: string }).code === '23505') {
      return Response.json({ error: 'That email already has an account.' }, { status: 409 });
    }
    return Response.json(
      { error: (err as Error).message ?? 'Could not create the account.' },
      { status: 502 }
    );
  }

  await writeAudit(
    gate.actor.id,
    'STAFF_PROVISIONED',
    undefined,
    `Created ${role} account for ${fullName.trim()} (${email})`
  );

  return Response.json({ id: userId, fullName: fullName.trim(), email, role }, { status: 201 });
}
