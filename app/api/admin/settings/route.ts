import { requireAdmin } from '@/lib/api/require-admin';
import { pool, withUser } from '@/server/db/pool';
import { writeAudit } from '@/server/services/audit.service';

export const runtime = 'nodejs';

export interface SystemSettings {
  trustName: string;
  hospitalPrefix: string;
  leadSurgeonCode: string;
  notifyApiKey: string;
  autoDispatchProms: boolean;
}

/** Deserialise the flat key-value rows into the typed settings object. */
function rowsToSettings(rows: { key: string; value: string }[]): SystemSettings {
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    trustName:         map['trust_name']          ?? 'Oxford University Hospitals NHS Foundation Trust',
    hospitalPrefix:    map['hospital_prefix']     ?? 'RALP-',
    leadSurgeonCode:   map['lead_surgeon_code']   ?? 'VK',
    notifyApiKey:      map['notify_api_key']      ?? '',
    autoDispatchProms: map['auto_dispatch_proms'] === 'true',
  };
}

// ------------------------------------------------------------------ GET
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { rows } = await pool.query('select key, value from system_settings');
  return Response.json(rowsToSettings(rows as { key: string; value: string }[]));
}

// ------------------------------------------------------------------ POST
export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const body: Partial<SystemSettings> = await request.json().catch(() => ({}));

  const upserts: { key: string; value: string }[] = [];
  if (body.trustName         !== undefined) upserts.push({ key: 'trust_name',          value: body.trustName });
  if (body.hospitalPrefix    !== undefined) upserts.push({ key: 'hospital_prefix',     value: body.hospitalPrefix });
  if (body.leadSurgeonCode   !== undefined) upserts.push({ key: 'lead_surgeon_code',   value: body.leadSurgeonCode });
  if (body.notifyApiKey      !== undefined) upserts.push({ key: 'notify_api_key',      value: body.notifyApiKey });
  if (body.autoDispatchProms !== undefined) upserts.push({ key: 'auto_dispatch_proms', value: body.autoDispatchProms ? 'true' : 'false' });

  if (upserts.length === 0) {
    return Response.json({ error: 'No recognised settings fields in request body.' }, { status: 422 });
  }

  // One privileged transaction, scoped to the admin so the row's updated_by is
  // theirs. system_settings' own RLS also restricts writes to Data Managers.
  await writeSettings(gate.actor.id, upserts);

  const changedKeys = upserts.map((u) => u.key).join(', ');
  await writeAudit(gate.actor.id, 'SETTINGS_UPDATED', undefined, `Updated system settings: ${changedKeys}`);

  return Response.json({ ok: true });
}

async function writeSettings(actorId: string, upserts: { key: string; value: string }[]): Promise<void> {
  await withUser(actorId, async (client) => {
    for (const u of upserts) {
      await client.query(
        `insert into system_settings (key, value, updated_at, updated_by)
           values ($1, $2, now(), $3)
         on conflict (key) do update
           set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by`,
        [u.key, u.value, actorId]
      );
    }
  });
}
