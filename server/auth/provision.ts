import 'server-only';
import { withUser } from '@/server/db/pool';
import { hashPassword } from './password';

/**
 * Creates a user account and its clinical profile in one transaction. This is
 * the replacement for Supabase's signup + handle_new_user trigger: an explicit,
 * admin-driven provisioning step. Runs on a privileged connection (row level
 * security for `profiles` is admin-only), which is how the admin API and the
 * seed scripts call it.
 */
export interface ProvisionInput {
  email: string;
  password: string;
  fullName: string;
  role: string;
  surgeonCode?: string | null;
  gmcNumber?: string | null;
  hospital?: string;
  patientId?: string | null;
  /** Hold the account at /change-password until the clinician sets their own. */
  mustChangePassword?: boolean;
}

export async function provisionUser(input: ProvisionInput): Promise<string> {
  const passwordHash = await hashPassword(input.password);
  return withUser(null, async (client) => {
    const { rows } = await client.query(
      'insert into users (email, password_hash) values (lower($1), $2) returning id',
      [input.email, passwordHash]
    );
    const id = rows[0].id as string;
    await client.query(
      `insert into profiles
         (id, full_name, email, role, surgeon_code, gmc_number, hospital, patient_id,
          must_change_password)
       values
         ($1, $2, lower($3), $4, $5, $6,
          coalesce($7, 'Oxford University Hospitals NHS FT'), $8, $9)`,
      [
        id, input.fullName, input.email, input.role,
        input.surgeonCode ?? null, input.gmcNumber ?? null,
        input.hospital ?? null, input.patientId ?? null,
        input.mustChangePassword ?? false,
      ]
    );
    return id;
  });
}
