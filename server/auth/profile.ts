import 'server-only';
import { pool } from '@/server/db/pool';

/**
 * The signed-in user's profile, shaped to match the client's `UserSession`
 * (see lib/auth.ts). Read straight from the profiles table by user id.
 */
export interface ServerUserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  surgeonCode?: string;
  gmcNumber?: string;
  hospital: string;
  patientId?: string;
}

export async function loadProfile(userId: string): Promise<ServerUserSession | null> {
  const { rows } = await pool.query(
    `select id, full_name, email, role, surgeon_code, gmc_number, hospital, patient_id
       from profiles where id = $1`,
    [userId]
  );
  const p = rows[0];
  if (!p) return null;
  return {
    id: p.id,
    name: p.full_name,
    email: p.email,
    role: p.role,
    surgeonCode: p.surgeon_code ?? undefined,
    gmcNumber: p.gmc_number ?? undefined,
    hospital: p.hospital,
    patientId: p.patient_id ?? undefined,
  };
}
