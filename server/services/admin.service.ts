import 'server-only';
import { withUser } from '@/server/db/pool';

export interface StaffRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  surgeonCode: string;
  gmcNumber?: string;
  hospital: string;
  createdAt: string;
}

/** All provisioned staff profiles, for the admin console. */
export async function listStaff(userId: string): Promise<StaffRecord[]> {
  const rows = await withUser(userId, async (client) => {
    const res = await client.query('select * from profiles order by full_name');
    return res.rows;
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.full_name,
    email: r.email,
    role: r.role,
    surgeonCode: r.surgeon_code ?? '—',
    gmcNumber: r.gmc_number ?? undefined,
    hospital: r.hospital,
    createdAt: r.created_at,
  }));
}
