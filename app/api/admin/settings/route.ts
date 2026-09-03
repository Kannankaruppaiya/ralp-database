import { requireAdmin } from '@/lib/api/require-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('system_settings')
    .select('key, value');

  if (error) return Response.json({ error: error.message }, { status: 502 });
  return Response.json(rowsToSettings((data ?? []) as { key: string; value: string }[]));
}

// ------------------------------------------------------------------ POST
export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const body: Partial<SystemSettings> = await request.json().catch(() => ({}));

  const ALLOWED_KEYS = [
    'trust_name',
    'hospital_prefix',
    'lead_surgeon_code',
    'notify_api_key',
    'auto_dispatch_proms',
  ];

  // Build upsert rows from the camelCase payload
  const upserts: { key: string; value: string; updated_by: string }[] = [];

  if (body.trustName        !== undefined) upserts.push({ key: 'trust_name',          value: body.trustName,                        updated_by: gate.actor.id });
  if (body.hospitalPrefix   !== undefined) upserts.push({ key: 'hospital_prefix',     value: body.hospitalPrefix,                   updated_by: gate.actor.id });
  if (body.leadSurgeonCode  !== undefined) upserts.push({ key: 'lead_surgeon_code',   value: body.leadSurgeonCode,                  updated_by: gate.actor.id });
  if (body.notifyApiKey     !== undefined) upserts.push({ key: 'notify_api_key',      value: body.notifyApiKey,                     updated_by: gate.actor.id });
  if (body.autoDispatchProms !== undefined) upserts.push({ key: 'auto_dispatch_proms', value: body.autoDispatchProms ? 'true' : 'false', updated_by: gate.actor.id });

  if (upserts.length === 0) {
    return Response.json({ error: 'No recognised settings fields in request body.' }, { status: 422 });
  }

  const admin = supabaseAdmin();

  const { error } = await admin
    .from('system_settings')
    .upsert(upserts.map((u) => ({ ...u, updated_at: new Date().toISOString() })), { onConflict: 'key' });

  if (error) return Response.json({ error: error.message }, { status: 502 });

  // Audit trail — records which keys were changed and by whom
  const changedKeys = upserts.map((u) => u.key).join(', ');
  await admin.from('audit_log').insert({
    actor_id:   gate.actor.id,
    actor_name: gate.actor.name,
    actor_role: gate.actor.role,
    gmc_number: gate.actor.gmcNumber,
    action:     'SETTINGS_UPDATED',
    details:    `Updated system settings: ${changedKeys}`,
  });

  return Response.json({ ok: true });
}