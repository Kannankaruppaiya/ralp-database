import { describe, it, expect, vi, beforeEach } from 'vitest';

const requireAdmin = vi.fn();
const createUser = vi.fn();
const deleteUser = vi.fn();
const upsert = vi.fn();
const insertAudit = vi.fn();

vi.mock('@/lib/api/require-admin', () => ({ requireAdmin }));
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: () => ({
    auth: { admin: { createUser, deleteUser } },
    from: (table: string) =>
      table === 'profiles' ? { upsert } : { insert: insertAudit },
  }),
}));

const { POST } = await import('@/app/api/admin/staff/route');

const admitted = {
  ok: true as const,
  actor: { id: 'admin-1', name: 'Demo Administrator', role: 'Data Manager', gmcNumber: null },
};

const body = (over: Record<string, unknown> = {}) =>
  new Request('http://test/api/admin/staff', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Mr R. D. MacDonagh',
      email: 'rdm@nhs.net',
      role: 'Consultant Surgeon',
      surgeonCode: 'RDM',
      tempPassword: 'ChangeMe-2026!',
      ...over,
    }),
  });

describe('POST /api/admin/staff', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    createUser.mockReset();
    deleteUser.mockReset().mockResolvedValue({ error: null });
    upsert.mockReset().mockResolvedValue({ error: null });
    insertAudit.mockReset().mockResolvedValue({ error: null });
  });

  it('passes the gate refusal straight through', async () => {
    requireAdmin.mockResolvedValue({ ok: false, response: Response.json({ error: 'no' }, { status: 403 }) });

    const res = await POST(body());

    expect(res.status).toBe(403);
    expect(createUser).not.toHaveBeenCalled();
  });

  // The roster used to be a fixed enum ('VK','RDM','CI','OAK','OTHER') in both
  // this route and the schema, so provisioning any other consultant failed with
  // "Choose a valid surgeon code" — the bug 0012 fixes. A code is now accepted
  // on its format alone, because creating the account is what puts it on the
  // roster.
  it('accepts a surgeon code that was not one of the five hardcoded ones', async () => {
    requireAdmin.mockResolvedValue(admitted);
    createUser.mockResolvedValue({ data: { user: { id: 'new-2' } }, error: null });

    const res = await POST(body({ surgeonCode: 'JD', email: 'jd@nhs.net' }));

    expect(res.status).toBe(201);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ surgeon_code: 'JD' }),
      expect.anything()
    );
  });

  it.each(['jd', 'J', 'J-D', 'TOOLONGCODE', 'JD '])(
    'rejects the malformed surgeon code %j',
    async (surgeonCode) => {
      requireAdmin.mockResolvedValue(admitted);

      const res = await POST(body({ surgeonCode }));

      expect(res.status).toBe(422);
      expect(createUser).not.toHaveBeenCalled();
    }
  );

  it('still allows a role that holds no surgeon code', async () => {
    requireAdmin.mockResolvedValue(admitted);
    createUser.mockResolvedValue({ data: { user: { id: 'new-3' } }, error: null });

    const res = await POST(body({ role: 'Data Manager', surgeonCode: '' }));

    expect(res.status).toBe(201);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ surgeon_code: null }),
      expect.anything()
    );
  });

  it('rejects a temporary password under 12 characters', async () => {
    requireAdmin.mockResolvedValue(admitted);

    const res = await POST(body({ tempPassword: 'short' }));

    expect(res.status).toBe(422);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('rejects a role outside the enum', async () => {
    requireAdmin.mockResolvedValue(admitted);

    const res = await POST(body({ role: 'Chief Wizard' }));

    expect(res.status).toBe(422);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('reports an already-registered email as a conflict', async () => {
    requireAdmin.mockResolvedValue(admitted);
    createUser.mockResolvedValue({ data: null, error: { message: 'User already registered' } });

    const res = await POST(body());

    expect(res.status).toBe(409);
  });

  it('creates the account, flags it, and never echoes the password', async () => {
    requireAdmin.mockResolvedValue(admitted);
    createUser.mockResolvedValue({ data: { user: { id: 'new-1' } }, error: null });

    const res = await POST(body());
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(createUser).toHaveBeenCalledWith({
      email: 'rdm@nhs.net',
      password: 'ChangeMe-2026!',
      email_confirm: true,
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'new-1', must_change_password: true, surgeon_code: 'RDM' }),
      { onConflict: 'id' }
    );
    expect(insertAudit).toHaveBeenCalled();
    expect(JSON.stringify(json)).not.toContain('ChangeMe-2026!');
  });

  it('records correct actor attribution and account details in the audit entry', async () => {
    requireAdmin.mockResolvedValue(admitted);
    createUser.mockResolvedValue({ data: { user: { id: 'new-1' } }, error: null });

    await POST(body());

    expect(insertAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: 'admin-1',
        actor_name: 'Demo Administrator',
        actor_role: 'Data Manager',
        gmc_number: null,
        action: 'STAFF_PROVISIONED',
        details: expect.stringContaining('rdm@nhs.net'),
      })
    );
  });

  it('deletes the just-created auth user when the profile write fails', async () => {
    requireAdmin.mockResolvedValue(admitted);
    createUser.mockResolvedValue({ data: { user: { id: 'new-1' } }, error: null });
    upsert.mockResolvedValue({ error: { message: 'profiles insert failed' } });

    const res = await POST(body());

    expect(res.status).toBe(502);
    expect(deleteUser).toHaveBeenCalledWith('new-1');
    expect(insertAudit).not.toHaveBeenCalled();
  });
});
