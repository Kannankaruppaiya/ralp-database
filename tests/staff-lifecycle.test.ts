import { describe, it, expect, vi, beforeEach } from 'vitest';

const requireAdmin = vi.fn();
const updateUserById = vi.fn();
const deleteUser = vi.fn();
const update = vi.fn();
const insertAudit = vi.fn();

vi.mock('@/lib/api/require-admin', () => ({ requireAdmin }));
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: () => ({
    auth: { admin: { updateUserById, deleteUser } },
    from: (table: string) =>
      table === 'profiles'
        ? { update, delete: () => ({ eq: () => Promise.resolve({ error: null }) }) }
        : { insert: insertAudit, update },
  }),
}));

const { POST } = await import('@/app/api/admin/staff/[id]/status/route');
const { DELETE } = await import('@/app/api/admin/staff/[id]/route');

const admitted = {
  ok: true as const,
  actor: { id: 'admin-1', name: 'Demo Administrator', role: 'Data Manager', gmcNumber: null },
};

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const statusReq = (active: boolean) =>
  new Request('http://test', { method: 'POST', body: JSON.stringify({ active }) });

describe('account lifecycle routes', () => {
  beforeEach(() => {
    requireAdmin.mockReset().mockResolvedValue(admitted);
    updateUserById.mockReset().mockResolvedValue({ error: null });
    deleteUser.mockReset().mockResolvedValue({ error: null });
    update.mockReset().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    insertAudit.mockReset().mockResolvedValue({ error: null });
  });

  it('refuses to deactivate the caller', async () => {
    const res = await POST(statusReq(false), ctx('admin-1'));

    expect(res.status).toBe(409);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('refuses to delete the caller', async () => {
    const res = await DELETE(new Request('http://test', { method: 'DELETE' }), ctx('admin-1'));

    expect(res.status).toBe(409);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('passes the gate refusal through on status', async () => {
    requireAdmin.mockResolvedValue({ ok: false, response: Response.json({ error: 'no' }, { status: 401 }) });

    const res = await POST(statusReq(false), ctx('someone'));

    expect(res.status).toBe(401);
  });

  it('bans the auth user when deactivating', async () => {
    const res = await POST(statusReq(false), ctx('clinician-9'));

    expect(res.status).toBe(200);
    expect(updateUserById).toHaveBeenCalledWith(
      'clinician-9',
      expect.objectContaining({ ban_duration: expect.any(String) })
    );
  });

  it('lifts the ban when reactivating', async () => {
    const res = await POST(statusReq(true), ctx('clinician-9'));

    expect(res.status).toBe(200);
    expect(updateUserById).toHaveBeenCalledWith('clinician-9', { ban_duration: 'none' });
  });

  it('deletes the auth user and records the deletion', async () => {
    const res = await DELETE(new Request('http://test', { method: 'DELETE' }), ctx('clinician-9'));

    expect(res.status).toBe(200);
    expect(deleteUser).toHaveBeenCalledWith('clinician-9');
    expect(insertAudit).toHaveBeenCalled();
  });
});
