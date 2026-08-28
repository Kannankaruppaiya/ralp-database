import { requireAdmin } from '@/lib/api/require-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

const ROLES = [
  'Consultant Surgeon',
  'Surgical Registrar',
  'Clinical Nurse Specialist',
  'Data Manager',
  'Patient',
];
const SURGEON_CODES = ['VK', 'RDM', 'CI', 'OAK', 'OTHER'];
const MIN_PASSWORD = 12;

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
  if (surgeonCode && !SURGEON_CODES.includes(surgeonCode)) {
    return Response.json({ error: 'Choose a valid surgeon code.' }, { status: 422 });
  }
  if (typeof tempPassword !== 'string' || tempPassword.length < MIN_PASSWORD) {
    return Response.json(
      { error: `The temporary password must be at least ${MIN_PASSWORD} characters.` },
      { status: 422 }
    );
  }

  const admin = supabaseAdmin();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (error || !data?.user) {
    const already = /already/i.test(error?.message ?? '');
    return Response.json(
      { error: already ? 'That email already has an account.' : (error?.message ?? 'Could not create the account.') },
      { status: already ? 409 : 502 }
    );
  }

  // The signup trigger writes this row today. Upserting means the route still
  // finishes if that trigger is ever changed, rather than leaving a login with
  // no profile — the state that makes signIn fail with "No profile is
  // provisioned for this account."
  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: data.user.id,
      full_name: fullName.trim(),
      email,
      role,
      surgeon_code: surgeonCode || null,
      gmc_number: gmcNumber || null,
      must_change_password: true,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    // Don't leave a confirmed, password-set auth user with no profile row —
    // that's the exact state that makes sign-in fail with "No profile is
    // provisioned for this account", after the temp password is already
    // handed over. Best-effort: if the cleanup itself fails, don't swallow
    // that — surface the leftover account rather than going silent on it.
    const { error: cleanupError } = await admin.auth.admin.deleteUser(data.user.id);
    if (cleanupError) {
      console.error(
        `Orphaned auth user ${data.user.id} after profile write failure and cleanup failure:`,
        { profileError: profileError.message, cleanupError: cleanupError.message }
      );
    }
    return Response.json({ error: profileError.message }, { status: 502 });
  }

  const { error: auditError } = await admin.from('audit_log').insert({
    actor_id: gate.actor.id,
    actor_name: gate.actor.name,
    actor_role: gate.actor.role,
    gmc_number: gate.actor.gmcNumber,
    action: 'STAFF_PROVISIONED',
    details: `Created ${role} account for ${fullName.trim()} (${email})`,
  });
  if (auditError) {
    console.warn('audit write failed:', {
      actorId: gate.actor.id,
      createdUserId: data.user.id,
      error: auditError.message,
    });
  }

  return Response.json(
    { id: data.user.id, fullName: fullName.trim(), email, role },
    { status: 201 }
  );
}
