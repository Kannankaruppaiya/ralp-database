import { describe, it, expect, vi, beforeEach } from 'vitest';

const getUser = vi.fn();
const maybeSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  supabaseServer: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));

const { requireAdmin } = await import('@/lib/api/require-admin');

describe('requireAdmin', () => {
  beforeEach(() => {
    getUser.mockReset();
    maybeSingle.mockReset();
  });

  it('rejects a request with no session', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const result = await requireAdmin();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it('rejects a signed-in user who is not a Data Manager', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    maybeSingle.mockResolvedValue({
      data: { id: 'u1', full_name: 'Mr V. Kannan', role: 'Consultant Surgeon', gmc_number: '1234567' },
    });

    const result = await requireAdmin();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it('admits a Data Manager and reports who they are', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
    maybeSingle.mockResolvedValue({
      data: { id: 'admin-1', full_name: 'Demo Administrator', role: 'Data Manager', gmc_number: null },
    });

    const result = await requireAdmin();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actor).toEqual({
        id: 'admin-1',
        name: 'Demo Administrator',
        role: 'Data Manager',
        gmcNumber: null,
      });
    }
  });

  it('rejects a session whose profile row is missing', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'ghost' } } });
    maybeSingle.mockResolvedValue({ data: null });

    const result = await requireAdmin();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it('reports a backend fault distinctly from an authorisation denial', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'connection timeout' } });

    const result = await requireAdmin();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).not.toBe(403);
      expect(result.response.status).toBe(502);
    }
  });
});
